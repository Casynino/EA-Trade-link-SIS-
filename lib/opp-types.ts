import {
  GraduationCap, Briefcase, Plane, Factory, Calendar,
  TrendingUp, Users, ArrowRight, Search,
} from "lucide-react"

export type OppTypeConfig = {
  label: string
  icon: React.ElementType
  gradient: string
  badge: string
}

export const TYPE_CONFIG: Record<string, OppTypeConfig> = {
  SCHOLARSHIP:      { label: "Scholarship",      icon: GraduationCap, gradient: "from-blue-600 to-indigo-700",   badge: "bg-blue-500/90 text-white" },
  JOB:              { label: "Job",              icon: Briefcase,     gradient: "from-emerald-600 to-teal-700",  badge: "bg-emerald-500/90 text-white" },
  BUSINESS_VISA:    { label: "Business Visa",    icon: Plane,         gradient: "from-violet-600 to-purple-700", badge: "bg-violet-500/90 text-white" },
  FACTORY_VISIT:    { label: "Factory Visit",    icon: Factory,       gradient: "from-orange-500 to-red-600",    badge: "bg-orange-500/90 text-white" },
  CANTON_FAIR:      { label: "Canton Fair",      icon: Calendar,      gradient: "from-rose-600 to-pink-700",     badge: "bg-rose-500/90 text-white" },
  TRADE_EXHIBITION: { label: "Trade Expo",       icon: TrendingUp,    gradient: "from-teal-600 to-cyan-700",     badge: "bg-teal-500/90 text-white" },
  CONFERENCE:       { label: "Conference",       icon: Users,         gradient: "from-indigo-600 to-blue-800",   badge: "bg-indigo-500/90 text-white" },
  EXCHANGE:         { label: "Exchange",         icon: ArrowRight,    gradient: "from-amber-500 to-yellow-600",  badge: "bg-amber-500/90 text-white" },
  PRODUCT_SOURCING: { label: "Product Sourcing", icon: Search,        gradient: "from-sky-500 to-cyan-600",      badge: "bg-sky-500/90 text-white" },
}

export const FALLBACK_TYPE = TYPE_CONFIG.SCHOLARSHIP
