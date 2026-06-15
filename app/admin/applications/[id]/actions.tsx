"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import {
  Loader2, CheckCircle2, XCircle, FileText, Clock,
  ArrowUpRight, DollarSign, ShieldCheck, Send, MessageSquare,
} from "lucide-react"

// Workflow stages shown as action buttons
const WORKFLOW_ACTIONS = [
  {
    value: "UNDER_REVIEW",
    label: "Mark Under Review",
    icon: Clock,
    style: { background: "rgba(251,191,36,0.1)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.25)" },
  },
  {
    value: "DOCUMENTS_REQUIRED",
    label: "Request Documents",
    icon: FileText,
    style: { background: "rgba(251,146,60,0.1)", color: "#fb923c", border: "1px solid rgba(251,146,60,0.25)" },
  },
  {
    value: "SHORTLISTED",
    label: "Shortlist",
    icon: ArrowUpRight,
    style: { background: "rgba(192,132,252,0.1)", color: "#c084fc", border: "1px solid rgba(192,132,252,0.25)" },
  },
  {
    value: "ACCEPTED",
    label: "Approve Application",
    icon: CheckCircle2,
    style: { background: "rgba(52,211,153,0.1)", color: "#34d399", border: "1px solid rgba(52,211,153,0.25)" },
  },
  {
    value: "PAYMENT_PENDING",
    label: "Release Payment Request",
    icon: DollarSign,
    style: { background: "rgba(212,175,55,0.12)", color: "#D4AF37", border: "1px solid rgba(212,175,55,0.3)" },
  },
  {
    value: "PAYMENT_COMPLETED",
    label: "Confirm Payment Received",
    icon: ShieldCheck,
    style: { background: "rgba(52,211,153,0.1)", color: "#34d399", border: "1px solid rgba(52,211,153,0.25)" },
  },
  {
    value: "PROCESSING",
    label: "Mark Processing",
    icon: Loader2,
    style: { background: "rgba(167,139,250,0.1)", color: "#a78bfa", border: "1px solid rgba(167,139,250,0.25)" },
  },
  {
    value: "COMPLETED",
    label: "Mark Completed",
    icon: ShieldCheck,
    style: { background: "rgba(52,211,153,0.12)", color: "#34d399", border: "1px solid rgba(52,211,153,0.3)" },
  },
  {
    value: "REJECTED",
    label: "Reject Application",
    icon: XCircle,
    style: { background: "rgba(248,113,113,0.1)", color: "#f87171", border: "1px solid rgba(248,113,113,0.25)" },
  },
]

