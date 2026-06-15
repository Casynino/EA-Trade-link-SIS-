"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Plus, Trash2, Save } from "lucide-react"
import { getDefaultDocs, getDefaultFields, type RequiredDoc, type AppField } from "@/lib/application-engine"
import { FinancialModelBuilder, defaultFinancialModelForType, emptyFinancialModel, type FinancialModel } from "@/components/financial-model-builder"

const TYPES = [
  "SCHOLARSHIP", "JOB", "BUSINESS_VISA", "FACTORY_VISIT",
  "CANTON_FAIR", "TRADE_EXHIBITION", "CONFERENCE", "EXCHANGE",
]

const AUDIENCES = [
  { value: "STUDENT",    label: "Student" },
  { value: "BUSINESS",   label: "Business" },
  { value: "JOB_SEEKER", label: "Job Seeker" },
  { value: "ALL",        label: "Everyone" },
]

function parseJsonSafe<T>(v: unknown, fallback: T): T {
  if (typeof v !== "string") return fallback
  try { return JSON.parse(v) } catch { return fallback }
}

function fmt(d: unknown) {
  if (!d) return ""
  const dt = d instanceof Date ? d : new Date(d as string)
  return isNaN(dt.getTime()) ? "" : dt.toISOString().split("T")[0]
}

