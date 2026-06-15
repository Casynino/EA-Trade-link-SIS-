import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import Link from "next/link"
import {
  Plus, MapPin, Calendar, Briefcase, GraduationCap, Globe, Factory,
  Star, Eye, Edit2, Users,
} from "lucide-react"
import { OppActions, ToggleActiveButton } from "./opp-actions"

export const dynamic = "force-dynamic"

const TYPE_META: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  SCHOLARSHIP:      { label: "Scholarship",      color: "#60a5fa", bg: "rgba(96,165,250,0.12)",  icon: GraduationCap },
  JOB:              { label: "Job",               color: "#34d399", bg: "rgba(52,211,153,0.12)",  icon: Briefcase },
  BUSINESS_VISA:    { label: "Business Visa",     color: "#a78bfa", bg: "rgba(167,139,250,0.12)", icon: Globe },
  FACTORY_VISIT:    { label: "Factory Visit",     color: "#fb923c", bg: "rgba(251,146,60,0.12)",  icon: Factory },
  CANTON_FAIR:      { label: "Canton Fair",       color: "#f87171", bg: "rgba(248,113,113,0.12)", icon: Star },
  TRADE_EXHIBITION: { label: "Trade Exhibition",  color: "#2dd4bf", bg: "rgba(45,212,191,0.12)",  icon: Globe },
  CONFERENCE:       { label: "Conference",        color: "#818cf8", bg: "rgba(129,140,248,0.12)", icon: Users },
  EXCHANGE:         { label: "Exchange Program",  color: "#facc15", bg: "rgba(250,204,21,0.12)",  icon: GraduationCap },
}

