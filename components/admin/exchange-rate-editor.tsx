"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Save } from "lucide-react"

interface ExchangeRateEditorProps {
  currentRmbToTzs: number
  currentTzsToRmb: number
}

export function ExchangeRateEditor({ currentRmbToTzs, currentTzsToRmb }: ExchangeRateEditorProps) {
  const { toast } = useToast()
  const [rmbToTzs, setRmbToTzs] = useState(currentRmbToTzs.toString())
  const [tzsToRmb, setTzsToRmb] = useState(currentTzsToRmb.toString())
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/exchange/rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rmbToTzs: Number(rmbToTzs), tzsToRmb: Number(tzsToRmb) }),
      })
      if (res.ok) {
        toast({ title: "Rates updated!", description: "New exchange rates are now live." })
      } else {
        toast({ title: "Error", description: "Failed to update rates.", variant: "destructive" })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="text-base">Exchange Rates</CardTitle>
        <p className="text-xs text-muted-foreground">Update rates manually (offline)</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label className="text-xs">1 RMB = ? TZS</Label>
          <Input
            type="number"
            step="0.01"
            value={rmbToTzs}
            onChange={(e) => setRmbToTzs(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">1 TZS = ? RMB</Label>
          <Input
            type="number"
            step="0.000001"
            value={tzsToRmb}
            onChange={(e) => setTzsToRmb(e.target.value)}
          />
        </div>
        <Button onClick={handleSave} className="w-full" disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save Rates
        </Button>
      </CardContent>
    </Card>
  )
}