export function AdminApplicationActions({
  application,
  adminId,
}: {
  application: any
  adminId: string
}) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState<string | null>(null)
  const [notes, setNotes]           = useState(application.adminNotes ?? "")
  const [rejectionReason, setRejectionReason] = useState("")
  const [regFee, setRegFee]         = useState(application.registrationFee?.toString() ?? "")
  const [procFee, setProcFee]       = useState(application.processingFee?.toString() ?? "")
  const [admissionLetter, setAdmissionLetter] = useState(application.admissionLetter ?? "")
  const [msgContent, setMsgContent] = useState("")

  const isApproved   = ["ACCEPTED","PAYMENT_PENDING","PAYMENT_COMPLETED","PROCESSING","COMPLETED"].includes(application.status)
  const isRejected   = application.status === "REJECTED"
  const isCompleted  = application.status === "COMPLETED"

  async function patch(body: Record<string, unknown>, loadingKey: string) {
    setLoading(loadingKey)
    try {
      const res = await fetch(`/api/admin/applications/${application.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error("Failed")
      router.refresh()
      return true
    } catch {
      toast({ title: "Error", description: "Action failed. Please try again.", variant: "destructive" })
      return false
    } finally {
      setLoading(null)
    }
  }

  async function updateStatus(status: string) {
    const body: Record<string, unknown> = {
      status,
      adminNotes: notes,
    }
    if (status === "REJECTED")  body.rejectionReason = rejectionReason || "Application unsuccessful at this stage."
    if (status === "ACCEPTED") {
      if (regFee)  body.registrationFee = parseFloat(regFee)
      if (procFee) body.processingFee   = parseFloat(procFee)
      if (admissionLetter) body.admissionLetter = admissionLetter
    }
    const ok = await patch(body, status)
    if (ok) {
      const labels: Record<string,string> = {
        UNDER_REVIEW: "Marked as Under Review",
        DOCUMENTS_REQUIRED: "Document request sent to applicant",
        SHORTLISTED: "Applicant shortlisted",
        ACCEPTED: "Application approved — payment stage unlocked",
        PROCESSING: "Application moved to Processing",
        COMPLETED: "Application marked Completed",
        REJECTED: "Application rejected",
      }
      toast({ title: labels[status] ?? "Status updated" })
    }
  }

  async function saveNotes() {
    const ok = await patch({ adminNotes: notes }, "notes")
    if (ok) toast({ title: "Internal notes saved" })
  }

  async function sendMessage() {
    if (!msgContent.trim()) return
    setLoading("msg")
    try {
      const res = await fetch(`/api/admin/applications/${application.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: msgContent.trim() }),
      })
      if (!res.ok) throw new Error()
      setMsgContent("")
      router.refresh()
      toast({ title: "Message sent to applicant" })
    } catch {
      toast({ title: "Error", description: "Failed to send message.", variant: "destructive" })
    } finally {
      setLoading(null)
    }
  }

  async function confirmPayment() {
    const ok = await patch({ feePaid: true, status: "PAYMENT_COMPLETED" }, "payment")
    if (ok) toast({ title: "Payment confirmed — status moved to Payment Completed" })
  }

  return (
    <div className="space-y-4">
      {/* Message Applicant */}
      <Panel title="Message Applicant" subtitle="Visible to applicant in their dashboard">
        <Textarea
          value={msgContent}
          onChange={(e) => setMsgContent(e.target.value)}
          rows={3}
          placeholder="Write a message to the applicant…"
          className="resize-none text-sm"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.8)" }}
        />
        <ActionBtn onClick={sendMessage} loading={loading === "msg"} style={{ background: "rgba(96,165,250,0.12)", color: "#60a5fa", border: "1px solid rgba(96,165,250,0.25)" }}>
          <MessageSquare className="h-3.5 w-3.5" />Send Message
        </ActionBtn>
      </Panel>

      {/* Internal Notes */}
      <Panel title="Internal Notes" subtitle="Not visible to applicant">
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          placeholder="Add internal case notes, observations, assessment…"
          className="resize-none text-sm"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.8)" }}
        />
        <ActionBtn onClick={saveNotes} loading={loading === "notes"} style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <Send className="h-3.5 w-3.5" />Save Notes
        </ActionBtn>
      </Panel>

      {/* Fee Settings (shown when not yet approved or setting fees) */}
      {!isRejected && !isCompleted && (
        <Panel title="Fee Settings" subtitle="Set before approving. User pays after approval only.">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-[11px] text-muted-foreground">Registration Fee (TZS)</Label>
              <Input
                value={regFee}
                onChange={(e) => setRegFee(e.target.value)}
                type="number" placeholder="0" className="mt-1 h-8 text-sm"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}
              />
            </div>
            <div>
              <Label className="text-[11px] text-muted-foreground">Processing Fee (TZS)</Label>
              <Input
                value={procFee}
                onChange={(e) => setProcFee(e.target.value)}
                type="number" placeholder="0" className="mt-1 h-8 text-sm"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}
              />
            </div>
          </div>
        </Panel>
      )}

      {/* Admission Letter */}
      {!isRejected && !isCompleted && (
        <Panel title="Approval Document" subtitle="Pre-admission or pre-approval letter URL">
          <div>
            <Label className="text-[11px] text-muted-foreground">Document URL (optional)</Label>
            <Input
              value={admissionLetter}
              onChange={(e) => setAdmissionLetter(e.target.value)}
              placeholder="https://…"
              className="mt-1 h-8 text-sm"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}
            />
          </div>
        </Panel>
      )}

      {/* Rejection reason (only show if rejecting) */}
      {!isRejected && !isCompleted && (
        <Panel title="Rejection Notes" subtitle="Internal only — user sees a generic message">
          <Textarea
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            rows={2}
            placeholder="Internal reason for rejection (not shown to applicant)…"
            className="resize-none text-sm"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.8)" }}
          />
        </Panel>
      )}

      {/* Payment confirmation (only after approval and fees set) */}
      {isApproved && !application.feePaid && (application.registrationFee || application.processingFee) && (
        <Panel title="Confirm Payment" subtitle="Mark payment as received after verifying">
          <div className="rounded-xl p-3 mb-3"
            style={{ background: "rgba(212,175,55,0.06)", border: "1px solid rgba(212,175,55,0.15)" }}>
            <p className="text-xs text-muted-foreground mb-1">Total Due</p>
            <p className="text-lg font-black" style={{ color: "#D4AF37" }}>
              TZS {((application.registrationFee ?? 0) + (application.processingFee ?? 0)).toLocaleString()}
            </p>
          </div>
          <ActionBtn
            onClick={confirmPayment}
            loading={loading === "payment"}
            style={{ background: "rgba(212,175,55,0.12)", color: "#D4AF37", border: "1px solid rgba(212,175,55,0.25)" }}
          >
            <DollarSign className="h-3.5 w-3.5" />Confirm Payment Received
          </ActionBtn>
        </Panel>
      )}

      {/* Workflow actions */}
      {!isCompleted && !isRejected && (
        <Panel title="Update Status" subtitle="Move application through the workflow">
          <div className="grid gap-2">
            {WORKFLOW_ACTIONS.filter(a => a.value !== application.status).map((action) => {
              const Icon = action.icon
              return (
                <button
                  key={action.value}
                  onClick={() => updateStatus(action.value)}
                  disabled={!!loading}
                  className="flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-semibold text-left w-full transition-all hover:opacity-90 disabled:opacity-40"
                  style={action.style}
                >
                  {loading === action.value
                    ? <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                    : <Icon className="h-4 w-4 shrink-0" />
                  }
                  {action.label}
                </button>
              )
            })}
          </div>
        </Panel>
      )}

      {/* Closed states */}
      {(isCompleted || isRejected) && (
        <div className="rounded-2xl p-4 text-center"
          style={{ background: isCompleted ? "rgba(52,211,153,0.06)" : "rgba(248,113,113,0.06)", border: `1px solid ${isCompleted ? "rgba(52,211,153,0.15)" : "rgba(248,113,113,0.15)"}` }}>
          {isCompleted
            ? <><CheckCircle2 className="h-6 w-6 text-green-400 mx-auto mb-2" /><p className="text-sm font-semibold text-green-400">Case Completed</p></>
            : <><XCircle className="h-6 w-6 text-red-400 mx-auto mb-2" /><p className="text-sm font-semibold text-red-400">Case Closed — Rejected</p></>
          }
        </div>
      )}
    </div>
  )
}

// ── Small helpers ──────────────────────────────────────────────────────────────

function Panel({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
      <div className="px-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
        <p className="text-xs font-bold">{title}</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">{subtitle}</p>
      </div>
      <div className="p-4 space-y-3">{children}</div>
    </div>
  )
}

function ActionBtn({
  onClick, loading, style, children,
}: {
  onClick: () => void
  loading: boolean
  style: React.CSSProperties
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold w-full transition-all hover:opacity-90 disabled:opacity-40"
      style={style}
    >
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
      {children}
    </button>
  )
}
