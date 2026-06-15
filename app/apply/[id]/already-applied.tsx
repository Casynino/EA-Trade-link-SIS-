"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowRight, AlertCircle, Clock, CheckCircle2, XCircle, FileText, Loader2, ChevronLeft, ChevronRight } from "lucide-react"

const SLIDES = [
  { url: "https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=1920&q=80", label: "Beijing at Night" },
  { url: "https://images.unsplash.com/photo-1547981609-4b6bfe67ca0b?w=1920&q=80", label: "Shanghai Skyline" },
  { url: "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=1920&q=80", label: "Great Wall of China" },
  { url: "https://images.unsplash.com/photo-1570132144855-702bbc8cc7b3?w=1920&q=80", label: "International Travel" },
  { url: "https://images.unsplash.com/photo-1600431521340-491eca880813?w=1920&q=80", label: "Shenzhen Business District" },
]

const STATUS_META: Record<string, { label: string; color: string; bg: string; border: string; icon: any; message: string }> = {
  SUBMITTED:          { label: "Submitted",         color: "#60a5fa", bg: "rgba(96,165,250,0.08)",   border: "rgba(96,165,250,0.25)",   icon: Clock,        message: "Your application has been received and is waiting to be reviewed by our team." },
  UNDER_REVIEW:       { label: "Under Review",       color: "#fbbf24", bg: "rgba(251,191,36,0.08)",   border: "rgba(251,191,36,0.25)",   icon: Loader2,      message: "Our team is actively reviewing your application. We will be in touch soon." },
  DOCUMENTS_REQUIRED: { label: "Documents Required", color: "#fb923c", bg: "rgba(251,146,60,0.08)",   border: "rgba(251,146,60,0.25)",   icon: FileText,     message: "Additional documents have been requested. Please open your application to upload them." },
  SHORTLISTED:        { label: "Shortlisted",        color: "#c084fc", bg: "rgba(192,132,252,0.08)",  border: "rgba(192,132,252,0.25)",  icon: CheckCircle2, message: "Congratulations — you have been shortlisted! Our team will contact you shortly." },
  ACCEPTED:           { label: "Approved",           color: "#34d399", bg: "rgba(52,211,153,0.08)",   border: "rgba(52,211,153,0.25)",   icon: CheckCircle2, message: "Your application has been approved. Open your application to review next steps." },
  PROCESSING:         { label: "Processing",         color: "#fbbf24", bg: "rgba(251,191,36,0.08)",   border: "rgba(251,191,36,0.25)",   icon: Loader2,      message: "Your application is currently being processed by our team." },
  COMPLETED:          { label: "Completed",          color: "#34d399", bg: "rgba(52,211,153,0.08)",   border: "rgba(52,211,153,0.25)",   icon: CheckCircle2, message: "Your application has been completed successfully. Thank you." },
  REJECTED:           { label: "Unsuccessful",       color: "#f87171", bg: "rgba(248,113,113,0.08)",  border: "rgba(248,113,113,0.25)",  icon: XCircle,      message: "Your application was not successful at this stage. Please contact us for guidance." },
}

interface Props {
  applicationId: string
  status: string
  opportunityTitle: string
  opportunityOrg: string
  submittedDate: string
  referenceId: string
}

