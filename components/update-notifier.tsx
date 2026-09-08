"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Loader2, RefreshCw, X } from "lucide-react"

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
      className="fixed top-4 left-1/2 z-[100] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 sm:w-auto"
    >
      <div
        className="flex items-center gap-3 rounded-2xl px-4 py-3 shadow-2xl backdrop-blur-xl"
        style={{
          background: "rgba(14, 20, 42, 0.94)",
          border: "1px solid rgba(212, 175, 55, 0.35)",
          boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
          animation: "ea-update-in 260ms cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
          style={{ background: "rgba(212,175,55,0.14)" }}
        >
          <RefreshCw className="h-4 w-4" style={{ color: "#D4AF37" }} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold leading-tight text-white">New update is up</p>
        </div>

        <button
          onClick={() => {
            setReloading(true)
            // Give React a frame to paint the spinner — reloading synchronously
            // can tear down the page before the loading state is ever seen.
            setTimeout(() => window.location.reload(), 150)
          }}
          disabled={reloading}
          className="flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-black transition-all hover:scale-105 disabled:opacity-70 disabled:hover:scale-100"
          style={{ background: "#D4AF37", color: "#05091a" }}
        >
          {reloading ? "Updating" : "Update now"}
          {reloading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        </button>

        <button
          onClick={() => setDismissed(true)}
          aria-label="Dismiss update notice"
          className="shrink-0 rounded-lg p-1 transition-colors hover:bg-white/10"
          style={{ color: "rgba(255,255,255,0.35)" }}
        >
          <X className="h-3.5 w-3.5" />
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
