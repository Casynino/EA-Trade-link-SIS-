"use client"

import { useSession, signOut } from "next-auth/react"
import { usePathname } from "next/navigation"
import { LogOut, Settings, User, ChevronDown, Globe2 } from "lucide-react"
import { NotificationBell } from "@/components/layout/notification-bell"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getInitials } from "@/lib/utils"
import Link from "next/link"

// Page title map — derived from current path
const PAGE_TITLES: Record<string, string> = {
  "/dashboard":                  "Dashboard",
  "/dashboard/applications":     "My Applications",
  "/exchange":                   "Money Exchange",
  "/profile":                    "Profile",
  "/admin/dashboard":            "Admin Dashboard",
  "/admin/applications":         "Applications",
  "/admin/opportunities":        "Opportunities",
  "/admin/opportunities/new":    "New Opportunity",
  "/admin/users":                "Users",
  "/admin/exchange":             "Exchange Requests",
  "/admin/analytics":            "Analytics",
}

export function Header({ userName, userImage }: { userName: string; userImage: string }) {
  const { data: session } = useSession()
  const pathname = usePathname()

  // Best-match title (handles dynamic segments like /admin/applications/[id])
  const title = Object.entries(PAGE_TITLES)
    .filter(([path]) => pathname === path || pathname.startsWith(path + "/"))
    .sort((a, b) => b[0].length - a[0].length)[0]?.[1] ?? "EA Trade Link"

  const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(session?.user?.role ?? "")
  // Use server-passed values (always DB-fresh) for display; fall back to session for email
  const displayName  = userName  || session?.user?.name  || ""
  const displayImage = userImage || session?.user?.image || ""

  return (
    <header className="sticky top-0 z-40 h-14 flex items-center justify-between gap-4 px-6" style={{ background: "rgba(5,9,26,0.85)", borderBottom: "1px solid rgba(255,255,255,0.06)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" }}>
      {/* Left: page title */}
      <div className="flex items-center gap-3 min-w-0">
        <div>
          <h1 className="text-[14px] font-bold text-foreground tracking-tight leading-none">{title}</h1>
          <p className="text-[11px] text-muted-foreground mt-0.5 hidden sm:block">
            EA Trade Link · China–Tanzania Platform
          </p>
        </div>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-1.5">
        {/* Browse link for users */}
        {!isAdmin && (
          <Link href="/">
            <Button variant="ghost" size="sm" className="hidden sm:flex gap-1.5 text-muted-foreground text-xs font-medium h-8">
              <Globe2 className="h-3.5 w-3.5" />
              Browse
            </Button>
          </Link>
        )}

        {/* Notification bell */}
        <NotificationBell />

        {/* Divider */}
        <div className="h-5 w-px bg-border mx-1" />

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-muted transition-colors outline-none">
              <Avatar className="h-6 w-6">
                <AvatarImage src={displayImage} />
                <AvatarFallback className="bg-primary text-primary-foreground text-[10px] font-bold">
                  {getInitials(displayName || "U")}
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:flex flex-col items-start leading-none">
                <span className="text-[13px] font-semibold text-foreground">{displayName}</span>
                <span className="text-[10px] text-muted-foreground capitalize mt-0.5">
                  {session?.user?.role?.toLowerCase() ?? "user"}
                </span>
              </div>
              <ChevronDown className="h-3 w-3 text-muted-foreground hidden sm:block" />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-52 rounded-xl shadow-lg border border-border/60">
            <DropdownMenuLabel className="font-normal py-2.5 px-3">
              <div className="flex items-center gap-2.5">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={displayImage} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
                    {getInitials(displayName || "U")}
                  </AvatarFallback>
                </Avatar>
                <div className="leading-none">
                  <p className="text-[13px] font-semibold text-foreground">{displayName}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 truncate max-w-[140px]">{session?.user?.email}</p>
                </div>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            <DropdownMenuItem asChild>
              <Link href="/profile" className="cursor-pointer rounded-lg text-[13px]">
                <User className="mr-2 h-3.5 w-3.5" />Profile
              </Link>
            </DropdownMenuItem>

            {isAdmin && (
              <DropdownMenuItem asChild>
                <Link href="/admin/dashboard" className="cursor-pointer rounded-lg text-[13px]">
                  <Settings className="mr-2 h-3.5 w-3.5" />Admin Panel
                </Link>
              </DropdownMenuItem>
            )}

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={() => signOut({ callbackUrl: `${window.location.origin}/login` })}
              className="cursor-pointer text-destructive focus:text-destructive rounded-lg text-[13px]"
            >
              <LogOut className="mr-2 h-3.5 w-3.5" />Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
