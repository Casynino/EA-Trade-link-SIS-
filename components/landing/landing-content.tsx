"use client"

import { useRef } from "react"
import { useSession } from "next-auth/react"
import { motion, useInView } from "framer-motion"
import { GlobeHero } from "@/components/ui/globe-hero"
import { PageBackground } from "@/components/ui/page-background"
import { OppBrowser } from "@/components/opportunities/opp-browser"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  Globe2, ArrowRight, CheckCircle2, Star,
  GraduationCap, Briefcase, Calendar, Factory, ArrowLeftRight,
  Plane, Search, Building2, Users,
  ShieldCheck, Zap, Clock, LayoutDashboard,
} from "lucide-react"

function Reveal({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: "-60px 0px" })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

function SectionDivider({ from, to }: { from: string; to: string }) {
  return (
    <div
      className="w-full h-20 pointer-events-none"
      style={{ background: `linear-gradient(to bottom, ${from}, ${to})`, position: "relative", zIndex: 1 }}
    />
  )
}

function NoiseOverlay() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-[1] opacity-[0.025]"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
        backgroundRepeat: "repeat",
        backgroundSize: "128px 128px",
      }}
    />
  )
}

const STATS = [
  { icon: GraduationCap, label: "Scholarships",  color: "text-sky-400",    bg: "bg-sky-400/10",    key: "SCHOLARSHIP" },
  { icon: Briefcase,     label: "Jobs in China",  color: "text-emerald-400",bg: "bg-emerald-400/10",key: "JOB" },
  { icon: Calendar,      label: "Trade Events",   color: "text-rose-400",   bg: "bg-rose-400/10",   key: "EVENTS" },
  { icon: Factory,       label: "Factory Tours",  color: "text-amber-400",  bg: "bg-amber-400/10",  key: "FACTORY_VISIT" },
]

interface Props {
  opportunities: any[]
  statValues: Record<string, number>
  userName?: string
}

