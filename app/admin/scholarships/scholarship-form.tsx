"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Trash2, Loader2, ArrowRight, GripVertical } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import type { ScholarshipData, ScholarshipLevel, ScholarshipFundingType, TuitionConfig, AccommodationConfig, StipendConfig } from "@/types/scholarship"
import { FUNDING_TYPE_META } from "@/types/scholarship"

const LEVELS: { value: ScholarshipLevel; label: string }[] = [
  { value: "BACHELOR", label: "Bachelor" },
  { value: "MASTER",   label: "Master" },
  { value: "PHD",      label: "PhD" },
  { value: "LANGUAGE", label: "Language" },
  { value: "SHORT",    label: "Short Course" },
]

const SECTION = "rounded-2xl p-6 space-y-4"
const SECTION_STYLE = { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }
const INPUT = "w-full rounded-xl px-3 py-2.5 text-sm outline-none text-foreground bg-transparent"
const INPUT_STYLE = { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }
const LABEL = "block text-xs font-semibold mb-1.5 text-muted-foreground"

function SectionHeader({ n, title, sub }: { n: number; title: string; sub?: string }) {
  return (
    <div className="flex items-center gap-3 mb-5 pb-4 border-b border-border/30">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black"
        style={{ background: "rgba(56,189,248,0.12)", color: "#38bdf8" }}>{n}</div>
      <div>
        <p className="text-sm font-bold">{title}</p>
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      </div>
    </div>
  )
}

function DynamicList({ label, items, onChange, placeholder }: {
  label: string; items: string[]; onChange: (v: string[]) => void; placeholder?: string
}) {
  return (
    <div>
      <label className={LABEL}>{label}</label>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <input value={item} placeholder={placeholder}
              onChange={e => { const n = [...items]; n[i] = e.target.value; onChange(n) }}
              className={INPUT} style={INPUT_STYLE} />
            <button type="button" onClick={() => onChange(items.filter((_, j) => j !== i))}
              className="shrink-0 rounded-lg p-2 text-red-400 hover:bg-red-400/10 transition-colors">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        <button type="button" onClick={() => onChange([...items, ""])}
          className="flex items-center gap-1.5 text-xs font-semibold transition-colors hover:text-foreground"
          style={{ color: "#38bdf8" }}>
          <Plus className="h-3.5 w-3.5" /> Add {label.replace(/s$/, "")}
        </button>
      </div>
    </div>
  )
}

