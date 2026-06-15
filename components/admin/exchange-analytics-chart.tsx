"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

const data = [
  { name: "Jan", rmb_to_tzs: 8, tzs_to_rmb: 5 },
  { name: "Feb", rmb_to_tzs: 12, tzs_to_rmb: 8 },
  { name: "Mar", rmb_to_tzs: 10, tzs_to_rmb: 12 },
  { name: "Apr", rmb_to_tzs: 18, tzs_to_rmb: 10 },
  { name: "May", rmb_to_tzs: 22, tzs_to_rmb: 15 },
  { name: "Jun", rmb_to_tzs: 28, tzs_to_rmb: 18 },
]

export function ExchangeAnalyticsChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Exchange Requests Trend</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={{ fontSize: "12px", borderRadius: "6px" }} />
            <Line type="monotone" dataKey="rmb_to_tzs" name="RMB → TZS" stroke="#0F2557" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="tzs_to_rmb" name="TZS → RMB" stroke="#009688" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
