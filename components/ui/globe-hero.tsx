"use client"

import { useRef, useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { HeroBackground } from "./hero-background"

// ── Geo helpers ───────────────────────────────────────────────────────────────
function latLngToXY(
  lat: number, lng: number,
  rotY: number,          // current Y-rotation in radians
  cx: number, cy: number, r: number
): { x: number; y: number; visible: boolean; depth: number } {
  const phi   = (90 - lat)  * (Math.PI / 180)
  const theta = (lng + 180) * (Math.PI / 180) + rotY

  const x3 = -Math.sin(phi) * Math.cos(theta)
  const y3 =  Math.cos(phi)
  const z3 =  Math.sin(phi) * Math.sin(theta)

  // Simple orthographic-like projection
  return {
    x: cx + r * x3,
    y: cy - r * y3,
    visible: z3 > -0.15,
    depth: z3,
  }
}

function buildArc(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
  rotY: number,
  cx: number, cy: number, r: number,
  segments = 80
): { x: number; y: number; visible: boolean; depth: number }[] {
  const pts = []
  for (let i = 0; i <= segments; i++) {
    const t   = i / segments
    const lat = lat1 + (lat2 - lat1) * t
    const lng = lng1 + (lng2 - lng1) * t
    // Arc height: sin curve pushes mid-points outward
    const liftR = r + r * 0.35 * Math.sin(t * Math.PI)

    const phi   = (90 - lat)  * (Math.PI / 180)
    const theta = (lng + 180) * (Math.PI / 180) + rotY
    const x3 = -Math.sin(phi) * Math.cos(theta)
    const y3 =  Math.cos(phi)
    const z3 =  Math.sin(phi) * Math.sin(theta)

    pts.push({
      x: cx + liftR * x3,
      y: cy - liftR * y3,
      visible: z3 > -0.1,
      depth: z3,
    })
  }
  return pts
}

// Lat/lng grid line points
function latLinePoints(lat: number, rotY: number, cx: number, cy: number, r: number, steps = 120) {
  return Array.from({ length: steps + 1 }, (_, i) => {
    const lng = -180 + (360 * i) / steps
    return latLngToXY(lat, lng, rotY, cx, cy, r)
  })
}
function lngLinePoints(lng: number, rotY: number, cx: number, cy: number, r: number, steps = 80) {
  return Array.from({ length: steps + 1 }, (_, i) => {
    const lat = -90 + (180 * i) / steps
    return latLngToXY(lat, lng, rotY, cx, cy, r)
  })
}

// ── Cities ────────────────────────────────────────────────────────────────────
const CITIES = [
  { name: "DAR ES SALAAM", flag: "🇹🇿", lat: -6.8,  lng: 39.3,  primary: true,  color: "#4ade80" },
  { name: "BEIJING",       flag: "🇨🇳", lat: 39.9,  lng: 116.4, primary: true,  color: "#f87171" },
  { name: "GUANGZHOU",     flag: "🇨🇳", lat: 23.1,  lng: 113.3, primary: false, color: "#fb923c" },
  { name: "SHANGHAI",      flag: "🇨🇳", lat: 31.2,  lng: 121.5, primary: false, color: "#fb923c" },
  { name: "NAIROBI",       flag: "🇰🇪", lat: -1.3,  lng: 36.8,  primary: false, color: "#60a5fa" },
]

const ARCS = [
  { from: CITIES[0], to: CITIES[1], color: "#D4AF37" },
  { from: CITIES[0], to: CITIES[2], color: "#D4AF3780" },
]

// ── Canvas globe renderer ─────────────────────────────────────────────────────
function GlobeCanvas({ size }: { size: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rotY = useRef(0)
  const arcOffset = useRef(0)
  const raf = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    canvas.width  = size * dpr
    canvas.height = size * dpr
    ctx.scale(dpr, dpr)

    const cx = size / 2
    const cy = size / 2
    const r  = size * 0.38

    function draw() {
      ctx.clearRect(0, 0, size, size)

      // ── Outer atmosphere glow ──
      const glow = ctx.createRadialGradient(cx, cy, r * 0.85, cx, cy, r * 1.2)
      glow.addColorStop(0, "rgba(96,165,250,0.10)")
      glow.addColorStop(1, "rgba(96,165,250,0)")
      ctx.fillStyle = glow
      ctx.beginPath()
      ctx.arc(cx, cy, r * 1.2, 0, Math.PI * 2)
      ctx.fill()

      // ── Globe base ──
      const base = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.05, cx, cy, r)
      base.addColorStop(0, "rgba(186,222,255,0.18)")
      base.addColorStop(0.6, "rgba(120,180,255,0.10)")
      base.addColorStop(1, "rgba(60,120,220,0.06)")
      ctx.fillStyle = base
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.fill()

      // ── Latitude lines ──
      for (const lat of [-60, -30, 0, 30, 60]) {
        const pts = latLinePoints(lat, rotY.current, cx, cy, r)
        let started = false
        ctx.beginPath()
        for (const p of pts) {
          if (!p.visible) { started = false; continue }
          if (!started) { ctx.moveTo(p.x, p.y); started = true }
          else ctx.lineTo(p.x, p.y)
        }
        ctx.strokeStyle = lat === 0 ? "rgba(147,197,253,0.30)" : "rgba(147,197,253,0.13)"
        ctx.lineWidth = lat === 0 ? 0.8 : 0.5
        ctx.stroke()
      }

      // ── Longitude lines ──
      for (let lng = -150; lng <= 180; lng += 30) {
        const pts = lngLinePoints(lng, rotY.current, cx, cy, r)
        let started = false
        ctx.beginPath()
        for (const p of pts) {
          if (!p.visible) { started = false; continue }
          if (!started) { ctx.moveTo(p.x, p.y); started = true }
          else ctx.lineTo(p.x, p.y)
        }
        ctx.strokeStyle = "rgba(147,197,253,0.12)"
        ctx.lineWidth = 0.5
        ctx.stroke()
      }

      // ── Globe edge ring ──
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.strokeStyle = "rgba(147,197,253,0.35)"
      ctx.lineWidth = 1.2
      ctx.stroke()

      // ── Arcs ──
      for (const arc of ARCS) {
        const pts = buildArc(arc.from.lat, arc.from.lng, arc.to.lat, arc.to.lng, rotY.current, cx, cy, r)
        const visiblePts = pts.filter(p => p.visible)
        if (visiblePts.length < 2) continue

        // Faint full arc
        ctx.beginPath()
        let started = false
        for (const p of pts) {
          if (!p.visible) { started = false; continue }
          if (!started) { ctx.moveTo(p.x, p.y); started = true }
          else ctx.lineTo(p.x, p.y)
        }
        const isMain = arc.color === "#D4AF37"
        ctx.strokeStyle = isMain ? "rgba(212,175,55,0.18)" : "rgba(212,175,55,0.08)"
        ctx.lineWidth = isMain ? 1 : 0.5
        ctx.setLineDash([])
        ctx.stroke()

        if (!isMain) continue

        // Traveling bright segment
        const total = pts.length
        const segLen = 28
        const startIdx = Math.floor((arcOffset.current % 1) * total)
        const travelPts: typeof pts = []
        for (let i = 0; i < segLen; i++) {
          travelPts.push(pts[(startIdx + i) % total])
        }

        const grad = ctx.createLinearGradient(
          travelPts[0].x, travelPts[0].y,
          travelPts[segLen - 1].x, travelPts[segLen - 1].y
        )
        grad.addColorStop(0, "rgba(212,175,55,0)")
        grad.addColorStop(0.5, "rgba(212,175,55,0.95)")
        grad.addColorStop(1, "rgba(212,175,55,0)")

        ctx.beginPath()
        started = false
        for (const p of travelPts) {
          if (!p.visible) { started = false; continue }
          if (!started) { ctx.moveTo(p.x, p.y); started = true }
          else ctx.lineTo(p.x, p.y)
        }
        ctx.strokeStyle = grad
        ctx.lineWidth = 2.5
        ctx.shadowBlur = 8
        ctx.shadowColor = "#D4AF37"
        ctx.stroke()
        ctx.shadowBlur = 0
      }

      // ── City pins ──
      for (const city of CITIES) {
        const p = latLngToXY(city.lat, city.lng, rotY.current, cx, cy, r)
        if (!p.visible) continue

        const alpha = Math.max(0.2, p.depth)
        const isPrimary = city.primary

        // Outer pulse ring
        const pulseScale = 1 + 0.4 * Math.abs(Math.sin(arcOffset.current * Math.PI * 4 + city.lat))
        ctx.beginPath()
        ctx.arc(p.x, p.y, (isPrimary ? 8 : 5) * pulseScale, 0, Math.PI * 2)
        ctx.strokeStyle = city.color + Math.round(alpha * 80).toString(16).padStart(2, "0")
        ctx.lineWidth = isPrimary ? 1.5 : 1
        ctx.stroke()

        // Core dot
        ctx.beginPath()
        ctx.arc(p.x, p.y, isPrimary ? 4 : 2.5, 0, Math.PI * 2)
        ctx.fillStyle = city.color
        ctx.shadowBlur = isPrimary ? 12 : 6
        ctx.shadowColor = city.color
        ctx.fill()
        ctx.shadowBlur = 0

        // Label
        if (isPrimary || p.depth > 0.3) {
          const labelX = p.x + (isPrimary ? 14 : 10)
          const labelY = p.y - (isPrimary ? 6 : 4)
          ctx.font = `bold ${isPrimary ? 10 : 8}px monospace`
          ctx.fillStyle = `rgba(226,232,240,${alpha * 0.9})`
          ctx.fillText(`[${city.flag} ${city.name}]`, labelX, labelY)
        }
      }

      // ── Dot map (land dots) ──
      // Draw small dots to suggest continents
    }

    function loop() {
      rotY.current   += 0.003
      arcOffset.current = (arcOffset.current + 0.0025) % 1
      draw()
      raf.current = requestAnimationFrame(loop)
    }
    raf.current = requestAnimationFrame(loop)

    return () => cancelAnimationFrame(raf.current)
  }, [size])

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      style={{ width: size, height: size, display: "block" }}
    />
  )
}

