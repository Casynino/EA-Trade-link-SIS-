"use client"

import { useState } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { PageBackground } from "@/components/ui/page-background"
import {
  Plane, ArrowRight, ArrowLeft, CheckCircle2, Globe2,
  User, Building2, Calendar, FileText, ChevronRight, AlertCircle,
} from "lucide-react"

const STEPS = [
  { id: 1, label: "Personal",   icon: User },
  { id: 2, label: "Company",    icon: Building2 },
  { id: 3, label: "Travel",     icon: Calendar },
  { id: 4, label: "Documents",  icon: FileText },
  { id: 5, label: "Review",     icon: CheckCircle2 },
]

const PURPOSES = [
  "Business meetings", "Trade negotiations", "Factory inspection",
  "Canton Fair / Trade exhibition", "Conference / Seminar",
  "Investment & partnership", "Other business purpose",
]

interface DocEntry { key: string; ready: boolean; fileName: string }

interface FormData {
  fullName: string; nationality: string; passportNumber: string
  passportExpiry: string; dateOfBirth: string; phone: string; contactEmail: string
  companyName: string; companyAddress: string; jobTitle: string
  companyRegNumber: string; tinNumber: string
  purpose: string; travelDates: string; stayDuration: string; previousVisits: string
  documents: DocEntry[]
}

function getDocRequirements(form: FormData) {
  const applicantName = form.fullName.trim().toLowerCase()
  const companyName = form.companyName.trim().toLowerCase()
  const tinHolder = form.tinNumber.trim().toLowerCase()

  // Check if names appear not to match (simple heuristic — admin does final check)
  const nameMismatch = !!form.companyName && !!form.tinNumber &&
    !companyName.includes(applicantName.split(" ")[0]) &&
    !applicantName.includes(companyName.split(" ")[0])

  const docs = [
    { key: "business_license", label: "Business License",                                    required: true },
    { key: "tin",              label: "TIN Certificate",                                      required: true },
    { key: "passport",         label: "Passport Biodata Page",                                required: true, hint: "Clear scan or photo" },
    { key: "photo",            label: "Passport-size Photograph",                             required: true, hint: "White background, recent" },
    { key: "bank_statement",   label: "Bank Statement (min. USD 15,000–20,000 equivalent)",   required: true, hint: "Last 3 months" },
    { key: "auth_letter",      label: "Company Authorization Letter",                         required: nameMismatch, hint: "Required when Business License / TIN name does not match applicant name" },
  ]

  return { docs, nameMismatch }
}

const EMPTY: FormData = {
  fullName: "", nationality: "", passportNumber: "", passportExpiry: "", dateOfBirth: "", phone: "", contactEmail: "",
  companyName: "", companyAddress: "", jobTitle: "", companyRegNumber: "", tinNumber: "",
  purpose: "", travelDates: "", stayDuration: "", previousVisits: "",
  documents: [],
}

