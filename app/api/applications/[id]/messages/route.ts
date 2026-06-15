import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { NextResponse } from "next/server"

async function findApp(id: string, userId: string) {
  const app = await db.application.findFirst({ where: { id, userId } })
  if (app) return { model: "application" as const, userId: app.userId }

  const visa = await db.visaApplication.findFirst({ where: { id, userId } })
  if (visa) return { model: "visa" as const, userId: visa.userId }

  const study = await db.studyApplication.findFirst({ where: { id, userId } })
  if (study) return { model: "study" as const, userId: study.userId }

  return null
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const { content } = await req.json()
  if (!content?.trim()) return NextResponse.json({ error: "Content required" }, { status: 400 })

  const found = await findApp(id, session.user.id)
  if (!found) return NextResponse.json({ error: "Application not found" }, { status: 404 })

  let message: any

  if (found.model === "application") {
    message = await db.message.create({
      data: {
        senderId: session.user.id,
        content: content.trim(),
        isAdminMessage: false,
        applicationId: id,
      },
    })
  } else if (found.model === "visa") {
    message = await db.visaMessage.create({
      data: {
        senderId: session.user.id,
        content: content.trim(),
        isAdminMessage: false,
        visaApplicationId: id,
      },
    })
  } else if (found.model === "study") {
    message = await db.studyMessage.create({
      data: {
        senderId: session.user.id,
        content: content.trim(),
        isAdminMessage: false,
        studyApplicationId: id,
      },
    })
  }

  // Notify all admins
  const admins = await db.user.findMany({
    where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } },
    select: { id: true },
  })
  await db.notification.createMany({
    data: admins.map((a) => ({
      userId: a.id,
      type: "MESSAGE",
      title: "New reply from applicant",
      message: content.trim().slice(0, 120) + (content.length > 120 ? "…" : ""),
      link: `/admin/applications/${id}`,
    })),
  })

  return NextResponse.json(message)
}
