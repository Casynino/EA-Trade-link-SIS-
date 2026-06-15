import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft, User, FileText, Clock, CheckCircle2, DollarSign,
  AlertCircle, MapPin, GraduationCap, Calendar, Hash, Mail,
  Phone, Globe, Building2, Download, Eye, ShieldCheck, Plane,
  MessageSquare,
} from "lucide-react"
import { AdminApplicationActions } from "./actions"

export const dynamic = "force-dynamic"

const STATUS_META: Record<string, { label: string; color: string; bg: string; border: string }> = {
  SUBMITTED:          { label: "Submitted",         color: "#60a5fa", bg: "rgba(96,165,250,0.1)",   border: "rgba(96,165,250,0.3)"   },
  INTERESTED:         { label: "Interested",         color: "#94a3b8", bg: "rgba(148,163,184,0.08)", border: "rgba(148,163,184,0.2)"  },
  APPLIED:            { label: "Applied",            color: "#60a5fa", bg: "rgba(96,165,250,0.1)",   border: "rgba(96,165,250,0.3)"   },
  UNDER_REVIEW:       { label: "Under Review",       color: "#fbbf24", bg: "rgba(251,191,36,0.1)",   border: "rgba(251,191,36,0.3)"   },
  DOCUMENTS_REQUIRED: { label: "Documents Required", color: "#fb923c", bg: "rgba(251,146,60,0.1)",   border: "rgba(251,146,60,0.3)"   },
  SHORTLISTED:        { label: "Shortlisted",        color: "#c084fc", bg: "rgba(192,132,252,0.1)",  border: "rgba(192,132,252,0.3)"  },
  MATCHED:            { label: "Matched",            color: "#c084fc", bg: "rgba(192,132,252,0.1)",  border: "rgba(192,132,252,0.3)"  },
  ACCEPTED:           { label: "Approved",           color: "#34d399", bg: "rgba(52,211,153,0.1)",   border: "rgba(52,211,153,0.3)"   },
  APPROVED:           { label: "Approved",           color: "#34d399", bg: "rgba(52,211,153,0.1)",   border: "rgba(52,211,153,0.3)"   },
  PAYMENT_PENDING:    { label: "Payment Required",   color: "#D4AF37", bg: "rgba(212,175,55,0.1)",   border: "rgba(212,175,55,0.3)"   },
  PAYMENT_COMPLETED:  { label: "Payment Confirmed",  color: "#34d399", bg: "rgba(52,211,153,0.1)",   border: "rgba(52,211,153,0.3)"   },
  PROCESSING:         { label: "Processing",         color: "#fbbf24", bg: "rgba(251,191,36,0.1)",   border: "rgba(251,191,36,0.3)"   },
  COMPLETED:          { label: "Completed",          color: "#34d399", bg: "rgba(52,211,153,0.1)",   border: "rgba(52,211,153,0.3)"   },
  REJECTED:           { label: "Rejected",           color: "#f87171", bg: "rgba(248,113,113,0.1)",  border: "rgba(248,113,113,0.3)"  },
  CANCELLED:          { label: "Cancelled",          color: "#94a3b8", bg: "rgba(148,163,184,0.08)", border: "rgba(148,163,184,0.2)"  },
}

const WORKFLOW_STEPS = [
  { key: "SUBMITTED",         label: "Submitted" },
  { key: "UNDER_REVIEW",      label: "Under Review" },
  { key: "ACCEPTED",          label: "Approved" },
  { key: "PAYMENT_PENDING",   label: "Payment Due" },
  { key: "PAYMENT_COMPLETED", label: "Paid" },
  { key: "PROCESSING",        label: "Processing" },
  { key: "COMPLETED",         label: "Completed" },
]
const STEP_ORDER = ["SUBMITTED","UNDER_REVIEW","DOCUMENTS_REQUIRED","SHORTLISTED","ACCEPTED","PAYMENT_PENDING","PAYMENT_COMPLETED","PROCESSING","COMPLETED"]
function getStepIndex(status: string) {
  const idx = STEP_ORDER.indexOf(status); return idx === -1 ? 0 : idx
}

