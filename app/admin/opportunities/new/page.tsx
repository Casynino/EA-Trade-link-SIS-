import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import { NewOpportunityForm } from "./form"

export default async function NewOpportunityPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  const user = await db.user.findUnique({ where: { id: session.user.id } })
  if (!user || !["ADMIN", "SUPER_ADMIN"].includes(user.role)) redirect("/dashboard")

  return (
    <div className="ea-page max-w-3xl">
      <div className="mb-6">
        <p className="ea-section-tag">Admin · Opportunities</p>
        <h1 className="ea-page-title">New Opportunity</h1>
        <p className="ea-page-sub">Publish a new opportunity to the platform feed</p>
      </div>
      <NewOpportunityForm adminId={user.id} />
    </div>
  )
}
