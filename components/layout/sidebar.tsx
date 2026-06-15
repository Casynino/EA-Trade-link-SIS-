"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard, ArrowLeftRight, User, Shield, Users,
  BarChart3, ChevronLeft, ChevronRight, FileText, Globe2, Plus,
  GraduationCap, Factory, Calendar, Plane, Search,
  Building2, Sparkles, CreditCard, Lightbulb, Briefcase, Layers,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from "react"

// ── Nav definitions per role ──────────────────────────────────────────────────

const studentNav = [
  { href: "/dashboard",               label: "Overview",                  icon: LayoutDashboard },
  { section: "Study in China" },
  { href: "/apply-to-china",          label: "Apply to Study in China",   icon: Sparkles },
  { href: "/scholarships",            label: "Scholarship Opportunities", icon: GraduationCap },
  { section: "My Applications" },
  { href: "/dashboard/applications",  label: "My Applications",           icon: FileText },
  { section: "Account" },
  { href: "/messages",                label: "Messages",                  icon: Globe2 },
  { href: "/profile",                 label: "Profile",                   icon: User },
]

const businessNav = [
  { href: "/dashboard",               label: "Overview",        icon: LayoutDashboard },
  { section: "Services" },
  { href: "/apply-visa",              label: "Business Visa",   icon: Plane },
  { href: "/factory-visits",          label: "Factory Visits",  icon: Factory },
  { href: "/sourcing",                label: "Product Sourcing", icon: Search },
  { section: "My Activity" },
  { href: "/dashboard/applications",  label: "My Requests",     icon: FileText },
  { section: "Finance" },
  { href: "/exchange",                label: "Money Exchange",  icon: ArrowLeftRight },
  { section: "Account" },
  { href: "/messages",                label: "Messages",        icon: Globe2 },
  { href: "/profile",                 label: "Profile",         icon: User },
]

const adminNav = [
  { section: "Overview" },
  { href: "/admin/dashboard",              label: "Dashboard",          icon: LayoutDashboard },
  { section: "Scholarships & Programs" },
  { href: "/admin/scholarships",           label: "All Programs",       icon: GraduationCap },
  { href: "/admin/scholarships/new",       label: "Create Program",     icon: Plus },
  { section: "Opportunities" },
  { href: "/admin/opportunities",          label: "All Opportunities",  icon: Globe2 },
  { href: "/admin/opportunities/new",      label: "Create New",         icon: Plus },
  { section: "Applications" },
  { href: "/admin/applications",           label: "All Applications",   icon: Layers },
  { href: "/admin/study-applications",     label: "Study",              icon: GraduationCap },
  { href: "/admin/visa-applications",      label: "Visa",               icon: Plane },
  { section: "Users & Finance" },
  { href: "/admin/users",                  label: "Users",              icon: Users },
  { href: "/admin/exchange",               label: "Payments",           icon: CreditCard },
  { section: "Services" },
  { href: "/admin/sourcing",               label: "Services Hub",       icon: Building2 },
]

const ROLE_BADGE: Record<string, { label: string; color: string; bg: string }> = {
  STUDENT:  { label: "🎓 Student",  color: "#38bdf8", bg: "rgba(56,189,248,0.1)"  },
  BUSINESS: { label: "💼 Business", color: "#D4AF37", bg: "rgba(212,175,55,0.1)"  },
}

type NavItem = { section: string } | { href: string; label: string; icon: React.ElementType }

interface SidebarProps {
  /** Authoritative account type passed from server layout — never stale */
  accountType: string   // "STUDENT" | "BUSINESS" | "ADMIN"
  userName: string
  userRole: string      // "USER" | "ADMIN" | "SUPER_ADMIN"
}

