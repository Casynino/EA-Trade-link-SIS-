"use client"

import { useState } from "react"
import { RefreshCw, CheckCircle2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export function SyncFeedButton() {
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const { toast } = useToast()

  async function sync() {
    setLoading(true)
    try {
      const res = await fetch("/api/scholarships", { method: "PUT" })
      const data = await res.json()
      setDone(true)
      toast({
        title: `Feed synced — ${data.synced} scholarships now live`,
        description: "Home page and student dashboard updated.",
      })
      setTimeout(() => setDone(false), 5000)
    } catch {
      toast({ title: "Sync failed", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={sync}
      disabled={loading}
      className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold transition-all hover:opacity-90 disabled:opacity-50"
      style={{
        background: done ? "rgba(52,211,153,0.12)" : "rgba(255,255,255,0.06)",
        border: `1px solid ${done ? "rgba(52,211,153,0.3)" : "rgba(255,255,255,0.1)"}`,
        color: done ? "#34d399" : "rgba(255,255,255,0.6)",
      }}
    >
      {done
        ? <><CheckCircle2 className="h-3.5 w-3.5" />Synced</>
        : <><RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />{loading ? "Syncing…" : "Sync Feed"}</>
      }
    </button>
  )
}
