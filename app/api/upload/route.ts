import { auth } from "@/lib/auth"
import { NextRequest, NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get("file") as File | null
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 })

  const maxSize = 16 * 1024 * 1024 // 16MB
  if (file.size > maxSize) return NextResponse.json({ error: "File too large (max 16MB)" }, { status: 413 })

  const allowed = ["application/pdf","image/jpeg","image/png","image/webp","image/jpg"]
  if (!allowed.includes(file.type)) return NextResponse.json({ error: "File type not allowed" }, { status: 415 })

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  const ext = file.name.split(".").pop() ?? "bin"
  const safeName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const uploadDir = join(process.cwd(), "public", "uploads")

  await mkdir(uploadDir, { recursive: true })
  await writeFile(join(uploadDir, safeName), buffer)

  return NextResponse.json({ url: `/uploads/${safeName}`, name: file.name })
}

export const config = { api: { bodyParser: false } }