export function VisaWizard({ userId, userEmail }: { userId: string | null; userEmail: string | null }) {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<FormData>({ ...EMPTY, contactEmail: userEmail ?? "" })
  const [certified, setCertified] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState("")

  const set = <K extends keyof FormData>(k: K, v: FormData[K]) => setForm(f => ({ ...f, [k]: v }))

  const setDoc = (key: string, field: "ready" | "fileName", val: boolean | string) => {
    setForm(f => ({ ...f, documents: f.documents.map(d => d.key === key ? { ...d, [field]: val } : d) }))
  }

  // Initialise doc entries when entering step 4
  const initDocs = () => {
    const { docs } = getDocRequirements(form)
    const existing = new Set(form.documents.map(d => d.key))
    const newDocs = docs.filter(d => !existing.has(d.key)).map(d => ({ key: d.key, ready: false, fileName: "" }))
    if (newDocs.length > 0) {
      setForm(f => ({ ...f, documents: [...f.documents, ...newDocs] }))
    }
  }

  const canNext = () => {
    if (step === 1) return !!form.fullName && !!form.nationality && !!form.passportNumber && !!form.phone && !!form.contactEmail
    if (step === 2) return true
    if (step === 3) return !!form.purpose
    if (step === 4) return true
    if (step === 5) return certified
    return true
  }

  const goNext = () => {
    if (step === 3) initDocs()
    setStep(s => s + 1)
  }

  const handleSubmit = async () => {
    if (!certified) return
    setSubmitting(true)
    setError("")
    try {
      const { nameMismatch } = getDocRequirements(form)
      const payload = {
        ...form,
        requiresAuthLetter: nameMismatch,
        documentsJson: JSON.stringify(form.documents),
        documents: undefined,
      }
      const res = await fetch("/api/visa-service/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || "Submission failed")
      }
      setSubmitted(true)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) return <SuccessScreen />

  const { docs: docReqs, nameMismatch } = getDocRequirements(form)

  return (
    <div className="min-h-screen relative" style={{ background: "#05091a" }}>
      <PageBackground />
      <div className="relative z-10">
        <nav className="sticky top-0 z-50"
          style={{ background: "rgba(5,9,26,0.88)", borderBottom: "1px solid rgba(255,255,255,0.07)", backdropFilter: "blur(18px)" }}>
          <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-3.5">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ background: "linear-gradient(135deg,#C8102E,#0F2557)" }}>
                <Globe2 className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold text-white text-sm">EA Trade Link</span>
            </Link>
            <Link href="/" className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Back to home</Link>
          </div>
        </nav>

        <div className="mx-auto max-w-2xl px-6 py-10">
          <div className="text-center mb-8">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl mb-4"
              style={{ background: "rgba(212,175,55,0.12)", border: "1px solid rgba(212,175,55,0.2)" }}>
              <Plane className="h-7 w-7" style={{ color: "#D4AF37" }} />
            </div>
            <h1 className="text-2xl font-black text-white mb-2">Apply for China Business Visa</h1>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
              We process your China business visa application end-to-end. Submit your details and our team handles the rest.
            </p>
          </div>

          {/* Progress */}
          <div className="flex items-center justify-between mb-8">
            {STEPS.map((s, i) => {
              const done = step > s.id
              const active = step === s.id
              return (
                <div key={s.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold transition-all duration-300"
                      style={done ? { background: "#D4AF37", color: "#05091a" } :
                        active ? { background: "rgba(212,175,55,0.15)", border: "2px solid #D4AF37", color: "#D4AF37" } :
                          { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.25)" }}>
                      {done ? <CheckCircle2 className="h-4 w-4" /> : <s.icon className="h-4 w-4" />}
                    </div>
                    <p className="text-[10px] mt-1.5 font-medium hidden sm:block"
                      style={{ color: active || done ? "#D4AF37" : "rgba(255,255,255,0.25)" }}>{s.label}</p>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className="flex-1 h-px mx-2 mb-4"
                      style={{ background: done ? "rgba(212,175,55,0.4)" : "rgba(255,255,255,0.07)" }} />
                  )}
                </div>
              )
            })}
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={step}
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.22 }}>
              <div className="rounded-2xl p-7" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)" }}>
                {step === 1 && <V1 form={form} set={set as any} />}
                {step === 2 && <V2 form={form} set={set as any} />}
                {step === 3 && <V3 form={form} set={set as any} />}
                {step === 4 && <V4 form={form} docReqs={docReqs} nameMismatch={nameMismatch} setDoc={setDoc} />}
                {step === 5 && <V5 form={form} docReqs={docReqs} certified={certified} setCertified={setCertified} />}
              </div>
            </motion.div>
          </AnimatePresence>

          {error && <p className="mt-4 text-sm text-red-400 text-center">{error}</p>}

          <div className="flex items-center justify-between mt-6">
            {step > 1 ? (
              <button onClick={() => setStep(s => s - 1)} className="flex items-center gap-1.5 text-sm font-medium" style={{ color: "rgba(255,255,255,0.4)" }}>
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
            ) : <div />}

            {step < 5 ? (
              <button disabled={!canNext()} onClick={goNext}
                className="flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105"
                style={{ background: "#D4AF37", color: "#05091a" }}>
                Continue <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button disabled={submitting || !certified} onClick={handleSubmit}
                className="flex items-center gap-2 rounded-xl px-7 py-2.5 text-sm font-bold transition-all hover:scale-105 disabled:opacity-50"
                style={{ background: "#D4AF37", color: "#05091a" }}>
                {submitting ? "Submitting…" : "Submit Application"}
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>

          <p className="text-center text-xs mt-6" style={{ color: "rgba(255,255,255,0.2)" }}>
            Your visa application has been successfully received by the Visa Processing Unit. It is now under review. You will receive a response within 5 days.
          </p>
        </div>
      </div>
    </div>
  )
}

function V1({ form, set }: { form: FormData; set: (k: string, v: string) => void }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-white mb-1">Personal Details</h2>
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>As they appear on your passport.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <VField label="Full Name" required value={form.fullName} onChange={v => set("fullName", v)} placeholder="As on passport" />
        <VField label="Nationality" required value={form.nationality} onChange={v => set("nationality", v)} placeholder="e.g. Tanzanian" />
        <VField label="Passport Number" required value={form.passportNumber} onChange={v => set("passportNumber", v)} placeholder="e.g. AP1234567" />
        <VField label="Passport Expiry Date" value={form.passportExpiry} onChange={v => set("passportExpiry", v)} type="date" />
        <VField label="Date of Birth" value={form.dateOfBirth} onChange={v => set("dateOfBirth", v)} type="date" />
        <VField label="Phone / WhatsApp" required value={form.phone} onChange={v => set("phone", v)} placeholder="+255 xxx xxx" type="tel" />
        <div className="sm:col-span-2">
          <VField label="Email Address" required value={form.contactEmail} onChange={v => set("contactEmail", v)} placeholder="your@email.com" type="email" />
        </div>
      </div>
    </div>
  )
}

