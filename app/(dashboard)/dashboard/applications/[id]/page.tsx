import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft, CheckCircle2, Clock, AlertCircle, FileText, XCircle, Loader2,
  ExternalLink, Edit3, ShieldCheck, CreditCard, Download, BadgeCheck,
  MessageSquare, Globe2, Phone, Mail, Building2, Plane, GraduationCap,
  User2, Hash, CalendarDays, MapPin,
} from "lucide-react"
import { MessageThread } from "./message-thread"

export const dynamic = "force-dynamic"

const STATUS_META: Record<string, { label: string; color: string; bg: string; border: string; icon: any; message: string }> = {
  SUBMITTED:          { label: "Submitted",          color: "#60a5fa", bg: "rgba(96,165,250,0.08)",   border: "rgba(96,165,250,0.25)",   icon: Clock,        message: "Your application has been received and is queued for review by our team." },
  UNDER_REVIEW:       { label: "Under Review",        color: "#fbbf24", bg: "rgba(251,191,36,0.08)",   border: "rgba(251,191,36,0.25)",   icon: Loader2,      message: "Our team is actively reviewing your application. We will be in touch shortly." },
  DOCUMENTS_REQUIRED: { label: "Documents Required",  color: "#fb923c", bg: "rgba(251,146,60,0.08)",   border: "rgba(251,146,60,0.25)",   icon: FileText,     message: "Additional documents have been requested. Please contact our team immediately." },
  SHORTLISTED:        { label: "Shortlisted",         color: "#c084fc", bg: "rgba(192,132,252,0.08)",  border: "rgba(192,132,252,0.25)",  icon: CheckCircle2, message: "Congratulations — you have been shortlisted! Our team will contact you shortly." },
  ACCEPTED:           { label: "Approved",            color: "#34d399", bg: "rgba(52,211,153,0.08)",   border: "rgba(52,211,153,0.25)",   icon: CheckCircle2, message: "Congratulations — your application has been approved! Our team will contact you with next steps." },
  APPROVED:           { label: "Approved",            color: "#34d399", bg: "rgba(52,211,153,0.08)",   border: "rgba(52,211,153,0.25)",   icon: CheckCircle2, message: "Congratulations — your application has been approved! Our team will contact you with next steps." },
  PAYMENT_PENDING:    { label: "Payment Required",    color: "#D4AF37", bg: "rgba(212,175,55,0.08)",   border: "rgba(212,175,55,0.25)",   icon: CreditCard,   message: "To secure your placement and begin official processing, please complete the required payment. Contact our team via WhatsApp or M-Pesa to proceed." },
  PAYMENT_COMPLETED:  { label: "Payment Confirmed",   color: "#34d399", bg: "rgba(52,211,153,0.08)",   border: "rgba(52,211,153,0.25)",   icon: CheckCircle2, message: "Your payment has been confirmed. Your application is now being moved to final processing." },
  PROCESSING:         { label: "Processing",          color: "#a78bfa", bg: "rgba(167,139,250,0.08)",  border: "rgba(167,139,250,0.25)",  icon: Loader2,      message: "Your application is now in final processing. This typically takes 3–5 business days." },
  COMPLETED:          { label: "Completed",           color: "#34d399", bg: "rgba(52,211,153,0.08)",   border: "rgba(52,211,153,0.25)",   icon: CheckCircle2, message: "Your application has been completed successfully. Thank you for choosing EA Trade Link." },
  REJECTED:           { label: "Unsuccessful",        color: "#f87171", bg: "rgba(248,113,113,0.08)",  border: "rgba(248,113,113,0.25)",  icon: XCircle,      message: "Your application was not successful at this stage. Please contact us for feedback and next steps." },
  CANCELLED:          { label: "Cancelled",           color: "#9ca3af", bg: "rgba(156,163,175,0.08)",  border: "rgba(156,163,175,0.25)",  icon: XCircle,      message: "This application has been cancelled. Contact us if you believe this is in error." },
  INTERESTED:         { label: "Interested",          color: "#60a5fa", bg: "rgba(96,165,250,0.08)",   border: "rgba(96,165,250,0.25)",   icon: Clock,        message: "Your interest has been registered. Our team will reach out to guide you through the next steps." },
  MATCHED:            { label: "Matched",             color: "#c084fc", bg: "rgba(192,132,252,0.08)",  border: "rgba(192,132,252,0.25)",  icon: CheckCircle2, message: "You have been matched to a program. Our team will contact you with further details." },
}

function fmt(d?: Date | string | null) {
  if (!d) return null
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
}

interface NormApp {
  id: string
  modelType: "application" | "visa" | "study" | "scholarship"
  title: string
  subtitle: string
  status: string
  createdAt: Date
  submittedAt?: Date | null
  firstResponseAt?: Date | null
  slaBreached: boolean
  feePaid?: boolean
  registrationFee?: number | null
  processingFee?: number | null
  adminNotes?: string | null
  admissionLetter?: string | null
  coverLetter?: string | null
  extraFields: { label: string; value: string }[]
  documents: { id: string; name: string; url: string; type: string }[]
  messages: { id: string; content: string; isAdmin: boolean; createdAt: Date }[]
}

