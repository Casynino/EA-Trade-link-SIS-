import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { notFound } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { TYPE_CONFIG } from "@/lib/opp-types"
import {
  GraduationCap, MapPin, Clock, Users, CheckCircle2, ArrowLeft, ArrowRight,
  Factory, Calendar, Globe2, Star, Award, FileText, AlertCircle,
  TrendingUp, Briefcase, Plane, ShieldCheck, Home, DollarSign, X,
  CreditCard, Info,
} from "lucide-react"
import { StarfieldBg } from "@/components/ui/starfield-bg"
import { FUNDING_TYPE_META } from "@/types/scholarship"
import type { ScholarshipFundingType } from "@/types/scholarship"
import { parseFinancialModel, hasFinancialContent, FUNDING_TYPE_META as FM_META, CATEGORY_LABELS } from "@/lib/financial-model"
import type { FinancialModel, BenefitItem } from "@/lib/financial-model"
import { canApplyForOpp, requiredRoleForOpp } from "@/lib/opp-access"
import { WrongRoleBlock } from "@/components/wrong-role-block"

const FALLBACK_IMAGES: Record<string, string> = {
  SCHOLARSHIP:      "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1600&auto=format&fit=crop&q=80",
  JOB:              "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=1600&auto=format&fit=crop&q=80",
  BUSINESS_VISA:    "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1600&auto=format&fit=crop&q=80",
  FACTORY_VISIT:    "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1600&auto=format&fit=crop&q=80",
  CANTON_FAIR:      "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1600&auto=format&fit=crop&q=80",
  TRADE_EXHIBITION: "https://images.unsplash.com/photo-1591115765373-5207764f72e7?w=1600&auto=format&fit=crop&q=80",
  CONFERENCE:       "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=1600&auto=format&fit=crop&q=80",
  EXCHANGE:         "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1600&auto=format&fit=crop&q=80",
  PRODUCT_SOURCING: "https://images.unsplash.com/photo-1553413077-190dd305871c?w=1600&auto=format&fit=crop&q=80",
}

const DOCS_REQUIRED: Record<string, string[]> = {
  SCHOLARSHIP:      ["Valid Passport (6+ months)", "Academic Transcripts", "High School / Degree Certificate", "Personal Statement", "Medical Certificate", "2x Passport Photos"],
  JOB:              ["Valid Passport", "CV / Resume", "Work Experience Letters", "Certificates / Diplomas", "Medical Certificate"],
  BUSINESS_VISA:    ["Valid Passport (6+ months)", "Company Registration Docs", "Bank Statement (3 months)", "Invitation Letter", "Business Plan (optional)"],
  FACTORY_VISIT:    ["Valid Passport", "Company Registration (optional)", "Business Intent Letter"],
  CANTON_FAIR:      ["Valid Passport", "Business Card / Company Letter", "Registration Form"],
  TRADE_EXHIBITION: ["Valid Passport", "Company Letter", "Event Registration"],
  CONFERENCE:       ["Valid Passport", "Company / Institution Letter", "Abstract (if presenting)"],
  EXCHANGE:         ["Valid ID", "Phone Number", "Amount to Exchange"],
  PRODUCT_SOURCING: ["Valid Passport", "Company Registration (optional)", "Product Specifications", "Business Intent Letter"],
}

const glassCard = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "1rem",
  backdropFilter: "blur(8px)",
} as React.CSSProperties

