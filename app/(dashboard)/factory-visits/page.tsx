import { requireRole } from "@/lib/role-guard"
import FactoryVisitsPageClient from "./factory-client"

export const dynamic = "force-dynamic"

export default async function FactoryVisitsPage() {
  await requireRole(["BUSINESS"])
  return <FactoryVisitsPageClient />
}
