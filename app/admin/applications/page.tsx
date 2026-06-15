import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import Link from "next/link"
import {
  GraduationCap, Plane, Briefcase, BookOpen, FileText, AlertCircle,
  Clock, ArrowRight, CheckCircle2, XCircle, Loader2, DollarSign,
  LayoutGrid, Users,
} from "lucide-react"

export const dynamic = "force-dynamic"

// ── Status config ──────────────────────────────────────────────────────────────
const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  SUBMITTED:          { label: "Submitted",        color: "#60a5fa", bg: "rgba(96,165,250,0.12)"  },
  APPLIED:            { label: "Applied",           color: "#60a5fa", bg: "rgba(96,165,250,0.12)"  },
  INTERESTED:         { label: "Interested",        color: "#94a3b8", bg: "rgba(148,163,184,0.1)"  },
  UNDER_REVIEW:       { label: "Under Review",      color: "#fbbf24", bg: "rgba(251,191,36,0.12)"  },
  DOCUMENTS_REQUIRED: { label: "Docs Required",     color: "#fb923c", bg: "rgba(251,146,60,0.12)"  },
  SHORTLISTED:        { label: "Shortlisted",       color: "#c084fc", bg: "rgba(192,132,252,0.12)" },
  ACCEPTED:           { label: "Approved",          color: "#34d399", bg: "rgba(52,211,153,0.12)"  },
  APPROVED:           { label: "Approved",          color: "#34d399", bg: "rgba(52,211,153,0.12)"  },
  AWAITING_PAYMENT:   { label: "Awaiting Payment",  color: "#D4AF37", bg: "rgba(212,175,55,0.12)"  },
  PAYMENT_PENDING:    { label: "Payment Required",  color: "#D4AF37", bg: "rgba(212,175,55,0.12)"  },
  PAYMENT_COMPLETED:  { label: "Payment Confirmed", color: "#34d399", bg: "rgba(52,211,153,0.12)"  },
  PROCESSING:         { label: "Processing",        color: "#fbbf24", bg: "rgba(251,191,36,0.12)"  },
  COMPLETED:          { label: "Completed",         color: "#34d399", bg: "rgba(52,211,153,0.12)"  },
  REJECTED:           { label: "Rejected",          color: "#f87171", bg: "rgba(248,113,113,0.12)" },
  CANCELLED:          { label: "Cancelled",         color: "#94a3b8", bg: "rgba(148,163,184,0.1)"  },
}

const CAT_META = {
  scholarship: { label: "Scholarship",    icon: GraduationCap, color: "#38bdf8", bg: "rgba(56,189,248,0.1)"  },
  study:       { label: "Study in China", icon: BookOpen,      color: "#a78bfa", bg: "rgba(167,139,250,0.1)" },
  visa:        { label: "Business Visa",  icon: Plane,         color: "#D4AF37", bg: "rgba(212,175,55,0.1)"  },
  opportunity: { label: "Opportunity",    icon: Briefcase,     color: "#34d399", bg: "rgba(52,211,153,0.1)"  },
}

type AppCategory = keyof typeof CAT_META

interface UnifiedApp {
  id: string
  category: AppCategory
  title: string
  userName: string
  userEmail: string
  status: string
  createdAt: Date
  slaBreached?: boolean
  feePaid?: boolean
  href: string
  degreeOrType?: string
}