// ── Animated keyword switcher ─────────────────────────────────────────────────
const KEYWORDS = ["Scholarships", "Business Visas", "Jobs in China", "Factory Visits", "Trade & Sourcing", "Canton Fair"]

function RotatingKeyword() {
  const [index, setIndex] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % KEYWORDS.length), 2400)
    return () => clearInterval(id)
  }, [])
  return (
    <div className="relative h-10 overflow-hidden flex items-center">
      <AnimatePresence mode="wait">
        <motion.span
          key={KEYWORDS[index]}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0,  opacity: 1 }}
          exit={  { y: -20, opacity: 0 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
          className="absolute text-brand-gold font-bold text-2xl sm:text-3xl md:text-4xl"
        >
          {KEYWORDS[index]}
        </motion.span>
      </AnimatePresence>
    </div>
  )
}

// ── Floating orbit chips ──────────────────────────────────────────────────────
const CHIPS = [
  { label: "🎓 Scholarships",    angle: 0   },
  { label: "💼 Jobs in China",   angle: 51  },
  { label: "🏭 Factory Visits",  angle: 102 },
  { label: "🏪 Canton Fair",     angle: 153 },
  { label: "✈️ Business Visa",   angle: 204 },
  { label: "📊 Trade & Sourcing",angle: 255 },
  { label: "🤝 Conferences",     angle: 306 },
]

