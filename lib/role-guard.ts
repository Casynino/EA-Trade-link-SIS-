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

/**
 * API-side admin guard. Reads the role from the DATABASE, not the JWT.
 *
 * A JWT is only refreshed on sign-in or an explicit session update, so a user
 * promoted to admin after they logged in carries a stale role in their token.
 * Admin pages already read the DB, so such a user could open the admin panel
 * but every write API answered 403 Forbidden.
 *
 * Returns the user when they are an admin, or null when they are not.
 */
export async function requireAdminApi() {
  const session = await auth()
  if (!session?.user?.id) return null

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, role: true },
  })
  if (!user || !["ADMIN", "SUPER_ADMIN"].includes(user.role)) return null

  return user
}
