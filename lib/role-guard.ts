import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"

export type AccountType = "STUDENT" | "BUSINESS" | "JOB_SEEKER" | "OTHER"

/** Get the primary account type for the current user. Redirects to /login if unauthenticated. */
export async function requireRole(allowed: AccountType[]) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const user = await db.user.findUnique({ where: { id: session.user.id } })
  if (!user) redirect("/login")

  // Admins always pass
  if (["ADMIN", "SUPER_ADMIN"].includes(user.role)) return user

  const userTypes: string[] = JSON.parse(user.userTypes || '["OTHER"]')
  const primary = userTypes[0] as AccountType

  if (!allowed.includes(primary)) {
    redirect("/dashboard")
  }

  return user
}

/** Parse userTypes JSON safely */
export function parseUserTypes(userTypesJson: string): string[] {
  try { return JSON.parse(userTypesJson) } catch { return ["OTHER"] }
}
