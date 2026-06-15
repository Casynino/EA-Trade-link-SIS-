"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  Plane, ArrowRight, Shield, Clock, FileCheck, BadgeCheck,
  ChevronLeft, ChevronRight, Star, Globe2,
} from "lucide-react"

const SLIDES = [
  {
    url: "https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=1920&q=80",
    label: "Beijing at Night",
  },
  {
    url: "https://images.unsplash.com/photo-1547981609-4b6bfe67ca0b?w=1920&q=80",
    label: "Shanghai Skyline",
  },
  {
    url: "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=1920&q=80",
    label: "Great Wall of China",
  },
  {
    url: "https://images.unsplash.com/photo-1570132144855-702bbc8cc7b3?w=1920&q=80",
    label: "International Travel",
  },
  {
    url: "https://images.unsplash.com/photo-1600431521340-491eca880813?w=1920&q=80",
    label: "Shenzhen Business District",
  },
]

const TRUST_ITEMS = [
  { icon: Clock,     title: "48–72 Hour Guidance",      desc: "Processing guidance provided within 2–3 business days of submission." },
  { icon: BadgeCheck,title: "Embassy Standard Compliance", desc: "All applications are prepared to meet current Chinese embassy requirements." },
  { icon: Shield,    title: "Secure Document Handling",  desc: "Your documents are reviewed privately and never shared with third parties." },
  { icon: FileCheck, title: "Verified Review System",    desc: "Each application is manually verified by our processing team before submission." },
]

interface VisaOpp {
  id: string
  title: string
  organization: string
  location: string
  isFeatured: boolean
  description: string | null
}

