"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Package, CheckCircle2, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PageHeader } from "@/components/shared/page-header"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"

const sourcingSchema = z.object({
  productName: z.string().min(2, "Required"),
  description: z.string().min(20, "Minimum 20 characters"),
  quantity: z.string().refine((v) => !isNaN(Number(v)) && Number(v) > 0, "Enter valid quantity"),
  unit: z.string().default("pieces"),
  budget: z.string().optional(),
  currency: z.string().default("USD"),
  specifications: z.string().optional(),
  targetDate: z.string().optional(),
})

type SourcingForm = z.infer<typeof sourcingSchema>

export default function SourcingPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<SourcingForm>({
    resolver: zodResolver(sourcingSchema),
    defaultValues: { unit: "pieces", currency: "USD" },
  })

  const onSubmit = async (data: SourcingForm) => {
    setLoading(true)
    try {
      const res = await fetch("/api/sourcing/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, quantity: Number(data.quantity), budget: data.budget ? Number(data.budget) : undefined }),
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
        <h2 className="text-xl font-bold mb-2">Sourcing Request Submitted!</h2>
        <p className="text-muted-foreground max-w-md mb-6">Our team will begin searching for suppliers and will send you a quotation within 2-3 business days.</p>
        <div className="flex gap-3">
          <Button asChild><Link href="/sourcing/my-requests">Track Status</Link></Button>
          <Button variant="outline" onClick={() => setSubmitted(false)}>New Request</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader title="Product Sourcing" description="Request product sourcing from China — we find the best suppliers for you" />

      <div className="grid gap-3 sm:grid-cols-4">
        {["Submit Request", "Supplier Search", "Quotation Sent", "Completed"].map((step, i) => (
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
              <Package className="h-4 w-4" /> Product Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Product Name</Label>
              <Input placeholder="e.g. LED Street Lights, Solar Panels, Fabric..." {...register("productName")} />
              {errors.productName && <p className="text-xs text-destructive">{errors.productName.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea rows={3} placeholder="Describe the product, quality requirements, features..." {...register("description")} />
              {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Quantity</Label>
                <Input type="number" placeholder="1000" {...register("quantity")} />
                {errors.quantity && <p className="text-xs text-destructive">{errors.quantity.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Unit</Label>
                <Select onValueChange={(v) => setValue("unit", v)} defaultValue="pieces">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["pieces", "kg", "tons", "meters", "boxes", "sets", "pairs"].map((u) => (
                      <SelectItem key={u} value={u}>{u}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Budget (optional)</Label>
                <Input type="number" placeholder="5000" {...register("budget")} />
              </div>
              <div className="space-y-1.5">
                <Label>Currency</Label>
                <Select onValueChange={(v) => setValue("currency", v)} defaultValue="USD">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["USD", "EUR", "CNY", "TZS"].map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Specifications & Timeline</CardTitle>
            <CardDescription>Optional but helps us find better matches</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Technical Specifications (optional)</Label>
              <Textarea rows={3} placeholder="Dimensions, materials, certifications, standards..." {...register("specifications")} />
            </div>
            <div className="space-y-1.5">
              <Label>Target Delivery Date (optional)</Label>
              <Input type="date" {...register("targetDate")} />
            </div>
          </CardContent>
        </Card>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Submit Sourcing Request
        </Button>
      </form>
    </div>
  )
}
