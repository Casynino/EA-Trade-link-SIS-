import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { ScholarshipForm } from "../scholarship-form"

export default async function NewScholarshipPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  const user = await db.user.findUnique({ where: { id: session.user.id } })
  if (!user || !["ADMIN", "SUPER_ADMIN"].includes(user.role)) redirect("/dashboard")

  return (
    <div className="ea-page max-w-3xl mx-auto space-y-6">
      <div>
        <p className="ea-section-tag">Admin · Scholarships</p>
        <h1 className="ea-page-title">Add Scholarship Program</h1>
        <p className="ea-page-sub">Fill in all sections — this will be live to students immediately on publish.</p>
      </div>
      <ScholarshipForm mode="create" />
    </div>
  )
}
