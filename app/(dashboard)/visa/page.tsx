import { requireRole } from "@/lib/role-guard"
import VisaPageClient from "./visa-client"

export const dynamic = "force-dynamic"

export default async function VisaPage() {
  await requireRole(["BUSINESS"])
  return <VisaPageClient />
}
