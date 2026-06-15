"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Factory, CheckCircle2, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { PageHeader } from "@/components/shared/page-header"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"

const factorySchema = z.object({
  industry: z.string().min(2, "Required"),
  location: z.string().min(2, "Required"),
  visitDate: z.string().min(1, "Required"),
  duration: z.string().min(1, "Required"),
  groupSize: z.string().refine((v) => !isNaN(Number(v)) && Number(v) > 0, "Enter valid number"),
  purpose: z.string().min(20, "Minimum 20 characters"),
  factoryNames: z.string().optional(),
})

type FactoryForm = z.infer<typeof factorySchema>

export default function FactoryVisitsPageClient() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FactoryForm>({
    resolver: zodResolver(factorySchema),
  })

  const onSubmit = async (data: FactoryForm) => {
    setLoading(true)
    try {
      const res = await fetch("/api/factory-visits/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          groupSize: Number(data.groupSize),
          factoryNames: data.factoryNames ? data.factoryNames.split(",").map((s) => s.trim()) : [],
        }),
      })
      if (res.ok) {
        setSubmitted(true)
      } else {
        const err = await res.json()
        toast({ title: "Error", description: err.error, variant: "destructive" })
      }
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <CheckCircle2 className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-xl font-bold mb-2">Factory Visit Request Submitted!</h2>
        <p className="text-muted-foreground max-w-md mb-6">Our team will plan your itinerary and send you a quotation within 3-5 business days.</p>
        <div className="flex gap-3">
          <Button asChild><Link href="/factory-visits/my-requests">Track Status</Link></Button>
          <Button variant="outline" onClick={() => setSubmitted(false)}>New Request</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader title="Factory Visits" description="Plan and book factory visits in China with expert guidance" />

      <div className="grid gap-3 sm:grid-cols-4">
        {["Submit Request", "Planning", "Quotation Sent", "Confirmed"].map((step, i) => (
          <div key={step} className="flex flex-col items-center text-center gap-1.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white text-xs font-bold">{i + 1}</div>
            <p className="text-xs text-muted-foreground leading-tight">{step}</p>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Factory className="h-4 w-4" /> Visit Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Industry / Product Type</Label>
                <Input placeholder="e.g. Electronics, Textiles, Machinery" {...register("industry")} />
                {errors.industry && <p className="text-xs text-destructive">{errors.industry.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Location in China</Label>
                <Input placeholder="e.g. Guangzhou, Shenzhen, Yiwu" {...register("location")} />
                {errors.location && <p className="text-xs text-destructive">{errors.location.message}</p>}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Visit Date</Label>
                <Input type="date" {...register("visitDate")} />
                {errors.visitDate && <p className="text-xs text-destructive">{errors.visitDate.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Duration</Label>
                <Input placeholder="e.g. 3 days, 1 week" {...register("duration")} />
                {errors.duration && <p className="text-xs text-destructive">{errors.duration.message}</p>}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Group Size</Label>
              <Input type="number" placeholder="2" min="1" {...register("groupSize")} />
              {errors.groupSize && <p className="text-xs text-destructive">{errors.groupSize.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Specific Factories (optional, comma separated)</Label>
              <Input placeholder="ABC Electronics, XYZ Textile Co." {...register("factoryNames")} />
            </div>
            <div className="space-y-1.5">
              <Label>Purpose of Visit</Label>
              <Textarea rows={4} placeholder="Describe what you want to achieve from this factory visit..." {...register("purpose")} />
              {errors.purpose && <p className="text-xs text-destructive">{errors.purpose.message}</p>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">What We Include</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {["Factory pre-screening and verification", "Interpreter/translator service", "Transportation within China", "Itinerary planning", "Post-visit report and supplier contacts"].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  {item}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Submit Factory Visit Request
        </Button>
      </form>
    </div>
  )
}
