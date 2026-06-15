import { requireRole } from "@/lib/role-guard"
import VisaPageClient from "./visa-client"

export default async function VisaPage() {
  await requireRole(["BUSINESS"])
  return <VisaPageClient />
}