export default async function OpportunityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [opp, session] = await Promise.all([
    db.opportunity.findUnique({ where: { id } }),
    auth(),
  ])
  if (!opp) notFound()

  const cfg = TYPE_CONFIG[opp.type] ?? TYPE_CONFIG.SCHOLARSHIP
  const Icon = cfg.icon
  const heroImg = opp.imageUrl || FALLBACK_IMAGES[opp.type] || FALLBACK_IMAGES.SCHOLARSHIP
  const docs = DOCS_REQUIRED[opp.type] ?? []

  // Role-based access check
  const accountType  = session?.user?.accountType ?? ""
  const userCanApply = !session?.user || canApplyForOpp(accountType, opp.type)
  const requiredRole = requiredRoleForOpp(opp.type)

  let userApplication = null
  if (session?.user?.id && userCanApply) {
    userApplication = await db.application.findFirst({
      where: { userId: session.user.id, opportunityId: id },
    })
  }

  // For scholarships: fetch the rich scholarship record (same id) to get structured financials
  let scholarshipFinancials: Record<string, unknown> | null = null
  let scholarshipData: Record<string, unknown> | null = null
  if (opp.type === "SCHOLARSHIP") {
    const rows = await db.$queryRaw<Record<string, unknown>[]>`
      SELECT financialsJson, requirementsJson, applicationHighlightsJson, admissionProcessJson, majorsJson, language, duration, ageRange, intake
      FROM scholarships WHERE id = ${id} LIMIT 1
    `
    if (rows.length > 0) {
      scholarshipData = rows[0]
      try { scholarshipFinancials = JSON.parse(rows[0].financialsJson as string || "{}") } catch { /* legacy */ }
    }
  }

  const tags: string[] = (() => { try { return JSON.parse(opp.tags || "[]") } catch { return [] } })()
  const financialModel = parseFinancialModel(opp.financialModel)
  const deadline = opp.deadline ? new Date(opp.deadline) : null
  const daysLeft = deadline ? Math.ceil((deadline.getTime() - Date.now()) / 86400000) : null
  const isUrgent = daysLeft !== null && daysLeft <= 14 && daysLeft >= 0

  return (
    <div className="min-h-screen relative" style={{ background: "#05091a" }}>
      <StarfieldBg opacity={0.45} />

      {/* Nav */}
      <nav
        className="sticky top-0 z-40 flex items-center justify-between px-6 py-3.5"
        style={{
          background: "rgba(5,9,26,0.88)",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          backdropFilter: "blur(16px)",
        }}
      >
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ background: "rgba(212,175,55,0.15)", border: "1px solid rgba(212,175,55,0.3)" }}>
            <Globe2 className="h-4 w-4" style={{ color: "#D4AF37" }} />
          </div>
          <span className="font-bold text-sm" style={{ color: "#D4AF37" }}>EA Trade Link</span>
        </Link>
        <div className="flex items-center gap-2">
          {session ? (
            <Link href="/dashboard"
              className="rounded-xl px-4 py-2 text-xs font-bold transition-all hover:scale-105"
              style={{ background: "#D4AF37", color: "#05091a" }}>
              My Dashboard
            </Link>
          ) : (
            <>
              <Link href="/login"
                className="rounded-xl px-3 py-2 text-xs font-medium transition-colors"
                style={{ color: "rgba(255,255,255,0.6)" }}>
                Sign in
              </Link>
              <Link href="/register"
                className="rounded-xl px-4 py-2 text-xs font-bold transition-all hover:scale-105"
                style={{ background: "#D4AF37", color: "#05091a" }}>
                Register Free
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <div className="relative h-[320px] sm:h-[400px] overflow-hidden">
        <Image src={heroImg} alt={opp.title} fill className="object-cover opacity-40" priority sizes="100vw" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#05091a] via-[#05091a]/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#05091a]/60 to-transparent" />
        <div className="absolute inset-0 flex flex-col justify-end pb-8 px-6 max-w-6xl mx-auto w-full">
          <Link href="/" className="flex items-center gap-1.5 text-sm mb-4 w-fit transition-colors"
            style={{ color: "rgba(255,255,255,0.5)" }}
            onMouseEnter={undefined}>
            <ArrowLeft className="h-3.5 w-3.5" />Back to opportunities
          </Link>
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
              style={{ background: "rgba(96,165,250,0.12)", color: "#60a5fa", border: "1px solid rgba(96,165,250,0.25)" }}>
              <Icon className="h-3.5 w-3.5" />{cfg.label}
            </span>
            {opp.isFeatured && (
              <span className="flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold"
                style={{ background: "rgba(212,175,55,0.15)", color: "#D4AF37", border: "1px solid rgba(212,175,55,0.3)" }}>
                <Star className="h-3 w-3 fill-current" />Featured
              </span>
            )}
            {isUrgent && (
              <span className="flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold animate-pulse"
                style={{ background: "rgba(248,113,113,0.15)", color: "#f87171", border: "1px solid rgba(248,113,113,0.3)" }}>
                <AlertCircle className="h-3 w-3" />{daysLeft}d left!
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight max-w-3xl">
            {opp.title}
          </h1>
          <p className="mt-2 flex items-center gap-1.5 text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            {opp.organization} · {opp.location}
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="relative z-10 mx-auto max-w-6xl px-6 py-8">
        <div className="grid gap-6 lg:grid-cols-3">

          {/* Main content */}
          <div className="lg:col-span-2 space-y-5">
            {/* Tags */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((t) => (
                  <span key={t} className="rounded-full px-3 py-1 text-xs font-medium"
                    style={{ background: "rgba(96,165,250,0.08)", color: "#60a5fa", border: "1px solid rgba(96,165,250,0.18)" }}>
                    #{t}
                  </span>
                ))}
              </div>
            )}

            {/* Overview */}
            <GlassSection icon={FileText} title="Overview" iconColor="#60a5fa">
              <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.65)" }}>{opp.description}</p>
            </GlassSection>

            {/* Requirements */}
            {opp.requirements && (
              <GlassSection icon={CheckCircle2} title="Requirements" iconColor="#34d399">
                <div className="mt-3 space-y-2">
                  {opp.requirements.split(",").map((r, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-sm">
                      <div className="h-5 w-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                        style={{ background: "rgba(52,211,153,0.12)" }}>
                        <span className="text-[10px] font-bold" style={{ color: "#34d399" }}>{i + 1}</span>
                      </div>
                      <span style={{ color: "rgba(255,255,255,0.6)" }}>{r.trim()}</span>
                    </div>
                  ))}
                </div>
              </GlassSection>
            )}

            {/* Benefits (non-scholarship) */}
            {opp.benefits && opp.type !== "SCHOLARSHIP" && (
              <GlassSection icon={Award} title="Benefits & Package" iconColor="#D4AF37"
                borderColor="rgba(212,175,55,0.15)">
                <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.65)" }}>{opp.benefits}</p>
                {opp.type === "JOB" && opp.salary && (
                  <div className="mt-3 inline-flex items-center gap-2 rounded-xl px-4 py-2"
                    style={{ background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.2)" }}>
                    <TrendingUp className="h-4 w-4" style={{ color: "#34d399" }} />
                    <span className="font-semibold" style={{ color: "#34d399" }}>{opp.salary}</span>
                  </div>
                )}
              </GlassSection>
            )}

            {/* ── Universal Financial Model ── */}
            {financialModel && hasFinancialContent(financialModel) && (
              <UniversalFinancialModelCard model={financialModel} />
            )}

            {/* ── Rich Scholarship Financial Breakdown ── */}
            {opp.type === "SCHOLARSHIP" && scholarshipFinancials && (
              <ScholarshipFinancialCard fin={scholarshipFinancials} />
            )}

            {/* Fallback for scholarships without rich data */}
            {opp.type === "SCHOLARSHIP" && !scholarshipFinancials && (opp.tuitionCovered || opp.livingAllowance || opp.flightTicket || opp.benefits) && (
              <GlassSection icon={Award} title="Financial Coverage" iconColor="#D4AF37" borderColor="rgba(212,175,55,0.15)">
                {opp.benefits && <p className="text-sm leading-relaxed mb-3" style={{ color: "rgba(255,255,255,0.65)" }}>{opp.benefits}</p>}
                <div className="flex flex-wrap gap-2">
                  {opp.tuitionCovered && <CoverPill label="Full Tuition" color="#60a5fa" bg="rgba(96,165,250,0.12)" />}
                  {opp.livingAllowance && <CoverPill label="Living Allowance" color="#34d399" bg="rgba(52,211,153,0.12)" />}
                  {opp.flightTicket && <CoverPill label="Flight Ticket" color="#a78bfa" bg="rgba(167,139,250,0.12)" />}
                </div>
              </GlassSection>
            )}

            {/* Scholarship programme details */}
            {opp.type === "SCHOLARSHIP" && (scholarshipData || opp.degreeLevel) && (
              <GlassSection icon={GraduationCap} title="Programme Details" iconColor="#60a5fa">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
                  {opp.degreeLevel && <DetailBox label="Degree Level" value={opp.degreeLevel} />}
                  {!!scholarshipData?.language  && <DetailBox label="Language" value={String(scholarshipData.language)} />}
                  {!!scholarshipData?.duration  && <DetailBox label="Duration"  value={String(scholarshipData.duration)} />}
                  {!!scholarshipData?.ageRange  && <DetailBox label="Age Range" value={String(scholarshipData.ageRange)} />}
                  {!!scholarshipData?.intake    && <DetailBox label="Intake"    value={String(scholarshipData.intake)} />}
                  {opp.slots && <DetailBox label="Available Slots" value={`${opp.slots} positions`} />}
                </div>
              </GlassSection>
            )}

            {opp.type === "JOB" && (
              <GlassSection icon={Briefcase} title="Job Details" iconColor="#34d399">
                <div className="grid grid-cols-2 gap-3 mt-3">
                  {opp.jobType && <DetailBox label="Job Type" value={opp.jobType} />}
                  {opp.contractDuration && <DetailBox label="Contract" value={opp.contractDuration} />}
                  {opp.slots && <DetailBox label="Openings" value={`${opp.slots} positions`} />}
                </div>
              </GlassSection>
            )}

            {(opp.type === "CANTON_FAIR" || opp.type === "TRADE_EXHIBITION" || opp.type === "CONFERENCE") && (
              <GlassSection icon={Calendar} title="Event Details" iconColor="#fb923c">
                <div className="grid grid-cols-2 gap-3 mt-3">
                  {opp.eventDates && <DetailBox label="Dates" value={opp.eventDates} />}
                  {opp.venue && <DetailBox label="Venue" value={opp.venue} />}
                  {opp.registrationFee && <DetailBox label="Registration" value={opp.registrationFee} />}
                </div>
              </GlassSection>
            )}

            {opp.type === "FACTORY_VISIT" && (
              <GlassSection icon={Factory} title="Tour Details" iconColor="#fb923c">
                <div className="grid grid-cols-2 gap-3 mt-3">
                  {opp.visitDuration && <DetailBox label="Duration" value={opp.visitDuration} />}
                  {opp.groupSizeMax && <DetailBox label="Max Group" value={`${opp.groupSizeMax} people`} />}
                </div>
              </GlassSection>
            )}

            {/* Documents */}
            {docs.length > 0 && (
              <GlassSection icon={FileText} title="Documents Required" iconColor="#fbbf24" borderColor="rgba(251,191,36,0.12)">
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {docs.map((doc, i) => (
                    <div key={i} className="flex items-center gap-2.5 text-sm rounded-xl px-3 py-2"
                      style={{ background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.12)" }}>
                      <div className="h-5 w-5 rounded-full flex items-center justify-center shrink-0"
                        style={{ background: "rgba(251,191,36,0.15)" }}>
                        <FileText className="h-3 w-3" style={{ color: "#fbbf24" }} />
                      </div>
                      <span style={{ color: "rgba(255,255,255,0.65)" }}>{doc}</span>
                    </div>
                  ))}
                </div>
              </GlassSection>
            )}
          </div>

          {/* Sticky sidebar */}
          <div className="space-y-4">
            <div className="lg:sticky lg:top-[72px] space-y-4">
              {/* Apply card */}
              <div style={{ ...glassCard, padding: "1.25rem", border: "1px solid rgba(212,175,55,0.2)" }}>
                {/* Wrong role — show inline block */}
                {session && !userCanApply && requiredRole ? (
                  <WrongRoleBlock
                    currentRole={accountType as "STUDENT" | "BUSINESS"}
                    requiredRole={requiredRole}
                    variant="inline"
                  />
                ) : userApplication ? (
                  <div className="text-center py-2">
                    <CheckCircle2 className="h-10 w-10 mx-auto mb-2" style={{ color: "#34d399" }} />
                    <p className="font-semibold text-white">Application Submitted</p>
                    <p className="text-xs mt-1 mb-4" style={{ color: "rgba(255,255,255,0.5)" }}>
                      Status: <span style={{ color: "#60a5fa" }}>{userApplication.status.replace(/_/g, " ")}</span>
                    </p>
                    <Link href={`/dashboard/applications/${userApplication.id}`}
                      className="block w-full rounded-xl py-2.5 text-sm font-bold text-center transition-all hover:scale-105"
                      style={{ background: "#D4AF37", color: "#05091a" }}>
                      Track Application
                    </Link>
                  </div>
                ) : session ? (
                  <div>
                    <p className="font-semibold text-white mb-1">Ready to apply?</p>
                    <p className="text-xs mb-4" style={{ color: "rgba(255,255,255,0.45)" }}>
                      No fees required until your application is accepted.
                    </p>
                    <Link href={`/apply/${opp.id}`}
                      className="flex items-center justify-center gap-2 w-full rounded-xl py-2.5 text-sm font-bold transition-all hover:scale-105"
                      style={{ background: "linear-gradient(135deg, #D4AF37, #b8860b)", color: "#05091a" }}>
                      Apply Now <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                ) : (
                  <div>
                    <p className="font-semibold text-white mb-1">Create an account to apply</p>
                    <p className="text-xs mb-4" style={{ color: "rgba(255,255,255,0.45)" }}>
                      Free registration. No fees until accepted.
                    </p>
                    <Link href={`/login?redirect=/apply/${opp.id}`}
                      className="flex items-center justify-center gap-2 w-full rounded-xl py-2.5 text-sm font-bold mb-2 transition-all hover:scale-105"
                      style={{ background: "linear-gradient(135deg, #D4AF37, #b8860b)", color: "#05091a" }}>
                      Get Started <ArrowRight className="h-4 w-4" />
                    </Link>
                    <Link href={`/login?redirect=/apply/${opp.id}`}
                      className="block w-full rounded-xl py-2 text-xs font-medium text-center transition-colors"
                      style={{ color: "rgba(255,255,255,0.4)" }}>
                      Already have an account?
                    </Link>
                  </div>
                )}
              </div>

              {/* Quick facts */}
              <div style={{ ...glassCard, padding: "1.25rem" }}>
                <p className="text-[10px] uppercase tracking-widest font-semibold mb-3"
                  style={{ color: "rgba(255,255,255,0.35)" }}>Quick Facts</p>
                <div className="space-y-2.5">
                  <QuickFact icon={MapPin} label={opp.location} />
                  {opp.deadline && (
                    <QuickFact
                      icon={Clock}
                      label={`Deadline: ${new Date(opp.deadline).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`}
                      urgent={isUrgent ?? false}
                    />
                  )}
                  {opp.startDate && (
                    <QuickFact icon={Calendar} label={`Starts: ${new Date(opp.startDate).toLocaleDateString("en-GB", { month: "long", year: "numeric" })}`} />
                  )}
                  {opp.slots && <QuickFact icon={Users} label={`${opp.slots} available slots`} />}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function GlassSection({ icon: Icon, title, iconColor = "#60a5fa", borderColor, children }: {
  icon: React.ElementType; title: string; iconColor?: string; borderColor?: string; children: React.ReactNode
}) {
  return (
    <div style={{
      ...{
        background: "rgba(255,255,255,0.04)",
        border: borderColor ? `1px solid ${borderColor}` : "1px solid rgba(255,255,255,0.08)",
        borderRadius: "1rem",
        backdropFilter: "blur(8px)",
        padding: "1.25rem",
      }
    }}>
      <div className="flex items-center gap-2.5 mb-3">
        <div className="h-8 w-8 rounded-lg flex items-center justify-center"
          style={{ background: `${iconColor}18` }}>
          <Icon className="h-4 w-4" style={{ color: iconColor }} />
        </div>
        <h2 className="font-semibold text-base text-white">{title}</h2>
      </div>
      {children}
    </div>
  )
}

function DetailBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl px-4 py-3"
      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
      <p className="text-[10px] uppercase tracking-wider font-medium mb-0.5"
        style={{ color: "rgba(255,255,255,0.35)" }}>{label}</p>
      <p className="font-semibold text-sm text-white">{value}</p>
    </div>
  )
}

