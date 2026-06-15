import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plane, Clock, CheckCircle2, AlertCircle, ArrowRight, Users } from "lucide-react"

const STATUS_COLOR: Record<string, string> = {
  SUBMITTED:          "bg-blue-100 text-blue-700",
  UNDER_REVIEW:       "bg-yellow-100 text-yellow-700",
  DOCUMENTS_REQUIRED: "bg-orange-100 text-orange-700",
  PROCESSING:         "bg-indigo-100 text-indigo-700",
  APPROVED:           "bg-green-100 text-green-700",
  REJECTED:           "bg-red-100 text-red-700",
}

export default async function AdminVisaApplicationsPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const user = await db.user.findUnique({ where: { id: session.user.id } })
  if (!user || !["ADMIN", "SUPER_ADMIN"].includes(user.role)) redirect("/dashboard")

  const apps = await db.visaApplication.findMany({
    include: { user: { select: { name: true, email: true } } },
    orderBy: [{ slaBreached: "desc" }, { createdAt: "desc" }],
  })

  const counts = {
    total: apps.length,
    pending: apps.filter(a => ["SUBMITTED", "UNDER_REVIEW"].includes(a.status)).length,
    processing: apps.filter(a => a.status === "PROCESSING").length,
    sla: apps.filter(a => a.slaBreached).length,
  }

  return (
    <div className="ea-page space-y-6">
      <div className="ea-page-header">
        <div>
          <p className="ea-section-tag">Admin · Business Service</p>
          <h1 className="ea-page-title">Visa Applications</h1>
          <p className="ea-page-sub">Review and process China business visa applications</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="ea-card ea-stat">
          <div className="ea-stat-icon bg-blue-50"><Users className="h-5 w-5 text-blue-600" /></div>
          <div><p className="ea-stat-value">{counts.total}</p><p className="ea-stat-label">Total</p></div>
        </div>
        <div className="ea-card ea-stat">
          <div className="ea-stat-icon bg-amber-50"><Clock className="h-5 w-5 text-amber-600" /></div>
          <div><p className="ea-stat-value">{counts.pending}</p><p className="ea-stat-label">Pending</p></div>
        </div>
        <div className="ea-card ea-stat">
          <div className="ea-stat-icon bg-indigo-50"><Plane className="h-5 w-5 text-indigo-600" /></div>
          <div><p className="ea-stat-value">{counts.processing}</p><p className="ea-stat-label">Processing</p></div>
        </div>
        <div className="ea-card ea-stat">
          <div className="ea-stat-icon bg-red-50"><AlertCircle className="h-5 w-5 text-red-600" /></div>
          <div><p className="ea-stat-value">{counts.sla}</p><p className="ea-stat-label">SLA Breached</p></div>
        </div>
      </div>

      <div className="ea-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border/60">
          <h2 className="font-semibold">All Visa Applications</h2>
        </div>

        {apps.length === 0 ? (
          <div className="py-16 text-center">
            <Plane className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
            <p className="font-semibold text-muted-foreground">No visa applications yet</p>
          </div>
        ) : (
          <div className="divide-y divide-border/40">
            {apps.map(app => (
              <div key={app.id} className="flex items-center gap-4 px-5 py-4 hover:bg-muted/30 transition-colors">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-500/10">
                  <Plane className="h-5 w-5 text-purple-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">Business Visa — {app.purpose}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {app.fullName} · {app.nationality} · {app.contactEmail}
                  </p>
                  {app.travelDates && (
                    <p className="text-xs text-muted-foreground">Travel: {app.travelDates}</p>
                  )}
                </div>
                <div className="flex items-center gap-2.5 shrink-0">
                  {app.slaBreached && <AlertCircle className="h-4 w-4 text-red-500" />}
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLOR[app.status] ?? "bg-gray-100 text-gray-600"}`}>
                    {app.status.replace(/_/g, " ")}
                  </span>
                  <p className="text-xs text-muted-foreground">
                    {new Date(app.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                  </p>
                  <Link href={`/admin/applications/${app.id}`}>
                    <Button size="sm" variant="outline">Review <ArrowRight className="ml-1 h-3 w-3" /></Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
