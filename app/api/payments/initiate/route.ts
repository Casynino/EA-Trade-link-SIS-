import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { createDeposit, createOrGetNtzsUser, getDeposit, normalizeTanzaniaPhone, NtzsApiError } from "@/lib/ntzs"

// Cached platform user ID — only one NTZS user is ever created for this platform
let _cachedPlatformUserId: string | null = null

async function getPlatformUserId(): Promise<string> {
  if (_cachedPlatformUserId) return _cachedPlatformUserId

  // Explicit env override takes priority
  if (process.env.NTZS_PLATFORM_USER_ID) {
    _cachedPlatformUserId = process.env.NTZS_PLATFORM_USER_ID
    return _cachedPlatformUserId
  }

  // Use the first admin's real email so NTZS accepts the account creation.
  // Only ONE user is ever created (fixed externalId = idempotent).
  const admin = await db.user.findFirst({
    where: { role: { in: ["SUPER_ADMIN", "ADMIN"] } },
    orderBy: { createdAt: "asc" },
    select: { email: true, name: true, phone: true },
  })

  const email = admin?.email ?? process.env.NTZS_PLATFORM_EMAIL
  if (!email) {
    throw new Error("No admin email found. Set NTZS_PLATFORM_EMAIL or NTZS_PLATFORM_USER_ID in Vercel env vars.")
  }

  const ntzsUser = await createOrGetNtzsUser({
    externalId: "ea-trade-link-platform",
    email,
    name: admin?.name ?? "EA Trade Link",
    phone: admin?.phone ?? undefined,
  })

  if (!ntzsUser?.id) {
    throw new Error(`NTZS user creation returned no ID. Response: ${JSON.stringify(ntzsUser)}`)
  }

  _cachedPlatformUserId = ntzsUser.id
  return ntzsUser.id
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { applicationId, applicationType, amount, method, provider, phone } = body

    if (!applicationId || !applicationType || !amount || !method) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (amount < 500) {
      return NextResponse.json({ error: "Minimum payment amount is TZS 500" }, { status: 400 })
    }

    if (method === "mobile_money" && (!provider || !phone)) {
      return NextResponse.json({ error: "Provider and phone are required for mobile money" }, { status: 400 })
    }

    const userId = session.user.id

    // Verify the application belongs to this user and has an unpaid fee
    const appCheck = await verifyApplication(applicationId, applicationType, userId, amount)
    if (!appCheck.ok) {
      return NextResponse.json({ error: appCheck.error }, { status: 400 })
    }

    // Check for an existing PENDING payment for this application.
    // If the NTZS deposit has since expired/failed, we clear it and create a fresh one.
    const existing = await db.payment.findFirst({
      where: { applicationId, applicationType, userId, status: "PENDING" },
    })

    if (existing?.ntzsDepositId) {
      try {
        const deposit = await getDeposit(existing.ntzsDepositId)
        const ntzsStatus = deposit.status?.toLowerCase()

        if (ntzsStatus === "completed" || ntzsStatus === "successful" || ntzsStatus === "success" || ntzsStatus === "minted") {
          // Already paid — mark complete and return so the modal shows success
          await db.payment.update({ where: { id: existing.id }, data: { status: "COMPLETED", paidAt: new Date() } })
          return NextResponse.json({ paymentId: existing.id, depositId: existing.ntzsDepositId, status: "COMPLETED" })
        }

        if (ntzsStatus === "submitted" || ntzsStatus === "pending") {
          // Still waiting for user to confirm on phone — resume polling
          return NextResponse.json({
            paymentId: existing.id,
            depositId: existing.ntzsDepositId,
            status: existing.status,
            cardUrl: existing.cardUrl,
            resumed: true,
          })
        }

        // expired / failed / cancelled → mark it failed and fall through to create new payment
        await db.payment.update({ where: { id: existing.id }, data: { status: "FAILED" } })
      } catch {
        // Can't reach NTZS to verify — resume the existing payment for polling
        return NextResponse.json({
          paymentId: existing.id,
          depositId: existing.ntzsDepositId,
          status: existing.status,
          cardUrl: existing.cardUrl,
          resumed: true,
        })
      }
    } else if (existing) {
      // Pending payment with no depositId — shouldn't happen, but clean it up
      await db.payment.update({ where: { id: existing.id }, data: { status: "FAILED" } })
    }

    const normalizedPhone = phone ? normalizeTanzaniaPhone(phone) : undefined

    // Get or lazy-create the single EA Trade Link platform user in nTZS.
    // Only ONE nTZS user is ever created (fixed externalId). Funds go to treasury.
    const ntzsPlatformUserId = await getPlatformUserId()

    // Create the deposit — payer receives a USSD prompt, funds go to treasury
    const deposit = await createDeposit({
      ntzsUserId:        ntzsPlatformUserId,
      amountTzs:         amount,
      paymentMethod:     method,
      provider:          provider || undefined,
      phoneNumber:       normalizedPhone,
      collectToTreasury: true,
      metadata: {
        applicationId,
        applicationType,
        userId,
        platform: "ea-trade-link",
      },
    })

    // Store payment record in DB
    const payment = await db.payment.create({
      data: {
        userId,
        applicationId,
        applicationType,
        amount,
        method,
        provider: provider || null,
        phone: normalizedPhone || null,
        ntzsDepositId: deposit.id,
        cardUrl: deposit.paymentUrl || null,
        status: "PENDING",
        description: `${applicationType} application fee`,
      },
    })

    return NextResponse.json({
      paymentId: payment.id,
      depositId: deposit.id,
      status: deposit.status,
      cardUrl: deposit.paymentUrl || null,
    })
  } catch (err) {
    if (err instanceof NtzsApiError) {
      console.error("NTZS API error:", err.message, err.status, err.code)
      return NextResponse.json(
        { error: err.message || "Payment provider error. Please try again." },
        { status: 502 }
      )
    }
    console.error("Payment initiate error:", err)
    return NextResponse.json({ error: "Failed to initiate payment. Please try again." }, { status: 500 })
  }
}

// Verify the application exists, belongs to user, has fees, and isn't already paid
async function verifyApplication(
  applicationId: string,
  applicationType: string,
  userId: string,
  amount: number
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (applicationType === "application") {
    const app = await db.application.findFirst({ where: { id: applicationId, userId } })
    if (!app) return { ok: false, error: "Application not found" }
    if (app.feePaid) return { ok: false, error: "This application has already been paid" }
    const total = (app.registrationFee ?? 0) + (app.processingFee ?? 0)
    if (total <= 0) return { ok: false, error: "No payment required for this application" }
  } else if (applicationType === "visa") {
    const app = await db.visaApplication.findFirst({ where: { id: applicationId, userId } })
    if (!app) return { ok: false, error: "Application not found" }
    if (app.feePaid) return { ok: false, error: "This application has already been paid" }
    if (!app.processingFee || app.processingFee <= 0) return { ok: false, error: "No payment required" }
  } else if (applicationType === "study") {
    const app = await db.studyApplication.findFirst({ where: { id: applicationId, userId } })
    if (!app) return { ok: false, error: "Application not found" }
    if (app.feePaid) return { ok: false, error: "This application has already been paid" }
    const total = (app.registrationFee ?? 0) + (app.processingFee ?? 0)
    if (total <= 0) return { ok: false, error: "No payment required for this application" }
  } else {
    return { ok: false, error: "Invalid application type" }
  }

  return { ok: true }
}
