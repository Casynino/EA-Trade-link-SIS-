import { db } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET() {
  const rate = await db.exchangeRate.findFirst({ orderBy: { updatedAt: "desc" } })
  return NextResponse.json(rate ?? { rmbToTzs: 390.5, tzsToRmb: 0.00256 })
}