export function VisaLandingClient({
  visaOpps,
  isLoggedIn,
}: {
  visaOpps: VisaOpp[]
  isLoggedIn: boolean
}) {
  const [slide, setSlide] = useState(0)
  const [fading, setFading] = useState(false)

  function goTo(idx: number) {
    setFading(true)
    setTimeout(() => {
      setSlide((idx + SLIDES.length) % SLIDES.length)
      setFading(false)
    }, 400)
  }

  useEffect(() => {
    const t = setInterval(() => goTo(slide + 1), 5000)
    return () => clearInterval(t)
  }, [slide])

  const applyHref = (id: string) =>
    isLoggedIn ? `/apply/${id}` : `/start?redirect=/apply/${id}`

  return (
    <div className="relative min-h-screen overflow-hidden" style={{ background: "#05091a" }}>

      {/* ── Cinematic background slideshow ── */}
      <div className="absolute inset-0 z-0">
        {SLIDES.map((s, i) => (
          <div
            key={s.url}
            className="absolute inset-0 transition-opacity duration-700"
            style={{ opacity: i === slide && !fading ? 1 : 0 }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={s.url}
              alt={s.label}
              className="w-full h-full object-cover"
              loading={i === 0 ? "eager" : "lazy"}
            />
          </div>
        ))}

        {/* Multi-layer gradient overlay */}
        <div className="absolute inset-0"
          style={{ background: "linear-gradient(to bottom, rgba(5,9,26,0.75) 0%, rgba(5,9,26,0.55) 40%, rgba(5,9,26,0.85) 75%, rgba(5,9,26,1) 100%)" }} />
        {/* Left/right fade */}
        <div className="absolute inset-0"
          style={{ background: "linear-gradient(to right, rgba(5,9,26,0.4) 0%, transparent 30%, transparent 70%, rgba(5,9,26,0.4) 100%)" }} />
        {/* Red accent stripe — Chinese flag nod */}
        <div className="absolute top-0 left-0 right-0 h-1"
          style={{ background: "linear-gradient(to right, transparent, rgba(220,38,38,0.6), rgba(220,38,38,0.8), rgba(220,38,38,0.6), transparent)" }} />
      </div>

      {/* Slide controls */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3">
        <button onClick={() => goTo(slide - 1)}
          className="flex h-7 w-7 items-center justify-center rounded-full transition-all hover:bg-white/10"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }}>
          <ChevronLeft className="h-4 w-4 text-white/50" />
        </button>
        {SLIDES.map((_, i) => (
          <button key={i} onClick={() => goTo(i)}
            className="h-1.5 rounded-full transition-all"
            style={{
              width: i === slide ? "24px" : "6px",
              background: i === slide ? "#D4AF37" : "rgba(255,255,255,0.2)",
            }} />
        ))}
        <button onClick={() => goTo(slide + 1)}
          className="flex h-7 w-7 items-center justify-center rounded-full transition-all hover:bg-white/10"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }}>
          <ChevronRight className="h-4 w-4 text-white/50" />
        </button>
      </div>

      {/* ── Page content ── */}
      <div className="relative z-10 flex flex-col min-h-screen">

        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-4 md:px-10">
          <Link href="/" className="flex items-center gap-2 group">
            <Globe2 className="h-4 w-4" style={{ color: "rgba(255,255,255,0.3)" }} />
            <span className="text-xs font-semibold tracking-widest uppercase"
              style={{ color: "rgba(255,255,255,0.3)" }}>
              EA Trade Link
            </span>
          </Link>
          <div className="flex items-center gap-1.5 text-[11px] font-semibold"
            style={{ color: "rgba(212,175,55,0.8)" }}>
            <div className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: "#D4AF37" }} />
            Processing Center Active
          </div>
        </div>

        {/* ── Hero ── */}
        <div className="flex flex-col items-center justify-center text-center px-6 pt-16 pb-12 md:pt-24 md:pb-16 space-y-6">

          {/* Official badge */}
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold tracking-wider uppercase"
            style={{ background: "rgba(220,38,38,0.12)", border: "1px solid rgba(220,38,38,0.25)", color: "rgba(252,165,165,0.9)" }}>
            <span className="text-sm">🇨🇳</span>
            Official-Style Processing Support
          </div>

          {/* Title */}
          <div className="space-y-3 max-w-2xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight tracking-tight">
              China Business
              <span className="block" style={{ color: "#D4AF37" }}>Visa Service</span>
            </h1>
            <p className="text-base md:text-lg max-w-xl mx-auto leading-relaxed"
              style={{ color: "rgba(255,255,255,0.55)" }}>
              Professional processing support for business travelers entering China.
              We manage full documentation, invitation letters, and embassy submission.
            </p>
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-6 md:gap-10 pt-2">
            {[
              { value: "500+", label: "Visas Processed" },
              { value: "48h",  label: "Avg. Response Time" },
              { value: "98%",  label: "Approval Rate" },
            ].map(s => (
              <div key={s.label} className="text-center">
                <p className="text-xl md:text-2xl font-black" style={{ color: "#D4AF37" }}>{s.value}</p>
                <p className="text-[11px] uppercase tracking-wider mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Visa service cards ── */}
        <div className="mx-auto w-full max-w-4xl px-6 pb-12 space-y-4">
          <p className="text-xs font-bold uppercase tracking-widest text-center mb-6"
            style={{ color: "rgba(255,255,255,0.3)" }}>
            Select a Visa Service to Begin
          </p>

          {visaOpps.length === 0 ? (
            <div className="text-center py-16 rounded-2xl"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <Plane className="h-10 w-10 mx-auto mb-3" style={{ color: "rgba(255,255,255,0.15)" }} />
              <p className="text-white/40">No visa services available right now.</p>
              <p className="text-sm text-white/25 mt-1">Please contact us directly for assistance.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {visaOpps.map((v) => (
                <Link
                  key={v.id}
                  href={applyHref(v.id)}
                  className="group relative rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    backdropFilter: "blur(12px)",
                    boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
                  }}
                >
                  {/* Hover glow */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl pointer-events-none"
                    style={{ boxShadow: "inset 0 0 0 1px rgba(212,175,55,0.3), 0 0 40px rgba(212,175,55,0.08)" }} />

                  {/* Gold top accent line */}
                  <div className="absolute top-0 left-0 right-0 h-0.5"
                    style={{ background: "linear-gradient(to right, transparent, rgba(212,175,55,0.6), transparent)" }} />

                  <div className="p-6 space-y-4">
                    {/* Header row */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                          style={{ background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.2)" }}>
                          <Plane className="h-5 w-5" style={{ color: "#D4AF37" }} />
                        </div>
                        <div>
                          {v.isFeatured && (
                            <div className="flex items-center gap-1 mb-1">
                              <Star className="h-3 w-3" style={{ color: "#D4AF37", fill: "#D4AF37" }} />
                              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#D4AF37" }}>
                                Featured Service
                              </span>
                            </div>
                          )}
                          <h3 className="text-base font-black text-white leading-snug">{v.title}</h3>
                        </div>
                      </div>
                      <div className="shrink-0 flex h-8 w-8 items-center justify-center rounded-full transition-all group-hover:scale-110"
                        style={{ background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.2)" }}>
                        <ArrowRight className="h-4 w-4" style={{ color: "#D4AF37" }} />
                      </div>
                    </div>

                    {v.description && (
                      <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>
                        {v.description}
                      </p>
                    )}

                    {/* What's included */}
                    <div className="space-y-2 pt-1">
                      {[
                        "Invitation letter coordination",
                        "Document verification & review",
                        "Embassy submission support",
                        "Fast-track processing options",
                      ].map(item => (
                        <div key={item} className="flex items-center gap-2">
                          <div className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: "#D4AF37" }} />
                          <span className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>{item}</span>
                        </div>
                      ))}
                    </div>

                    {/* CTA button */}
                    <div className="pt-2">
                      <div className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all group-hover:gap-3"
                        style={{ background: "rgba(212,175,55,0.12)", color: "#D4AF37", border: "1px solid rgba(212,175,55,0.25)" }}>
                        Start Application
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* ── Trust section ── */}
        <div className="mx-auto w-full max-w-4xl px-6 pb-20 space-y-6">
          <div className="rounded-2xl overflow-hidden"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
              backdropFilter: "blur(8px)",
            }}>
            <div className="px-6 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.35)" }}>
                Why Trust Our Service
              </p>
            </div>
            <div className="grid sm:grid-cols-2 gap-0">
              {TRUST_ITEMS.map((item, i) => {
                const Icon = item.icon
                const isRight = i % 2 === 1
                const isBottom = i >= 2
                return (
                  <div key={item.title}
                    className="p-5 flex items-start gap-4"
                    style={{
                      borderRight: isRight ? "none" : "1px solid rgba(255,255,255,0.06)",
                      borderBottom: isBottom ? "none" : "1px solid rgba(255,255,255,0.06)",
                    }}>
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                      style={{ background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.15)" }}>
                      <Icon className="h-4 w-4" style={{ color: "#D4AF37" }} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white mb-0.5">{item.title}</p>
                      <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.4)" }}>{item.desc}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Back link */}
          <div className="text-center pt-2">
            <Link href="/" className="inline-flex items-center gap-2 text-xs transition-colors"
              style={{ color: "rgba(255,255,255,0.25)" }}
              onMouseOver={e => (e.currentTarget.style.color = "rgba(255,255,255,0.6)")}
              onMouseOut={e => (e.currentTarget.style.color = "rgba(255,255,255,0.25)")}>
              <Globe2 className="h-3.5 w-3.5" />Back to EA Trade Link Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
