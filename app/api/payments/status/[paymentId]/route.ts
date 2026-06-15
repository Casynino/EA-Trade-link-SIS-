import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

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
