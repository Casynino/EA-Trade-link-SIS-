import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { LandingContent } from "@/components/landing/landing-content"

export default async function HomePage() {
  const session = await auth()
  let userName: string | undefined
  if (session?.user?.id) {
    const u = await db.user.findUnique({ where: { id: session.user.id }, select: { name: true } })
    userName = u?.name ?? undefined
  }

  const opportunities = await db.opportunity.findMany({
    where: { isActive: true },
    orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
  })

  const counts = await db.opportunity.groupBy({
    by: ["type"],
    where: { isActive: true },
    _count: true,
  })
  const byType = Object.fromEntries(counts.map((c) => [c.type, c._count]))
  const eventCount = (byType.CANTON_FAIR ?? 0) + (byType.TRADE_EXHIBITION ?? 0) + (byType.CONFERENCE ?? 0)

  const statValues: Record<string, number> = {
    SCHOLARSHIP:   byType.SCHOLARSHIP ?? 0,
    JOB:           byType.JOB ?? 0,
    EVENTS:        eventCount,
    FACTORY_VISIT: byType.FACTORY_VISIT ?? 0,
  }

  return <LandingContent opportunities={opportunities} statValues={statValues} userName={userName} />
}
