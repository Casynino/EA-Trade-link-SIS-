import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { verifyNtzsWebhook } from "@/lib/ntzs"

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const timestamp = req.headers.get("x-webhook-timestamp") ?? ""
  const signature = req.headers.get("x-webhook-signature") ?? ""

  // Verify signature — reject if invalid
  if (!verifyNtzsWebhook(rawBody, timestamp, signature)) {
    console.warn("NTZS webhook: invalid signature")
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
  }

  let event: { type: string; data: any }
  try {
    event = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  try {
    if (event.type === "deposit.completed") {
      await handleDepositCompleted(event.data)
    }
    // transfer.completed and withdrawal.completed not needed for this flow
  } catch (err) {
    console.error("NTZS webhook handler error:", err)
    // Return 200 to prevent NTZS from retrying — we'll log and investigate separately
    return NextResponse.json({ received: true, error: "Internal handler error" })
  }

  return NextResponse.json({ received: true })
}

async function handleDepositCompleted(data: {
  id: string
  amount: number
  metadata?: {
    applicationId?: string
    applicationType?: string
    userId?: string
  }
}) {
  const depositId = data.id

  // Find our payment record
  const payment = await db.payment.findUnique({ where: { ntzsDepositId: depositId } })
  if (!payment) {
    console.warn(`NTZS webhook: no payment found for deposit ${depositId}`)
    return
  }

  if (payment.status === "COMPLETED") {
    // Already processed (idempotent)
    return
  }

  const now = new Date()

  // Mark payment as completed
  await db.payment.update({
    where: { id: payment.id },
    data: { status: "COMPLETED", paidAt: now },
  })

  // Mark the application as fee paid and advance status to PROCESSING
  const { applicationId, applicationType } = payment
  if (!applicationId || !applicationType) return

  if (applicationType === "application") {
    await db.application.updateMany({
      where: { id: applicationId },
      data: {
        feePaid: true,
        status: "PROCESSING",
        resolvedAt: now,
      },
    })
  } else if (applicationType === "visa") {
    await db.visaApplication.updateMany({
      where: { id: applicationId },
      data: {
        feePaid: true,
        status: "PROCESSING",
      },
    })
  } else if (applicationType === "study") {
    await db.studyApplication.updateMany({
      where: { id: applicationId },
      data: {
        feePaid: true,
        status: "PROCESSING",
      },
    })
  }

  // Create a notification for the user
  if (payment.userId) {
    await db.notification.create({
      data: {
        userId: payment.userId,
        type: "STATUS_CHANGE",
        title: "Payment Confirmed",
        message: `Your payment of TZS ${payment.amount.toLocaleString()} has been received. Your application is now being processed.`,
        link: `/dashboard/applications/${applicationId}`,
      },
    })
  }

  console.log(`NTZS deposit ${depositId} confirmed — payment ${payment.id} marked COMPLETED, application ${applicationId} set to PROCESSING`)
}
