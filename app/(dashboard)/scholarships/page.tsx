import { requireRole } from "@/lib/role-guard"
import { db } from "@/lib/db"
import Link from "next/link"
import { GraduationCap, ArrowRight, Star, Clock, MapPin, Zap } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function ScholarshipsPage() {
  await requireRole(["STUDENT"])

  const scholarships = await db.opportunity.findMany({
    where: {
      isActive: true,
      type: "SCHOLARSHIP",
      OR: [
        { targetAudience: { contains: "STUDENT" } },
        { targetAudience: { contains: "ALL" } },
      ],
    },
    orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
  })

  const bachelor = scholarships.filter((s) => s.degreeLevel === "BACHELOR").length
  const master   = scholarships.filter((s) => s.degreeLevel === "MASTER").length
  const phd      = scholarships.filter((s) => s.degreeLevel === "PHD").length

  return (
    <div className="ea-page space-y-6">
      {/* Header */}
      <div className="ea-page-header">
        <div>
          <p className="ea-section-tag text-sky-500">Study Applications</p>
          <h1 className="ea-page-title">Scholarship Opportunities</h1>
          <p className="ea-page-sub">{scholarships.length} programs available · September 2026 intake</p>
        </div>
        <Link href="/dashboard/applications"
          className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all hover:bg-muted"
          style={{ borderColor: "rgba(255,255,255,0.1)" }}>
          My Applications
        </Link>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Programs", value: scholarships.length, color: "#38bdf8" },
          { label: "Bachelor",       value: bachelor,            color: "#38bdf8" },
          { label: "Master",         value: master,              color: "#a78bfa" },
          { label: "PhD",            value: phd,                 color: "#f472b6" },
        ].map((stat) => (
          <div key={stat.label} className="ea-card flex items-center gap-3 p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
              style={{ background: stat.color + "18" }}>
              <GraduationCap className="h-4 w-4" style={{ color: stat.color }} />
            </div>
            <div>
              <p className="text-lg font-black" style={{ color: stat.color }}>{stat.value}</p>
              <p className="text-[11px] text-muted-foreground">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Cards grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {scholarships.map((s) => {
          const tags: string[] = (() => { try { return JSON.parse(s.tags || "[]") } catch { return [] } })()
          const isFullFunded = tags.some((t) => t.includes("fully-funded"))
          const levelColor =
            s.degreeLevel === "MASTER" ? "#a78bfa" :
            s.degreeLevel === "PHD"    ? "#f472b6" : "#38bdf8"

          return (
            <Link key={s.id} href={`/opportunities/${s.id}`}>
              <div className="ea-card h-full flex flex-col hover:border-white/20 transition-all group">
                {/* Level bar */}
                <div className="h-1 rounded-t-2xl" style={{ background: `linear-gradient(90deg,${levelColor},${levelColor}30)` }} />

                <div className="p-5 flex flex-col flex-1 gap-3">
                  {/* Badges */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="rounded-full px-2.5 py-0.5 text-[11px] font-bold"
                      style={{ background: levelColor + "18", color: levelColor }}>
                      {s.degreeLevel ?? "Scholarship"}
                    </span>
                    {s.isFeatured && (
                      <span className="flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                        style={{ background: "rgba(212,175,55,0.12)", color: "#D4AF37" }}>
                        <Star className="h-2.5 w-2.5 fill-current" /> Featured
                      </span>
                    )}
                    {isFullFunded && (
                      <span className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold bg-green-500/10 text-green-400">
                        Fully Funded
                      </span>
                    )}
                    {s.slots && s.slots <= 10 && (
                      <span className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold bg-red-500/10 text-red-400">
                        {s.slots} slots left
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="font-bold text-[14px] leading-snug group-hover:text-primary transition-colors">
                    {s.title}
                  </h3>

                  {/* Location */}
                  <p className="text-xs flex items-center gap-1 text-muted-foreground">
                    <MapPin className="h-3 w-3 shrink-0" />
                    {s.organization}
                  </p>

                  {/* Description */}
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 flex-1">
                    {s.description}
                  </p>

                  {/* Benefit chips */}
                  {(s.tuitionCovered || s.livingAllowance || s.flightTicket) && (
                    <div className="flex flex-wrap gap-1">
                      {s.tuitionCovered && <span className="rounded-full px-2 py-0.5 text-[10px] font-medium" style={{ background: "rgba(56,189,248,0.15)", color: "#38bdf8" }}>Tuition</span>}
                      {s.livingAllowance && <span className="rounded-full px-2 py-0.5 text-[10px] font-medium" style={{ background: "rgba(52,211,153,0.15)", color: "#34d399" }}>Stipend</span>}
                      {s.flightTicket    && <span className="rounded-full px-2 py-0.5 text-[10px] font-medium" style={{ background: "rgba(167,139,250,0.15)", color: "#a78bfa" }}>Flight</span>}
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-2 border-t border-border/40 mt-auto">
                    <span className="text-[11px] text-muted-foreground">
                      {s.slots ? `${s.slots} slots` : "Open slots"}
                    </span>
                    <span className="flex items-center gap-1 text-xs font-semibold group-hover:gap-2 transition-all" style={{ color: "#D4AF37" }}>
                      View Details <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
