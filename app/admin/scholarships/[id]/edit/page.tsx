import { auth } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { db } from "@/lib/db"
import { ScholarshipForm } from "../../scholarship-form"
import type { ScholarshipData } from "@/types/scholarship"

export const dynamic = "force-dynamic"

export default async function EditScholarshipPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const session = await auth()
  if (!session?.user) redirect("/login")
  const user = await db.user.findUnique({ where: { id: session.user.id } })
  if (!user || !["ADMIN", "SUPER_ADMIN"].includes(user.role)) redirect("/dashboard")

  const sch = await db.scholarship.findUnique({ where: { id } })
  if (!sch) notFound()

  // Parse JSON fields back into objects for the form
  const initialData: Partial<ScholarshipData> & { dbId?: string } = {
    dbId:                 sch.id,
    id:                   sch.id,
    title:                sch.title,
    level:                sch.level as ScholarshipData["level"],
    country:              sch.country,
    city:                 sch.city,
    intake:               sch.intake,
    duration:             sch.duration,
    language:             sch.language,
    ageRange:             sch.ageRange,
    overview:             sch.overview,
    slots:                sch.slots ?? undefined,
    isFeatured:           sch.isFeatured,
    sortOrder:            sch.sortOrder,
    imageUrl:             sch.imageUrl ?? undefined,
    majors:               JSON.parse(sch.majorsJson            || "[]"),
    financials:           JSON.parse(sch.financialsJson        || "{}"),
    requirements:         JSON.parse(sch.requirementsJson      || "{}"),
    applicationHighlights: JSON.parse(sch.applicationHighlightsJson || "[]"),
    admissionProcess:     JSON.parse(sch.admissionProcessJson  || "[]"),
    tags:                 JSON.parse(sch.tagsJson              || "[]"),
  }

  return (
    <div className="ea-page max-w-3xl mx-auto space-y-6">
      <div>
        <p className="ea-section-tag">Admin · Scholarships</p>
        <h1 className="ea-page-title">Edit Scholarship Program</h1>
        <p className="ea-page-sub">Changes are saved immediately. Toggle &quot;Published&quot; to make visible to students.</p>
      </div>
      <ScholarshipForm mode="edit" initialData={initialData} />
    </div>
  )
}
