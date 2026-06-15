"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { ArrowLeftRight, TrendingUp, Info, CheckCircle2, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PageHeader } from "@/components/shared/page-header"
import { useToast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const exchangeSchema = z.object({
  fullName: z.string().min(2, "Required"),
  phone: z.string().min(10, "Valid phone required"),
  email: z.string().email("Valid email required"),
  direction: z.enum(["RMB_TO_TZS", "TZS_TO_RMB"]),
  amount: z.string().refine((v) => !isNaN(Number(v)) && Number(v) > 0, "Enter valid amount"),
  notes: z.string().optional(),
})

type ExchangeForm = z.infer<typeof exchangeSchema>

export default function ExchangePage() {
  const { toast } = useToast()
  const [rates, setRates] = useState({ rmbToTzs: 390.5, tzsToRmb: 0.00256 })
  const [calcAmount, setCalcAmount] = useState("")
  const [calcDir, setCalcDir] = useState<"RMB_TO_TZS" | "TZS_TO_RMB">("RMB_TO_TZS")
  const [calcResult, setCalcResult] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<ExchangeForm>({
    resolver: zodResolver(exchangeSchema),
    defaultValues: { direction: "RMB_TO_TZS" },
  })

  useEffect(() => {
    fetch("/api/exchange/rates").then((r) => r.json()).then((d) => {
      if (d.rmbToTzs) setRates(d)
    })
  }, [])

  const handleCalculate = () => {
    const amount = Number(calcAmount)
    if (!calcAmount || isNaN(amount)) return
    if (calcDir === "RMB_TO_TZS") {
      setCalcResult(`${amount.toLocaleString()} RMB = ${(amount * rates.rmbToTzs).toLocaleString("en-TZ", { maximumFractionDigits: 0 })} TZS`)
    } else {
      setCalcResult(`${amount.toLocaleString()} TZS = ${(amount * rates.tzsToRmb).toLocaleString("zh-CN", { maximumFractionDigits: 4 })} RMB`)
    }
  }

  const onSubmit = async (data: ExchangeForm) => {
    setLoading(true)
    try {
      const res = await fetch("/api/exchange/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, amount: Number(data.amount) }),
      })
      if (res.ok) {
        setSubmitted(true)
        toast({ title: "Request submitted!", description: "We'll contact you shortly to confirm." })
      } else {
        const err = await res.json()
        toast({ title: "Error", description: err.error || "Something went wrong.", variant: "destructive" })
      }
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full"
          style={{ background: "rgba(52,211,153,0.12)" }}>
          <CheckCircle2 className="h-8 w-8" style={{ color: "#34d399" }} />
        </div>
        <h2 className="text-xl font-bold mb-2">Exchange Request Submitted!</h2>
        <p className="text-muted-foreground max-w-md mb-6">
          Our team will contact you within 24 hours to confirm the rate and schedule the transaction.
        </p>
        <Button onClick={() => setSubmitted(false)}>Submit Another Request</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader
        title="Money Exchange"
        description="RMB ↔ TZS currency exchange service"
      />

      {/* Rate cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="ea-card p-4" style={{ borderColor: "rgba(96,165,250,0.2)" }}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full"
              style={{ background: "rgba(96,165,250,0.12)" }}>
              <span className="text-sm font-bold" style={{ color: "#60a5fa" }}>¥</span>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">1 RMB equals</p>
              <p className="text-2xl font-bold" style={{ color: "#60a5fa" }}>{rates.rmbToTzs.toFixed(2)} <span className="text-sm font-normal text-muted-foreground">TZS</span></p>
            </div>
          </div>
        </div>
        <div className="ea-card p-4" style={{ borderColor: "rgba(52,211,153,0.2)" }}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full"
              style={{ background: "rgba(52,211,153,0.12)" }}>
              <span className="text-sm font-bold" style={{ color: "#34d399" }}>Tsh</span>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">1,000 TZS equals</p>
              <p className="text-2xl font-bold" style={{ color: "#34d399" }}>{(rates.tzsToRmb * 1000).toFixed(2)} <span className="text-sm font-normal text-muted-foreground">RMB</span></p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl p-3 text-xs flex items-start gap-2"
        style={{ background: "rgba(251,146,60,0.08)", border: "1px solid rgba(251,146,60,0.2)" }}>
        <Info className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "#fb923c" }} />
        <span style={{ color: "rgba(255,255,255,0.6)" }}>
          <strong style={{ color: "#fb923c" }}>Disclaimer:</strong> Rates shown are indicative. Final rates are confirmed by EA Trade Link before each transaction. This is an offline service managed manually by our team.
        </span>
      </div>

      <Tabs defaultValue="calculator">
        <TabsList>
          <TabsTrigger value="calculator">Calculator</TabsTrigger>
          <TabsTrigger value="request">Request Exchange</TabsTrigger>
        </TabsList>

        <TabsContent value="calculator" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Currency Calculator</CardTitle>
              <CardDescription>Estimate how much you&apos;ll receive</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Direction</Label>
                  <Select value={calcDir} onValueChange={(v) => { setCalcDir(v as typeof calcDir); setCalcResult(null) }}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="RMB_TO_TZS">RMB → TZS</SelectItem>
                      <SelectItem value="TZS_TO_RMB">TZS → RMB</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Amount ({calcDir === "RMB_TO_TZS" ? "RMB" : "TZS"})</Label>
                  <Input
                    type="number"
                    placeholder="Enter amount"
                    value={calcAmount}
                    onChange={(e) => { setCalcAmount(e.target.value); setCalcResult(null) }}
                  />
                </div>
              </div>
              <Button onClick={handleCalculate} className="w-full">
                <ArrowLeftRight className="mr-2 h-4 w-4" />
                Calculate
              </Button>
              {calcResult && (
                <div className="rounded-lg bg-primary/5 p-4 text-center">
                  <p className="text-lg font-bold text-primary">{calcResult}</p>
                  <p className="text-xs text-muted-foreground mt-1">* Indicative rate. Actual rate confirmed by our team.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="request" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Submit Exchange Request</CardTitle>
              <CardDescription>Fill in your details and we&apos;ll contact you</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Full Name</Label>
                    <Input placeholder="Your full name" {...register("fullName")} />
                    {errors.fullName && <p className="text-xs text-destructive">{errors.fullName.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label>Phone Number</Label>
                    <Input placeholder="+255..." {...register("phone")} />
                    {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input type="email" placeholder="you@example.com" {...register("email")} />
                  {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Exchange Direction</Label>
                    <Select onValueChange={(v) => setValue("direction", v as ExchangeForm["direction"])} defaultValue="RMB_TO_TZS">
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="RMB_TO_TZS">RMB → TZS (Sell RMB)</SelectItem>
                        <SelectItem value="TZS_TO_RMB">TZS → RMB (Buy RMB)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Amount</Label>
                    <Input type="number" placeholder="0" {...register("amount")} />
                    {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Notes (optional)</Label>
                  <Textarea placeholder="Any additional notes or preferences..." rows={3} {...register("notes")} />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Submit Exchange Request
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
