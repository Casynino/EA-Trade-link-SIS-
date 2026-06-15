"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { PageBackground } from "@/components/ui/page-background"
import {
  GraduationCap, ArrowRight, ArrowLeft, CheckCircle2, Globe2,
  User, BookOpen, FileText, ChevronRight, Upload, AlertCircle,
} from "lucide-react"

// ── Step definitions ───────────────────────────────────────────────────────────
const STEPS = [
  { id: 1, label: "Program",   icon: GraduationCap },
  { id: 2, label: "Personal",  icon: User },
  { id: 3, label: "Academic",  icon: BookOpen },
  { id: 4, label: "Documents", icon: FileText },
  { id: 5, label: "Review",    icon: CheckCircle2 },
]

const DEGREE_OPTIONS = [
  { value: "BACHELOR",  label: "Bachelor's Degree",      icon: "🎓", desc: "3–4 year undergraduate programs" },
  { value: "MASTER",    label: "Master's Degree",         icon: "🏅", desc: "2–3 year postgraduate programs" },
  { value: "PHD",       label: "PhD / Doctorate",         icon: "🔬", desc: "Research doctorate programs" },
  { value: "LANGUAGE",  label: "Chinese Language Program",icon: "🇨🇳", desc: "Mandarin language programs" },
  { value: "SHORT",     label: "Short Program",           icon: "📅", desc: "Semester or summer programs" },
]

// Dynamic document requirements per degree level
interface DocReq {
  key: string
  label: string
  required: boolean
  hint?: string
}

function getDocRequirements(degree: string): DocReq[] {
  const shared: DocReq[] = [
    { key: "passport",        label: "Passport (min. 12 months validity)",        required: true,  hint: "PDF scan of biodata page" },
    { key: "physical_exam",   label: "Physical Examination Form",                 required: true,  hint: "Completed by a certified physician" },
    { key: "police_clearance",label: "Non-Criminal Record Certificate",           required: true },
    { key: "certificate",     label: "Highest Academic Certificate",              required: true,  hint: "PDF — notarized if possible" },
    { key: "transcript",      label: "Academic Transcript",                       required: true,  hint: "PDF — all semesters" },
    { key: "bank_statement",  label: "Bank Statement (min. 50,000 RMB equivalent)",required: true, hint: "Last 3 months" },
    { key: "photo",           label: "Passport-size Photo",                       required: true,  hint: "White background, recent" },
    { key: "intro_video",     label: "Self-Introduction Video (2–3 min)",         required: true,  hint: "In English or Chinese" },
    { key: "esignature",      label: "E-Signature",                              required: true,  hint: "Photo of your signed paper" },
    { key: "english_cert",    label: "English Proficiency Certificate",           required: false, hint: "IELTS, TOEFL, or equivalent" },
    { key: "school_form",     label: "School Application Form",                  required: true },
  ]

  if (degree === "BACHELOR") {
    return [
      { key: "app_form",      label: "Main Application Form",                    required: true },
      ...shared,
    ]
  }

  if (degree === "MASTER") {
    return [
      { key: "app_form",      label: "Application Form for International Master Students", required: true },
      ...shared,
      { key: "personal_stmt", label: "Personal Statement (~600 words)",           required: true,  hint: "In English or Chinese" },
      { key: "commitment",    label: "Letter of Commitment",                      required: true },
      { key: "rec_letter_1",  label: "Recommendation Letter 1 (undergraduate supervisor)", required: true },
      { key: "rec_letter_2",  label: "Recommendation Letter 2 (lecturer)",        required: true },
    ]
  }

  if (degree === "PHD") {
    return [
      { key: "app_form",      label: "Application Form for International PhD Students", required: true },
      { key: "passport",      label: "Passport (min. 12 months validity)",        required: true },
      { key: "physical_exam", label: "Physical Examination Form",                 required: true },
      { key: "police_clearance",label: "Non-Criminal Record Certificate",         required: true },
      { key: "masters_cert",  label: "Master's Degree Certificate",               required: true },
      { key: "masters_trans", label: "Master's Transcript",                       required: true },
      { key: "bank_statement",label: "Bank Statement (min. 50,000 RMB equivalent)",required: true },
      { key: "photo",         label: "Passport-size Photo",                       required: true },
      { key: "intro_video",   label: "Self-Introduction Video (2–3 min)",         required: true },
      { key: "esignature",    label: "E-Signature",                              required: true },
      { key: "english_cert",  label: "English Proficiency Certificate",           required: false },
      { key: "personal_stmt", label: "Personal Statement (~600 words)",           required: true },
      { key: "commitment",    label: "Letter of Commitment",                      required: true },
      { key: "rec_letter_1",  label: "Recommendation Letter 1 (Master's supervisor)", required: true },
      { key: "rec_letter_2",  label: "Recommendation Letter 2 (lecturer)",        required: true },
    ]
  }

  // LANGUAGE & SHORT — simplified
  return [
    { key: "passport",        label: "Passport (min. 6 months validity)",         required: true },
    { key: "photo",           label: "Passport-size Photo",                       required: true },
    { key: "certificate",     label: "Highest Academic Certificate",              required: true },
    { key: "bank_statement",  label: "Bank Statement",                            required: false },
    { key: "intro_letter",    label: "Brief Introduction / Letter of Intent",     required: false },
  ]
}

