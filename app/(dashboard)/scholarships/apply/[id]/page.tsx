"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Loader2, Upload, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"

const applySchema = z.object({
  gpa: z.string().refine((v) => !isNaN(Number(v)) && Number(v) >= 0 && Number(v) <= 4, "GPA must be 0-4"),
  degreeLevel: z.enum(["BACHELOR", "MASTER", "PHD", "LANGUAGE", "CERTIFICATE"]),
  fieldOfStudy: z.string().min(2, "Required"),
  languageAbility: z.array(z.string()).min(1, "Select at least one language"),
  personalStatement: z.string().min(100, "Minimum 100 characters"),
})

type ApplyForm = z.infer<typeof applySchema>

export default function ApplyScholarshipPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [scholarship, setScholarship] = useState<{ name: string; university: string } | null>(null)
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([])

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<ApplyForm>({
    resolver: zodResolver(applySchema),
    defaultValues: { languageAbility: [] },
  })

  useEffect(() => {
    fetch(`/api/scholarships/${params.id}`)
      .then((r) => r.json())
      .then((data) => setScholarship(data))
  }, [params.id])

  const toggleLanguage = (lang: string) => {
    setSelectedLanguages((prev) => {
      const next = prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]
      setValue("languageAbility", next)
      return next
    })
  }

  const onSubmit = async (data: ApplyForm) => {
    setLoading(true)
    try {
      const res = await fetch("/api/scholarships/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, scholarshipId: params.id, gpa: Number(data.gpa) }),
      })
      if (res.ok) {
        setSubmitted(true)
        toast({ title: "Application submitted!", description: "We'll review your application shortly." })
      } else {
        const err = await res.json()
        toast({ title: "Error", description: err.error, variant: "destructive" })
      }
    } catch {
      toast({ title: "Error", description: "Something went wrong.", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <CheckCircle2 className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Application Submitted!</h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          Your scholarship application has been received. Our team will review it and update you on the status.
        </p>
        <div className="flex gap-3">
          <Button asChild>
            <Link href="/scholarships/my-applications">View My Applications</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/scholarships">Browse More</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/scholarships"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-xl font-bold">Scholarship Application</h1>
          {scholarship && <p className="text-sm text-muted-foreground">{scholarship.name} · {scholarship.university}</p>}
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Academic Information</CardTitle>
            <CardDescription>Tell us about your academic background</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>GPA (out of 4.0)</Label>
                <Input placeholder="3.5" {...register("gpa")} />
                {errors.gpa && <p className="text-xs text-destructive">{errors.gpa.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Degree Level Applying For</Label>
                <Select onValueChange={(v) => setValue("degreeLevel", v as ApplyForm["degreeLevel"])}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select degree" />
                  </SelectTrigger>
                  <SelectContent>
                    {["BACHELOR", "MASTER", "PHD", "LANGUAGE", "CERTIFICATE"].map((d) => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.degreeLevel && <p className="text-xs text-destructive">{errors.degreeLevel.message}</p>}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Field of Study</Label>
              <Input placeholder="e.g. Computer Science, Medicine, Business" {...register("fieldOfStudy")} />
              {errors.fieldOfStudy && <p className="text-xs text-destructive">{errors.fieldOfStudy.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Language Proficiency</Label>
              <div className="flex flex-wrap gap-2">
                {["English", "Chinese (HSK 1-2)", "Chinese (HSK 3-4)", "Chinese (HSK 5-6)", "French"].map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => toggleLanguage(lang)}
                    className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
                      selectedLanguages.includes(lang)
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-input bg-background hover:bg-muted"
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
              {errors.languageAbility && <p className="text-xs text-destructive">{errors.languageAbility.message}</p>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Personal Statement</CardTitle>
            <CardDescription>Why do you want this scholarship? (min. 100 characters)</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              rows={6}
              placeholder="Describe your motivations, goals, and why you are a strong candidate for this scholarship..."
              {...register("personalStatement")}
            />
            {errors.personalStatement && <p className="text-xs text-destructive">{errors.personalStatement.message}</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Required Documents</CardTitle>
            <CardDescription>Upload your documents (passport, transcripts, CV, etc.) after submitting</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border-2 border-dashed border-muted-foreground/20 p-6 text-center">
              <Upload className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">Documents can be uploaded from your application dashboard</p>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" className="flex-1" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit Application
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
