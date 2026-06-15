"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

const data = [
  { name: "Jan", scholarships: 12, visa: 8, exchange: 15 },
  { name: "Feb", scholarships: 19, visa: 12, exchange: 22 },
  { name: "Mar", scholarships: 25, visa: 15, exchange: 18 },
  { name: "Apr", scholarships: 31, visa: 20, exchange: 28 },
  { name: "May", scholarships: 28, visa: 18, exchange: 35 },
  { name: "Jun", scholarships: 40, visa: 25, exchange: 42 },
]

export function AdminStatsChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Monthly Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="name" className="text-xs" tick={{ fontSize: 11 }} />
            <YAxis className="text-xs" tick={{ fontSize: 11 }} />
            <Tooltip
              contentStyle={{
                fontSize: "12px",
                border: "1px solid hsl(var(--border))",
                borderRadius: "6px",
              }}
            />
            <Bar dataKey="scholarships" name="Scholarships" fill="#0F2557" radius={[3, 3, 0, 0]} />
            <Bar dataKey="visa" name="Visa" fill="#C8102E" radius={[3, 3, 0, 0]} />
            <Bar dataKey="exchange" name="Exchange" fill="#009688" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
