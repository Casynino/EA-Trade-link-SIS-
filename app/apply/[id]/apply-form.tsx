"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import Image from "next/image"
import { useToast } from "@/components/ui/use-toast"
import { TYPE_CONFIG } from "@/lib/opp-types"
import { parseDocs, parseFields, getSubmissionMessage, getTypeNote, type AppField, type RequiredDoc } from "@/lib/application-engine"
import {
  Globe2, ArrowLeft, ArrowRight, CheckCircle2, Loader2,
  User, FileText, Eye, Clock, AlertCircle, ChevronLeft, ChevronRight,
  Shield, Sparkles, Upload, X, Paperclip,
} from "lucide-react"

// ── China slideshow for success screen ────────────────────────────────────────
const SLIDES = [
  { url: "https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=1920&q=80", label: "Beijing at Night" },
  { url: "https://images.unsplash.com/photo-1547981609-4b6bfe67ca0b?w=1920&q=80", label: "Shanghai Skyline" },
  { url: "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=1920&q=80", label: "Great Wall of China" },
  { url: "https://images.unsplash.com/photo-1570132144855-702bbc8cc7b3?w=1920&q=80", label: "International Travel" },
  { url: "https://images.unsplash.com/photo-1600431521340-491eca880813?w=1920&q=80", label: "Shenzhen Business District" },
]

