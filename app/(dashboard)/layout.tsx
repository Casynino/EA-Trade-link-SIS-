import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { MobileNav } from "@/components/layout/mobile-nav"
import { StarfieldBg } from "@/components/ui/starfield-bg"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  // Always read authoritative role from DB — never trust client-cached session alone
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, userTypes: true, name: true, image: true },
  })
  if (!user) redirect("/login")

  let accountType: string
  if (["ADMIN", "SUPER_ADMIN"].includes(user.role)) {
    accountType = "ADMIN"
  } else {
    try {
      const types: string[] = JSON.parse(user.userTypes || '["STUDENT"]')
      accountType = types[0] ?? "STUDENT"
    } catch {
      accountType = "STUDENT"
    }
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#05091a" }}>
      <StarfieldBg opacity={0.55} />
      <div className="hidden md:flex">
        <Sidebar accountType={accountType} userName={user.name ?? "User"} userRole={user.role} />
      </div>
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <Header userName={user.name ?? ""} userImage={user.image ?? ""} />
        <main className="flex-1 overflow-y-auto ea-app-bg">
          <div className="ea-animate-in pb-16 md:pb-0">
            {children}
          </div>
        </main>
      </div>
      <MobileNav accountType={accountType} userRole={user.role} />
    </div>
  )
}
