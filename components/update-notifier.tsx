"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { RefreshCw, X } from "lucide-react"

/** How often to ask the server which build is live. */
const POLL_MS = 60_000

/**
 * Tells the user when a newer version of the site has been deployed, so they
 * can reload instead of sitting on stale code.
 *
 * It records the build id seen on first load, then re-checks periodically and
 * whenever the tab regains focus. A changed id means a deploy happened while
 * this page was open.
 */
export function UpdateNotifier() {
  // The build this page was loaded with. Null until the first check completes.
  const loadedVersion = useRef<string | null>(null)
  const [updateReady, setUpdateReady] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [reloading, setReloading] = useState(false)

  const check = useCallback(async () => {
    try {
      const res = await fetch("/api/version", { cache: "no-store" })
      if (!res.ok) return

      const { version } = (await res.json()) as { version?: string }
      if (!version) return

      // First successful check just establishes the baseline.
      if (loadedVersion.current === null) {
        loadedVersion.current = version
        return
      }

      if (version !== loadedVersion.current) setUpdateReady(true)
    } catch {
      // Offline or a blip — try again on the next tick.
    }
  }, [])

  useEffect(() => {
    check()

    const interval = setInterval(check, POLL_MS)
    // Someone coming back to the tab is exactly when a stale page is likely.
    const onFocus = () => {
      if (document.visibilityState === "visible") check()
    }
    document.addEventListener("visibilitychange", onFocus)
    window.addEventListener("focus", onFocus)

    return () => {
      clearInterval(interval)
      document.removeEventListener("visibilitychange", onFocus)
      window.removeEventListener("focus", onFocus)
    }
  }, [check])

  if (!updateReady || dismissed) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-2.5 left-1/2 z-[100] max-w-[calc(100%-1.5rem)] -translate-x-1/2"
    >
      <div
        className="flex items-center gap-1.5 rounded-full py-1 pl-2.5 pr-1 backdrop-blur-xl"
        style={{
          background: "rgba(14, 20, 42, 0.95)",
          border: "1px solid rgba(212, 175, 55, 0.3)",
          boxShadow: "0 6px 22px rgba(0,0,0,0.45)",
          animation: "ea-update-in 240ms cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        <p className="whitespace-nowrap text-[11px] font-semibold text-white">New update is up</p>

        <button
          onClick={() => {
            setReloading(true)
            // Give React a frame to paint the spinning state — reloading
            // synchronously tears the page down before it is ever seen.
            setTimeout(() => window.location.reload(), 150)
          }}
          disabled={reloading}
          aria-label={reloading ? "Updating" : "Update now"}
          title={reloading ? "Updating" : "Update now"}
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-all hover:brightness-110 disabled:opacity-70"
          style={{ background: "#D4AF37", color: "#05091a" }}
        >
          <RefreshCw className={`h-3 w-3 ${reloading ? "animate-spin" : ""}`} />
        </button>

        <button
          onClick={() => setDismissed(true)}
          aria-label="Dismiss update notice"
          className="shrink-0 rounded-full p-0.5 transition-colors hover:bg-white/10"
          style={{ color: "rgba(255,255,255,0.3)" }}
        >
          <X className="h-2.5 w-2.5" />
        </button>
      </div>

      <style>{`
        @keyframes ea-update-in {
          from { opacity: 0; transform: translateY(-12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
