"use client"

import { Suspense, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Globe2, GraduationCap, Briefcase, Eye, EyeOff, Loader2, ArrowRight, CheckCircle2 } from "lucide-react"
import { registerUser } from "@/actions/auth"
import { useToast } from "@/components/ui/use-toast"

const PORTALS = [
  {
    value: "STUDENT",
    icon: GraduationCap,
    emoji: "🎓",
    label: "Student",
    tagline: "I want to study in China",
    desc: "Scholarships, university placements, language programs, admission guidance.",
    color: "#38bdf8",
    border: "rgba(56,189,248,0.4)",
    bg: "rgba(56,189,248,0.08)",
    glow: "rgba(56,189,248,0.2)",
    perks: ["University matching", "Admission letter support", "Bachelor / Master / PhD / Language"],
  },
  {
    value: "BUSINESS",
    icon: Briefcase,
    emoji: "💼",
    label: "Business",
    tagline: "I need China business services",
    desc: "Business visas, factory visits, Canton Fair, trade exhibitions, product sourcing.",
    color: "#D4AF37",
    border: "rgba(212,175,55,0.4)",
    bg: "rgba(212,175,55,0.08)",
    glow: "rgba(212,175,55,0.2)",
    perks: ["Business visa processing", "Factory visits & sourcing", "Canton Fair access", "RMB ↔ TZS exchange"],
  },
]

export default function RegisterPage() {
  return <Suspense><RegisterForm /></Suspense>
}

function RegisterForm() {
  const router = useRouter()
  const params = useSearchParams()
  const { toast } = useToast()

  const preType = params.get("type")?.toUpperCase().replace(/-/g, "_") ?? ""
  const redirectTo = params.get("redirect") ?? "/dashboard"

  const [step, setStep] = useState<"choose" | "details">(
    PORTALS.some(p => p.value === preType) ? "details" : "choose"
  )
  const [selectedPortal, setSelectedPortal] = useState<string>(
    PORTALS.some(p => p.value === preType) ? preType : ""
  )
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw] = useState(false)

  const portal = PORTALS.find(p => p.value === selectedPortal)

  function choosePortal(value: string) {
    setSelectedPortal(value)
    setStep("details")
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!selectedPortal) return
    const fd = new FormData(e.currentTarget)
    fd.set("userTypes", JSON.stringify([selectedPortal]))
    setLoading(true)
    try {
      const result = await registerUser(fd)
      if (result.error) {
        toast({ title: "Registration failed", description: result.error, variant: "destructive" })
      } else {
        toast({ title: "Account created!", description: "Welcome to EA Trade Link." })
        router.push(redirectTo)
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">

      <div className="relative w-full max-w-lg">
        {/* Brand */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 justify-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl shadow-lg"
              style={{ background: "linear-gradient(135deg,#C8102E,#0F2557)" }}>
              <Globe2 className="h-5 w-5 text-white" />
            </div>
            <div className="text-left leading-none">
              <p className="font-bold text-white text-sm">EA Trade Link</p>
              <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>China Placement & Business Services</p>
            </div>
          </Link>
        </div>

        {/* ── STEP 1: Choose portal ── */}
        {step === "choose" && (
          <div>
            <div className="text-center mb-8">
              <h1 className="text-2xl font-black text-white mb-2">Create your account</h1>
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
                Choose the option that best describes you.
              </p>
            </div>

            <div className="grid gap-4">
              {PORTALS.map(p => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => choosePortal(p.value)}
                  className="group w-full rounded-2xl p-6 text-left transition-all hover:-translate-y-0.5"
                  style={{
                    background: p.bg,
                    border: `2px solid ${p.border}`,
                  }}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-3xl"
                      style={{ background: `rgba(255,255,255,0.06)`, border: `1px solid ${p.border}` }}>
                      {p.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-white text-lg mb-1">{p.tagline}</p>
                      <p className="text-sm" style={{ color: p.color }}>{p.desc}</p>
                    </div>
                    <ArrowRight className="h-5 w-5 shrink-0 transition-transform group-hover:translate-x-1"
                      style={{ color: p.color }} />
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-1.5">
                    {p.perks.map(perk => (
                      <div key={perk} className="flex items-center gap-1.5 text-xs"
                        style={{ color: "rgba(255,255,255,0.55)" }}>
                        <CheckCircle2 className="h-3 w-3 shrink-0" style={{ color: p.color }} />
                        {perk}
                      </div>
                    ))}
                  </div>
                </button>
              ))}
            </div>

            <p className="mt-6 text-center text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
              Already have an account?{" "}
              <Link href="/login" className="font-semibold hover:underline" style={{ color: "#D4AF37" }}>Log in</Link>
            </p>
          </div>
        )}

        {/* ── STEP 2: Fill details ── */}
        {step === "details" && portal && (
          <div>
            {/* Back + header */}
            <div className="flex items-center gap-3 mb-6">
              <button
                type="button"
                onClick={() => setStep("choose")}
                className="flex items-center gap-1.5 text-sm transition-colors"
                style={{ color: "rgba(255,255,255,0.4)" }}
              >
                ← Back
              </button>
              <div
                className="flex-1 rounded-xl px-4 py-2.5 flex items-center gap-3"
                style={{ background: portal.bg, border: `1px solid ${portal.border}` }}
              >
                <span className="text-xl">{portal.emoji}</span>
                <div>
                  <p className="text-xs font-bold" style={{ color: portal.color }}>{portal.tagline}</p>
                </div>
              </div>
            </div>

            <h2 className="text-xl font-black text-white text-center mb-6">Create Your Account</h2>

            <form
              onSubmit={handleSubmit}
              className="rounded-2xl p-6 space-y-4"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Full Name" name="name" placeholder="Your full name" required />
                <Field label="Phone (optional)" name="phone" placeholder="+255 712 345 678" />
              </div>
              <Field label="Email Address" name="email" type="email" placeholder="you@example.com" required />
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.7)" }}>
                  Password
                </label>
                <div className="relative">
                  <input
                    name="password"
                    type={showPw ? "text" : "password"}
                    placeholder="Min. 8 characters"
                    required
                    minLength={8}
                    className="w-full rounded-xl px-3 py-2.5 pr-10 text-sm outline-none text-white"
                    style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: "rgba(255,255,255,0.35)" }}
                  >
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-black transition-all disabled:opacity-50"
                style={{ background: portal.color, color: "#05091a", boxShadow: `0 0 24px ${portal.glow}` }}
              >
                {loading
                  ? <><Loader2 className="h-4 w-4 animate-spin" />Creating account…</>
                  : <>Create {portal.label} Account <ArrowRight className="h-4 w-4" /></>}
              </button>
            </form>

            <p className="mt-5 text-center text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
              Already have an account?{" "}
              <Link href="/login" className="font-semibold hover:underline" style={{ color: "#D4AF37" }}>Log in</Link>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function Field({ label, name, placeholder, type = "text", required }: {
  label: string; name: string; placeholder?: string; type?: string; required?: boolean
}) {
  return (
    <div>
      <label className="block text-xs font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.7)" }}>{label}</label>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-xl px-3 py-2.5 text-sm outline-none text-white"
        style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}
      />
    </div>
  )
}