function V2({ form, set }: { form: FormData; set: (k: string, v: string) => void }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-white mb-1">Company Details</h2>
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>Required for business visa processing.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <VField label="Company Name" value={form.companyName} onChange={v => set("companyName", v)} placeholder="Your registered company name" />
        <VField label="Position / Job Title" value={form.jobTitle} onChange={v => set("jobTitle", v)} placeholder="e.g. Managing Director" />
        <VField label="Company Registration No." value={form.companyRegNumber} onChange={v => set("companyRegNumber", v)} placeholder="Optional" />
        <VField label="TIN Number" value={form.tinNumber} onChange={v => set("tinNumber", v)} placeholder="Tax Identification Number" />
        <div className="sm:col-span-2">
          <VField label="Company Address" value={form.companyAddress} onChange={v => set("companyAddress", v)} placeholder="City, Country" />
        </div>
      </div>
      <div className="rounded-xl p-4 flex gap-3"
        style={{ background: "rgba(212,175,55,0.06)", border: "1px solid rgba(212,175,55,0.15)" }}>
        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "#D4AF37" }} />
        <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
          If the name on your Business License or TIN does not match your passport name, a Company Authorization Letter will be required in the next step.
        </p>
      </div>
    </div>
  )
}

function V3({ form, set }: { form: FormData; set: (k: string, v: string) => void }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-white mb-1">Travel Information</h2>
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>Tell us about your planned trip to China.</p>
      </div>

      <div>
        <label className="block text-sm font-semibold text-white mb-2">Purpose of Visit <span style={{ color: "#D4AF37" }}>*</span></label>
        <div className="flex flex-wrap gap-2">
          {PURPOSES.map(p => (
            <button key={p} onClick={() => set("purpose", p)}
              className="rounded-full px-3.5 py-1.5 text-xs font-medium transition-all"
              style={form.purpose === p
                ? { background: "#D4AF37", color: "#05091a" }
                : { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }}>
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <VField label="Intended Travel Dates" value={form.travelDates} onChange={v => set("travelDates", v)} placeholder="e.g. 15 Aug – 30 Aug 2025" />
        <VField label="Intended Stay Duration" value={form.stayDuration} onChange={v => set("stayDuration", v)} placeholder="e.g. 15 days" />
        <div className="sm:col-span-2">
          <VField label="Previous China Visits" value={form.previousVisits} onChange={v => set("previousVisits", v)} placeholder="e.g. Yes – visited in 2023" />
        </div>
      </div>
    </div>
  )
}

function V4({ form, docReqs, nameMismatch, setDoc }: {
  form: FormData
  docReqs: ReturnType<typeof getDocRequirements>["docs"]
  nameMismatch: boolean
  setDoc: (key: string, field: "ready" | "fileName", val: boolean | string) => void
}) {
  const readyCount = form.documents.filter(d => d.ready).length

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-white mb-1">Document Checklist</h2>
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>Mark the documents you currently have ready.</p>
      </div>

      {nameMismatch && (
        <div className="rounded-xl p-4 flex gap-3"
          style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-400" />
          <p className="text-xs text-red-300">
            We detected a possible name mismatch between your passport and business documents. A <strong>Company Authorization Letter</strong> has been added as a required document.
          </p>
        </div>
      )}

      <div className="rounded-xl p-3 text-xs"
        style={{ background: "rgba(212,175,55,0.06)", border: "1px solid rgba(212,175,55,0.15)", color: "rgba(255,255,255,0.4)" }}>
        <strong style={{ color: "#D4AF37" }}>{readyCount}</strong> of {docReqs.length} documents marked ready.
        Our team will send a full submission link after reviewing your profile.
      </div>

      <div className="space-y-2.5">
        {docReqs.map(req => {
          const entry = form.documents.find(d => d.key === req.key)
          const isReady = entry?.ready ?? false
          return (
            <div key={req.key} className="rounded-xl p-4 transition-all"
              style={isReady
                ? { background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.25)" }
                : { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="flex items-start gap-3">
                <button onClick={() => setDoc(req.key, "ready", !isReady)}
                  className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md transition-all"
                  style={isReady ? { background: "#D4AF37", border: "none" } : { background: "transparent", border: "1.5px solid rgba(255,255,255,0.2)" }}>
                  {isReady && <CheckCircle2 className="h-3.5 w-3.5" style={{ color: "#05091a" }} />}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-white">{req.label}</p>
                    {req.required
                      ? <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: "rgba(239,68,68,0.15)", color: "#f87171" }}>Required</span>
                      : <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.4)" }}>Optional</span>}
                  </div>
                  {req.hint && <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>{req.hint}</p>}
                  {isReady && (
                    <input value={entry?.fileName ?? ""} onChange={e => setDoc(req.key, "fileName", e.target.value)}
                      placeholder="File name or note (optional)"
                      className="mt-2 w-full rounded-lg px-3 py-1.5 text-xs outline-none"
                      style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(212,175,55,0.2)", color: "white" }} />
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function V5({ form, docReqs, certified, setCertified }: {
  form: FormData
  docReqs: ReturnType<typeof getDocRequirements>["docs"]
  certified: boolean
  setCertified: (v: boolean) => void
}) {
  const rows = [
    { label: "Full Name",     value: form.fullName },
    { label: "Nationality",   value: form.nationality },
    { label: "Passport No.",  value: form.passportNumber },
    { label: "Phone",         value: form.phone },
    { label: "Email",         value: form.contactEmail },
    { label: "Company",       value: form.companyName || "—" },
    { label: "Position",      value: form.jobTitle || "—" },
    { label: "TIN Number",    value: form.tinNumber || "—" },
    { label: "Purpose",       value: form.purpose },
    { label: "Travel Dates",  value: form.travelDates || "—" },
  ]

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-white mb-1">Review Your Application</h2>
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>Please verify all information before submitting.</p>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.07)" }}>
        {rows.map((r, i) => (
          <div key={r.label} className="flex items-start justify-between gap-4 px-4 py-2.5"
            style={{ borderBottom: i < rows.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
            <p className="text-xs shrink-0 w-32" style={{ color: "rgba(255,255,255,0.35)" }}>{r.label}</p>
            <p className="text-sm text-white text-right">{r.value}</p>
          </div>
        ))}
      </div>

      <div>
        <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "rgba(255,255,255,0.3)" }}>
          Documents ({form.documents.filter(d => d.ready).length} marked ready)
        </p>
        <div className="rounded-xl p-4 space-y-1" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
          {docReqs.map(req => {
            const ready = form.documents.find(d => d.key === req.key)?.ready
            return (
              <div key={req.key} className="flex items-center gap-2 text-xs">
                <div className="h-2 w-2 rounded-full shrink-0" style={{ background: ready ? "#D4AF37" : "rgba(255,255,255,0.15)" }} />
                <span style={{ color: ready ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.3)" }}>{req.label}</span>
                {req.required && !ready && <span style={{ color: "rgba(239,68,68,0.7)" }}>(required)</span>}
              </div>
            )
          })}
        </div>
      </div>

      <div className="rounded-xl p-4" style={{ background: "rgba(212,175,55,0.06)", border: "1px solid rgba(212,175,55,0.15)" }}>
        <p className="text-sm font-semibold mb-2" style={{ color: "#D4AF37" }}>Visa Processing Flow</p>
        <ol className="space-y-1.5 text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
          <li>1. Application review within <strong style={{ color: "rgba(255,255,255,0.75)" }}>5 business days</strong></li>
          <li>2. Document verification — we confirm all required documents are in order</li>
          <li>3. Visa processing — submitted through our accredited network</li>
          <li>4. Completion — you receive your visa and travel confirmation</li>
        </ol>
      </div>

      <button onClick={() => setCertified(!certified)}
        className="flex items-start gap-3 w-full text-left rounded-xl p-4 transition-all"
        style={certified
          ? { background: "rgba(212,175,55,0.1)", border: "2px solid rgba(212,175,55,0.4)" }
          : { background: "rgba(255,255,255,0.03)", border: "2px solid rgba(255,255,255,0.1)" }}>
        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md mt-0.5 transition-all"
          style={certified ? { background: "#D4AF37" } : { border: "1.5px solid rgba(255,255,255,0.25)" }}>
          {certified && <CheckCircle2 className="h-3.5 w-3.5" style={{ color: "#05091a" }} />}
        </div>
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>
          I certify that all information provided in this application is accurate and complete to the best of my knowledge.
        </p>
      </button>
    </div>
  )
}

function SuccessScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center relative" style={{ background: "#05091a" }}>
      <PageBackground />
      <div className="relative z-10 text-center max-w-md px-6">
        <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", bounce: 0.4 }}
          className="inline-flex h-20 w-20 items-center justify-center rounded-2xl mx-auto mb-6"
          style={{ background: "rgba(212,175,55,0.12)", border: "1px solid rgba(212,175,55,0.3)" }}>
          <CheckCircle2 className="h-10 w-10" style={{ color: "#D4AF37" }} />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h1 className="text-2xl font-black text-white mb-3">Visa Application Submitted!</h1>
          <p className="text-sm mb-2" style={{ color: "rgba(255,255,255,0.55)" }}>
            Your visa application has been successfully received by the Visa Processing Unit. It is now under review. You will receive a response within <strong className="text-white">5 days</strong>.
          </p>
          <p className="text-sm mb-8" style={{ color: "rgba(255,255,255,0.4)" }}>
            You'll hear from us via email and WhatsApp.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/login" className="inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold"
              style={{ background: "#D4AF37", color: "#05091a" }}>
              Sign in to Dashboard <ChevronRight className="h-4 w-4" />
            </Link>
            <Link href="/" className="inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold"
              style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.1)" }}>
              Back to Home
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

function VField({ label, required, value, onChange, placeholder, type = "text" }: {
  label: string; required?: boolean; value: string; onChange: (v: string) => void; placeholder?: string; type?: string
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-white mb-1.5">
        {label}{required && <span style={{ color: "#D4AF37" }}> *</span>}
      </label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "white" }} />
    </div>
  )
}
