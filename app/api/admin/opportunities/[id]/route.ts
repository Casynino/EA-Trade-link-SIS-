import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"

async function requireAdmin() {
  const session = await auth()
  if (!session?.user?.id) return null
  const user = await db.user.findUnique({ where: { id: session.user.id } })
  if (!user || !["ADMIN", "SUPER_ADMIN"].includes(user.role)) return null
  return user
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { id } = await params
  const body = await req.json()

  const opp = await db.opportunity.update({
    where: { id },
    data: {
      ...body,
      deadline:  body.deadline  ? new Date(body.deadline)  : undefined,
      startDate: body.startDate ? new Date(body.startDate) : undefined,
    },
  })

  return NextResponse.json(opp)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { id } = await params

  // Cascade-delete related records manually (no onDelete:Cascade in schema)
  const apps = await db.application.findMany({ where: { opportunityId: id }, select: { id: true } })
  const appIds = apps.map(a => a.id)

  if (appIds.length > 0) {
    await db.document.deleteMany({ where: { applicationId: { in: appIds } } })
    await db.message.deleteMany({ where: { applicationId: { in: appIds } } })
    await db.payment.deleteMany({ where: { applicationId: { in: appIds } } })
    await db.notification.deleteMany({ where: { link: { contains: appIds[0] } } }) // best-effort
    await db.application.deleteMany({ where: { opportunityId: id } })
  }

  await db.opportunity.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}

// POST /api/admin/opportunities/[id] → duplicate
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { id } = await params
  const src = await db.opportunity.findUnique({ where: { id } })
  if (!src) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = src
  const copy = await db.opportunity.create({
    data: { ...rest, title: `${rest.title} (copy)`, isActive: false, isFeatured: false },
  })

  return NextResponse.json(copy, { status: 201 })
}
