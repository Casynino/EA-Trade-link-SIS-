import { redirect } from "next/navigation"

export default async function ScholarshipDetailRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  redirect(`/opportunities/${id}`)
}
