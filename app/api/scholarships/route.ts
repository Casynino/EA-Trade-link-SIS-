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
// Handles both the old flat string format and the new rich object format
function deriveFinancials(financials: Record<string, unknown>) {
  // ── New rich format: tuition is an object ──────────────────────────────────
  if (financials.tuition !== null && typeof financials.tuition === "object") {
    const t    = financials.tuition    as Record<string, unknown>
    const a    = financials.accommodation as Record<string, unknown> | undefined
    const s    = financials.stipend    as Record<string, unknown> | undefined
    const add  = financials.additionalSupport as Record<string, unknown> | undefined
    return {
      tuitionCovered:  !!t.covered,
      livingAllowance: !!(s?.enabled) || (!!(a?.enabled) && a?.coverage !== "NOT_COVERED"),
      flightTicket:    !!(add?.flightTicket),
    }
  }

  // ── Legacy flat string format ──────────────────────────────────────────────
  const tuition = String(financials.tuition ?? "").toLowerCase()
  const stipend  = String(financials.stipend  ?? "").toLowerCase()
  const accom    = String(financials.accommodation ?? "").toLowerCase()
  const noteStr  = ((financials.notes as string[] | undefined) ?? []).join(" ").toLowerCase()

  const covered = (s: string) =>
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
  const tags = (body.tags as string[] ?? []).filter(Boolean)
  const location = [body.city, body.country ?? "China"].filter(Boolean).join(", ")

  const isActiveVal  = body.isActive  === false || body.isActive  === 0 ? false : true
  const isFeaturedVal= body.isFeatured === true  || body.isFeatured === 1 ? true  : false

  const shared = {
    type:          "SCHOLARSHIP",
    title:         String(body.title ?? ""),
    organization:  "EA Trade Link",
    location,
    description:   String(body.overview ?? ""),
    degreeLevel:   String(body.level ?? ""),
    slots:         body.slots ? Number(body.slots) : null,
    isActive:      isActiveVal,
    isFeatured:    isFeaturedVal,
    targetAudience: JSON.stringify(["STUDENT", "ALL"]),
    tags:          JSON.stringify(tags),
    tuitionCovered,
    livingAllowance,
    flightTicket,
    updatedAt:     new Date(),
  }

  await db.opportunity.upsert({
    where:  { id },
    create: { id, ...shared, createdAt: new Date() },
    update: shared,
  })
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const level    = searchParams.get("level")
  const city     = searchParams.get("city")
  const major    = searchParams.get("major")

  const rows = await db.$queryRaw<Record<string, unknown>[]>`
    SELECT * FROM scholarships
    WHERE isActive = 1
    ORDER BY isFeatured DESC, sortOrder ASC, createdAt DESC
  `

  let results = rows.map(parseScholarship)
  if (level && level !== "ALL") results = results.filter((s) => s.level === level)
  if (city  && city  !== "ALL") results = results.filter((s) => (s as Record<string,unknown>).city === city)
  if (major) {
    const q = major.toLowerCase()
    results = results.filter((s) =>
      (s.majors as string[]).some((m) => m.toLowerCase().includes(q))
    )
  }

  return NextResponse.json(results)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json()
  const id = body.id || `sch_${Date.now()}`

  // 1. Write rich data to Scholarship table
  await db.$executeRaw`
    INSERT OR REPLACE INTO scholarships
    (id, title, level, country, city, intake, duration, language, ageRange, overview,
     majorsJson, financialsJson, requirementsJson, applicationHighlightsJson, admissionProcessJson, tagsJson,
     slots, isActive, isFeatured, sortOrder, updatedAt)
    VALUES (
      ${id}, ${body.title}, ${body.level}, ${body.country ?? "China"}, ${body.city},
      ${body.intake}, ${body.duration}, ${body.language}, ${body.ageRange}, ${body.overview},
      ${JSON.stringify(body.majors ?? [])}, ${JSON.stringify(body.financials ?? {})},
      ${JSON.stringify(body.requirements ?? {})}, ${JSON.stringify(body.applicationHighlights ?? [])},
      ${JSON.stringify(body.admissionProcess ?? [])}, ${JSON.stringify(body.tags ?? [])},
      ${body.slots ?? null}, ${body.isActive ?? 1}, ${body.isFeatured ?? 0}, ${body.sortOrder ?? 0},
      datetime('now')
    )
  `

  // 2. Sync to Opportunity table so it appears on home page and student dashboard
  await syncToOpportunity(id, { ...body, id })

  return NextResponse.json({ id }, { status: 201 })
}

// PUT /api/scholarships — one-time bulk sync all existing scholarships → Opportunity table
export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const rows = await db.$queryRaw<Record<string, unknown>[]>`SELECT * FROM scholarships`
  const parsed = rows.map(parseScholarship)
  let synced = 0, errors = 0

  for (const s of parsed) {
    try {
      await syncToOpportunity(s.id as string, s as Record<string, unknown>)
      synced++
    } catch (e) {
      console.error("Sync error for", s.id, e)
      errors++
    }
  }

  return NextResponse.json({ synced, errors, total: rows.length })
}
