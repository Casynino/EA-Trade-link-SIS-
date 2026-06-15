import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import { PageHeader } from "@/components/shared/page-header"
import { StatusBadge } from "@/components/shared/status-badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatDate } from "@/lib/utils"
import { ExchangeRateEditor } from "@/components/admin/exchange-rate-editor"
import Link from "next/link"

export default async function AdminExchangePage() {
  const session = await auth()
  if (!session || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) redirect("/dashboard")

  const [requests, currentRate] = await Promise.all([
    db.exchangeRequest.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    db.exchangeRate.findFirst({ orderBy: { updatedAt: "desc" } }),
  ])

  return (
    <div className="space-y-6">
      <PageHeader title="Money Exchange" description="Manage exchange requests and rates" />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Rate editor */}
        <ExchangeRateEditor
          currentRmbToTzs={currentRate?.rmbToTzs ?? 390.5}
          currentTzsToRmb={currentRate?.tzsToRmb ?? 0.00256}
        />

        {/* Stats */}
        <div className="lg:col-span-2 grid gap-4 sm:grid-cols-3">
          {[
            { label: "Total Requests", value: requests.length },
            { label: "Pending", value: requests.filter((r) => r.status === "SUBMITTED").length },
            { label: "Completed", value: requests.filter((r) => r.status === "COMPLETED").length },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Exchange Requests</CardTitle></CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Client</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Direction</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Rate Used</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {requests.map((req) => (
                <tr key={req.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium">{req.fullName}</p>
                      <p className="text-xs text-muted-foreground">{req.phone}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs font-mono">
                    {req.direction === "RMB_TO_TZS" ? "¥ → Tsh" : "Tsh → ¥"}
                  </td>
                  <td className="px-4 py-3 text-xs font-medium">
                    {req.amount.toLocaleString()} {req.currency}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {req.rateUsed ? req.rateUsed.toFixed(4) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={req.status} />
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(req.createdAt)}</td>
                  <td className="px-4 py-3">
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/admin/exchange/${req.id}`}>Process</Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {requests.length === 0 && (
            <div className="py-12 text-center text-muted-foreground">No requests yet</div>
          )}
        </div>
      </Card>
    </div>
  )
}
