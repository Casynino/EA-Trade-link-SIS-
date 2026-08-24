import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

// ─── MAINTENANCE MODE ────────────────────────────────────────────────────────
// Set to true to show the maintenance page to everyone.
// Set to false (and redeploy) to bring the site back online.
const MAINTENANCE_MODE = false
// ─────────────────────────────────────────────────────────────────────────────

// Fully public — no auth ever required
const FULLY_PUBLIC = [
  "/",
  "/login",
  "/register",
  "/start",
  "/opportunities",
  "/auth/student/login",
  "/auth/student/register",
  "/auth/business/login",
  "/auth/business/register",
]

// Browsable unauthenticated but role-gated for authenticated users
const STUDENT_ONLY_PATHS  = ["/scholarships", "/apply-to-china"]
const BUSINESS_ONLY_PATHS = ["/apply-visa", "/factory-visits", "/sourcing", "/visa", "/canton-fair"]

// Application FORMS. An account is REQUIRED before these can be opened at all —
// a guest must never be able to fill one in and only hit a wall at submit time.
// Each entry names where to send a guest to create an account.
const REQUIRES_ACCOUNT: { path: string; register: string }[] = [
  { path: "/apply-to-china", register: "/auth/student/register" },
]

function getAccountType(userTypes?: string, role?: string): string {
  if (role && ["ADMIN", "SUPER_ADMIN"].includes(role)) return "ADMIN"
  try {
    const types: string[] = JSON.parse(userTypes ?? '["STUDENT"]')
    return types[0] ?? "STUDENT"
  } catch {
    return "STUDENT"
  }
}

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isAuthenticated = !!req.auth

  // 0. Maintenance mode — redirect everyone except API routes to /maintenance
  if (MAINTENANCE_MODE) {
    if (!pathname.startsWith("/maintenance") && !pathname.startsWith("/api/")) {
      return NextResponse.redirect(new URL("/maintenance", req.url))
    }
    return NextResponse.next()
  }

  // 1. Always allow fully public routes
  if (FULLY_PUBLIC.some(p => pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.next()
  }

  // 2. API routes handle their own auth
  if (pathname.startsWith("/api/")) {
    return NextResponse.next()
  }

  // 3. Unauthenticated → send them to create an account / sign in
  if (!isAuthenticated) {
    // Application forms always require an account first — checked BEFORE the
    // marketing-page allowance below, which would otherwise let guests in.
    const formGate = REQUIRES_ACCOUNT.find(
      r => pathname === r.path || pathname.startsWith(r.path + "/"),
    )
    if (formGate) {
      const registerUrl = new URL(formGate.register, req.url)
      registerUrl.searchParams.set("redirect", pathname)
      return NextResponse.redirect(registerUrl)
    }

    // Let unauthenticated users browse role-specific marketing pages
    const browseOk = [...STUDENT_ONLY_PATHS, ...BUSINESS_ONLY_PATHS]
    if (browseOk.some(p => pathname === p || pathname.startsWith(p + "/"))) {
      return NextResponse.next()
    }
    const loginUrl = new URL("/login", req.url)
    loginUrl.searchParams.set("redirect", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Authenticated from here
  const accountType = getAccountType(
    req.auth?.user?.userTypes as string | undefined,
    req.auth?.user?.role as string | undefined,
  )

  // 4. Admins pass through everywhere
  if (accountType === "ADMIN") return NextResponse.next()

  // 5. Non-admins cannot access admin panel
  if (pathname.startsWith("/admin")) {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  // 6. Business users cannot access student-only pages
  if (accountType === "BUSINESS") {
    if (STUDENT_ONLY_PATHS.some(p => pathname === p || pathname.startsWith(p + "/"))) {
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }
  }

  // 7. Student users cannot access business-only pages
  if (accountType === "STUDENT") {
    if (BUSINESS_ONLY_PATHS.some(p => pathname === p || pathname.startsWith(p + "/"))) {
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp)).*)"],
}
