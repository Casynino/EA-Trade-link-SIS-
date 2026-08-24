"use client"

import { useRef, useState } from "react"
import { ImageIcon, Upload, X, Loader2 } from "lucide-react"

interface ImageUploadFieldProps {
  /** name of the hidden input — used in native FormData forms */
  name?: string
  /** controlled value (state-based forms) */
  value?: string
  /** controlled onChange (state-based forms) */
  onChange?: (url: string) => void
  /** pre-existing URL — uncontrolled default */
  defaultValue?: string
  label?: string
}

export function ImageUploadField({
  name = "imageUrl",
  value,
  onChange,
  defaultValue = "",
  label = "Cover Image",
}: ImageUploadFieldProps) {
  // If value/onChange are provided, we're in controlled mode
  const isControlled = value !== undefined && onChange !== undefined
  const [internalUrl, setInternalUrl] = useState(defaultValue)
  const url = isControlled ? value : internalUrl

  function setUrl(u: string) {
    if (isControlled) onChange(u)
    else setInternalUrl(u)
  }

  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState("")
  const inputRef              = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("Only image files are allowed (JPG, PNG, WEBP).")
      return
    }
    if (file.size > 8 * 1024 * 1024) {
      setError("Image must be under 8 MB.")
      return
    }
    setError("")
    setLoading(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      const res = await fetch("/api/upload", { method: "POST", body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Upload failed")
      setUrl(data.url)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Upload failed. Try again.")
    } finally {
      setLoading(false)
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  return (
    <div className="space-y-2">
      <label className="block text-xs font-semibold" style={{ color: "rgba(255,255,255,0.55)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
        {label}
      </label>

      {/* Hidden input carries the URL to native FormData forms */}
      {!isControlled && <input type="hidden" name={name} value={url} />}

      {url ? (
        <div className="relative rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="Cover preview" className="w-full object-cover" style={{ maxHeight: 200 }} />
          <button
            type="button"
            onClick={() => setUrl("")}
            className="absolute top-2 right-2 flex items-center justify-center rounded-full h-7 w-7 transition-colors"
            style={{ background: "rgba(0,0,0,0.7)", color: "#fff" }}
            title="Remove image"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          onDrop={onDrop}
          onDragOver={e => e.preventDefault()}
          className="flex flex-col items-center justify-center gap-2 rounded-xl cursor-pointer transition-colors"
          style={{
            height: 140,
            border: "1.5px dashed rgba(212,175,55,0.3)",
            background: "rgba(212,175,55,0.04)",
          }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(212,175,55,0.6)")}
          onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(212,175,55,0.3)")}
        >
          {loading ? (
            <Loader2 className="h-6 w-6 animate-spin" style={{ color: "#D4AF37" }} />
          ) : (
            <>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: "rgba(212,175,55,0.1)" }}>
                <ImageIcon className="h-5 w-5" style={{ color: "#D4AF37" }} />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.7)" }}>
                  <Upload className="inline h-3.5 w-3.5 mr-1" />Click to upload or drag &amp; drop
                </p>
                <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>
                  JPG, PNG, WEBP — max 8 MB
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {error && (
        <p className="text-xs" style={{ color: "#f87171" }}>{error}</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
      />
    </div>
  )
}
