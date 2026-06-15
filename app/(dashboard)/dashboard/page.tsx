import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {

  GraduationCap, Briefcase, UserCheck, Calendar,
  Clock, CheckCircle2, AlertCircle,
  ChevronRight, ArrowRight, Star, Plane, Factory, ArrowLeftRight,
  FileText, Globe2, Sparkles, TrendingUp, Building2, Search,
} from "lucide-react"

export const dynamic = "force-dynamic"

// ── Shared status helpers ──────────────────────────────────────────────────────
const STATUS_COLOR: Record<string, string> = {
  SUBMITTED:          "ea-badge ea-badge-blue",
  UNDER_REVIEW:       "ea-badge ea-badge-amber",
  DOCUMENTS_REQUIRED: "ea-badge ea-badge-orange",
  SHORTLISTED:        "ea-badge ea-badge-purple",
  ACCEPTED:           "ea-badge ea-badge-green",
  REJECTED:           "ea-badge ea-badge-red",
  PROCESSING:         "ea-badge ea-badge-teal",
  COMPLETED:          "ea-badge ea-badge-green",
  CANCELLED:          "ea-badge ea-badge-gray",
}
const STATUS_LABEL: Record<string, string> = {
  SUBMITTED: "Submitted", UNDER_REVIEW: "Under Review",
  DOCUMENTS_REQUIRED: "Docs Required", SHORTLISTED: "Shortlisted",
  ACCEPTED: "Accepted", REJECTED: "Rejected",
  PROCESSING: "Processing", COMPLETED: "Completed", CANCELLED: "Cancelled",
}

// ── Type icons per opportunity type ───────────────────────────────────────────
const OPP_ICON: Record<string, React.ElementType> = {
  SCHOLARSHIP: GraduationCap, JOB: Briefcase, BUSINESS_VISA: Plane,
  FACTORY_VISIT: Factory, CANTON_FAIR: Calendar,
  TRADE_EXHIBITION: TrendingUp, CONFERENCE: UserCheck,
  PRODUCT_SOURCING: Search, EXCHANGE: ArrowLeftRight,
}
const OPP_COLOR: Record<string, string> = {
  SCHOLARSHIP: "bg-blue-500/15 text-blue-400", JOB: "bg-emerald-500/15 text-emerald-400",
  BUSINESS_VISA: "bg-purple-500/15 text-purple-400", FACTORY_VISIT: "bg-orange-500/15 text-orange-400",
  CANTON_FAIR: "bg-rose-500/15 text-rose-400", TRADE_EXHIBITION: "bg-teal-500/15 text-teal-400",
  CONFERENCE: "bg-indigo-500/15 text-indigo-400",
}