function CoverPill({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <div className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium"
      style={{ background: bg, color, border: `1px solid ${color}33` }}>
      <CheckCircle2 className="h-3.5 w-3.5" />{label}
    </div>
  )
}

function QuickFact({ icon: Icon, label, urgent }: { icon: React.ElementType; label: string; urgent?: boolean }) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="h-4 w-4 mt-0.5 shrink-0" style={{ color: urgent ? "#f87171" : "rgba(255,255,255,0.35)" }} />
      <span className="text-sm" style={{ color: urgent ? "#f87171" : "rgba(255,255,255,0.6)" }}>{label}</span>
    </div>
  )
}

// ── Universal Financial Model Card ───────────────────────────────────────────
function UniversalFinancialModelCard({ model }: { model: FinancialModel }) {
  const ftMeta = FM_META[model.fundingType]
  const includedBenefits = model.benefits.filter(b => b.included)
  const benefitCats = [...new Set(includedBenefits.map(b => b.category))]

  const glassCard = {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "1rem",
    backdropFilter: "blur(8px)",
    padding: "1.25rem",
  } as React.CSSProperties

  return (
    <div style={{ ...glassCard, borderColor: "rgba(52,211,153,0.15)" }}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(52,211,153,0.1)" }}>
            <CreditCard className="h-4 w-4" style={{ color: "#34d399" }} />
          </div>
          <div>
            <h2 className="font-semibold text-base text-white">Financial Model & Coverage</h2>
            <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
              What this opportunity covers and what you are responsible for
            </p>
          </div>
        </div>
        <span className="rounded-full px-3 py-1 text-xs font-bold shrink-0 ml-2"
          style={{ background: ftMeta.bg, color: ftMeta.color, border: `1px solid ${ftMeta.border}` }}>
          {ftMeta.label}
        </span>
      </div>

      {/* Funding-type summary line */}
      <p className="text-sm mb-4" style={{ color: "rgba(255,255,255,0.55)" }}>
        {model.fundingType === "FULLY_COVERED"    && "All major costs are covered. Eligible participants receive comprehensive financial support."}
        {model.fundingType === "PARTIALLY_COVERED" && "Partial financial support is provided. Please review coverage details below."}
        {model.fundingType === "SELF_FUNDED"      && "This opportunity does not provide financial assistance. Participants are responsible for all costs."}
        {model.fundingType === "CONDITIONAL"      && "Financial benefits may vary depending on the outcome of the evaluation process."}
        {model.fundingType === "CUSTOM"           && "This opportunity has a custom financial arrangement. Review the details below."}
      </p>

      {/* Benefits by category */}
      {includedBenefits.length > 0 && (
        <div className="mb-4">
          <p className="text-[10px] uppercase tracking-widest font-semibold mb-2" style={{ color: "rgba(255,255,255,0.3)" }}>
            What&apos;s Included
          </p>
          <div className="space-y-3">
            {benefitCats.map(cat => (
              <div key={cat}>
                <p className="text-[10px] uppercase tracking-wider font-bold mb-1.5" style={{ color: "rgba(255,255,255,0.3)" }}>
                  {CATEGORY_LABELS[cat]}
                </p>
                <div className="grid sm:grid-cols-2 gap-1.5">
                  {includedBenefits.filter(b => b.category === cat).map(b => (
                    <div key={b.id} className="flex items-start gap-2.5 rounded-xl px-3 py-2"
                      style={{ background: "rgba(52,211,153,0.07)", border: "1px solid rgba(52,211,153,0.15)" }}>
                      <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0" style={{ color: "#34d399" }} />
                      <div>
                        <p className="text-xs font-medium text-white">{b.label}</p>
                        {b.details && <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>{b.details}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stipends */}
      {model.stipends.length > 0 && (
        <div className="mb-4">
          <p className="text-[10px] uppercase tracking-widest font-semibold mb-2" style={{ color: "rgba(255,255,255,0.3)" }}>
            Stipends & Allowances
          </p>
          <div className="grid sm:grid-cols-2 gap-1.5">
            {model.stipends.map(s => (
              <div key={s.id} className="flex items-center gap-2.5 rounded-xl px-3 py-2"
                style={{ background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.18)" }}>
                <DollarSign className="h-3.5 w-3.5 shrink-0" style={{ color: "#D4AF37" }} />
                <div>
                  <p className="text-xs font-semibold" style={{ color: "#D4AF37" }}>{s.amount}</p>
                  <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.45)" }}>
                    {s.label} · {s.period}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Costs */}
      {model.costs.length > 0 && (
        <div className="mb-4">
          <p className="text-[10px] uppercase tracking-widest font-semibold mb-2" style={{ color: "rgba(255,255,255,0.3)" }}>
            Your Cost Responsibilities
          </p>
          <div className="space-y-1.5">
            {model.costs.map(c => (
              <div key={c.id} className="flex items-center justify-between rounded-xl px-3 py-2.5"
                style={{
                  background: c.mandatory ? "rgba(248,113,113,0.07)" : "rgba(255,255,255,0.03)",
                  border: c.mandatory ? "1px solid rgba(248,113,113,0.15)" : "1px solid rgba(255,255,255,0.06)",
                }}>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full shrink-0"
                    style={{ background: c.mandatory ? "#f87171" : "rgba(255,255,255,0.3)" }} />
                  <div>
                    <p className="text-xs font-medium text-white">{c.label}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>
                        {c.mandatory ? "Required" : "Optional"}
                      </span>
                      {c.refundable && (
                        <span className="text-[10px] rounded-full px-1.5 py-0.5"
                          style={{ background: "rgba(52,211,153,0.1)", color: "#34d399" }}>
                          Refundable
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {c.amount && (
                  <span className="text-sm font-bold shrink-0 ml-2"
                    style={{ color: c.mandatory ? "#f87171" : "rgba(255,255,255,0.6)" }}>
                    {c.amount} {c.currency}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      {model.notes && (
        <div className="mt-3 flex items-start gap-2 rounded-xl px-3 py-2.5"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" style={{ color: "rgba(255,255,255,0.35)" }} />
          <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>{model.notes}</p>
        </div>
      )}
    </div>
  )
}

// ── Rich Scholarship Financial Breakdown ─────────────────────────────────────
function ScholarshipFinancialCard({ fin }: { fin: Record<string, unknown> }) {
  const isRich = fin.tuition !== null && typeof fin.tuition === "object"
  const schType = fin.scholarshipType as ScholarshipFundingType | undefined

  // Rich format
  const tuition  = isRich ? fin.tuition    as Record<string, unknown> : null
  const accom    = isRich ? fin.accommodation as Record<string, unknown> : null
  const stipend  = isRich ? fin.stipend    as Record<string, unknown> : null
  const add      = isRich ? fin.additionalSupport as Record<string, unknown> : null
  const payments = isRich ? fin.payments   as Record<string, unknown> : null
  const notes    = (fin.notes as string[] | undefined) ?? []

  // Legacy fallback
  if (!isRich) {
    const legacyItems = [
      { label: "Tuition",      val: fin.tuition as string,          icon: GraduationCap, color: "#60a5fa" },
      { label: "Accommodation",val: fin.accommodation as string,     icon: Home,          color: "#34d399" },
      { label: "Stipend",      val: fin.stipend as string,           icon: DollarSign,    color: "#D4AF37" },
      { label: "Reg. Fee",     val: fin.registrationFee as string,   icon: FileText,      color: "#fb923c" },
      { label: "Deposit",      val: fin.deposit as string,           icon: DollarSign,    color: "#f87171" },
    ].filter(i => i.val)
    if (!legacyItems.length && !notes.length) return null
    return (
      <GlassSection icon={Award} title="Financial Details" iconColor="#D4AF37" borderColor="rgba(212,175,55,0.15)">
        <div className="grid grid-cols-2 gap-2 mt-2">
          {legacyItems.map(({ label, val, icon: I, color }) => (
            <div key={label} className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="flex items-center gap-1.5 mb-0.5">
                <I className="h-3 w-3" style={{ color }} />
                <p className="text-[10px] uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.4)" }}>{label}</p>
              </div>
              <p className="text-sm font-semibold text-white">{val}</p>
            </div>
          ))}
        </div>
        {notes.length > 0 && (
          <ul className="mt-3 space-y-1">
            {notes.map((n, i) => <li key={i} className="flex items-start gap-2 text-xs" style={{ color: "rgba(255,255,255,0.5)" }}><span style={{ color: "#D4AF37" }}>·</span>{n}</li>)}
          </ul>
        )}
      </GlassSection>
    )
  }

  // ── New rich format ──
  const typeMeta = schType ? FUNDING_TYPE_META[schType] : null

  type CoverageRow = { icon: React.ElementType; label: string; status: "covered" | "partial" | "not" | "info"; detail?: string }
  const coverageRows: CoverageRow[] = []

  // Tuition row
  if (tuition) {
    const pct = tuition.percentageCovered as number | undefined
    const covered = tuition.covered as boolean
    coverageRows.push({
      icon: GraduationCap,
      label: "Tuition Fees",
      status: covered ? (pct && pct < 100 ? "partial" : "covered") : "not",
      detail: covered
        ? (tuition.discountedCost ? `${tuition.discountedCost} covered` : pct ? `${pct}% covered` : tuition.fullCost ? `Was ${tuition.fullCost}` : "Fully covered")
        : tuition.fullCost ? `${tuition.fullCost}/year (student pays)` : "Not covered",
    })
  }

  // Accommodation row
  if (accom && accom.enabled) {
    const cov = accom.coverage as string
    coverageRows.push({
      icon: Home,
      label: "Accommodation",
      status: cov === "FULL" ? "covered" : cov === "PARTIAL" ? "partial" : "not",
      detail: accom.amount ? String(accom.amount) : cov === "FULL" ? "Fully provided" : cov === "PARTIAL" ? "Partially subsidised" : "Not provided",
    })
  }

  // Stipend row
  if (stipend && stipend.enabled) {
    coverageRows.push({
      icon: DollarSign,
      label: "Monthly Stipend",
      status: "covered",
      detail: stipend.monthlyAmount ? String(stipend.monthlyAmount) : "Included",
    })
  } else if (stipend && !stipend.enabled) {
    coverageRows.push({ icon: DollarSign, label: "Monthly Stipend", status: "not", detail: "Not included" })
  }

  // Flight ticket
  if (add) {
    if (add.flightTicket) coverageRows.push({ icon: Plane, label: "Flight Ticket", status: "covered", detail: "Provided" })
    if (add.insurance)    coverageRows.push({ icon: ShieldCheck, label: "Health Insurance", status: "covered", detail: "Covered" })
    if (add.otherBenefits) coverageRows.push({ icon: Award, label: "Extra Benefits", status: "info", detail: String(add.otherBenefits) })
  }

  const statusConfig = {
    covered: { color: "#34d399", bg: "rgba(52,211,153,0.1)",   border: "rgba(52,211,153,0.2)",   icon: CheckCircle2, label: "Covered" },
    partial:  { color: "#D4AF37", bg: "rgba(212,175,55,0.1)",  border: "rgba(212,175,55,0.2)",   icon: Award,        label: "Partial" },
    not:      { color: "#f87171", bg: "rgba(248,113,113,0.08)", border: "rgba(248,113,113,0.15)", icon: X,            label: "Not Covered" },
    info:     { color: "#60a5fa", bg: "rgba(96,165,250,0.1)",  border: "rgba(96,165,250,0.2)",   icon: Award,        label: "" },
  }

  return (
    <div style={{
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(212,175,55,0.2)",
      borderRadius: "1rem",
      backdropFilter: "blur(8px)",
      padding: "1.25rem",
    }}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(212,175,55,0.12)" }}>
            <Award className="h-4 w-4" style={{ color: "#D4AF37" }} />
          </div>
          <h2 className="font-semibold text-base text-white">Financial Coverage</h2>
        </div>
        {typeMeta && (
          <span className="rounded-full px-3 py-1 text-xs font-bold"
            style={{ background: typeMeta.bg, color: typeMeta.color, border: `1px solid ${typeMeta.border}` }}>
            {typeMeta.label}
          </span>
        )}
      </div>

      {/* Coverage grid */}
      {coverageRows.length > 0 && (
        <div className="space-y-2">
          {coverageRows.map((row, i) => {
            const sc = statusConfig[row.status]
            const StatusIcon = sc.icon
            const RowIcon = row.icon
            return (
              <div key={i} className="flex items-center gap-3 rounded-xl px-3 py-2.5"
                style={{ background: sc.bg, border: `1px solid ${sc.border}` }}>
                <RowIcon className="h-4 w-4 shrink-0" style={{ color: sc.color }} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white">{row.label}</p>
                  {row.detail && <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.55)" }}>{row.detail}</p>}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <StatusIcon className="h-3.5 w-3.5" style={{ color: sc.color }} />
                  {sc.label && <span className="text-[11px] font-semibold" style={{ color: sc.color }}>{sc.label}</span>}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Payments required */}
      {!!(payments?.enabled) && (
        <div className="mt-4 rounded-xl p-3 space-y-2"
          style={{ background: "rgba(251,146,60,0.08)", border: "1px solid rgba(251,146,60,0.2)" }}>
          <p className="text-xs font-bold" style={{ color: "#fb923c" }}>Payment Requirements</p>
          <div className="grid grid-cols-2 gap-2">
            {([
              ["Registration Fee", payments.registrationFee],
              ["Application Fee",  payments.applicationFee],
              ["Seat Deposit",     payments.seatDeposit],
              ["Processing Fee",   payments.processingFee],
            ] as [string, unknown][]).filter(([, v]) => v).map(([lbl, val]) => (
              <div key={lbl} className="flex items-center justify-between rounded-lg px-2.5 py-1.5"
                style={{ background: "rgba(251,146,60,0.08)" }}>
                <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.5)" }}>{lbl}</span>
                <span className="text-xs font-bold" style={{ color: "#fb923c" }}>{String(val)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      {notes.length > 0 && (
        <ul className="mt-4 space-y-1.5 border-t pt-3" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          {notes.map((n, i) => (
            <li key={i} className="flex items-start gap-2 text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
              <span className="mt-0.5 shrink-0" style={{ color: "#D4AF37" }}>·</span>{n}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
