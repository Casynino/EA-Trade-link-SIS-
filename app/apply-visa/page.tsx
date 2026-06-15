import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import { VisaLandingClient } from "./client"

export const dynamic = "force-dynamic"

export default async function ApplyVisaPage() {
  const session = await auth()

  const visaOpps = await db.opportunity.findMany({
    where: { isActive: true, type: "BUSINESS_VISA" },
    orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
    select: { id: true, title: true, organization: true, location: true, isFeatured: true, description: true },
  })

  return <VisaLandingClient visaOpps={visaOpps} isLoggedIn={!!session?.user} />
}
