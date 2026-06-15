"use client"

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, Legend,
} from "recharts"

const STATUS_COLORS: Record<string, string> = {
  SUBMITTED:          "#3b82f6",
  UNDER_REVIEW:       "#f59e0b",
  DOCUMENTS_REQUIRED: "#f97316",
  SHORTLISTED:        "#8b5cf6",
  ACCEPTED:           "#22c55e",
  REJECTED:           "#ef4444",
  COMPLETED:          "#14b8a6",
}

const TYPE_COLORS: Record<string, string> = {
  SCHOLARSHIP:      "#3b82f6",
  JOB:              "#22c55e",
  BUSINESS_VISA:    "#8b5cf6",
  FACTORY_VISIT:    "#f97316",
  CANTON_FAIR:      "#ec4899",
  TRADE_EXHIBITION: "#14b8a6",
  CONFERENCE:       "#6366f1",
  EXCHANGE:         "#f59e0b",
}

const TYPE_LABELS: Record<string, string> = {
  SCHOLARSHIP:      "Scholarship",
  JOB:              "Jobs",
  BUSINESS_VISA:    "Biz Visa",
  FACTORY_VISIT:    "Factory",
  CANTON_FAIR:      "Canton",
  TRADE_EXHIBITION: "Trade Expo",
  CONFERENCE:       "Conference",
  EXCHANGE:         "Exchange",
}

export function ApplicationsByTypeChart({ data }: { data: { type: string; count: number }[] }) {
  const chartData = data.map((d) => ({ name: TYPE_LABELS[d.type] ?? d.type, value: d.count, type: d.type }))
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
        <XAxis dataKey="name" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
        <Tooltip
          contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }}
          cursor={{ fill: "rgba(0,0,0,0.04)" }}
        />
        <Bar dataKey="value" name="Applications" radius={[4, 4, 0, 0]}>
          {chartData.map((entry) => (
            <Cell key={entry.type} fill={TYPE_COLORS[entry.type] ?? "#6366f1"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

export function StatusPieChart({ data }: { data: { status: string; count: number }[] }) {
  const chartData = data.map((d) => ({
    name: d.status.replace(/_/g, " "),
    value: d.count,
    status: d.status,
  }))
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={85}
          paddingAngle={2}
          dataKey="value"
        >
          {chartData.map((entry) => (
            <Cell key={entry.status} fill={STATUS_COLORS[entry.status] ?? "#94a3b8"} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }}
          formatter={(value: number, name: string) => [value, name]}
        />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 10 }} />
      </PieChart>
    </ResponsiveContainer>
  )
}

export function ApplicationTrendChart({ data }: { data: { date: string; applications: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <AreaChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
        <defs>
          <linearGradient id="appGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
        <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
        <Tooltip
          contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }}
          cursor={{ stroke: "#3b82f6", strokeWidth: 1 }}
        />
        <Area type="monotone" dataKey="applications" name="Applications" stroke="#3b82f6" strokeWidth={2} fill="url(#appGrad)" dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export function FunnelChart({ views, clicks, applied, approved }: {
  views: number; clicks: number; applied: number; approved: number
}) {
  const steps = [
    { label: "Views",    value: views,    color: "#6366f1" },
    { label: "Clicked",  value: clicks,   color: "#3b82f6" },
    { label: "Applied",  value: applied,  color: "#22c55e" },
    { label: "Approved", value: approved, color: "#f59e0b" },
  ]
  const max = Math.max(...steps.map((s) => s.value), 1)
  return (
    <div className="space-y-3 py-2">
      {steps.map((s, i) => (
        <div key={s.label} className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground font-medium">{s.label}</span>
            <span className="font-bold tabular-nums">{s.value.toLocaleString()}</span>
          </div>
          <div className="h-7 w-full rounded-lg bg-gray-100 overflow-hidden">
            <div
              className="h-full rounded-lg flex items-center justify-end pr-2 transition-all duration-700"
              style={{ width: `${Math.max((s.value / max) * 100, 4)}%`, backgroundColor: s.color }}
            >
              {s.value > 0 && i > 0 && (
                <span className="text-[10px] text-white font-semibold">
                  {Math.round((s.value / steps[0].value) * 100)}%
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