async function getAllApplications(): Promise<UnifiedApp[]> {
  const [scholarshipApps, studyApps, visaApps, oppApps] = await Promise.all([
    db.$queryRaw<{ id: string; status: string; createdAt: Date; userName: string; userEmail: string; scholarshipTitle: string }[]>`
      SELECT sa.id, sa.status, sa.createdAt,
             u.name as userName, u.email as userEmail,
             COALESCE(s.title, 'Unknown Scholarship') as scholarshipTitle
      FROM scholarship_applications sa
      JOIN users u ON u.id = sa.userId
      LEFT JOIN scholarships s ON s.id = sa.scholarshipId
      ORDER BY sa.createdAt DESC LIMIT 200
    `,
    db.studyApplication.findMany({ take: 200, orderBy: { createdAt: "desc" }, include: { user: { select: { name: true, email: true } } } }),
    db.visaApplication.findMany({ take: 200, orderBy: { createdAt: "desc" }, include: { user: { select: { name: true, email: true } } } }),
    db.application.findMany({
      take: 200,
      orderBy: [{ slaBreached: "desc" }, { createdAt: "desc" }],
      include: { user: { select: { name: true, email: true } }, opportunity: { select: { title: true, type: true } } },
    }),
  ])

  const result: UnifiedApp[] = []

  scholarshipApps.forEach(a => result.push({
    id: a.id, category: "scholarship",
    title: a.scholarshipTitle,
    userName: a.userName, userEmail: a.userEmail,
    status: a.status, createdAt: new Date(a.createdAt),
    href: `/admin/applications/${a.id}`,
    degreeOrType: "Scholarship Program",
  }))
  studyApps.forEach(a => result.push({
    id: a.id, category: "study",
    title: `${a.degreeLevel} — ${a.fieldOfStudy}`,
    userName: a.user?.name ?? "Unknown", userEmail: a.user?.email ?? "",
    status: a.status, createdAt: a.createdAt, slaBreached: a.slaBreached,
    href: `/admin/applications/${a.id}`,
    degreeOrType: a.degreeLevel,
  }))
  visaApps.forEach(a => result.push({
    id: a.id, category: "visa",
    title: `Business Visa — ${(a as any).purpose ?? "China"}`,
    userName: a.user?.name ?? "Unknown", userEmail: a.user?.email ?? "",
    status: a.status, createdAt: a.createdAt, slaBreached: a.slaBreached,
    href: `/admin/applications/${a.id}`,
    degreeOrType: "Business Visa",
  }))
  oppApps.forEach(a => result.push({
    id: a.id, category: "opportunity",
    title: a.opportunity.title,
    userName: a.user?.name ?? "Unknown", userEmail: a.user?.email ?? "",
    status: a.status, createdAt: a.createdAt, slaBreached: a.slaBreached,
    feePaid: a.feePaid,
    href: `/admin/applications/${a.id}`,
    degreeOrType: a.opportunity.type.replace(/_/g, " "),
  }))

  return result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
}

