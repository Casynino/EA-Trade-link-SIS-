import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

function parseScholarship(row: Record<string, unknown>) {
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

function deriveFinancials(financials: Record<string, unknown>) {
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

async function syncToOpportunity(id: string, body: Record<string, unknown>) {
  const financials = (body.financials as Record<string, unknown>) ?? {}
  const { tuitionCovered, livingAllowance, flightTicket } = deriveFinancials(financials)
  const tags = (body.tags as string[] ?? []).filter(Boolean)
  const location = [body.city, body.country ?? "China"].filter(Boolean).join(", ")
  const isActiveVal   = body.isActive  === false || body.isActive  === 0 ? false : true
  const isFeaturedVal = body.isFeatured === true  || body.isFeatured === 1 ? true  : false

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

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const rows = await db.$queryRaw<Record<string, unknown>[]>`
    SELECT * FROM scholarships WHERE id = ${id} LIMIT 1
  `
  if (!rows.length) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(parseScholarship(rows[0]))
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json()

  // Toggle-only (isActive / isFeatured from admin table buttons)
  if (Object.keys(body).length <= 2 && ("isActive" in body || "isFeatured" in body)) {
    if ("isActive" in body) {
      await db.$executeRaw`UPDATE scholarships SET isActive = ${body.isActive ? 1 : 0}, updatedAt = datetime('now') WHERE id = ${id}`
      await db.opportunity.updateMany({ where: { id }, data: { isActive: !!body.isActive } })
    }
    if ("isFeatured" in body) {
      await db.$executeRaw`UPDATE scholarships SET isFeatured = ${body.isFeatured ? 1 : 0}, updatedAt = datetime('now') WHERE id = ${id}`
      await db.opportunity.updateMany({ where: { id }, data: { isFeatured: !!body.isFeatured } })
    }
    return NextResponse.json({ ok: true })
  }

  // Full update from edit form
  await db.$executeRaw`
    UPDATE scholarships SET
      title                    = ${body.title},
      level                    = ${body.level},
      country                  = ${body.country ?? "China"},
      city                     = ${body.city},
      intake                   = ${body.intake},
      duration                 = ${body.duration},
      language                 = ${body.language},
      ageRange                 = ${body.ageRange},
      overview                 = ${body.overview},
      majorsJson               = ${JSON.stringify(body.majors ?? [])},
      financialsJson           = ${JSON.stringify(body.financials ?? {})},
      requirementsJson         = ${JSON.stringify(body.requirements ?? {})},
      applicationHighlightsJson = ${JSON.stringify(body.applicationHighlights ?? [])},
      admissionProcessJson     = ${JSON.stringify(body.admissionProcess ?? [])},
      tagsJson                 = ${JSON.stringify(body.tags ?? [])},
      slots                    = ${body.slots ?? null},
      isActive                 = ${body.isActive ? 1 : 0},
      isFeatured               = ${body.isFeatured ? 1 : 0},
      sortOrder                = ${body.sortOrder ?? 0},
      updatedAt                = datetime('now')
    WHERE id = ${id}
  `

  // Sync update to Opportunity table
  await syncToOpportunity(id, { ...body, id })

  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  // Delete from Scholarship table
  await db.$executeRaw`DELETE FROM scholarships WHERE id = ${id}`

  // Also remove from Opportunity table (cascades to student pages & home)
  await db.opportunity.deleteMany({ where: { id } })

  return NextResponse.json({ ok: true })
}
