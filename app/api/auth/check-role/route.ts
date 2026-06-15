import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

// Returns the account type for a given email.
// Used by role-specific login pages to block wrong-role login attempts.
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    if (!email) return NextResponse.json({ accountType: null })

    const user = await db.user.findUnique({
      where: { email },
      select: { userTypes: true, role: true },
    })

    if (!user) return NextResponse.json({ accountType: null })

    if (["ADMIN", "SUPER_ADMIN"].includes(user.role)) {
      return NextResponse.json({ accountType: "ADMIN" })
    }

    const types: string[] = JSON.parse(user.userTypes ?? '["STUDENT"]')
    return NextResponse.json({ accountType: types[0] ?? "STUDENT" })
  } catch {
    return NextResponse.json({ accountType: null })
  }
}
