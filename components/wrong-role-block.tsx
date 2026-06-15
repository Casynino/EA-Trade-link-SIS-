import Link from "next/link"
import { GraduationCap, Briefcase, ArrowRight, LogIn } from "lucide-react"
import { StarfieldBg } from "@/components/ui/starfield-bg"

type Role = "STUDENT" | "BUSINESS"

const ROLE_META: Record<Role, {
  emoji: string; label: string; color: string; bg: string; border: string
  registerHref: string; loginHref: string
}> = {
  STUDENT: {
    emoji: "🎓", label: "Student",
    color: "#38bdf8", bg: "rgba(56,189,248,0.1)", border: "rgba(56,189,248,0.3)",
    registerHref: "/register?type=student",
    loginHref: "/login",
  },
  BUSINESS: {
    emoji: "💼", label: "Business",
    color: "#D4AF37", bg: "rgba(212,175,55,0.1)", border: "rgba(212,175,55,0.3)",
    registerHref: "/register?type=business",
    loginHref: "/login",
  },
}

interface WrongRoleBlockProps {
  currentRole: Role
  requiredRole: Role
  oppTitle?: string
  backHref?: string
  variant?: "page" | "inline"
}

export function WrongRoleBlock({
  requiredRole,
  oppTitle,
  backHref = "/",
  variant = "page",
}: WrongRoleBlockProps) {
  const req = ROLE_META[requiredRole]

  /* ── Inline (sidebar card) ── */
  if (variant === "inline") {
    return (
      <div className="space-y-2">
          <Link
            href={req.registerHref}
            className="flex items-center justify-center gap-2 w-full rounded-xl py-2.5 text-xs font-black transition-all hover:scale-105"
            style={{ background: req.color, color: "#05091a" }}
          >
            Create {req.label} Account <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <Link
            href={req.loginHref}
            className="flex items-center justify-center gap-2 w-full rounded-xl py-2.5 text-xs font-semibold transition-colors"
            style={{ color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.1)" }}
          >
            <LogIn className="h-3.5 w-3.5" />
            Log in as {req.label}
          </Link>
      </div>
    )
  }

  /* ── Full-page (centered modal card) ── */
  return (
    <div className="min-h-screen relative flex items-center justify-center p-6" style={{ background: "#05091a" }}>
      <StarfieldBg opacity={0.25} />
      <div className="relative z-10 w-full max-w-sm">
        <div
          className="rounded-2xl p-8 text-center space-y-5"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.1)",
            backdropFilter: "blur(16px)",
          }}
        >
          {/* Icon */}
          <div
            className="inline-flex h-14 w-14 items-center justify-center rounded-2xl mx-auto"
            style={{ background: req.bg, border: `1px solid ${req.border}` }}
          >
            <span className="text-2xl">{req.emoji}</span>
          </div>

          {/* Message */}
          <div className="space-y-1.5">
            <h2 className="text-lg font-black text-white">
              {oppTitle
                ? `To apply for this ${requiredRole === "STUDENT" ? "scholarship" : "service"}, you need a ${req.label} Account.`
                : `Create ${req.emoji} ${req.label} Account or Log in as ${req.label} to continue.`}
            </h2>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
              Create {req.label} Account or Log in as {req.label} to continue.
            </p>
          </div>

          {/* Buttons */}
          <div className="space-y-2 pt-1">
            <Link
              href={req.registerHref}
              className="flex items-center justify-center gap-2 w-full rounded-xl py-3 text-sm font-black transition-all hover:scale-105"
              style={{ background: req.color, color: "#05091a" }}
            >
              Create {req.label} Account <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href={req.loginHref}
              className="flex items-center justify-center gap-2 w-full rounded-xl py-3 text-sm font-semibold transition-colors"
              style={{ color: "rgba(255,255,255,0.55)", border: "1px solid rgba(255,255,255,0.1)" }}
            >
              <LogIn className="h-4 w-4" />
              Log in as {req.label}
            </Link>
          </div>

          {/* Back */}
          <Link
            href={backHref}
            className="block text-xs transition-colors pt-1"
            style={{ color: "rgba(255,255,255,0.25)" }}
          >
            ← Go back
          </Link>
        </div>
      </div>
    </div>
  )
}
