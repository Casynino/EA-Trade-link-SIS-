import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

export function formatCurrency(amount: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  }).format(amount)
}

export function truncate(str: string, length: number) {
  return str.length > length ? `${str.substring(0, length)}...` : str
}

export function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  SUBMITTED: "bg-blue-100 text-blue-700",
  UNDER_REVIEW: "bg-yellow-100 text-yellow-700",
  DOCUMENTS_REQUIRED: "bg-orange-100 text-orange-700",
  APPLIED: "bg-purple-100 text-purple-700",
  ACCEPTED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  SCHOLARSHIP_AWARDED: "bg-emerald-100 text-emerald-700",
  VISA_PROCESSING: "bg-cyan-100 text-cyan-700",
  COMPLETED: "bg-green-100 text-green-700",
  CANCELLED: "bg-gray-100 text-gray-700",
  EMBASSY_PROCESSING: "bg-indigo-100 text-indigo-700",
  VISA_ISSUED: "bg-emerald-100 text-emerald-700",
  REVIEWING: "bg-yellow-100 text-yellow-700",
  SUPPLIER_SEARCH: "bg-purple-100 text-purple-700",
  QUOTATION_SENT: "bg-blue-100 text-blue-700",
  NEGOTIATING: "bg-orange-100 text-orange-700",
  PLANNING: "bg-indigo-100 text-indigo-700",
  CONFIRMED: "bg-green-100 text-green-700",
  CONTACTED: "bg-blue-100 text-blue-700",
  AWAITING_CONFIRMATION: "bg-yellow-100 text-yellow-700",
  SCHEDULED: "bg-purple-100 text-purple-700",
  APPROVED: "bg-green-100 text-green-700",
}

export const statusLabels: Record<string, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  UNDER_REVIEW: "Under Review",
  DOCUMENTS_REQUIRED: "Documents Required",
  APPLIED: "Applied",
  ACCEPTED: "Accepted",
  REJECTED: "Rejected",
  SCHOLARSHIP_AWARDED: "Scholarship Awarded",
  VISA_PROCESSING: "Visa Processing",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  EMBASSY_PROCESSING: "Embassy Processing",
  VISA_ISSUED: "Visa Issued",
  REVIEWING: "Reviewing",
  SUPPLIER_SEARCH: "Supplier Search",
  QUOTATION_SENT: "Quotation Sent",
  NEGOTIATING: "Negotiating",
  PLANNING: "Planning",
  CONFIRMED: "Confirmed",
  CONTACTED: "Contacted",
  AWAITING_CONFIRMATION: "Awaiting Confirmation",
  SCHEDULED: "Scheduled",
  APPROVED: "Approved",
}
