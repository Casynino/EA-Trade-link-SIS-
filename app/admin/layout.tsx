import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { MobileNav } from "@/components/layout/mobile-nav"
import { StarfieldBg } from "@/components/ui/starfield-bg"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  if (!["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) redirect("/dashboard")

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, image: true, role: true },
  })

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#05091a" }}>
      <StarfieldBg opacity={0.38} />
      <div className="hidden md:flex">
        <Sidebar accountType="ADMIN" userName={user?.name ?? "Admin"} userRole={session.user.role} />
      </div>
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <Header userName={user?.name ?? ""} userImage={user?.image ?? ""} />
        <main className="flex-1 overflow-y-auto ea-app-bg">
          <div className="ea-animate-in pb-16 md:pb-0">
            {children}
          </div>
        </main>
      </div>
      <MobileNav accountType="ADMIN" userRole={session.user.role} />
    </div>
  )
}