async function findApp(id: string, userId: string): Promise<NormApp | null> {
  const a = await db.application.findFirst({
    where: { id, userId },
    include: { opportunity: true, documents: true, messages: { orderBy: { createdAt: "asc" } } },
  })
  if (a) return {
    id: a.id, modelType: "application",
    title: a.opportunity.title,
    subtitle: `${a.opportunity.organization} · ${a.opportunity.location}`,
    status: a.status, createdAt: a.createdAt,
    submittedAt: a.submittedAt, firstResponseAt: a.firstResponseAt,
    slaBreached: a.slaBreached, feePaid: a.feePaid,
    registrationFee: a.registrationFee, processingFee: a.processingFee,
    adminNotes: a.adminNotes, admissionLetter: a.admissionLetter, coverLetter: a.coverLetter,
    extraFields: [
      ...(a.gpa ? [{ label: "GPA", value: String(a.gpa) }] : []),
      ...(a.degreeLevel ? [{ label: "Degree Level", value: a.degreeLevel }] : []),
      ...(a.fieldOfStudy ? [{ label: "Field of Study", value: a.fieldOfStudy }] : []),
      ...(a.experience ? [{ label: "Experience", value: a.experience }] : []),
    ],
    documents: a.documents.map((d) => ({ id: d.id, name: d.fileName, url: d.fileUrl, type: d.documentType })),
    messages: a.messages.map((m) => ({ id: m.id, content: m.content, isAdmin: m.isAdminMessage, createdAt: m.createdAt })),
  }

  const v = await db.visaApplication.findFirst({
    where: { id, userId },
    include: { documents: true, messages: { orderBy: { createdAt: "asc" } } },
  })
  if (v) return {
    id: v.id, modelType: "visa",
    title: "China Business Visa Application",
    subtitle: v.companyName ? `${v.companyName} · ${v.nationality}` : v.nationality,
    status: v.status, createdAt: v.createdAt,
    submittedAt: v.submittedAt, firstResponseAt: v.firstResponseAt,
    slaBreached: v.slaBreached, feePaid: v.feePaid, processingFee: v.processingFee,
    adminNotes: v.adminNotes,
    extraFields: [
      { label: "Full Name", value: v.fullName },
      { label: "Passport Number", value: v.passportNumber },
      ...(v.passportExpiry ? [{ label: "Passport Expiry", value: v.passportExpiry }] : []),
      ...(v.dateOfBirth ? [{ label: "Date of Birth", value: v.dateOfBirth }] : []),
      { label: "Phone", value: v.phone },
      { label: "Email", value: v.contactEmail },
      ...(v.companyName ? [{ label: "Company", value: v.companyName }] : []),
      ...(v.jobTitle ? [{ label: "Job Title", value: v.jobTitle }] : []),
      ...(v.tinNumber ? [{ label: "TIN Number", value: v.tinNumber }] : []),
      { label: "Travel Purpose", value: v.purpose },
      ...(v.travelDates ? [{ label: "Travel Dates", value: v.travelDates }] : []),
      ...(v.stayDuration ? [{ label: "Stay Duration", value: v.stayDuration }] : []),
    ],
    documents: v.documents.map((d) => ({ id: d.id, name: d.fileName, url: d.fileUrl, type: d.documentType })),
    messages: v.messages.map((m) => ({ id: m.id, content: m.content, isAdmin: m.isAdminMessage, createdAt: m.createdAt })),
  }

  const s = await db.studyApplication.findFirst({
    where: { id, userId },
    include: { documents: true, messages: { orderBy: { createdAt: "asc" } } },
  })
  if (s) return {
    id: s.id, modelType: "study",
    title: `Study in China — ${s.degreeLevel}`,
    subtitle: `${s.fieldOfStudy} · ${s.nationality}`,
    status: s.status, createdAt: s.createdAt,
    submittedAt: s.submittedAt, firstResponseAt: s.firstResponseAt,
    slaBreached: s.slaBreached, feePaid: s.feePaid,
    registrationFee: s.registrationFee, processingFee: s.processingFee,
    adminNotes: s.adminNotes, admissionLetter: s.admissionLetter,
    extraFields: [
      { label: "Full Name", value: s.fullName },
      { label: "Degree Level", value: s.degreeLevel },
      { label: "Field of Study", value: s.fieldOfStudy },
      { label: "Nationality", value: s.nationality },
      { label: "Phone", value: s.phone },
      { label: "Email", value: s.contactEmail },
      ...(s.gpa ? [{ label: "GPA", value: s.gpa }] : []),
      ...(s.englishProficiency ? [{ label: "English Proficiency", value: s.englishProficiency }] : []),
      ...(s.chineseProficiency ? [{ label: "Chinese Proficiency", value: s.chineseProficiency }] : []),
      ...(s.preferredUniversities ? [{ label: "Preferred Universities", value: s.preferredUniversities }] : []),
      ...(s.preferredIntake ? [{ label: "Preferred Intake", value: s.preferredIntake }] : []),
    ],
    documents: s.documents.map((d) => ({ id: d.id, name: d.fileName, url: d.fileUrl, type: d.documentType })),
    messages: s.messages.map((m) => ({ id: m.id, content: m.content, isAdmin: m.isAdminMessage, createdAt: m.createdAt })),
  }

  const sc = await db.scholarshipApplication.findFirst({
    where: { id, userId },
    include: { scholarship: true },
  })
  if (sc) return {
    id: sc.id, modelType: "scholarship",
    title: sc.scholarship.title,
    subtitle: `${sc.scholarship.level} Scholarship · ${sc.scholarship.country}`,
    status: sc.status, createdAt: sc.createdAt,
    submittedAt: null, firstResponseAt: null,
    slaBreached: false, feePaid: false,
    adminNotes: sc.adminNotes,
    extraFields: [
      { label: "Scholarship", value: sc.scholarship.title },
      { label: "Level", value: sc.scholarship.level },
      { label: "Country", value: sc.scholarship.country },
      ...(sc.notes ? [{ label: "Your Notes", value: sc.notes }] : []),
    ],
    documents: [], messages: [],
  }

  return null
}

// ── Timeline config ────────────────────────────────────────────────────────────
const TIMELINE: Record<string, { key: string; label: string; desc: string }[]> = {
  visa: [
    { key: "SUBMITTED",         label: "Application Submitted",  desc: "Application received by our team" },
    { key: "UNDER_REVIEW",      label: "Documents Under Review", desc: "Verifying your submitted documents" },
    { key: "ACCEPTED",          label: "Approved",               desc: "Visa eligibility confirmed" },
    { key: "PAYMENT_PENDING",   label: "Payment Required",       desc: "Complete payment to proceed" },
    { key: "PROCESSING",        label: "Embassy Processing",     desc: "Forwarded to embassy for processing" },
    { key: "COMPLETED",         label: "Decision Issued",        desc: "Final visa decision communicated" },
  ],
  study: [
    { key: "SUBMITTED",         label: "Profile Submitted",      desc: "Application received by our team" },
    { key: "UNDER_REVIEW",      label: "Profile Review",         desc: "Evaluating your academic profile" },
    { key: "SHORTLISTED",       label: "University Matching",    desc: "Matched to suitable institutions" },
    { key: "PAYMENT_PENDING",   label: "Payment Required",       desc: "Complete payment to secure placement" },
    { key: "COMPLETED",         label: "Placement Confirmed",    desc: "University acceptance secured" },
  ],
  scholarship: [
    { key: "INTERESTED",        label: "Interest Registered",    desc: "Application received by our team" },
    { key: "UNDER_REVIEW",      label: "Under Review",           desc: "Evaluating your application" },
    { key: "SHORTLISTED",       label: "Shortlisted",            desc: "You have been shortlisted" },
    { key: "ACCEPTED",          label: "Approved",               desc: "Scholarship awarded" },
    { key: "COMPLETED",         label: "Completed",              desc: "Placement fully confirmed" },
  ],
  application: [
    { key: "SUBMITTED",         label: "Application Submitted",  desc: "Application received by our team" },
    { key: "UNDER_REVIEW",      label: "Under Review",           desc: "Our team is reviewing your file" },
    { key: "ACCEPTED",          label: "Approved",               desc: "Application successfully approved" },
    { key: "PAYMENT_PENDING",   label: "Payment Required",       desc: "Complete payment to begin processing" },
    { key: "PROCESSING",        label: "Processing",             desc: "Active processing underway" },
    { key: "COMPLETED",         label: "Completed",              desc: "Application successfully closed" },
  ],
}

