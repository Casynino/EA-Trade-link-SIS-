import { NextResponse } from "next/server"

// Never cache: the whole point is to report what is live RIGHT NOW.
export const dynamic = "force-dynamic"
export const revalidate = 0

/**
 * Identifies the running deployment.
 *
 * On Vercel every deployment gets a fresh VERCEL_DEPLOYMENT_ID, so the value
 * changes the moment new code goes live. Locally there are no such vars, so we
 * fall back to a constant fixed when this module is first loaded — it stays
 * stable while the dev server runs and changes when it restarts.
 */
const BUILD_ID =
  process.env.VERCEL_DEPLOYMENT_ID ??
  process.env.VERCEL_GIT_COMMIT_SHA ??
  `dev-${Date.now()}`

export async function GET() {
  return NextResponse.json(
    { version: BUILD_ID },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    },
  )
}
