import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"

// POST /api/applications/[id]/documents — attach uploaded documents
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const app = await db.application.findFirst({ where: { id, userId: session.user.id } })
  if (!app) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const body = await req.json()
  const docs: { url: string; name: string; type: string }[] = body.documents ?? []

  const created = await Promise.all(
    docs.map((doc) =>
      db.document.create({
        data: {
          userId: session.user.id,
          applicationId: id,
          fileName: doc.name,
          fileUrl: doc.url,
          documentType: doc.type ?? "OTHER",
          mimeType: doc.name.endsWith(".pdf") ? "application/pdf" : "image/*",
        },
      })
    )
  )

  // If the application is in DOCUMENTS_REQUIRED, auto-move back to UNDER_REVIEW
  if (app.status === "DOCUMENTS_REQUIRED") {
    await db.application.update({
      where: { id },
      data: { status: "UNDER_REVIEW" },
    })
  }

  return NextResponse.json({ ok: true, count: created.length })
}
