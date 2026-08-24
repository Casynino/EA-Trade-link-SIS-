import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { StudyWizard } from "./study-wizard"
import { WrongRoleBlock } from "@/components/wrong-role-block"

export const dynamic = "force-dynamic"

/**
 * FLOW A — General Student Application.
 *
 * The student does NOT pick a scholarship or university here. They submit their
 * complete academic profile once; our admin team reviews it and matches them to
 * a suitable published opportunity afterwards.
 *
 * Students who already know which published opportunity they want use FLOW B
 * instead: /opportunities/[id] -> "Apply Now" -> /apply/[id].
 */
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

  // How many published scholarship opportunities exist — used to decide whether to
  // show the "browse published programmes" shortcut for students who already know
  // what they want (Flow B).
  const publishedCount = await db.opportunity.count({
    where: { isActive: true, type: "SCHOLARSHIP" },
  })

  return (
    <StudyWizard
      userId={session?.user?.id ?? null}
      userEmail={session?.user?.email ?? null}
      publishedCount={publishedCount}
    />
  )
}
