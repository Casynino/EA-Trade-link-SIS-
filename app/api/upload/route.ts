import { auth } from "@/lib/auth"
import { NextRequest, NextResponse } from "next/server"
import { UTApi } from "uploadthing/server"

const utapi = new UTApi()

const MAX_SIZE = 16 * 1024 * 1024 // 16 MB
const ALLOWED_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
])

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 })
  }

  const file = formData.get("file") as File | null
  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "No file provided" }, { status: 400 })
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "File too large (max 16 MB)" }, { status: 413 })
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: `File type not allowed. Accepted: PDF, JPG, PNG, WEBP` },
      { status: 415 }
    )
  }

  try {
    const response = await utapi.uploadFiles(file)

    if (response.error) {
      console.error("UploadThing error:", response.error)
      return NextResponse.json(
        { error: "Upload failed. Please check your connection and try again." },
        { status: 500 }
      )
    }

    const url = response.data.ufsUrl ?? response.data.url

    return NextResponse.json({ url, name: file.name })
  } catch (err) {
    console.error("Upload route error:", err)
    return NextResponse.json(
      { error: "Upload failed. Please try again." },
      { status: 500 }
    )
  }
}
