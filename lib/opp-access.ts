// Central access-control logic for opportunity applications.
// Determines which account type is required to apply for a given opportunity type.

export const STUDENT_OPP_TYPES  = new Set(["SCHOLARSHIP", "JOB"])
export const BUSINESS_OPP_TYPES = new Set([
  "BUSINESS_VISA", "FACTORY_VISIT", "CANTON_FAIR",
  "TRADE_EXHIBITION", "CONFERENCE", "PRODUCT_SOURCING",
])

export type RequiredRole = "STUDENT" | "BUSINESS"

/** Returns the required account type for an opportunity, or null if open to all. */
export function requiredRoleForOpp(oppType: string): RequiredRole | null {
  if (STUDENT_OPP_TYPES.has(oppType))  return "STUDENT"
  if (BUSINESS_OPP_TYPES.has(oppType)) return "BUSINESS"
  return null // EXCHANGE and any future neutral types
}

/** Returns true if this accountType is allowed to apply. Admins always pass. */
export function canApplyForOpp(accountType: string, oppType: string): boolean {
  if (accountType === "ADMIN") return true
  const required = requiredRoleForOpp(oppType)
  if (!required) return true
  return accountType === required
}
