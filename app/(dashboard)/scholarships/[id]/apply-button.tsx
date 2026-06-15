"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, CheckCircle2, ArrowRight, Send } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export function ScholarshipApplyButton({
  scholarshipId,
  existingStatus,
  levelColor,
  large = false,
}: {
  scholarshipId: string
  existingStatus: string | null
  levelColor: string
  large?: boolean
}) {
  const [loading, setLoading] = useState(false)
  const [applied, setApplied] = useState(!!existingStatus)
  const router = useRouter()
  const { toast } = useToast()

  async function handleApply() {
    setLoading(true)
    try {
      const res = await fetch("/api/scholarships/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scholarshipId }),
      })
      if (res.ok) {
        setApplied(true)
        toast({
          title: "Application submitted!",
          description: "Your application has been received by the International Education Processing Center. You will receive a response within 5 days.",
        })
        router.refresh()
      } else {
        const err = await res.json()
        toast({ title: "Error", description: err.error, variant: "destructive" })
      }
    } catch {
      toast({ title: "Error", description: "Something went wrong. Try again.", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  if (applied) {
    return (
      <div className={`flex items-center justify-center gap-2 rounded-xl font-bold text-green-400 ${large ? "py-3 text-sm" : "py-2 text-xs"}`}
        style={{ background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.2)" }}>
        <CheckCircle2 className={large ? "h-5 w-5" : "h-4 w-4"} />
        Application Submitted
      </div>
    )
  }

  return (
    <button
      onClick={handleApply}
      disabled={loading}
      className={`w-full flex items-center justify-center gap-2 rounded-xl font-black transition-all disabled:opacity-50 hover:scale-105 ${large ? "py-3 text-sm" : "py-2.5 text-xs"}`}
      style={{ background: levelColor, color: "#05091a" }}>
      {loading
        ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</>
        : large
        ? <><Send className="h-4 w-4" /> Submit My Application <ArrowRight className="h-4 w-4" /></>
        : <>Apply Now <ArrowRight className="h-3.5 w-3.5" /></>
      }
    </button>
  )
}
