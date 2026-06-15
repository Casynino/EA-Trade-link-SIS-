import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { getDeposit } from "@/lib/ntzs"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { paymentId } = await params

    const payment = await db.payment.findFirst({
      where: { id: paymentId, userId: session.user.id },
    })

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 })
    }

    // If our DB already shows completed/failed, return immediately
    if (payment.status !== "PENDING") {
      return NextResponse.json({
        status: payment.status,
        amount: payment.amount,
        paidAt: payment.paidAt,
      })
    }

    // DB still shows PENDING — poll NTZS directly so we don't depend on webhooks
    if (payment.ntzsDepositId) {
      try {
        const deposit = await getDeposit(payment.ntzsDepositId)
        const ntzsStatus = deposit.status?.toLowerCase()

        if (ntzsStatus === "completed" || ntzsStatus === "successful" || ntzsStatus === "success") {
          const now = new Date()

          // Mark payment completed in DB
          await db.payment.update({
            where: { id: payment.id },
            data: { status: "COMPLETED", paidAt: now },
          })

          // Mark application as paid and advance to PROCESSING
          const { applicationId, applicationType } = payment
          if (applicationId && applicationType) {
            if (applicationType === "application") {
              await db.application.updateMany({
                where: { id: applicationId },
                data: { feePaid: true, status: "PROCESSING", resolvedAt: now },
              })
            } else if (applicationType === "visa") {
              await db.visaApplication.updateMany({
                where: { id: applicationId },
                data: { feePaid: true, status: "PROCESSING" },
              })
            } else if (applicationType === "study") {
              await db.studyApplication.updateMany({
                where: { id: applicationId },
                data: { feePaid: true, status: "PROCESSING" },
              })
            }

            // Notify the user
            await db.notification.create({
              data: {
                userId: payment.userId,
                type: "STATUS_CHANGE",
                title: "Payment Confirmed",
                message: `Your payment of TZS ${payment.amount.toLocaleString()} has been received. Your application is now being processed.`,
                link: `/dashboard/applications/${applicationId}`,
              },
            }).catch(() => {}) // non-critical
          }

          return NextResponse.json({ status: "COMPLETED", amount: payment.amount, paidAt: now })
        }

        if (ntzsStatus === "failed" || ntzsStatus === "expired" || ntzsStatus === "cancelled") {
          await db.payment.update({
            where: { id: payment.id },
            data: { status: "FAILED" },
          })
          return NextResponse.json({ status: "FAILED", amount: payment.amount })
        }
      } catch {
        // NTZS unreachable — return DB status and keep polling
      }
    }

    return NextResponse.json({
      status: payment.status,
      amount: payment.amount,
      paidAt: payment.paidAt,
    })
  } catch (err) {
    console.error("Payment status check error:", err)
    return NextResponse.json({ error: "Failed to check payment status" }, { status: 500 })
  }
}