const FIELDS = [
  "Medicine & Health Sciences", "Engineering & Technology", "Business & Management",
  "Agriculture & Environmental Sciences", "Arts & Humanities", "Education",
  "Law & Political Science", "Computer Science & IT", "Natural Sciences",
  "Social Sciences", "Architecture & Urban Planning", "Chinese Studies", "Other",
]

const INTAKES = ["September 2025", "February 2026", "September 2026", "February 2027"]

interface DocEntry { key: string; ready: boolean; fileName: string }

interface FormData {
  // Step 1
  degreeLevel: string
  // Step 2
  fullName: string; gender: string; dateOfBirth: string; nationality: string
  passportNumber: string; passportExpiry: string; phone: string; contactEmail: string
  homeAddress: string; preferredIntake: string; preferredUniversities: string; intendedMajor: string
  fieldOfStudy: string
  // Step 3
  currentEducation: string; institutionName: string; graduationYear: string
  gpa: string; englishProficiency: string; chineseProficiency: string
  // Step 4 — document checklist
  documents: DocEntry[]
}

const EMPTY: FormData = {
  degreeLevel: "",
  fullName: "", gender: "", dateOfBirth: "", nationality: "",
  passportNumber: "", passportExpiry: "", phone: "", contactEmail: "",
  homeAddress: "", preferredIntake: "", preferredUniversities: "", intendedMajor: "",
  fieldOfStudy: "",
  currentEducation: "", institutionName: "", graduationYear: "",
  gpa: "", englishProficiency: "", chineseProficiency: "",
  documents: [],
}

