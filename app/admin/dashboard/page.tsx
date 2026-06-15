import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  ApplicationsByTypeChart, StatusPieChart, ApplicationTrendChart, FunnelChart,
} from "@/components/admin/admin-charts"
import {

  Users, GraduationCap, AlertCircle, Clock, TrendingUp, ArrowRight, Plus, Eye,
} from "lucide-react"

export const dynamic = "force-dynamic"

const STATUS_COLOR: Record<string, string> = {
  SUBMITTED:          "ea-badge ea-badge-blue",
  UNDER_REVIEW:       "ea-badge ea-badge-amber",
  DOCUMENTS_REQUIRED: "ea-badge ea-badge-orange",
  SHORTLISTED:        "ea-badge ea-badge-purple",
  ACCEPTED:           "ea-badge ea-badge-green",
  REJECTED:           "ea-badge ea-badge-red",
  COMPLETED:          "ea-badge ea-badge-teal",
}

export default async function AdminDashboardPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const user = await db.user.findUnique({ where: { id: session.user.id } })
  if (!user || !["ADMIN", "SUPER_ADMIN"].includes(user.role)) redirect("/dashboard")

  const [
    totalUsers,
    totalOpportunities,
    totalApplications,
    pendingApplications,
    slaBreachedApplications,
    acceptedApplications,
    recentApplications,
    statusCounts,
    typeCounts,
    totalScholarships,
    totalScholarshipApps,
    totalStudyApps,
    totalVisaApps,
  ] = await Promise.all([
    db.user.count({ where: { role: "USER" } }),
    db.opportunity.count({ where: { isActive: true } }),
    db.application.count(),
    db.application.count({ where: { status: { in: ["SUBMITTED", "UNDER_REVIEW"] } } }),
    db.application.count({ where: { slaBreached: true } }),
    db.application.count({ where: { status: "ACCEPTED" } }),
    db.application.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true, email: true } }, opportunity: { select: { title: true } } },
    }),
    db.application.groupBy({ by: ["status"], _count: true }),
    db.application.groupBy({ by: ["opportunityId"], _count: true }),
    db.scholarship.count({ where: { isActive: true } }),
    db.scholarshipApplication.count(),
    db.studyApplication.count(),
    db.visaApplication.count(),
  ])

  const scholarshipsCount = totalScholarships
  const scholarshipAppsCount = totalScholarshipApps
  const allApplicationsTotal = totalApplications + scholarshipAppsCount + totalStudyApps + totalVisaApps

  // Per-opportunity type breakdown — use Prisma API (no raw SQL)
  const appsByOpp = await db.application.groupBy({
    by: ["opportunityId"],
    _count: { id: true },
  })
  const oppIds = appsByOpp.map(r => r.opportunityId)
  const oppsWithTypes = oppIds.length > 0
    ? await db.opportunity.findMany({ where: { id: { in: oppIds } }, select: { id: true, type: true } })
    : []
  const typeCountMap: Record<string, number> = {}
  for (const row of appsByOpp) {
    const opp = oppsWithTypes.find(o => o.id === row.opportunityId)
    if (opp) typeCountMap[opp.type] = (typeCountMap[opp.type] ?? 0) + row._count.id
  }
  const byTypeData = Object.entries(typeCountMap).map(([type, count]) => ({ type, count }))

  // Last 7 days trend
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000)
  const last7Days = await db.application.findMany({
    where: { createdAt: { gte: sevenDaysAgo } },
    select: { createdAt: true },
  })
  const trendMap: Record<string, number> = {}
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000)
    trendMap[d.toLocaleDateString("en-GB", { day: "numeric", month: "short" })] = 0
  }
  last7Days.forEach((a) => {
    const key = new Date(a.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })
    if (key in trendMap) trendMap[key]++
  })
  const trendData = Object.entries(trendMap).map(([date, applications]) => ({ date, applications }))

  const byStatus = Object.fromEntries(statusCounts.map((s) => [s.status, s._count]))
  const statusChartData = statusCounts.map((s) => ({ status: s.status, count: s._count }))

  const conversionRate = totalApplications > 0 ? Math.round((acceptedApplications / totalApplications) * 100) : 0

  return (
    <div className="ea-page space-y-6">
      {/* Header */}
      <div className="ea-page-header">
        <div>
          <p className="ea-section-tag">Control Center</p>
          <h1 className="ea-page-title">Admin Dashboard</h1>
          <p className="ea-page-sub">EA Trade Link · Opportunity Management</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/scholarships/new"><Plus className="mr-2 h-4 w-4" />Create Program</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/admin/opportunities/new"><Plus className="mr-2 h-4 w-4" />Create Opportunity</Link>
          </Button>
        </div>
      </div>

      {/* SLA alert */}
      {slaBreachedApplications > 0 && (
        <div className="flex items-center gap-3 rounded-xl border-2 border-red-200 bg-red-50 p-4">
          <AlertCircle className="h-6 w-6 text-red-500 shrink-0" />
          <div className="flex-1">
            <p className="font-semibold text-red-800">SLA Breach Alert</p>
            <p className="text-sm text-red-700">
              <strong>{slaBreachedApplications}</strong> application{slaBreachedApplications > 1 ? "s have" : " has"} exceeded the 48-hour response SLA.
            </p>
          </div>
          <Button size="sm" variant="outline" className="border-red-300 text-red-700 hover:bg-red-100 shrink-0" asChild>
            <Link href="/admin/applications?sla=breached">View Now</Link>
          </Button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard icon={Users} label="Total Users" value={totalUsers} color="blue" />
        <StatCard icon={GraduationCap} label="Scholarship Programs" value={scholarshipsCount} color="purple" />
        <StatCard icon={TrendingUp} label="All Applications" value={allApplicationsTotal} color="teal" />
        <StatCard icon={Clock} label="Pending Review" value={pendingApplications} color="orange" />
      </div>

      {/* Applications breakdown */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Scholarship Apps",  value: scholarshipAppsCount, color: "#38bdf8" },
          { label: "Study in China",    value: totalStudyApps,       color: "#a78bfa" },
          { label: "Business Visa",     value: totalVisaApps,        color: "#D4AF37" },
          { label: "Opportunities",     value: totalApplications,    color: "#34d399" },
        ].map(s => (
          <div key={s.label} className="ea-card p-4">
            <p className="text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Charts row 1 */}
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Applications by Opportunity Type</CardTitle>
            <p className="text-xs text-muted-foreground">Total applications per category</p>
          </CardHeader>
          <CardContent>
            <ApplicationsByTypeChart data={byTypeData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Status Distribution</CardTitle>
            <p className="text-xs text-muted-foreground">Current application states</p>
          </CardHeader>
          <CardContent>
            <StatusPieChart data={statusChartData} />
          </CardContent>
        </Card>
      </div>

      {/* Charts row 2 */}
      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Application Trend — Last 7 Days</CardTitle>
          </CardHeader>
          <CardContent>
            <ApplicationTrendChart data={trendData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Conversion Funnel</CardTitle>
            <p className="text-xs text-muted-foreground">Browse → Apply → Accept</p>
          </CardHeader>
          <CardContent>
            <FunnelChart
              views={totalOpportunities * 12}
              clicks={totalApplications * 3}
              applied={totalApplications}
              approved={acceptedApplications}
            />
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Conversion rate: <span className="font-bold text-foreground">{conversionRate}%</span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Bottom row: status list + quick links */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Applications by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {statusCounts.map(({ status, _count }) => (
                <div key={status} className="flex items-center justify-between text-sm">
                  <span className={`${STATUS_COLOR[status] ?? "ea-badge ea-badge-gray"}`}>
                    {status.replace(/_/g, " ")}
                  </span>
                  <span className="font-bold">{_count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {[
                { label: "Review pending applications", href: "/admin/applications?status=SUBMITTED", badge: pendingApplications },
                { label: "Scholarship & Programs",      href: "/admin/scholarships" },
                { label: "All Opportunities",           href: "/admin/opportunities" },
                { label: "Manage Users",                href: "/admin/users" },
                { label: "Payments",                    href: "/admin/exchange" },
              ].map((item) => (
                <Link key={item.href} href={item.href} className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm hover:bg-white/[0.04] transition-colors">
                  <span>{item.label}</span>
                  <div className="flex items-center gap-2">
                    {item.badge != null && item.badge > 0 && (
                      <Badge className="bg-primary text-white text-xs h-5 px-1.5">{item.badge}</Badge>
                    )}
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent applications */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Recent Applications</h2>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/applications">View all <ArrowRight className="ml-1.5 h-3.5 w-3.5" /></Link>
          </Button>
        </div>
        <div className="space-y-2">
          {recentApplications.map((app) => (
            <Link key={app.id} href={`/admin/applications/${app.id}`}>
              <div className="flex items-center gap-3 rounded-xl p-3.5 transition-all" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{app.opportunity.title}</p>
                  <p className="text-xs text-muted-foreground">{app.user.name} · {app.user.email}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {app.slaBreached && <AlertCircle className="h-4 w-4 text-red-500" />}
                  <span className={`${STATUS_COLOR[app.status] ?? "ea-badge ea-badge-gray"}`}>
                    {app.status.replace(/_/g, " ")}
                  </span>
                  <p className="text-xs text-muted-foreground">
                    {new Date(app.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                  </p>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: number; color: string }) {
  const MAP: Record<string, { bg: string; text: string }> = {
    blue:   { bg: "bg-blue-400/10",   text: "text-blue-400" },
    purple: { bg: "bg-purple-400/10", text: "text-purple-400" },
    teal:   { bg: "bg-teal-400/10",   text: "text-teal-400" },
    orange: { bg: "bg-orange-400/10", text: "text-orange-400" },
  }
  const cls = MAP[color] ?? MAP.blue
  return (
    <div className="ea-card ea-stat">
      <div className={`ea-stat-icon ${cls.bg}`}>
        <Icon className={`h-5 w-5 ${cls.text}`} />
      </div>
      <div>
        <p className="ea-stat-value">{value}</p>
        <p className="ea-stat-label">{label}</p>
      </div>
    </div>
  )
}