export function Sidebar({ accountType, userName, userRole }: SidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(userRole)

  let navItems: NavItem[]
  if (isAdmin) {
    navItems = adminNav
  } else if (accountType === "BUSINESS") {
    navItems = businessNav
  } else {
    navItems = studentNav
  }

  const roleBadge = !isAdmin ? ROLE_BADGE[accountType] ?? null : null

  const isActive = (href: string) =>
    pathname === href ||
    (href !== "/dashboard" && href !== "/admin/dashboard" && pathname.startsWith(href + "/"))

  return (
    <aside
      className={cn(
        "ea-sidebar relative flex flex-col transition-all duration-300 overflow-hidden shrink-0",
        collapsed ? "w-[64px]" : "w-[230px]"
      )}
    >
      {/* ── Brand ── */}
      <div className={cn(
        "flex items-center gap-3 px-4 py-5 border-b border-white/6",
        collapsed && "justify-center px-3"
      )}>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/12 ring-1 ring-white/15">
          <Globe2 className="h-4 w-4 text-[#D4AF37]" />
        </div>
        {!collapsed && (
          <div className="leading-none min-w-0">
            <p className="text-[13px] font-bold text-white truncate">EA Trade Link</p>
            <p className="text-[10px] text-white/38 mt-0.5 truncate">China–Tanzania Platform</p>
          </div>
        )}
      </div>

      {/* ── Role badge ── */}
      {!collapsed && (
        <div className="mx-3 mt-3">
          {isAdmin ? (
            <div className="flex items-center gap-1.5 rounded-lg px-3 py-1.5"
              style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
              <Shield className="h-3 w-3 text-red-400" />
              <span className="text-[11px] font-semibold text-red-400">Admin Panel</span>
            </div>
          ) : roleBadge ? (
            <div className="flex items-center gap-1.5 rounded-lg px-3 py-1.5"
              style={{ background: roleBadge.bg, border: `1px solid ${roleBadge.color}33` }}>
              <span className="text-[11px] font-semibold" style={{ color: roleBadge.color }}>
                {roleBadge.label}
              </span>
            </div>
          ) : null}
        </div>
      )}

      {/* ── Browse shortcut (non-admin) ── */}
      {!isAdmin && !collapsed && (
        <div className="mx-3 mt-2">
          <Link href="/"
            className="flex items-center gap-2 rounded-lg border border-dashed border-white/10 px-3 py-2 text-[11px] text-white/38 hover:border-[#D4AF37]/40 hover:text-[#D4AF37]/80 transition-colors"
          >
            <Sparkles className="h-3.5 w-3.5 shrink-0" />
            Browse Opportunities
          </Link>
        </div>
      )}

      {/* ── Navigation ── */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {navItems.map((item, i) => {
          if ("section" in item) {
            if (collapsed) return null
            return <p key={`s-${i}`} className="ea-nav-section pt-3 first:pt-1">{item.section}</p>
          }
          const active = isActive(item.href)
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={cn("ea-nav-item", active && "active", collapsed && "justify-center px-0")}
                title={collapsed ? item.label : undefined}
              >
                <item.icon className="h-4 w-4 shrink-0 opacity-80" />
                {!collapsed && <span>{item.label}</span>}
                {collapsed && active && (
                  <span className="absolute right-0.5 top-1/2 -translate-y-1/2 h-4 w-0.5 rounded-full bg-[#D4AF37]" />
                )}
              </div>
            </Link>
          )
        })}
      </nav>

      {/* ── User strip ── */}
      <div className={cn(
        "border-t border-white/6 px-3 py-3 flex items-center gap-2.5",
        collapsed && "justify-center"
      )}>
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#D4AF37]/20 text-[#D4AF37] text-[10px] font-bold ring-1 ring-[#D4AF37]/30">
          {userName.charAt(0).toUpperCase()}
        </div>
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-semibold text-white/80 truncate">{userName}</p>
            <p className="text-[10px] text-white/35 capitalize">
              {isAdmin ? userRole.toLowerCase().replace("_", " ") : accountType.toLowerCase()}
            </p>
          </div>
        )}
      </div>

      {/* ── Collapse toggle ── */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-[72px] z-20 flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-[#0c1a44] text-white/50 shadow-md hover:text-white transition-colors"
      >
        {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </button>
    </aside>
  )
}
