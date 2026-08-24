"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { Search, Link2, Loader2, CheckCircle2, X, GraduationCap, MapPin, Building2 } from "lucide-react"

export interface MatchableOpportunity {
  id: string
  title: string
  organization: string
  location: string
  type: string
  degreeLevel: string | null
  fieldOfStudy: string | null
}

/**
 * FLOW A only — lets an admin match a general study application to a published
 * opportunity. The student sees these details only after approval.
 */
export function MatchOpportunity({
  applicationId,
  opportunities,
  currentMatchId,
  currentMatchTitle,
}: {
  applicationId: string
  opportunities: MatchableOpportunity[]
  currentMatchId: string | null
  currentMatchTitle: string | null
}) {
  const router = useRouter()
  const { toast } = useToast()
  const [query, setQuery] = useState("")
  const [saving, setSaving] = useState(false)
  const [open, setOpen] = useState(false)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return opportunities.slice(0, 8)
    return opportunities
      .filter(o =>
        o.title.toLowerCase().includes(q) ||
        o.organization.toLowerCase().includes(q) ||
        (o.degreeLevel ?? "").toLowerCase().includes(q) ||
        (o.fieldOfStudy ?? "").toLowerCase().includes(q) ||
        o.location.toLowerCase().includes(q))
      .slice(0, 12)
  }, [query, opportunities])

  async function assign(opportunityId: string | null) {
    setSaving(true)
    try {
      const res = await fetch(`/api/study/applications/${applicationId}/match`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          opportunityId,
          // Matching moves the case forward, but does NOT approve it and does NOT
          // request payment — the admin still does that explicitly.
          ...(opportunityId ? { status: "MATCHED" } : {}),
        }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || "Could not save the match")
      }
      toast({
        title: opportunityId ? "Opportunity matched" : "Match removed",
        description: opportunityId
          ? "The applicant is now linked to this programme. Approve the application to reveal it to them."
          : "This application is no longer linked to an opportunity.",
      })
      setOpen(false)
      setQuery("")
      router.refresh()
    } catch (e: any) {
      toast({ title: "Failed", description: e.message, variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-2xl p-4 space-y-3"
      style={{ background: "rgba(167,139,250,0.06)", border: "1px solid rgba(167,139,250,0.22)" }}>
      <div className="flex items-center gap-2">
        <Link2 className="h-4 w-4" style={{ color: "#a78bfa" }} />
        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "#a78bfa" }}>
          Match to Opportunity
        </p>
      </div>

      {currentMatchId ? (
        <div className="rounded-xl p-3 space-y-2"
          style={{ background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.22)" }}>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "#34d399" }} />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: "rgba(52,211,153,0.7)" }}>
                Currently matched
              </p>
              <p className="text-sm font-semibold text-white leading-snug">{currentMatchTitle}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setOpen(o => !o)} disabled={saving}
              className="flex-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold disabled:opacity-50"
              style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.12)" }}>
              Change
            </button>
            <button onClick={() => assign(null)} disabled={saving}
              className="rounded-lg px-2.5 py-1.5 text-xs font-semibold disabled:opacity-50"
              style={{ background: "rgba(248,113,113,0.1)", color: "#f87171", border: "1px solid rgba(248,113,113,0.22)" }}>
              <X className="h-3 w-3" />
            </button>
          </div>
        </div>
      ) : (
        <>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>
            This applicant did not choose a programme. Review their profile and assign the
            opportunity that fits them best.
          </p>
          {!open && (
            <button onClick={() => setOpen(true)}
              className="w-full rounded-lg px-3 py-2 text-xs font-bold transition-colors"
              style={{ background: "rgba(167,139,250,0.15)", color: "#a78bfa", border: "1px solid rgba(167,139,250,0.3)" }}>
              Find a matching programme
            </button>
          )}
        </>
      )}

      {open && (
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5"
              style={{ color: "rgba(255,255,255,0.3)" }} />
            <input
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search by programme, university, level…"
              className="w-full rounded-lg pl-8 pr-3 py-2 text-xs outline-none"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "white" }}
            />
          </div>

          <div className="max-h-72 overflow-y-auto space-y-1.5">
            {filtered.length === 0 ? (
              <p className="text-xs text-center py-4" style={{ color: "rgba(255,255,255,0.3)" }}>
                No published opportunities match &quot;{query}&quot;.
              </p>
            ) : (
              filtered.map(o => (
                <button key={o.id} onClick={() => assign(o.id)} disabled={saving}
                  className="w-full text-left rounded-lg p-2.5 transition-colors disabled:opacity-50 hover:bg-white/5"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <p className="text-xs font-semibold text-white leading-snug">{o.title}</p>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-[10px]"
                    style={{ color: "rgba(255,255,255,0.4)" }}>
                    {o.organization && (
                      <span className="flex items-center gap-1"><Building2 className="h-2.5 w-2.5" />{o.organization}</span>
                    )}
                    {o.degreeLevel && (
                      <span className="flex items-center gap-1"><GraduationCap className="h-2.5 w-2.5" />{o.degreeLevel}</span>
                    )}
                    {o.location && (
                      <span className="flex items-center gap-1"><MapPin className="h-2.5 w-2.5" />{o.location}</span>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>

          <button onClick={() => { setOpen(false); setQuery("") }}
            className="w-full rounded-lg px-3 py-1.5 text-xs"
            style={{ color: "rgba(255,255,255,0.4)" }}>
            Cancel
          </button>
        </div>
      )}

      {saving && (
        <p className="flex items-center justify-center gap-1.5 text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
          <Loader2 className="h-3 w-3 animate-spin" /> Saving…
        </p>
      )}
    </div>
  )
}
