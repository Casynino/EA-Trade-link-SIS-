"use client"

import { useState, useEffect, useRef } from "react"
import { Bell, CheckCheck, ExternalLink } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface Notification {
  id: string
  type: string
  title: string
  message: string
  link: string | null
  isRead: boolean
  createdAt: string
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

const TYPE_COLORS: Record<string, string> = {
  APPLICATION_SUBMITTED:  "#38bdf8",
  APPLICATION_ACCEPTED:   "#34d399",
  APPLICATION_REJECTED:   "#f87171",
  APPLICATION_UNDER_REVIEW: "#facc15",
  APPLICATION_SHORTLISTED: "#a78bfa",
  APPLICATION_DOCUMENTS_REQUIRED: "#fb923c",
  APPLICATION_PROCESSING: "#60a5fa",
  APPLICATION_COMPLETED:  "#34d399",
}

export function NotificationBell() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const unread = notifications.filter((n) => !n.isRead).length

  async function fetchNotifications() {
    setLoading(true)
    try {
      const res = await fetch("/api/notifications")
      if (res.ok) setNotifications(await res.json())
    } finally {
      setLoading(false)
    }
  }

  async function markRead(id: string) {
    await fetch(`/api/notifications/${id}`, { method: "PATCH" })
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n))
  }

  async function markAllRead() {
    const unreadIds = notifications.filter((n) => !n.isRead).map((n) => n.id)
    await Promise.all(unreadIds.map((id) => fetch(`/api/notifications/${id}`, { method: "PATCH" })))
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
  }

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [open])

  function handleNotifClick(n: Notification) {
    markRead(n.id)
    if (n.link) {
      router.push(n.link)
      setOpen(false)
    }
  }

  return (
    <div ref={ref} className="relative">
      {/* Bell button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white leading-none">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          className="absolute right-0 top-10 z-50 w-80 rounded-xl shadow-2xl overflow-hidden"
          style={{ background: "rgba(8,15,40,0.97)", border: "1px solid rgba(255,255,255,0.09)", backdropFilter: "blur(20px)" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            <span className="text-[13px] font-semibold text-foreground">Notifications</span>
            {unread > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">Loading…</div>
            ) : notifications.length === 0 ? (
              <div className="py-10 text-center">
                <Bell className="h-6 w-6 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => {
                const dot = TYPE_COLORS[n.type] ?? "#94a3b8"
                return (
                  <button
                    key={n.id}
                    onClick={() => handleNotifClick(n)}
                    className={`w-full text-left px-4 py-3 border-b flex gap-3 transition-colors hover:bg-white/[0.04] ${!n.isRead ? "" : ""}`}
                    style={{ borderColor: "rgba(255,255,255,0.05)", background: !n.isRead ? "rgba(96,165,250,0.06)" : undefined }}
                  >
                    {/* Dot */}
                    <div className="mt-1 shrink-0">
                      <div className="h-2 w-2 rounded-full mt-0.5" style={{ background: n.isRead ? "#cbd5e1" : dot }} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className={`text-[12px] font-semibold leading-snug ${n.isRead ? "text-muted-foreground" : "text-foreground"}`}>
                        {n.title}
                      </p>
                      <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5 line-clamp-2">
                        {n.message}
                      </p>
                      <p className="text-[10px] text-muted-foreground/60 mt-1">{timeAgo(n.createdAt)}</p>
                    </div>

                    {n.link && <ExternalLink className="h-3 w-3 text-muted-foreground/40 mt-1 shrink-0" />}
                  </button>
                )
              })
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2.5 border-t text-center" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
              <Link
                href="/dashboard/applications"
                onClick={() => setOpen(false)}
                className="text-[11px] text-primary font-medium hover:underline"
              >
                View all applications →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