export default async function AdminOpportunitiesPage({ searchParams }: {
  searchParams: Promise<{ type?: string; q?: string; status?: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")
  const user = await db.user.findUnique({ where: { id: session.user.id! } })
  if (!user || !["ADMIN", "SUPER_ADMIN"].includes(user.role)) redirect("/dashboard")

  const sp = await searchParams
  const typeFilter   = sp.type   || "ALL"
  const statusFilter = sp.status || "ALL"
  const query        = sp.q?.toLowerCase() || ""

  const all = await db.opportunity.findMany({
    orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
    include: { _count: { select: { applications: true } } },
  })

  const filtered = all.filter((o) => {
    if (typeFilter !== "ALL" && o.type !== typeFilter) return false
    if (statusFilter === "ACTIVE"   && !o.isActive) return false
    if (statusFilter === "INACTIVE" &&  o.isActive) return false
    if (query && !o.title.toLowerCase().includes(query) && !o.organization.toLowerCase().includes(query)) return false
    return true
  })

  const counts = {
    total:    all.length,
    active:   all.filter(o => o.isActive).length,
    featured: all.filter(o => o.isFeatured).length,
    apps:     all.reduce((s, o) => s + o._count.applications, 0),
  }

  const types = [...new Set(all.map(o => o.type))]

  return (
    <div className="ea-page space-y-6">
      {/* Header */}
      <div className="ea-page-header">
        <div>
          <p className="ea-section-tag">Admin · Opportunity Feed</p>
          <h1 className="ea-page-title">Opportunities</h1>
          <p className="ea-page-sub">{filtered.length} of {counts.total} shown</p>
        </div>
        <Link
          href="/admin/opportunities/new"
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-all hover:scale-105"
          style={{ background: "#D4AF37", color: "#05091a" }}
        >
          <Plus className="h-4 w-4" /> New Opportunity
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total",    value: counts.total,    color: "#60a5fa" },
          { label: "Active",   value: counts.active,   color: "#34d399" },
          { label: "Featured", value: counts.featured, color: "#D4AF37" },
          { label: "Total Applications", value: counts.apps, color: "#a78bfa" },
        ].map(stat => (
          <div key={stat.label} className="ea-card p-4">
            <p className="text-2xl font-black" style={{ color: stat.color }}>{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Filters (server-side via URL) */}
      <div className="ea-card p-4 flex flex-wrap gap-3 items-center">
        <form method="GET" className="flex flex-wrap gap-2 w-full items-center">
          {/* Search */}
          <input
            name="q"
            defaultValue={query}
            placeholder="Search title or org…"
            className="rounded-xl px-3 py-2 text-sm outline-none flex-1 min-w-[180px]"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "white",
            }}
          />

          {/* Type filter */}
          <select
            name="type"
            defaultValue={typeFilter}
            className="rounded-xl px-3 py-2 text-sm outline-none"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "white",
            }}
          >
            <option value="ALL">All types</option>
            {types.map(t => (
              <option key={t} value={t}>{TYPE_META[t]?.label ?? t}</option>
            ))}
          </select>

          {/* Status filter */}
          <select
            name="status"
            defaultValue={statusFilter}
            className="rounded-xl px-3 py-2 text-sm outline-none"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "white",
            }}
          >
            <option value="ALL">All status</option>
            <option value="ACTIVE">Active only</option>
            <option value="INACTIVE">Hidden only</option>
          </select>

          <button
            type="submit"
            className="rounded-xl px-4 py-2 text-xs font-bold transition-all hover:opacity-90"
            style={{ background: "rgba(96,165,250,0.15)", color: "#60a5fa", border: "1px solid rgba(96,165,250,0.25)" }}
          >
            Filter
          </button>
          {(query || typeFilter !== "ALL" || statusFilter !== "ALL") && (
            <Link
              href="/admin/opportunities"
              className="rounded-xl px-3 py-2 text-xs font-medium"
              style={{ color: "rgba(255,255,255,0.4)" }}
            >
              Clear
            </Link>
          )}
        </form>
      </div>

      {/* Table */}
      <div className="ea-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                {["Opportunity", "Type", "Location", "Deadline", "Applications", "Active", "Actions"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-muted-foreground">
                    No opportunities match your filters.
                  </td>
                </tr>
              )}
              {filtered.map((opp) => {
                const meta = TYPE_META[opp.type] ?? { label: opp.type, color: "#94a3b8", bg: "rgba(148,163,184,0.12)", icon: Globe }
                const Icon = meta.icon
                return (
                  <tr
                    key={opp.id}
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                    className="transition-colors hover:bg-white/[0.025]"
                  >
                    {/* Title */}
                    <td className="px-4 py-3 max-w-xs">
                      <div className="flex items-center gap-3">
                        <div
                          className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
                          style={{ background: meta.bg }}
                        >
                          <Icon className="h-3.5 w-3.5" style={{ color: meta.color }} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold leading-snug truncate">{opp.title}</p>
                          <p className="text-[11px] text-muted-foreground truncate">{opp.organization}</p>
                        </div>
                        {opp.isFeatured && (
                          <Star className="h-3 w-3 text-yellow-400 fill-current shrink-0" />
                        )}
                      </div>
                    </td>

                    {/* Type */}
                    <td className="px-4 py-3">
                      <span
                        className="rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap"
                        style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.color}33` }}
                      >
                        {meta.label}
                      </span>
                    </td>

                    {/* Location */}
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
                        <MapPin className="h-3 w-3 shrink-0" />
                        {opp.location}
                      </span>
                    </td>

                    {/* Deadline */}
                    <td className="px-4 py-3">
                      {opp.deadline ? (
                        <span className="flex items-center gap-1 text-xs whitespace-nowrap"
                          style={{ color: new Date(opp.deadline) < new Date() ? "#f87171" : "rgba(251,146,60,0.9)" }}>
                          <Calendar className="h-3 w-3 shrink-0" />
                          {new Date(opp.deadline).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "2-digit" })}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground/40">—</span>
                      )}
                    </td>

                    {/* Applications */}
                    <td className="px-4 py-3">
                      <span
                        className="text-sm font-bold"
                        style={{ color: opp._count.applications > 0 ? "#a78bfa" : "rgba(255,255,255,0.25)" }}
                      >
                        {opp._count.applications}
                      </span>
                    </td>

                    {/* Toggle active */}
                    <td className="px-4 py-3">
                      <ToggleActiveButton id={opp.id} isActive={opp.isActive} />
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Link
                          href={`/admin/opportunities/${opp.id}/edit`}
                          className="rounded-lg p-1.5 transition-colors hover:bg-white/[0.08] text-white/40 hover:text-white/80"
                          title="Edit"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Link>
                        <Link
                          href={`/opportunities/${opp.id}`}
                          className="rounded-lg p-1.5 transition-colors hover:bg-white/[0.08] text-white/40 hover:text-white/80"
                          title="Preview"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Link>
                        <OppActions id={opp.id} isActive={opp.isActive} />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
