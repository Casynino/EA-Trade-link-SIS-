import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { createDeposit, normalizeTanzaniaPhone, NtzsApiError } from "@/lib/ntzs"

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

    // Verify the application belongs to this user and has an unpaid fee
    const userId = session.user.id
    const appCheck = await verifyApplication(applicationId, applicationType, userId, amount)
    if (!appCheck.ok) {
      return NextResponse.json({ error: appCheck.error }, { status: 400 })
    }

    // Check for existing pending payment for this application
    const existing = await db.payment.findFirst({
      where: { applicationId, applicationType, userId, status: "PENDING" },
    })
    if (existing) {
      // Return existing pending payment so UI can resume polling
      return NextResponse.json({
        paymentId: existing.id,
        depositId: existing.ntzsDepositId,
        status: existing.status,
        cardUrl: existing.cardUrl,
        resumed: true,
      })
    }

    const normalizedPhone = phone ? normalizeTanzaniaPhone(phone) : undefined

    // Use EA Trade Link's own nTZS platform user ID (treasury wallet owner).
    // Funds collected with collectToTreasury:true go directly to this wallet.
    const ntzsPlatformUserId = process.env.NTZS_PLATFORM_USER_ID
    if (!ntzsPlatformUserId) {
      console.error("NTZS_PLATFORM_USER_ID env var not set")
      return NextResponse.json({ error: "Payment system not configured" }, { status: 503 })
    }

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
      console.error("NTZS API error:", err.message, err.code)
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
