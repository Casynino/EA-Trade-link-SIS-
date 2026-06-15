// Shared types and helpers for the universal financial model.
// Import from here in server components (avoids pulling "use client" into SSR).

export type FundingType = "FULLY_COVERED" | "PARTIALLY_COVERED" | "SELF_FUNDED" | "CONDITIONAL" | "CUSTOM"

export type BenefitItem = {
  id: string
  category: "education" | "travel" | "health" | "business" | "employment" | "event"
  label: string
  included: boolean
  details?: string
}

export type CostItem = {
  id: string
  label: string
  amount: string
  currency: string
  mandatory: boolean
  refundable: boolean
}

export type StipendItem = {
  id: string
  label: string
  amount: string
  period: "monthly" | "weekly" | "semester" | "annual" | "one-time"
}

export type FinancialModel = {
  fundingType: FundingType
  benefits: BenefitItem[]
  costs: CostItem[]
  stipends: StipendItem[]
  notes?: string
}

export const FUNDING_TYPE_META: Record<FundingType, { label: string; color: string; bg: string; border: string }> = {
  FULLY_COVERED:    { label: "Fully Covered",    color: "#34d399", bg: "rgba(52,211,153,0.12)",  border: "rgba(52,211,153,0.3)"  },
  PARTIALLY_COVERED:{ label: "Partial Coverage", color: "#60a5fa", bg: "rgba(96,165,250,0.12)",  border: "rgba(96,165,250,0.3)"  },
  SELF_FUNDED:      { label: "Self-Funded",      color: "#f87171", bg: "rgba(248,113,113,0.12)", border: "rgba(248,113,113,0.3)" },
  CONDITIONAL:      { label: "Conditional",      color: "#fbbf24", bg: "rgba(251,191,36,0.12)",  border: "rgba(251,191,36,0.3)"  },
  CUSTOM:           { label: "Custom Model",     color: "#c084fc", bg: "rgba(192,132,252,0.12)", border: "rgba(192,132,252,0.3)" },
}

export const CATEGORY_LABELS: Record<string, string> = {
  education:  "Education",
  travel:     "Travel",
  health:     "Health",
  business:   "Business",
  employment: "Employment",
  event:      "Event",
}

export function parseFinancialModel(raw: unknown): FinancialModel | null {
  if (!raw || typeof raw !== "string" || raw === "{}") return null
  try {
    const m = JSON.parse(raw) as Partial<FinancialModel>
    if (!m.fundingType) return null
    return {
      fundingType: m.fundingType,
      benefits:    m.benefits  ?? [],
      costs:       m.costs     ?? [],
      stipends:    m.stipends  ?? [],
      notes:       m.notes,
    }
  } catch {
    return null
  }
}

export function hasFinancialContent(m: FinancialModel): boolean {
  return (
    m.benefits.some(b => b.included) ||
    m.costs.length > 0 ||
    m.stipends.length > 0
  )
}
