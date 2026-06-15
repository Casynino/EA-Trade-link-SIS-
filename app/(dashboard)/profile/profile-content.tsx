"use client"

import React, { useState, useTransition, type CSSProperties, type ChangeEvent, type FormEvent } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Phone, MapPin, Globe, Calendar, FileText, Upload, Download,
  Trash2, CheckCircle2, Camera, Save, Loader2, ExternalLink,
  ChevronRight, Plus, Eye,
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { updateProfile, updateProfilePhoto, saveDocument, deleteDocument } from "@/actions/profile"

// ── Exported types (consumed by page.tsx) ─────────────────────────────────────

export interface ProfileUser {
  id: string
  name: string | null
  email: string
  phone: string | null
  nationality: string | null
  address: string | null
  image: string | null
  userTypes: string[]
  role: string
  createdAt: string
}

export interface ProfileDocument {
  id: string
  documentType: string
  fileName: string
  fileUrl: string
  fileSize: number | null
  mimeType: string | null
  isVerified: boolean
  createdAt: string
}

export interface ApplicationRow {
  id: string
  kind: "application" | "study" | "visa" | "scholarship"
  title: string
  org: string
  oppType: string
  status: string
  date: string
  href: string
}

export interface DownloadItem {
  label: string
  url: string
  date: string
}

// ── Document category lists ───────────────────────────────────────────────────

const STUDENT_DOCS = [
  { type: "PASSPORT",             label: "Passport",             emoji: "🛂", required: true,  accept: ".pdf,.jpg,.jpeg,.png" },
  { type: "ID_PHOTO",             label: "ID Photo",             emoji: "🪪", required: true,  accept: ".jpg,.jpeg,.png,.webp" },
  { type: "ACADEMIC_CERTIFICATE", label: "Academic Certificate", emoji: "🎓", required: true,  accept: ".pdf,.jpg,.jpeg,.png" },
  { type: "TRANSCRIPT",           label: "Academic Transcript",  emoji: "📄", required: true,  accept: ".pdf" },
  { type: "MEDICAL_FORM",         label: "Medical Form",         emoji: "🏥", required: false, accept: ".pdf" },
  { type: "BANK_STATEMENT",       label: "Bank Statement",       emoji: "🏦", required: false, accept: ".pdf" },
]

const BUSINESS_DOCS = [
  { type: "PASSPORT",             label: "Passport",             emoji: "🛂", required: true,  accept: ".pdf,.jpg,.jpeg,.png" },
  { type: "ID_PHOTO",             label: "ID Photo",             emoji: "🪪", required: true,  accept: ".jpg,.jpeg,.png,.webp" },
  { type: "BANK_STATEMENT",       label: "Bank Statement",       emoji: "🏦", required: true,  accept: ".pdf" },
  { type: "BUSINESS_LICENSE",     label: "Business License",     emoji: "📋", required: true,  accept: ".pdf,.jpg,.jpeg,.png" },
  { type: "TIN_DOCUMENT",         label: "TIN Document",         emoji: "🔢", required: true,  accept: ".pdf,.jpg,.jpeg,.png" },
  { type: "COMPANY_REGISTRATION", label: "Company Registration", emoji: "🏢", required: false, accept: ".pdf" },
  { type: "INVITATION_LETTER",    label: "Invitation Letter",    emoji: "📨", required: false, accept: ".pdf" },
]

// ── Status config ─────────────────────────────────────────────────────────────