// ── Role audience keys used in targetAudience JSON field ─────────────────────
const ROLE_AUDIENCE: Record<string, string> = {
  STUDENT:    "STUDENT",
  BUSINESS:   "BUSINESS",
  JOB_SEEKER: "JOB_SEEKER",
}

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const user = await db.user.findUnique({ where: { id: session.user.id } })
  if (!user) redirect("/login")
  if (["ADMIN", "SUPER_ADMIN"].includes(user.role)) redirect("/admin/dashboard")

  const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(user.role)
  let primaryType: string
  if (isAdmin) {
    primaryType = "ADMIN"
  } else {
    try {
      const types: string[] = JSON.parse(user.userTypes || '["STUDENT"]')
      primaryType = types[0] ?? "STUDENT"
    } catch {
      primaryType = "STUDENT"
    }
  }

  // Fetch generic applications (opportunity-linked)
  const applications = await db.application.findMany({
    where: { userId: user.id },
    include: { opportunity: true },
    orderBy: { createdAt: "desc" },
    take: 6,
  })

  // Fetch service applications based on role
  const studyApplications = primaryType === "STUDENT"
    ? await db.studyApplication.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } })
    : []
  const visaApplications = primaryType === "BUSINESS"
    ? await db.visaApplication.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } })
    : []

  // Combine all apps for stats so counts include every model type
  const allStatuses = [
    ...applications.map(a => ({ status: a.status, slaBreached: a.slaBreached })),
    ...visaApplications.map(a => ({ status: a.status, slaBreached: a.slaBreached })),
    ...studyApplications.map(a => ({ status: a.status, slaBreached: a.slaBreached })),
  ]
  const slaAlerts = allStatuses.filter(a => a.slaBreached).length
  const accepted  = allStatuses.filter(a => ["ACCEPTED", "APPROVED", "COMPLETED"].includes(a.status)).length
  const pending   = allStatuses.filter(a => ["SUBMITTED", "UNDER_REVIEW", "SHORTLISTED", "PROCESSING"].includes(a.status)).length
  const totalRequests = allStatuses.length

  const hour = new Date().getHours()
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening"

  // ── Fetch role-relevant opportunities (filter by targetAudience JSON field) ──
  const audienceKey = ROLE_AUDIENCE[primaryType] ?? "STUDENT"
  const opportunities = await db.opportunity.findMany({
    where: {
      isActive: true,
      OR: [
        { targetAudience: { contains: audienceKey } },
        { targetAudience: { contains: "ALL" } },
      ],
    },
    orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
    take: 4,
  })

  // ── Fetch direct apply links for service shortcuts ─────────────────────────
  // These let "Apply for Visa" / "Apply to Study" go STRAIGHT to the form,
  // bypassing the landing gallery page entirely.
  const [visaOpp, scholarshipOpp] = await Promise.all([
    db.opportunity.findFirst({ where: { isActive: true, type: "BUSINESS_VISA" }, orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }], select: { id: true } }),
    db.opportunity.findFirst({ where: { isActive: true, type: "SCHOLARSHIP"   }, orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }], select: { id: true } }),
  ])
  const visaApplyHref       = visaOpp       ? `/apply/${visaOpp.id}`       : "/apply-visa"
  const scholarshipApplyHref = scholarshipOpp ? `/apply/${scholarshipOpp.id}` : "/apply-to-china"

  // ── Render role-specific dashboard ────────────────────────────────────────
  if (primaryType === "STUDENT") {
    return <StudentDashboard user={user} applications={applications} studyApplications={studyApplications} opportunities={opportunities}
      accepted={accepted} pending={pending} slaAlerts={slaAlerts} greeting={greeting} scholarshipApplyHref={scholarshipApplyHref} />
  }
  if (primaryType === "BUSINESS") {
    return <BusinessDashboard user={user} applications={applications} visaApplications={visaApplications} opportunities={opportunities}
      accepted={accepted} pending={pending} slaAlerts={slaAlerts} greeting={greeting} visaApplyHref={visaApplyHref} totalRequests={totalRequests} />
  }
  // Default fallback → Student portal
  return <StudentDashboard user={user} applications={applications} studyApplications={studyApplications} opportunities={opportunities}
    accepted={accepted} pending={pending} slaAlerts={slaAlerts} greeting={greeting} scholarshipApplyHref={scholarshipApplyHref} />
}