export function AlreadyApplied({ applicationId, status, opportunityTitle, opportunityOrg, submittedDate, referenceId }: Props) {
  const [slide, setSlide] = useState(0)
  const [fading, setFading] = useState(false)

  const st = STATUS_META[status] ?? STATUS_META.SUBMITTED
  const Icon = st.icon
  const isActionable = ["DOCUMENTS_REQUIRED", "ACCEPTED"].includes(status)

  function goTo(idx: number) {
    setFading(true)
    setTimeout(() => { setSlide((idx + SLIDES.length) % SLIDES.length); setFading(false) }, 400)
  }

  useEffect(() => {
    const t = setInterval(() => goTo(slide + 1), 5000)
    return () => clearInterval(t)
  }, [slide])

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-6 py-16 overflow-hidden">

      {/* ── Cinematic background ── */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {SLIDES.map((s, i) => (
          <div key={s.url} className="absolute inset-0 transition-opacity duration-700"
            style={{ opacity: i === slide && !fading ? 1 : 0 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={s.url}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 w-full h-full object-cover"
              loading={i === 0 ? "eager" : "lazy"}
            />
          </div>
        ))}

        {/* Lighter overlay so images breathe through */}
        <div className="absolute inset-0"
          style={{ background: "linear-gradient(to bottom, rgba(5,9,26,0.55) 0%, rgba(5,9,26,0.40) 30%, rgba(5,9,26,0.70) 70%, rgba(5,9,26,0.96) 100%)" }} />

        {/* Status-colour radial bloom */}
        <div className="absolute inset-0"
          style={{ background: `radial-gradient(ellipse 60% 55% at 50% 38%, ${st.color}20 0%, transparent 65%)` }} />

        {/* Top accent stripe */}
        <div className="absolute top-0 left-0 right-0 h-[2px]"
          style={{ background: `linear-gradient(to right, transparent, ${st.color}80, transparent)` }} />
      </div>

      {/* Slide dots */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2.5">
        <button onClick={() => goTo(slide - 1)}
          className="flex h-6 w-6 items-center justify-center rounded-full"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <ChevronLeft className="h-3.5 w-3.5 text-white/40" />
        </button>
        {SLIDES.map((_, i) => (
          <button key={i} onClick={() => goTo(i)}
            className="h-1.5 rounded-full transition-all"
            style={{ width: i === slide ? "20px" : "5px", background: i === slide ? st.color : "rgba(255,255,255,0.2)" }} />
        ))}
        <button onClick={() => goTo(slide + 1)}
          className="flex h-6 w-6 items-center justify-center rounded-full"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <ChevronRight className="h-3.5 w-3.5 text-white/40" />
        </button>
      </div>

      {/* ── Content ── */}
      <div className="relative z-10 w-full max-w-lg space-y-4">

        {/* Brand pill */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(8px)" }}>
            <div className="h-5 w-5 rounded-md flex items-center justify-center"
              style={{ background: "linear-gradient(135deg,#C8102E,#0F2557)" }}>
              <span className="text-white text-[9px] font-black">EA</span>
            </div>
            <span className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.5)" }}>EA Trade Link</span>
          </div>
        </div>

        {/* Main card */}
        <div className="rounded-3xl overflow-hidden"
          style={{
            background: "rgba(5,9,26,0.7)",
            border: `1px solid ${st.border}`,
            backdropFilter: "blur(24px)",
            boxShadow: `0 0 80px ${st.color}15, 0 30px 60px rgba(0,0,0,0.5)`,
          }}>

          {/* Header with colour wash */}
          <div className="px-8 pt-10 pb-7 text-center space-y-4"
            style={{
              background: `linear-gradient(180deg, ${st.color}12 0%, transparent 100%)`,
              borderBottom: `1px solid ${st.border}`,
            }}>
            {/* Icon */}
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl mx-auto"
              style={{
                background: `${st.color}14`,
                border: `1px solid ${st.border}`,
                boxShadow: `0 0 40px ${st.color}30`,
              }}>
              <Icon className="h-9 w-9" style={{ color: st.color }} />
            </div>

            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] mb-2" style={{ color: st.color }}>
                Application Status
              </p>
              <h1 className="text-3xl font-black text-white mb-3 leading-tight">{st.label}</h1>
              <p className="text-sm leading-relaxed max-w-xs mx-auto" style={{ color: "rgba(255,255,255,0.5)" }}>
                {st.message}
              </p>
            </div>
          </div>

          {/* Details row */}
          <div className="px-8 py-6 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "rgba(255,255,255,0.3)" }}>
                  Service Applied For
                </p>
                <p className="text-sm font-bold text-white leading-snug">{opportunityTitle}</p>
                <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>{opportunityOrg}</p>
              </div>
              <span className="shrink-0 rounded-xl px-3 py-1.5 text-[10px] font-bold"
                style={{ background: st.bg, color: st.color, border: `1px solid ${st.border}` }}>
                {st.label}
              </span>
            </div>

            <div className="h-px" style={{ background: "rgba(255,255,255,0.06)" }} />

            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "rgba(255,255,255,0.3)" }}>
                  Date Submitted
                </p>
                <p className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.75)" }}>{submittedDate}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "rgba(255,255,255,0.3)" }}>
                  Reference ID
                </p>
                <p className="text-[10px] font-mono break-all" style={{ color: "rgba(255,255,255,0.4)" }}>{referenceId}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actionable warning */}
        {isActionable && (
          <div className="rounded-2xl p-4 flex items-start gap-3"
            style={{
              background: "rgba(251,191,36,0.07)",
              border: "1px solid rgba(251,191,36,0.2)",
              backdropFilter: "blur(12px)",
            }}>
            <AlertCircle className="h-4 w-4 text-yellow-400 shrink-0 mt-0.5" />
            <p className="text-xs leading-relaxed" style={{ color: "rgba(253,224,71,0.8)" }}>
              {status === "DOCUMENTS_REQUIRED"
                ? "Action required: additional documents have been requested. Open your application to upload them."
                : "Action required: your application has been approved. Open it to review payment and next steps."}
            </p>
          </div>
        )}

        {/* CTA buttons */}
        <div className="space-y-3 pt-1">
          <Link href={`/dashboard/applications/${applicationId}`}
            className="flex items-center justify-center gap-2.5 w-full rounded-2xl py-4 text-sm font-black transition-all hover:opacity-90 active:scale-[0.98]"
            style={{ background: st.color, color: "#05091a", boxShadow: `0 4px 24px ${st.color}40` }}>
            View Full Application <ArrowRight className="h-4 w-4" />
          </Link>

          <Link href="/dashboard"
            className="flex items-center justify-center gap-2 w-full rounded-2xl py-3 text-sm font-semibold transition-all hover:opacity-80"
            style={{
              background: "rgba(255,255,255,0.05)",
              color: "rgba(255,255,255,0.45)",
              border: "1px solid rgba(255,255,255,0.08)",
              backdropFilter: "blur(8px)",
            }}>
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
