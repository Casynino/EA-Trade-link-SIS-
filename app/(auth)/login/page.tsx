"use client"

import { Suspense, useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import {
  Globe2, Eye, EyeOff, Loader2, ArrowRight,
  GraduationCap, Briefcase, CheckCircle2, Shield,
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

const PORTALS = [
  {
    value: "STUDENT",
    emoji: "🎓",
    icon: GraduationCap,
    label: "Student",
    tagline: "Login as Student",
    desc: "Scholarships, study programs, academic opportunities",
    color: "#38bdf8",
    border: "rgba(56,189,248,0.4)",
    bg: "rgba(56,189,248,0.07)",
    activeBg: "rgba(56,189,248,0.12)",
  },
  {
    value: "BUSINESS",
    emoji: "💼",
    icon: Briefcase,
    label: "Business",
    tagline: "Login as Business",
    desc: "Visa services, factory visits, trade opportunities",
    color: "#D4AF37",
    border: "rgba(212,175,55,0.4)",
    bg: "rgba(212,175,55,0.07)",
    activeBg: "rgba(212,175,55,0.12)",
  },
] as const

export default function LoginPage() {
  return <Suspense><LoginForm /></Suspense>
}

function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const { toast } = useToast()

  const isAdminMode = params.get("type") === "admin"
  const callbackUrl = params.get("callbackUrl") || params.get("redirect") || ""

  const [accountType, setAccountType] = useState<"STUDENT" | "BUSINESS" | "">("")
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const selectedPortal = PORTALS.find(p => p.value === accountType)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return
    if (!isAdminMode && !accountType) return
    setLoading(true)
    try {
      const result = await signIn("credentials", { email, password, redirect: false })
      if (result?.error) {
        toast({ title: "Sign in failed", description: "Incorrect email or password.", variant: "destructive" })
        return
      }

      const sessionRes = await fetch("/api/auth/session")
      const session = await sessionRes.json()
      const actualType: string = session?.user?.accountType ?? "STUDENT"

      if (actualType === "ADMIN") {
        router.push("/admin/dashboard")
        router.refresh()
        return
      }

      if (!isAdminMode && actualType !== accountType) {
        const actualPortal = PORTALS.find(p => p.value === actualType)
        toast({
          title: `${actualPortal?.emoji ?? ""} Logged in as ${actualPortal?.label ?? actualType}`,
          description: `Your account is registered as ${actualPortal?.label ?? actualType}. Redirecting to the correct dashboard.`,
        })
      }

      const dest = callbackUrl || "/dashboard"
      router.push(dest)
      router.refresh()
    } catch {
      toast({ title: "Error", description: "Something went wrong. Try again.", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    background: "rgba(255,255,255,0.07)",
    border: "1px solid rgba(255,255,255,0.12)",
    color: "white",
  } as React.CSSProperties

  // ── Admin login view ────────────────────────────────────────────────────────
  if (isAdminMode) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="relative w-full max-w-sm">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2.5 justify-center">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl shadow-lg"
                style={{ background: "linear-gradient(135deg,#C8102E,#0F2557)" }}>
                <Globe2 className="h-5 w-5 text-white" />
              </div>
              <div className="text-left leading-none">
                <p className="font-bold text-white text-sm">EA Trade Link</p>
                <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>Admin Portal</p>
              </div>
            </Link>
          </div>

          <div className="mb-6 text-center">
            <div className="inline-flex items-center gap-2 rounded-2xl px-4 py-2 mb-3"
              style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.2)" }}>
              <Shield className="h-4 w-4" style={{ color: "#f87171" }} />
              <span className="text-sm font-bold" style={{ color: "#f87171" }}>Admin Access</span>
            </div>
            <h2 className="text-2xl font-black text-white mb-1">Admin Login</h2>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
              Restricted to authorized administrators only.
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(248,113,113,0.15)",
              borderRadius: "1.25rem",
              padding: "1.5rem",
            }}>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.7)" }}>
                Admin Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@eatradelink.com"
                required
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
                style={inputStyle}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.7)" }}>
                Password
              </label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Admin password"
                  required
                  className="w-full rounded-xl px-4 py-2.5 pr-10 text-sm outline-none"
                  style={inputStyle}
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: "rgba(255,255,255,0.35)" }}>
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-black transition-all disabled:opacity-40"
              style={{ background: "#f87171", color: "#fff" }}
            >
              {loading
                ? <><Loader2 className="h-4 w-4 animate-spin" />Signing in…</>
                : <><Shield className="h-4 w-4" />Sign In as Admin <ArrowRight className="h-4 w-4" /></>}
            </button>
          </form>

          <div className="mt-4 text-center">
            <Link href="/login" className="text-xs transition-colors"
              style={{ color: "rgba(255,255,255,0.3)" }}
              onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.6)")}
              onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}>
              ← Back to user login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ── Regular user login view ─────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="relative w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 justify-center">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl shadow-lg"
              style={{ background: "linear-gradient(135deg,#C8102E,#0F2557)" }}>
              <Globe2 className="h-5 w-5 text-white" />
            </div>
            <div className="text-left leading-none">
              <p className="font-bold text-white text-sm">EA Trade Link</p>
              <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>China–Tanzania Platform</p>
            </div>
          </Link>
        </div>

        <div className="mb-6 text-center">
          <h2 className="text-2xl font-black text-white mb-1">Welcome back</h2>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
            Select your account type to continue.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          {PORTALS.map(p => {
            const active = accountType === p.value
            return (
              <button
                key={p.value}
                type="button"
                onClick={() => setAccountType(p.value)}
                className="rounded-2xl p-4 text-left transition-all hover:-translate-y-0.5"
                style={{
                  background: active ? p.activeBg : p.bg,
                  border: `2px solid ${active ? p.border : "rgba(255,255,255,0.07)"}`,
                  boxShadow: active ? `0 0 20px ${p.bg}` : "none",
                }}
              >
                <div className="text-2xl mb-2">{p.emoji}</div>
                <p className="text-xs font-black" style={{ color: active ? p.color : "rgba(255,255,255,0.7)" }}>
                  {p.tagline}
                </p>
                <p className="text-[10px] mt-0.5 leading-relaxed" style={{ color: "rgba(255,255,255,0.35)" }}>
                  {p.desc}
                </p>
                {active && (
                  <div className="mt-2 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" style={{ color: p.color }} />
                    <span className="text-[10px] font-semibold" style={{ color: p.color }}>Selected</span>
                  </div>
                )}
              </button>
            )
          })}
        </div>

        <form onSubmit={onSubmit} className="space-y-4"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "1.25rem",
            padding: "1.5rem",
          }}>
          {selectedPortal && (
            <div className="flex items-center gap-2 rounded-xl px-3 py-2 mb-1"
              style={{ background: selectedPortal.bg, border: `1px solid ${selectedPortal.border}` }}>
              <selectedPortal.icon className="h-3.5 w-3.5 shrink-0" style={{ color: selectedPortal.color }} />
              <span className="text-xs font-semibold" style={{ color: selectedPortal.color }}>
                {selectedPortal.tagline}
              </span>
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.7)" }}>
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all"
              style={inputStyle}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.7)" }}>
              Password
            </label>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Your password"
                required
                className="w-full rounded-xl px-4 py-2.5 pr-10 text-sm outline-none transition-all"
                style={inputStyle}
              />
              <button type="button" onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: "rgba(255,255,255,0.35)" }}>
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading || !accountType}
            className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-black transition-all disabled:opacity-40 mt-1"
            style={{
              background: selectedPortal ? selectedPortal.color : "#D4AF37",
              color: "#05091a",
            }}
          >
            {loading
              ? <><Loader2 className="h-4 w-4 animate-spin" />Signing in…</>
              : <>{selectedPortal ? `Log In as ${selectedPortal.label}` : "Select Account Type"} <ArrowRight className="h-4 w-4" /></>}
          </button>
        </form>

        <p className="mt-5 text-center text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-semibold hover:underline" style={{ color: "#D4AF37" }}>
            Create Account
          </Link>
        </p>

        <div className="mt-4 text-center">
          <Link href="/login?type=admin"
            className="inline-flex items-center gap-1.5 text-xs transition-colors"
            style={{ color: "rgba(255,255,255,0.25)" }}
            onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.55)")}
            onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.25)")}>
            <Shield className="h-3 w-3" />Admin login
          </Link>
        </div>

        <div className="mt-5 rounded-xl p-4 text-xs space-y-1"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.35)" }}>
          <p className="font-semibold mb-2" style={{ color: "rgba(255,255,255,0.5)" }}>Demo accounts:</p>
          <p>🎓 Student: <span style={{ color: "rgba(255,255,255,0.6)" }}>student@demo.com / student123!</span></p>
          <p>💼 Business: <span style={{ color: "rgba(255,255,255,0.6)" }}>business@demo.com / business123!</span></p>
          <p>🔐 Admin: <span style={{ color: "rgba(255,255,255,0.6)" }}>admin@eatradelink.com / admin123!</span></p>
        </div>
      </div>
    </div>
  )
}