// ─────────────────────────────────────────────────────────────────────────────
// STUDENT DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────
function StudentDashboard({ user, applications, studyApplications, opportunities, accepted, pending, slaAlerts, greeting, scholarshipApplyHref }: any) {
  const scholarshipApps = applications.filter((a: any) => a.opportunity.type === "SCHOLARSHIP")
  const hasStudyApp = studyApplications.length > 0

  return (
    <div className="ea-page space-y-6">
      {/* Header */}
      <div className="ea-page-header">
        <div>
          <p className="ea-section-tag">🎓 Student Portal</p>
          <h1 className="ea-page-title">{greeting}, {user.name?.split(" ")[0]}</h1>
          <p className="ea-page-sub">Your China Study Journey</p>
        </div>
        <Button asChild size="sm">
          <Link href={scholarshipApplyHref}><GraduationCap className="mr-1.5 h-3.5 w-3.5" />Apply to Study in China</Link>
        </Button>
      </div>

      <SlaAlert count={slaAlerts} />

      {/* Apply to Study in China CTA (if no study app yet) */}
      {!hasStudyApp && (
        <div className="ea-card p-6 flex flex-col sm:flex-row items-center gap-5"
          style={{ background: "linear-gradient(135deg,rgba(56,189,248,0.08),rgba(99,102,241,0.06))", borderColor: "rgba(56,189,248,0.2)" }}>
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-sky-500/10">
            <Sparkles className="h-7 w-7 text-sky-400" />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <p className="font-bold text-foreground mb-1">Apply to Study in China — Our Main Service</p>
            <p className="text-sm text-muted-foreground max-w-md">
              Submit your profile and our experts personally match you to scholarships and universities. We guide you every step of the way.
            </p>
          </div>
          <Button asChild className="shrink-0" style={{ background: "#38bdf8", color: "#05091a" }}>
            <Link href={scholarshipApplyHref}>Start Application <ArrowRight className="ml-1.5 h-3.5 w-3.5" /></Link>
          </Button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard icon={Globe2}       label="Study Apps"    value={studyApplications.length} bg="bg-sky-500/15"    fg="text-sky-400" />
        <StatCard icon={FileText}     label="Scholarship Apps" value={scholarshipApps.length} bg="bg-blue-500/15"   fg="text-blue-400" />
        <StatCard icon={CheckCircle2} label="Accepted"      value={accepted}                  bg="bg-green-500/15"  fg="text-green-400" />
        <StatCard icon={Clock}        label="In Progress"   value={pending}                   bg="bg-amber-500/15"  fg="text-amber-400" />
      </div>

      {/* Quick actions */}
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { href: scholarshipApplyHref,      icon: GraduationCap, label: "Apply to Study in China", sub: "Start your application",   color: "text-sky-400",    bg: "bg-sky-500/10" },
          { href: "/scholarships",           icon: GraduationCap, label: "Browse Scholarships",     sub: "View all programmes",     color: "text-blue-400",   bg: "bg-blue-500/10" },
          { href: "/dashboard/applications", icon: FileText,      label: "My Applications",         sub: "Track your progress",     color: "text-amber-400",  bg: "bg-amber-500/10" },
          { href: "/exchange",               icon: ArrowLeftRight, label: "Money Exchange",         sub: "RMB ↔ TZS rates",         color: "text-teal-400",   bg: "bg-teal-500/10" },
        ].map((q) => (
          <Link key={q.href} href={q.href}>
            <div className="ea-card flex items-center gap-4 p-4 hover:border-white/20 transition-all group">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl shrink-0 ${q.bg}`}>
                <q.icon className={`h-5 w-5 ${q.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13.5px] font-bold text-foreground">{q.label}</p>
                <p className="text-xs text-muted-foreground">{q.sub}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors shrink-0" />
            </div>
          </Link>
        ))}
      </div>

      {/* Study Applications (placement) */}
      {studyApplications.length > 0 && (
        <div className="ea-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border/60">
            <div>
              <p className="ea-section-tag text-sky-500">Study Applications</p>
              <h2 className="text-[15px] font-bold">My Study Applications</h2>
            </div>
          </div>
          <div className="divide-y divide-border/40">
            {studyApplications.map((app: any) => (
              <Link key={app.id} href={`/dashboard/applications/${app.id}`}
                className="flex items-center gap-4 px-5 py-4 hover:bg-muted/30 transition-colors group">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-500/15">
                  <GraduationCap className="h-4 w-4 text-sky-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13.5px] font-semibold truncate group-hover:text-primary transition-colors">{app.degreeLevel.replace(/_/g, " ")} — {app.fieldOfStudy}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{app.fullName} · {app.nationality}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={STATUS_COLOR[app.status] ?? "ea-badge ea-badge-gray"}>
                    {STATUS_LABEL[app.status] ?? app.status.replace(/_/g, " ")}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Scholarship applications */}
      <ApplicationList
        apps={scholarshipApps}
        title="Direct Scholarship Applications"
        emptyTitle="No scholarship applications yet"
        emptyDesc="Browse available scholarships and apply directly to specific programs."
        emptyCta={{ href: "/scholarships", label: "Browse Scholarships" }}
      />

      {/* Recommended scholarships */}
      {opportunities.length > 0 && (
        <div className="ea-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border/60">
            <div>
              <p className="ea-section-tag">Recommended</p>
              <h2 className="text-[15px] font-bold">Available Scholarships</h2>
            </div>
            <Link href="/scholarships" className="text-[13px] font-semibold text-primary hover:underline flex items-center gap-1">
              See all <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <OppList opps={opportunities} />
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// BUSINESS DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────
function BusinessDashboard({ user, applications, visaApplications, opportunities, accepted, pending, slaAlerts, greeting, visaApplyHref, totalRequests }: any) {
  return (
    <div className="ea-page space-y-6">
      {/* Header */}
      <div className="ea-page-header">
        <div>
          <p className="ea-section-tag">💼 Business Portal</p>
          <h1 className="ea-page-title">{greeting}, {user.name?.split(" ")[0]}</h1>
          <p className="ea-page-sub">Your China Business Operations</p>
        </div>
        <Button asChild size="sm">
          <Link href={visaApplyHref}><Plane className="mr-1.5 h-3.5 w-3.5" />Apply for Visa</Link>
        </Button>
      </div>

      <SlaAlert count={slaAlerts} />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard icon={FileText}     label="Total Requests" value={totalRequests}       bg="bg-blue-500/15"    fg="text-blue-400" />
        <StatCard icon={CheckCircle2} label="Approved"       value={accepted}            bg="bg-green-500/15"   fg="text-green-400" />
        <StatCard icon={Clock}        label="In Progress"    value={pending}             bg="bg-amber-500/15"   fg="text-amber-400" />
        <StatCard icon={Building2}    label="Opportunities"  value={opportunities.length} bg="bg-purple-500/15" fg="text-purple-400" />
      </div>

      {/* Quick actions */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { href: visaApplyHref,       icon: Plane,          label: "Business Visa",    sub: "Start visa application",   color: "text-purple-400", bg: "bg-purple-500/10" },
          { href: "/factory-visits",   icon: Factory,        label: "Factory Visit",    sub: "Book a factory tour",      color: "text-orange-400", bg: "bg-orange-500/10" },
          { href: "/sourcing",         icon: Search,         label: "Product Sourcing", sub: "Find suppliers in China",  color: "text-sky-400",    bg: "bg-sky-500/10" },
          { href: "/exchange",         icon: ArrowLeftRight, label: "Money Exchange",   sub: "RMB ↔ TZS rates",         color: "text-teal-400",   bg: "bg-teal-500/10" },
        ].map((q) => (
          <Link key={q.href} href={q.href}>
            <div className="ea-card flex items-center gap-3 p-4 hover:border-white/20 transition-all group">
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl shrink-0 ${q.bg}`}>
                <q.icon className={`h-4 w-4 ${q.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-bold text-foreground">{q.label}</p>
                <p className="text-xs text-muted-foreground">{q.sub}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-muted-foreground shrink-0" />
            </div>
          </Link>
        ))}
      </div>

      {/* Upcoming events */}
      {opportunities.length > 0 && (
        <div className="ea-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border/60">
            <div>
              <p className="ea-section-tag">Business</p>
              <h2 className="text-[15px] font-bold">Business Opportunities & Events</h2>
            </div>
            <Link href="/#opportunities" className="text-[13px] font-semibold text-primary hover:underline flex items-center gap-1">
              See all <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <OppList opps={opportunities} />
        </div>
      )}

      {/* Visa applications */}
      {visaApplications.length > 0 && (
        <div className="ea-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border/60">
            <div>
              <p className="ea-section-tag text-purple-500">Visa Service</p>
              <h2 className="text-[15px] font-bold">My Visa Applications</h2>
            </div>
          </div>
          <div className="divide-y divide-border/40">
            {visaApplications.map((app: any) => (
              <Link key={app.id} href={`/dashboard/applications/${app.id}`}
                className="flex items-center gap-4 px-5 py-4 hover:bg-muted/30 transition-colors group">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-500/15">
                  <Plane className="h-4 w-4 text-purple-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13.5px] font-semibold truncate group-hover:text-primary transition-colors">Business Visa — {app.purpose}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{app.fullName} · {app.nationality}</p>
                </div>
                <span className={STATUS_COLOR[app.status] ?? "ea-badge ea-badge-gray"}>
                  {STATUS_LABEL[app.status] ?? app.status.replace(/_/g, " ")}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Request history */}
      <ApplicationList
        apps={applications}
        title="My Business Requests"
        emptyTitle="No requests yet"
        emptyDesc="Start a business visa application, factory visit, or sourcing request."
        emptyCta={{ href: visaApplyHref, label: "Apply for Visa" }}
      />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SHARED COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, bg, fg }: { icon: React.ElementType; label: string; value: number; bg: string; fg: string }) {
  return (
    <div className="ea-card ea-stat">
      <div className={`ea-stat-icon ${bg}`}>
        <Icon className={`h-5 w-5 ${fg}`} />
      </div>
      <div>
        <p className="ea-stat-value">{value}</p>
        <p className="ea-stat-label">{label}</p>
      </div>
    </div>
  )
}

function SlaAlert({ count }: { count: number }) {
  if (count === 0) return null
  return (
    <div className="flex items-center gap-3 rounded-2xl px-5 py-4"
      style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)" }}>
      <AlertCircle className="h-5 w-5 shrink-0" style={{ color: "#f87171" }} />
      <p className="text-sm flex-1" style={{ color: "rgba(255,255,255,0.7)" }}>
        <span className="font-semibold" style={{ color: "#f87171" }}>{count} application{count > 1 ? "s" : ""}</span> {count > 1 ? "are" : "is"} awaiting a response. Our team will be in touch shortly.
      </p>
      <Link href="/dashboard/applications" className="text-xs font-semibold hover:underline shrink-0" style={{ color: "#f87171" }}>View →</Link>
    </div>
  )
}

function ApplicationList({ apps, title, emptyTitle, emptyDesc, emptyCta }: {
  apps: any[]; title: string; emptyTitle: string; emptyDesc: string; emptyCta: { href: string; label: string }
}) {
  if (apps.length === 0) {
    return (
      <div className="ea-card flex flex-col items-center justify-center py-14 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted mb-4">
          <Star className="h-6 w-6 text-muted-foreground/40" />
        </div>
        <h3 className="font-bold mb-1">{emptyTitle}</h3>
        <p className="text-sm text-muted-foreground mb-5 max-w-xs">{emptyDesc}</p>
        <Button asChild size="sm"><Link href={emptyCta.href}>{emptyCta.label} <ArrowRight className="ml-1.5 h-3.5 w-3.5" /></Link></Button>
      </div>
    )
  }
  return (
    <div className="ea-card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border/60">
        <h2 className="text-[15px] font-bold">{title}</h2>
        <Link href="/dashboard/applications" className="text-[13px] font-semibold text-primary hover:underline flex items-center gap-1">
          View all <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      <div className="divide-y divide-border/40">
        {apps.map((app: any) => {
          const Icon = OPP_ICON[app.opportunity.type] ?? Star
          const colorCls = OPP_COLOR[app.opportunity.type] ?? "bg-gray-500/15 text-gray-400"
          return (
            <Link key={app.id} href={`/dashboard/applications/${app.id}`}
              className="flex items-center gap-4 px-5 py-4 hover:bg-muted/30 transition-colors group">
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${colorCls}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13.5px] font-semibold truncate group-hover:text-primary transition-colors">{app.opportunity.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{app.opportunity.organization}</p>
              </div>
              <div className="flex items-center gap-2.5 shrink-0">
                {app.slaBreached && <AlertCircle className="h-3.5 w-3.5 text-red-500" />}
                <span className={STATUS_COLOR[app.status] ?? "ea-badge ea-badge-gray"}>
                  {STATUS_LABEL[app.status] ?? app.status}
                </span>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

function OppList({ opps }: { opps: any[] }) {
  return (
    <div className="divide-y divide-border/40">
      {opps.map((opp: any) => {
        const Icon = OPP_ICON[opp.type] ?? Star
        const colorCls = OPP_COLOR[opp.type] ?? "bg-gray-500/15 text-gray-400"
        return (
          <Link key={opp.id} href={`/apply/${opp.id}`}
            className="flex items-center gap-4 px-5 py-4 hover:bg-muted/30 transition-colors group">
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${colorCls}`}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13.5px] font-semibold truncate group-hover:text-primary transition-colors">{opp.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{opp.organization}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {opp.deadline && (
                <span className="ea-badge ea-badge-orange text-[10px]">
                  {new Date(opp.deadline).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                </span>
              )}
              <span className="text-xs font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                Apply →
              </span>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
