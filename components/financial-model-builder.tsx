"use client"

import { useState } from "react"
import { Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react"
import type { FundingType, BenefitItem, CostItem, StipendItem, FinancialModel } from "@/lib/financial-model"

export type { FundingType, BenefitItem, CostItem, StipendItem, FinancialModel }

// ── Preset benefit definitions ────────────────────────────────────────────────
const BENEFIT_PRESETS: Record<string, { id: string; label: string }[]> = {
  education: [
    { id: "full_tuition",   label: "Full Tuition Coverage" },
    { id: "partial_tuition",label: "Partial Tuition Coverage" },
    { id: "reg_fee",        label: "Registration Fee Covered" },
    { id: "accommodation",  label: "Accommodation Provided" },
    { id: "monthly_stipend",label: "Monthly Stipend" },
    { id: "book_allowance", label: "Book / Study Allowance" },
    { id: "research_fund",  label: "Research Funding" },
    { id: "lab_access",     label: "Laboratory Access" },
    { id: "intern_place",   label: "Internship Placement" },
  ],
  travel: [
    { id: "roundtrip",      label: "Round-trip Flight Tickets" },
    { id: "oneway",         label: "One-way Flight Ticket" },
    { id: "airport_pickup", label: "Airport Pickup" },
    { id: "local_transport",label: "Local Transportation" },
    { id: "travel_allowance",label: "Travel Allowance" },
  ],
  health: [
    { id: "med_insurance",  label: "Medical Insurance" },
    { id: "health_exam",    label: "Health Examination" },
    { id: "emergency",      label: "Emergency Assistance" },
  ],
  business: [
    { id: "exhib_access",   label: "Exhibition Access" },
    { id: "factory_entry",  label: "Factory Entry Arrangements" },
    { id: "matchmaking",    label: "Business Matchmaking" },
    { id: "meeting_coord",  label: "Meeting Coordination" },
    { id: "translation",    label: "Translation Services" },
    { id: "invitation",     label: "Invitation Letters" },
    { id: "vip_network",    label: "VIP Networking Sessions" },
    { id: "market_visits",  label: "Market Visits" },
  ],
  employment: [
    { id: "salary",         label: "Salary / Compensation" },
    { id: "housing_assist", label: "Housing Assistance" },
    { id: "work_permit",    label: "Work Permit Support" },
    { id: "relocation",     label: "Relocation Support" },
    { id: "training",       label: "Training Programs" },
    { id: "perf_bonus",     label: "Performance Bonuses" },
  ],
  event: [
    { id: "event_access",   label: "Conference / Event Access" },
    { id: "event_materials",label: "Event Materials & Kit" },
    { id: "certificate",    label: "Certificate of Participation" },
    { id: "meals",          label: "Meals During Event" },
    { id: "event_accom",    label: "Event Accommodation" },
    { id: "local_tours",    label: "Local Tours" },
  ],
}

const CATEGORY_LABELS: Record<string, string> = {
  education: "Education",
  travel: "Travel",
  health: "Health",
  business: "Business",
  employment: "Employment",
  event: "Event",
}

const FUNDING_TYPES: { value: FundingType; label: string; desc: string; color: string }[] = [
  { value: "FULLY_COVERED",    label: "Fully Covered",     desc: "All major costs paid",           color: "#34d399" },
  { value: "PARTIALLY_COVERED",label: "Partial Coverage",  desc: "Some costs subsidised",          color: "#60a5fa" },
  { value: "SELF_FUNDED",      label: "Self-Funded",       desc: "Applicant pays all costs",        color: "#f87171" },
  { value: "CONDITIONAL",      label: "Conditional",       desc: "Depends on approval / merit",    color: "#fbbf24" },
  { value: "CUSTOM",           label: "Custom",            desc: "Mix or special arrangement",     color: "#c084fc" },
]

const PERIODS = ["monthly", "weekly", "semester", "annual", "one-time"] as const
const CURRENCIES = ["USD", "RMB", "TZS", "EUR", "GBP", "KES"]

// ── Default empty model ───────────────────────────────────────────────────────
export function emptyFinancialModel(): FinancialModel {
  return { fundingType: "PARTIALLY_COVERED", benefits: [], costs: [], stipends: [], notes: "" }
}

function buildPresets(cats: (keyof typeof BENEFIT_PRESETS)[]): BenefitItem[] {
  return cats.flatMap(cat =>
    BENEFIT_PRESETS[cat].map(p => ({
      ...p,
      category: cat as BenefitItem["category"],
      included: false,
    }))
  )
}

export function defaultFinancialModelForType(type: string): FinancialModel {
  const base = emptyFinancialModel()
  switch (type) {
    case "SCHOLARSHIP":
      return { ...base, fundingType: "FULLY_COVERED",    benefits: buildPresets(["education","travel","health"]) }
    case "JOB":
      return { ...base, fundingType: "CUSTOM",           benefits: buildPresets(["employment","travel","health"]) }
    case "BUSINESS_VISA":
      return { ...base, fundingType: "SELF_FUNDED",      benefits: buildPresets(["business","travel"]) }
    case "FACTORY_VISIT":
      return { ...base, fundingType: "PARTIALLY_COVERED",benefits: buildPresets(["business","travel"]) }
    case "CANTON_FAIR":
    case "TRADE_EXHIBITION":
      return { ...base, fundingType: "SELF_FUNDED",      benefits: buildPresets(["business","event","travel"]) }
    case "CONFERENCE":
      return { ...base, fundingType: "PARTIALLY_COVERED",benefits: buildPresets(["event","travel"]) }
    default:
      return { ...base, fundingType: "CUSTOM",           benefits: buildPresets(["education","travel","health","business","employment","event"]) }
  }
}

// ── Sub-components ────────────────────────────────────────────────────────────
interface ToggleProps { on: boolean; onChange: (v: boolean) => void; color?: string }
function Toggle({ on, onChange, color = "#D4AF37" }: ToggleProps) {
  return (
    <button type="button" onClick={() => onChange(!on)}
      className="inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-all"
      style={{ background: on ? `${color}33` : "rgba(255,255,255,0.08)" }}>
      <span className="inline-block h-3.5 w-3.5 rounded-full transition-transform"
        style={{ background: on ? color : "rgba(255,255,255,0.3)", transform: on ? "translateX(20px)" : "translateX(2px)" }} />
    </button>
  )
}

// ── Main builder ──────────────────────────────────────────────────────────────
interface Props {
  value: FinancialModel
  onChange: (v: FinancialModel) => void
}

export function FinancialModelBuilder({ value, onChange }: Props) {
  const [openCats, setOpenCats] = useState<Record<string, boolean>>({})

  const S = {
    card: {
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: "0.875rem",
      padding: "1rem",
    } as React.CSSProperties,
    input: {
      background: "rgba(255,255,255,0.05)",
      border: "1px solid rgba(255,255,255,0.1)",
      color: "white",
      borderRadius: "0.625rem",
      padding: "0.4rem 0.6rem",
      fontSize: "0.8125rem",
      outline: "none",
      width: "100%",
    } as React.CSSProperties,
    label: {
      fontSize: "0.7rem",
      color: "rgba(255,255,255,0.45)",
      fontWeight: 600,
      letterSpacing: "0.06em",
      textTransform: "uppercase" as const,
    },
    sub: { fontSize: "0.8125rem", fontWeight: 700, color: "white", marginBottom: "0.625rem" } as React.CSSProperties,
  }

  // ── Funding type ─────────────────────────────────────────────────────────
  function setFundingType(ft: FundingType) { onChange({ ...value, fundingType: ft }) }

  // ── Benefits ──────────────────────────────────────────────────────────────
  const benefitCats = [...new Set(value.benefits.map(b => b.category))]

  function toggleBenefit(id: string, included: boolean) {
    onChange({ ...value, benefits: value.benefits.map(b => b.id === id ? { ...b, included } : b) })
  }
  function setBenefitDetails(id: string, details: string) {
    onChange({ ...value, benefits: value.benefits.map(b => b.id === id ? { ...b, details } : b) })
  }
  function addBenefitPreset(cat: string) {
    const existing = new Set(value.benefits.map(b => b.id))
    const toAdd = (BENEFIT_PRESETS[cat] ?? [])
      .filter(p => !existing.has(p.id))
      .map(p => ({ ...p, category: cat as BenefitItem["category"], included: false }))
    onChange({ ...value, benefits: [...value.benefits, ...toAdd] })
  }
  function removeBenefit(id: string) {
    onChange({ ...value, benefits: value.benefits.filter(b => b.id !== id) })
  }

  // ── Costs ─────────────────────────────────────────────────────────────────
  function addCost() {
    onChange({
      ...value,
      costs: [...value.costs, { id: `c_${Date.now()}`, label: "", amount: "", currency: "USD", mandatory: true, refundable: false }],
    })
  }
  function updateCost(id: string, patch: Partial<CostItem>) {
    onChange({ ...value, costs: value.costs.map(c => c.id === id ? { ...c, ...patch } : c) })
  }
  function removeCost(id: string) { onChange({ ...value, costs: value.costs.filter(c => c.id !== id) }) }

  // ── Stipends ──────────────────────────────────────────────────────────────
  function addStipend() {
    onChange({
      ...value,
      stipends: [...value.stipends, { id: `s_${Date.now()}`, label: "", amount: "", period: "monthly" }],
    })
  }
  function updateStipend(id: string, patch: Partial<StipendItem>) {
    onChange({ ...value, stipends: value.stipends.map(s => s.id === id ? { ...s, ...patch } : s) })
  }
  function removeStipend(id: string) { onChange({ ...value, stipends: value.stipends.filter(s => s.id !== id) }) }

  const activeFT = FUNDING_TYPES.find(f => f.value === value.fundingType) ?? FUNDING_TYPES[0]

  return (
    <div className="space-y-4">

      {/* 1 — Funding type */}
      <div>
        <p style={S.sub}>Funding Type</p>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {FUNDING_TYPES.map(ft => {
            const active = value.fundingType === ft.value
            return (
              <button key={ft.value} type="button" onClick={() => setFundingType(ft.value)}
                className="rounded-xl p-2.5 text-left transition-all"
                style={{
                  background: active ? `${ft.color}18` : "rgba(255,255,255,0.03)",
                  border: active ? `1px solid ${ft.color}55` : "1px solid rgba(255,255,255,0.07)",
                }}>
                <div className="text-[11px] font-bold mb-0.5" style={{ color: active ? ft.color : "rgba(255,255,255,0.6)" }}>{ft.label}</div>
                <div className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>{ft.desc}</div>
              </button>
            )
          })}
        </div>
        <p className="mt-2 text-xs px-1" style={{ color: "rgba(255,255,255,0.35)" }}>
          {value.fundingType === "FULLY_COVERED"    && "All major costs are covered by the sponsor or organiser."}
          {value.fundingType === "PARTIALLY_COVERED" && "Some costs are covered. Applicant is responsible for the remainder."}
          {value.fundingType === "SELF_FUNDED"      && "Applicant is responsible for all associated costs."}
          {value.fundingType === "CONDITIONAL"      && "Financial support depends on selection outcome, performance, or sponsor approval."}
          {value.fundingType === "CUSTOM"           && "Custom financial arrangement. Define the exact structure below."}
        </p>
      </div>

      {/* 2 — Coverage benefits */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p style={S.sub}>Coverage & Benefits</p>
          <div className="flex flex-wrap gap-1">
            {Object.entries(BENEFIT_PRESETS).map(([cat]) => {
              const alreadyHas = value.benefits.some(b => b.category === cat)
              return !alreadyHas ? (
                <button key={cat} type="button" onClick={() => addBenefitPreset(cat)}
                  className="rounded-lg px-2 py-0.5 text-[10px] font-semibold transition-all"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.45)" }}>
                  + {CATEGORY_LABELS[cat]}
                </button>
              ) : null
            })}
          </div>
        </div>

        {benefitCats.length === 0 ? (
          <p className="text-xs px-1 py-2 italic" style={{ color: "rgba(255,255,255,0.25)" }}>
            No benefit categories added yet. Use the buttons above to add a category.
          </p>
        ) : (
          <div className="space-y-2">
            {benefitCats.map(cat => {
              const items = value.benefits.filter(b => b.category === cat)
              const open = openCats[cat] !== false
              const included = items.filter(b => b.included).length
              return (
                <div key={cat} style={S.card}>
                  <div
                    className="w-full flex items-center justify-between cursor-pointer"
                    onClick={() => setOpenCats(prev => ({ ...prev, [cat]: !open }))}>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold" style={{ color: "white" }}>{CATEGORY_LABELS[cat]}</span>
                      {included > 0 && (
                        <span className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                          style={{ background: "rgba(52,211,153,0.15)", color: "#34d399" }}>
                          {included} included
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={e => { e.stopPropagation(); onChange({ ...value, benefits: value.benefits.filter(b => b.category !== cat) }) }}
                        onKeyDown={e => e.key === "Enter" && onChange({ ...value, benefits: value.benefits.filter(b => b.category !== cat) })}
                        className="text-[10px] transition-colors" style={{ color: "rgba(255,255,255,0.25)", cursor: "pointer" }}
                        onMouseEnter={e => (e.currentTarget.style.color = "#f87171")}
                        onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.25)")}>
                        remove
                      </span>
                      {open ? <ChevronUp className="h-3.5 w-3.5" style={{ color: "rgba(255,255,255,0.3)" }} />
                             : <ChevronDown className="h-3.5 w-3.5" style={{ color: "rgba(255,255,255,0.3)" }} />}
                    </div>
                  </div>
                  {open && (
                    <div className="mt-3 space-y-2">
                      {items.map(b => (
                        <div key={b.id}>
                          <div className="flex items-center gap-2">
                            <Toggle on={b.included} onChange={v => toggleBenefit(b.id, v)} color="#34d399" />
                            <span className="flex-1 text-xs" style={{ color: b.included ? "rgba(255,255,255,0.75)" : "rgba(255,255,255,0.4)" }}>
                              {b.label}
                            </span>
                            <button type="button" onClick={() => removeBenefit(b.id)}
                              className="transition-colors" style={{ color: "rgba(255,255,255,0.15)" }}
                              onMouseEnter={e => (e.currentTarget.style.color = "#f87171")}
                              onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.15)")}>
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                          {b.included && (
                            <input
                              value={b.details ?? ""}
                              onChange={e => setBenefitDetails(b.id, e.target.value)}
                              placeholder="Details, e.g. 3,000 RMB/month (optional)"
                              className="mt-1.5 ml-11"
                              style={{ ...S.input, width: "calc(100% - 2.75rem)" }}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 3 — Applicant costs */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p style={S.sub}>Applicant Cost Responsibilities</p>
          <button type="button" onClick={addCost}
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold transition-all"
            style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.2)", color: "#f87171" }}>
            <Plus className="h-3 w-3" />Add Cost
          </button>
        </div>
        {value.costs.length === 0 ? (
          <p className="text-xs px-1 py-1 italic" style={{ color: "rgba(255,255,255,0.25)" }}>No applicant costs defined.</p>
        ) : (
          <div className="space-y-2">
            {value.costs.map(c => (
              <div key={c.id} style={S.card} className="space-y-2">
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <p style={S.label}>Cost Label</p>
                    <input value={c.label} onChange={e => updateCost(c.id, { label: e.target.value })}
                      placeholder="e.g. Registration Fee, Visa Fee…" style={S.input} />
                  </div>
                  <div>
                    <p style={S.label}>Currency</p>
                    <select value={c.currency} onChange={e => updateCost(c.id, { currency: e.target.value })}
                      style={{ ...S.input, appearance: "none" }}>
                      {CURRENCIES.map(cur => <option key={cur} value={cur}>{cur}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 items-end">
                  <div>
                    <p style={S.label}>Amount</p>
                    <input value={c.amount} onChange={e => updateCost(c.id, { amount: e.target.value })}
                      placeholder="e.g. 500" style={S.input} />
                  </div>
                  <div className="flex items-center gap-3 pb-1">
                    <label className="flex items-center gap-1.5 text-[11px] cursor-pointer"
                      style={{ color: "rgba(255,255,255,0.5)" }}>
                      <Toggle on={c.mandatory} onChange={v => updateCost(c.id, { mandatory: v })} color="#fbbf24" />
                      {c.mandatory ? "Mandatory" : "Optional"}
                    </label>
                  </div>
                  <div className="flex items-center justify-between pb-1">
                    <label className="flex items-center gap-1.5 text-[11px] cursor-pointer"
                      style={{ color: "rgba(255,255,255,0.5)" }}>
                      <Toggle on={c.refundable} onChange={v => updateCost(c.id, { refundable: v })} color="#34d399" />
                      {c.refundable ? "Refundable" : "Non-refundable"}
                    </label>
                    <button type="button" onClick={() => removeCost(c.id)}
                      className="transition-colors" style={{ color: "rgba(255,255,255,0.2)" }}
                      onMouseEnter={e => (e.currentTarget.style.color = "#f87171")}
                      onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.2)")}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4 — Stipends */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p style={S.sub}>Stipends & Recurring Allowances</p>
          <button type="button" onClick={addStipend}
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold transition-all"
            style={{ background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.2)", color: "#34d399" }}>
            <Plus className="h-3 w-3" />Add Stipend
          </button>
        </div>
        {value.stipends.length === 0 ? (
          <p className="text-xs px-1 py-1 italic" style={{ color: "rgba(255,255,255,0.25)" }}>No recurring allowances defined.</p>
        ) : (
          <div className="space-y-2">
            {value.stipends.map(s => (
              <div key={s.id} style={S.card}>
                <div className="grid grid-cols-3 gap-2 items-end">
                  <div>
                    <p style={S.label}>Label</p>
                    <input value={s.label} onChange={e => updateStipend(s.id, { label: e.target.value })}
                      placeholder="e.g. Monthly Stipend" style={S.input} />
                  </div>
                  <div>
                    <p style={S.label}>Amount</p>
                    <input value={s.amount} onChange={e => updateStipend(s.id, { amount: e.target.value })}
                      placeholder="e.g. 3,000 RMB" style={S.input} />
                  </div>
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <p style={S.label}>Period</p>
                      <select value={s.period} onChange={e => updateStipend(s.id, { period: e.target.value as StipendItem["period"] })}
                        style={{ ...S.input, appearance: "none" }}>
                        {PERIODS.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                      </select>
                    </div>
                    <button type="button" onClick={() => removeStipend(s.id)}
                      className="mb-0.5 transition-colors" style={{ color: "rgba(255,255,255,0.2)" }}
                      onMouseEnter={e => (e.currentTarget.style.color = "#f87171")}
                      onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.2)")}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5 — Notes */}
      <div>
        <p style={{ ...S.sub, marginBottom: "0.375rem" }}>Financial Notes & Conditions</p>
        <textarea
          value={value.notes ?? ""}
          onChange={e => onChange({ ...value, notes: e.target.value })}
          placeholder="Any conditions, eligibility rules, or extra context about the financial model…"
          rows={3}
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "white",
            borderRadius: "0.625rem",
            padding: "0.5rem 0.75rem",
            fontSize: "0.8125rem",
            outline: "none",
            width: "100%",
            resize: "vertical",
          }}
        />
      </div>
    </div>
  )
}
