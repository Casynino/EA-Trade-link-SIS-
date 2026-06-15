import { StarfieldBg } from "@/components/ui/starfield-bg"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen relative" style={{ background: "#05091a" }}>
      <StarfieldBg opacity={0.6} />
      {/* Directional glow — deep navy top-center, warm gold hint bottom-right */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          zIndex: 1,
          backgroundImage: [
            "radial-gradient(ellipse 80% 55% at 50% -5%, rgba(15,37,87,0.55), transparent)",
            "radial-gradient(ellipse 40% 35% at 85% 95%, rgba(212,175,55,0.07), transparent)",
          ].join(", "),
        }}
      />
      <div className="relative" style={{ zIndex: 2 }}>
        {children}
      </div>
    </div>
  )
}