export function EditOpportunityForm({ opp }: { opp: Record<string, unknown> }) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [type, setType] = useState(String(opp.type ?? "SCHOLARSHIP"))
  const [audiences, setAudiences] = useState<string[]>(() => parseJsonSafe(opp.targetAudience, ["ALL"]))
  const [featured, setFeatured] = useState(Boolean(opp.isFeatured))
  const [active, setActive] = useState(Boolean(opp.isActive ?? true))
  const [docs, setDocs] = useState<RequiredDoc[]>(() =>
    parseJsonSafe(opp.requiredDocuments, getDefaultDocs(String(opp.type ?? "")))
  )
  const [fields, setFields] = useState<AppField[]>(() =>
    parseJsonSafe(opp.applicationFields, getDefaultFields(String(opp.type ?? "")))
  )
  const [customDocLabel, setCustomDocLabel] = useState("")
  const [financialModel, setFinancialModel] = useState<FinancialModel>(() => {
    const raw = opp.financialModel
    if (typeof raw === "string" && raw && raw !== "{}") {
      try { return JSON.parse(raw) } catch { /* fall through */ }
    }
    return defaultFinancialModelForType(String(opp.type ?? ""))
  })

  function changeType(t: string) {
    setType(t)
    setDocs(getDefaultDocs(t))
    setFields(getDefaultFields(t))
  }
  function toggleDocRequired(id: string) {
    setDocs((prev) => prev.map((d) => d.id === id ? { ...d, required: !d.required } : d))
  }
  function removeDoc(id: string) { setDocs((prev) => prev.filter((d) => d.id !== id)) }
  function addCustomDoc() {
    const label = customDocLabel.trim()
    if (!label) return
    setDocs((prev) => [...prev, { id: `custom_${Date.now()}`, label, required: true }])
    setCustomDocLabel("")
  }
  function toggleFieldRequired(id: string) {
    setFields((prev) => prev.map((f) => f.id === id ? { ...f, required: !f.required } : f))
  }
  function toggleAudience(v: string) {
    setAudiences((prev) => prev.includes(v) ? prev.filter((a) => a !== v) : [...prev, v])
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body: any = {
      type,
      title:          fd.get("title"),
      organization:   fd.get("organization"),
      location:       fd.get("location") || "China",
      description:    fd.get("description"),
      requirements:   fd.get("requirements") || null,
      benefits:       fd.get("benefits") || null,
      deadline:       fd.get("deadline") ? new Date(fd.get("deadline") as string).toISOString() : null,
      startDate:      fd.get("startDate") ? new Date(fd.get("startDate") as string).toISOString() : null,
      imageUrl:       fd.get("imageUrl") || null,
      targetAudience:    JSON.stringify(audiences),
      requiredDocuments: JSON.stringify(docs),
      applicationFields: JSON.stringify(fields),
      financialModel:    JSON.stringify(financialModel),
      isFeatured:     featured,
      isActive:       active,
      degreeLevel:    fd.get("degreeLevel") || null,
      fieldOfStudy:   fd.get("fieldOfStudy") || null,
      minGpa:         fd.get("minGpa") ? parseFloat(fd.get("minGpa") as string) : null,
      coverageType:   fd.get("coverageType") || null,
      tuitionCovered: fd.get("tuitionCovered") === "on",
      livingAllowance: fd.get("livingAllowance") === "on",
      flightTicket:   fd.get("flightTicket") === "on",
      slots:          fd.get("slots") ? parseInt(fd.get("slots") as string) : null,
      jobType:        fd.get("jobType") || null,
      salary:         fd.get("salary") || null,
      contractDuration: fd.get("contractDuration") || null,
      eventDates:     fd.get("eventDates") || null,
      venue:          fd.get("venue") || null,
      registrationFee: fd.get("registrationFee") || null,
      visitDuration:  fd.get("visitDuration") || null,
      groupSizeMax:   fd.get("groupSizeMax") ? parseInt(fd.get("groupSizeMax") as string) : null,
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/admin/opportunities/${opp.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error("Failed to update")
      toast({ title: "Opportunity updated!" })
      router.push("/admin/opportunities")
      router.refresh()
    } catch {
      toast({ title: "Error", description: "Failed to update opportunity", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const S = {
    card: {
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: "1rem",
      backdropFilter: "blur(8px)",
      padding: "1.25rem",
    } as React.CSSProperties,
    input: {
      background: "rgba(255,255,255,0.05)",
      border: "1px solid rgba(255,255,255,0.1)",
      color: "white",
      borderRadius: "0.75rem",
      padding: "0.5rem 0.75rem",
      width: "100%",
      fontSize: "0.875rem",
      outline: "none",
    } as React.CSSProperties,
    label: { fontSize: "0.75rem", color: "rgba(255,255,255,0.55)", fontWeight: 600, marginBottom: "0.375rem", display: "block" } as React.CSSProperties,
    section: { fontSize: "0.875rem", fontWeight: 700, color: "white", marginBottom: "0.75rem" } as React.CSSProperties,
  }

  const DField = ({ id, label, required, placeholder, defaultValue }: { id: string; label: string; required?: boolean; placeholder?: string; defaultValue?: string }) => (
    <div>
      <label htmlFor={id} style={S.label}>{label}{required && <span style={{ color: "#f87171" }}> *</span>}</label>
      <input id={id} name={id} required={required} placeholder={placeholder} defaultValue={defaultValue ?? String(opp[id] ?? "")} style={S.input} />
    </div>
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Type */}
      <div style={S.card}>
        <p style={S.section}>Opportunity Type</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {TYPES.map((t) => (
            <button
              key={t} type="button" onClick={() => changeType(t)}
              className="rounded-xl px-3 py-2 text-xs font-semibold transition-all"
              style={{
                background: type === t ? "rgba(212,175,55,0.15)" : "rgba(255,255,255,0.04)",
                border: type === t ? "1px solid rgba(212,175,55,0.4)" : "1px solid rgba(255,255,255,0.08)",
                color: type === t ? "#D4AF37" : "rgba(255,255,255,0.5)",
              }}
            >
              {t.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Core */}
      <div style={S.card} className="space-y-4">
        <p style={S.section}>Core Information</p>
        <DField id="title" label="Title" required />
        <div className="grid grid-cols-2 gap-3">
          <DField id="organization" label="Organization" required />
          <DField id="location" label="Location" placeholder="China" />
        </div>
        <div>
          <label htmlFor="description" style={S.label}>Description <span style={{ color: "#f87171" }}>*</span></label>
          <textarea id="description" name="description" rows={4} required
            defaultValue={String(opp.description ?? "")}
            style={{ ...S.input, resize: "none" }} />
        </div>
        <div>
          <label htmlFor="requirements" style={S.label}>Requirements</label>
          <textarea id="requirements" name="requirements" rows={2}
            defaultValue={String(opp.requirements ?? "")}
            style={{ ...S.input, resize: "none" }} />
        </div>
        <div>
          <label htmlFor="benefits" style={S.label}>Benefits / Package</label>
          <textarea id="benefits" name="benefits" rows={2}
            defaultValue={String(opp.benefits ?? "")}
            style={{ ...S.input, resize: "none" }} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="deadline" style={S.label}>Application Deadline</label>
            <input id="deadline" name="deadline" type="date" defaultValue={fmt(opp.deadline)} style={{ ...S.input, colorScheme: "dark" }} />
          </div>
          <div>
            <label htmlFor="startDate" style={S.label}>Start Date</label>
            <input id="startDate" name="startDate" type="date" defaultValue={fmt(opp.startDate)} style={{ ...S.input, colorScheme: "dark" }} />
          </div>
        </div>
        <DField id="imageUrl" label="Image URL (optional)" placeholder="https://…" />
      </div>

      {/* Scholarship extras */}
      {type === "SCHOLARSHIP" && (
        <div style={S.card} className="space-y-4">
          <p style={S.section}>Scholarship Details</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { id: "degreeLevel", label: "Degree Level", placeholder: "BACHELOR / MASTER / PHD" },
              { id: "fieldOfStudy", label: "Field of Study" },
              { id: "minGpa", label: "Min. GPA", placeholder: "3.0" },
              { id: "coverageType", label: "Coverage", placeholder: "Full / Partial" },
              { id: "slots", label: "Slots" },
            ].map(p => <DField key={p.id} {...p} />)}
          </div>
          <div className="flex gap-5">
            {([["tuitionCovered", "Tuition Covered"], ["livingAllowance", "Living Allowance"], ["flightTicket", "Flight Ticket"]] as const).map(([n, l]) => (
              <label key={n} className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: "rgba(255,255,255,0.6)" }}>
                <input type="checkbox" name={n} defaultChecked={Boolean(opp[n])}
                  style={{ accentColor: "#D4AF37" }} />
                {l}
              </label>
            ))}
          </div>
        </div>
      )}

      {type === "JOB" && (
        <div style={S.card} className="space-y-4">
          <p style={S.section}>Job Details</p>
          <div className="grid grid-cols-2 gap-3">
            <DField id="jobType" label="Job Type" placeholder="FACTORY / SKILLED / INTERNSHIP" />
            <DField id="salary" label="Salary" placeholder="¥6,000–8,000/month" />
            <DField id="contractDuration" label="Contract Duration" placeholder="2 years" />
            <DField id="slots" label="Positions Available" />
          </div>
        </div>
      )}

      {["CANTON_FAIR", "TRADE_EXHIBITION", "CONFERENCE"].includes(type) && (
        <div style={S.card} className="space-y-4">
          <p style={S.section}>Event Details</p>
          <div className="grid grid-cols-2 gap-3">
            <DField id="eventDates" label="Event Dates" placeholder="Oct 15–19, 2025" />
            <DField id="venue" label="Venue" />
            <DField id="registrationFee" label="Registration Fee" placeholder="Free / $50" />
          </div>
        </div>
      )}

      {type === "FACTORY_VISIT" && (
        <div style={S.card} className="space-y-4">
          <p style={S.section}>Factory Visit Details</p>
          <div className="grid grid-cols-2 gap-3">
            <DField id="visitDuration" label="Duration" placeholder="5 days" />
            <DField id="groupSizeMax" label="Max Group Size" placeholder="15" />
          </div>
        </div>
      )}

      {/* Financial Model */}
      <div style={S.card} className="space-y-4">
        <div>
          <p style={S.section}>Financial Model</p>
          <p style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.35)" }}>
            Define exactly what this opportunity covers and what applicants are responsible for.
          </p>
        </div>
        <FinancialModelBuilder value={financialModel} onChange={setFinancialModel} />
      </div>

      {/* Documents */}
      <div style={S.card} className="space-y-3">
        <div>
          <p style={S.section}>Required Documents</p>
          <p style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.35)" }}>Applicants see this checklist. Toggle required/optional.</p>
        </div>
        <div className="space-y-1.5">
          {docs.map((doc) => (
            <div key={doc.id} className="flex items-center gap-2 rounded-xl px-3 py-2"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <button type="button" onClick={() => toggleDocRequired(doc.id)}
                className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold transition-all"
                style={{
                  background: doc.required ? "rgba(251,191,36,0.12)" : "rgba(255,255,255,0.06)",
                  color: doc.required ? "#fbbf24" : "rgba(255,255,255,0.35)",
                  border: doc.required ? "1px solid rgba(251,191,36,0.25)" : "1px solid rgba(255,255,255,0.08)",
                }}>
                {doc.required ? "Required" : "Optional"}
              </button>
              <span className="flex-1 text-xs" style={{ color: "rgba(255,255,255,0.65)" }}>{doc.label}</span>
              <button type="button" onClick={() => removeDoc(doc.id)}
                className="transition-colors" style={{ color: "rgba(255,255,255,0.25)" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#f87171")}
                onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.25)")}>
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input value={customDocLabel} onChange={(e) => setCustomDocLabel(e.target.value)}
            placeholder="Add custom document…" style={{ ...S.input, flex: 1 }}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomDoc())} />
          <button type="button" onClick={addCustomDoc}
            className="flex items-center gap-1 rounded-xl px-3 py-1 text-xs font-medium transition-colors shrink-0"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }}>
            <Plus className="h-3 w-3" />Add
          </button>
        </div>
      </div>

      {/* Application Fields */}
      <div style={S.card} className="space-y-3">
        <div>
          <p style={S.section}>Application Fields</p>
          <p style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.35)" }}>Questions shown to applicants during the apply flow.</p>
        </div>
        {fields.length === 0 ? (
          <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.3)", fontStyle: "italic" }}>No custom fields. Only a cover letter will be collected.</p>
        ) : (
          <div className="space-y-1.5">
            {fields.map((field) => (
              <div key={field.id} className="flex items-center gap-2 rounded-xl px-3 py-2"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <button type="button" onClick={() => toggleFieldRequired(field.id)}
                  className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold transition-all"
                  style={{
                    background: field.required ? "rgba(96,165,250,0.12)" : "rgba(255,255,255,0.06)",
                    color: field.required ? "#60a5fa" : "rgba(255,255,255,0.35)",
                    border: field.required ? "1px solid rgba(96,165,250,0.25)" : "1px solid rgba(255,255,255,0.08)",
                  }}>
                  {field.required ? "Required" : "Optional"}
                </button>
                <span className="flex-1 text-xs" style={{ color: "rgba(255,255,255,0.65)" }}>{field.label}</span>
                <span className="text-[10px] rounded-lg px-2 py-0.5"
                  style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.35)" }}>
                  {field.type}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Audience & Visibility */}
      <div style={S.card} className="space-y-3">
        <p style={S.section}>Visibility & Access</p>
        <div>
          <p style={{ ...S.label, marginBottom: "0.5rem" }}>Target Audience</p>
          <div className="flex flex-wrap gap-2">
            {AUDIENCES.map((a) => (
              <button key={a.value} type="button" onClick={() => toggleAudience(a.value)}
                className="rounded-xl px-3 py-1 text-xs font-semibold transition-all"
                style={{
                  background: audiences.includes(a.value) ? "rgba(96,165,250,0.12)" : "rgba(255,255,255,0.04)",
                  border: audiences.includes(a.value) ? "1px solid rgba(96,165,250,0.3)" : "1px solid rgba(255,255,255,0.08)",
                  color: audiences.includes(a.value) ? "#60a5fa" : "rgba(255,255,255,0.4)",
                }}>
                {a.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-5">
          {[
            [featured, setFeatured, "#D4AF37", "rgba(212,175,55,0.12)", "Feature at top of feed"],
            [active, setActive, "#34d399", "rgba(52,211,153,0.12)", "Visible to users (Active)"],
          ].map(([val, setter, col, bg, label], i) => (
            <label key={i} className="flex items-center gap-2.5 text-sm cursor-pointer" style={{ color: "rgba(255,255,255,0.65)" }}>
              <span
                className="inline-flex h-5 w-9 items-center rounded-full transition-all cursor-pointer"
                style={{ background: val ? bg as string : "rgba(255,255,255,0.08)" }}
                onClick={() => (setter as React.Dispatch<React.SetStateAction<boolean>>)(!val as boolean)}
              >
                <span className="inline-block h-3.5 w-3.5 rounded-full transition-transform"
                  style={{
                    background: val ? col as string : "rgba(255,255,255,0.3)",
                    transform: val ? "translateX(20px)" : "translateX(2px)",
                  }} />
              </span>
              {label as string}
            </label>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-all hover:scale-[1.01] disabled:opacity-60"
        style={{ background: "linear-gradient(135deg, #D4AF37, #b8860b)", color: "#05091a" }}
      >
        {loading ? <><Loader2 className="h-4 w-4 animate-spin" />Saving…</> : <><Save className="h-4 w-4" />Save Changes</>}
      </button>
    </form>
  )
}
