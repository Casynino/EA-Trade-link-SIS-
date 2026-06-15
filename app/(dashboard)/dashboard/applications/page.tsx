import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import Link from "next/link"
import { StarfieldBg } from "@/components/ui/starfield-bg"
import {
  GraduationCap, Briefcase, Plane, Factory, Calendar, Star,
  ChevronRight, AlertCircle, Plus, Clock, CheckCircle2, FileText,
} from "lucide-react"

export const dynamic = "force-dynamic"

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS: Record<string, { label: string; color: string; glow: string; bg: string; border: string }> = {
  SUBMITTED:          { label: "Submitted",    color: "#60a5fa", glow: "rgba(96,165,250,0.25)",  bg: "rgba(96,165,250,0.10)",  border: "rgba(96,165,250,0.22)"  },
  UNDER_REVIEW:       { label: "Under Review", color: "#fbbf24", glow: "rgba(251,191,36,0.25)",  bg: "rgba(251,191,36,0.10)",  border: "rgba(251,191,36,0.22)"  },
  DOCUMENTS_REQUIRED: { label: "Docs Needed",  color: "#fb923c", glow: "rgba(251,146,60,0.25)",  bg: "rgba(251,146,60,0.10)",  border: "rgba(251,146,60,0.22)"  },
  SHORTLISTED:        { label: "Shortlisted",  color: "#c084fc", glow: "rgba(192,132,252,0.25)", bg: "rgba(192,132,252,0.10)", border: "rgba(192,132,252,0.22)" },
  ACCEPTED:           { label: "Approved",          color: "#34d399", glow: "rgba(52,211,153,0.25)",  bg: "rgba(52,211,153,0.10)",  border: "rgba(52,211,153,0.22)"  },
  PAYMENT_PENDING:    { label: "Payment Required",  color: "#D4AF37", glow: "rgba(212,175,55,0.25)",  bg: "rgba(212,175,55,0.10)",  border: "rgba(212,175,55,0.22)"  },
  PAYMENT_COMPLETED:  { label: "Payment Confirmed", color: "#34d399", glow: "rgba(52,211,153,0.25)",  bg: "rgba(52,211,153,0.10)",  border: "rgba(52,211,153,0.22)"  },
  PROCESSING:         { label: "Processing",        color: "#a78bfa", glow: "rgba(167,139,250,0.25)", bg: "rgba(167,139,250,0.10)", border: "rgba(167,139,250,0.22)" },
  COMPLETED:          { label: "Completed",    color: "#34d399", glow: "rgba(52,211,153,0.25)",  bg: "rgba(52,211,153,0.10)",  border: "rgba(52,211,153,0.22)"  },
  REJECTED:           { label: "Unsuccessful", color: "#f87171", glow: "rgba(248,113,113,0.25)", bg: "rgba(248,113,113,0.10)", border: "rgba(248,113,113,0.22)" },
  CANCELLED:          { label: "Cancelled",    color: "#6b7280", glow: "rgba(107,114,128,0.15)", bg: "rgba(107,114,128,0.08)", border: "rgba(107,114,128,0.18)" },
  INTERESTED:         { label: "Interested",   color: "#60a5fa", glow: "rgba(96,165,250,0.25)",  bg: "rgba(96,165,250,0.10)",  border: "rgba(96,165,250,0.22)"  },
  MATCHED:            { label: "Matched",      color: "#c084fc", glow: "rgba(192,132,252,0.25)", bg: "rgba(192,132,252,0.10)", border: "rgba(192,132,252,0.22)" },
  APPROVED:           { label: "Approved",     color: "#34d399", glow: "rgba(52,211,153,0.25)",  bg: "rgba(52,211,153,0.10)",  border: "rgba(52,211,153,0.22)"  },
}

const ICON_MAP: Record<string, React.ElementType> = {
  SCHOLARSHIP: GraduationCap, JOB: Briefcase, BUSINESS_VISA: Plane,
  FACTORY_VISIT: Factory, CANTON_FAIR: Calendar, TRADE_EXHIBITION: Calendar, CONFERENCE: Calendar,
}

// Icon background color by type
const ICON_COLOR: Record<string, { bg: string; color: string }> = {
  SCHOLARSHIP:     { bg: "rgba(192,132,252,0.15)", color: "#c084fc" },
  JOB:             { bg: "rgba(96,165,250,0.15)",  color: "#60a5fa" },
  BUSINESS_VISA:   { bg: "rgba(212,175,55,0.15)",  color: "#D4AF37" },
  FACTORY_VISIT:   { bg: "rgba(52,211,153,0.15)",  color: "#34d399" },
  CANTON_FAIR:     { bg: "rgba(251,146,60,0.15)",  color: "#fb923c" },
  TRADE_EXHIBITION:{ bg: "rgba(251,146,60,0.15)",  color: "#fb923c" },
  CONFERENCE:      { bg: "rgba(251,146,60,0.15)",  color: "#fb923c" },
}