export function LandingContent({ opportunities, statValues, userName }: Props) {
  const { data: session, status } = useSession()
  const isLoggedIn   = status === "authenticated"
  const isAdmin      = ["ADMIN", "SUPER_ADMIN"].includes(session?.user?.role ?? "")
  const accountType  = session?.user?.accountType ?? ""   // "STUDENT" | "BUSINESS" | "ADMIN"
  const isBusiness   = isLoggedIn && accountType === "BUSINESS"
  const isStudent    = isLoggedIn && accountType === "STUDENT"
  const dashHref     = isAdmin ? "/admin/dashboard" : "/dashboard"

  // Returns the direct service URL for logged-in users, or login-with-redirect for guests
  const svc = (dest: string) =>
    isLoggedIn ? dest : `/login?redirect=${encodeURIComponent(dest)}`

  return (
    <div className="relative min-h-screen" style={{ background: "#05091a" }}>
      <PageBackground />
      <NoiseOverlay />

      {/* ── Nav ── */}
      <nav
        className="sticky top-0 z-50 relative"
        style={{
          background: "rgba(5,9,26,0.85)",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
        }}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl shadow-lg"
              style={{ background: "linear-gradient(135deg,#C8102E,#0F2557)" }}>
              <Globe2 className="h-5 w-5 text-white" />
            </div>
            <div className="leading-none">
              <p className="font-bold text-white text-sm">EA Trade Link</p>
              <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>
                China Placement & Business Services
              </p>
            </div>
          </Link>
          <div className="hidden md:flex items-center gap-7 text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>
            <a href="#study-china"      className="hover:text-white transition-colors duration-200">Study in China</a>
            <a href="#business-services" className="hover:text-white transition-colors duration-200">Business Services</a>
            <a href="#opportunities"    className="hover:text-white transition-colors duration-200">Opportunities</a>
          </div>
          <div className="flex items-center gap-2.5">
            {isLoggedIn ? (
              <>
                <span className="hidden sm:block text-[13px] font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>
                  {(userName || session?.user?.name)?.split(" ")[0]}
                </span>
                <Button size="sm" asChild className="font-semibold gap-1.5" style={{ background: "#D4AF37", color: "#05091a" }}>
                  <Link href={dashHref}>
                    <LayoutDashboard className="h-3.5 w-3.5" />
                    Dashboard
                  </Link>
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild className="text-white/60 hover:text-white hover:bg-white/8">
                  <Link href="/login">Sign in</Link>
                </Button>
                <Button size="sm" asChild className="font-semibold" style={{ background: "#D4AF37", color: "#05091a" }}>
                  <Link href="/register">Get Started</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <div style={{ position: "relative", zIndex: 1 }}>
        <GlobeHero />
      </div>

      {/* ── Stats strip ── */}
      <section style={{ background: "rgba(8,15,42,0.72)", position: "relative", zIndex: 1 }}>
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {STATS.map((s, i) => (
              <Reveal key={s.label} delay={i * 0.07}>
                <motion.div
                  className="flex items-center gap-3 rounded-2xl px-4 py-4 cursor-default"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
                  whileHover={{ scale: 1.03, background: "rgba(255,255,255,0.07)" }}
                  transition={{ duration: 0.2 }}
                >
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${s.bg}`}>
                    <s.icon className={`h-5 w-5 ${s.color}`} />
                  </div>
                  <div>
                    <p className="text-xl font-black text-white">{statValues[s.key] ?? 0}</p>
                    <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{s.label}</p>
                  </div>
                </motion.div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <SectionDivider from="rgba(8,15,42,0.72)" to="rgba(5,12,35,0.85)" />

      {/* ════════════════════════════════════════════════════════
          SECTION 1 — STUDY IN CHINA
      ════════════════════════════════════════════════════════ */}
      <section id="study-china" className="py-20" style={{ background: "rgba(5,12,35,0.85)", position: "relative", zIndex: 1 }}>
        <div className="mx-auto max-w-7xl px-6">
          <Reveal className="mb-12">
            <div>
              <h2 className="text-3xl font-black text-white leading-tight">Study in China</h2>
              <p className="mt-2 text-sm max-w-lg" style={{ color: "rgba(255,255,255,0.45)" }}>
                We are a placement agency. Submit your profile — our team personally reviews, matches you to the right university and scholarship, and guides you through every step.
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.05} className="mb-12">
            <motion.div
              className="rounded-2xl p-8 relative overflow-hidden"
              style={{ background: "linear-gradient(135deg,rgba(56,189,248,0.08),rgba(99,102,241,0.06))", border: "1px solid rgba(56,189,248,0.25)" }}
              whileHover={{ background: "linear-gradient(135deg,rgba(56,189,248,0.12),rgba(99,102,241,0.1))", y: -2 }}
              transition={{ duration: 0.22 }}
            >
              <div className="flex flex-col lg:flex-row lg:items-center gap-8">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl" style={{ background: "rgba(56,189,248,0.15)" }}>
                      <GraduationCap className="h-6 w-6" style={{ color: "#38bdf8" }} />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider mb-0.5" style={{ color: "#38bdf8" }}>Study in China</p>
                      <h3 className="text-lg font-black text-white">Apply to Study in China</h3>
                    </div>
                  </div>
                  <p className="text-sm mb-6 leading-relaxed max-w-xl" style={{ color: "rgba(255,255,255,0.55)" }}>
                    Submit your profile once — our expert team personally reviews your qualifications, matches you to the right scholarships and universities, and guides you through every step of the process.
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[
                      { icon: "⚡", text: "48hr expert review" },
                      { icon: "🎯", text: "Matched scholarships" },
                      { icon: "🏛️", text: "University recommendations" },
                      { icon: "📋", text: "Pre-admission offer" },
                      { icon: "🛂", text: "Visa process support" },
                      { icon: "📞", text: "Dedicated advisor" },
                    ].map(item => (
                      <div key={item.text} className="flex items-center gap-2 text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>
                        <span className="text-base">{item.icon}</span>
                        {item.text}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-3 shrink-0 lg:w-52">
                  {isBusiness ? (
                    <>
                      <Link href="/register?type=student"
                        className="flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-black transition-all hover:scale-105"
                        style={{ background: "#38bdf8", color: "#05091a" }}>
                        Create Student Account <ArrowRight className="h-4 w-4" />
                      </Link>
                      <Link href="/login"
                        className="flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold transition-colors"
                        style={{ color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.1)" }}>
                        <span>🔐</span> Log in as Student
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link href={svc("/apply-to-china")}
                        className="flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-black transition-all hover:scale-105"
                        style={{ background: "#38bdf8", color: "#05091a" }}>
                        {isStudent ? "Continue Application" : "Start My Application"} <ArrowRight className="h-4 w-4" />
                      </Link>
                      <p className="text-center text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
                        Free to apply · Response within 48 hours
                      </p>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </Reveal>

          <Reveal delay={0.15}>
            <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "rgba(255,255,255,0.3)", letterSpacing: "0.15em" }}>
              Programs We Place Students In
            </p>
            <div className="flex flex-wrap gap-2.5">
              {[
                { label: "Bachelor's Degree", icon: "🎓" },
                { label: "Master's Degree",   icon: "🏅" },
                { label: "PhD / Doctorate",   icon: "🔬" },
                { label: "Chinese Language",  icon: "🇨🇳" },
                { label: "Short Programs",    icon: "📅" },
              ].map(p => (
                <div key={p.label} className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium"
                  style={{ background: "rgba(56,189,248,0.07)", border: "1px solid rgba(56,189,248,0.12)", color: "rgba(255,255,255,0.7)" }}>
                  <span>{p.icon}</span>{p.label}
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <SectionDivider from="rgba(5,12,35,0.85)" to="rgba(8,15,42,0.82)" />

      {/* ════════════════════════════════════════════════════════
          SECTION 2 — CHINA BUSINESS SERVICES
      ════════════════════════════════════════════════════════ */}
      <section id="business-services" className="py-20" style={{ background: "rgba(8,15,42,0.82)", position: "relative", zIndex: 1 }}>
        <div className="mx-auto max-w-7xl px-6">
          <Reveal className="mb-12">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#D4AF37", letterSpacing: "0.15em" }}>
                  Business Services
                </p>
                <h2 className="text-3xl font-black text-white leading-tight">China Business Services</h2>
                <p className="mt-2 text-sm max-w-lg" style={{ color: "rgba(255,255,255,0.45)" }}>
                  Full-service support for businesses trading with China. Visa processing, factory sourcing tours, Canton Fair access, and product sourcing — handled by our expert team.
                </p>
              </div>
              {/* CTA button: different for logged-in vs. guest */}
              {isBusiness ? (
                <Link href="/dashboard"
                  className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all hover:scale-105 shrink-0"
                  style={{ background: "#D4AF37", color: "#05091a" }}>
                  <LayoutDashboard className="h-4 w-4" />
                  My Business Dashboard
                </Link>
              ) : isLoggedIn ? (
                <Link href={dashHref}
                  className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all hover:scale-105 shrink-0"
                  style={{ background: "#D4AF37", color: "#05091a" }}>
                  <LayoutDashboard className="h-4 w-4" />
                  Go to Dashboard
                </Link>
              ) : (
                <Link href="/register?type=business"
                  className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all hover:scale-105 shrink-0"
                  style={{ background: "#D4AF37", color: "#05091a" }}>
                  Register as Business <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </div>
          </Reveal>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Plane, label: "Business Visa", tag: "Core Service",
                desc: "We process your China business visa application end-to-end. Submit your documents and travel details — we handle the rest.",
                cta: "Apply for Visa", dest: "/apply-visa",
                accent: "#a78bfa", bg: "rgba(167,139,250,0.06)", border: "rgba(167,139,250,0.18)",
              },
              {
                icon: Factory, label: "Factory Visits", tag: "Sourcing",
                desc: "Book curated factory tours across China. Verify suppliers, assess production quality, and negotiate deals in person.",
                cta: "Request Visit", dest: "/factory-visits",
                accent: "#fb923c", bg: "rgba(251,146,60,0.06)", border: "rgba(251,146,60,0.18)",
              },
              {
                icon: Building2, label: "Canton Fair", tag: "Events",
                desc: "Get registered and guided for the world's largest trade fair. Full support from registration to participation.",
                cta: "Apply for Access", dest: "/canton-fair",
                accent: "#f43f5e", bg: "rgba(244,63,94,0.06)", border: "rgba(244,63,94,0.18)",
              },
              {
                icon: Search, label: "Product Sourcing", tag: "Trade",
                desc: "Looking for specific products or suppliers? We identify, verify, and connect you with reliable Chinese manufacturers.",
                cta: "Start Sourcing", dest: "/sourcing",
                accent: "#38bdf8", bg: "rgba(56,189,248,0.06)", border: "rgba(56,189,248,0.18)",
              },
            ].map((s, i) => (
              <Reveal key={s.label} delay={i * 0.08}>
                <motion.div
                  className="rounded-2xl p-6 h-full flex flex-col"
                  style={{ background: s.bg, border: `1px solid ${s.border}` }}
                  whileHover={{ background: s.bg.replace("0.06", "0.1"), borderColor: s.accent + "44", y: -3 }}
                  transition={{ duration: 0.22 }}
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl mb-4" style={{ background: s.bg.replace("0.06", "0.15") }}>
                    <s.icon className="h-5 w-5" style={{ color: s.accent }} />
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: s.accent }}>{s.tag}</p>
                  <h3 className="font-bold text-white mb-3">{s.label}</h3>
                  <p className="text-xs leading-relaxed flex-1 mb-5" style={{ color: "rgba(255,255,255,0.45)" }}>{s.desc}</p>
                  <Link
                    href={svc(s.dest)}
                    className="flex items-center gap-1.5 text-xs font-bold transition-all hover:gap-2.5"
                    style={{ color: s.accent }}
                  >
                    {s.cta} <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </motion.div>
              </Reveal>
            ))}
          </div>

          {/* Trust bar */}
          <Reveal delay={0.2} className="mt-10">
            <div className="flex flex-wrap items-center justify-center gap-6 rounded-2xl px-8 py-5"
              style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)" }}>
              {[
                { icon: ShieldCheck, text: "Verified Processing", color: "text-emerald-400" },
                { icon: Clock,       text: "48h Response SLA",   color: "text-amber-400" },
                { icon: Users,       text: "Expert Team",        color: "text-sky-400" },
                { icon: Zap,         text: "End-to-End Service", color: "text-purple-400" },
              ].map(t => (
                <div key={t.text} className="flex items-center gap-2 text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
                  <t.icon className={`h-4 w-4 ${t.color}`} />
                  {t.text}
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <SectionDivider from="rgba(8,15,42,0.82)" to="rgba(7,13,31,0.78)" />

      {/* ════════════════════════════════════════════════════════
          SECTION 3 — OPPORTUNITIES
      ════════════════════════════════════════════════════════ */}
      <section id="opportunities" className="pb-16" style={{ background: "rgba(7,13,31,0.78)", position: "relative", zIndex: 1 }}>
        <div className="mx-auto max-w-7xl px-6">
          <Reveal className="mb-8">
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#D4AF37", letterSpacing: "0.15em" }}>
              Browse & Discover
            </p>
            <h2 className="text-2xl font-black text-white">Opportunities & Events</h2>
            <p className="mt-1.5 text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
              Jobs in China, trade exhibitions, conferences, group tours & more. Browse free — registration required to apply.
            </p>
          </Reveal>
          <OppBrowser opportunities={opportunities} />
        </div>
      </section>

      <SectionDivider from="rgba(7,13,31,0.78)" to="rgba(8,15,42,0.72)" />

      {/* ── How it works ── */}
      <section id="how-it-works" className="py-20" style={{ background: "rgba(8,15,42,0.72)", position: "relative", zIndex: 1 }}>
        <div className="mx-auto max-w-7xl px-6">
          <Reveal className="mb-12 text-center">
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#D4AF37", letterSpacing: "0.15em" }}>
              Our Process
            </p>
            <h2 className="text-2xl font-black text-white">How We Work</h2>
            <p className="mt-2 text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
              We are a consultative service — not just a listings board. We guide you personally.
            </p>
          </Reveal>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { step: "01", title: "Apply",        desc: "Submit your profile and goals — study, visa, or business. Takes 5 minutes.",             icon: "📝" },
              { step: "02", title: "Expert Review", desc: "Our team personally reviews your profile within 48 hours.",                             icon: "🔍" },
              { step: "03", title: "We Match You",  desc: "We identify the best scholarships, universities, or business opportunities for you.",   icon: "🎯" },
              { step: "04", title: "Get Results",   desc: "Receive your recommendations, pre-admission offer, or visa guidance.",                  icon: "✅" },
            ].map((s, i) => (
              <Reveal key={s.step} delay={i * 0.1}>
                <motion.div
                  className="relative rounded-2xl p-6 h-full"
                  style={{ background: "rgba(255,255,255,0.035)", border: "1px solid rgba(255,255,255,0.07)" }}
                  whileHover={{ background: "rgba(255,255,255,0.065)", borderColor: "rgba(212,175,55,0.25)", y: -3 }}
                  transition={{ duration: 0.22 }}
                >
                  {i < 3 && (
                    <div className="hidden lg:block absolute top-8 left-full w-full h-px z-0"
                      style={{ background: "linear-gradient(90deg,rgba(212,175,55,0.2),transparent)" }} />
                  )}
                  <div className="text-3xl mb-4">{s.icon}</div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-black" style={{ color: "#D4AF37" }}>{s.step}</span>
                    <h3 className="font-bold text-white">{s.title}</h3>
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>{s.desc}</p>
                </motion.div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <SectionDivider from="rgba(8,15,42,0.72)" to="rgba(10,18,48,0.76)" />

      {/* ── Account types ── */}
      <section className="py-20" style={{ background: "rgba(10,18,48,0.76)", position: "relative", zIndex: 1 }}>
        <div className="mx-auto max-w-7xl px-6">
          <Reveal className="mb-12 text-center">
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#D4AF37", letterSpacing: "0.15em" }}>
              Who Is This For?
            </p>
            <h2 className="text-2xl font-black text-white">Choose Your Path</h2>
          </Reveal>
          <div className="grid gap-5 md:grid-cols-3">
            {[
              {
                emoji: "🎓", type: "Student", tagline: "Study in China",
                accent: "#38bdf8", borderGlow: "rgba(56,189,248,0.2)",
                href: isStudent ? "/dashboard" : svc("/apply-to-china"),
                cta: isStudent ? "Go to My Dashboard" : "Apply to Study in China",
                perks: ["University matching by our team", "Admission letter & visa guidance", "Bachelor / Master / PhD / Language"],
              },
              {
                emoji: "💼", type: "Business", tagline: "Trade with China",
                accent: "#D4AF37", borderGlow: "rgba(212,175,55,0.25)",
                href: isBusiness ? "/dashboard" : isLoggedIn ? "/dashboard" : "/register?type=business",
                cta: isBusiness ? "Go to My Dashboard" : isLoggedIn ? "Go to Dashboard" : "Register as Business",
                perks: ["Business visa processing", "Canton Fair & factory tours", "Product sourcing & verification", "Trade exhibition access"],
              },
              {
                emoji: "🧑‍💼", type: "Job Seeker", tagline: "Work in China",
                accent: "#34d399", borderGlow: "rgba(52,211,153,0.2)",
                href: isLoggedIn ? dashHref : "/register?type=job_seeker",
                cta: isLoggedIn ? "Go to Dashboard" : "Find Jobs in China",
                perks: ["Factory & skilled job listings", "Internship programs", "Work permit support", "Salary negotiation guidance"],
              },
            ].map((a, i) => (
              <Reveal key={a.type} delay={i * 0.1}>
                <motion.div
                  className="rounded-2xl p-7 h-full flex flex-col"
                  style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${a.borderGlow}` }}
                  whileHover={{ background: "rgba(255,255,255,0.055)", borderColor: a.accent + "55", y: -4 }}
                  transition={{ duration: 0.25 }}
                >
                  <div className="text-4xl mb-4">{a.emoji}</div>
                  <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: a.accent }}>{a.tagline}</p>
                  <h3 className="text-xl font-black text-white mb-5">{a.type}</h3>
                  <ul className="space-y-2.5 mb-7 flex-1">
                    {a.perks.map(p => (
                      <li key={p} className="flex items-center gap-2.5 text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" style={{ color: a.accent }} />
                        {p}
                      </li>
                    ))}
                  </ul>
                  <Link href={a.href}
                    className="w-full py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90 hover:shadow-lg text-center block"
                    style={{ background: a.accent, color: "#05091a" }}>
                    {a.cta}
                  </Link>
                </motion.div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <SectionDivider from="rgba(10,18,48,0.76)" to="rgba(8,15,42,0.72)" />

      {/* ── Exchange teaser ── */}
      <section className="py-14" style={{ background: "rgba(8,15,42,0.72)", position: "relative", zIndex: 1 }}>
        <div className="mx-auto max-w-7xl px-6">
          <Reveal>
            <motion.div
              className="rounded-2xl p-8 flex flex-col sm:flex-row items-center justify-between gap-6"
              style={{
                background: "linear-gradient(135deg,rgba(0,150,136,0.2),rgba(0,100,90,0.15))",
                border: "1px solid rgba(0,200,180,0.18)",
              }}
              whileHover={{ borderColor: "rgba(0,200,180,0.3)" }}
              transition={{ duration: 0.25 }}
            >
              <div className="flex items-center gap-5">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl shrink-0"
                  style={{ background: "rgba(0,200,180,0.12)", border: "1px solid rgba(0,200,180,0.2)" }}>
                  <ArrowLeftRight className="h-7 w-7" style={{ color: "#2dd4bf" }} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white">RMB ↔ TZS Exchange</h3>
                  <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>
                    Competitive offline rates · Same-day processing
                  </p>
                </div>
              </div>
              <Link
                href={isLoggedIn ? "/exchange" : "/register"}
                className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold shrink-0 transition-all hover:scale-105"
                style={{ background: "rgba(45,212,191,0.15)", color: "#2dd4bf", border: "1px solid rgba(45,212,191,0.3)" }}
              >
                {isLoggedIn ? "Go to Exchange" : "Check Rates"} <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>
          </Reveal>
        </div>
      </section>

      <SectionDivider from="rgba(8,15,42,0.72)" to="rgba(5,9,26,0.82)" />

      {/* ── Bottom CTA ── */}
      <section className="py-20 text-center" style={{ background: "rgba(5,9,26,0.82)", position: "relative", zIndex: 1 }}>
        <div className="mx-auto max-w-xl px-6">
          <Reveal>
            <motion.div
              className="inline-flex h-16 w-16 items-center justify-center rounded-2xl mx-auto mb-6"
              style={{ background: "rgba(212,175,55,0.12)", border: "1px solid rgba(212,175,55,0.2)" }}
              animate={{ boxShadow: ["0 0 0px rgba(212,175,55,0)", "0 0 32px rgba(212,175,55,0.18)", "0 0 0px rgba(212,175,55,0)"] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <Star className="h-8 w-8" style={{ color: "#D4AF37", fill: "rgba(212,175,55,0.3)" }} />
            </motion.div>
            {isLoggedIn ? (
              <>
                <h2 className="text-3xl font-black text-white mb-3">Welcome back, {(userName || session?.user?.name)?.split(" ")[0]}</h2>
                <p className="text-sm mb-8" style={{ color: "rgba(255,255,255,0.4)" }}>
                  Continue where you left off. Your dashboard has everything you need.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                    <Link href={dashHref}
                      className="inline-flex items-center gap-2 rounded-2xl px-8 py-3.5 text-sm font-black transition-all"
                      style={{ background: "#D4AF37", color: "#05091a", boxShadow: "0 0 32px rgba(212,175,55,0.25)" }}>
                      <LayoutDashboard className="h-4 w-4" />
                      Go to My Dashboard <ArrowRight className="h-4 w-4" />
                    </Link>
                  </motion.div>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-3xl font-black text-white mb-3">Your China Journey Starts Here</h2>
                <p className="text-sm mb-8" style={{ color: "rgba(255,255,255,0.4)" }}>
                  Free registration. Personal expert review. Full support every step.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                    <Link href="/apply-to-china"
                      className="inline-flex items-center gap-2 rounded-2xl px-8 py-3.5 text-sm font-black transition-all"
                      style={{ background: "#38bdf8", color: "#05091a", boxShadow: "0 0 32px rgba(56,189,248,0.25)" }}>
                      Apply to Study in China <ArrowRight className="h-4 w-4" />
                    </Link>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                    <Link href="/apply-visa"
                      className="inline-flex items-center gap-2 rounded-2xl px-8 py-3.5 text-sm font-black transition-all"
                      style={{ background: "rgba(167,139,250,0.15)", color: "#a78bfa", border: "1px solid rgba(167,139,250,0.3)" }}>
                      Apply for Business Visa <Plane className="h-4 w-4" />
                    </Link>
                  </motion.div>
                </div>
              </>
            )}
          </Reveal>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-7 text-center text-xs"
        style={{ background: "rgba(3,7,16,0.92)", borderTop: "1px solid rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.25)", position: "relative", zIndex: 1 }}>
        © 2025 EA Trade Link · China Placement & Business Service Platform
      </footer>
    </div>
  )
}