export function StudyWizard({ userId, userEmail }: { userId: string | null; userEmail: string | null }) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<FormData>({ ...EMPTY, contactEmail: userEmail ?? "" })
  const [certified, setCertified] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState("")

  const set = <K extends keyof FormData>(k: K, v: FormData[K]) => setForm(f => ({ ...f, [k]: v }))

  // When degree changes, reset document checklist
  const setDegree = (deg: string) => {
    const reqs = getDocRequirements(deg)
    const docs: DocEntry[] = reqs.map(r => ({ key: r.key, ready: false, fileName: "" }))
    setForm(f => ({ ...f, degreeLevel: deg, documents: docs }))
  }

  const canNext = () => {
    if (step === 1) return !!form.degreeLevel
    if (step === 2) return !!form.fullName && !!form.nationality && !!form.phone && !!form.contactEmail && !!form.intendedMajor
    if (step === 3) return !!form.currentEducation
    if (step === 4) return true // docs optional at this stage
    if (step === 5) return certified
    return true
  }

  const handleSubmit = async () => {
    if (!certified) return
    setSubmitting(true)
    setError("")
    try {
      const payload = {
        ...form,
        documentsJson: JSON.stringify(form.documents),
        documents: undefined,
      }
      const res = await fetch("/api/study/apply", {
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

  if (submitted) return <SuccessScreen degree={form.degreeLevel} />

  const docReqs = form.degreeLevel ? getDocRequirements(form.degreeLevel) : []

  return (
    <div className="min-h-screen relative" style={{ background: "#05091a" }}>
      <PageBackground />
      <div className="relative z-10">
        {/* Nav */}
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
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl mb-4"
              style={{ background: "rgba(56,189,248,0.12)", border: "1px solid rgba(56,189,248,0.2)" }}>
              <GraduationCap className="h-7 w-7" style={{ color: "#38bdf8" }} />
            </div>
            <h1 className="text-2xl font-black text-white mb-2">Apply to Study in China</h1>
            <p className="text-sm max-w-md mx-auto" style={{ color: "rgba(255,255,255,0.45)" }}>
              Our experts personally review your application and match you to the best scholarship and university.
            </p>
            {!userId && (
              <p className="mt-3 text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                Already have an account?{" "}
                <Link href="/login?callbackUrl=/apply-to-china" className="underline" style={{ color: "#38bdf8" }}>Sign in</Link>
              </p>
            )}
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
                      style={done ? { background: "#38bdf8", color: "#05091a" } :
                        active ? { background: "rgba(56,189,248,0.15)", border: "2px solid #38bdf8", color: "#38bdf8" } :
                          { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.25)" }}>
                      {done ? <CheckCircle2 className="h-4 w-4" /> : <s.icon className="h-4 w-4" />}
                    </div>
                    <p className="text-[10px] mt-1.5 font-medium hidden sm:block"
                      style={{ color: active || done ? "#38bdf8" : "rgba(255,255,255,0.25)" }}>{s.label}</p>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className="flex-1 h-px mx-2 mb-4"
                      style={{ background: done ? "rgba(56,189,248,0.4)" : "rgba(255,255,255,0.07)" }} />
                  )}
                </div>
              )
            })}
          </div>

          {/* Step content */}
          <AnimatePresence mode="wait">
            <motion.div key={step}
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.22 }}>
              <div className="rounded-2xl p-7"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)" }}>
                {step === 1 && <Step1 form={form} setDegree={setDegree} />}
                {step === 2 && <Step2 form={form} set={set as any} />}
                {step === 3 && <Step3 form={form} set={set as any} />}
                {step === 4 && <Step4 form={form} docReqs={docReqs} setDoc={(key, field, val) => {
                  setForm(f => ({
                    ...f,
                    documents: f.documents.map(d => d.key === key ? { ...d, [field]: val } : d)
                  }))
                }} />}
                {step === 5 && <Step5 form={form} docReqs={docReqs} certified={certified} setCertified={setCertified} />}
              </div>
            </motion.div>
          </AnimatePresence>

          {error && <p className="mt-4 text-sm text-red-400 text-center">{error}</p>}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6">
            {step > 1 ? (
              <button onClick={() => setStep(s => s - 1)}
                className="flex items-center gap-1.5 text-sm font-medium transition-colors"
                style={{ color: "rgba(255,255,255,0.4)" }}>
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
            ) : <div />}

            {step < 5 ? (
              <button disabled={!canNext()} onClick={() => setStep(s => s + 1)}
                className="flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105"
                style={{ background: "#38bdf8", color: "#05091a" }}>
                Continue <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button disabled={submitting || !certified} onClick={handleSubmit}
                className="flex items-center gap-2 rounded-xl px-7 py-2.5 text-sm font-bold transition-all hover:scale-105 disabled:opacity-50"
                style={{ background: "#38bdf8", color: "#05091a" }}>
                {submitting ? "Submitting…" : "Submit Application"}
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>

          <p className="text-center text-xs mt-6" style={{ color: "rgba(255,255,255,0.2)" }}>
            Your application has been successfully received by the International Education Processing Center. It is now under review. You will receive a response within 5 days.
          </p>
        </div>
      </div>
    </div>
  )
}

