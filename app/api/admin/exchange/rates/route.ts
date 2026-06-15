import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"
import { z } from "zod"

const schema = z.object({
  rmbToTzs: z.number().positive(),
  tzsToRmb: z.number().positive(),
})

export async function POST(req: Request) {
  const session = await auth()
  if (!session || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 })

  const rate = await db.exchangeRate.create({
    data: {
      rmbToTzs: parsed.data.rmbToTzs,
      tzsToRmb: parsed.data.tzsToRmb,
      updatedBy: session.user.id,
    },
  })

  await db.activityLog.create({
    data: {
      userId: session.user.id,
      action: "UPDATE_EXCHANGE_RATES",
      entityType: "ExchangeRate",
      entityId: rate.id,
      metadata: JSON.stringify(parsed.data),
    },
  })

  return NextResponse.json(rate)
}