export default async function AdminApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; status?: string; sla?: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")
  const user = await db.user.findUnique({ where: { id: session.user.id } })
  if (!user || !["ADMIN", "SUPER_ADMIN"].includes(user.role)) redirect("/dashboard")

  const { category, status, sla } = await searchParams
  const allApps = await getAllApplications()

  let filtered = allApps
  if (category && category !== "all") filtered = filtered.filter(a => a.category === category)
  if (status)                          filtered = filtered.filter(a => a.status === status)
  if (sla === "breached")             filtered = filtered.filter(a => a.slaBreached)

  // Category counts
  const catCounts = {
    all:         allApps.length,
    scholarship: allApps.filter(a => a.category === "scholarship").length,
    study:       allApps.filter(a => a.category === "study").length,
    visa:        allApps.filter(a => a.category === "visa").length,
    opportunity: allApps.filter(a => a.category === "opportunity").length,
  }

  // Status counts
  const pending         = allApps.filter(a => ["SUBMITTED","APPLIED"].includes(a.status)).length
  const underReview     = allApps.filter(a => a.status === "UNDER_REVIEW").length
  const approved        = allApps.filter(a => ["ACCEPTED","APPROVED"].includes(a.status)).length
  const awaitingPayment = allApps.filter(a => a.status === "PAYMENT_PENDING").length
  const processing      = allApps.filter(a => a.status === "PROCESSING").length
  const completed       = allApps.filter(a => a.status === "COMPLETED").length
  const rejected        = allApps.filter(a => a.status === "REJECTED").length
  const slaBreached     = allApps.filter(a => a.slaBreached).length

  const STATUS_STATS = [
    { label: "Total",            value: allApps.length, color: "#94a3b8", icon: LayoutGrid,      filter: undefined },
    { label: "Pending Review",   value: pending,        color: "#60a5fa", icon: Clock,            filter: "SUBMITTED" },
    { label: "Under Review",     value: underReview,    color: "#fbbf24", icon: Loader2,          filter: "UNDER_REVIEW" },
    { label: "Approved",         value: approved,       color: "#34d399", icon: CheckCircle2,     filter: "ACCEPTED" },
    { label: "Awaiting Payment", value: awaitingPayment,color: "#D4AF37", icon: DollarSign,       filter: undefined },
    { label: "Processing",       value: processing,     color: "#a78bfa", icon: ArrowRight,       filter: "PROCESSING" },
    { label: "Completed",        value: completed,      color: "#34d399", icon: CheckCircle2,     filter: "COMPLETED" },
    { label: "Rejected",         value: rejected,       color: "#f87171", icon: XCircle,          filter: "REJECTED" },
  ]

  return (
    <div className="ea-page space-y-6">
      {/* Header */}
      <div>
        <p className="ea-section-tag text-xs font-semibold uppercase tracking-wider" style={{ color: "#D4AF37" }}>Admin · Control Center</p>
        <h1 className="ea-page-title text-2xl font-black mt-1">Application Inbox</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {allApps.length} total applications · {pending} awaiting review · {slaBreached} overdue
        </p>
      </div>

      {/* SLA alert */}
      {slaBreached > 0 && (
        <div className="flex items-center gap-3 rounded-xl p-4"
          style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
          <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-bold text-red-300">⚠ {slaBreached} Application{slaBreached > 1 ? "s" : ""} Overdue</p>
            <p className="text-xs mt-0.5" style={{ color: "rgba(252,165,165,0.7)" }}>These applications have been waiting too long. Review immediately.</p>
          </div>
          <Link href="?sla=breached" className="text-xs font-bold text-red-300 hover:underline flex items-center gap-1 shrink-0">
            Show overdue <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      {/* Status stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
        {STATUS_STATS.map((s) => {
          const Icon = s.icon
          return (
            <Link
              key={s.label}
              href={s.filter ? `?status=${s.filter}` : "?"}
              className="ea-card flex flex-col items-center justify-center p-3 text-center gap-1 transition-all hover:-translate-y-0.5"
              style={status === s.filter ? { border: `1px solid ${s.color}50` } : {}}
            >
              <Icon className="h-4 w-4 mb-1 shrink-0" style={{ color: s.color }} />
              <p className="text-lg font-black leading-none" style={{ color: s.color }}>{s.value}</p>
              <p className="text-[10px] text-muted-foreground leading-tight">{s.label}</p>
            </Link>
          )
        })}
      </div>

      {/* Category filter tabs */}
      <div className="ea-card p-3 flex items-center gap-2 flex-wrap">
        <Link href={status ? `?status=${status}` : "?"}
          className="rounded-full px-3 py-1 text-xs font-semibold transition-colors"
          style={!category || category === "all"
            ? { background: "rgba(255,255,255,0.12)", color: "white" }
            : { color: "var(--muted-foreground)" }}>
          All ({catCounts.all})
        </Link>
        {(Object.entries(CAT_META) as [AppCategory, typeof CAT_META[AppCategory]][]).map(([key, meta]) => (
          <Link key={key}
            href={status ? `?category=${key}&status=${status}` : `?category=${key}`}
            className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-colors"
            style={category === key
              ? { background: meta.bg, color: meta.color }
              : { color: "var(--muted-foreground)" }}>
            <meta.icon className="h-3 w-3" />
            {meta.label} ({catCounts[key]})
          </Link>
        ))}
        {sla === "breached" && (
          <span className="rounded-full px-3 py-1 text-xs font-semibold bg-red-500/15 text-red-400">⚠ Overdue</span>
        )}
        {(category || status || sla) && (
          <Link href="?" className="ml-auto text-xs text-muted-foreground hover:text-foreground underline">
            Clear filters
          </Link>
        )}
      </div>

      {/* Applications table */}
      <div className="ea-card overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <FileText className="h-10 w-10 mb-4" style={{ color: "rgba(255,255,255,0.1)" }} />
            <p className="font-bold">No applications found</p>
            <p className="text-sm text-muted-foreground mt-1">Try adjusting your filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                  {["Applicant", "Program / Title", "Type", "Status", "Submitted", "Action"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((app) => {
                  const cat = CAT_META[app.category]
                  const st = STATUS_META[app.status] ?? { label: app.status, color: "#94a3b8", bg: "rgba(148,163,184,0.1)" }
                  const hoursAgo = Math.floor((Date.now() - app.createdAt.getTime()) / 3600000)
                  const daysAgo  = Math.floor(hoursAgo / 24)
                  const timeLabel = daysAgo >= 1 ? `${daysAgo}d ago` : `${hoursAgo}h ago`
                  const isOpened = app.category === "opportunity"

                  return (
                    <tr key={`${app.category}-${app.id}`}
                      className="transition-colors hover:bg-white/[0.03]"
                      style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>

                      {/* Applicant */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-bold text-[11px]"
                            style={{ background: cat.bg, color: cat.color }}>
                            {(app.userName || "?")[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="text-[13px] font-semibold leading-tight">{app.userName || "—"}</p>
                            <p className="text-[11px] text-muted-foreground">{app.userEmail}</p>
                          </div>
                        </div>
                      </td>

                      {/* Program */}
                      <td className="px-4 py-3 max-w-xs">
                        <p className="text-[13px] font-medium truncate">{app.title}</p>
                        <p className="text-[11px] text-muted-foreground">{app.degreeOrType}</p>
                        <p className="text-[10px] font-mono" style={{ color: "rgba(255,255,255,0.2)" }}>
                          #{app.id.slice(0, 8)}
                        </p>
                      </td>

                      {/* Type */}
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold w-fit"
                          style={{ background: cat.bg, color: cat.color }}>
                          <cat.icon className="h-3 w-3" />
                          {cat.label}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <span className="rounded-full px-2 py-0.5 text-[11px] font-semibold w-fit"
                            style={{ background: st.bg, color: st.color }}>
                            {st.label}
                          </span>
                          {app.slaBreached && (
                            <span className="flex items-center gap-1 text-[10px] text-red-400">
                              <AlertCircle className="h-2.5 w-2.5" /> Overdue
                            </span>
                          )}
                          {app.feePaid === false && ["ACCEPTED","APPROVED"].includes(app.status) && (
                            <span className="flex items-center gap-1 text-[10px]" style={{ color: "#D4AF37" }}>
                              <DollarSign className="h-2.5 w-2.5" /> Payment pending
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Submitted */}
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {app.createdAt.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                        <br />
                        <span className="text-[10px]">{timeLabel}</span>
                      </td>

                      {/* Action */}
                      <td className="px-4 py-3">
                        <Link href={app.href}
                          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all hover:opacity-90"
                          style={{
                            background: isOpened ? "rgba(56,189,248,0.12)" : "rgba(255,255,255,0.07)",
                            color: isOpened ? "#38bdf8" : "rgba(255,255,255,0.6)",
                            border: isOpened ? "1px solid rgba(56,189,248,0.2)" : "1px solid rgba(255,255,255,0.07)",
                          }}>
                          {isOpened ? "Open Case" : "View"}
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Showing {filtered.length} of {allApps.length} applications
      </p>
    </div>
  )
}
