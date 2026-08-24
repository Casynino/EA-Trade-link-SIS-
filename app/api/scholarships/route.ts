import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

function parseScholarship(row: Record<string, unknown>): Record<string, unknown> {
  return {
    ...row,
    majors: JSON.parse((row.majorsJson as string) || "[]"),
    financials: JSON.parse((row.financialsJson as string) || "{}"),
    requirements: JSON.parse((row.requirementsJson as string) || "{}"),
    applicationHighlights: JSON.parse((row.applicationHighlightsJson as string) || "[]"),
    admissionProcess: JSON.parse((row.admissionProcessJson as string) || "[]"),
    tags: JSON.parse((row.tagsJson as string) || "[]"),
  }
}

// Derive Opportunity boolean benefit fields from scholarship financials
function deriveFinancials(financials: Record<string, unknown>) {
  if (financials.tuition !== null && typeof financials.tuition === "object") {
    const t   = financials.tuition          as Record<string, unknown>
    const a   = financials.accommodation    as Record<string, unknown> | undefined
    const s   = financials.stipend          as Record<string, unknown> | undefined
    const add = financials.additionalSupport as Record<string, unknown> | undefined
    return {
      tuitionCovered:  !!t.covered,
      livingAllowance: !!(s?.enabled) || (!!(a?.enabled) && a?.coverage !== "NOT_COVERED"),
      flightTicket:    !!(add?.flightTicket),
    }
  }

  const tuition = String(financials.tuition ?? "").toLowerCase()
  const stipend  = String(financials.stipend  ?? "").toLowerCase()
  const accom    = String(financials.accommodation ?? "").toLowerCase()
  const noteStr  = ((financials.notes as string[] | undefined) ?? []).join(" ").toLowerCase()
  const covered  = (s: string) =>
    s.includes("covered") || s.includes("free") || s.includes("provided") || s.includes("fully")

  return {
    tuitionCovered:  covered(tuition) || covered(noteStr),
    livingAllowance: !!financials.stipend || covered(stipend) || covered(accom),
    flightTicket:    noteStr.includes("flight") || noteStr.includes("airfare"),
  }
}

// Sync a Scholarship → Opportunity so it appears on home page & student pages
async function syncToOpportunity(id: string, body: Record<string, unknown>) {
  const financials = (body.financials as Record<string, unknown>) ?? {}
  const { tuitionCovered, livingAllowance, flightTicket } = deriveFinancials(financials)
  const tags     = (body.tags as string[] ?? []).filter(Boolean)
  const location = [body.city, body.country ?? "China"].filter(Boolean).join(", ")
  const isActiveVal   = body.isActive  !== false
  const isFeaturedVal = body.isFeatured === true

  const shared = {
    type:           "SCHOLARSHIP",
    title:          String(body.title ?? ""),
    organization:   "EA Trade Link",
    location,
    description:    String(body.overview ?? ""),
    degreeLevel:    String(body.level ?? ""),
    slots:          body.slots ? Number(body.slots) : null,
    imageUrl:       (body.imageUrl as string) || null,
    isActive:       isActiveVal,
    isFeatured:     isFeaturedVal,
    targetAudience: JSON.stringify(["STUDENT", "ALL"]),
    tags:           JSON.stringify(tags),
    tuitionCovered,
    livingAllowance,
    flightTicket,
    updatedAt:      new Date(),
  }

  await db.opportunity.upsert({
    where:  { id },
    create: { id, ...shared, createdAt: new Date() },
    update: shared,
  })
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const level = searchParams.get("level")
  const city  = searchParams.get("city")
  const major = searchParams.get("major")

  const rows = await db.scholarship.findMany({
    where:   { isActive: true },
    orderBy: [{ isFeatured: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
  })

  let results = rows.map(r => parseScholarship(r as unknown as Record<string, unknown>))
  if (level && level !== "ALL") results = results.filter(s => s.level === level)
  if (city  && city  !== "ALL") results = results.filter(s => s.city  === city)
  if (major) {
    const q = major.toLowerCase()
    results = results.filter(s => (s.majors as string[]).some(m => m.toLowerCase().includes(q)))
  }

  return NextResponse.json(results)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json()

  // Use Prisma upsert — works on both SQLite and PostgreSQL
  const scholarship = await db.scholarship.upsert({
    where:  { id: body.id || "__new__" },
    create: {
      title:                    String(body.title ?? ""),
      level:                    String(body.level ?? "BACHELOR"),
      country:                  String(body.country ?? "China"),
      city:                     String(body.city ?? ""),
      intake:                   String(body.intake ?? ""),
      duration:                 String(body.duration ?? ""),
      language:                 String(body.language ?? ""),
      ageRange:                 String(body.ageRange ?? ""),
      overview:                 String(body.overview ?? ""),
      majorsJson:               JSON.stringify(body.majors ?? []),
      financialsJson:           JSON.stringify(body.financials ?? {}),
      requirementsJson:         JSON.stringify(body.requirements ?? {}),
      applicationHighlightsJson: JSON.stringify(body.applicationHighlights ?? []),
      admissionProcessJson:     JSON.stringify(body.admissionProcess ?? []),
      tagsJson:                 JSON.stringify(body.tags ?? []),
      slots:                    body.slots ? Number(body.slots) : null,
      imageUrl:                 (body.imageUrl as string) || null,
      isActive:                 body.isActive !== false,
      isFeatured:               body.isFeatured === true,
      sortOrder:                Number(body.sortOrder ?? 0),
    },
    update: {
      title:                    String(body.title ?? ""),
      level:                    String(body.level ?? "BACHELOR"),
      country:                  String(body.country ?? "China"),
      city:                     String(body.city ?? ""),
      intake:                   String(body.intake ?? ""),
      duration:                 String(body.duration ?? ""),
      language:                 String(body.language ?? ""),
      ageRange:                 String(body.ageRange ?? ""),
      overview:                 String(body.overview ?? ""),
      majorsJson:               JSON.stringify(body.majors ?? []),
      financialsJson:           JSON.stringify(body.financials ?? {}),
      requirementsJson:         JSON.stringify(body.requirements ?? {}),
      applicationHighlightsJson: JSON.stringify(body.applicationHighlights ?? []),
      admissionProcessJson:     JSON.stringify(body.admissionProcess ?? []),
      tagsJson:                 JSON.stringify(body.tags ?? []),
      slots:                    body.slots ? Number(body.slots) : null,
      imageUrl:                 (body.imageUrl as string) || null,
      isActive:                 body.isActive !== false,
      isFeatured:               body.isFeatured === true,
      sortOrder:                Number(body.sortOrder ?? 0),
    },
  })

  // Sync to Opportunity table so it appears on home page and student dashboard
  await syncToOpportunity(scholarship.id, { ...body, id: scholarship.id })

  return NextResponse.json({ id: scholarship.id }, { status: 201 })
}

// PUT /api/scholarships — bulk sync all scholarships → Opportunity table
export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const rows = await db.scholarship.findMany()
  let synced = 0, errors = 0

  for (const s of rows) {
    try {
      const parsed = parseScholarship(s as unknown as Record<string, unknown>)
      await syncToOpportunity(s.id, parsed)
      synced++
    } catch (e) {
      console.error("Sync error for", s.id, e)
      errors++
    }
  }

  return NextResponse.json({ synced, errors, total: rows.length })
}
