"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CreditCard, Zap } from "lucide-react"
import { PaymentModal } from "./payment-modal"

interface PayNowButtonProps {
  applicationId: string
  applicationType: string
  totalFee: number
  defaultPhone?: string
  variant?: "banner" | "sidebar"
}

export function PayNowButton({
  applicationId, applicationType, totalFee, defaultPhone, variant = "banner",
}: PayNowButtonProps) {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  function handleSuccess() {
    setOpen(false)
    router.refresh()
  }

  if (variant === "sidebar") {
    return (
      <>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-black transition-all hover:opacity-90 active:scale-[0.98]"
          style={{
            background: "linear-gradient(135deg, #D4AF37, #b8962f)",
            color: "#05091a",
            boxShadow: "0 4px 20px rgba(212,175,55,0.3)",
          }}
        >
          <CreditCard className="h-4 w-4" />
          Pay Now
        </button>
        <PaymentModal
          isOpen={open}
          onClose={() => setOpen(false)}
          onSuccess={handleSuccess}
          applicationId={applicationId}
          applicationType={applicationType}
          totalFee={totalFee}
          defaultPhone={defaultPhone}
        />
      </>
    )
  }

  // Banner variant
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-black transition-all hover:opacity-90 active:scale-[0.98]"
        style={{
          background: "linear-gradient(135deg, #D4AF37, #b8962f)",
          color: "#05091a",
          boxShadow: "0 4px 24px rgba(212,175,55,0.4)",
        }}
      >
        <Zap className="h-4 w-4" />
        Pay Now via Mobile Money
      </button>
      <PaymentModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onSuccess={handleSuccess}
        applicationId={applicationId}
        applicationType={applicationType}
        totalFee={totalFee}
        defaultPhone={defaultPhone}
      />
    </>
  )
}
