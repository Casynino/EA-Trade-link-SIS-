"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Plane, CheckCircle2, Loader2, FileText } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { PageHeader } from "@/components/shared/page-header"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"

const visaSchema = z.object({
  travelDate: z.string().min(1, "Required"),
  returnDate: z.string().min(1, "Required"),
  purpose: z.string().min(20, "Minimum 20 characters"),
  companyName: z.string().optional(),
  companyAddress: z.string().optional(),
  hostCompany: z.string().optional(),
  hostAddress: z.string().optional(),
})

type VisaForm = z.infer<typeof visaSchema>

export default function VisaPageClient() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<VisaForm>({
    resolver: zodResolver(visaSchema),
  })

  const onSubmit = async (data: VisaForm) => {
    setLoading(true)
    try {
      const res = await fetch("/api/visa/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (res.ok) {
        setSubmitted(true)
        toast({ title: "Application submitted!", description: "Our team will review your application." })
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
        <h2 className="text-xl font-bold mb-2">Visa Application Submitted!</h2>
        <p className="text-muted-foreground max-w-md mb-6">Your application is under review. You&apos;ll be notified of any updates or if additional documents are required.</p>
        <div className="flex gap-3">
          <Button asChild><Link href="/visa/my-applications">Track Status</Link></Button>
          <Button variant="outline" onClick={() => setSubmitted(false)}>Apply Again</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader title="China Business Visa" description="Apply for a China business visa through EA Trade Link" />

      {/* Process steps */}
      <div className="grid gap-3 sm:grid-cols-4">
        {["Submit Application", "Document Review", "Embassy Processing", "Visa Issued"].map((step, i) => (
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
              <Plane className="h-4 w-4" /> Travel Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Travel Date</Label>
                <Input type="date" {...register("travelDate")} />
                {errors.travelDate && <p className="text-xs text-destructive">{errors.travelDate.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Return Date</Label>
                <Input type="date" {...register("returnDate")} />
                {errors.returnDate && <p className="text-xs text-destructive">{errors.returnDate.message}</p>}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Purpose of Visit</Label>
              <Textarea rows={3} placeholder="Describe your business purpose..." {...register("purpose")} />
              {errors.purpose && <p className="text-xs text-destructive">{errors.purpose.message}</p>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Company Information</CardTitle>
            <CardDescription>Your company and host company details in China</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Your Company Name (optional)</Label>
                <Input placeholder="Your company name" {...register("companyName")} />
              </div>
              <div className="space-y-1.5">
                <Label>Your Company Address (optional)</Label>
                <Input placeholder="Dar es Salaam, Tanzania" {...register("companyAddress")} />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Host Company in China (optional)</Label>
                <Input placeholder="Chinese company name" {...register("hostCompany")} />
              </div>
              <div className="space-y-1.5">
                <Label>Host Company Address (optional)</Label>
                <Input placeholder="Guangzhou, China" {...register("hostAddress")} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" /> Required Documents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {["Valid passport (6+ months validity)", "Invitation letter from Chinese company", "Company registration documents", "Travel itinerary", "Bank statement"].map((doc) => (
                <li key={doc} className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  {doc}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-muted-foreground">Documents can be uploaded after application submission</p>
          </CardContent>
        </Card>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Submit Visa Application
        </Button>
      </form>
    </div>
  )
}