// ── Step 1: Study Category ─────────────────────────────────────────────────────
function Step1({ form, setDegree }: { form: FormData; setDegree: (v: string) => void }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-white mb-1">Select Study Category</h2>
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
          Choose the level of study you want to pursue in China.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {DEGREE_OPTIONS.map(opt => (
          <button key={opt.value} onClick={() => setDegree(opt.value)}
            className="text-left rounded-xl px-4 py-4 transition-all"
            style={form.degreeLevel === opt.value
              ? { background: "rgba(56,189,248,0.15)", border: "2px solid #38bdf8" }
              : { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="text-2xl mb-2">{opt.icon}</div>
            <p className="text-sm font-bold text-white">{opt.label}</p>
            <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>{opt.desc}</p>
            {form.degreeLevel === opt.value && (
              <div className="mt-2 flex items-center gap-1 text-xs font-semibold" style={{ color: "#38bdf8" }}>
                <CheckCircle2 className="h-3.5 w-3.5" /> Selected
              </div>
            )}
          </button>
        ))}
      </div>
      {form.degreeLevel && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-xl p-4 text-xs" style={{ background: "rgba(56,189,248,0.06)", border: "1px solid rgba(56,189,248,0.15)" }}>
          <p className="font-semibold mb-1" style={{ color: "#38bdf8" }}>
            {getDocRequirements(form.degreeLevel).filter(d => d.required).length} required documents
          </p>
          <p style={{ color: "rgba(255,255,255,0.45)" }}>
            You'll review the document checklist in Step 4. Documents can be confirmed now and submitted later.
          </p>
        </motion.div>
      )}
    </div>
  )
}

// ── Step 2: Personal Information ───────────────────────────────────────────────
function Step2({ form, set }: { form: FormData; set: (k: string, v: string) => void }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-white mb-1">Personal Information</h2>
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>Used in your placement application. Fill as per your passport.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full Name" required value={form.fullName} onChange={v => set("fullName", v)} placeholder="As on passport" />
        <div>
          <label className="block text-sm font-semibold text-white mb-1.5">Gender <span style={{ color: "#38bdf8" }}>*</span></label>
          <select value={form.gender} onChange={e => set("gender", e.target.value)}
            className="w-full rounded-xl px-4 py-2.5 text-sm"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: form.gender ? "white" : "rgba(255,255,255,0.35)" }}>
            <option value="" style={{ background: "#0d1b3e" }}>Select…</option>
            {["Male", "Female", "Other"].map(g => <option key={g} value={g} style={{ background: "#0d1b3e" }}>{g}</option>)}
          </select>
        </div>
        <Field label="Date of Birth" required value={form.dateOfBirth} onChange={v => set("dateOfBirth", v)} type="date" />
        <Field label="Nationality" required value={form.nationality} onChange={v => set("nationality", v)} placeholder="e.g. Tanzanian" />
        <Field label="Passport Number" value={form.passportNumber} onChange={v => set("passportNumber", v)} placeholder="Optional at this stage" />
        <Field label="Passport Expiry Date" value={form.passportExpiry} onChange={v => set("passportExpiry", v)} type="date" />
        <Field label="Phone / WhatsApp" required value={form.phone} onChange={v => set("phone", v)} placeholder="+255 xxx xxx xxx" type="tel" />
        <Field label="Email Address" required value={form.contactEmail} onChange={v => set("contactEmail", v)} placeholder="your@email.com" type="email" />
      </div>

      <Field label="Home Address" value={form.homeAddress} onChange={v => set("homeAddress", v)} placeholder="Street, City, Country" />

      <div className="border-t pt-4" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
        <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "rgba(255,255,255,0.3)" }}>Study Preferences</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-semibold text-white mb-1.5">Intended Intake <span style={{ color: "#38bdf8" }}>*</span></label>
            <div className="flex flex-wrap gap-2">
              {INTAKES.map(i => (
                <button key={i} onClick={() => set("preferredIntake", i)}
                  className="rounded-full px-3 py-1.5 text-xs font-medium transition-all"
                  style={form.preferredIntake === i
                    ? { background: "#38bdf8", color: "#05091a" }
                    : { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }}>
                  {i}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-white mb-1.5">Intended Major <span style={{ color: "#38bdf8" }}>*</span></label>
            <select value={form.intendedMajor} onChange={e => set("intendedMajor", e.target.value)}
              className="w-full rounded-xl px-4 py-2.5 text-sm"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: form.intendedMajor ? "white" : "rgba(255,255,255,0.35)" }}>
              <option value="" style={{ background: "#0d1b3e" }}>Select field…</option>
              {FIELDS.map(f => <option key={f} value={f} style={{ background: "#0d1b3e" }}>{f}</option>)}
            </select>
          </div>
        </div>
        <div className="mt-4">
          <Field label="Preferred Universities (optional)" value={form.preferredUniversities}
            onChange={v => set("preferredUniversities", v)}
            placeholder="e.g. Peking University, Fudan University (leave blank to let us recommend)" />
        </div>
      </div>
    </div>
  )
}

