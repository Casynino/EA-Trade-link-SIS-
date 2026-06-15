import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { scholarshipId } = await req.json()
  if (!scholarshipId) return NextResponse.json({ error: "scholarshipId required" }, { status: 400 })

  const rows = await db.$queryRaw<{ id: string }[]>`
    SELECT id FROM scholarships WHERE id = ${scholarshipId} AND isActive = 1 LIMIT 1
  `
  if (!rows.length) return NextResponse.json({ error: "Scholarship not found" }, { status: 404 })

  const id = `sapp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

  try {
    await db.$executeRaw`
      INSERT INTO scholarship_applications (id, userId, scholarshipId, status)
      VALUES (${id}, ${session.user.id}, ${scholarshipId}, 'APPLIED')
      ON CONFLICT(userId, scholarshipId) DO UPDATE SET status = 'APPLIED', updatedAt = datetime('now')
    `
    return NextResponse.json({ ok: true, id })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const rows = await db.$queryRaw<{ scholarshipId: string; status: string }[]>`
    SELECT scholarshipId, status FROM scholarship_applications WHERE userId = ${session.user.id}
  `
  return NextResponse.json(rows)
}
