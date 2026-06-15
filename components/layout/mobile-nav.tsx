"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard, FileText, User, Sparkles, GraduationCap,
  Plane, ArrowLeftRight, Layers, Users,
} from "lucide-react"

type NavEntry = { href: string; label: string; icon: React.ElementType }

const studentMobileNav: NavEntry[] = [
  { href: "/dashboard",              label: "Home",        icon: LayoutDashboard },
  { href: "/apply-to-china",         label: "Apply",       icon: Sparkles },
  { href: "/scholarships",           label: "Scholarships", icon: GraduationCap },
  { href: "/dashboard/applications", label: "My Apps",     icon: FileText },
  { href: "/profile",                label: "Profile",     icon: User },
]

const businessMobileNav: NavEntry[] = [
  { href: "/dashboard",              label: "Home",     icon: LayoutDashboard },
  { href: "/apply-visa",             label: "Visa",     icon: Plane },
  { href: "/exchange",               label: "Exchange", icon: ArrowLeftRight },
  { href: "/dashboard/applications", label: "Requests", icon: FileText },
  { href: "/profile",                label: "Profile",  icon: User },
]

const adminMobileNav: NavEntry[] = [
  { href: "/admin/dashboard",    label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/applications", label: "Apps",      icon: Layers },
  { href: "/admin/users",        label: "Users",     icon: Users },
  { href: "/admin/exchange",     label: "Payments",  icon: ArrowLeftRight },
  { href: "/profile",            label: "Profile",   icon: User },
]

interface MobileNavProps {
  accountType: string
  userRole: string
}

export function MobileNav({ accountType, userRole }: MobileNavProps) {
  const pathname = usePathname()
  const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(userRole)

  let navItems: NavEntry[]
  let accentColor: string

  if (isAdmin) {
    navItems = adminMobileNav
    accentColor = "#ef4444"
  } else if (accountType === "BUSINESS") {
    navItems = businessMobileNav
    accentColor = "#D4AF37"
  } else {
    navItems = studentMobileNav
    accentColor = "#38bdf8"
  }

  const isActive = (href: string) =>
    pathname === href ||
    (href !== "/dashboard" && href !== "/admin/dashboard" && pathname.startsWith(href + "/"))

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50"
      style={{
        background: "rgba(5,9,26,0.97)",
        borderTop: "1px solid rgba(255,255,255,0.07)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      <div className="flex items-stretch h-[60px]">
        {navItems.map(item => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex-1 flex flex-col items-center justify-center gap-[3px] relative"
            >
              {active && (
                <span
                  className="absolute top-0 left-1/2 -translate-x-1/2 h-[2px] w-8 rounded-full"
                  style={{ background: accentColor }}
                />
              )}
              <item.icon
                className="h-[18px] w-[18px] transition-colors"
                style={{ color: active ? accentColor : "rgba(255,255,255,0.3)" }}
              />
              <span
                className="text-[9px] font-semibold tracking-wide transition-colors"
                style={{ color: active ? accentColor : "rgba(255,255,255,0.3)" }}
              >
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
