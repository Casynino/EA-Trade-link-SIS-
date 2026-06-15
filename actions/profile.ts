"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function updateProfilePhoto(imageUrl: string) {
  const session = await auth()
  if (!session?.user?.id) return { error: "Unauthorized" }
  await db.user.update({ where: { id: session.user.id }, data: { image: imageUrl } })
  revalidatePath("/profile")
  return { success: true }
}

export async function updateProfile(data: {
  name?: string
  phone?: string
  nationality?: string
  address?: string
}) {
  const session = await auth()
  if (!session?.user?.id) return { error: "Unauthorized" }

  const name = data.name?.trim()
  if (!name || name.length < 2) return { error: "Name must be at least 2 characters." }

  await db.user.update({
    where: { id: session.user.id },
    data: {
      name: name || undefined,
      phone: data.phone?.trim() || null,
      nationality: data.nationality?.trim() || null,
      address: data.address?.trim() || null,
    },
  })

  revalidatePath("/profile")
  return { success: true }
}

export async function saveDocument(data: {
  fileUrl: string
  fileName: string
  documentType: string
  fileSize?: number
  mimeType?: string
}) {
  const session = await auth()
  if (!session?.user?.id) return { error: "Unauthorized" }

  const doc = await db.document.create({
    data: {
      userId: session.user.id,
      documentType: data.documentType,
      fileName: data.fileName,
      fileUrl: data.fileUrl,
      fileSize: data.fileSize,
      mimeType: data.mimeType,
    },
  })

  revalidatePath("/profile")
  return { success: true, id: doc.id }
}

export async function deleteDocument(documentId: string) {
  const session = await auth()
  if (!session?.user?.id) return { error: "Unauthorized" }

  const doc = await db.document.findUnique({ where: { id: documentId } })
  if (!doc || doc.userId !== session.user.id) return { error: "Not found" }

  await db.document.delete({ where: { id: documentId } })
  revalidatePath("/profile")
  return { success: true }
}