function fmt(d: Date | string) {
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
}

interface AppRow {
  id: string
  type: "application" | "visa" | "study" | "scholarship"
  title: string
  org: string
  oppType: string
  status: string
  date: Date
  slaBreached?: boolean
  href: string
}

export default async function ApplicationsPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const uid = session.user.id

  const [apps, visaApps, studyApps, scholApps] = await Promise.all([
    db.application.findMany({
      where: { userId: uid },
      include: { opportunity: { select: { title: true, organization: true, type: true } } },
      orderBy: { createdAt: "desc" },
    }),
    db.visaApplication.findMany({ where: { userId: uid }, orderBy: { createdAt: "desc" } }),
    db.studyApplication.findMany({ where: { userId: uid }, orderBy: { createdAt: "desc" } }),
    db.scholarshipApplication.findMany({
      where: { userId: uid },
      include: { scholarship: { select: { title: true, level: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ])

  const rows: AppRow[] = [
    ...apps.map((a) => ({
      id: a.id, type: "application" as const,
      title: a.opportunity.title, org: a.opportunity.organization,
      oppType: a.opportunity.type, status: a.status, date: a.createdAt,
      slaBreached: a.slaBreached, href: `/dashboard/applications/${a.id}`,
    })),
    ...visaApps.map((v) => ({
      id: v.id, type: "visa" as const,
      title: "Business Visa Application", org: v.companyName ?? "EA Trade Link",
      oppType: "BUSINESS_VISA", status: v.status, date: v.createdAt,
      slaBreached: v.slaBreached, href: `/dashboard/applications/${v.id}`,
    })),
    ...studyApps.map((s) => ({
      id: s.id, type: "study" as const,
      title: `Study in China — ${s.degreeLevel}`, org: s.preferredUniversities ?? "EA Trade Link",
      oppType: "SCHOLARSHIP", status: s.status, date: s.createdAt,
      slaBreached: s.slaBreached, href: `/dashboard/applications/${s.id}`,
    })),
    ...scholApps.map((sc) => ({
      id: sc.id, type: "scholarship" as const,
      title: sc.scholarship.title, org: `${sc.scholarship.level} Scholarship`,
      oppType: "SCHOLARSHIP", status: sc.status, date: sc.createdAt,
      slaBreached: false, href: `/dashboard/applications/${sc.id}`,
    })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime())

  // Quick stats
  const total    = rows.length
  const pending  = rows.filter(r => ["SUBMITTED","UNDER_REVIEW","PROCESSING","DOCUMENTS_REQUIRED","PAYMENT_PENDING","PAYMENT_COMPLETED"].includes(r.status)).length
  const approved = rows.filter(r => ["ACCEPTED","APPROVED","COMPLETED"].includes(r.status)).length
  const sla      = rows.filter(r => r.slaBreached).length

  return (
    <div className="relative min-h-screen">

      {/* Animated star field ─ fixed behind everything */}
      <StarfieldBg opacity={0.85} />

      {/* Top accent line */}
      <div className="fixed top-0 left-0 right-0 h-[1px] z-20 pointer-events-none"
        style={{ background: "linear-gradient(to right, transparent 15%, rgba(212,175,55,0.4) 50%, transparent 85%)" }} />

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-3xl px-4 py-10 space-y-8">

        {/* ── Page header ─────────────────────────────────────────────────────── */}
        <div className="ea-animate-in">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="ea-section-tag mb-1">Your Portfolio</p>
              <h1 className="text-3xl font-black tracking-tight text-white">My Applications</h1>
              <p className="text-sm mt-1.5" style={{ color: "rgba(255,255,255,0.35)" }}>
                {total} application{total !== 1 ? "s" : ""} across all EA Trade Link services
              </p>
            </div>
            <Link href="/apply-visa"
              className="flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold shrink-0 transition-all hover:opacity-90 hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: "linear-gradient(135deg, #C8102E 0%, #a00d24 100%)", color: "#fff", boxShadow: "0 4px 20px rgba(200,16,46,0.35)" }}>
              <Plus className="h-4 w-4" /> New Application
            </Link>
          </div>
        </div>

        {/* ── Stats strip ─────────────────────────────────────────────────────── */}
        {total > 0 && (
          <div className="ea-animate-in ea-animate-in-delay-1 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Total",    value: total,    icon: FileText,     color: "#60a5fa",  bg: "rgba(96,165,250,0.10)"  },
              { label: "Pending",  value: pending,  icon: Clock,        color: "#fbbf24",  bg: "rgba(251,191,36,0.10)"  },
              { label: "Approved", value: approved, icon: CheckCircle2, color: "#34d399",  bg: "rgba(52,211,153,0.10)"  },
              { label: "SLA Alert",value: sla,      icon: AlertCircle,  color: "#f87171",  bg: "rgba(248,113,113,0.10)" },
            ].map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} className="rounded-2xl p-4 flex items-center gap-3" style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.07)",
                backdropFilter: "blur(8px)",
              }}>
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ background: bg }}>
                  <Icon className="h-4 w-4" style={{ color }} />
                </div>
                <div>
                  <p className="text-xl font-black leading-none" style={{ color }}>{value}</p>
                  <p className="text-[11px] mt-0.5 font-medium" style={{ color: "rgba(255,255,255,0.3)" }}>{label}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Empty state ──────────────────────────────────────────────────────── */}
        {rows.length === 0 && (
          <div className="ea-animate-in ea-animate-in-delay-1 flex flex-col items-center justify-center py-20 rounded-3xl text-center" style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px dashed rgba(255,255,255,0.09)",
          }}>
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl"
              style={{ background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.15)" }}>
              <Star className="h-8 w-8" style={{ color: "rgba(212,175,55,0.5)" }} />
            </div>
            <p className="text-lg font-black text-white mb-1">No applications yet</p>
            <p className="text-sm mb-7" style={{ color: "rgba(255,255,255,0.3)" }}>
              Submit your first application and it will appear here.
            </p>
            <Link href="/apply-visa"
              className="inline-flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-bold transition-all hover:opacity-90"
              style={{ background: "#C8102E", color: "#fff", boxShadow: "0 4px 16px rgba(200,16,46,0.3)" }}>
              <Plus className="h-4 w-4" /> Get Started
            </Link>
          </div>
        )}

        {/* ── Applications list ────────────────────────────────────────────────── */}
        {rows.length > 0 && (
          <div className="ea-animate-in ea-animate-in-delay-2 space-y-3">
            {rows.map((app, i) => {
              const st  = STATUS[app.status] ?? STATUS.SUBMITTED
              const ic  = ICON_COLOR[app.oppType] ?? { bg: "rgba(212,175,55,0.12)", color: "#D4AF37" }
              const Icon = ICON_MAP[app.oppType] ?? Star
              return (
                <Link
                  key={`${app.type}-${app.id}`}
                  href={app.href}
                  className="group relative flex items-center gap-4 rounded-2xl p-4 transition-all duration-200 hover:-translate-y-0.5"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    backdropFilter: "blur(12px)",
                    animationDelay: `${i * 0.04}s`,
                  }}
                >
                  {/* Hover glow */}
                  <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
                    style={{ background: `radial-gradient(ellipse 60% 80% at 10% 50%, ${st.glow.replace("0.25", "0.06")} 0%, transparent 70%)` }} />

                  {/* Type icon */}
                  <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl transition-transform duration-200 group-hover:scale-105"
                    style={{ background: ic.bg, border: `1px solid ${ic.color}22` }}>
                    <Icon className="h-6 w-6" style={{ color: ic.color }} />
                    {/* Status dot */}
                    <div className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full flex items-center justify-center"
                      style={{ background: st.bg, border: `1.5px solid ${st.color}`, boxShadow: `0 0 6px ${st.glow}` }}>
                      <div className="h-1.5 w-1.5 rounded-full" style={{ background: st.color }} />
                    </div>
                  </div>

                  {/* Main info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      {app.slaBreached && (
                        <div className="flex items-center gap-1 rounded-full px-2 py-0.5 shrink-0"
                          style={{ background: "rgba(248,113,113,0.10)", border: "1px solid rgba(248,113,113,0.2)" }}>
                          <AlertCircle className="h-2.5 w-2.5 text-red-400" />
                          <span className="text-[9px] font-bold text-red-400">SLA</span>
                        </div>
                      )}
                      <p className="font-bold text-sm text-white truncate leading-snug">{app.title}</p>
                    </div>
                    <p className="text-xs truncate" style={{ color: "rgba(255,255,255,0.35)" }}>{app.org}</p>
                    <p className="text-[11px] mt-1 font-medium" style={{ color: "rgba(255,255,255,0.2)" }}>{fmt(app.date)}</p>
                  </div>

                  {/* Status badge + chevron */}
                  <div className="flex items-center gap-2.5 shrink-0">
                    <span className="rounded-xl px-3 py-1.5 text-[11px] font-bold transition-all group-hover:shadow-lg"
                      style={{
                        background: st.bg,
                        color: st.color,
                        border: `1px solid ${st.border}`,
                        boxShadow: `0 0 0 0 ${st.glow}`,
                      }}>
                      {st.label}
                    </span>
                    <ChevronRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
                      style={{ color: "rgba(255,255,255,0.18)" }} />
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        {/* ── Bottom hint ─────────────────────────────────────────────────────── */}
        {rows.length > 0 && (
          <p className="ea-animate-in ea-animate-in-delay-3 text-center text-[11px] pb-4"
            style={{ color: "rgba(255,255,255,0.15)" }}>
            Click any application to view full details and track progress
          </p>
        )}
      </div>
    </div>
  )
}