function FloatingChips({ tick }: { tick: number }) {
  const elapsed = tick * 0.05
  return (
    <div className="pointer-events-none absolute inset-0">
      {CHIPS.map((chip) => {
        const baseAngle = (chip.angle * Math.PI) / 180
        const angle = baseAngle + elapsed * 0.10
        const rx = 48, ry = 26, cx = 50, cy = 50
        const x = cx + rx * Math.cos(angle)
        const y = cy + ry * Math.sin(angle)
        const depth = 0.5 + 0.5 * Math.sin(angle + Math.PI / 2)
        const scale = 0.72 + 0.28 * depth
        const opacity = 0.35 + 0.65 * depth
        return (
          <motion.div
            key={chip.label}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity, scale }}
            transition={{ duration: 1 }}
            style={{
              position: "absolute",
              left: `${x}%`, top: `${y}%`,
              transform: `translate(-50%, -50%) scale(${scale})`,
              zIndex: Math.round(depth * 10),
              opacity,
            }}
          >
            <div style={{
              background: "rgba(8,15,35,0.80)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(147,197,253,0.30)",
              borderRadius: 999,
              padding: "4px 12px",
              fontSize: 11,
              fontWeight: 700,
              color: "#e2e8f0",
              whiteSpace: "nowrap",
              boxShadow: "0 2px 16px rgba(59,130,246,0.18)",
              letterSpacing: "0.01em",
            }}>
              {chip.label}
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

// ── Technical UI overlays (matching the screenshot style) ─────────────────────
function GlobeOverlays({ tick }: { tick: number }) {
  const rot = ((tick * 0.3) % 360).toFixed(1)
  return (
    <>
      {/* Top-left: rotation readout */}
      <div className="absolute top-4 left-4 font-mono text-[10px] text-cyan-400/60 leading-snug">
        <div className="border border-cyan-400/20 px-2 py-1 rounded">
          <div>ROT:{rot}°</div>
          <div>LAT:0.00</div>
        </div>
      </div>
      {/* Top-center */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 font-mono text-[10px] text-cyan-400/50 flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
        REAL-TIME
      </div>
      {/* Top-right */}
      <div className="absolute top-4 right-4 font-mono text-[10px] text-cyan-400/60 leading-snug text-right">
        <div className="border border-cyan-400/20 px-2 py-1 rounded">
          <div>• AUTO</div>
          <div>TX:{String(Math.floor(tick * 0.5) % 9999).padStart(4, "0")}</div>
        </div>
      </div>
      {/* Bottom-left */}
      <div className="absolute bottom-6 left-4 font-mono text-[9px] text-cyan-400/40 flex items-center gap-1">
        <span className="h-px w-3 bg-cyan-400/40" />NET.GLOBAL
      </div>
      {/* Bottom-center */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 font-mono text-[9px] text-white/25 flex items-center gap-3">
        <span className="flex items-center gap-1"><span className="h-px w-3 bg-brand-gold/60" />OUTBOUND</span>
        <span className="flex items-center gap-1"><span className="h-px w-3 bg-cyan-400/60" />INBOUND</span>
      </div>
      {/* Bottom-right */}
      <div className="absolute bottom-6 right-4 font-mono text-[9px] text-cyan-400/40 flex items-center gap-1">
        R:216px <span className="border border-cyan-400/20 px-1">•</span>
      </div>
      {/* Drag hint */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 font-mono text-[9px] text-white/20 flex items-center gap-1.5">
        ◄ DRAG TO ROTATE ►
      </div>
    </>
  )
}

// ── Globe size hook ───────────────────────────────────────────────────────────
function useGlobeSize() {
  const [size, setSize] = useState(520)
  useEffect(() => {
    function update() {
      const w = window.innerWidth
      if (w < 480) setSize(320)
      else if (w < 768) setSize(400)
      else if (w < 1024) setSize(460)
      else setSize(540)
    }
    update()
    window.addEventListener("resize", update)
    return () => window.removeEventListener("resize", update)
  }, [])
  return size
}

// ── Main export ───────────────────────────────────────────────────────────────
export function GlobeHero() {
  const [loaded, setLoaded] = useState(false)
  const [tick, setTick] = useState(0)
  const globeSize = useGlobeSize()

  useEffect(() => {
    setLoaded(true)
    const id = setInterval(() => setTick(t => t + 1), 50)
    return () => clearInterval(id)
  }, [])

  return (
    <section className="relative overflow-hidden bg-[#05091a] min-h-[92vh] flex items-center">

      {/* ── Layer 0: Cinematic multi-layer background canvas ── */}
      <HeroBackground />

      {/* Grid overlay on top of background */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: `
          linear-gradient(rgba(96,165,250,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(96,165,250,0.03) 1px, transparent 1px)
        `,
        backgroundSize: "48px 48px",
      }} />

      {/* Radial vignette — keeps center readable */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_70%_70%_at_50%_50%,transparent_30%,rgba(5,9,26,0.65)_100%)]" />

      {/* Accent glows */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_65%_50%,rgba(30,58,138,0.25),transparent)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_30%_30%_at_65%_50%,rgba(212,175,55,0.05),transparent)]" />

      {/* Globe area — right side */}
      <div className="absolute inset-0 flex items-center justify-end pr-4 lg:pr-12">
        <div className="relative" style={{ width: globeSize, height: globeSize }}>
          {/* Overlays behind chips */}
          <GlobeOverlays tick={tick} />

          {/* Canvas globe */}
          <div className="absolute inset-0 flex items-center justify-center">
            <GlobeCanvas size={globeSize} />
          </div>

          {/* Orbit chips */}
          <FloatingChips tick={tick} />
        </div>
      </div>

      {/* Hero text — left side */}
      <div className="relative z-10 mx-auto w-full max-w-7xl px-6 py-24">
        <div className="max-w-lg">

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: loaded ? 1 : 0, y: loaded ? 0 : 20 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/6 px-4 py-1.5 text-xs font-semibold text-white/70 backdrop-blur mb-6 font-mono tracking-wide">
              <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
              Tanzania's #1 China Opportunity Gateway
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: loaded ? 1 : 0, y: loaded ? 0 : 24 }}
            transition={{ duration: 0.7, delay: 0.35 }}
            className="space-y-3 mb-8"
          >
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-white leading-[1.1]">
              EA Trade Link
            </h1>
            <p className="text-base text-white/50 max-w-md leading-relaxed">
              Connecting Tanzania and China through Education, Business, and Global Opportunities
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: loaded ? 1 : 0, y: loaded ? 0 : 16 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex items-center gap-2 text-white/35 text-xs mb-2 font-mono"
          >
            <span>EXPLORE</span>
            <span className="h-px flex-1 max-w-[40px] bg-white/15" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: loaded ? 1 : 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <RotatingKeyword />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: loaded ? 1 : 0, y: loaded ? 0 : 16 }}
            transition={{ duration: 0.6, delay: 0.75 }}
            className="flex flex-wrap gap-3 mt-10"
          >
            <a
              href="#opportunities"
              className="inline-flex items-center gap-2 rounded-full bg-brand-gold px-6 py-3 text-sm font-bold text-white shadow-[0_0_24px_rgba(212,175,55,0.35)] hover:shadow-[0_0_36px_rgba(212,175,55,0.55)] transition-all hover:-translate-y-0.5 active:translate-y-0"
            >
              Browse Opportunities →
            </a>
            <a
              href="/register"
              className="inline-flex items-center gap-2 rounded-full border border-white/18 bg-white/6 px-6 py-3 text-sm font-semibold text-white backdrop-blur hover:bg-white/12 transition-all"
            >
              Create Free Account
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: loaded ? 1 : 0 }}
            transition={{ duration: 0.6, delay: 1 }}
            className="flex flex-wrap gap-5 mt-8 text-xs text-white/35 font-mono"
          >
            {["FREE TO BROWSE", "48H RESPONSE SLA", "NO UPFRONT FEES"].map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <span className="h-1 w-1 rounded-full bg-green-400/70" />
                {t}
              </span>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Bottom fade — matches dark page background */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#080f2a] to-transparent" />
    </section>
  )
}
