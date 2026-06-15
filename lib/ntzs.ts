import crypto from "crypto"

const NTZS_BASE = "https://www.ntzs.co.tz"

async function ntzsFetch(path: string, options?: RequestInit) {
  const apiKey = process.env.NTZS_API_KEY
  if (!apiKey || apiKey.startsWith("ntzs_test_placeholder")) {
    throw new Error("NTZS_API_KEY is not configured. Please set it in your environment variables.")
  }

  const res = await fetch(`${NTZS_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...options?.headers,
    },
  })

  const body = await res.json().catch(() => ({ message: "Invalid response from NTZS" }))

  if (!res.ok) {
    const msg = body?.message || body?.error || `NTZS API error ${res.status}`
    throw new NtzsApiError(msg, res.status, body?.error)
  }

  return body
}

export class NtzsApiError extends Error {
  constructor(message: string, public status: number, public code?: string) {
    super(message)
    this.name = "NtzsApiError"
  }
}

// ── User Management ───────────────────────────────────────────────────────────

export interface NtzsUser {
  id: string
  walletAddress: string
  balance?: number
}

/** Create or retrieve an nTZS user. Idempotent — same externalId returns the same user. */
export async function createOrGetNtzsUser(params: {
  externalId: string  // our app's userId
  email: string
  name?: string
  phone?: string
}): Promise<NtzsUser> {
  return ntzsFetch("/api/v1/users", {
    method: "POST",
    body: JSON.stringify(params),
  })
}

// ── Deposits ─────────────────────────────────────────────────────────────────

export interface DepositParams {
  ntzsUserId: string           // nTZS user ID (from createOrGetNtzsUser)
  amountTzs: number            // TZS (minimum 500)
  paymentMethod: "mobile_money" | "card"
  provider?: string            // Vodacom | Airtel | Tigo | Halotel | TTCL | Yass
  phoneNumber?: string         // E.164 format e.g. +255712345678
  collectToTreasury?: boolean  // true → funds go to your treasury wallet
  metadata?: Record<string, string>
}

export interface DepositResponse {
  id: string
  status: string   // submitted | completed | failed
  amountTzs?: number
  paymentMethod?: string
  provider?: string
  phoneNumber?: string
  paymentUrl?: string  // card payments only
  createdAt: string
}

export async function createDeposit(params: DepositParams): Promise<DepositResponse> {
  return ntzsFetch("/api/v1/deposits", {
    method: "POST",
    body: JSON.stringify({
      userId:            params.ntzsUserId,
      amountTzs:         params.amountTzs,
      paymentMethod:     params.paymentMethod,
      provider:          params.provider,
      phoneNumber:       params.phoneNumber,
      collectToTreasury: params.collectToTreasury ?? true,
      metadata:          params.metadata,
    }),
  })
}

export async function getDeposit(depositId: string): Promise<DepositResponse> {
  return ntzsFetch(`/api/v1/deposits/${depositId}`)
}

// ── Webhook verification ──────────────────────────────────────────────────────

export function verifyNtzsWebhook(rawBody: string, timestamp: string, signature: string): boolean {
  const secret = process.env.NTZS_WEBHOOK_SECRET
  if (!secret || secret.startsWith("whsec_placeholder")) return false

  const payload = `${timestamp}.${rawBody}`
  const expected = crypto.createHmac("sha256", secret).update(payload).digest("hex")

  // Constant-time comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
  } catch {
    return false
  }
}

// ── Formatting helpers ────────────────────────────────────────────────────────

export function formatTzs(amount: number): string {
  return `TZS ${amount.toLocaleString("en-TZ")}`
}

// Normalize phone to E.164 Tanzania format (+255...)
export function normalizeTanzaniaPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "")
  if (digits.startsWith("255") && digits.length === 12) return `+${digits}`
  if (digits.startsWith("0") && digits.length === 10) return `+255${digits.slice(1)}`
  if (digits.length === 9) return `+255${digits}`
  return `+${digits}` // pass through, NTZS will validate
}