const STATUS: Record<string, { label: string; color: string; bg: string; border: string }> = {
  SUBMITTED:          { label: "Submitted",    color: "#60a5fa", bg: "rgba(96,165,250,0.10)",  border: "rgba(96,165,250,0.22)"  },
  UNDER_REVIEW:       { label: "Under Review", color: "#fbbf24", bg: "rgba(251,191,36,0.10)",  border: "rgba(251,191,36,0.22)"  },
  DOCUMENTS_REQUIRED: { label: "Docs Needed",  color: "#fb923c", bg: "rgba(251,146,60,0.10)",  border: "rgba(251,146,60,0.22)"  },
  SHORTLISTED:        { label: "Shortlisted",  color: "#c084fc", bg: "rgba(192,132,252,0.10)", border: "rgba(192,132,252,0.22)" },
  ACCEPTED:           { label: "Approved",     color: "#34d399", bg: "rgba(52,211,153,0.10)",  border: "rgba(52,211,153,0.22)"  },
  APPROVED:           { label: "Approved",     color: "#34d399", bg: "rgba(52,211,153,0.10)",  border: "rgba(52,211,153,0.22)"  },
  PAYMENT_PENDING:    { label: "Payment Req.", color: "#D4AF37", bg: "rgba(212,175,55,0.10)",  border: "rgba(212,175,55,0.22)"  },
  PAYMENT_COMPLETED:  { label: "Paid",         color: "#34d399", bg: "rgba(52,211,153,0.10)",  border: "rgba(52,211,153,0.22)"  },
  PROCESSING:         { label: "Processing",   color: "#a78bfa", bg: "rgba(167,139,250,0.10)", border: "rgba(167,139,250,0.22)" },
  COMPLETED:          { label: "Completed",    color: "#34d399", bg: "rgba(52,211,153,0.10)",  border: "rgba(52,211,153,0.22)"  },
  REJECTED:           { label: "Unsuccessful", color: "#f87171", bg: "rgba(248,113,113,0.10)", border: "rgba(248,113,113,0.22)" },
  CANCELLED:          { label: "Cancelled",    color: "#6b7280", bg: "rgba(107,114,128,0.08)", border: "rgba(107,114,128,0.18)" },
  INTERESTED:         { label: "Interested",   color: "#60a5fa", bg: "rgba(96,165,250,0.10)",  border: "rgba(96,165,250,0.22)"  },
  MATCHED:            { label: "Matched",      color: "#c084fc", bg: "rgba(192,132,252,0.10)", border: "rgba(192,132,252,0.22)" },
}

// Shared card style
const CARD: CSSProperties = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "1rem",
  backdropFilter: "blur(12px)",
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtSize(bytes: number | null): string {
  if (!bytes) return ""
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
}

function getInits(name: string): string {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
}

// ── Shared props type ─────────────────────────────────────────────────────────

type Accent = { accent: string; accentBg: string; accentBorder: string }

// ── Overview Tab ──────────────────────────────────────────────────────────────

