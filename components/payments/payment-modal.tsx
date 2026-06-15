"use client"

import { useState, useRef, useEffect } from "react"
import {
  CreditCard, Smartphone, X, CheckCircle2, Loader2,
  AlertCircle, ArrowRight, Phone, ExternalLink,
} from "lucide-react"

const PROVIDERS = [
  { value: "Vodacom", label: "M-Pesa",       brand: "Vodacom", color: "#e02020", bg: "rgba(224,32,32,0.10)", border: "rgba(224,32,32,0.25)" },
  { value: "Airtel",  label: "Airtel Money", brand: "Airtel",  color: "#e87722", bg: "rgba(232,119,34,0.10)", border: "rgba(232,119,34,0.25)" },
  { value: "Tigo",    label: "Tigo Pesa",    brand: "Tigo",    color: "#0066b3", bg: "rgba(0,102,179,0.10)",  border: "rgba(0,102,179,0.25)"  },
  { value: "Halotel", label: "HaloPesa",     brand: "Halotel", color: "#00a651", bg: "rgba(0,166,81,0.10)",  border: "rgba(0,166,81,0.25)"  },
]

type Step = "select" | "awaiting" | "success" | "error"

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  applicationId: string
  applicationType: string
  totalFee: number
  defaultPhone?: string
}

