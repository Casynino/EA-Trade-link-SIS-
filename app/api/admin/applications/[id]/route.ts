import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { NextResponse } from "next/server"
import { notifyStatusChange, notifyPaymentConfirmed } from "@/lib/notifications"

async function findModel(id: string) {
  const app = await db.application.findUnique({ where: { id } })
  if (app) return { model: "application" as const, record: app, userId: app.userId }

  const visa = await db.visaApplication.findUnique({ where: { id } })
  if (visa) return { model: "visa" as const, record: visa, userId: visa.userId }

  const study = await db.studyApplication.findUnique({ where: { id } })
  if (study) return { model: "study" as const, record: study, userId: study.userId }

  const schol = await db.scholarshipApplication.findUnique({ where: { id } })
  if (schol) return { model: "scholarship" as const, record: schol, userId: schol.userId }

  return null
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = await db.user.findUnique({ where: { id: session.user.id } })
  if (!user || !["ADMIN", "SUPER_ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const { id } = await params
  const found = await findModel(id)
  if (!found) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({ model: found.model, record: found.record })
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = await db.user.findUnique({ where: { id: session.user.id } })
  if (!user || !["ADMIN", "SUPER_ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params
  const body = await req.json()
  const found = await findModel(id)
  if (!found) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const { model, record } = found
  const prevStatus = record.status
  const prevFeePaid = (record as any).feePaid ?? false

  // Build shared update fields
  const update: any = {}
  if (body.status)              update.status = body.status
  if (body.adminNotes != null)  update.adminNotes = body.adminNotes

  // SLA tracking
  if (body.status && prevStatus === "SUBMITTED" && body.status !== "SUBMITTED") {
    update.firstResponseAt = new Date()
  }

  let updated: any

  if (model === "application") {
    if (body.status && ["ACCEPTED", "APPROVED", "PAYMENT_PENDING", "PAYMENT_COMPLETED", "REJECTED", "COMPLETED"].includes(body.status)) {
      update.resolvedAt = new Date()
    }
    if (body.rejectionReason)           update.rejectionReason  = body.rejectionReason
    if (body.registrationFee != null)   update.registrationFee  = body.registrationFee
    if (body.processingFee != null)     update.processingFee    = body.processingFee
    if (body.admissionLetter != null)   update.admissionLetter  = body.admissionLetter
    if (body.offerLetter != null)       update.offerLetter      = body.offerLetter
    if (body.feePaid != null)           update.feePaid          = body.feePaid
    updated = await db.application.update({ where: { id }, data: update })

  } else if (model === "visa") {
    if (body.processingFee != null)     update.processingFee    = body.processingFee
    if (body.feePaid != null)           update.feePaid          = body.feePaid
    updated = await db.visaApplication.update({ where: { id }, data: update })

  } else if (model === "study") {
    updated = await db.studyApplication.update({ where: { id }, data: update })

  } else if (model === "scholarship") {
    // scholarship_applications only has status, notes, adminNotes
    const scholUpdate: any = {}
    if (body.status)             scholUpdate.status     = body.status
    if (body.adminNotes != null) scholUpdate.adminNotes = body.adminNotes
    updated = await db.scholarshipApplication.update({ where: { id }, data: scholUpdate })
  }

  // Notifications
  if (body.status && body.status !== prevStatus) {
    await notifyStatusChange(found.userId, body.status, id)
  }
  if (body.feePaid === true && !prevFeePaid) {
    await notifyPaymentConfirmed(found.userId, id)
  }

  return NextResponse.json(updated)
}
