export type ScholarshipLevel = "BACHELOR" | "MASTER" | "PHD" | "LANGUAGE" | "SHORT"

export type ScholarshipFundingType =
  | "FULLY_FUNDED"
  | "PARTIAL"
  | "TUITION_WAIVER"
  | "SELF_FUNDED"
  | "HYBRID"

export const FUNDING_TYPE_META: Record<ScholarshipFundingType, { label: string; color: string; bg: string; border: string; desc: string }> = {
  FULLY_FUNDED:   { label: "Fully Funded",        color: "#34d399", bg: "rgba(52,211,153,0.12)",  border: "rgba(52,211,153,0.3)",  desc: "All costs covered by the scholarship" },
  PARTIAL:        { label: "Partial Scholarship",  color: "#60a5fa", bg: "rgba(96,165,250,0.12)",  border: "rgba(96,165,250,0.3)",  desc: "Some costs are subsidised" },
  TUITION_WAIVER: { label: "Tuition Waiver",       color: "#a78bfa", bg: "rgba(167,139,250,0.12)", border: "rgba(167,139,250,0.3)", desc: "Tuition only — other costs self-funded" },
  SELF_FUNDED:    { label: "Self-Funded",          color: "#fb923c", bg: "rgba(251,146,60,0.12)",  border: "rgba(251,146,60,0.3)",  desc: "No scholarship support — student covers all costs" },
  HYBRID:         { label: "Hybrid Model",         color: "#D4AF37", bg: "rgba(212,175,55,0.12)",  border: "rgba(212,175,55,0.3)",  desc: "Mix of scholarship + self-funding" },
}

export interface TuitionConfig {
  covered: boolean
  fullCost?: string
  discountedCost?: string
  percentageCovered?: number
}

export interface AccommodationConfig {
  enabled: boolean
  coverage: "FULL" | "PARTIAL" | "NOT_COVERED"
  amount?: string
}

export interface StipendConfig {
  enabled: boolean
  monthlyAmount?: string
}

export interface AdditionalSupportConfig {
  flightTicket: boolean
  insurance: boolean
  otherBenefits?: string
}

export interface PaymentsConfig {
  enabled: boolean
  registrationFee?: string
  applicationFee?: string
  seatDeposit?: string
  processingFee?: string
}

export interface ScholarshipFinancials {
  // Rich structured model
  scholarshipType?: ScholarshipFundingType
  tuition?: TuitionConfig | string
  accommodation?: AccommodationConfig | string
  stipend?: StipendConfig | string
  additionalSupport?: AdditionalSupportConfig
  payments?: PaymentsConfig

  // Legacy flat fields (kept for backwards compatibility)
  registrationFee?: string
  deposit?: string
  notes?: string[]
}

export interface ScholarshipRequirements {
  documents: string[]
  eligibility?: string[]
  extraInfo?: string[]
}

export interface ScholarshipData {
  id: string
  title: string
  level: ScholarshipLevel
  country: string
  city: string
  intake: string
  duration: string
  language: string
  ageRange: string
  overview: string
  majors: string[]
  financials: ScholarshipFinancials
  requirements: ScholarshipRequirements
  applicationHighlights: string[]
  admissionProcess: string[]
  contact: {
    whatsapp: string
    phone: string
    email: string
    office: string
  }
  tags: string[]
  slots?: number
  isFeatured?: boolean
  sortOrder?: number
}

// Parsed from DB (JSON strings → objects)
export interface ScholarshipRecord extends ScholarshipData {
  dbId: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export const CONTACT = {
  whatsapp: "+255 672 037 939",
  phone: "0652 026 656",
  email: "honestmsemoe@icloud.com",
  office: "Mbezi Africana",
} as const

export const LEVEL_META: Record<ScholarshipLevel, { label: string; color: string; bg: string; border: string }> = {
  BACHELOR:  { label: "Bachelor",    color: "#38bdf8", bg: "rgba(56,189,248,0.12)",  border: "rgba(56,189,248,0.25)"  },
  MASTER:    { label: "Master",      color: "#a78bfa", bg: "rgba(167,139,250,0.12)", border: "rgba(167,139,250,0.25)" },
  PHD:       { label: "PhD",         color: "#f472b6", bg: "rgba(244,114,182,0.12)", border: "rgba(244,114,182,0.25)" },
  LANGUAGE:  { label: "Language",    color: "#34d399", bg: "rgba(52,211,153,0.12)",  border: "rgba(52,211,153,0.25)"  },
  SHORT:     { label: "Short Course",color: "#D4AF37", bg: "rgba(212,175,55,0.12)",  border: "rgba(212,175,55,0.25)"  },
}