// ── Step 3: Academic Information ───────────────────────────────────────────────
function Step3({ form, set }: { form: FormData; set: (k: string, v: string) => void }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-white mb-1">Academic Background</h2>
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>Help us match you to scholarships you qualify for.</p>
      </div>

      <div>
        <label className="block text-sm font-semibold text-white mb-2">Highest Level of Education <span style={{ color: "#38bdf8" }}>*</span></label>
        <select value={form.currentEducation} onChange={e => set("currentEducation", e.target.value)}
          className="w-full rounded-xl px-4 py-2.5 text-sm"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: form.currentEducation ? "white" : "rgba(255,255,255,0.35)" }}>
          <option value="" style={{ background: "#0d1b3e" }}>Select level…</option>
          {["Secondary School (O-Level)", "Secondary School (A-Level / Form 6)", "Bachelor's Degree", "Master's Degree", "Professional Certificate / Diploma"].map(l => (
            <option key={l} value={l} style={{ background: "#0d1b3e" }}>{l}</option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Institution Name" value={form.institutionName} onChange={v => set("institutionName", v)} placeholder="Name of your school/university" />
        <Field label="Year of Graduation" value={form.graduationYear} onChange={v => set("graduationYear", v)} placeholder="e.g. 2023" />
        <Field label="GPA / Results" value={form.gpa} onChange={v => set("gpa", v)} placeholder="e.g. 3.5/4.0 or Division I" />
      </div>

      <div className="border-t pt-4" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
        <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "rgba(255,255,255,0.3)" }}>Language Proficiency</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-semibold text-white mb-1.5">English Proficiency</label>
            <select value={form.englishProficiency} onChange={e => set("englishProficiency", e.target.value)}
              className="w-full rounded-xl px-4 py-2.5 text-sm"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: form.englishProficiency ? "white" : "rgba(255,255,255,0.35)" }}>
              <option value="" style={{ background: "#0d1b3e" }}>Select…</option>
              {["Native / Fluent", "IELTS (have certificate)", "TOEFL (have certificate)", "Basic English", "None"].map(o => (
                <option key={o} value={o} style={{ background: "#0d1b3e" }}>{o}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-white mb-1.5">Chinese Proficiency</label>
            <select value={form.chineseProficiency} onChange={e => set("chineseProficiency", e.target.value)}
              className="w-full rounded-xl px-4 py-2.5 text-sm"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: form.chineseProficiency ? "white" : "rgba(255,255,255,0.35)" }}>
              <option value="" style={{ background: "#0d1b3e" }}>Select…</option>
              {["HSK 1–2 (Basic)", "HSK 3–4 (Intermediate)", "HSK 5–6 (Advanced)", "Learning currently", "None"].map(o => (
                <option key={o} value={o} style={{ background: "#0d1b3e" }}>{o}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {(form.degreeLevel === "MASTER" || form.degreeLevel === "PHD") && (
        <div className="rounded-xl p-4" style={{ background: "rgba(212,175,55,0.06)", border: "1px solid rgba(212,175,55,0.15)" }}>
          <p className="text-xs font-semibold mb-1" style={{ color: "#D4AF37" }}>Additional requirements after submission</p>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>
            For {form.degreeLevel === "PHD" ? "PhD" : "Master's"} programs, you may also be required to take a language proficiency test and attend an online interview with professors.
          </p>
        </div>
      )}
    </div>
  )
}

// ── Step 4: Document Upload ────────────────────────────────────────────────────
function Step4({ form, docReqs, setDoc }: {
  form: FormData
  docReqs: DocReq[]
  setDoc: (key: string, field: "ready" | "fileName", val: boolean | string) => void
}) {
  const readyCount = form.documents.filter(d => d.ready).length
  const requiredTotal = docReqs.filter(d => d.required).length

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-white mb-1">Document Checklist</h2>
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
          Mark the documents you currently have. You can submit physical copies later via the admin portal.
        </p>
      </div>

      <div className="flex items-center gap-3 rounded-xl p-3"
        style={{ background: "rgba(56,189,248,0.07)", border: "1px solid rgba(56,189,248,0.15)" }}>
        <div className="text-2xl font-black" style={{ color: "#38bdf8" }}>{readyCount}</div>
        <div>
          <p className="text-sm font-semibold text-white">documents marked ready</p>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{requiredTotal} required · {docReqs.length - requiredTotal} optional</p>
        </div>
      </div>

      <div className="space-y-2.5">
        {docReqs.map(req => {
          const entry = form.documents.find(d => d.key === req.key)
          const isReady = entry?.ready ?? false
          return (
            <div key={req.key} className="rounded-xl p-4 transition-all"
              style={isReady
                ? { background: "rgba(56,189,248,0.08)", border: "1px solid rgba(56,189,248,0.25)" }
                : { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="flex items-start gap-3">
                <button onClick={() => setDoc(req.key, "ready", !isReady)}
                  className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md transition-all"
                  style={isReady
                    ? { background: "#38bdf8", border: "none" }
                    : { background: "transparent", border: "1.5px solid rgba(255,255,255,0.2)" }}>
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
                    <input
                      value={entry?.fileName ?? ""}
                      onChange={e => setDoc(req.key, "fileName", e.target.value)}
                      placeholder="File name or note (optional)"
                      className="mt-2 w-full rounded-lg px-3 py-1.5 text-xs outline-none"
                      style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(56,189,248,0.2)", color: "white" }}
                    />
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="rounded-xl p-4 flex items-start gap-3"
        style={{ background: "rgba(212,175,55,0.06)", border: "1px solid rgba(212,175,55,0.15)" }}>
        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "#D4AF37" }} />
        <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
          Don't have all documents yet? That's okay. Mark what you have now — our team will send you a personalised document submission link after reviewing your profile.
        </p>
      </div>
    </div>
  )
}

// ── Step 5: Review & Submit ────────────────────────────────────────────────────
function Step5({ form, docReqs, certified, setCertified }: {
  form: FormData; docReqs: DocReq[]; certified: boolean; setCertified: (v: boolean) => void
}) {
  const degree = DEGREE_OPTIONS.find(d => d.value === form.degreeLevel)
  const readyDocs = form.documents.filter(d => d.ready)

  const sections = [
    {
      title: "Program",
      rows: [
        { label: "Study Category", value: degree ? `${degree.icon} ${degree.label}` : "—" },
        { label: "Intended Major", value: form.intendedMajor || "—" },
        { label: "Preferred Intake", value: form.preferredIntake || "—" },
        { label: "Preferred Universities", value: form.preferredUniversities || "Let us recommend" },
      ],
    },
    {
      title: "Personal",
      rows: [
        { label: "Full Name", value: form.fullName },
        { label: "Gender", value: form.gender || "—" },
        { label: "Date of Birth", value: form.dateOfBirth || "—" },
        { label: "Nationality", value: form.nationality },
        { label: "Passport No.", value: form.passportNumber || "—" },
        { label: "Phone", value: form.phone },
        { label: "Email", value: form.contactEmail },
      ],
    },
    {
      title: "Academic",
      rows: [
        { label: "Education Level", value: form.currentEducation },
        { label: "Institution", value: form.institutionName || "—" },
        { label: "Graduation Year", value: form.graduationYear || "—" },
        { label: "GPA / Results", value: form.gpa || "—" },
        { label: "English", value: form.englishProficiency || "—" },
        { label: "Chinese", value: form.chineseProficiency || "—" },
      ],
    },
  ]

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-white mb-1">Review Your Application</h2>
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>Please verify all information before submitting.</p>
      </div>

      {sections.map(section => (
        <div key={section.title}>
          <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "rgba(255,255,255,0.3)" }}>{section.title}</p>
          <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.07)" }}>
            {section.rows.map((r, i) => (
              <div key={r.label} className="flex items-start justify-between gap-4 px-4 py-2.5"
                style={{ borderBottom: i < section.rows.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                <p className="text-xs shrink-0 w-32" style={{ color: "rgba(255,255,255,0.35)" }}>{r.label}</p>
                <p className="text-sm text-white text-right">{r.value}</p>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Documents summary */}
      <div>
        <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "rgba(255,255,255,0.3)" }}>
          Documents ({readyDocs.length} marked ready)
        </p>
        <div className="rounded-xl p-4 space-y-1" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
          {docReqs.map(req => {
            const ready = form.documents.find(d => d.key === req.key)?.ready
            return (
              <div key={req.key} className="flex items-center gap-2 text-xs">
                <div className="h-2 w-2 rounded-full shrink-0" style={{ background: ready ? "#38bdf8" : "rgba(255,255,255,0.15)" }} />
                <span style={{ color: ready ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.3)" }}>{req.label}</span>
                {req.required && !ready && <span style={{ color: "rgba(239,68,68,0.7)" }}>(required)</span>}
              </div>
            )
          })}
        </div>
      </div>

      {/* What happens next */}
      <div className="rounded-xl p-4" style={{ background: "rgba(212,175,55,0.06)", border: "1px solid rgba(212,175,55,0.15)" }}>
        <p className="text-sm font-semibold mb-2" style={{ color: "#D4AF37" }}>What happens after submission?</p>
        <ol className="space-y-1.5 text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
          <li>1. Our team reviews your application within <strong style={{ color: "rgba(255,255,255,0.75)" }}>5 business days</strong></li>
          <li>2. We assess your eligibility and match you to suitable scholarships & universities</li>
          <li>3. You receive personalised recommendations, eligibility result, and next steps by email</li>
          <li>4. If eligible: pre-admission offer, document checklist, and registration guidance</li>
          <li>5. If not eligible: alternative pathways, self-funded options, or language programs</li>
        </ol>
      </div>

      {/* Certification */}
      <button onClick={() => setCertified(!certified)}
        className="flex items-start gap-3 w-full text-left rounded-xl p-4 transition-all"
        style={certified
          ? { background: "rgba(56,189,248,0.1)", border: "2px solid rgba(56,189,248,0.4)" }
          : { background: "rgba(255,255,255,0.03)", border: "2px solid rgba(255,255,255,0.1)" }}>
        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md mt-0.5 transition-all"
          style={certified ? { background: "#38bdf8" } : { border: "1.5px solid rgba(255,255,255,0.25)" }}>
          {certified && <CheckCircle2 className="h-3.5 w-3.5" style={{ color: "#05091a" }} />}
        </div>
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>
          I certify that all information provided in this application is accurate and complete to the best of my knowledge.
        </p>
      </button>
    </div>
  )
}

// ── Success Screen ─────────────────────────────────────────────────────────────
function SuccessScreen({ degree }: { degree: string }) {
  const degreeLabel = DEGREE_OPTIONS.find(d => d.value === degree)?.label ?? "program"
  return (
    <div className="min-h-screen flex items-center justify-center relative" style={{ background: "#05091a" }}>
      <PageBackground />
      <div className="relative z-10 text-center max-w-md px-6">
        <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", bounce: 0.4 }}
          className="inline-flex h-20 w-20 items-center justify-center rounded-2xl mx-auto mb-6"
          style={{ background: "rgba(56,189,248,0.12)", border: "1px solid rgba(56,189,248,0.3)" }}>
          <CheckCircle2 className="h-10 w-10" style={{ color: "#38bdf8" }} />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h1 className="text-2xl font-black text-white mb-3">Application Submitted!</h1>
          <p className="text-sm mb-2" style={{ color: "rgba(255,255,255,0.55)" }}>
            Your <strong className="text-white">{degreeLabel}</strong> application has been successfully received by the International Education Processing Center. It is now under review. You will receive a response within <strong className="text-white">5 days</strong>.
          </p>
          <p className="text-sm mb-8" style={{ color: "rgba(255,255,255,0.4)" }}>
            You'll receive scholarship recommendations, university options, eligibility assessment, and next steps via email and WhatsApp.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/login" className="inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold"
              style={{ background: "#38bdf8", color: "#05091a" }}>
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

// ── Shared field ───────────────────────────────────────────────────────────────
function Field({ label, required, value, onChange, placeholder, type = "text" }: {
  label: string; required?: boolean; value: string; onChange: (v: string) => void; placeholder?: string; type?: string
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-white mb-1.5">
        {label}{required && <span style={{ color: "#38bdf8" }}> *</span>}
      </label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all"
        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "white" }} />
    </div>
  )
}
