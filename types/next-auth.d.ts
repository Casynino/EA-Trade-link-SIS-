import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: string
      userTypes: string     // JSON: '["STUDENT"]' | '["BUSINESS"]'
      accountType: string   // Derived: "STUDENT" | "BUSINESS" | "ADMIN"
    } & DefaultSession["user"]
  }
}