const STEP_ORDER = [
  "SUBMITTED","INTERESTED","UNDER_REVIEW","DOCUMENTS_REQUIRED",
  "SHORTLISTED","MATCHED","ACCEPTED","APPROVED",
  "PAYMENT_PENDING","PAYMENT_COMPLETED","PROCESSING","COMPLETED",
]

function getStepIndex(status: string, steps: { key: string }[]): number {
  const statusOrder = STEP_ORDER.indexOf(status)
  let best = 0
  steps.forEach((s, i) => {
    const sOrder = STEP_ORDER.indexOf(s.key)
    if (sOrder <= statusOrder) best = i
  })
  return best
}

// ── Shared sub-components ──────────────────────────────────────────────────────
function GlassCard({ children, className = "", glow }: { children: React.ReactNode; className?: string; glow?: string }) {
  return (
    <div className={`rounded-2xl ${className}`}
      style={{
        background: "rgba(255,255,255,0.035)",
        border: "1px solid rgba(255,255,255,0.08)",
        backdropFilter: "blur(12px)",
        boxShadow: glow ? `0 0 40px ${glow}08, inset 0 1px 0 rgba(255,255,255,0.04)` : "inset 0 1px 0 rgba(255,255,255,0.04)",
      }}>
      {children}
    </div>
  )
}

function SectionTitle({ children, icon: Icon, color = "rgba(255,255,255,0.5)" }: { children: React.ReactNode; icon: any; color?: string }) {
  return (
    <div className="flex items-center gap-2.5 mb-5">
      <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: "rgba(255,255,255,0.06)" }}>
        <Icon className="h-3.5 w-3.5" style={{ color }} />
      </div>
      <h2 className="text-sm font-black tracking-wide text-white">{children}</h2>
    </div>
  )
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] font-bold uppercase tracking-[0.12em] mb-1.5" style={{ color: "rgba(255,255,255,0.28)" }}>{children}</p>
}

function FieldValue({ children }: { children: React.ReactNode }) {
  return <p className="text-sm font-semibold leading-snug" style={{ color: "rgba(255,255,255,0.82)" }}>{children}</p>
}

