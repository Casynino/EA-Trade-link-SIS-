"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Star } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export function AdminScholarshipToggle({
  id,
  isActive,
  isFeatured,
}: {
  id: string
  isActive: boolean
  isFeatured: boolean
}) {
  const [active, setActive] = useState(isActive)
  const [featured, setFeatured] = useState(isFeatured)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  async function toggle(field: "isActive" | "isFeatured", value: boolean) {
    setLoading(true)
    try {
      await fetch(`/api/scholarships/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      })
      if (field === "isActive") setActive(value)
      else setFeatured(value)
      toast({ title: value ? "Updated" : "Updated", description: field === "isActive" ? (value ? "Now visible to students" : "Hidden from students") : (value ? "Marked as featured" : "Removed from featured") })
      router.refresh()
    } catch {
      toast({ title: "Error", description: "Failed to update", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => toggle("isActive", !active)}
        disabled={loading}
        title={active ? "Hide from students" : "Show to students"}
        className="rounded p-1.5 transition-colors hover:bg-muted/50"
        style={{ color: active ? "#34d399" : "var(--muted-foreground)" }}>
        {active ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
      </button>
      <button
        onClick={() => toggle("isFeatured", !featured)}
        disabled={loading}
        title={featured ? "Remove featured" : "Mark as featured"}
        className="rounded p-1.5 transition-colors hover:bg-muted/50"
        style={{ color: featured ? "#D4AF37" : "var(--muted-foreground)" }}>
        <Star className={`h-3.5 w-3.5 ${featured ? "fill-current" : ""}`} />
      </button>
    </div>
  )
}
