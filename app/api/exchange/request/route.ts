import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"
import { z } from "zod"

const schema = z.object({
  fullName: z.string().min(2),
  phone: z.string().min(10),
  email: z.string().email(),
  direction: z.enum(["RMB_TO_TZS", "TZS_TO_RMB"]),
  amount: z.number().positive(),
  notes: z.string().optional(),
})

export async function POST(req: Request) {
  try {
    const session = await auth()
    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 })

    const rate = await db.exchangeRate.findFirst({ orderBy: { updatedAt: "desc" } })
    const rateUsed = parsed.data.direction === "RMB_TO_TZS" ? rate?.rmbToTzs : rate?.tzsToRmb

    const request = await db.exchangeRequest.create({
      data: {
        ...parsed.data,
        currency: parsed.data.direction === "RMB_TO_TZS" ? "RMB" : "TZS",
        userId: session?.user?.id ?? undefined,
        rateUsed: rateUsed ?? undefined,
        convertedAmount: rateUsed ? parsed.data.amount * rateUsed : undefined,
      },
    })

    return NextResponse.json(request, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