function OverviewTab({ user, accountType, documents, applicationRows, accent, accentBg, accentBorder }: Accent & {
  user: ProfileUser; accountType: string
  documents: ProfileDocument[]; applicationRows: ApplicationRow[]
}) {
  const emoji = accountType === "BUSINESS" ? "💼" : accountType === "ADMIN" ? "🔐" : "🎓"
  const ini = getInits(user.name ?? "U")

  return (
    <div className="space-y-4">
      <div className="rounded-2xl p-6" style={CARD}>
        <div className="flex items-start gap-5">
          <div className="relative shrink-0">
            <div className="h-20 w-20 rounded-2xl flex items-center justify-center text-xl font-black overflow-hidden text-white"
              style={{ background: `linear-gradient(135deg, ${accentBg}, rgba(255,255,255,0.06))`, border: `2px solid ${accentBorder}` }}>
              {user.image
                ? <img src={user.image} alt="" className="h-full w-full object-cover" />
                : ini}
            </div>
            <div className="absolute -bottom-1.5 -right-1.5 h-6 w-6 rounded-full flex items-center justify-center text-xs"
              style={{ background: accent, color: "#05091a", border: "2px solid #05091a" }}>
              {emoji}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-black text-white">{user.name ?? "—"}</h2>
            <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>{user.email}</p>
            <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-xl px-3 py-1 text-xs font-bold"
              style={{ background: accentBg, border: `1px solid ${accentBorder}`, color: accent }}>
              {emoji} {accountType.charAt(0) + accountType.slice(1).toLowerCase()} Account
            </div>
          </div>
        </div>

        {(user.phone || user.nationality || user.address) && (
          <div className="mt-5 pt-5 grid gap-2.5 text-sm" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            {user.phone && (
              <div className="flex items-center gap-2.5" style={{ color: "rgba(255,255,255,0.5)" }}>
                <Phone className="h-4 w-4 shrink-0" style={{ color: accent }} />{user.phone}
              </div>
            )}
            {user.nationality && (
              <div className="flex items-center gap-2.5" style={{ color: "rgba(255,255,255,0.5)" }}>
                <Globe className="h-4 w-4 shrink-0" style={{ color: accent }} />{user.nationality}
              </div>
            )}
            {user.address && (
              <div className="flex items-center gap-2.5" style={{ color: "rgba(255,255,255,0.5)" }}>
                <MapPin className="h-4 w-4 shrink-0" style={{ color: accent }} />{user.address}
              </div>
            )}
            <div className="flex items-center gap-2.5" style={{ color: "rgba(255,255,255,0.5)" }}>
              <Calendar className="h-4 w-4 shrink-0" style={{ color: accent }} />
              Member since {fmtDate(user.createdAt)}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Applications", value: applicationRows.length,                                                                              color: "#60a5fa" },
          { label: "Documents",    value: documents.length,                                                                                    color: accent    },
          { label: "Approved",     value: applicationRows.filter(a => ["ACCEPTED","APPROVED","COMPLETED"].includes(a.status)).length, color: "#34d399" },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-2xl p-4 text-center" style={CARD}>
            <p className="text-2xl font-black mb-0.5" style={{ color }}>{value}</p>
            <p className="text-[11px] font-medium" style={{ color: "rgba(255,255,255,0.3)" }}>{label}</p>
          </div>
        ))}
      </div>

      {applicationRows.length > 0 && (
        <div className="rounded-2xl p-5" style={CARD}>
          <div className="flex items-center justify-between mb-4">
            <p className="font-bold text-white text-sm">Recent Applications</p>
            <Link href="/dashboard/applications" className="text-xs font-semibold" style={{ color: accent }}>View all →</Link>
          </div>
          <div className="space-y-1">
            {applicationRows.slice(0, 4).map(app => {
              const st = STATUS[app.status] ?? STATUS.SUBMITTED
              return (
                <Link key={app.id} href={app.href}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-white/5">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{app.title}</p>
                    <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>{app.org}</p>
                  </div>
                  <span className="shrink-0 rounded-lg px-2.5 py-1 text-[10px] font-bold"
                    style={{ background: st.bg, color: st.color, border: `1px solid ${st.border}` }}>
                    {st.label}
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Edit Profile Tab ──────────────────────────────────────────────────────────

function EditProfileTab({ user, accent, accentBg, accentBorder }: Accent & { user: ProfileUser }) {
  const { toast } = useToast()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [name, setName]         = useState(user.name ?? "")
  const [phone, setPhone]       = useState(user.phone ?? "")
  const [nat, setNat]           = useState(user.nationality ?? "")
  const [addr, setAddr]         = useState(user.address ?? "")
  const [photoUrl, setPhotoUrl] = useState(user.image ?? "")
  const [photoLoading, setPhotoLoading] = useState(false)

  async function handlePhotoChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoLoading(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      const res = await fetch("/api/upload", { method: "POST", body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Upload failed")
      const result = await updateProfilePhoto(data.url)
      if (result?.error) throw new Error(result.error)
      setPhotoUrl(data.url)
      toast({ title: "Photo updated!" })
      router.refresh()
    } catch (err: unknown) {
      toast({ title: "Upload failed", description: err instanceof Error ? err.message : "Try again", variant: "destructive" })
    } finally {
      setPhotoLoading(false)
      e.target.value = ""
    }
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    startTransition(async () => {
      try {
        const result = await updateProfile({ name, phone, nationality: nat, address: addr })
        if (result?.error) {
          toast({ title: "Error", description: result.error, variant: "destructive" })
        } else {
          toast({ title: "Profile updated!", description: "Changes saved." })
          router.refresh()
        }
      } catch (err: unknown) {
        toast({ title: "Error saving profile", description: err instanceof Error ? err.message : "Please try again.", variant: "destructive" })
      }
    })
  }

  const inp: CSSProperties = {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "0.75rem",
    color: "white",
    width: "100%",
    padding: "0.625rem 0.875rem",
    fontSize: "0.875rem",
    outline: "none",
  }
  const lbl: CSSProperties = {
    display: "block",
    fontSize: "0.75rem",
    fontWeight: "600",
    marginBottom: "0.375rem",
    color: "rgba(255,255,255,0.6)",
  }
  const ini = getInits(user.name ?? "U")

  return (
    <div className="space-y-5">
      {/* Photo upload */}
      <div className="rounded-2xl p-5" style={CARD}>
        <p className="text-sm font-bold text-white mb-4">Profile Photo</p>
        <div className="flex items-center gap-4">
          <div className="relative h-20 w-20 shrink-0">
            <div className="h-20 w-20 rounded-2xl flex items-center justify-center text-xl font-black overflow-hidden text-white"
              style={{ background: `linear-gradient(135deg, ${accentBg}, rgba(255,255,255,0.06))`, border: `2px solid ${accentBorder}` }}>
              {photoUrl ? <img src={photoUrl} alt="" className="h-full w-full object-cover" /> : ini}
            </div>
            {photoLoading && (
              <div className="absolute inset-0 rounded-2xl flex items-center justify-center" style={{ background: "rgba(0,0,0,0.65)" }}>
                <Loader2 className="h-5 w-5 text-white animate-spin" />
              </div>
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-white mb-1">Change your photo</p>
            <p className="text-xs mb-3" style={{ color: "rgba(255,255,255,0.35)" }}>JPG, PNG or WEBP · max 16 MB</p>
            <label className="flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold cursor-pointer transition-all hover:opacity-85"
              style={{ background: accent, color: "#05091a", display: "inline-flex" }}>
              <Camera className="h-3.5 w-3.5" />
              {photoLoading ? "Uploading…" : "Upload Photo"}
              <input type="file" accept=".jpg,.jpeg,.png,.webp" className="hidden"
                disabled={photoLoading} onChange={handlePhotoChange} />
            </label>
          </div>
        </div>
      </div>

      {/* Profile form */}
      <form onSubmit={handleSubmit} className="rounded-2xl p-5 space-y-5" style={CARD}>
        <p className="text-sm font-bold text-white">Personal Information</p>

        <div>
          <label style={lbl}>Email Address</label>
          <div style={{ ...inp, opacity: 0.4, cursor: "not-allowed" }}>{user.email}</div>
          <p className="text-[11px] mt-1.5" style={{ color: "rgba(255,255,255,0.25)" }}>Email cannot be changed.</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label style={lbl}>Full Name *</label>
            <input value={name} onChange={e => setName(e.target.value)} required style={inp} placeholder="Your full name" />
          </div>
          <div>
            <label style={lbl}>Phone Number</label>
            <input value={phone} onChange={e => setPhone(e.target.value)} style={inp} placeholder="+255 712 345 678" />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label style={lbl}>Country / Nationality</label>
            <input value={nat} onChange={e => setNat(e.target.value)} style={inp} placeholder="Tanzania" />
          </div>
          <div>
            <label style={lbl}>Address</label>
            <input value={addr} onChange={e => setAddr(e.target.value)} style={inp} placeholder="City, Region" />
          </div>
        </div>

        <button type="submit" disabled={isPending}
          className="flex items-center justify-center gap-2 w-full rounded-xl py-3 text-sm font-black transition-all disabled:opacity-50 hover:opacity-90"
          style={{ background: accent, color: "#05091a" }}>
          {isPending
            ? <><Loader2 className="h-4 w-4 animate-spin" />Saving…</>
            : <><Save className="h-4 w-4" />Save Changes</>}
        </button>
      </form>
    </div>
  )
}

// ── Documents Tab ─────────────────────────────────────────────────────────────

function DocumentsTab({ accountType, documents, accent, accentBg, accentBorder }: Accent & {
  accountType: string; documents: ProfileDocument[]
}) {
  const { toast } = useToast()
  const router = useRouter()
  const [uploading, setUploading] = useState<string | null>(null)
  const [deleting,  setDeleting]  = useState<string | null>(null)

  const categories = accountType === "BUSINESS" ? BUSINESS_DOCS : STUDENT_DOCS

  const byType: Record<string, ProfileDocument[]> = {}
  for (const d of documents) {
    if (!byType[d.documentType]) byType[d.documentType] = []
    byType[d.documentType].push(d)
  }
  const knownTypes = new Set(categories.map(c => c.type))
  const otherDocs  = documents.filter(d => !knownTypes.has(d.documentType))

  async function handleUpload(e: ChangeEvent<HTMLInputElement>, docType: string) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(docType)
    try {
      const fd = new FormData()
      fd.append("file", file)
      const res = await fetch("/api/upload", { method: "POST", body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Upload failed")
      const result = await saveDocument({ fileUrl: data.url, fileName: file.name, documentType: docType, fileSize: file.size, mimeType: file.type })
      if (result?.error) throw new Error(result.error)
      toast({ title: "Uploaded!", description: file.name })
      router.refresh()
    } catch (err: unknown) {
      toast({ title: "Upload failed", description: err instanceof Error ? err.message : "Try again", variant: "destructive" })
    } finally {
      setUploading(null)
      e.target.value = ""
    }
  }

  async function handleDelete(docId: string) {
    setDeleting(docId)
    try {
      const result = await deleteDocument(docId)
      if (result?.error) throw new Error(result.error)
      toast({ title: "Document removed." })
      router.refresh()
    } catch {
      toast({ title: "Delete failed.", variant: "destructive" })
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-white">{categories.length} document categories</p>
        <span className="text-xs px-2.5 py-1 rounded-lg font-bold"
          style={{ background: accentBg, color: accent, border: `1px solid ${accentBorder}` }}>
          {documents.length} file{documents.length !== 1 ? "s" : ""} uploaded
        </span>
      </div>

      {categories.map(cat => {
        const catDocs = byType[cat.type] ?? []
        const busy = uploading === cat.type
        return (
          <div key={cat.type} className="rounded-2xl p-5" style={CARD}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <span className="text-xl leading-none">{cat.emoji}</span>
                <span className="text-sm font-bold text-white">{cat.label}</span>
                {cat.required && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                    style={{ background: "rgba(248,113,113,0.12)", color: "#f87171", border: "1px solid rgba(248,113,113,0.2)" }}>
                    Required
                  </span>
                )}
                {catDocs.length > 0 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                    style={{ background: "rgba(52,211,153,0.10)", color: "#34d399", border: "1px solid rgba(52,211,153,0.2)" }}>
                    ✓ Uploaded
                  </span>
                )}
              </div>
              <label className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold cursor-pointer transition-all hover:opacity-85 ${busy ? "opacity-50 pointer-events-none" : ""}`}
                style={{ background: accent, color: "#05091a" }}>
                {busy
                  ? <><Loader2 className="h-3 w-3 animate-spin" />Uploading…</>
                  : <><Upload className="h-3 w-3" />Upload</>}
                <input type="file" accept={cat.accept} className="hidden" disabled={busy} onChange={e => handleUpload(e, cat.type)} />
              </label>
            </div>

            {catDocs.length === 0 ? (
              <div className="text-xs py-4 text-center rounded-xl"
                style={{ color: "rgba(255,255,255,0.22)", border: "1px dashed rgba(255,255,255,0.07)" }}>
                No file uploaded yet
              </div>
            ) : (
              <div className="space-y-2">
                {catDocs.map(doc => (
                  <div key={doc.id} className="flex items-center gap-3 rounded-xl px-3 py-2.5"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <FileText className="h-4 w-4 shrink-0" style={{ color: accent }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{doc.fileName}</p>
                      <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>
                        {[fmtSize(doc.fileSize), fmtDate(doc.createdAt)].filter(Boolean).join(" · ")}
                        {doc.isVerified && <span className="ml-2 font-semibold" style={{ color: "#34d399" }}>✓ Verified</span>}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <a href={doc.fileUrl} target="_blank" rel="noreferrer"
                        className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors hover:bg-white/10"
                        style={{ color: "rgba(255,255,255,0.4)" }}>
                        <Eye className="h-3.5 w-3.5" />
                      </a>
                      <button onClick={() => handleDelete(doc.id)} disabled={deleting === doc.id}
                        className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors hover:bg-red-500/10"
                        style={{ color: deleting === doc.id ? "rgba(248,113,113,0.3)" : "rgba(248,113,113,0.55)" }}>
                        {deleting === doc.id
                          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          : <Trash2 className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}

      {otherDocs.length > 0 && (
        <div className="rounded-2xl p-5" style={CARD}>
          <p className="text-sm font-bold text-white mb-3">Other Documents</p>
          <div className="space-y-2">
            {otherDocs.map(doc => (
              <div key={doc.id} className="flex items-center gap-3 rounded-xl px-3 py-2.5"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <FileText className="h-4 w-4 shrink-0" style={{ color: "rgba(255,255,255,0.4)" }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{doc.fileName}</p>
                  <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>
                    {doc.documentType.replace(/_/g, " ")} · {fmtDate(doc.createdAt)}
                  </p>
                </div>
                <a href={doc.fileUrl} target="_blank" rel="noreferrer"
                  className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors hover:bg-white/10"
                  style={{ color: "rgba(255,255,255,0.4)" }}>
                  <Eye className="h-3.5 w-3.5" />
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Applications Tab ──────────────────────────────────────────────────────────

function ApplicationsTab({ applicationRows, accent }: Accent & { applicationRows: ApplicationRow[] }) {
  if (applicationRows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 rounded-3xl text-center" style={CARD}>
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
          style={{ background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.15)" }}>
          <FileText className="h-7 w-7" style={{ color: "rgba(212,175,55,0.5)" }} />
        </div>
        <p className="text-base font-black text-white mb-1">No applications yet</p>
        <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.3)" }}>
          Submit your first application and it will appear here.
        </p>
        <Link href="/opportunities"
          className="inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-bold transition-all hover:opacity-90"
          style={{ background: accent, color: "#05091a" }}>
          <Plus className="h-4 w-4" /> Browse Opportunities
        </Link>
      </div>
    )
  }
  return (
    <div className="space-y-3">
      {applicationRows.map(app => {
        const st = STATUS[app.status] ?? STATUS.SUBMITTED
        return (
          <Link key={`${app.kind}-${app.id}`} href={app.href}
            className="flex items-center gap-4 rounded-2xl p-4 transition-all hover:-translate-y-0.5 group"
            style={CARD}>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">{app.title}</p>
              <p className="text-xs mt-0.5 truncate" style={{ color: "rgba(255,255,255,0.35)" }}>{app.org}</p>
              <p className="text-[11px] mt-1 font-medium" style={{ color: "rgba(255,255,255,0.2)" }}>{fmtDate(app.date)}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="rounded-xl px-3 py-1.5 text-[10px] font-bold"
                style={{ background: st.bg, color: st.color, border: `1px solid ${st.border}` }}>
                {st.label}
              </span>
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                style={{ color: "rgba(255,255,255,0.18)" }} />
            </div>
          </Link>
        )
      })}
    </div>
  )
}

// ── Downloads Tab ─────────────────────────────────────────────────────────────

function DownloadsTab({ downloads, accountType, accent, accentBg, accentBorder }: Accent & {
  downloads: DownloadItem[]; accountType: string
}) {
  const futureItems = accountType === "STUDENT"
    ? ["Admission Letter", "Scholarship Offer Letter", "University Documents", "Visa Application Documents"]
    : ["Business Visa Approval Letter", "Factory Visit Confirmation", "Event Participation Documents", "Business Application Letters"]

  return (
    <div className="space-y-4">
      {downloads.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 rounded-3xl text-center" style={CARD}>
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{ background: accentBg, border: `1px solid ${accentBorder}` }}>
            <Download className="h-7 w-7" style={{ color: accent }} />
          </div>
          <p className="text-base font-black text-white mb-1">No downloads yet</p>
          <p className="text-sm max-w-xs mx-auto" style={{ color: "rgba(255,255,255,0.3)" }}>
            Official documents will appear here once your application is reviewed and approved.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {downloads.map((dl, i) => (
            <a key={i} href={dl.url} target="_blank" rel="noreferrer"
              className="flex items-center gap-4 rounded-2xl p-4 transition-all hover:-translate-y-0.5 group"
              style={CARD}>
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                style={{ background: accentBg, border: `1px solid ${accentBorder}` }}>
                <Download className="h-5 w-5" style={{ color: accent }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate">{dl.label}</p>
                <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>
                  Available since {fmtDate(dl.date)}
                </p>
              </div>
              <ExternalLink className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5"
                style={{ color: accent }} />
            </a>
          ))}
        </div>
      )}

      <div className="rounded-2xl p-5" style={CARD}>
        <p className="text-sm font-bold text-white mb-3">Documents you&apos;ll receive here</p>
        <div className="space-y-2">
          {futureItems.map(item => (
            <div key={item} className="flex items-center gap-2.5 text-sm py-0.5"
              style={{ color: "rgba(255,255,255,0.45)" }}>
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" style={{ color: accent }} />
              {item}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Main exported component (defined LAST, after all sub-components) ───────────

const TABS = ["Overview", "Edit Profile", "Documents", "Applications", "Downloads"] as const
type Tab = typeof TABS[number]

interface ProfileContentProps {
  user: ProfileUser
  accountType: string
  documents: ProfileDocument[]
  applicationRows: ApplicationRow[]
  downloads: DownloadItem[]
}

export function ProfileContent({ user, accountType, documents, applicationRows, downloads }: ProfileContentProps) {
  const [tab, setTab] = useState<Tab>("Overview")

  const accent =
    accountType === "BUSINESS" ? "#D4AF37" :
    accountType === "ADMIN"    ? "#f87171" :
    "#38bdf8"
  const accentBg =
    accountType === "BUSINESS" ? "rgba(212,175,55,0.10)"  :
    accountType === "ADMIN"    ? "rgba(248,113,113,0.10)" :
    "rgba(56,189,248,0.10)"
  const accentBorder =
    accountType === "BUSINESS" ? "rgba(212,175,55,0.25)"  :
    accountType === "ADMIN"    ? "rgba(248,113,113,0.25)" :
    "rgba(56,189,248,0.25)"

  const shared: Accent = { accent, accentBg, accentBorder }

  return (
    <div className="min-h-screen px-4 py-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <p className="ea-section-tag mb-1">My Account</p>
        <h1 className="text-3xl font-black tracking-tight text-white">Profile &amp; Documents</h1>
        <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.35)" }}>
          Manage your identity, documents, and applications in one place.
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 overflow-x-auto pb-px mb-6" style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: "0.875rem",
        padding: "4px",
      }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="flex-shrink-0 rounded-xl px-4 py-2 text-xs font-bold transition-all duration-200 whitespace-nowrap"
            style={tab === t
              ? { background: accent, color: "#05091a", boxShadow: `0 0 16px ${accentBg}` }
              : { color: "rgba(255,255,255,0.45)" }}>
            {t}
          </button>
        ))}
      </div>

      {/* Tab content — sub-components are all defined above, guaranteed to exist */}
      {tab === "Overview"     && <OverviewTab     user={user} accountType={accountType} documents={documents} applicationRows={applicationRows} {...shared} />}
      {tab === "Edit Profile" && <EditProfileTab  user={user} {...shared} />}
      {tab === "Documents"    && <DocumentsTab    accountType={accountType} documents={documents} {...shared} />}
      {tab === "Applications" && <ApplicationsTab applicationRows={applicationRows} {...shared} />}
      {tab === "Downloads"    && <DownloadsTab    downloads={downloads} accountType={accountType} {...shared} />}
    </div>
  )
}
