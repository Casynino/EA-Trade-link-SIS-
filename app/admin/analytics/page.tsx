import { redirect } from "next/navigation"

// Insights are now integrated into the Dashboard.
export default function AdminAnalyticsPage() {
  redirect("/admin/dashboard")
}
