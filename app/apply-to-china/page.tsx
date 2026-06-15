import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import Link from "next/link"
import { GraduationCap, ArrowRight, Globe2 } from "lucide-react"
import { PageBackground } from "@/components/ui/page-background"
import { WrongRoleBlock } from "@/components/wrong-role-block"

export const dynamic = "force-dynamic"

export default async function StudyInChinaPage() {
  const session = await auth()

  // Block business users — they cannot apply to student programmes
  if (session?.user && session.user.accountType === "BUSINESS") {
    return (
      <WrongRoleBlock
        currentRole="BUSINESS"
        requiredRole="STUDENT"
        oppTitle="Study in China programmes"
        backHref="/"
        variant="page"
      />
    )
  }

  // Fetch all active scholarship opportunities
  const scholarships = await db.opportunity.findMany({
    where: { isActive: true, type: "SCHOLARSHIP" },
    orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
    select: { id: true, title: true, organization: true, degreeLevel: true, location: true, isFeatured: true },
  })

  return (
    <div className="min-h-screen relative" style={{ background: "#05091a" }}>
      <PageBackground />
      <div className="relative z-10 mx-auto max-w-3xl px-6 py-16 space-y-10">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl mx-auto"
            style={{ background: "rgba(56,189,248,0.12)", border: "1px solid rgba(56,189,248,0.2)" }}>
            <GraduationCap className="h-8 w-8 text-sky-400" />
          </div>
          <h1 className="text-3xl font-black text-white">Study in China</h1>
          <p className="text-base text-white/50 max-w-md mx-auto">
            Choose a scholarship programme below to begin your application. All applications go through the same unified process.
          </p>
        </div>

        {/* Scholarship list */}
        <div className="grid gap-3 sm:grid-cols-2">
          {scholarships.map((s) => (
            <Link key={s.id} href={session ? `/apply/${s.id}` : `/login?redirect=/apply/${s.id}`}
              className="group rounded-2xl p-5 flex items-start gap-3 transition-all hover:-translate-y-0.5"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)" }}>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                style={{ background: "rgba(56,189,248,0.1)" }}>
                <GraduationCap className="h-5 w-5 text-sky-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {s.isFeatured && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(212,175,55,0.15)", color: "#D4AF37" }}>Featured</span>
                  )}
                  {s.degreeLevel && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(56,189,248,0.12)", color: "#38bdf8" }}>{s.degreeLevel}</span>
                  )}
                </div>
                <p className="font-semibold text-sm text-white leading-snug">{s.title}</p>
                <p className="text-xs text-white/40 mt-0.5">{s.organization}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-white/20 group-hover:text-sky-400 transition-colors shrink-0 mt-1" />
            </Link>
          ))}
        </div>

        {scholarships.length === 0 && (
          <div className="text-center py-12 text-white/30">
            <p>No scholarship programmes available right now. Check back soon.</p>
          </div>
        )}

        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-white/30 hover:text-white/60 transition-colors">
            <Globe2 className="h-4 w-4" />Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}