export function ScholarshipForm({
  mode,
  initialData,
}: {
  mode: "create" | "edit"
  initialData?: Partial<ScholarshipData> & { dbId?: string }
}) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  // Basic
  const [title, setTitle] = useState(initialData?.title ?? "")
  const [level, setLevel] = useState<ScholarshipLevel>(initialData?.level ?? "BACHELOR")
  const [city, setCity] = useState(initialData?.city ?? "")
  const [intake, setIntake] = useState(initialData?.intake ?? "September 2026")
  const [duration, setDuration] = useState(initialData?.duration ?? "4 Years")
  const [language, setLanguage] = useState(initialData?.language ?? "English")
  const [ageRange, setAgeRange] = useState(initialData?.ageRange ?? "18–25")
  const [overview, setOverview] = useState(initialData?.overview ?? "")
  const [slots, setSlots] = useState<string>(initialData?.slots ? String(initialData.slots) : "")
  const [isFeatured, setIsFeatured] = useState(initialData?.isFeatured ?? false)
  const [isActive, setIsActive] = useState(true)
  const [sortOrder, setSortOrder] = useState<string>(String(initialData?.sortOrder ?? 0))

  // Dynamic lists
  const [majors, setMajors] = useState<string[]>(initialData?.majors ?? [""])
  const [documents, setDocuments] = useState<string[]>(initialData?.requirements?.documents ?? [""])
  const [eligibility, setEligibility] = useState<string[]>(initialData?.requirements?.eligibility ?? [""])
  const [extraInfo, setExtraInfo] = useState<string[]>(initialData?.requirements?.extraInfo ?? [])
  const [highlights, setHighlights] = useState<string[]>(initialData?.applicationHighlights ?? [""])
  const [steps, setSteps] = useState<string[]>(initialData?.admissionProcess ?? [""])
  const [tags, setTags] = useState<string[]>(initialData?.tags ?? [""])

  // Financials — detect old flat format vs new rich format
  const rawFin = initialData?.financials ?? {}
  const isRich = typeof rawFin.tuition === "object" && rawFin.tuition !== null
  const richTuition    = isRich ? rawFin.tuition    as TuitionConfig     : undefined
  const richAccom      = isRich ? rawFin.accommodation as AccommodationConfig : undefined
  const richStipend    = isRich ? rawFin.stipend    as StipendConfig     : undefined
  const richAdd        = isRich ? (rawFin as Record<string,unknown>).additionalSupport as Record<string,unknown> : undefined
  const richPayments   = isRich ? (rawFin as Record<string,unknown>).payments         as Record<string,unknown> : undefined

  const [schType,       setSchType]       = useState<ScholarshipFundingType>((rawFin as Record<string,unknown>).scholarshipType as ScholarshipFundingType ?? "FULLY_FUNDED")
  // Tuition
  const [tuitionCovered,   setTuitionCovered]   = useState(richTuition?.covered ?? !!rawFin.tuition)
  const [tuitionFullCost,  setTuitionFullCost]  = useState(richTuition?.fullCost  ?? (isRich ? "" : String(rawFin.tuition ?? "")))
  const [tuitionDiscounted,setTuitionDiscounted]= useState(richTuition?.discountedCost ?? "")
  const [tuitionPct,       setTuitionPct]       = useState(richTuition?.percentageCovered ? String(richTuition.percentageCovered) : "")
  // Accommodation
  type AccomCov = "FULL" | "PARTIAL" | "NOT_COVERED" | "NA"
  const [accomCoverage, setAccomCoverage] = useState<AccomCov>(
    richAccom ? (richAccom.enabled ? richAccom.coverage : "NA") : "NA"
  )
  const [accomAmount,   setAccomAmount]   = useState(richAccom?.amount ?? (isRich ? "" : String(rawFin.accommodation ?? "")))
  // Stipend
  const [stipendEnabled, setStipendEnabled] = useState(richStipend?.enabled ?? !!rawFin.stipend)
  const [stipendAmount,  setStipendAmount]  = useState(richStipend?.monthlyAmount ?? (isRich ? "" : String(rawFin.stipend ?? "")))
  // Additional support
  const [flightTicket,   setFlightTicket]   = useState(!!richAdd?.flightTicket)
  const [insurance,      setInsurance]      = useState(!!richAdd?.insurance)
  const [otherBenefits,  setOtherBenefits]  = useState(String(richAdd?.otherBenefits ?? ""))
  // Payments
  const [paymentsEnabled, setPaymentsEnabled] = useState(!!richPayments?.enabled)
  const [regFee,          setRegFee]          = useState(String(richPayments?.registrationFee ?? rawFin.registrationFee ?? ""))
  const [appFee,          setAppFee]          = useState(String(richPayments?.applicationFee ?? ""))
  const [seatDeposit,     setSeatDeposit]     = useState(String(richPayments?.seatDeposit ?? rawFin.deposit ?? ""))
  const [processingFee,   setProcessingFee]   = useState(String(richPayments?.processingFee ?? ""))
  const [financialNotes,  setFinancialNotes]  = useState<string[]>(rawFin.notes ?? [])

  function clean(arr: string[]) { return arr.filter(s => s.trim()) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !city.trim() || !overview.trim()) {
      toast({ title: "Missing fields", description: "Title, city, and overview are required.", variant: "destructive" })
      return
    }

    const payload = {
      id: initialData?.id,
      title: title.trim(),
      level,
      country: "China",
      city: city.trim(),
      intake,
      duration,
      language,
      ageRange,
      overview: overview.trim(),
      majors: clean(majors),
      financials: {
        scholarshipType: schType,
        tuition: {
          covered: tuitionCovered,
          ...(tuitionFullCost   && { fullCost: tuitionFullCost }),
          ...(tuitionDiscounted && { discountedCost: tuitionDiscounted }),
          ...(tuitionPct        && { percentageCovered: parseInt(tuitionPct) }),
        },
        accommodation: {
          enabled: accomCoverage !== "NA",
          coverage: accomCoverage === "NA" ? "NOT_COVERED" : accomCoverage,
          ...(accomAmount && { amount: accomAmount }),
        },
        stipend: {
          enabled: stipendEnabled,
          ...(stipendAmount && { monthlyAmount: stipendAmount }),
        },
        additionalSupport: {
          flightTicket,
          insurance,
          ...(otherBenefits && { otherBenefits }),
        },
        payments: {
          enabled: paymentsEnabled,
          ...(regFee      && { registrationFee: regFee }),
          ...(appFee      && { applicationFee: appFee }),
          ...(seatDeposit && { seatDeposit }),
          ...(processingFee && { processingFee }),
        },
        notes: clean(financialNotes),
      },
      requirements: {
        documents: clean(documents),
        eligibility: clean(eligibility),
        extraInfo: clean(extraInfo),
      },
      applicationHighlights: clean(highlights),
      admissionProcess: clean(steps),
      tags: clean(tags),
      slots: slots ? parseInt(slots) : null,
      isFeatured,
      isActive,
      sortOrder: parseInt(sortOrder) || 0,
    }

    setLoading(true)
    try {
      const res = await fetch(
        mode === "edit" && initialData?.dbId
          ? `/api/scholarships/${initialData.dbId}`
          : "/api/scholarships",
        {
          method: mode === "edit" ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      )
      if (!res.ok) throw new Error(await res.text())
      toast({ title: mode === "edit" ? "Scholarship updated!" : "Scholarship created!", description: "Changes are live." })
      router.push("/admin/scholarships")
      router.refresh()
    } catch (err) {
      toast({ title: "Error", description: String(err), variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* ── 1. Basic Info ── */}
      <div className={SECTION} style={SECTION_STYLE}>
        <SectionHeader n={1} title="Basic Information" sub="Core details shown on every card and detail page" />
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className={LABEL}>Title *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} required
              placeholder="e.g. Bachelor Scholarship – Hangzhou"
              className={INPUT} style={INPUT_STYLE} />
          </div>
          <div>
            <label className={LABEL}>Degree Level *</label>
            <select value={level} onChange={e => setLevel(e.target.value as ScholarshipLevel)}
              className={INPUT} style={INPUT_STYLE}>
              {LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
          </div>
          <div>
            <label className={LABEL}>City *</label>
            <input value={city} onChange={e => setCity(e.target.value)} required
              placeholder="e.g. Hangzhou"
              className={INPUT} style={INPUT_STYLE} />
          </div>
          <div>
            <label className={LABEL}>Intake</label>
            <input value={intake} onChange={e => setIntake(e.target.value)}
              placeholder="September 2026"
              className={INPUT} style={INPUT_STYLE} />
          </div>
          <div>
            <label className={LABEL}>Duration</label>
            <input value={duration} onChange={e => setDuration(e.target.value)}
              placeholder="4 Years"
              className={INPUT} style={INPUT_STYLE} />
          </div>
          <div>
            <label className={LABEL}>Language of Instruction</label>
            <input value={language} onChange={e => setLanguage(e.target.value)}
              placeholder="English"
              className={INPUT} style={INPUT_STYLE} />
          </div>
          <div>
            <label className={LABEL}>Age Range</label>
            <input value={ageRange} onChange={e => setAgeRange(e.target.value)}
              placeholder="18–25"
              className={INPUT} style={INPUT_STYLE} />
          </div>
          <div>
            <label className={LABEL}>Available Slots</label>
            <input type="number" value={slots} onChange={e => setSlots(e.target.value)}
              placeholder="Leave blank for unlimited"
              className={INPUT} style={INPUT_STYLE} />
          </div>
          <div>
            <label className={LABEL}>Sort Order (lower = first)</label>
            <input type="number" value={sortOrder} onChange={e => setSortOrder(e.target.value)}
              placeholder="0"
              className={INPUT} style={INPUT_STYLE} />
          </div>
          <div className="sm:col-span-2">
            <label className={LABEL}>Overview / Description *</label>
            <textarea value={overview} onChange={e => setOverview(e.target.value)} required rows={4}
              placeholder="2–3 sentences describing the program…"
              className={INPUT + " resize-none"} style={INPUT_STYLE} />
          </div>
        </div>

        {/* Publish controls */}
        <div className="flex items-center gap-6 pt-2">
          <label className="flex items-center gap-2.5 cursor-pointer">
            <div onClick={() => setIsActive(!isActive)}
              className="relative h-5 w-9 rounded-full transition-colors cursor-pointer"
              style={{ background: isActive ? "#38bdf8" : "rgba(255,255,255,0.1)" }}>
              <div className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform"
                style={{ transform: isActive ? "translateX(16px)" : "translateX(2px)" }} />
            </div>
            <span className="text-sm font-medium">{isActive ? "Published (Live)" : "Draft (Hidden)"}</span>
          </label>
          <label className="flex items-center gap-2.5 cursor-pointer">
            <div onClick={() => setIsFeatured(!isFeatured)}
              className="relative h-5 w-9 rounded-full transition-colors cursor-pointer"
              style={{ background: isFeatured ? "#D4AF37" : "rgba(255,255,255,0.1)" }}>
              <div className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform"
                style={{ transform: isFeatured ? "translateX(16px)" : "translateX(2px)" }} />
            </div>
            <span className="text-sm font-medium">{isFeatured ? "⭐ Featured" : "Not Featured"}</span>
          </label>
        </div>
      </div>

      {/* ── 2. Majors ── */}
      <div className={SECTION} style={SECTION_STYLE}>
        <SectionHeader n={2} title="Available Majors" sub="These display as chips on the detail page" />
        <DynamicList label="Majors" items={majors} onChange={setMajors} placeholder="e.g. Computer Science" />
      </div>

      {/* ── 3. Financial Model ── */}
      <div className={SECTION} style={SECTION_STYLE}>
        <SectionHeader n={3} title="Financial Model" sub="Define exactly what this scholarship covers" />

        {/* Scholarship Type */}
        <div>
          <label className={LABEL}>Scholarship Type</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {(Object.entries(FUNDING_TYPE_META) as [ScholarshipFundingType, typeof FUNDING_TYPE_META[ScholarshipFundingType]][]).map(([key, meta]) => (
              <button
                key={key} type="button"
                onClick={() => setSchType(key)}
                className="rounded-xl px-3 py-2.5 text-left transition-all"
                style={{
                  background:  schType === key ? meta.bg    : "rgba(255,255,255,0.03)",
                  border:      schType === key ? `1px solid ${meta.border}` : "1px solid rgba(255,255,255,0.07)",
                  color:       schType === key ? meta.color : "rgba(255,255,255,0.4)",
                }}
              >
                <p className="text-xs font-bold">{meta.label}</p>
                <p className="text-[10px] mt-0.5 opacity-70">{meta.desc}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-white/[0.06] pt-4 space-y-4">

          {/* Tuition */}
          <div className="rounded-xl p-4 space-y-3" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-white/70">Tuition</p>
              <label className="flex items-center gap-2 cursor-pointer">
                <div onClick={() => setTuitionCovered(!tuitionCovered)}
                  className="relative h-5 w-9 rounded-full transition-colors cursor-pointer"
                  style={{ background: tuitionCovered ? "#34d399" : "rgba(255,255,255,0.1)" }}>
                  <div className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform"
                    style={{ transform: tuitionCovered ? "translateX(16px)" : "translateX(2px)" }} />
                </div>
                <span className="text-xs" style={{ color: tuitionCovered ? "#34d399" : "rgba(255,255,255,0.4)" }}>
                  {tuitionCovered ? "Covered by scholarship" : "Not covered"}
                </span>
              </label>
            </div>
            <div className="grid sm:grid-cols-3 gap-3">
              <div>
                <label className={LABEL}>Full Cost</label>
                <input value={tuitionFullCost} onChange={e => setTuitionFullCost(e.target.value)}
                  placeholder="e.g. 7,500 RMB/year" className={INPUT} style={INPUT_STYLE} />
              </div>
              <div>
                <label className={LABEL}>Amount Covered</label>
                <input value={tuitionDiscounted} onChange={e => setTuitionDiscounted(e.target.value)}
                  placeholder="e.g. 5,000 RMB/year" className={INPUT} style={INPUT_STYLE} />
              </div>
              <div>
                <label className={LABEL}>% Covered</label>
                <input type="number" min="0" max="100"
                  value={tuitionPct} onChange={e => setTuitionPct(e.target.value)}
                  placeholder="e.g. 100" className={INPUT} style={INPUT_STYLE} />
              </div>
            </div>
          </div>

          {/* Accommodation */}
          <div className="rounded-xl p-4 space-y-3" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-xs font-bold text-white/70">Accommodation</p>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className={LABEL}>Coverage</label>
                <select value={accomCoverage} onChange={e => setAccomCoverage(e.target.value as AccomCov)}
                  className={INPUT} style={INPUT_STYLE}>
                  <option value="NA">Not Applicable</option>
                  <option value="FULL">Fully Covered</option>
                  <option value="PARTIAL">Partially Covered</option>
                  <option value="NOT_COVERED">Not Covered</option>
                </select>
              </div>
              <div>
                <label className={LABEL}>Amount / Year (if applicable)</label>
                <input value={accomAmount} onChange={e => setAccomAmount(e.target.value)}
                  placeholder="e.g. 3,000–5,000 RMB/year" className={INPUT} style={INPUT_STYLE} />
              </div>
            </div>
          </div>

          {/* Stipend */}
          <div className="rounded-xl p-4 space-y-3" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-white/70">Monthly Stipend</p>
              <label className="flex items-center gap-2 cursor-pointer">
                <div onClick={() => setStipendEnabled(!stipendEnabled)}
                  className="relative h-5 w-9 rounded-full transition-colors cursor-pointer"
                  style={{ background: stipendEnabled ? "#D4AF37" : "rgba(255,255,255,0.1)" }}>
                  <div className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform"
                    style={{ transform: stipendEnabled ? "translateX(16px)" : "translateX(2px)" }} />
                </div>
                <span className="text-xs" style={{ color: stipendEnabled ? "#D4AF37" : "rgba(255,255,255,0.4)" }}>
                  {stipendEnabled ? "Stipend included" : "No stipend"}
                </span>
              </label>
            </div>
            {stipendEnabled && (
              <div>
                <label className={LABEL}>Monthly Amount</label>
                <input value={stipendAmount} onChange={e => setStipendAmount(e.target.value)}
                  placeholder="e.g. 2,500 RMB/month" className={INPUT} style={INPUT_STYLE} />
              </div>
            )}
          </div>

          {/* Additional Support */}
          <div className="rounded-xl p-4 space-y-3" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-xs font-bold text-white/70">Additional Support</p>
            <div className="flex flex-wrap gap-4">
              {([
                [flightTicket, setFlightTicket, "#a78bfa", "Flight Ticket Included"],
                [insurance,    setInsurance,    "#34d399", "Health Insurance Covered"],
              ] as [boolean, React.Dispatch<React.SetStateAction<boolean>>, string, string][]).map(([val, setter, col, lbl]) => (
                <label key={lbl} className="flex items-center gap-2.5 cursor-pointer">
                  <div onClick={() => setter(!val)}
                    className="relative h-5 w-9 rounded-full transition-colors cursor-pointer"
                    style={{ background: val ? col : "rgba(255,255,255,0.1)" }}>
                    <div className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform"
                      style={{ transform: val ? "translateX(16px)" : "translateX(2px)" }} />
                  </div>
                  <span className="text-xs font-medium" style={{ color: val ? col : "rgba(255,255,255,0.5)" }}>{lbl}</span>
                </label>
              ))}
            </div>
            <div>
              <label className={LABEL}>Other Benefits (optional)</label>
              <input value={otherBenefits} onChange={e => setOtherBenefits(e.target.value)}
                placeholder="e.g. Airport pickup, orientation programme, library access"
                className={INPUT} style={INPUT_STYLE} />
            </div>
          </div>

          {/* Payments */}
          <div className="rounded-xl p-4 space-y-3" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-white/70">Payment Requirements</p>
                <p className="text-[10px] text-white/35">Enable only if this scholarship requires any fees from the student</p>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <div onClick={() => setPaymentsEnabled(!paymentsEnabled)}
                  className="relative h-5 w-9 rounded-full transition-colors cursor-pointer"
                  style={{ background: paymentsEnabled ? "#fb923c" : "rgba(255,255,255,0.1)" }}>
                  <div className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform"
                    style={{ transform: paymentsEnabled ? "translateX(16px)" : "translateX(2px)" }} />
                </div>
                <span className="text-xs" style={{ color: paymentsEnabled ? "#fb923c" : "rgba(255,255,255,0.4)" }}>
                  {paymentsEnabled ? "Has fees" : "No fees"}
                </span>
              </label>
            </div>
            {paymentsEnabled && (
              <div className="grid sm:grid-cols-2 gap-3 pt-1">
                {([
                  [regFee,        setRegFee,        "Registration Fee",   "e.g. 6,600 RMB"],
                  [appFee,        setAppFee,        "Application Fee",    "e.g. 500 RMB"],
                  [seatDeposit,   setSeatDeposit,   "Seat Deposit",       "e.g. 1,000 RMB (refundable)"],
                  [processingFee, setProcessingFee, "Processing Fee",     "e.g. 800 RMB"],
                ] as [string, React.Dispatch<React.SetStateAction<string>>, string, string][]).map(([val, setter, lbl, ph]) => (
                  <div key={lbl}>
                    <label className={LABEL}>{lbl}</label>
                    <input value={val} onChange={e => setter(e.target.value)}
                      placeholder={ph} className={INPUT} style={INPUT_STYLE} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DynamicList label="Financial Notes" items={financialNotes} onChange={setFinancialNotes}
          placeholder="e.g. Stipend subject to academic performance each semester" />
      </div>

      {/* ── 4. Requirements ── */}
      <div className={SECTION} style={SECTION_STYLE}>
        <SectionHeader n={4} title="Requirements & Documents" sub="Shown as checklist on the detail page" />
        <DynamicList label="Required Documents" items={documents} onChange={setDocuments} placeholder="e.g. Valid passport" />
        <DynamicList label="Eligibility Criteria" items={eligibility} onChange={setEligibility} placeholder="e.g. Age 18–25" />
        <DynamicList label="Extra Notes (optional)" items={extraInfo} onChange={setExtraInfo} placeholder="e.g. Interview required for shortlisted candidates" />
      </div>

      {/* ── 5. Highlights ── */}
      <div className={SECTION} style={SECTION_STYLE}>
        <SectionHeader n={5} title="Application Highlights" sub="Key selling points shown in overview section" />
        <DynamicList label="Highlights" items={highlights} onChange={setHighlights} placeholder="e.g. No CSCA required" />
      </div>

      {/* ── 6. Admission Process ── */}
      <div className={SECTION} style={SECTION_STYLE}>
        <SectionHeader n={6} title="Admission Process" sub="Shown as timeline on detail page — ordered steps" />
        <DynamicList label="Steps" items={steps} onChange={setSteps} placeholder="e.g. Submit application with documents" />
      </div>

      {/* ── 7. Tags ── */}
      <div className={SECTION} style={SECTION_STYLE}>
        <SectionHeader n={7} title="Tags" sub="Used for search and filtering (lowercase, no spaces)" />
        <DynamicList label="Tags" items={tags} onChange={setTags} placeholder="e.g. fully-funded" />
      </div>

      {/* Submit */}
      <div className="flex items-center gap-3 pb-8">
        <button type="submit" disabled={loading}
          className="flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-black transition-all disabled:opacity-50 hover:scale-105"
          style={{ background: "#38bdf8", color: "#05091a" }}>
          {loading
            ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
            : <>{mode === "edit" ? "Save Changes" : "Publish Scholarship"} <ArrowRight className="h-4 w-4" /></>
          }
        </button>
        <button type="button" onClick={() => router.back()}
          className="rounded-xl px-4 py-3 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
          Cancel
        </button>
      </div>
    </form>
  )
}
