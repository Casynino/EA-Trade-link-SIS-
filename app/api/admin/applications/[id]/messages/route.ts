import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { NextResponse } from "next/server"

async function findModel(id: string) {
  const app = await db.application.findUnique({ where: { id } })
  if (app) return { model: "application" as const, userId: app.userId }

  const visa = await db.visaApplication.findUnique({ where: { id } })
  if (visa) return { model: "visa" as const, userId: visa.userId }

  const study = await db.studyApplication.findUnique({ where: { id } })
  if (study) return { model: "study" as const, userId: study.userId }

  return null
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const admin = await db.user.findUnique({ where: { id: session.user.id } })
  if (!admin || !["ADMIN", "SUPER_ADMIN"].includes(admin.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params
  const found = await findModel(id)
  if (!found) return NextResponse.json({ error: "Not found" }, { status: 404 })

  let messages: any[] = []

  if (found.model === "application") {
    const msgs = await db.message.findMany({
      where: { applicationId: id },
      include: { sender: { select: { name: true, role: true } } },
      orderBy: { createdAt: "asc" },
    })
    messages = msgs.map((m) => ({
      id: m.id,
      content: m.content,
      isAdmin: m.isAdminMessage,
      senderName: m.sender?.name ?? "Unknown",
      createdAt: m.createdAt,
    }))
  } else if (found.model === "visa") {
    const msgs = await db.visaMessage.findMany({
      where: { visaApplicationId: id },
      orderBy: { createdAt: "asc" },
    })
    messages = msgs.map((m) => ({
      id: m.id,
      content: m.content,
      isAdmin: m.isAdminMessage,
      senderName: m.isAdminMessage ? "EA Trade Link Team" : "Applicant",
      createdAt: m.createdAt,
    }))
  } else if (found.model === "study") {
    const msgs = await db.studyMessage.findMany({
      where: { studyApplicationId: id },
      orderBy: { createdAt: "asc" },
    })
    messages = msgs.map((m) => ({
      id: m.id,
      content: m.content,
      isAdmin: m.isAdminMessage,
      senderName: m.isAdminMessage ? "EA Trade Link Team" : "Applicant",
      createdAt: m.createdAt,
    }))
  }

  return NextResponse.json(messages)
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const admin = await db.user.findUnique({ where: { id: session.user.id } })
  if (!admin || !["ADMIN", "SUPER_ADMIN"].includes(admin.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params
  const { content } = await req.json()
  if (!content?.trim()) return NextResponse.json({ error: "Content required" }, { status: 400 })

  const found = await findModel(id)
  if (!found) return NextResponse.json({ error: "Not found" }, { status: 404 })

  let message: any

  if (found.model === "application") {
    message = await db.message.create({
      data: {
        senderId: admin.id,
        content: content.trim(),
        isAdminMessage: true,
        applicationId: id,
      },
    })
  } else if (found.model === "visa") {
    message = await db.visaMessage.create({
      data: {
        senderId: admin.id,
        content: content.trim(),
        isAdminMessage: true,
        visaApplicationId: id,
      },
    })
  } else if (found.model === "study") {
    message = await db.studyMessage.create({
      data: {
        senderId: admin.id,
        content: content.trim(),
        isAdminMessage: true,
        studyApplicationId: id,
      },
    })
  }

  // Notify the applicant
  await db.notification.create({
    data: {
      userId: found.userId,
      type: "MESSAGE",
      title: "New message from EA Trade Link",
      message: content.trim().slice(0, 120) + (content.length > 120 ? "…" : ""),
      link: `/dashboard/applications/${id}`,
    },
  })

  return NextResponse.json(message)
}
