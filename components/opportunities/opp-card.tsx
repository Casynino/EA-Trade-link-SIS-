"use client"

import Link from "next/link"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { MapPin, Clock, Users, Zap, Star, Award, Briefcase, GraduationCap, Factory, Plane, Calendar, TrendingUp, ArrowRight, Search } from "lucide-react"
import { TYPE_CONFIG } from "@/lib/opp-types"
export { TYPE_CONFIG }

const FALLBACK_IMAGES: Record<string, string> = {
  SCHOLARSHIP:      "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&auto=format&fit=crop&q=80",
  JOB:              "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&auto=format&fit=crop&q=80",
  BUSINESS_VISA:    "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800&auto=format&fit=crop&q=80",
  FACTORY_VISIT:    "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&auto=format&fit=crop&q=80",
  CANTON_FAIR:      "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80",
  TRADE_EXHIBITION: "https://images.unsplash.com/photo-1591115765373-5207764f72e7?w=800&auto=format&fit=crop&q=80",
  CONFERENCE:       "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800&auto=format&fit=crop&q=80",
  EXCHANGE:         "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&auto=format&fit=crop&q=80",
}

const DIFFICULTY: Record<string, { label: string; color: string }> = {
  SCHOLARSHIP:      { label: "Competitive",  color: "text-red-400" },
  JOB:              { label: "Open",         color: "text-green-400" },
  BUSINESS_VISA:    { label: "Standard",     color: "text-blue-400" },
  FACTORY_VISIT:    { label: "Open",         color: "text-green-400" },
  CANTON_FAIR:      { label: "Registration", color: "text-yellow-400" },
  TRADE_EXHIBITION: { label: "Registration", color: "text-yellow-400" },
  CONFERENCE:       { label: "Selective",    color: "text-orange-400" },
  EXCHANGE:         { label: "Flexible",     color: "text-teal-400" },
}

function daysUntil(deadline: Date | null): number | null {
  if (!deadline) return null
  return Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000)
}

interface OppCardProps {
  opp: any
  featured?: boolean
  size?: "sm" | "md" | "lg"
}

export function OppCard({ opp, featured, size = "md" }: OppCardProps) {
  const cfg = TYPE_CONFIG[opp.type] ?? TYPE_CONFIG.SCHOLARSHIP
  const Icon = cfg.icon
  const img = opp.imageUrl || FALLBACK_IMAGES[opp.type] || FALLBACK_IMAGES.SCHOLARSHIP
  const diff = DIFFICULTY[opp.type]
  const days = daysUntil(opp.deadline)
  const isUrgent = days !== null && days <= 14 && days >= 0
  const isExpired = days !== null && days < 0

  const heights = { sm: "h-36", md: "h-44", lg: "h-56" }

  return (
    <Link href={`/opportunities/${opp.id}`} className="group block">
      <div className="relative rounded-2xl overflow-hidden h-full flex flex-col transition-all duration-300 cursor-pointer group-hover:-translate-y-1 group-hover:shadow-2xl"
        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
      >

        {/* Image */}
        <div className={`relative ${heights[size]} overflow-hidden bg-gray-100 shrink-0`}>
          <Image
            src={img}
            alt={opp.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

          {/* Type badge — top left */}
          <div className={`absolute top-3 left-3 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold backdrop-blur-sm ${cfg.badge}`}>
            <Icon className="h-3 w-3" />
            {cfg.label}
          </div>

          {/* Featured badge — top right */}
          {(opp.isFeatured || featured) && (
            <div className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-brand-gold px-2.5 py-1 text-xs font-semibold text-white shadow-md">
              <Star className="h-3 w-3 fill-white" />
              Featured
            </div>
          )}

          {/* Deadline bottom overlay */}
          {days !== null && !isExpired && (
            <div className={`absolute bottom-3 right-3 flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold backdrop-blur-sm
              ${isUrgent ? "bg-red-500/90 text-white" : "bg-black/60 text-white"}`}>
              <Clock className="h-3 w-3" />
              {isUrgent ? `${days}d left!` : `${days} days left`}
            </div>
          )}
          {isExpired && (
            <div className="absolute bottom-3 right-3 rounded-full bg-gray-800/90 px-2.5 py-1 text-xs text-gray-300 backdrop-blur-sm">
              Expired
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-col flex-1 p-4 gap-2">
          {/* Organization */}
          <p className="text-xs flex items-center gap-1 truncate" style={{ color: "rgba(255,255,255,0.4)" }}>
            <MapPin className="h-3 w-3 shrink-0" />
            {opp.organization} · {opp.location}
          </p>

          {/* Title */}
          <h3 className="font-semibold text-sm leading-snug line-clamp-2 text-white/90 group-hover:text-white transition-colors">
            {opp.title}
          </h3>

          {/* Description */}
          <p className="text-xs line-clamp-2 flex-1 leading-relaxed" style={{ color: "rgba(255,255,255,0.38)" }}>
            {opp.description}
          </p>

          {/* Footer */}
          <div className="flex items-center justify-between mt-2 pt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="flex items-center gap-1">
              <Zap className={`h-3 w-3 ${diff?.color ?? "text-gray-400"}`} />
              <span className={`text-xs font-medium ${diff?.color ?? "text-gray-400"}`}>
                {diff?.label}
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs font-semibold group-hover:gap-2 transition-all" style={{ color: "#D4AF37" }}>
              View Details
              <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </div>

          {/* Scholarship extras */}
          {opp.type === "SCHOLARSHIP" && (opp.tuitionCovered || opp.livingAllowance || opp.flightTicket) && (
            <div className="flex flex-wrap gap-1 mt-1">
              {opp.tuitionCovered && <span className="rounded-full px-2 py-0.5 text-[10px] font-medium" style={{ background: "rgba(56,189,248,0.15)", color: "#38bdf8" }}>Tuition</span>}
              {opp.livingAllowance && <span className="rounded-full px-2 py-0.5 text-[10px] font-medium" style={{ background: "rgba(52,211,153,0.15)", color: "#34d399" }}>Allowance</span>}
              {opp.flightTicket && <span className="rounded-full px-2 py-0.5 text-[10px] font-medium" style={{ background: "rgba(167,139,250,0.15)", color: "#a78bfa" }}>Flight</span>}
            </div>
          )}

          {/* Job salary */}
          {opp.type === "JOB" && opp.salary && (
            <div className="text-xs font-semibold flex items-center gap-1" style={{ color: "#34d399" }}>
              <Award className="h-3 w-3" />{opp.salary}
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}

export function OppCardSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden animate-pulse" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
      <div className="h-44" style={{ background: "rgba(255,255,255,0.06)" }} />
      <div className="p-4 space-y-3">
        <div className="h-3 rounded w-2/3" style={{ background: "rgba(255,255,255,0.07)" }} />
        <div className="h-4 rounded w-full" style={{ background: "rgba(255,255,255,0.07)" }} />
        <div className="h-3 rounded w-full" style={{ background: "rgba(255,255,255,0.07)" }} />
        <div className="h-3 rounded w-4/5" style={{ background: "rgba(255,255,255,0.07)" }} />
        <div className="flex justify-between mt-3">
          <div className="h-3 rounded w-20" style={{ background: "rgba(255,255,255,0.07)" }} />
          <div className="h-3 rounded w-24" style={{ background: "rgba(255,255,255,0.07)" }} />
        </div>
      </div>
    </div>
  )
}
