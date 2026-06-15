import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import Credentials from "next-auth/providers/credentials"
import { z } from "zod"
import bcrypt from "bcryptjs"
import { db } from "@/lib/db"

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

const SESSION_MAX_AGE = 30 * 24 * 60 * 60 // 30 days in seconds

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  session: {
    strategy: "jwt",
    maxAge: SESSION_MAX_AGE,
    updateAge: 24 * 60 * 60, // refresh cookie once per day at most
  },
  jwt: {
    maxAge: SESSION_MAX_AGE,
  },
  cookies: {
    sessionToken: {
      name: "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        maxAge: SESSION_MAX_AGE, // makes the cookie persistent (survives browser close)
      },
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      // On sign-in, store user fields from the authorize() return value
      if (user) {
        token.id        = user.id
        token.role      = (user as { role?: string }).role
        token.userTypes = (user as { userTypes?: string }).userTypes
      }
      // Only re-read from DB on initial sign-in or explicit session update,
      // not on every page load — avoids a DB hit per request
      if (user || trigger === "update") {
        try {
          const fresh = await db.user.findUnique({
            where: { id: token.id as string },
            select: { name: true, image: true, role: true, userTypes: true },
          })
          if (fresh) {
            token.name      = fresh.name      // sync name to JWT so header updates instantly
            token.picture   = fresh.image     // sync avatar (NextAuth uses "picture" in JWT)
            token.role      = fresh.role
            token.userTypes = fresh.userTypes
          }
        } catch {
          // DB read failed — keep existing token values
        }
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id    = token.id as string
        session.user.name  = (token.name  as string | null) ?? null
        session.user.image = (token.picture as string | null) ?? null
        session.user.role  = token.role as string
        session.user.userTypes = token.userTypes as string
        // Expose a clean accountType derived from role + userTypes
        const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(token.role as string)
        if (isAdmin) {
          session.user.accountType = "ADMIN"
        } else {
          try {
            const types: string[] = JSON.parse(token.userTypes as string ?? '["STUDENT"]')
            session.user.accountType = types[0] ?? "STUDENT"
          } catch {
            session.user.accountType = "STUDENT"
          }
        }
      }
      return session
    },
  },
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials)
        if (!parsed.success) return null

        const user = await db.user.findUnique({
          where: { email: parsed.data.email },
        })

        if (!user || !user.password) return null

        const valid = await bcrypt.compare(parsed.data.password, user.password)
        if (!valid) return null

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
          userTypes: user.userTypes,
        }
      },
    }),
  ],
})
