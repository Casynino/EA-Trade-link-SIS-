"use client"

import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { GraduationCap, Briefcase, ArrowRight, Globe2, CheckCircle2 } from "lucide-react"
import { PageBackground } from "@/components/ui/page-background"
import { Suspense } from "react"

function StartPageInner() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()

  // Preserve the redirect destination through the entire auth flow
  const redirectTo = searchParams.get("redirect") || null

  const handleStudent = () => {
    if (status === "loading") return
    const dest = redirectTo ?? "/apply-to-china"
    if (session?.user) {
      router.push(dest)
    } else {
      router.push(`/auth/student/register?redirect=${encodeURIComponent(dest)}`)
    }
  }

  const handleBusiness = () => {
    if (status === "loading") return
    const dest = redirectTo ?? "/apply-visa"
    if (session?.user) {
      router.push(dest)
    } else {
      router.push(`/auth/business/register?redirect=${encodeURIComponent(dest)}`)
    }
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center" style={{ background: "#05091a" }}>
      <PageBackground />
      <div className="relative z-10 w-full max-w-2xl px-6 py-12">

        {/* Brand */}
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center gap-2.5 justify-center mb-6">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl"
              style={{ background: "linear-gradient(135deg,#C8102E,#0F2557)" }}>
              <Globe2 className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-white text-sm">EA Trade Link</span>
          </Link>
          <h1 className="text-3xl font-black text-white mb-3">How would you like to continue?</h1>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
            Choose the option that best describes you.
          </p>
        </div>

        {/* Two choices */}
        <div className="grid gap-4 sm:grid-cols-2 mb-8">

          {/* Student */}
          <motion.button
            onClick={handleStudent}
            className="text-left rounded-2xl p-6 flex flex-col h-full transition-all"
            style={{ background: "rgba(56,189,248,0.06)", border: "1px solid rgba(56,189,248,0.2)" }}
            whileHover={{ background: "rgba(56,189,248,0.12)", borderColor: "rgba(56,189,248,0.4)", y: -3 }}
            transition={{ duration: 0.18 }}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl mb-4"
              style={{ background: "rgba(56,189,248,0.12)" }}>
              <GraduationCap className="h-6 w-6" style={{ color: "#38bdf8" }} />
            </div>
            <p className="text-lg font-black text-white mb-2">Continue as Student</p>
            <p className="text-sm mb-5 flex-1" style={{ color: "rgba(255,255,255,0.5)" }}>
              For scholarships, university applications, language programs, and study in China.
            </p>
            <ul className="space-y-1.5 mb-5">
              {["Scholarship placement", "University matching", "Bachelor / Master / PhD / Language", "48hr expert review"].map(i => (
                <li key={i} className="flex items-center gap-2 text-xs" style={{ color: "rgba(255,255,255,0.55)" }}>
                  <CheckCircle2 className="h-3 w-3 shrink-0" style={{ color: "#38bdf8" }} /> {i}
                </li>
              ))}
            </ul>
            <div className="flex items-center gap-2 text-sm font-bold" style={{ color: "#38bdf8" }}>
              Continue as Student <ArrowRight className="h-4 w-4" />
            </div>
          </motion.button>

          {/* Business */}
          <motion.button
            onClick={handleBusiness}
            className="text-left rounded-2xl p-6 flex flex-col h-full transition-all"
            style={{ background: "rgba(212,175,55,0.06)", border: "1px solid rgba(212,175,55,0.2)" }}
            whileHover={{ background: "rgba(212,175,55,0.12)", borderColor: "rgba(212,175,55,0.4)", y: -3 }}
            transition={{ duration: 0.18 }}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl mb-4"
              style={{ background: "rgba(212,175,55,0.12)" }}>
              <Briefcase className="h-6 w-6" style={{ color: "#D4AF37" }} />
            </div>
            <p className="text-lg font-black text-white mb-2">Continue as Business</p>
            <p className="text-sm mb-5 flex-1" style={{ color: "rgba(255,255,255,0.5)" }}>
              For business visas, factory visits, Canton Fair, trade exhibitions, and product sourcing.
            </p>
            <ul className="space-y-1.5 mb-5">
              {["Business visa processing", "Factory visits & sourcing", "Canton Fair access", "End-to-end service"].map(i => (
                <li key={i} className="flex items-center gap-2 text-xs" style={{ color: "rgba(255,255,255,0.55)" }}>
                  <CheckCircle2 className="h-3 w-3 shrink-0" style={{ color: "#D4AF37" }} /> {i}
                </li>
              ))}
            </ul>
            <div className="flex items-center gap-2 text-sm font-bold" style={{ color: "#D4AF37" }}>
              Continue as Business <ArrowRight className="h-4 w-4" />
            </div>
          </motion.button>
        </div>

        <p className="text-center text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
          Already have an account?{" "}
          <Link
            href={redirectTo ? `/login?redirect=${encodeURIComponent(redirectTo)}` : "/login"}
            className="underline"
            style={{ color: "rgba(255,255,255,0.4)" }}
          >Log in</Link>
        </p>
      </div>
    </div>
  )
}

export default function StartPage() {
  return (
    <Suspense>
      <StartPageInner />
    </Suspense>
  )
}
