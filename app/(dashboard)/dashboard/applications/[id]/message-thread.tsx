"use client"

import { useState, useRef, useEffect } from "react"
import { Send, MessageSquare, Loader2 } from "lucide-react"

interface Msg {
  id: string
  content: string
  isAdmin: boolean
  senderName: string
  createdAt: Date | string
}

function fmt(d: Date | string) {
  return new Date(d).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })
}

export function MessageThread({
  applicationId,
  initialMessages,
  canReply,
}: {
  applicationId: string
  initialMessages: Msg[]
  canReply: boolean
}) {
  const [messages, setMessages] = useState<Msg[]>(initialMessages)
  const [reply, setReply] = useState("")
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  async function handleSend() {
    if (!reply.trim() || sending) return
    setSending(true)
    setError(null)
    try {
      const res = await fetch(`/api/applications/${applicationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: reply.trim() }),
      })
      if (!res.ok) throw new Error("Failed to send")
      const msg = await res.json()
      setMessages((prev) => [
        ...prev,
        {
          id: msg.id,
          content: reply.trim(),
          isAdmin: false,
          senderName: "You",
          createdAt: new Date(),
        },
      ])
      setReply("")
    } catch {
      setError("Failed to send. Please try again.")
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>

      {/* Header */}
      <div className="flex items-center gap-2.5 px-5 py-4"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" }}>
        <MessageSquare className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-sm font-bold text-white">
          Messages {messages.length > 0 && <span style={{ color: "rgba(255,255,255,0.3)" }}>({messages.length})</span>}
        </h2>
      </div>

      <div className="p-5 space-y-3">
        {messages.length === 0 ? (
          <div className="rounded-xl py-10 text-center"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.08)" }}>
            <MessageSquare className="h-7 w-7 mx-auto mb-2" style={{ color: "rgba(255,255,255,0.15)" }} />
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>No messages yet.</p>
            <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.2)" }}>
              Our team will reach out here when there are updates on your application.
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {messages.map((msg) => (
              <div key={msg.id}
                className={`rounded-xl px-4 py-3 ${msg.isAdmin ? "" : "ml-6"}`}
                style={{
                  background: msg.isAdmin ? "rgba(96,165,250,0.07)" : "rgba(255,255,255,0.04)",
                  border: `1px solid ${msg.isAdmin ? "rgba(96,165,250,0.15)" : "rgba(255,255,255,0.07)"}`,
                }}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-bold"
                    style={{ color: msg.isAdmin ? "#60a5fa" : "rgba(255,255,255,0.4)" }}>
                    {msg.isAdmin ? `${msg.senderName} (EA Trade Link)` : msg.senderName}
                  </p>
                  <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.2)" }}>{fmt(msg.createdAt)}</p>
                </div>
                <p className="text-sm leading-relaxed whitespace-pre-wrap"
                  style={{ color: "rgba(255,255,255,0.65)" }}>{msg.content}</p>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        )}

        {/* Reply box */}
        {canReply && (
          <div className="pt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: "rgba(255,255,255,0.25)" }}>
              Reply to EA Trade Link
            </p>
            <div className="flex gap-2">
              <textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSend()
                }}
                rows={3}
                placeholder="Type your message… (Ctrl+Enter to send)"
                className="flex-1 resize-none rounded-xl px-3 py-2.5 text-sm outline-none"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "rgba(255,255,255,0.8)",
                }}
              />
              <button
                onClick={handleSend}
                disabled={!reply.trim() || sending}
                className="self-end flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-bold transition-all hover:opacity-90 disabled:opacity-40"
                style={{ background: "rgba(96,165,250,0.15)", color: "#60a5fa", border: "1px solid rgba(96,165,250,0.25)" }}>
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </div>
            {error && <p className="text-xs text-red-400 mt-1.5">{error}</p>}
            <p className="text-[10px] mt-1.5" style={{ color: "rgba(255,255,255,0.2)" }}>
              Our team typically responds within 24–48 hours.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