export function PaymentModal({
  isOpen, onClose, onSuccess,
  applicationId, applicationType, totalFee, defaultPhone = "",
}: PaymentModalProps) {
  const [step, setStep] = useState<Step>("select")
  const [provider, setProvider] = useState("")
  const [phone, setPhone] = useState(defaultPhone)
  const [loading, setLoading] = useState(false)
  const [paymentId, setPaymentId] = useState("")
  const [errorMsg, setErrorMsg] = useState("")
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setStep("select")
      setProvider("")
      setPhone(defaultPhone)
      setLoading(false)
      setErrorMsg("")
      setPaymentId("")
    } else {
      stopPolling()
    }
  }, [isOpen, defaultPhone])

  // Cleanup on unmount
  useEffect(() => () => stopPolling(), [])

  function stopPolling() {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
    if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null }
  }

  function startPolling(pid: string) {
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/payments/status/${pid}`)
        const data = await res.json()
        if (data.status === "COMPLETED") {
          stopPolling()
          setStep("success")
          setTimeout(() => { onSuccess() }, 2200)
        } else if (data.status === "FAILED") {
          stopPolling()
          setErrorMsg("Payment was declined or failed. Please try again.")
          setStep("error")
        }
      } catch {
        // Network error during poll — keep trying
      }
    }, 5000)

    // Auto-expire after 7 minutes if no confirmation
    timeoutRef.current = setTimeout(() => {
      stopPolling()
      if (step === "awaiting") {
        setErrorMsg("Payment timed out. If you authorized the payment on your phone, please contact support.")
        setStep("error")
      }
    }, 7 * 60 * 1000)
  }

  async function handlePay() {
    if (!provider || !phone) return
    setLoading(true)
    setErrorMsg("")
    try {
      const res = await fetch("/api/payments/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId,
          applicationType,
          amount: totalFee,
          method: "mobile_money",
          provider,
          phone,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErrorMsg(data.error || "Failed to initiate payment.")
        setStep("error")
        return
      }
      setPaymentId(data.paymentId)
      setStep("awaiting")
      startPolling(data.paymentId)
    } catch {
      setErrorMsg("Network error. Check your connection and try again.")
      setStep("error")
    } finally {
      setLoading(false)
    }
  }

  function handleClose() {
    stopPolling()
    onClose()
  }

  if (!isOpen) return null

  const selectedProvider = PROVIDERS.find(p => p.value === provider)

  const fmtAmount = `TZS ${totalFee.toLocaleString()}`

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}
        onClick={e => { if (e.target === e.currentTarget) handleClose() }}
      >
        <div
          className="relative w-full max-w-md rounded-2xl overflow-hidden"
          style={{
            background: "linear-gradient(145deg, #080f28, #050b1f)",
            border: "1px solid rgba(255,255,255,0.1)",
            boxShadow: "0 0 80px rgba(212,175,55,0.08), 0 32px 80px rgba(0,0,0,0.6)",
          }}
        >
          {/* Gold top border */}
          <div className="h-[2px]" style={{ background: "linear-gradient(to right, transparent, #D4AF37, #C8102E, transparent)" }} />

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg"
                style={{ background: "rgba(212,175,55,0.12)", border: "1px solid rgba(212,175,55,0.25)" }}>
                <CreditCard className="h-4 w-4" style={{ color: "#D4AF37" }} />
              </div>
              <div>
                <p className="text-sm font-black text-white">Secure Payment</p>
                <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>Powered by nTZS</p>
              </div>
            </div>
            <button onClick={handleClose}
              className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors hover:bg-white/10"
              style={{ color: "rgba(255,255,255,0.35)" }}>
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* ── Step: select provider ── */}
          {step === "select" && (
            <div className="px-6 py-5 space-y-5">
              {/* Amount */}
              <div className="rounded-xl px-5 py-4 text-center"
                style={{ background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.18)" }}>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-1"
                  style={{ color: "rgba(212,175,55,0.7)" }}>Amount Due</p>
                <p className="text-3xl font-black" style={{ color: "#D4AF37" }}>{fmtAmount}</p>
              </div>

              {/* Provider selection */}
              <div>
                <p className="text-xs font-bold mb-3" style={{ color: "rgba(255,255,255,0.55)" }}>
                  Select Mobile Money Provider
                </p>
                <div className="grid grid-cols-2 gap-2.5">
                  {PROVIDERS.map(p => {
                    const active = provider === p.value
                    return (
                      <button key={p.value} type="button" onClick={() => setProvider(p.value)}
                        className="rounded-xl px-4 py-3 text-left transition-all hover:-translate-y-0.5"
                        style={{
                          background: active ? p.bg : "rgba(255,255,255,0.04)",
                          border: `1.5px solid ${active ? p.border : "rgba(255,255,255,0.08)"}`,
                          boxShadow: active ? `0 0 16px ${p.bg}` : "none",
                        }}>
                        <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5"
                          style={{ color: active ? p.color : "rgba(255,255,255,0.3)" }}>
                          {p.brand}
                        </p>
                        <p className="text-xs font-black"
                          style={{ color: active ? "white" : "rgba(255,255,255,0.6)" }}>
                          {p.label}
                        </p>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Phone number */}
              <div>
                <label className="block text-xs font-bold mb-2" style={{ color: "rgba(255,255,255,0.55)" }}>
                  <Phone className="inline h-3 w-3 mr-1.5 -mt-0.5" />
                  Mobile Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="0712 345 678 or +255 712 345 678"
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none text-white placeholder:opacity-30"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                />
                <p className="mt-1.5 text-[10px]" style={{ color: "rgba(255,255,255,0.22)" }}>
                  You will receive a USSD payment prompt on this number.
                </p>
              </div>

              {/* Pay button */}
              <button
                type="button"
                disabled={!provider || !phone || loading}
                onClick={handlePay}
                className="w-full flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-black transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 active:scale-[0.98]"
                style={{
                  background: provider
                    ? `linear-gradient(135deg, ${selectedProvider?.color ?? "#D4AF37"}, ${selectedProvider?.color ?? "#D4AF37"}cc)`
                    : "rgba(255,255,255,0.08)",
                  color: provider ? "#fff" : "rgba(255,255,255,0.4)",
                  boxShadow: provider ? `0 4px 24px ${selectedProvider?.bg}` : "none",
                }}
              >
                {loading
                  ? <><Loader2 className="h-4 w-4 animate-spin" />Sending request…</>
                  : <><Smartphone className="h-4 w-4" />Pay {fmtAmount}<ArrowRight className="h-4 w-4 ml-1" /></>}
              </button>

              <p className="text-center text-[10px]" style={{ color: "rgba(255,255,255,0.18)" }}>
                Secured & processed by nTZS · Funds go directly to EA Trade Link
              </p>
            </div>
          )}

          {/* ── Step: awaiting phone confirmation ── */}
          {step === "awaiting" && (
            <div className="px-6 py-8 text-center space-y-5">
              <div className="flex items-center justify-center">
                <div className="relative h-20 w-20">
                  <div className="absolute inset-0 rounded-full animate-ping opacity-20"
                    style={{ background: selectedProvider?.color ?? "#D4AF37" }} />
                  <div className="relative flex h-20 w-20 items-center justify-center rounded-full"
                    style={{ background: `${selectedProvider?.bg ?? "rgba(212,175,55,0.12)"}`, border: `2px solid ${selectedProvider?.color ?? "#D4AF37"}` }}>
                    <Smartphone className="h-9 w-9" style={{ color: selectedProvider?.color ?? "#D4AF37" }} />
                  </div>
                </div>
              </div>

              <div>
                <p className="text-lg font-black text-white mb-2">Check Your Phone</p>
                <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
                  A {selectedProvider?.label ?? "mobile money"} payment request of{" "}
                  <span className="font-bold text-white">{fmtAmount}</span> has been sent to{" "}
                  <span className="font-bold text-white">{phone}</span>.
                </p>
              </div>

              <div className="rounded-xl px-4 py-3.5"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <p className="text-xs font-bold text-white mb-1">Enter your PIN to confirm</p>
                <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.35)" }}>
                  Open the USSD prompt on your phone and enter your mobile money PIN.
                </p>
              </div>

              <div className="flex items-center justify-center gap-2" style={{ color: "rgba(255,255,255,0.35)" }}>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-xs">Waiting for confirmation…</span>
              </div>

              <button type="button" onClick={handleClose}
                className="text-xs underline-offset-2 hover:underline transition-colors"
                style={{ color: "rgba(255,255,255,0.25)" }}>
                Cancel and go back
              </button>
            </div>
          )}

          {/* ── Step: success ── */}
          {step === "success" && (
            <div className="px-6 py-10 text-center space-y-4">
              <div className="flex items-center justify-center">
                <div className="relative h-20 w-20">
                  <div className="absolute inset-0 rounded-full opacity-20"
                    style={{ background: "#34d399", animation: "ping 1s ease-out 1" }} />
                  <div className="relative flex h-20 w-20 items-center justify-center rounded-full"
                    style={{ background: "rgba(52,211,153,0.12)", border: "2px solid #34d399" }}>
                    <CheckCircle2 className="h-10 w-10 text-emerald-400" />
                  </div>
                </div>
              </div>
              <div>
                <p className="text-xl font-black text-white mb-2">Payment Confirmed!</p>
                <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
                  <span className="font-bold text-white">{fmtAmount}</span> received successfully.
                  <br />Your application is now being processed.
                </p>
              </div>
              <div className="flex items-center justify-center gap-1.5 text-xs"
                style={{ color: "rgba(52,211,153,0.7)" }}>
                <CheckCircle2 className="h-3.5 w-3.5" />
                Refreshing your application…
              </div>
            </div>
          )}

          {/* ── Step: error ── */}
          {step === "error" && (
            <div className="px-6 py-8 text-center space-y-5">
              <div className="flex items-center justify-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full"
                  style={{ background: "rgba(248,113,113,0.12)", border: "2px solid rgba(248,113,113,0.4)" }}>
                  <AlertCircle className="h-10 w-10 text-red-400" />
                </div>
              </div>
              <div>
                <p className="text-lg font-black text-white mb-2">Payment Failed</p>
                <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
                  {errorMsg || "Something went wrong. Please try again."}
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <button type="button" onClick={() => { setStep("select"); setErrorMsg("") }}
                  className="w-full rounded-xl py-3 text-sm font-bold transition-all hover:opacity-90"
                  style={{ background: "rgba(255,255,255,0.08)", color: "white", border: "1px solid rgba(255,255,255,0.12)" }}>
                  Try Again
                </button>
                <a href="https://wa.me/255672037939" target="_blank" rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-1.5 rounded-xl py-3 text-sm font-bold transition-all hover:opacity-90"
                  style={{ background: "rgba(52,211,153,0.08)", color: "#34d399", border: "1px solid rgba(52,211,153,0.2)" }}>
                  <ExternalLink className="h-3.5 w-3.5" />Contact Support on WhatsApp
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
