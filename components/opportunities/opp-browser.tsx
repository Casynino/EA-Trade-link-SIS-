"use client"

import { useState, useMemo } from "react"
import { OppCard, OppCardSkeleton } from "./opp-card"
import { TYPE_CONFIG } from "@/lib/opp-types"
import { Input } from "@/components/ui/input"
import { Search, SlidersHorizontal, X } from "lucide-react"

const FILTERS = [
  { value: "ALL",              label: "All",          emoji: "✨" },
  { value: "SCHOLARSHIP",     label: "Scholarships", emoji: "🎓" },
  { value: "JOB",             label: "Jobs",         emoji: "💼" },
  { value: "BUSINESS_VISA",   label: "Visa",         emoji: "✈️" },
  { value: "FACTORY_VISIT",   label: "Factory Tours",emoji: "🏭" },
  { value: "CANTON_FAIR",     label: "Canton Fair",  emoji: "🏪" },
  { value: "TRADE_EXHIBITION",label: "Trade Expos",  emoji: "📊" },
  { value: "CONFERENCE",      label: "Conferences",  emoji: "🤝" },
]

export function OppBrowser({ opportunities }: { opportunities: any[] }) {
  const [activeFilter, setActiveFilter] = useState("ALL")
  const [search, setSearch] = useState("")

  const filtered = useMemo(() => {
    let list = opportunities
    if (activeFilter !== "ALL") list = list.filter((o) => o.type === activeFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (o) =>
          o.title.toLowerCase().includes(q) ||
          o.organization.toLowerCase().includes(q) ||
          o.description.toLowerCase().includes(q) ||
          o.location.toLowerCase().includes(q)
      )
    }
    return list
  }, [opportunities, activeFilter, search])

  const counts = useMemo(() => {
    const c: Record<string, number> = { ALL: opportunities.length }
    opportunities.forEach((o) => { c[o.type] = (c[o.type] ?? 0) + 1 })
    return c
  }, [opportunities])

  return (
    <div className="space-y-6">
      {/* Search + filter bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "rgba(255,255,255,0.35)" }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search opportunities…"
            className="w-full rounded-xl pl-9 pr-9 py-2.5 text-sm outline-none transition-all"
            style={{
              background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "white",
            }}
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "rgba(255,255,255,0.4)" }}>
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <p className="text-sm shrink-0" style={{ color: "rgba(255,255,255,0.4)" }}>
          {filtered.length} opportunit{filtered.length !== 1 ? "ies" : "y"}
        </p>
      </div>

      {/* Type filter pills */}
      <div className="flex gap-2 flex-wrap">
        {FILTERS.map((f) => {
          const count = counts[f.value] ?? 0
          if (f.value !== "ALL" && count === 0) return null
          const active = activeFilter === f.value
          return (
            <button
              key={f.value}
              onClick={() => setActiveFilter(f.value)}
              className="flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-all"
              style={active
                ? { background: "#D4AF37", color: "#05091a", border: "1px solid #D4AF37" }
                : { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.65)", border: "1px solid rgba(255,255,255,0.1)" }
              }
            >
              <span>{f.emoji}</span>
              <span>{f.label}</span>
              <span
                className="rounded-full px-1.5 py-0.5 text-[10px] font-bold"
                style={active ? { background: "rgba(0,0,0,0.2)", color: "#05091a" } : { background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}
              >
                {f.value === "ALL" ? counts.ALL : (counts[f.value] ?? 0)}
              </span>
            </button>
          )
        })}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-4xl mb-3">🔍</p>
          <p className="font-semibold" style={{ color: "rgba(255,255,255,0.8)" }}>No opportunities found</p>
          <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>Try a different filter or search term</p>
          <button onClick={() => { setActiveFilter("ALL"); setSearch("") }} className="mt-4 text-sm hover:underline" style={{ color: "#D4AF37" }}>
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((opp) => (
            <OppCard key={opp.id} opp={opp} />
          ))}
        </div>
      )}
    </div>
  )
}
