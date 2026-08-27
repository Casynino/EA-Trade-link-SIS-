import { db } from "@/lib/db"
import { requireAdminApi } from "@/lib/role-guard"
import { NextResponse } from "next/server"
import { z } from "zod"

const schema = z.object({
  rmbToTzs: z.number().positive(),
  tzsToRmb: z.number().positive(),
})

export async function POST(req: Request) {
  const admin = await requireAdminApi()
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 })

  const rate = await db.exchangeRate.create({
    data: {
      rmbToTzs: parsed.data.rmbToTzs,
      tzsToRmb: parsed.data.tzsToRmb,
      updatedBy: admin.id,
    },
  })

  await db.activityLog.create({
    data: {
      userId: admin.id,
      action: "UPDATE_EXCHANGE_RATES",
      entityType: "ExchangeRate",
      entityId: rate.id,
      metadata: JSON.stringify(parsed.data),
    },
  })

  return NextResponse.json(rate)
}
