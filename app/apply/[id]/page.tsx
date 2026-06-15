import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect, notFound } from "next/navigation"
import { ApplyForm } from "./apply-form"
import { WrongRoleBlock } from "@/components/wrong-role-block"
import { canApplyForOpp, requiredRoleForOpp } from "@/lib/opp-access"

export const dynamic = "force-dynamic"

export default async function ApplyPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await auth()
  if (!session?.user) redirect(`/login?redirect=/apply/${id}`)

  const opp = await db.opportunity.findUnique({ where: { id } })
  if (!opp) notFound()

  const accountType = session.user.accountType ?? "STUDENT"

  if (!canApplyForOpp(accountType, opp.type)) {
    const required = requiredRoleForOpp(opp.type)!
    return (
      <WrongRoleBlock
        currentRole={accountType as "STUDENT" | "BUSINESS"}
        requiredRole={required}
        oppTitle={opp.title}
        backHref={`/opportunities/${id}`}
        variant="page"
      />
    )
  }

  return <ApplyForm opportunity={opp} userId={session.user.id} userName={session.user.name ?? undefined} />
}
