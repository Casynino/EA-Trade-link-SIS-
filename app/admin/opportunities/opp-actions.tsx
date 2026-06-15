"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Trash2, Copy, Archive, ArchiveRestore, MoreHorizontal } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export function OppActions({ id, isActive }: { id: string; isActive: boolean }) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  async function call(method: string, body?: object) {
    setBusy(true)
    setOpen(false)
    try {
      const res = await fetch(`/api/admin/opportunities/${id}`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      })
      if (!res.ok) throw new Error(await res.text())
      router.refresh()
    } catch (e) {
      toast({ title: "Error", description: String(e), variant: "destructive" })
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this opportunity? This cannot be undone.")) return
    await call("DELETE")
    toast({ title: "Opportunity deleted" })
  }

  async function handleDuplicate() {
    await call("POST")
    toast({ title: "Duplicated — find it at the bottom as inactive" })
  }

  async function handleArchive() {
    await call("PATCH", { isActive: !isActive })
    toast({ title: isActive ? "Opportunity hidden" : "Opportunity activated" })
  }

  return (
    <div className="relative">
      <button
        disabled={busy}
        onClick={() => setOpen(!open)}
        className="rounded-lg p-1.5 transition-colors hover:bg-white/[0.08] text-white/40 hover:text-white/80 disabled:opacity-40"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div
            className="absolute right-0 top-8 z-20 w-40 rounded-xl p-1 shadow-xl"
            style={{
              background: "rgba(10,18,48,0.97)",
              border: "1px solid rgba(255,255,255,0.1)",
              backdropFilter: "blur(16px)",
            }}
          >
            {[
              { label: "Duplicate",  icon: Copy,           action: handleDuplicate },
              { label: isActive ? "Archive" : "Activate", icon: isActive ? Archive : ArchiveRestore, action: handleArchive },
              { label: "Delete",     icon: Trash2,          action: handleDelete,   danger: true },
            ].map(({ label, icon: Icon, action, danger }) => (
              <button
                key={label}
                onClick={action}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors"
                style={{ color: danger ? "#f87171" : "rgba(255,255,255,0.7)" }}
                onMouseEnter={e => (e.currentTarget.style.background = danger ? "rgba(248,113,113,0.08)" : "rgba(255,255,255,0.06)")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export function ToggleActiveButton({ id, isActive }: { id: string; isActive: boolean }) {
  const [active, setActive] = useState(isActive)
  const [busy, setBusy] = useState(false)

  async function toggle() {
    setBusy(true)
    try {
      await fetch(`/api/admin/opportunities/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !active }),
      })
      setActive(!active)
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={busy}
      className="relative inline-flex h-5 w-9 items-center rounded-full transition-all disabled:opacity-50"
      style={{ background: active ? "rgba(52,211,153,0.3)" : "rgba(255,255,255,0.1)" }}
    >
      <span
        className="inline-block h-3.5 w-3.5 rounded-full transition-transform"
        style={{
          background: active ? "#34d399" : "rgba(255,255,255,0.4)",
          transform: active ? "translateX(20px)" : "translateX(2px)",
        }}
      />
    </button>
  )
}