export default async function ApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user) redirect("/login")

  const app = await findApp(id, session.user.id)
  if (!app) notFound()

  const st = STATUS_META[app.status] ?? STATUS_META.SUBMITTED
  const Icon = st.icon
  const isRejected = ["REJECTED", "CANCELLED"].includes(app.status)
  const isApproved = ["ACCEPTED", "APPROVED", "PAYMENT_PENDING", "PAYMENT_COMPLETED", "PROCESSING", "COMPLETED"].includes(app.status)
  const isPaymentPending = app.status === "PAYMENT_PENDING" && !app.feePaid
  const totalFee = (app.registrationFee ?? 0) + (app.processingFee ?? 0)
  const hasFees = totalFee > 0
  const steps = TIMELINE[app.modelType] ?? TIMELINE.application
  const currentStep = getStepIndex(app.status, steps)

  // Group extraFields for visa into logical sections, flat list for others
  const isVisa = app.modelType === "visa"
  const personalFields = isVisa
    ? app.extraFields.filter((f) => ["Full Name", "Date of Birth", "Phone", "Email"].includes(f.label))
    : []
  const passportFields = isVisa
    ? app.extraFields.filter((f) => ["Passport Number", "Passport Expiry"].includes(f.label))
    : []
  const businessFields = isVisa
    ? app.extraFields.filter((f) => ["Company", "Job Title", "TIN Number"].includes(f.label))
    : []
  const travelFields = isVisa
    ? app.extraFields.filter((f) => ["Travel Purpose", "Travel Dates", "Stay Duration"].includes(f.label))
    : []
  const genericFields = isVisa ? [] : app.extraFields

  return (
    <div className="relative min-h-screen" style={{ background: "#05091a" }}>

      {/* ── Decorative background ─────────────────────────────────────────── */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>

        {/* Sky base */}
        <div className="absolute inset-0"
          style={{ background: "linear-gradient(to bottom, #010510 0%, #030a1a 25%, #050918 55%, #040810 100%)" }} />

        {/* Chinese red sunrise glow — top right */}
        <div className="absolute -top-24 -right-16 h-[700px] w-[700px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(200,16,46,0.16) 0%, rgba(200,16,46,0.05) 40%, transparent 65%)" }} />
        {/* Gold lantern warmth — upper left */}
        <div className="absolute -top-10 -left-20 h-[450px] w-[450px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(212,175,55,0.09) 0%, transparent 60%)" }} />
        {/* Status-color ambient */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 h-[700px] w-[700px] rounded-full"
          style={{ background: `radial-gradient(circle, ${st.color}05 0%, transparent 70%)` }} />

        {/* Main SVG artwork */}
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1440 900"
          preserveAspectRatio="xMidYMax slice" xmlns="http://www.w3.org/2000/svg">
          <defs>
            {/* Chinese lattice window pattern */}
            <pattern id="ch-lattice" x="0" y="0" width="52" height="52" patternUnits="userSpaceOnUse">
              <rect x="4" y="4" width="44" height="44" fill="none" stroke="rgba(255,255,255,0.022)" strokeWidth="0.5"/>
              <rect x="16" y="16" width="20" height="20" fill="none" stroke="rgba(255,255,255,0.016)" strokeWidth="0.5"/>
              <line x1="4" y1="26" x2="16" y2="26" stroke="rgba(255,255,255,0.014)" strokeWidth="0.4"/>
              <line x1="36" y1="26" x2="48" y2="26" stroke="rgba(255,255,255,0.014)" strokeWidth="0.4"/>
              <line x1="26" y1="4" x2="26" y2="16" stroke="rgba(255,255,255,0.014)" strokeWidth="0.4"/>
              <line x1="26" y1="36" x2="26" y2="48" stroke="rgba(255,255,255,0.014)" strokeWidth="0.4"/>
            </pattern>

            {/* Mountain gradients — ink wash tones */}
            <linearGradient id="mt1" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(40,10,80,0.55)"/>
              <stop offset="100%" stopColor="rgba(4,8,22,0.92)"/>
            </linearGradient>
            <linearGradient id="mt2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(80,10,30,0.45)"/>
              <stop offset="100%" stopColor="rgba(4,8,22,0.88)"/>
            </linearGradient>
            <linearGradient id="mt3" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(8,15,45,0.7)"/>
              <stop offset="100%" stopColor="rgba(3,7,20,0.97)"/>
            </linearGradient>
            {/* Mist fade over bottom mountains */}
            <linearGradient id="mist" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(4,8,22,0)"/>
              <stop offset="50%" stopColor="rgba(4,8,22,0.15)"/>
              <stop offset="100%" stopColor="rgba(3,7,18,0.98)"/>
            </linearGradient>
          </defs>

          {/* Lattice over everything */}
          <rect width="1440" height="900" fill="url(#ch-lattice)"/>

          {/* ── Ink wash mountains ── */}
          {/* Layer 1: distant peaks (purple/blue) */}
          <path d="M0,900 L0,600 Q70,560 150,578 Q210,590 270,535 Q340,470 400,495 Q455,515 510,460 Q565,405 625,432 Q680,455 740,390 Q800,325 865,368 Q930,410 990,340 Q1050,270 1110,315 Q1170,360 1230,295 Q1290,230 1350,275 Q1410,318 1440,300 L1440,900 Z"
            fill="url(#mt1)" opacity="0.75"/>

          {/* Layer 2: mid peaks (red-tinged) */}
          <path d="M0,900 L0,690 Q65,658 135,672 Q190,682 250,640 Q315,594 375,618 Q430,638 490,590 Q550,542 615,568 Q670,590 735,528 Q800,466 865,505 Q930,544 995,478 Q1060,412 1125,460 Q1190,508 1255,455 Q1320,402 1380,445 Q1425,474 1440,460 L1440,900 Z"
            fill="url(#mt2)" opacity="0.82"/>

          {/* Layer 3: near cliffs (darkest) */}
          <path d="M0,900 L0,780 Q90,748 170,762 Q230,772 295,725 Q365,674 425,698 Q488,722 548,672 Q612,618 675,648 Q738,678 802,618 Q866,558 930,598 Q994,638 1058,575 Q1122,512 1186,558 Q1250,604 1314,555 Q1378,506 1440,535 L1440,900 Z"
            fill="url(#mt3)" opacity="0.92"/>

          {/* Mist layer */}
          <rect width="1440" height="900" fill="url(#mist)"/>

          {/* ── Chinese lanterns — top right ── */}
          <g transform="translate(1300,0)" opacity="0.45">
            {/* Lantern 1 — large */}
            <line x1="26" y1="0" x2="26" y2="16" stroke="#D4AF37" strokeWidth="1.2" opacity="0.7"/>
            <rect x="16" y="15" width="20" height="7" rx="1.5" fill="rgba(212,175,55,0.5)" stroke="#D4AF37" strokeWidth="0.8"/>
            <ellipse cx="26" cy="55" rx="18" ry="32" fill="rgba(200,16,46,0.45)"/>
            <ellipse cx="26" cy="55" rx="18" ry="32" fill="none" stroke="#D4AF37" strokeWidth="1.2" opacity="0.6"/>
            <ellipse cx="26" cy="37" rx="18" ry="8" fill="none" stroke="#D4AF37" strokeWidth="0.6" opacity="0.5"/>
            <ellipse cx="26" cy="55" rx="18" ry="10" fill="none" stroke="#D4AF37" strokeWidth="0.6" opacity="0.4"/>
            <ellipse cx="26" cy="73" rx="18" ry="8" fill="none" stroke="#D4AF37" strokeWidth="0.6" opacity="0.5"/>
            {/* Glow inside */}
            <ellipse cx="26" cy="55" rx="8" ry="14" fill="rgba(255,200,50,0.12)"/>
            <rect x="16" y="84" width="20" height="7" rx="1.5" fill="rgba(212,175,55,0.5)" stroke="#D4AF37" strokeWidth="0.8"/>
            <line x1="20" y1="91" x2="17" y2="108" stroke="#D4AF37" strokeWidth="0.8" opacity="0.5"/>
            <line x1="26" y1="91" x2="26" y2="111" stroke="#D4AF37" strokeWidth="0.8" opacity="0.5"/>
            <line x1="32" y1="91" x2="35" y2="108" stroke="#D4AF37" strokeWidth="0.8" opacity="0.5"/>

            {/* Lantern 2 — right, medium, offset down */}
            <line x1="66" y1="0" x2="66" y2="30" stroke="#D4AF37" strokeWidth="1" opacity="0.6"/>
            <rect x="57" y="29" width="18" height="6" rx="1" fill="rgba(212,175,55,0.45)" stroke="#D4AF37" strokeWidth="0.7"/>
            <ellipse cx="66" cy="65" rx="14" ry="25" fill="rgba(200,16,46,0.38)"/>
            <ellipse cx="66" cy="65" rx="14" ry="25" fill="none" stroke="#D4AF37" strokeWidth="1" opacity="0.5"/>
            <ellipse cx="66" cy="65" rx="14" ry="9" fill="none" stroke="#D4AF37" strokeWidth="0.5" opacity="0.35"/>
            <ellipse cx="66" cy="53" rx="14" ry="6" fill="none" stroke="#D4AF37" strokeWidth="0.5" opacity="0.35"/>
            <ellipse cx="66" cy="77" rx="14" ry="6" fill="none" stroke="#D4AF37" strokeWidth="0.5" opacity="0.35"/>
            <ellipse cx="66" cy="65" rx="5" ry="10" fill="rgba(255,200,50,0.1)"/>
            <rect x="57" y="88" width="18" height="5" rx="1" fill="rgba(212,175,55,0.4)" stroke="#D4AF37" strokeWidth="0.6"/>
            <line x1="61" y1="93" x2="59" y2="106" stroke="#D4AF37" strokeWidth="0.7" opacity="0.4"/>
            <line x1="66" y1="93" x2="66" y2="108" stroke="#D4AF37" strokeWidth="0.7" opacity="0.4"/>
            <line x1="71" y1="93" x2="73" y2="106" stroke="#D4AF37" strokeWidth="0.7" opacity="0.4"/>

            {/* String connecting them */}
            <path d="M26,0 Q46,-8 66,0" fill="none" stroke="#D4AF37" strokeWidth="0.7" opacity="0.3"/>
          </g>

          {/* ── Bamboo — left edge ── */}
          <g transform="translate(22,150)" opacity="0.1">
            <line x1="0" y1="0" x2="0" y2="580" stroke="rgba(80,200,120,0.9)" strokeWidth="3"/>
            <line x1="0" y1="75"  x2="42" y2="52"  stroke="rgba(80,200,120,0.8)" strokeWidth="2"/>
            <line x1="0" y1="155" x2="-30" y2="133" stroke="rgba(80,200,120,0.8)" strokeWidth="2"/>
            <line x1="0" y1="240" x2="38" y2="218"  stroke="rgba(80,200,120,0.8)" strokeWidth="2"/>
            <line x1="0" y1="330" x2="-28" y2="310" stroke="rgba(80,200,120,0.8)" strokeWidth="2"/>
            <line x1="0" y1="420" x2="34" y2="400"  stroke="rgba(80,200,120,0.8)" strokeWidth="2"/>
            <line x1="0" y1="510" x2="-25" y2="492" stroke="rgba(80,200,120,0.8)" strokeWidth="2"/>
            {/* Knuckle joints */}
            {[75,155,240,330,420,510].map((y) => (
              <ellipse key={y} cx="0" cy={y} rx="3" ry="2" fill="rgba(80,200,120,0.6)"/>
            ))}

            {/* Second stalk */}
            <line x1="22" y1="30" x2="22" y2="520" stroke="rgba(80,200,120,0.7)" strokeWidth="2"/>
            <line x1="22" y1="110" x2="55" y2="90"  stroke="rgba(80,200,120,0.6)" strokeWidth="1.5"/>
            <line x1="22" y1="195" x2="-8" y2="175" stroke="rgba(80,200,120,0.6)" strokeWidth="1.5"/>
            <line x1="22" y1="280" x2="52" y2="260" stroke="rgba(80,200,120,0.6)" strokeWidth="1.5"/>
            <line x1="22" y1="370" x2="-5" y2="352" stroke="rgba(80,200,120,0.6)" strokeWidth="1.5"/>
            <line x1="22" y1="455" x2="50" y2="436" stroke="rgba(80,200,120,0.6)" strokeWidth="1.5"/>
            {[110,195,280,370,455].map((y) => (
              <ellipse key={y} cx="22" cy={y} rx="2.5" ry="1.5" fill="rgba(80,200,120,0.5)"/>
            ))}
          </g>

          {/* ── Chinese coin / medallion — faint center ── */}
          <g transform="translate(720,60)" opacity="0.055">
            <circle cx="0" cy="0" r="90" fill="none" stroke="#D4AF37" strokeWidth="2.5"/>
            <circle cx="0" cy="0" r="68" fill="none" stroke="#D4AF37" strokeWidth="1"/>
            <rect x="-26" y="-26" width="52" height="52" fill="none" stroke="#D4AF37" strokeWidth="2"/>
            <circle cx="0" cy="0" r="18" fill="none" stroke="#D4AF37" strokeWidth="1"/>
            {/* Cross lines */}
            <line x1="-90" y1="0" x2="-68" y2="0" stroke="#D4AF37" strokeWidth="1" opacity="0.5"/>
            <line x1="68" y1="0" x2="90" y2="0" stroke="#D4AF37" strokeWidth="1" opacity="0.5"/>
            <line x1="0" y1="-90" x2="0" y2="-68" stroke="#D4AF37" strokeWidth="1" opacity="0.5"/>
            <line x1="0" y1="68" x2="0" y2="90" stroke="#D4AF37" strokeWidth="1" opacity="0.5"/>
          </g>

          {/* ── Decorative red border lines at bottom ── */}
          <line x1="0" y1="898" x2="1440" y2="898" stroke="rgba(200,16,46,0.2)" strokeWidth="1.5"/>
          <line x1="0" y1="894" x2="1440" y2="894" stroke="rgba(212,175,55,0.08)" strokeWidth="0.5"/>

          {/* ── Floating cherry blossom dots ── */}
          {[
            [320,180,4], [580,120,3], [820,200,5], [1050,160,3.5],
            [200,350,2.5], [950,300,3], [1200,250,4], [450,280,2],
          ].map(([x,y,r],i) => (
            <g key={i} opacity="0.18">
              <circle cx={x} cy={y} r={r} fill="rgba(255,180,200,0.6)"/>
              <circle cx={x} cy={y} r={r*0.5} fill="rgba(255,255,255,0.4)"/>
            </g>
          ))}
        </svg>
      </div>

      {/* ── Top accent bar ────────────────────────────────────────────────── */}
      <div className="fixed top-0 left-0 right-0 h-[2px] z-50"
        style={{ background: `linear-gradient(to right, transparent 0%, #C8102E 30%, ${st.color} 60%, #D4AF37 85%, transparent 100%)` }} />

      {/* ── Page content ──────────────────────────────────────────────────── */}
      <div className="relative z-10 mx-auto max-w-5xl px-4 pb-16 pt-8">

        {/* Navigation */}
        <div className="mb-7 flex items-center justify-between">
          <Link href="/dashboard/applications"
            className="group flex items-center gap-2 text-sm font-medium transition-all hover:opacity-80"
            style={{ color: "rgba(255,255,255,0.4)" }}>
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            Back to Applications
          </Link>
          {app.status === "SUBMITTED" && app.modelType === "application" && (
            <Link href={`/apply/${app.id}?edit=true`}
              className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all hover:opacity-90"
              style={{ background: "rgba(96,165,250,0.1)", color: "#60a5fa", border: "1px solid rgba(96,165,250,0.2)" }}>
              <Edit3 className="h-3.5 w-3.5" /> Edit Application
            </Link>
          )}
        </div>

        {/* ── Embassy Hero Card ─────────────────────────────────────────────── */}
        <div className="mb-6 overflow-hidden rounded-2xl"
          style={{
            background: "rgba(4,8,22,0.9)",
            border: `1px solid ${st.border}`,
            backdropFilter: "blur(24px)",
            boxShadow: `0 0 100px ${st.color}06, 0 0 40px rgba(200,16,46,0.04), inset 0 1px 0 rgba(255,255,255,0.06)`,
          }}>

          {/* Top wash */}
          <div className="px-8 pt-8 pb-7"
            style={{
              background: `linear-gradient(135deg, ${st.color}10 0%, rgba(200,16,46,0.04) 40%, transparent 70%)`,
              borderBottom: "1px solid rgba(255,255,255,0.06)",
            }}>

            {/* EA badge */}
            <div className="mb-5 flex items-center gap-2">
              <div className="flex h-5 w-5 items-center justify-center rounded-md"
                style={{ background: "rgba(200,16,46,0.15)", border: "1px solid rgba(200,16,46,0.3)" }}>
                <span className="text-[9px] font-black text-red-400">EA</span>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: "#D4AF37" }}>
                EA Trade Link · China–Tanzania Platform
              </span>
            </div>

            <div className="flex items-start gap-5">
              {/* Status emblem */}
              <div className="relative shrink-0">
                <div className="flex h-[68px] w-[68px] items-center justify-center rounded-2xl"
                  style={{
                    background: `linear-gradient(135deg, ${st.color}18, ${st.color}06)`,
                    border: `2px solid ${st.border}`,
                    boxShadow: `0 0 40px ${st.color}20`,
                  }}>
                  <Icon className="h-8 w-8" style={{ color: st.color }} />
                </div>
                {/* Gold ring */}
                <div className="pointer-events-none absolute -inset-[3px] rounded-[19px]"
                  style={{ border: "1px solid rgba(212,175,55,0.12)" }} />
              </div>

              {/* Title block */}
              <div className="flex-1 min-w-0">
                <p className="mb-1 text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: st.color }}>
                  Application Status
                </p>
                <h1 className="text-[22px] font-black leading-tight text-white">{app.title}</h1>
                <p className="mt-1 text-xs" style={{ color: "rgba(255,255,255,0.38)" }}>{app.subtitle}</p>
              </div>

              {/* Status pill */}
              <div className="shrink-0">
                <span className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-black"
                  style={{
                    background: st.bg,
                    color: st.color,
                    border: `1px solid ${st.border}`,
                    boxShadow: `0 0 24px ${st.color}20`,
                  }}>
                  {isApproved && <BadgeCheck className="h-3.5 w-3.5" />}
                  {isRejected && <XCircle className="h-3.5 w-3.5" />}
                  {!isApproved && !isRejected && <div className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: st.color }} />}
                  {st.label}
                </span>
              </div>
            </div>

            {/* Status message */}
            <div className="mt-5 flex items-start gap-3 rounded-xl p-4"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <Icon className="h-4 w-4 mt-0.5 shrink-0" style={{ color: st.color }} />
              <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>{st.message}</p>
            </div>
          </div>

          {/* Meta row */}
          <div className="grid grid-cols-3 divide-x" style={{ "--tw-divide-opacity": "1" } as any}>
            {[
              { label: "Date Submitted",  value: fmt(app.createdAt) ?? "—",    mono: false },
              { label: "First Response",  value: fmt(app.firstResponseAt) ?? "Pending", mono: false },
              { label: "Reference ID",    value: `#${app.id.slice(0, 8).toUpperCase()}`, mono: true },
            ].map((cell) => (
              <div key={cell.label} className="px-6 py-4" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.25)" }}>
                  {cell.label}
                </p>
                <p className={`text-sm font-bold ${cell.mono ? "font-mono text-xs" : ""}`}
                  style={{ color: cell.mono ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.85)" }}>
                  {cell.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Alert banners ─────────────────────────────────────────────────── */}
        {app.slaBreached && (
          <div className="mb-4 flex items-start gap-3 rounded-2xl px-5 py-4"
            style={{ background: "rgba(248,113,113,0.07)", border: "1px solid rgba(248,113,113,0.2)" }}>
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-400" />
            <p className="text-xs leading-relaxed" style={{ color: "rgba(252,165,165,0.8)" }}>
              We apologize for the delay. Our team is prioritizing your application and will respond as soon as possible.
            </p>
          </div>
        )}

        {app.status === "DOCUMENTS_REQUIRED" && (
          <div className="mb-4 rounded-2xl overflow-hidden"
            style={{ background: "rgba(251,146,60,0.07)", border: "1px solid rgba(251,146,60,0.2)" }}>
            <div className="flex items-start gap-3 px-5 py-4">
              <FileText className="h-4 w-4 shrink-0 mt-0.5 text-orange-400" />
              <div>
                <p className="mb-1 text-xs font-bold text-orange-300">Action Required — Additional Documents Needed</p>
                <p className="text-xs leading-relaxed" style={{ color: "rgba(253,186,116,0.75)" }}>
                  {app.adminNotes ?? "Additional information is required to continue processing your application. Please upload the missing documents below."}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── PAYMENT REQUIRED BANNER ─────────────────────────────────────── */}
        {isPaymentPending && hasFees && (
          <div className="mb-4 rounded-2xl overflow-hidden"
            style={{ background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.3)", boxShadow: "0 0 40px rgba(212,175,55,0.08)" }}>
            <div className="px-5 py-4"
              style={{ background: "linear-gradient(135deg, rgba(212,175,55,0.12) 0%, transparent 60%)", borderBottom: "1px solid rgba(212,175,55,0.15)" }}>
              <div className="flex items-center gap-2.5 mb-1">
                <CreditCard className="h-4 w-4 text-yellow-400" />
                <p className="text-sm font-black" style={{ color: "#D4AF37" }}>Payment Required — Secure Your Spot</p>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: "rgba(212,175,55,0.75)" }}>
                To secure your placement and begin official processing, please complete the required payment.
                Contact our team via WhatsApp or M-Pesa using the details below.
              </p>
            </div>
            <div className="px-5 py-4 flex items-center justify-between gap-4 flex-wrap">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>Amount Due</p>
                <p className="text-2xl font-black" style={{ color: "#D4AF37" }}>TZS {totalFee.toLocaleString()}</p>
              </div>
              <div className="flex flex-col gap-2 items-end">
                <a href="https://wa.me/255672037939" target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all hover:opacity-90"
                  style={{ background: "rgba(52,211,153,0.15)", color: "#34d399", border: "1px solid rgba(52,211,153,0.3)" }}>
                  WhatsApp Payment
                </a>
                <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.25)" }}>Or call: +255 652 026 656</p>
              </div>
            </div>
          </div>
        )}

        {app.admissionLetter && (
          <div className="mb-4 flex items-center justify-between gap-4 rounded-2xl px-5 py-4"
            style={{ background: "rgba(52,211,153,0.07)", border: "1px solid rgba(52,211,153,0.2)" }}>
            <div className="flex items-center gap-3">
              <Download className="h-5 w-5 shrink-0 text-emerald-400" />
              <div>
                <p className="text-sm font-bold text-emerald-300">Admission Letter Ready</p>
                <p className="text-xs mt-0.5" style={{ color: "rgba(110,231,183,0.6)" }}>Your acceptance letter is available to download.</p>
              </div>
            </div>
            <a href={app.admissionLetter} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold shrink-0 transition-all hover:opacity-90"
              style={{ background: "rgba(52,211,153,0.15)", color: "#34d399", border: "1px solid rgba(52,211,153,0.25)" }}>
              <ExternalLink className="h-3.5 w-3.5" /> Download
            </a>
          </div>
        )}

        {/* ── Main two-column grid ──────────────────────────────────────────── */}
        <div className="grid gap-5 lg:grid-cols-3">

          {/* LEFT — main content */}
          <div className="space-y-5 lg:col-span-2">

            {/* Timeline */}
            <GlassCard className="p-6" glow={st.color}>
              <SectionTitle icon={CalendarDays} color={st.color}>Application Progress</SectionTitle>
              <div>
                {steps.map((step, i) => {
                  const isDone = !isRejected && i < currentStep
                  const isCurrent = i === currentStep
                  const isFailed = isRejected && i === currentStep
                  const dotColor = isFailed ? "#f87171" : isDone ? st.color : isCurrent ? st.color : "rgba(255,255,255,0.12)"
                  const lineColor = isDone && !isRejected ? `${st.color}50` : "rgba(255,255,255,0.06)"
                  return (
                    <div key={step.key} className="flex gap-4">
                      {/* Dot + connector */}
                      <div className="flex flex-col items-center">
                        <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                          style={{
                            background: isFailed ? "rgba(248,113,113,0.12)"
                              : isDone ? `${st.color}18`
                              : isCurrent ? `${st.color}10`
                              : "rgba(255,255,255,0.03)",
                            border: `2px solid ${dotColor}`,
                            boxShadow: isCurrent && !isFailed ? `0 0 16px ${st.color}40` : "none",
                          }}>
                          {isFailed ? (
                            <XCircle className="h-3.5 w-3.5 text-red-400" />
                          ) : isDone ? (
                            <CheckCircle2 className="h-3.5 w-3.5" style={{ color: st.color }} />
                          ) : isCurrent ? (
                            <div className="h-2 w-2 rounded-full animate-pulse" style={{ background: st.color }} />
                          ) : (
                            <div className="h-2 w-2 rounded-full" style={{ background: "rgba(255,255,255,0.12)" }} />
                          )}
                        </div>
                        {i < steps.length - 1 && (
                          <div className="mt-0.5 h-10 w-[2px]" style={{ background: lineColor }} />
                        )}
                      </div>

                      {/* Content */}
                      <div className={`pb-8 flex-1 ${i === steps.length - 1 ? "pb-0" : ""}`}>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold leading-none"
                            style={{ color: isFailed ? "#f87171" : isDone ? "rgba(255,255,255,0.8)" : isCurrent ? st.color : "rgba(255,255,255,0.2)" }}>
                            {step.label}
                          </p>
                          {isCurrent && !isFailed && (
                            <span className="rounded-full px-2 py-0.5 text-[9px] font-black"
                              style={{ background: `${st.color}15`, color: st.color }}>
                              CURRENT
                            </span>
                          )}
                          {isFailed && (
                            <span className="rounded-full px-2 py-0.5 text-[9px] font-black"
                              style={{ background: "rgba(248,113,113,0.12)", color: "#f87171" }}>
                              {app.status === "CANCELLED" ? "CANCELLED" : "UNSUCCESSFUL"}
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-xs" style={{ color: "rgba(255,255,255,0.22)" }}>{step.desc}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </GlassCard>

            {/* Application Details — VISA grouped */}
            {isVisa && (
              <GlassCard className="overflow-hidden">
                {/* Personal Information */}
                {personalFields.length > 0 && (
                  <div className="p-6" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    <SectionTitle icon={User2} color="#60a5fa">Personal Information</SectionTitle>
                    <div className="grid grid-cols-2 gap-5">
                      {personalFields.map((f) => (
                        <div key={f.label}>
                          <FieldLabel>{f.label}</FieldLabel>
                          <FieldValue>{f.value}</FieldValue>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {/* Passport Details */}
                {passportFields.length > 0 && (
                  <div className="p-6" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    <SectionTitle icon={Hash} color="#a78bfa">Passport Details</SectionTitle>
                    <div className="grid grid-cols-2 gap-5">
                      {passportFields.map((f) => (
                        <div key={f.label}>
                          <FieldLabel>{f.label}</FieldLabel>
                          <FieldValue>{f.value}</FieldValue>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {/* Business Information */}
                {businessFields.length > 0 && (
                  <div className="p-6" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    <SectionTitle icon={Building2} color="#34d399">Business Information</SectionTitle>
                    <div className="grid grid-cols-2 gap-5">
                      {businessFields.map((f) => (
                        <div key={f.label}>
                          <FieldLabel>{f.label}</FieldLabel>
                          <FieldValue>{f.value}</FieldValue>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {/* Travel Information */}
                {travelFields.length > 0 && (
                  <div className="p-6">
                    <SectionTitle icon={Plane} color="#D4AF37">Travel Information</SectionTitle>
                    <div className="grid grid-cols-2 gap-5">
                      {travelFields.map((f) => (
                        <div key={f.label}>
                          <FieldLabel>{f.label}</FieldLabel>
                          <FieldValue>{f.value}</FieldValue>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </GlassCard>
            )}

            {/* Application Details — generic (non-visa) */}
            {!isVisa && genericFields.length > 0 && (
              <GlassCard className="p-6">
                <SectionTitle icon={FileText} color={st.color}>Application Details</SectionTitle>
                <div className="grid grid-cols-2 gap-5">
                  {genericFields.map((f) => (
                    <div key={f.label}>
                      <FieldLabel>{f.label}</FieldLabel>
                      <FieldValue>{f.value}</FieldValue>
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}

            {/* Cover letter */}
            {app.coverLetter && (
              <GlassCard className="p-6">
                <SectionTitle icon={FileText} color="rgba(255,255,255,0.4)">Statement of Purpose</SectionTitle>
                <p className="text-sm leading-loose whitespace-pre-wrap" style={{ color: "rgba(255,255,255,0.5)" }}>
                  {app.coverLetter}
                </p>
              </GlassCard>
            )}

            {/* Uploaded Documents */}
            {app.documents.length > 0 && (
              <GlassCard className="p-6">
                <SectionTitle icon={FileText} color="#60a5fa">
                  Uploaded Documents
                  <span className="ml-2 text-xs font-normal" style={{ color: "rgba(255,255,255,0.3)" }}>
                    ({app.documents.length})
                  </span>
                </SectionTitle>
                <div className="space-y-2">
                  {app.documents.map((doc) => (
                    <a key={doc.id} href={doc.url} target="_blank" rel="noopener noreferrer"
                      className="group flex items-center gap-3 rounded-xl px-4 py-3.5 transition-all hover:opacity-90"
                      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                        style={{ background: "rgba(96,165,250,0.1)", border: "1px solid rgba(96,165,250,0.15)" }}>
                        <FileText className="h-4 w-4 text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-white truncate">{doc.name}</p>
                        <p className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.25)" }}>{doc.type.replace(/_/g, " ")}</p>
                      </div>
                      <ExternalLink className="h-3.5 w-3.5 shrink-0 transition-transform group-hover:translate-x-0.5"
                        style={{ color: "rgba(255,255,255,0.2)" }} />
                    </a>
                  ))}
                </div>
              </GlassCard>
            )}

            {/* Messages */}
            <MessageThread
              applicationId={app.id}
              initialMessages={app.messages.map((m) => ({
                id: m.id,
                content: m.content,
                isAdmin: m.isAdmin,
                senderName: m.isAdmin ? "EA Trade Link" : "You",
                createdAt: m.createdAt,
              }))}
              canReply={
                app.modelType !== "scholarship" &&
                !["COMPLETED", "REJECTED", "CANCELLED"].includes(app.status)
              }
            />
          </div>

          {/* RIGHT — sidebar */}
          <div className="space-y-4">

            {/* Quick summary card */}
            <GlassCard className="overflow-hidden">
              <div className="px-5 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: "rgba(255,255,255,0.25)" }}>
                  Application Type
                </p>
                <p className="text-sm font-bold text-white capitalize">
                  {app.modelType === "visa" ? "Business Visa" :
                   app.modelType === "study" ? "Study in China" :
                   app.modelType === "scholarship" ? "Scholarship" : "Opportunity"}
                </p>
              </div>
              <div className="px-5 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: "rgba(255,255,255,0.25)" }}>Submitted</p>
                <p className="text-sm font-bold text-white">{fmt(app.createdAt)}</p>
              </div>
              {app.firstResponseAt && (
                <div className="px-5 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: "rgba(255,255,255,0.25)" }}>Response Date</p>
                  <p className="text-sm font-bold text-white">{fmt(app.firstResponseAt)}</p>
                </div>
              )}
              <div className="px-5 py-4">
                <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: "rgba(255,255,255,0.25)" }}>Case Ref</p>
                <p className="text-[11px] font-mono break-all" style={{ color: "rgba(255,255,255,0.3)" }}>{app.id}</p>
              </div>
            </GlassCard>

            {/* Payment card */}
            {hasFees && (
              <GlassCard className="overflow-hidden">
                <div className="px-5 py-4 flex items-center gap-2"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <CreditCard className="h-4 w-4" style={{ color: "#D4AF37" }} />
                  <h3 className="text-sm font-black text-white">Payment Summary</h3>
                </div>
                <div className="px-5 py-4 space-y-3">
                  {app.registrationFee != null && app.registrationFee > 0 && (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-white">Registration Fee</p>
                        <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.3)" }}>One-time</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold" style={{ color: "#D4AF37" }}>
                          TZS {app.registrationFee.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}
                  {app.processingFee != null && app.processingFee > 0 && (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-white">Processing Fee</p>
                        <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.3)" }}>Service charge</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold" style={{ color: "#D4AF37" }}>
                          TZS {app.processingFee.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="pt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-bold text-white">Total</p>
                      <p className="text-sm font-black" style={{ color: "#D4AF37" }}>
                        TZS {totalFee.toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.25)" }}>
                        Payment Status
                      </p>
                      {app.feePaid ? (
                        <span className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-black"
                          style={{ background: "rgba(52,211,153,0.12)", color: "#34d399", border: "1px solid rgba(52,211,153,0.2)" }}>
                          <CheckCircle2 className="h-3 w-3" /> Paid
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-black"
                          style={{ background: "rgba(251,191,36,0.1)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.2)" }}>
                          <Clock className="h-3 w-3" /> Pending
                        </span>
                      )}
                    </div>
                    {!app.feePaid && (
                      <p className="mt-3 text-[10px] leading-relaxed" style={{ color: "rgba(255,255,255,0.25)" }}>
                        Contact our office to complete your payment via M-Pesa or bank transfer.
                      </p>
                    )}
                  </div>
                </div>
              </GlassCard>
            )}

            {/* Admin notes */}
            {app.adminNotes && app.status !== "DOCUMENTS_REQUIRED" && (
              <GlassCard className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <MessageSquare className="h-3.5 w-3.5" style={{ color: "#D4AF37" }} />
                  <h3 className="text-xs font-black text-white">Note from Our Team</h3>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>{app.adminNotes}</p>
              </GlassCard>
            )}

            {/* Trust badges */}
            <GlassCard className="p-5">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.2)" }}>
                Service Guarantees
              </p>
              <div className="space-y-2.5">
                {[
                  { icon: ShieldCheck, label: "Embassy Compliant",    sub: "Official documentation standards", color: "#34d399" },
                  { icon: Globe2,      label: "China-Based Network",  sub: "Direct embassy relationships",     color: "#60a5fa" },
                  { icon: BadgeCheck,  label: "Verified Processing",  sub: "Every application reviewed",       color: "#D4AF37" },
                ].map((b) => (
                  <div key={b.label} className="flex items-center gap-2.5">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md"
                      style={{ background: `${b.color}12` }}>
                      <b.icon className="h-3 w-3" style={{ color: b.color }} />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-white">{b.label}</p>
                      <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.25)" }}>{b.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>

            {/* Contact CTA */}
            <div className="rounded-2xl p-5 text-center"
              style={{ background: "linear-gradient(135deg, rgba(200,16,46,0.08), rgba(212,175,55,0.06))", border: "1px solid rgba(200,16,46,0.15)" }}>
              <p className="text-xs font-bold text-white mb-1">Need Assistance?</p>
              <p className="text-[10px] mb-3" style={{ color: "rgba(255,255,255,0.35)" }}>Our team is available 9AM–6PM EAT</p>
              <Link href="/messages"
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition-all hover:opacity-90"
                style={{ background: "rgba(200,16,46,0.2)", color: "#f87171", border: "1px solid rgba(200,16,46,0.25)" }}>
                <MessageSquare className="h-3.5 w-3.5" /> Contact Support
              </Link>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
