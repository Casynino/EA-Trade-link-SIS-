import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { NextResponse } from "next/server"
import { z } from "zod"
import { notifySubmission } from "@/lib/notifications"

const schema = z.object({
  opportunityId: z.string(),
  coverLetter:   z.string().min(10),
  gpa:           z.number().optional(),
  degreeLevel:   z.string().optional(),
  fieldOfStudy:  z.string().optional(),
  experience:    z.string().optional(),
})

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 })

  const opp = await db.opportunity.findUnique({ where: { id: parsed.data.opportunityId } })
  if (!opp) return NextResponse.json({ error: "Opportunity not found" }, { status: 404 })

  const existing = await db.application.findFirst({
    where: { userId: session.user.id, opportunityId: parsed.data.opportunityId },
  })
  if (existing) return NextResponse.json({ error: "Already applied" }, { status: 409 })

  const application = await db.application.create({
    data: {
      userId:        session.user.id,
      opportunityId: parsed.data.opportunityId,
      coverLetter:   parsed.data.coverLetter,
      gpa:           parsed.data.gpa,
      degreeLevel:   parsed.data.degreeLevel,
      fieldOfStudy:  parsed.data.fieldOfStudy,
      experience:    parsed.data.experience,
      status:        "SUBMITTED",
      submittedAt:   new Date(),
    },
  })

  await notifySubmission(session.user.id, opp.type, application.id)

  return NextResponse.json(application, { status: 201 })
}
