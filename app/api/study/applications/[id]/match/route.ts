import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

/**
 * Admin matches a general study application (Flow A) to a published opportunity.
 *
 * The student only sees the matched opportunity's full details once the
 * application status reaches MATCHED / ACCEPTED — never before.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const admin = await db.user.findUnique({ where: { id: session.user.id } })
  if (!admin || !["ADMIN", "SUPER_ADMIN"].includes(admin.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))
  const { opportunityId, status, registrationFee, processingFee, adminNotes } = body

  const app = await db.studyApplication.findUnique({ where: { id } })
  if (!app) return NextResponse.json({ error: "Application not found" }, { status: 404 })

  // Validate the opportunity exists when one is being assigned
  if (opportunityId) {
    const opp = await db.opportunity.findUnique({ where: { id: opportunityId } })
    if (!opp) return NextResponse.json({ error: "Opportunity not found" }, { status: 404 })
  }

  const data: any = { updatedAt: new Date() }

  if (opportunityId !== undefined) {
    data.matchedOpportunityId = opportunityId || null
    data.matchedAt = opportunityId ? new Date() : null
  }
  if (status) data.status = status
  if (adminNotes !== undefined) data.adminNotes = adminNotes

  // Fees are OPTIONAL — an opportunity may be free. They are only ever set by an
  // admin, and the student's payment UI is gated on approval status (see below).
  if (registrationFee !== undefined) {
    data.registrationFee = registrationFee === null || registrationFee === "" ? null : Number(registrationFee)
  }
  if (processingFee !== undefined) {
    data.processingFee = processingFee === null || processingFee === "" ? null : Number(processingFee)
  }

  // Record first admin response for the SLA clock
  if (!app.firstResponseAt) data.firstResponseAt = new Date()

  const updated = await db.studyApplication.update({
    where: { id },
    data,
    include: { matchedOpportunity: true },
  })

  return NextResponse.json({ success: true, application: updated })
}