// ── Normalised shape used for rendering ──────────────────────────────────────
interface NormalisedApp {
  id: string
  modelType: "application" | "visa" | "study" | "scholarship"
  title: string
  category: string
  status: string
  createdAt: Date
  slaBreached?: boolean
  feePaid?: boolean
  registrationFee?: number | null
  processingFee?: number | null
  adminNotes?: string | null
  admissionLetter?: string | null
  offerLetter?: string | null
  coverLetter?: string | null
  experience?: string | null
  gpa?: string | null
  degreeLevel?: string | null
  fieldOfStudy?: string | null
  submittedAt?: Date | null
  firstResponseAt?: Date | null
  resolvedAt?: Date | null
  // applicant
  userName: string
  userEmail: string
  userPhone?: string | null
  userNationality?: string | null
  userId: string
  // extra fields (key-value pairs shown in "Submitted Data")
  extraFields: { label: string; value: string }[]
  // documents (from Document[] model)
  documents: { id: string; name: string; type: string; url: string; createdAt: Date }[]
}

async function findApp(id: string): Promise<NormalisedApp | null> {
  // 1. Unified Application model
  const app = await db.application.findUnique({
    where: { id },
    include: { user: true, opportunity: true, documents: true },
  })
  if (app) {
    let dynFields: { label: string; value: string }[] = []
    try {
      const parsed = JSON.parse((app as any).dynamicFields ?? "{}")
      dynFields = Object.entries(parsed).map(([k, v]) => ({ label: k.replace(/([A-Z])/g, " $1").trim(), value: String(v) }))
    } catch {}
    return {
      id: app.id, modelType: "application",
      title: app.opportunity.title,
      category: app.opportunity.type.replace(/_/g, " "),
      status: app.status, createdAt: app.createdAt,
      slaBreached: app.slaBreached, feePaid: app.feePaid,
      registrationFee: app.registrationFee, processingFee: app.processingFee,
      adminNotes: app.adminNotes, admissionLetter: app.admissionLetter,
      offerLetter: app.offerLetter, coverLetter: app.coverLetter,
      experience: app.experience, gpa: app.gpa?.toString() ?? null,
      degreeLevel: app.degreeLevel, fieldOfStudy: app.fieldOfStudy,
      submittedAt: app.submittedAt, firstResponseAt: app.firstResponseAt, resolvedAt: app.resolvedAt,
      userName: app.user.name ?? "Unknown", userEmail: app.user.email,
      userPhone: app.user.phone, userNationality: app.user.nationality,
      userId: app.userId,
      extraFields: dynFields,
      documents: app.documents.map(d => ({
        id: d.id, name: d.fileName, type: d.documentType, url: d.fileUrl, createdAt: d.createdAt,
      })),
    }
  }

  // 2. VisaApplication model
  const visa = await db.visaApplication.findUnique({
    where: { id },
    include: { user: true },
  })
  if (visa) {
    return {
      id: visa.id, modelType: "visa",
      title: "China Business Visa Application",
      category: "Business Visa",
      status: visa.status, createdAt: visa.createdAt,
      slaBreached: visa.slaBreached, feePaid: visa.feePaid,
      registrationFee: null, processingFee: visa.processingFee,
      adminNotes: visa.adminNotes, admissionLetter: null, offerLetter: null,
      coverLetter: null, experience: null, gpa: null,
      degreeLevel: null, fieldOfStudy: null,
      submittedAt: visa.submittedAt, firstResponseAt: visa.firstResponseAt, resolvedAt: null,
      userName: visa.fullName, userEmail: visa.contactEmail,
      userPhone: visa.phone, userNationality: visa.nationality,
      userId: visa.userId,
      extraFields: [
        { label: "Passport Number",    value: visa.passportNumber },
        { label: "Nationality",        value: visa.nationality },
        { label: "Date of Birth",      value: visa.dateOfBirth ?? "—" },
        { label: "Company Name",       value: visa.companyName ?? "—" },
        { label: "Job Title",          value: visa.jobTitle ?? "—" },
        { label: "Company Reg No.",    value: visa.companyRegNumber ?? "—" },
        { label: "TIN Number",         value: visa.tinNumber ?? "—" },
        { label: "Purpose of Visit",   value: visa.purpose },
        { label: "Travel Dates",       value: visa.travelDates ?? "—" },
        { label: "Stay Duration",      value: visa.stayDuration ?? "—" },
        { label: "Auth Letter Needed", value: visa.requiresAuthLetter ? "Yes" : "No" },
      ].filter(f => f.value && f.value !== "—"),
      documents: [],
    }
  }

  // 3. StudyApplication model
  const study = await db.studyApplication.findUnique({
    where: { id },
    include: { user: true },
  })
  if (study) {
    return {
      id: study.id, modelType: "study",
      title: `${study.degreeLevel} — ${study.fieldOfStudy}`,
      category: "Study in China",
      status: study.status, createdAt: study.createdAt,
      slaBreached: study.slaBreached, feePaid: false,
      registrationFee: null, processingFee: null,
      adminNotes: study.adminNotes ?? null, admissionLetter: null, offerLetter: null,
      coverLetter: null, experience: null, gpa: study.gpa ?? null,
      degreeLevel: study.degreeLevel, fieldOfStudy: study.fieldOfStudy,
      submittedAt: study.submittedAt, firstResponseAt: study.firstResponseAt, resolvedAt: null,
      userName: study.fullName, userEmail: study.contactEmail,
      userPhone: study.phone, userNationality: study.nationality,
      userId: study.userId,
      extraFields: [
        { label: "Degree Level",          value: study.degreeLevel },
        { label: "Field of Study",        value: study.fieldOfStudy },
        { label: "Preferred Intake",      value: study.preferredIntake ?? "—" },
        { label: "Current Education",     value: study.currentEducation },
        { label: "GPA",                   value: study.gpa ?? "—" },
        { label: "English Proficiency",   value: study.englishProficiency ?? "—" },
        { label: "Chinese Proficiency",   value: study.chineseProficiency ?? "—" },
        { label: "Gender",                value: study.gender ?? "—" },
        { label: "Date of Birth",         value: study.dateOfBirth ?? "—" },
        { label: "Passport Number",       value: study.passportNumber ?? "—" },
      ].filter(f => f.value && f.value !== "—"),
      documents: [],
    }
  }

  // 4. ScholarshipApplication model
  const schol = await db.scholarshipApplication.findUnique({
    where: { id },
    include: { user: true, scholarship: true },
  })
  if (schol) {
    return {
      id: schol.id, modelType: "scholarship",
      title: schol.scholarship.title,
      category: `Scholarship — ${schol.scholarship.level}`,
      status: schol.status, createdAt: schol.createdAt,
      feePaid: false, slaBreached: false,
      adminNotes: schol.adminNotes ?? null, admissionLetter: null, offerLetter: null,
      coverLetter: null, experience: null, gpa: null,
      degreeLevel: schol.scholarship.level, fieldOfStudy: null,
      submittedAt: schol.createdAt, firstResponseAt: null, resolvedAt: null,
      userName: schol.user.name ?? "Unknown", userEmail: schol.user.email,
      userPhone: schol.user.phone, userNationality: schol.user.nationality,
      userId: schol.userId,
      extraFields: [
        { label: "Scholarship",  value: schol.scholarship.title },
        { label: "Level",        value: schol.scholarship.level },
        { label: "Country",      value: schol.scholarship.country },
        { label: "Applicant Notes", value: schol.notes ?? "None" },
      ],
      documents: [],
    }
  }

  return null
}

