"use client"

import { Suspense, useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { GraduationCap, Globe2, Eye, EyeOff, Loader2, ArrowRight, AlertCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { PageBackground } from "@/components/ui/page-background"

export default function StudentLoginPage() {
  return <Suspense><Form /></Suspense>
}

function Form() {
  const router = useRouter()
  const params = useSearchParams()
  const { toast } = useToast()
  const redirect = params.get("redirect") || "/apply-to-china"

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [roleError, setRoleError] = useState<"BUSINESS" | "ADMIN" | null>(null)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return
    setLoading(true)
    setRoleError(null)

    try {
      // Pre-check role before attempting sign-in
      const check = await fetch("/api/auth/check-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      const { accountType } = await check.json()

      if (accountType === "BUSINESS") {
        setRoleError("BUSINESS")
        setLoading(false)
        return
      }
      if (accountType === "ADMIN") {
        setRoleError("ADMIN")
        setLoading(false)
        return
      }

      const result = await signIn("credentials", { email, password, redirect: false })
      if (result?.error) {
        toast({ title: "Sign in failed", description: "Incorrect email or password.", variant: "destructive" })
      } else {
        router.push(redirect)
        router.refresh()
      }
    } catch {
      toast({ title: "Error", description: "Something went wrong. Try again.", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center px-4" style={{ background: "#05091a" }}>
      <PageBackground />
      <div className="relative z-10 w-full max-w-sm">

        {/* Brand + context */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 justify-center mb-6">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl"
              style={{ background: "linear-gradient(135deg,#C8102E,#0F2557)" }}>
              <Globe2 className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-white text-sm">EA Trade Link</span>
          </Link>
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-5"
            style={{ background: "rgba(56,189,248,0.1)", border: "1px solid rgba(56,189,248,0.2)" }}>
            <GraduationCap className="h-3.5 w-3.5" style={{ color: "#38bdf8" }} />
            <span className="text-xs font-semibold" style={{ color: "#38bdf8" }}>Study in China</span>
          </div>
          <h1 className="text-2xl font-black text-white mb-1">Log In</h1>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
            Continue your study application.
          </p>
        </div>

        {/* Wrong-role error */}
        {roleError === "BUSINESS" && (
          <div className="rounded-xl p-4 mb-5 flex gap-3"
            style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-400" />
            <div>
              <p className="text-sm font-semibold text-red-300 mb-1">This is a Business account</p>
              <p className="text-xs text-red-300/70">
                This email is registered as a Business account. To apply for business services,{" "}
                <Link href={`/auth/business/login?redirect=/apply-visa`} className="underline font-semibold">
                  use the Business login
                </Link>.
              </p>
            </div>
          </div>
        )}
        {roleError === "ADMIN" && (
          <div className="rounded-xl p-4 mb-5 flex gap-3"
            style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-400" />
            <p className="text-sm text-red-300">
              Admin accounts cannot log in here. Please use the{" "}
              <Link href="/login" className="underline font-semibold">general login page</Link>.
            </p>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.7)" }}>
              Email Address
            </label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com" required
              className="w-full rounded-xl px-4 py-2.5 text-sm outline-none text-white"
              style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)" }} />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.7)" }}>
              Password
            </label>
            <div className="relative">
              <input type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Your password" required
                className="w-full rounded-xl px-4 py-2.5 pr-10 text-sm outline-none text-white"
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)" }} />
              <button type="button" onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "rgba(255,255,255,0.35)" }}>
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-black transition-all disabled:opacity-50"
            style={{ background: "#38bdf8", color: "#05091a" }}>
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" />Signing in…</> : <>Log In <ArrowRight className="h-4 w-4" /></>}
          </button>
        </form>

        <p className="mt-6 text-center text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
          Don't have an account?{" "}
          <Link href={`/auth/student/register?redirect=${encodeURIComponent(redirect)}`}
            className="font-semibold hover:underline" style={{ color: "#38bdf8" }}>
            Create Account
          </Link>
        </p>

        <p className="mt-4 text-center text-xs" style={{ color: "rgba(255,255,255,0.2)" }}>
          <Link href="/" className="hover:underline">← Back to home</Link>
        </p>
      </div>
    </div>
  )
}
