"use client"

import { Suspense, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Briefcase, Globe2, Eye, EyeOff, Loader2, ArrowRight } from "lucide-react"
import { registerUser } from "@/actions/auth"
import { useToast } from "@/components/ui/use-toast"
import { PageBackground } from "@/components/ui/page-background"

export default function BusinessRegisterPage() {
  return <Suspense><Form /></Suspense>
}

function Form() {
  const router = useRouter()
  const params = useSearchParams()
  const { toast } = useToast()
  const redirect = params.get("redirect") || "/apply-visa"

  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    fd.set("userTypes", JSON.stringify(["BUSINESS"]))
    // Combine company name into the name field as context
    const company = fd.get("companyName") as string
    if (company) {
      const name = fd.get("name") as string
      fd.set("name", name) // keep name as-is; company stored via phone note
    }
    setLoading(true)
    try {
      const result = await registerUser(fd)
      if (result.error) {
        toast({ title: "Registration failed", description: result.error, variant: "destructive" })
      } else {
        toast({ title: "Account created!", description: "Welcome to EA Trade Link." })
        router.push(redirect)
        router.refresh()
      }
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
            style={{ background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.2)" }}>
            <Briefcase className="h-3.5 w-3.5" style={{ color: "#D4AF37" }} />
            <span className="text-xs font-semibold" style={{ color: "#D4AF37" }}>China Business Services</span>
          </div>
          <h1 className="text-2xl font-black text-white mb-1">Create Account</h1>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
            Free to sign up. Start your service request right after.
          </p>
        </div>

        <form onSubmit={handleSubmit}
          className="rounded-2xl p-6 space-y-4"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.7)" }}>Full Name</label>
            <input name="name" type="text" placeholder="Your full name" required
              className="w-full rounded-xl px-3 py-2.5 text-sm outline-none text-white"
              style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }} />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.7)" }}>
              Company Name <span style={{ color: "rgba(255,255,255,0.35)" }}>(optional)</span>
            </label>
            <input name="companyName" type="text" placeholder="Your company or business name"
              className="w-full rounded-xl px-3 py-2.5 text-sm outline-none text-white"
              style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }} />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.7)" }}>Phone Number</label>
            <input name="phone" type="tel" placeholder="+255 712 345 678"
              className="w-full rounded-xl px-3 py-2.5 text-sm outline-none text-white"
              style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }} />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.7)" }}>Email Address</label>
            <input name="email" type="email" placeholder="your@email.com" required
              className="w-full rounded-xl px-3 py-2.5 text-sm outline-none text-white"
              style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }} />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.7)" }}>Password</label>
            <div className="relative">
              <input name="password" type={showPw ? "text" : "password"} placeholder="Min. 8 characters"
                required minLength={8}
                className="w-full rounded-xl px-3 py-2.5 pr-10 text-sm outline-none text-white"
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }} />
              <button type="button" onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "rgba(255,255,255,0.35)" }}>
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-black transition-all disabled:opacity-50"
            style={{ background: "#D4AF37", color: "#05091a" }}>
            {loading
              ? <><Loader2 className="h-4 w-4 animate-spin" />Creating account…</>
              : <>Create Account & Continue <ArrowRight className="h-4 w-4" /></>}
          </button>
        </form>

        <p className="mt-5 text-center text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
          Already have an account?{" "}
          <Link href={`/auth/business/login?redirect=${encodeURIComponent(redirect)}`}
            className="font-semibold hover:underline" style={{ color: "#D4AF37" }}>
            Log In
          </Link>
        </p>

        <p className="mt-3 text-center text-xs" style={{ color: "rgba(255,255,255,0.2)" }}>
          <Link href="/" className="hover:underline">← Back to home</Link>
        </p>
      </div>
    </div>
  )
}