function SuccessScreen({ appId, oppTitle, oppType }: { appId: string; oppTitle: string; oppType: string }) {
  const [slide, setSlide] = useState(0)
  const [fading, setFading] = useState(false)

  function goTo(idx: number) {
    setFading(true)
    setTimeout(() => { setSlide((idx + SLIDES.length) % SLIDES.length); setFading(false) }, 400)
  }

  useEffect(() => {
    const t = setInterval(() => goTo(slide + 1), 5000)
    return () => clearInterval(t)
  }, [slide])

  const isVisa = oppType === "BUSINESS_VISA"

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden px-6 py-16">
      <div className="absolute inset-0 z-0">
        {SLIDES.map((s, i) => (
          <div key={s.url} className="absolute inset-0 transition-opacity duration-700"
            style={{ opacity: i === slide && !fading ? 1 : 0 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={s.url} alt="" aria-hidden="true"
              className="absolute inset-0 w-full h-full object-cover"
              loading={i === 0 ? "eager" : "lazy"} />
          </div>
        ))}
        <div className="absolute inset-0"
          style={{ background: "linear-gradient(to bottom, rgba(5,9,26,0.55) 0%, rgba(5,9,26,0.35) 35%, rgba(5,9,26,0.72) 75%, rgba(5,9,26,0.96) 100%)" }} />
        <div className="absolute inset-0"
          style={{ background: "radial-gradient(ellipse 60% 50% at 50% 38%, rgba(52,211,153,0.18) 0%, transparent 65%)" }} />
        <div className="absolute top-0 left-0 right-0 h-[2px]"
          style={{ background: "linear-gradient(to right, transparent, rgba(52,211,153,0.7), transparent)" }} />
      </div>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2.5">
        <button onClick={() => goTo(slide - 1)} className="flex h-6 w-6 items-center justify-center rounded-full"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <ChevronLeft className="h-3.5 w-3.5 text-white/40" />
        </button>
        {SLIDES.map((_, i) => (
          <button key={i} onClick={() => goTo(i)} className="h-1.5 rounded-full transition-all"
            style={{ width: i === slide ? "20px" : "5px", background: i === slide ? "#34d399" : "rgba(255,255,255,0.2)" }} />
        ))}
        <button onClick={() => goTo(slide + 1)} className="flex h-6 w-6 items-center justify-center rounded-full"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <ChevronRight className="h-3.5 w-3.5 text-white/40" />
        </button>
      </div>

      <div className="relative z-10 w-full max-w-lg space-y-4">
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

        <div className="rounded-3xl overflow-hidden"
          style={{
            background: "rgba(5,9,26,0.72)",
            border: "1px solid rgba(52,211,153,0.3)",
            backdropFilter: "blur(24px)",
            boxShadow: "0 0 80px rgba(52,211,153,0.12), 0 30px 60px rgba(0,0,0,0.5)",
          }}>
          <div className="px-8 pt-10 pb-7 text-center space-y-4"
            style={{
              background: "linear-gradient(180deg, rgba(52,211,153,0.10) 0%, transparent 100%)",
              borderBottom: "1px solid rgba(52,211,153,0.15)",
            }}>
            <div className="relative inline-block mx-auto">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl"
                style={{ background: "rgba(52,211,153,0.12)", border: "1px solid rgba(52,211,153,0.3)", boxShadow: "0 0 40px rgba(52,211,153,0.3)" }}>
                <CheckCircle2 className="h-10 w-10" style={{ color: "#34d399" }} />
              </div>
              <div className="absolute -top-1.5 -right-1.5 h-7 w-7 rounded-full flex items-center justify-center"
                style={{ background: "#D4AF37", boxShadow: "0 2px 12px rgba(212,175,55,0.5)" }}>
                <Sparkles className="h-3.5 w-3.5 text-[#05091a]" />
              </div>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] mb-2" style={{ color: "#34d399" }}>
                Application Submitted
              </p>
              <h1 className="text-3xl font-black text-white mb-3 leading-tight">Successfully Received</h1>
              <p className="text-sm leading-relaxed max-w-xs mx-auto" style={{ color: "rgba(255,255,255,0.5)" }}>
                {oppTitle && <span className="block text-white/70 font-semibold mb-1 truncate">{oppTitle}</span>}
                Your application has been received by our team and is now under review.
              </p>
            </div>
          </div>

          <div className="px-8 py-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "rgba(255,255,255,0.3)" }}>Application ID</p>
                <p className="text-[11px] font-mono break-all" style={{ color: "rgba(255,255,255,0.5)" }}>
                  {appId.slice(0, 16)}…
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "rgba(255,255,255,0.3)" }}>Expected Response</p>
                <p className="text-sm font-bold flex items-center gap-1" style={{ color: "#34d399" }}>
                  <Clock className="h-3.5 w-3.5" />
                  {isVisa ? "48–72 hours" : "3–5 days"}
                </p>
              </div>
            </div>
            <div className="h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: Shield, label: "Embassy Compliant", sub: "All requirements met" },
                { icon: CheckCircle2, label: "Under Review", sub: "Team notified instantly" },
              ].map(({ icon: Icon, label, sub }) => (
                <div key={label} className="rounded-xl p-3 flex items-start gap-2.5"
                  style={{ background: "rgba(52,211,153,0.05)", border: "1px solid rgba(52,211,153,0.1)" }}>
                  <Icon className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "#34d399" }} />
                  <div>
                    <p className="text-xs font-bold text-white">{label}</p>
                    <p className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>{sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-3 pt-1">
          <Link href={`/dashboard/applications/${appId}`}
            className="flex items-center justify-center gap-2.5 w-full rounded-2xl py-4 text-sm font-black transition-all hover:opacity-90 active:scale-[0.98]"
            style={{ background: "#34d399", color: "#05091a", boxShadow: "0 4px 24px rgba(52,211,153,0.35)" }}>
            Track My Application <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/dashboard"
            className="flex items-center justify-center gap-2 w-full rounded-2xl py-3 text-sm font-semibold transition-all hover:opacity-80"
            style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.45)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(8px)" }}>
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}

const FALLBACK_IMAGES: Record<string, string> = {
  SCHOLARSHIP:   "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&auto=format&fit=crop&q=80",
  JOB:           "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&auto=format&fit=crop&q=80",
  BUSINESS_VISA: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800&auto=format&fit=crop&q=80",
  FACTORY_VISIT: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&auto=format&fit=crop&q=80",
  CANTON_FAIR:   "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80",
  CONFERENCE:    "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800&auto=format&fit=crop&q=80",
}

const STEPS = [
  { id: 1, label: "Personal Info",   icon: User        },
  { id: 2, label: "Application",     icon: FileText    },
  { id: 3, label: "Documents",       icon: AlertCircle },
  { id: 4, label: "Review & Submit", icon: Eye         },
]

interface CoreForm {
  fullName: string; phone: string; nationality: string
  dateOfBirth: string; coverLetter: string
  termsAccepted: boolean; docsConfirmed: boolean
}

const EMPTY_CORE: CoreForm = {
  fullName: "", phone: "", nationality: "Tanzania", dateOfBirth: "",
  coverLetter: "", termsAccepted: false, docsConfirmed: false,
}

