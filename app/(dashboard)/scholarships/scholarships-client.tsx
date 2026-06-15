"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { MapPin, Star, ArrowRight, Search, Users, BookOpen } from "lucide-react"
import { LEVEL_META, type ScholarshipLevel } from "@/types/scholarship"

type ScholarshipCard = {
  id: string
  title: string
  level: ScholarshipLevel
  city: string
  intake: string
  duration: string
  language: string
  overview: string
  isFeatured: boolean
  slots: number | null
  majors: string[]
  tags: string[]
  financials: Record<string, unknown>
}

const LEVEL_FILTERS: { value: string; label: string }[] = [
  { value: "ALL", label: "All Levels" },
  { value: "BACHELOR", label: "Bachelor" },
  { value: "MASTER", label: "Master" },
  { value: "PHD", label: "PhD" },
]

export function ScholarshipsClient({
  scholarships,
  appliedMap,
  cities,
}: {
  scholarships: ScholarshipCard[]
  appliedMap: Record<string, string>
  cities: string[]
}) {
  const [levelFilter, setLevelFilter] = useState("ALL")
  const [cityFilter, setCityFilter] = useState("ALL")
  const [search, setSearch] = useState("")

  const filtered = useMemo(() => {
    let list = scholarships
    if (levelFilter !== "ALL") list = list.filter((s) => s.level === levelFilter)
    if (cityFilter !== "ALL") list = list.filter((s) => s.city === cityFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.city.toLowerCase().includes(q) ||
          s.majors.some((m) => m.toLowerCase().includes(q)) ||
          s.tags.some((t) => t.toLowerCase().includes(q))
      )
    }
    return list
  }, [scholarships, levelFilter, cityFilter, search])

  return (
    <div className="space-y-5">
      {/* Filters bar */}
      <div className="ea-card p-4 flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by major, city, or keyword…"
            className="w-full rounded-lg bg-muted/40 pl-9 pr-4 py-2 text-sm outline-none focus:ring-1 focus:ring-sky-500/40"
          />
        </div>

        {/* Level filter */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {LEVEL_FILTERS.map((f) => {
            const meta = f.value !== "ALL" ? LEVEL_META[f.value as ScholarshipLevel] : null
            const active = levelFilter === f.value
            return (
              <button
                key={f.value}
                onClick={() => setLevelFilter(f.value)}
                className="rounded-full px-3 py-1 text-xs font-semibold transition-all"
                style={active && meta
                  ? { background: meta.bg, color: meta.color, border: `1px solid ${meta.border}` }
                  : active
                  ? { background: "rgba(255,255,255,0.1)", color: "white", border: "1px solid rgba(255,255,255,0.2)" }
                  : { background: "transparent", color: "var(--muted-foreground)", border: "1px solid rgba(255,255,255,0.08)" }
                }
              >
                {f.label}
              </button>
            )
          })}
        </div>

        {/* City filter */}
        <select
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
          className="rounded-lg bg-muted/40 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-sky-500/40"
        >
          <option value="ALL">All Cities</option>
          {cities.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Results count */}
      <p className="text-xs text-muted-foreground px-0.5">
        {filtered.length} program{filtered.length !== 1 ? "s" : ""} found
        {levelFilter !== "ALL" && ` · ${levelFilter.charAt(0) + levelFilter.slice(1).toLowerCase()}`}
        {cityFilter !== "ALL" && ` · ${cityFilter}`}
        {search && ` · "${search}"`}
      </p>

      {/* Cards grid */}
      {filtered.length === 0 ? (
        <div className="ea-card flex flex-col items-center justify-center py-20 text-center">
          <Search className="h-10 w-10 text-muted-foreground/30 mb-4" />
          <h3 className="font-bold mb-1">No programs match your search</h3>
          <p className="text-sm text-muted-foreground">Try a different level, city, or keyword.</p>
          <button onClick={() => { setSearch(""); setLevelFilter("ALL"); setCityFilter("ALL") }}
            className="mt-4 text-xs text-sky-400 hover:underline">
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((s) => {
            const level = LEVEL_META[s.level]
            const applied = appliedMap[s.id]
            const hasStipend = (s.financials as Record<string, unknown>).stipend
            const isFullFunded = s.tags.includes("fully-funded") || s.tags.includes("fully-funded-tuition")

            return (
              <div key={s.id}
                className="ea-card overflow-hidden flex flex-col hover:shadow-lg transition-all hover:-translate-y-0.5 group">
                {/* Color band */}
                <div className="h-1 w-full" style={{ background: `linear-gradient(90deg,${level.color}80,${level.color}20)` }} />

                <div className="p-5 flex flex-col flex-1 gap-3">
                  {/* Badges */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                      style={{ background: level.bg, color: level.color }}>
                      {level.label}
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
                      <span className="flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold bg-red-500/10 text-red-400">
                        <Users className="h-2.5 w-2.5" /> {s.slots} slots
                      </span>
                    )}
                    {applied && (
                      <span className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold bg-green-500/15 text-green-400">
                        ✓ Applied
                      </span>
                    )}
                  </div>

                  {/* Title + location */}
                  <div>
                    <h3 className="font-bold text-sm leading-snug mb-1 group-hover:text-sky-400 transition-colors">
                      {s.title}
                    </h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3 shrink-0" />
                      {s.city} · China
                    </p>
                  </div>

                  {/* Overview */}
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed flex-1">
                    {s.overview}
                  </p>

                  {/* Majors preview */}
                  {s.majors.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {s.majors.slice(0, 3).map((m) => (
                        <span key={m} className="rounded px-1.5 py-0.5 text-[10px] bg-muted/50 text-muted-foreground">
                          {m}
                        </span>
                      ))}
                      {s.majors.length > 3 && (
                        <span className="rounded px-1.5 py-0.5 text-[10px] bg-muted/30 text-muted-foreground">
                          +{s.majors.length - 3} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Meta row */}
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                    <span>📅 {s.intake}</span>
                    <span>⏱ {s.duration}</span>
                    {hasStipend ? <span>💰 Stipend</span> : null}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-2 border-t border-border/50 mt-auto">
                    <span className="text-[11px] text-muted-foreground">{s.language}</span>
                    {applied ? (
                      <Link href="/dashboard/applications"
                        className="text-xs font-semibold text-green-400 hover:underline flex items-center gap-1">
                        View Status <ArrowRight className="h-3 w-3" />
                      </Link>
                    ) : (
                      <Link href={`/scholarships/${s.id}`}
                        className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold transition-all hover:opacity-90"
                        style={{ background: level.color + "18", color: level.color, border: `1px solid ${level.border}` }}>
                        View Details <ArrowRight className="h-3 w-3" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
