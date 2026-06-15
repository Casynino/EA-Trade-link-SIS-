import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = await db.user.findUnique({ where: { id: session.user.id } })
  if (!user || !["ADMIN", "SUPER_ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json()
  const {
    type, title, organization, location, description, requirements, benefits,
    deadline, startDate, imageUrl, targetAudience, isFeatured, createdBy,
    degreeLevel, fieldOfStudy, minGpa, coverageType, tuitionCovered, livingAllowance, flightTicket, slots,
    jobType, salary, contractDuration,
    eventDates, venue, registrationFee,
    visitDuration, groupSizeMax,
    requiredDocuments, applicationFields, financialModel,
  } = body

  if (!type || !title || !organization || !description) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  const opp = await db.opportunity.create({
    data: {
      type, title, organization,
      location: location ?? "China",
      description,
      requirements: requirements ?? null,
      benefits: benefits ?? null,
      deadline: deadline ? new Date(deadline) : null,
      startDate: startDate ? new Date(startDate) : null,
      imageUrl: imageUrl ?? null,
      targetAudience:    targetAudience    ?? "[]",
      requiredDocuments: requiredDocuments ?? "[]",
      applicationFields: applicationFields ?? "[]",
      financialModel:    financialModel    ?? "{}",
      isFeatured: isFeatured ?? false,
      createdBy: createdBy ?? null,
      degreeLevel, fieldOfStudy,
      minGpa: minGpa ?? null,
      coverageType,
      tuitionCovered: tuitionCovered ?? false,
      livingAllowance: livingAllowance ?? false,
      flightTicket: flightTicket ?? false,
      slots: slots ?? null,
      jobType, salary, contractDuration,
      eventDates, venue, registrationFee,
      visitDuration,
      groupSizeMax: groupSizeMax ?? null,
    },
  })

  return NextResponse.json(opp, { status: 201 })
}
