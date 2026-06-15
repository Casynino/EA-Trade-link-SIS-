import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { EditOpportunityForm } from "./form"

export const dynamic = "force-dynamic"

export default async function EditOpportunityPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) redirect("/login")
  const user = await db.user.findUnique({ where: { id: session.user.id! } })
  if (!user || !["ADMIN", "SUPER_ADMIN"].includes(user.role)) redirect("/dashboard")

  const { id } = await params
  const opp = await db.opportunity.findUnique({ where: { id } })
  if (!opp) notFound()

  return (
    <div className="ea-page max-w-3xl">
      <div className="mb-6">
        <Link
          href="/admin/opportunities"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Opportunities
        </Link>
        <p className="ea-section-tag">Admin · Edit</p>
        <h1 className="ea-page-title">Edit Opportunity</h1>
        <p className="ea-page-sub text-sm truncate max-w-xl">{opp.title}</p>
      </div>

      <EditOpportunityForm opp={opp as Record<string, unknown>} />
    </div>
  )
}