export default async function AdminApplicationCasePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await auth()
  if (!session?.user) redirect("/login")
  const admin = await db.user.findUnique({ where: { id: session.user.id } })
  if (!admin || !["ADMIN", "SUPER_ADMIN"].includes(admin.role)) redirect("/dashboard")

  const app = await findApp(id)
  if (!app) notFound()

  // Fetch messages for the thread
  let threadMessages: { id: string; content: string; isAdmin: boolean; senderName: string; createdAt: Date }[] = []
  if (app.modelType === "application") {
    const msgs = await db.message.findMany({
      where: { applicationId: id },
      include: { sender: { select: { name: true } } },
      orderBy: { createdAt: "asc" },
    })
    threadMessages = msgs.map((m) => ({
      id: m.id, content: m.content, isAdmin: m.isAdminMessage,
      senderName: m.sender?.name ?? "Unknown", createdAt: m.createdAt,
    }))
  } else if (app.modelType === "visa") {
    const msgs = await db.visaMessage.findMany({
      where: { visaApplicationId: id },
      orderBy: { createdAt: "asc" },
    })
    threadMessages = msgs.map((m) => ({
      id: m.id, content: m.content, isAdmin: m.isAdminMessage,
      senderName: m.isAdminMessage ? (admin.name ?? "Admin") : app.userName,
      createdAt: m.createdAt,
    }))
  } else if (app.modelType === "study") {
    const msgs = await db.studyMessage.findMany({
      where: { studyApplicationId: id },
      orderBy: { createdAt: "asc" },
    })
    threadMessages = msgs.map((m) => ({
      id: m.id, content: m.content, isAdmin: m.isAdminMessage,
      senderName: m.isAdminMessage ? (admin.name ?? "Admin") : app.userName,
      createdAt: m.createdAt,
    }))
  }

  const st = STATUS_META[app.status] ?? STATUS_META.SUBMITTED
  const currentStep = getStepIndex(app.status)
  const isRejected = app.status === "REJECTED"
  const isApproved = ["ACCEPTED", "PROCESSING", "COMPLETED"].includes(app.status)
  const needsPayment = isApproved && !app.feePaid && (app.registrationFee || app.processingFee)
  const totalFee = (app.registrationFee ?? 0) + (app.processingFee ?? 0)

  // Pass the normalised object to actions (it reads .id, .status, .adminNotes, .registrationFee, etc.)
  const actionsApp = {
    id: app.id,
    modelType: app.modelType,
    status: app.status,
    adminNotes: app.adminNotes,
    registrationFee: app.registrationFee,
    processingFee: app.processingFee,
    admissionLetter: app.admissionLetter,
    feePaid: app.feePaid,
  }

  return (
    <div className="ea-page space-y-5">
      <Link href="/admin/applications"
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-3.5 w-3.5" />Back to Application Inbox
      </Link>

      {/* Case header */}
      <div className="rounded-2xl p-6 space-y-4"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)" }}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full"
                style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)" }}>
                Case File
              </span>
              <span className="text-[10px] font-mono" style={{ color: "rgba(255,255,255,0.25)" }}>#{app.id}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)" }}>
                {app.category}
              </span>
            </div>
            <h1 className="text-xl font-black text-white leading-snug">{app.title}</h1>
            <p className="text-sm text-muted-foreground mt-1">{app.userName} · {app.userEmail}</p>
          </div>
          <div className="shrink-0 flex flex-col items-end gap-2">
            <span className="rounded-xl px-4 py-2 text-sm font-bold"
              style={{ background: st.bg, color: st.color, border: `1px solid ${st.border}` }}>
              {st.label}
            </span>
            {app.slaBreached && !isRejected && (
              <span className="flex items-center gap-1 text-xs text-red-400">
                <AlertCircle className="h-3.5 w-3.5" />Overdue
              </span>
            )}
          </div>
        </div>

        {/* Workflow progress */}
        {!isRejected && (
          <div className="pt-2">
            <div className="flex items-center gap-0">
              {WORKFLOW_STEPS.map((step, i) => {
                const stepIdx = STEP_ORDER.indexOf(step.key)
                const done   = currentStep > stepIdx
                const active = currentStep === stepIdx
                const isLast = i === WORKFLOW_STEPS.length - 1
                const lineColor = done ? "#34d399" : "rgba(255,255,255,0.08)"
                const dotColor  = done ? "#34d399" : active ? "#38bdf8" : "rgba(255,255,255,0.15)"
                const textColor = done ? "#34d399" : active ? "#38bdf8" : "rgba(255,255,255,0.3)"
                return (
                  <div key={step.key} className="flex items-center flex-1 min-w-0">
                    <div className="flex flex-col items-center gap-1 shrink-0">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 transition-all"
                        style={{ background: done ? "#34d399" : active ? "rgba(56,189,248,0.15)" : "rgba(255,255,255,0.04)", borderColor: dotColor }}>
                        {done
                          ? <CheckCircle2 className="h-4 w-4 text-[#05091a]" />
                          : <div className="h-2 w-2 rounded-full" style={{ background: dotColor }} />}
                      </div>
                      <p className="text-[10px] font-semibold text-center leading-tight" style={{ color: textColor }}>{step.label}</p>
                    </div>
                    {!isLast && <div className="flex-1 h-0.5 mx-1 mb-4 rounded-full" style={{ background: lineColor }} />}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {isRejected && (
          <div className="rounded-xl p-4 flex items-center gap-3"
            style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)" }}>
            <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-red-300">Application Rejected</p>
              <p className="text-xs text-red-400/70 mt-0.5">This case has been closed.</p>
            </div>
          </div>
        )}
      </div>

      {/* Two-column layout */}
      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">

          {/* Applicant info */}
          <Section title="Applicant Information" icon={User}>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <InfoRow icon={User}     label="Full Name"    value={app.userName} />
              <InfoRow icon={Mail}     label="Email"        value={app.userEmail} />
              <InfoRow icon={Phone}    label="Phone"        value={app.userPhone ?? "Not provided"} />
              <InfoRow icon={Globe}    label="Nationality"  value={app.userNationality ?? "Not provided"} />
              <InfoRow icon={Calendar} label="Date Applied" value={new Date(app.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })} />
              <InfoRow icon={Hash}     label="Category"     value={app.category} />
              {app.degreeLevel  && <InfoRow icon={GraduationCap} label="Degree Level"   value={app.degreeLevel} />}
              {app.fieldOfStudy && <InfoRow icon={GraduationCap} label="Field of Study" value={app.fieldOfStudy} />}
              {app.gpa          && <InfoRow icon={GraduationCap} label="GPA"            value={app.gpa} />}
            </div>
            {app.coverLetter && (
              <div className="mt-4 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Cover Letter / Motivation</p>
                <div className="rounded-xl p-4 text-sm leading-relaxed whitespace-pre-wrap"
                  style={{ background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  {app.coverLetter}
                </div>
              </div>
            )}
            {app.experience && (
              <div className="mt-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Experience / Purpose</p>
                <div className="rounded-xl p-4 text-sm leading-relaxed whitespace-pre-wrap"
                  style={{ background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  {app.experience}
                </div>
              </div>
            )}
          </Section>

          {/* Submitted Data */}
          {app.extraFields.length > 0 && (
            <Section title="Submitted Application Data" icon={FileText}>
              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                {app.extraFields.map(f => (
                  <InfoRow key={f.label} icon={FileText} label={f.label} value={f.value} />
                ))}
              </div>
            </Section>
          )}

          {/* Documents */}
          <Section title="Submitted Documents" icon={FileText}>
            {app.documents.length === 0 ? (
              <div className="rounded-xl p-6 text-center"
                style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.08)" }}>
                <FileText className="h-8 w-8 mx-auto mb-2" style={{ color: "rgba(255,255,255,0.15)" }} />
                <p className="text-sm text-muted-foreground">No documents uploaded yet.</p>
                <p className="text-xs text-muted-foreground mt-1">Use "Request Documents" to ask the applicant to upload files.</p>
              </div>
            ) : (
              <div className="grid gap-2">
                {app.documents.map((doc) => (
                  <div key={doc.id} className="flex items-center gap-3 rounded-xl p-3"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                      style={{ background: "rgba(56,189,248,0.1)" }}>
                      <FileText className="h-4 w-4 text-sky-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{doc.name}</p>
                      <p className="text-[11px] text-muted-foreground">{doc.type} · {new Date(doc.createdAt).toLocaleDateString("en-GB")}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {doc.url && (
                        <>
                          <a href={doc.url} target="_blank" rel="noreferrer"
                            className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold"
                            style={{ background: "rgba(56,189,248,0.1)", color: "#38bdf8", border: "1px solid rgba(56,189,248,0.2)" }}>
                            <Eye className="h-3 w-3" />View
                          </a>
                          <a href={doc.url} download
                            className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold"
                            style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.1)" }}>
                            <Download className="h-3 w-3" />Download
                          </a>
                        </>
                      )}
                      <div className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold"
                        style={{ background: "rgba(52,211,153,0.08)", color: "#34d399", border: "1px solid rgba(52,211,153,0.15)" }}>
                        <ShieldCheck className="h-3 w-3" />Received
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* Message Thread */}
          <Section title={`Messages${threadMessages.length > 0 ? ` (${threadMessages.length})` : ""}`} icon={MessageSquare}>
            {threadMessages.length === 0 ? (
              <div className="rounded-xl p-6 text-center"
                style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.08)" }}>
                <MessageSquare className="h-8 w-8 mx-auto mb-2" style={{ color: "rgba(255,255,255,0.15)" }} />
                <p className="text-sm text-muted-foreground">No messages yet.</p>
                <p className="text-xs text-muted-foreground mt-1">Use "Message Applicant" on the right to send a message.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {threadMessages.map((msg) => (
                  <div key={msg.id} className="rounded-xl px-4 py-3"
                    style={{
                      background: msg.isAdmin ? "rgba(96,165,250,0.07)" : "rgba(255,255,255,0.04)",
                      border: `1px solid ${msg.isAdmin ? "rgba(96,165,250,0.15)" : "rgba(255,255,255,0.07)"}`,
                    }}>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[10px] font-bold" style={{ color: msg.isAdmin ? "#60a5fa" : "rgba(255,255,255,0.4)" }}>
                        {msg.isAdmin ? `${msg.senderName} (Admin)` : `${msg.senderName} (Applicant)`}
                      </p>
                      <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.2)" }}>
                        {new Date(msg.createdAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}
                      </p>
                    </div>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "rgba(255,255,255,0.7)" }}>
                      {msg.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* Payment */}
          {(app.registrationFee || app.processingFee) && (
            <Section title="Payment Status" icon={DollarSign}>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {app.registrationFee && (
                  <div className="rounded-xl p-4" style={{ background: "rgba(212,175,55,0.06)", border: "1px solid rgba(212,175,55,0.15)" }}>
                    <p className="text-xs text-muted-foreground mb-1">Registration Fee</p>
                    <p className="text-xl font-black" style={{ color: "#D4AF37" }}>TZS {app.registrationFee.toLocaleString()}</p>
                  </div>
                )}
                {app.processingFee && (
                  <div className="rounded-xl p-4" style={{ background: "rgba(212,175,55,0.06)", border: "1px solid rgba(212,175,55,0.15)" }}>
                    <p className="text-xs text-muted-foreground mb-1">Processing Fee</p>
                    <p className="text-xl font-black" style={{ color: "#D4AF37" }}>TZS {app.processingFee.toLocaleString()}</p>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between rounded-xl p-4"
                style={{ background: app.feePaid ? "rgba(52,211,153,0.08)" : "rgba(251,191,36,0.08)", border: `1px solid ${app.feePaid ? "rgba(52,211,153,0.2)" : "rgba(251,191,36,0.2)"}` }}>
                <div className="flex items-center gap-2">
                  {app.feePaid ? <CheckCircle2 className="h-5 w-5 text-green-400" /> : <Clock className="h-5 w-5 text-yellow-400" />}
                  <div>
                    <p className="text-sm font-bold" style={{ color: app.feePaid ? "#34d399" : "#fbbf24" }}>
                      {app.feePaid ? "Payment Confirmed" : "Awaiting Payment"}
                    </p>
                    {totalFee > 0 && <p className="text-xs text-muted-foreground">Total: TZS {totalFee.toLocaleString()}</p>}
                  </div>
                </div>
              </div>
            </Section>
          )}

          {/* Timeline */}
          <Section title="Case Timeline" icon={Clock}>
            <div className="space-y-3">
              {[
                { label: "Application Submitted",  date: app.submittedAt ?? app.createdAt,  color: "#60a5fa" },
                { label: "First Response",          date: app.firstResponseAt,               color: "#fbbf24" },
                { label: "Resolved / Closed",       date: app.resolvedAt,                   color: "#34d399" },
              ].filter(t => t.date).map((t) => (
                <div key={t.label} className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full shrink-0" style={{ background: t.color }} />
                  <span className="text-sm text-muted-foreground">{t.label}:</span>
                  <span className="text-sm font-semibold">
                    {t.date ? new Date(t.date).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }) : "—"}
                  </span>
                </div>
              ))}
            </div>
          </Section>
        </div>

        {/* Right: admin panel */}
        <div className="space-y-4">
          <div className="rounded-2xl p-4 space-y-3"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Case Reference</p>
            <div className="space-y-2">
              <div>
                <p className="text-[10px] text-muted-foreground">Application ID</p>
                <p className="text-xs font-mono font-bold" style={{ color: "rgba(255,255,255,0.7)" }}>{app.id}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">Current Status</p>
                <span className="inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-bold mt-0.5"
                  style={{ background: st.bg, color: st.color, border: `1px solid ${st.border}` }}>
                  {st.label}
                </span>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">Submitted</p>
                <p className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.6)" }}>
                  {new Date(app.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">Assigned Admin</p>
                <p className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.6)" }}>{admin.name ?? "Unassigned"}</p>
              </div>
            </div>
          </div>

          <AdminApplicationActions application={actionsApp} adminId={admin.id} />
        </div>
      </div>
    </div>
  )
}

function Section({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
      <div className="flex items-center gap-2.5 px-5 py-4"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
        <Icon className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-sm font-bold">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

function InfoRow({ label, value, icon: Icon }: { label: string; value: string; icon: any }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">{label}</p>
      <p className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.8)" }}>{value}</p>
    </div>
  )
}
