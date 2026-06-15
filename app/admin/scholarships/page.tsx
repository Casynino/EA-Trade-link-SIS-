import { requireRole } from "@/lib/role-guard"
import { db } from "@/lib/db"
import Link from "next/link"
import { GraduationCap, MapPin, Users, Star, Plus } from "lucide-react"
import { LEVEL_META, type ScholarshipLevel } from "@/types/scholarship"
import { AdminScholarshipToggle } from "./toggle"
import { SyncFeedButton } from "./sync-button"

export const dynamic = "force-dynamic"

async function getScholarshipsWithStats() {
  const scholarships = await db.scholarship.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    include: { _count: { select: { scholarshipApplications: true } } },
  })
  return scholarships.map((s) => ({
    id: s.id,
    title: s.title,
    level: s.level as ScholarshipLevel,
    city: s.city,
    intake: s.intake,
    duration: s.duration,
    isActive: s.isActive,
    isFeatured: s.isFeatured,
    slots: s.slots,
    applicationCount: s._count.scholarshipApplications,
    majors: JSON.parse(s.majorsJson || "[]") as string[],
  }))
}

export default async function AdminScholarshipsPage() {
  await requireRole(["STUDENT"]) // admins always pass in requireRole; this just ensures auth
  const scholarships = await getScholarshipsWithStats()

  const totalApps = scholarships.reduce((s, r) => s + r.applicationCount, 0)

  return (
    <div className="ea-page space-y-6">
      <div className="ea-page-header">
        <div>
          <p className="ea-section-tag">Admin · Study Applications</p>
          <h1 className="ea-page-title">Scholarship Programs</h1>
          <p className="ea-page-sub">{scholarships.length} programs · {totalApps} total applications</p>
        </div>
        <div className="flex items-center gap-2">
          <SyncFeedButton />
          <Link href="/admin/scholarships/new"
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-all hover:scale-105"
            style={{ background: "#38bdf8", color: "#05091a" }}>
            <Plus className="h-4 w-4" /> Add Program
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Active",    value: scholarships.filter(s=>s.isActive).length,   color: "#34d399" },
          { label: "Featured",  value: scholarships.filter(s=>s.isFeatured).length, color: "#D4AF37" },
          { label: "Bachelor",  value: scholarships.filter(s=>s.level==="BACHELOR").length, color: "#38bdf8" },
          { label: "Applications", value: totalApps,                                color: "#a78bfa" },
        ].map((stat) => (
          <div key={stat.label} className="ea-card p-4">
            <p className="text-2xl font-black" style={{ color: stat.color }}>{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="ea-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50">
                {["Program", "Level", "City", "Intake", "Majors", "Applications", "Status", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {scholarships.map((s) => {
                const level = LEVEL_META[s.level]
                return (
                  <tr key={s.id} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {s.isFeatured && <Star className="h-3 w-3 text-yellow-400 fill-current shrink-0" />}
                        <div>
                          <p className="text-sm font-semibold leading-snug max-w-xs">{s.title}</p>
                          {s.slots && (
                            <p className="text-[11px] text-red-400 flex items-center gap-1">
                              <Users className="h-2.5 w-2.5" /> {s.slots} slots
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
                        style={{ background: level.bg, color: level.color }}>
                        {level.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" /> {s.city}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{s.intake}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {s.majors.slice(0, 2).map((m) => (
                          <span key={m} className="rounded px-1.5 py-0.5 text-[10px] bg-muted/50 text-muted-foreground">{m}</span>
                        ))}
                        {s.majors.length > 2 && (
                          <span className="text-[10px] text-muted-foreground">+{s.majors.length - 2}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-bold" style={{ color: s.applicationCount > 0 ? "#a78bfa" : undefined }}>
                        {s.applicationCount}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        s.isActive ? "bg-green-500/10 text-green-400" : "bg-muted text-muted-foreground"
                      }`}>
                        {s.isActive ? "Active" : "Hidden"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link href={`/scholarships/${s.id}`}
                          className="rounded p-1.5 hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
                          title="Preview">
                          <GraduationCap className="h-3.5 w-3.5" />
                        </Link>
                        <AdminScholarshipToggle
                          id={s.id}
                          isActive={s.isActive}
                          isFeatured={s.isFeatured}
                        />
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
