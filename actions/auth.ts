"use server"

import { db } from "@/lib/db"
import bcrypt from "bcryptjs"
import { signIn } from "@/lib/auth"

export async function registerUser(formData: FormData) {
  try {
    const name = formData.get("name") as string
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const phone = formData.get("phone") as string | null
    const userTypesRaw = formData.get("userTypes") as string

    if (!name || name.length < 2) return { error: "Name must be at least 2 characters" }
    if (!email || !email.includes("@")) return { error: "Invalid email address" }
    if (!password || password.length < 8) return { error: "Password must be at least 8 characters" }

    let userTypes: string[]
    try {
      userTypes = JSON.parse(userTypesRaw || "[]")
      if (!Array.isArray(userTypes) || userTypes.length === 0) return { error: "Please select your account type." }
      // Only allow STUDENT or BUSINESS
      const valid = userTypes.filter(t => ["STUDENT", "BUSINESS"].includes(t))
      if (valid.length === 0) return { error: "Invalid account type. Please select Student or Business." }
      userTypes = [valid[0]] // enforce single type
    } catch {
      return { error: "Invalid account type selection." }
    }

    const existing = await db.user.findUnique({ where: { email } })
    if (existing) return { error: "Email already registered. Please sign in." }

    const hashed = await bcrypt.hash(password, 12)
    await db.user.create({
      data: {
        name,
        email,
        password: hashed,
        phone: phone || null,
        userTypes: JSON.stringify(userTypes),
        role: "USER",
        emailVerified: new Date(),
      },
    })

    await signIn("credentials", { email, password, redirect: false })

    return { success: true }
  } catch (e: any) {
    if (e?.type === "CredentialsSignin") return { error: "Account created but sign-in failed. Please log in manually." }
    return { error: "Failed to create account. Please try again." }
  }
}