export function ApplyForm({
  opportunity, userId, userName, userPhone,
}: {
  opportunity: any; userId: string; userName?: string; userPhone?: string
}) {
  const { toast } = useToast()
  const cfg     = TYPE_CONFIG[opportunity.type] ?? TYPE_CONFIG.SCHOLARSHIP
  const Icon    = cfg.icon
  const heroImg = opportunity.imageUrl || FALLBACK_IMAGES[opportunity.type] || FALLBACK_IMAGES.SCHOLARSHIP

  const appFields: AppField[]       = parseFields(opportunity.applicationFields, opportunity.type)
  const requiredDocs: RequiredDoc[] = parseDocs(opportunity.requiredDocuments, opportunity.type)
  const typeNote: string | null     = getTypeNote(opportunity.type)

  const [step, setStep]           = useState(1)
  const [loading, setLoading]     = useState(false)
  const [submitted, setSubmitted] = useState<{ id: string } | null>(null)

  const [core, setCore] = useState<CoreForm>({ ...EMPTY_CORE, fullName: userName ?? "", phone: userPhone ?? "" })
  const [dynValues, setDynValues] = useState<Record<string, string>>({})

  // Uploaded files per document slot
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, { url: string; name: string } | null>>({})
  const [uploadingSlot, setUploadingSlot] = useState<string | null>(null)

  function setC<K extends keyof CoreForm>(k: K, v: CoreForm[K]) { setCore((p) => ({ ...p, [k]: v })) }
  function setDyn(id: string, v: string) { setDynValues((p) => ({ ...p, [id]: v })) }

  const requiredDocCount = requiredDocs.filter(d => d.required).length
  const uploadedRequiredCount = requiredDocs.filter(d => d.required && uploadedFiles[d.id]).length

  function canAdvance(): boolean {
    if (step === 1) return !!core.fullName && !!core.phone && !!core.nationality
    if (step === 2) return appFields.filter((f) => f.required).every((f) => !!(dynValues[f.id] ?? "").trim())
    if (step === 3) return core.docsConfirmed && (requiredDocCount === 0 || uploadedRequiredCount >= requiredDocCount)
    if (step === 4) return !!core.coverLetter.trim() && core.termsAccepted
    return true
  }

  async function submit() {
    setLoading(true)
    try {
      const experienceLines = appFields
        .filter((f) => f.id !== "degreeLevel" && f.id !== "fieldOfStudy" && f.id !== "gpa" && f.id !== "languages")
        .map((f) => `${f.label}: ${dynValues[f.id] ?? ""}`)
        .join("\n")

      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          opportunityId: opportunity.id,
          coverLetter:   core.coverLetter,
          gpa:           dynValues.gpa ? parseFloat(dynValues.gpa) : undefined,
          degreeLevel:   dynValues.degreeLevel || undefined,
          fieldOfStudy:  dynValues.fieldOfStudy || undefined,
          experience:    experienceLines || undefined,
          languages:     dynValues.languages || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Submission failed")

      // Attach uploaded files to the application
      const docsToSave = Object.entries(uploadedFiles)
        .filter(([, v]) => v !== null)
        .map(([slotId, v]) => {
          const docDef = requiredDocs.find(d => d.id === slotId)
          return { url: v!.url, name: v!.name, type: docDef?.label ?? "OTHER" }
        })

      if (docsToSave.length > 0) {
        await fetch(`/api/applications/${data.id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ documents: docsToSave }),
        })
      }

      setSubmitted({ id: data.id })
    } catch (err: any) {
      toast({ title: "Submission failed", description: err.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return <SuccessScreen appId={submitted.id} oppTitle={opportunity.title} oppType={opportunity.type} />
  }

  // Shared input style
  const inputCls = "w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all focus:ring-2 focus:ring-yellow-400/20"
  const inputStyle = {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    color: "rgba(255,255,255,0.85)",
  }

  return (
    <div className="min-h-screen" style={{
      background: "#05091a",
      backgroundImage: "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(200,16,46,0.04) 0%, transparent 55%), radial-gradient(ellipse 60% 40% at 100% 100%, rgba(212,175,55,0.04) 0%, transparent 50%)",
    }}>

      {/* Navbar */}
      <nav className="sticky top-0 z-50" style={{
        background: "rgba(5,9,26,0.9)", borderBottom: "1px solid rgba(255,255,255,0.06)",
        backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
      }}>
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-3.5">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ background: "linear-gradient(135deg, #C8102E 0%, #0F2557 100%)" }}>
              <span className="text-white text-[11px] font-black">EA</span>
            </div>
            <span className="font-bold text-sm" style={{ color: "#D4AF37" }}>EA Trade Link</span>
          </Link>
          <Link href={`/opportunities/${opportunity.id}`}
            className="flex items-center gap-1.5 text-sm transition-colors"
            style={{ color: "rgba(255,255,255,0.4)" }}>
            <ArrowLeft className="h-3.5 w-3.5" />Back to opportunity
          </Link>
        </div>
      </nav>

      <div className="mx-auto max-w-3xl px-6 py-8 space-y-6">

        {/* Opportunity mini card */}
        <div className="flex items-center gap-4 rounded-2xl overflow-hidden" style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          backdropFilter: "blur(8px)",
        }}>
          <div className="relative h-20 w-28 shrink-0 overflow-hidden">
            <Image src={heroImg} alt={opportunity.title} fill className="object-cover" sizes="112px" />
            <div className="absolute inset-0" style={{ background: "linear-gradient(to right, transparent 60%, rgba(5,9,26,0.6))" }} />
          </div>
          <div className="py-3 pr-4 min-w-0 flex-1">
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold mb-1 ${cfg.badge}`}>
              <Icon className="h-3 w-3" />{cfg.label}
            </span>
            <p className="font-semibold text-sm leading-snug truncate text-white">{opportunity.title}</p>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.38)" }}>{opportunity.organization}</p>
          </div>
        </div>

        {/* Step indicator */}
        <div className="flex items-center">
          {STEPS.map((s, i) => {
            const done   = step > s.id
            const active = step === s.id
            const SIcon  = s.icon
            return (
              <div key={s.id} className="flex items-center flex-1 min-w-0">
                <div className="flex flex-col items-center gap-1.5 flex-1">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full transition-all shrink-0"
                    style={{
                      background: done ? "#22c55e" : active ? "#D4AF37" : "rgba(255,255,255,0.08)",
                      boxShadow: active ? "0 0 0 4px rgba(212,175,55,0.15)" : "none",
                    }}>
                    {done
                      ? <CheckCircle2 className="h-5 w-5 text-white" />
                      : <SIcon className="h-4 w-4" style={{ color: active ? "#05091a" : "rgba(255,255,255,0.35)" }} />
                    }
                  </div>
                  <span className="text-[10px] text-center leading-tight hidden sm:block font-medium"
                    style={{ color: active ? "#D4AF37" : done ? "#22c55e" : "rgba(255,255,255,0.3)" }}>
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="h-0.5 flex-1 mx-1 rounded-full transition-colors"
                    style={{ background: done ? "#22c55e" : "rgba(255,255,255,0.08)" }} />
                )}
              </div>
            )
          })}
        </div>

        {/* Step card */}
        <div className="rounded-2xl overflow-hidden" style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          backdropFilter: "blur(12px)",
        }}>
          {/* Card header */}
          <div className="px-6 py-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] mb-1" style={{ color: "rgba(212,175,55,0.7)" }}>
              Step {step} of {STEPS.length}
            </p>
            <h2 className="text-lg font-bold text-white">
              {step === 1 ? "Personal Information"
               : step === 2 ? "Application Details"
               : step === 3 ? "Required Documents"
               : "Review & Submit"}
            </h2>
            <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.38)" }}>
              {step === 1 ? "Tell us about yourself"
               : step === 2 ? "Provide details specific to this opportunity"
               : step === 3 ? "Review and confirm what documents you'll need to provide"
               : "Final check before sending your application"}
            </p>
          </div>

          <div className="p-6 space-y-5">

            {/* ── STEP 1: Personal Info ── */}
            {step === 1 && (
              <div className="grid gap-4 sm:grid-cols-2">
                <DarkField label="Full Name" required value={core.fullName}
                  onChange={(v) => setC("fullName", v)} placeholder="e.g. Amina Hassan" />
                <DarkField label="Phone Number" required value={core.phone}
                  onChange={(v) => setC("phone", v)} placeholder="+255 712 345 678" />
                <DarkField label="Nationality" required value={core.nationality}
                  onChange={(v) => setC("nationality", v)} placeholder="Tanzania" />
                <DarkField label="Date of Birth" type="date" value={core.dateOfBirth}
                  onChange={(v) => setC("dateOfBirth", v)} />
              </div>
            )}

            {/* ── STEP 2: Dynamic opportunity-specific fields ── */}
            {step === 2 && (
              <div className="space-y-4">
                {typeNote && (
                  <div className="rounded-xl p-4" style={{
                    background: "rgba(251,191,36,0.08)",
                    border: "1px solid rgba(251,191,36,0.18)",
                  }}>
                    <p className="text-sm leading-relaxed" style={{ color: "rgba(251,191,36,0.85)" }}>
                      ⚠️ {typeNote}
                    </p>
                  </div>
                )}

                {appFields.length === 0 ? (
                  <div className="rounded-xl p-8 text-center" style={{
                    background: "rgba(255,255,255,0.02)",
                    border: "1px dashed rgba(255,255,255,0.1)",
                  }}>
                    <FileText className="h-8 w-8 mx-auto mb-2" style={{ color: "rgba(255,255,255,0.15)" }} />
                    <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>No additional details required for this opportunity.</p>
                    <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.25)" }}>Continue to the next step.</p>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {appFields.map((field) => {
                      const isWide = field.type === "textarea" || field.fullWidth
                      return (
                        <div key={field.id} className={isWide ? "sm:col-span-2" : ""}>
                          <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider"
                            style={{ color: "rgba(255,255,255,0.4)" }}>
                            {field.label}
                            {field.required && <span className="text-red-400 ml-1">*</span>}
                          </label>

                          {field.type === "textarea" ? (
                            <textarea
                              value={dynValues[field.id] ?? ""}
                              onChange={(e) => setDyn(field.id, e.target.value)}
                              rows={4}
                              placeholder={field.placeholder}
                              className={`${inputCls} resize-none`}
                              style={inputStyle}
                            />
                          ) : field.type === "select" && field.options ? (
                            <select
                              value={dynValues[field.id] ?? ""}
                              onChange={(e) => setDyn(field.id, e.target.value)}
                              className={inputCls}
                              style={{ ...inputStyle, appearance: "none" }}
                            >
                              <option value="" style={{ background: "#05091a" }}>Select {field.label}…</option>
                              {field.options.map((o) => (
                                <option key={o} value={o} style={{ background: "#05091a" }}>{o}</option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type={field.type}
                              value={dynValues[field.id] ?? ""}
                              onChange={(e) => setDyn(field.id, e.target.value)}
                              placeholder={field.placeholder}
                              className={inputCls}
                              style={inputStyle}
                            />
                          )}

                          {field.note && (
                            <p className="text-[11px] mt-1 leading-snug" style={{ color: "rgba(251,146,60,0.75)" }}>{field.note}</p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ── STEP 3: Documents ── */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="rounded-xl px-4 py-3 text-sm" style={{
                  background: "rgba(96,165,250,0.08)",
                  border: "1px solid rgba(96,165,250,0.18)",
                }}>
                  <p className="font-semibold mb-0.5" style={{ color: "#60a5fa" }}>Upload Your Documents</p>
                  <p className="text-xs" style={{ color: "rgba(96,165,250,0.7)" }}>
                    Upload required documents now. You can upload PDF or image files (max 16MB each).
                    Required documents must be uploaded before you can submit.
                  </p>
                </div>

                <div className="space-y-3">
                  {requiredDocs.map((doc) => (
                    <DocUploadSlot
                      key={doc.id}
                      doc={doc}
                      uploaded={uploadedFiles[doc.id] ?? null}
                      isUploading={uploadingSlot === doc.id}
                      onUpload={async (file) => {
                        setUploadingSlot(doc.id)
                        try {
                          const form = new FormData()
                          form.append("file", file)
                          const res = await fetch("/api/upload", { method: "POST", body: form })
                          const json = await res.json()
                          if (!res.ok) throw new Error(json.error ?? "Upload failed")
                          setUploadedFiles(prev => ({ ...prev, [doc.id]: { url: json.url, name: json.name } }))
                        } catch (err: any) {
                          toast({ title: "Upload failed", description: err.message, variant: "destructive" })
                        } finally {
                          setUploadingSlot(null)
                        }
                      }}
                      onClear={() => setUploadedFiles(prev => ({ ...prev, [doc.id]: null }))}
                    />
                  ))}
                </div>

                {requiredDocCount > 0 && (
                  <div className="rounded-xl px-4 py-2.5 flex items-center justify-between"
                    style={{ background: uploadedRequiredCount >= requiredDocCount ? "rgba(52,211,153,0.08)" : "rgba(255,255,255,0.03)", border: `1px solid ${uploadedRequiredCount >= requiredDocCount ? "rgba(52,211,153,0.2)" : "rgba(255,255,255,0.07)"}` }}>
                    <span className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>Required documents uploaded</span>
                    <span className="text-xs font-bold" style={{ color: uploadedRequiredCount >= requiredDocCount ? "#34d399" : "#fbbf24" }}>
                      {uploadedRequiredCount} / {requiredDocCount}
                    </span>
                  </div>
                )}

                <label className="flex items-start gap-3 cursor-pointer rounded-xl p-4 transition-colors"
                  style={{ border: `2px solid ${core.docsConfirmed ? "rgba(212,175,55,0.35)" : "rgba(255,255,255,0.08)"}`, background: core.docsConfirmed ? "rgba(212,175,55,0.04)" : "transparent" }}>
                  <input
                    type="checkbox"
                    checked={core.docsConfirmed}
                    onChange={(e) => setC("docsConfirmed", e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded accent-yellow-400"
                  />
                  <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>
                    <span className="font-semibold text-white">I confirm</span> all documents I have uploaded are authentic and belong to me. I understand providing false documents will result in immediate rejection.
                  </p>
                </label>
              </div>
            )}

            {/* ── STEP 4: Review & Submit ── */}
            {step === 4 && (
              <div className="space-y-5">
                {/* Summary */}
                <div className="rounded-xl overflow-hidden text-sm" style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}>
                  <ReviewRow label="Full Name"   value={core.fullName}    />
                  <ReviewRow label="Phone"       value={core.phone}       />
                  <ReviewRow label="Nationality" value={core.nationality} />
                  {appFields.map((f) => {
                    const val = dynValues[f.id]
                    if (!val || val.length > 80) return null
                    return <ReviewRow key={f.id} label={f.label} value={val} />
                  })}
                  <ReviewRow label="Opportunity" value={opportunity.title} />
                </div>

                {/* Cover letter */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-[0.15em] mb-2" style={{ color: "rgba(212,175,55,0.7)" }}>
                    {opportunity.type === "SCHOLARSHIP"
                      ? "Personal Statement / Motivation Letter"
                      : "Cover Letter / Why are you interested?"} *
                  </label>
                  <p className="text-xs mb-2" style={{ color: "rgba(255,255,255,0.3)" }}>
                    {opportunity.type === "SCHOLARSHIP"
                      ? "Tell us about your academic background, goals, and why you deserve this opportunity."
                      : "Explain your interest in this opportunity and what you hope to achieve."}
                  </p>
                  <textarea
                    value={core.coverLetter}
                    onChange={(e) => setC("coverLetter", e.target.value)}
                    rows={6}
                    required
                    placeholder="Write at least 2–3 sentences…"
                    className={`${inputCls} resize-none`}
                    style={inputStyle}
                  />
                </div>

                {/* What happens next */}
                <div className="rounded-xl p-4" style={{ background: "rgba(96,165,250,0.07)", border: "1px solid rgba(96,165,250,0.15)" }}>
                  <p className="text-sm font-semibold flex items-center gap-1.5 mb-1" style={{ color: "#60a5fa" }}>
                    <Clock className="h-3.5 w-3.5" />What happens after submission?
                  </p>
                  <p className="text-xs leading-relaxed" style={{ color: "rgba(96,165,250,0.7)" }}>
                    {getSubmissionMessage(opportunity.type)}
                  </p>
                  <p className="text-xs mt-1.5 font-medium" style={{ color: "rgba(96,165,250,0.6)" }}>
                    No fees are required at this stage — payment only applies after your application is approved.
                  </p>
                </div>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={core.termsAccepted}
                    onChange={(e) => setC("termsAccepted", e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded accent-yellow-400"
                  />
                  <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
                    I agree to EA Trade Link's terms and conditions. I understand that fees only apply after my application is reviewed and approved.
                  </p>
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pb-8">
          <button
            onClick={() => setStep((s) => s - 1)}
            disabled={step === 1}
            className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all disabled:opacity-30"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", color: "rgba(255,255,255,0.6)" }}
          >
            <ArrowLeft className="h-4 w-4" />Back
          </button>

          {step < STEPS.length ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              disabled={!canAdvance()}
              className="flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold transition-all hover:opacity-90 disabled:opacity-35"
              style={{ background: "#C8102E", color: "#fff", boxShadow: "0 4px 16px rgba(200,16,46,0.3)" }}
            >
              Continue <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={submit}
              disabled={!canAdvance() || loading}
              className="flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold transition-all hover:opacity-90 disabled:opacity-35 min-w-[180px] justify-center"
              style={{ background: "#C8102E", color: "#fff", boxShadow: "0 4px 16px rgba(200,16,46,0.3)" }}
            >
              {loading
                ? <><Loader2 className="h-4 w-4 animate-spin" />Submitting…</>
                : <>Submit Application <ArrowRight className="h-4 w-4" /></>
              }
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Helper components ──────────────────────────────────────────────────────────

function DarkField({
  label, required, value, onChange, type = "text", placeholder,
}: {
  label: string; required?: boolean; value: string
  onChange: (v: string) => void; type?: string; placeholder?: string
}) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
        style={{ color: "rgba(255,255,255,0.4)" }}>
        {label}{required && <span className="text-red-400 ml-1">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all focus:ring-2 focus:ring-yellow-400/20"
        style={{
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.1)",
          color: "rgba(255,255,255,0.85)",
        }}
      />
    </div>
  )
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between px-4 py-2.5 gap-4"
      style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
      <span className="text-xs shrink-0" style={{ color: "rgba(255,255,255,0.3)" }}>{label}</span>
      <span className="font-medium text-sm text-right" style={{ color: "rgba(255,255,255,0.75)" }}>{value}</span>
    </div>
  )
}

// ── Document upload slot ───────────────────────────────────────────────────────
function DocUploadSlot({
  doc, uploaded, isUploading, onUpload, onClear,
}: {
  doc: RequiredDoc
  uploaded: { url: string; name: string } | null
  isUploading: boolean
  onUpload: (file: File) => void
  onClear: () => void
}) {
  const inputId = `doc-upload-${doc.id}`

  return (
    <div className="rounded-xl overflow-hidden"
      style={{
        background: uploaded ? "rgba(52,211,153,0.05)" : doc.required ? "rgba(251,191,36,0.04)" : "rgba(255,255,255,0.03)",
        border: `1px solid ${uploaded ? "rgba(52,211,153,0.2)" : doc.required ? "rgba(251,191,36,0.15)" : "rgba(255,255,255,0.07)"}`,
      }}>
      {/* Header row */}
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
          style={{ background: uploaded ? "rgba(52,211,153,0.15)" : doc.required ? "rgba(251,191,36,0.12)" : "rgba(255,255,255,0.06)" }}>
          {uploaded
            ? <CheckCircle2 className="h-3.5 w-3.5" style={{ color: "#34d399" }} />
            : <FileText className="h-3.5 w-3.5" style={{ color: doc.required ? "#fbbf24" : "rgba(255,255,255,0.3)" }} />
          }
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.85)" }}>{doc.label}</p>
          {uploaded
            ? <p className="text-[11px] truncate mt-0.5" style={{ color: "#34d399" }}>{uploaded.name}</p>
            : <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>PDF or image, max 16MB</p>
          }
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{
              background: doc.required ? "rgba(251,191,36,0.14)" : "rgba(255,255,255,0.06)",
              color: doc.required ? "#fbbf24" : "rgba(255,255,255,0.3)",
            }}>
            {doc.required ? "Required" : "Optional"}
          </span>
          {uploaded ? (
            <button onClick={onClear} className="flex h-6 w-6 items-center justify-center rounded-full transition-all hover:opacity-80"
              style={{ background: "rgba(248,113,113,0.15)" }}>
              <X className="h-3 w-3 text-red-400" />
            </button>
          ) : (
            <label htmlFor={inputId} className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold cursor-pointer transition-all hover:opacity-90 ${isUploading ? "opacity-50 pointer-events-none" : ""}`}
              style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.1)" }}>
              {isUploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
              {isUploading ? "Uploading…" : "Upload"}
            </label>
          )}
        </div>
      </div>

      <input
        id={inputId}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.webp"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) onUpload(file)
          e.target.value = ""
        }}
      />
    </div>
  )
}
