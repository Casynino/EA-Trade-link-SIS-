"use client"

import { useRef, useEffect } from "react"

// ── Bezier helpers ────────────────────────────────────────────────────────────
function bezierPoint(t: number, p0: number[], p1: number[], p2: number[], p3: number[]): [number, number] {
  const u = 1 - t
  return [
    u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
    u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1],
  ]
}

function precomputeBezier(p0: number[], p1: number[], p2: number[], p3: number[], steps = 100): [number, number][] {
  return Array.from({ length: steps + 1 }, (_, i) => bezierPoint(i / steps, p0, p1, p2, p3))
}

// ── Type definitions ──────────────────────────────────────────────────────────
interface FloatParticle { x: number; y: number; vx: number; vy: number; r: number; a: number }
interface TradeParticle { t: number; speed: number; r: number; a: number; route: number }
interface Star { x: number; y: number; r: number; a: number; phase: number }

// ── Africa simplified outline (normalized 0-1 in bounding box) ───────────────
const AFRICA_PTS = [
  [0.42, 0.00], [0.58, 0.00], [0.70, 0.04], [0.78, 0.10],
  [0.80, 0.20], [0.85, 0.30], [0.82, 0.44], [0.75, 0.58],
  [0.70, 0.72], [0.60, 0.85], [0.52, 0.95], [0.44, 0.85],
  [0.32, 0.72], [0.20, 0.60], [0.12, 0.48], [0.06, 0.34],
  [0.08, 0.22], [0.18, 0.12], [0.28, 0.04], [0.42, 0.00],
]

// ── China simplified outline (normalized 0-1) ────────────────────────────────
const CHINA_PTS = [
  [0.22, 0.00], [0.48, 0.00], [0.72, 0.05], [0.90, 0.16],
  [0.98, 0.30], [0.95, 0.48], [0.88, 0.62], [0.80, 0.75],
  [0.70, 0.85], [0.55, 0.90], [0.42, 0.82], [0.32, 0.68],
  [0.18, 0.58], [0.06, 0.44], [0.04, 0.30], [0.10, 0.18],
  [0.22, 0.00],
]

// ── Trade route bezier control points (normalized 0-1) ───────────────────────
const ROUTES = [
  { p0: [0.80, 0.28], p1: [0.60, 0.10], p2: [0.36, 0.16], p3: [0.16, 0.42], color: "212,175,55"  },
  { p0: [0.82, 0.44], p1: [0.62, 0.26], p2: [0.40, 0.36], p3: [0.18, 0.54], color: "212,175,55"  },
  { p0: [0.84, 0.58], p1: [0.66, 0.40], p2: [0.42, 0.50], p3: [0.14, 0.64], color: "200,100,50"  },
  { p0: [0.76, 0.36], p1: [0.56, 0.18], p2: [0.34, 0.26], p3: [0.20, 0.50], color: "200,16,46"   },
]

// ── Main background component ─────────────────────────────────────────────────
export function HeroBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d", { willReadFrequently: false }) as CanvasRenderingContext2D

    let W = 0, H = 0
    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    // Pre-computed route points
    let routePts: [number, number][][] = []

    function resize() {
      W = canvas!.offsetWidth || window.innerWidth
      H = canvas!.offsetHeight || 700
      canvas!.width  = W * dpr
      canvas!.height = H * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      routePts = ROUTES.map(r => precomputeBezier(r.p0, r.p1, r.p2, r.p3))
    }
    resize()
    window.addEventListener("resize", resize)

    // ── Particles ──
    const FP_COUNT = 65
    const floatParticles: FloatParticle[] = Array.from({ length: FP_COUNT }, () => ({
      x: Math.random(), y: Math.random(),
      vx: (Math.random() - 0.5) * 0.00018,
      vy: (Math.random() - 0.5) * 0.00012,
      r: 0.7 + Math.random() * 1.4,
      a: 0.12 + Math.random() * 0.28,
    }))

    const TP_COUNT = 20
    const tradeParticles: TradeParticle[] = Array.from({ length: TP_COUNT }, (_, i) => ({
      t: i / TP_COUNT,
      speed: 0.0007 + Math.random() * 0.0006,
      r: 1.8 + Math.random() * 2.2,
      a: 0.55 + Math.random() * 0.45,
      route: i % ROUTES.length,
    }))

    const STAR_COUNT = 140
    const stars: Star[] = Array.from({ length: STAR_COUNT }, () => ({
      x: Math.random(), y: Math.random(),
      r: 0.3 + Math.random() * 0.9,
      a: 0.06 + Math.random() * 0.22,
      phase: Math.random() * Math.PI * 2,
    }))

    let frame = 0
    let raf: number

    // ──────────────────────────────────────────────────────────────────────────
    // DRAW FUNCTIONS
    // ──────────────────────────────────────────────────────────────────────────

    function drawBaseGradients() {
      // Africa glow — left side (warm orange/earth)
      const gA = ctx.createRadialGradient(W * 0.16, H * 0.52, 0, W * 0.16, H * 0.52, W * 0.50)
      gA.addColorStop(0,   "rgba(255,110,0,0.13)")
      gA.addColorStop(0.45,"rgba(160,70,10,0.07)")
      gA.addColorStop(1,   "transparent")
      ctx.fillStyle = gA
      ctx.fillRect(0, 0, W, H)

      // China glow — right side (red/gold)
      const gC = ctx.createRadialGradient(W * 0.82, H * 0.42, 0, W * 0.82, H * 0.42, W * 0.50)
      gC.addColorStop(0,   "rgba(200,16,46,0.13)")
      gC.addColorStop(0.35,"rgba(212,175,55,0.08)")
      gC.addColorStop(1,   "transparent")
      ctx.fillStyle = gC
      ctx.fillRect(0, 0, W, H)

      // Deep center void
      const gMid = ctx.createRadialGradient(W * 0.5, H * 0.5, 0, W * 0.5, H * 0.5, W * 0.28)
      gMid.addColorStop(0,   "rgba(5,9,26,0.55)")
      gMid.addColorStop(1,   "transparent")
      ctx.fillStyle = gMid
      ctx.fillRect(0, 0, W, H)

      // Bottom darkness for globe area to pop
      const gBot = ctx.createLinearGradient(0, H * 0.6, 0, H)
      gBot.addColorStop(0, "transparent")
      gBot.addColorStop(1, "rgba(5,9,26,0.45)")
      ctx.fillStyle = gBot
      ctx.fillRect(0, 0, W, H)
    }

    function drawStars() {
      for (const s of stars) {
        const tw = 0.65 + 0.35 * Math.sin(s.phase + frame * 0.012)
        ctx.beginPath()
        ctx.arc(s.x * W, s.y * H, s.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(200,220,255,${s.a * tw})`
        ctx.fill()
      }
    }

    // ── Chinese lattice window pattern ────────────────────────────────────────
    function drawChineseLattice() {
      const startX = W * 0.56
      const startY = H * 0.04
      const cell   = Math.min(W, H) * 0.055
      const cols   = Math.ceil((W * 0.44) / cell)
      const rows   = Math.ceil(H / cell)

      ctx.save()
      ctx.globalAlpha = 0.065
      ctx.strokeStyle = "#D4AF37"
      ctx.lineWidth   = 0.6

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x  = startX + c * cell
          const y  = startY + r * cell
          const hs = cell * 0.5
          const qs = cell * 0.25

          // Outer square
          ctx.strokeRect(x, y, cell, cell)

          // Inner rotated diamond
          ctx.beginPath()
          ctx.moveTo(x + hs,       y + qs)
          ctx.lineTo(x + cell - qs, y + hs)
          ctx.lineTo(x + hs,       y + cell - qs)
          ctx.lineTo(x + qs,       y + hs)
          ctx.closePath()
          ctx.stroke()

          // Center cross
          ctx.beginPath()
          ctx.moveTo(x + qs, y + qs)
          ctx.lineTo(x + cell - qs, y + cell - qs)
          ctx.moveTo(x + cell - qs, y + qs)
          ctx.lineTo(x + qs, y + cell - qs)
          ctx.stroke()
        }
      }

      // Red accent overlay on lattice
      ctx.globalAlpha = 0.025
      ctx.fillStyle = "#C8102E"
      ctx.fillRect(startX, 0, W - startX, H)

      ctx.restore()

      // Circular medallions
      drawMedallion(W * 0.76, H * 0.14, Math.min(W, H) * 0.06, "#C8102E", 0.07)
      drawMedallion(W * 0.90, H * 0.72, Math.min(W, H) * 0.07, "#D4AF37", 0.06)
    }

    function drawMedallion(cx: number, cy: number, r: number, col: string, a: number) {
      ctx.save()
      ctx.globalAlpha = a
      ctx.strokeStyle = col
      ctx.lineWidth   = 0.8

      // Rings
      for (const fr of [1, 0.72, 0.48, 0.28]) {
        ctx.beginPath()
        ctx.arc(cx, cy, r * fr, 0, Math.PI * 2)
        ctx.stroke()
      }
      // Spokes
      for (let i = 0; i < 12; i++) {
        const ang = (i / 12) * Math.PI * 2
        ctx.beginPath()
        ctx.moveTo(cx + r * 0.28 * Math.cos(ang), cy + r * 0.28 * Math.sin(ang))
        ctx.lineTo(cx + r * Math.cos(ang),        cy + r * Math.sin(ang))
        ctx.stroke()
      }
      // Inner petals
      for (let i = 0; i < 6; i++) {
        const ang = (i / 6) * Math.PI * 2
        ctx.beginPath()
        ctx.arc(cx + r * 0.6 * Math.cos(ang), cy + r * 0.6 * Math.sin(ang), r * 0.14, 0, Math.PI * 2)
        ctx.stroke()
      }
      ctx.restore()
    }

    // ── African kitenge chevron pattern ───────────────────────────────────────
    function drawAfricanPattern() {
      const triW = Math.min(W, H) * 0.042
      const triH = triW * 0.866
      const maxX = W * 0.44
      const cols = Math.ceil(maxX / triW) + 2
      const rows = Math.ceil(H / triH) + 2

      ctx.save()
      ctx.globalAlpha = 0.06

      const palette = ["#FF8C00", "#D4AF37", "#8B4513", "#FF6B35", "#A0522D"]

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          ctx.fillStyle = palette[(r * 3 + c) % palette.length]
          const x  = c * triW + (r % 2 === 0 ? 0 : triW * 0.5)
          const y  = r * triH * 0.6
          const up = (r + c) % 2 === 0

          ctx.beginPath()
          if (up) {
            ctx.moveTo(x,          y + triH)
            ctx.lineTo(x + triW / 2, y)
            ctx.lineTo(x + triW,   y + triH)
          } else {
            ctx.moveTo(x,          y)
            ctx.lineTo(x + triW,   y)
            ctx.lineTo(x + triW / 2, y + triH)
          }
          ctx.closePath()
          ctx.fill()
        }
      }

      // Warm overlay left side
      ctx.globalAlpha = 0.03
      ctx.fillStyle = "#FF8C00"
      ctx.fillRect(0, 0, W * 0.44, H)

      ctx.restore()

      // Circular African decorative rings
      drawAfricanRing(W * 0.08, H * 0.22, Math.min(W, H) * 0.065)
      drawAfricanRing(W * 0.26, H * 0.80, Math.min(W, H) * 0.055)
    }

    function drawAfricanRing(cx: number, cy: number, r: number) {
      ctx.save()
      ctx.globalAlpha = 0.07
      ctx.strokeStyle = "#FF8C00"
      ctx.lineWidth   = 0.8

      for (let i = 0; i < 8; i++) {
        const a0 = (i / 8) * Math.PI * 2
        const a1 = ((i + 0.6) / 8) * Math.PI * 2
        ctx.beginPath()
        ctx.arc(cx, cy, r, a0, a1)
        ctx.stroke()
        // Radial tick
        ctx.beginPath()
        ctx.moveTo(cx + r * 0.7 * Math.cos(a0), cy + r * 0.7 * Math.sin(a0))
        ctx.lineTo(cx + r * Math.cos(a0),        cy + r * Math.sin(a0))
        ctx.stroke()
      }
      // Inner pattern
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2
        ctx.beginPath()
        ctx.arc(cx + r * 0.45 * Math.cos(a), cy + r * 0.45 * Math.sin(a), r * 0.18, 0, Math.PI * 2)
        ctx.stroke()
      }
      ctx.restore()
    }

    // ── Continent outlines ────────────────────────────────────────────────────
    function drawAfricaContour() {
      const bx = W * 0.02, by = H * 0.08
      const bw = W * 0.28, bh = H * 0.82

      ctx.save()
      ctx.globalAlpha  = 0.10
      ctx.strokeStyle  = "#FF8C00"
      ctx.lineWidth    = 1.0
      ctx.setLineDash([4, 7])

      ctx.beginPath()
      AFRICA_PTS.forEach(([nx, ny], i) => {
        const px = bx + nx * bw, py = by + ny * bh
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)
      })
      ctx.closePath()
      ctx.stroke()
      ctx.setLineDash([])

      // Soft fill
      ctx.globalAlpha = 0.025
      ctx.fillStyle   = "#FF8C00"
      ctx.beginPath()
      AFRICA_PTS.forEach(([nx, ny], i) => {
        const px = bx + nx * bw, py = by + ny * bh
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)
      })
      ctx.closePath()
      ctx.fill()
      ctx.restore()

      // Tanzania dot
      const tz = { x: bx + 0.72 * bw, y: by + 0.52 * bh }
      ctx.save()
      ctx.globalAlpha = 0.35
      const g = ctx.createRadialGradient(tz.x, tz.y, 0, tz.x, tz.y, 16)
      g.addColorStop(0, "#4ade80")
      g.addColorStop(1, "transparent")
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.arc(tz.x, tz.y, 16, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalAlpha = 0.9
      ctx.beginPath()
      ctx.arc(tz.x, tz.y, 3, 0, Math.PI * 2)
      ctx.fillStyle = "#4ade80"
      ctx.shadowBlur = 10; ctx.shadowColor = "#4ade80"
      ctx.fill()
      ctx.shadowBlur = 0
      ctx.restore()
    }

    function drawChinaContour() {
      const bx = W * 0.50, by = H * 0.06
      const bw = W * 0.45, bh = H * 0.58

      ctx.save()
      ctx.globalAlpha  = 0.09
      ctx.strokeStyle  = "#C8102E"
      ctx.lineWidth    = 0.9
      ctx.setLineDash([4, 8])

      ctx.beginPath()
      CHINA_PTS.forEach(([nx, ny], i) => {
        const px = bx + nx * bw, py = by + ny * bh
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)
      })
      ctx.closePath()
      ctx.stroke()
      ctx.setLineDash([])

      // Soft fill
      ctx.globalAlpha = 0.022
      ctx.fillStyle   = "#C8102E"
      ctx.beginPath()
      CHINA_PTS.forEach(([nx, ny], i) => {
        const px = bx + nx * bw, py = by + ny * bh
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)
      })
      ctx.closePath()
      ctx.fill()
      ctx.restore()

      // Beijing dot
      const bj = { x: bx + 0.54 * bw, y: by + 0.22 * bh }
      ctx.save()
      ctx.globalAlpha = 0.35
      const g = ctx.createRadialGradient(bj.x, bj.y, 0, bj.x, bj.y, 16)
      g.addColorStop(0, "#f87171")
      g.addColorStop(1, "transparent")
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.arc(bj.x, bj.y, 16, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalAlpha = 0.9
      ctx.beginPath()
      ctx.arc(bj.x, bj.y, 3, 0, Math.PI * 2)
      ctx.fillStyle = "#f87171"
      ctx.shadowBlur = 10; ctx.shadowColor = "#f87171"
      ctx.fill()
      ctx.shadowBlur = 0
      ctx.restore()
    }

    // ── Ghost watermark text ──────────────────────────────────────────────────
    function drawWatermarkText() {
      const sz = Math.min(W * 0.10, 96)

      ctx.save()
      ctx.globalAlpha = 0.038
      ctx.fillStyle   = "#C8102E"
      ctx.font        = `bold ${sz}px serif`
      ctx.fillText("中", W * 0.86, H * 0.22)
      ctx.fillText("华", W * 0.90, H * 0.66)

      ctx.globalAlpha = 0.028
      ctx.fillStyle   = "#D4AF37"
      ctx.font        = `bold ${sz * 0.65}px serif`
      ctx.fillText("龙", W * 0.70, H * 0.84)

      ctx.globalAlpha = 0.040
      ctx.fillStyle   = "#FF8C00"
      ctx.font        = `700 ${sz * 0.45}px sans-serif`
      ctx.fillText("KARIBU", W * 0.015, H * 0.22)
      ctx.fillText("BIASHARA", W * 0.01, H * 0.70)
      ctx.restore()
    }

    // ── Silhouette shapes ─────────────────────────────────────────────────────
    function drawSilhouettes() {
      // Graduation cap — top-left area
      drawGradCap(W * 0.09, H * 0.14, Math.min(W, H) * 0.065)
      // Pagoda — top-right area
      drawPagoda(W * 0.92, H * 0.10, Math.min(W, H) * 0.07)
      // Container ship — bottom center
      drawShip(W * 0.48, H * 0.86, Math.min(W, H) * 0.06)
      // Handshake — left-center
      drawHandshake(W * 0.06, H * 0.56, Math.min(W, H) * 0.055)
    }

    function drawGradCap(cx: number, cy: number, sz: number) {
      ctx.save()
      ctx.globalAlpha = 0.055
      ctx.fillStyle   = "#FF8C00"
      ctx.translate(cx, cy)
      ctx.rotate(-0.2)
      // Board
      ctx.fillRect(-sz * 0.55, -sz * 0.08, sz * 1.1, sz * 0.14)
      // Head
      ctx.fillRect(-sz * 0.28, sz * 0.06, sz * 0.56, sz * 0.28)
      // Tassel
      ctx.beginPath()
      ctx.moveTo(sz * 0.55, -sz * 0.01)
      ctx.lineTo(sz * 0.55, sz * 0.22)
      ctx.strokeStyle = "#FF8C00"
      ctx.lineWidth   = sz * 0.04
      ctx.stroke()
      ctx.restore()
    }

    function drawPagoda(cx: number, cy: number, sz: number) {
      ctx.save()
      ctx.globalAlpha = 0.055
      ctx.fillStyle   = "#C8102E"
      for (let tier = 0; tier < 4; tier++) {
        const w  = sz * (0.85 - tier * 0.18)
        const h  = sz * 0.14
        const tx = cx - w / 2
        const ty = cy - tier * h * 1.05
        ctx.fillRect(tx, ty, w, h)
        // Curved roof
        ctx.beginPath()
        ctx.moveTo(tx - sz * 0.07, ty)
        ctx.lineTo(cx,              ty - h * 0.55)
        ctx.lineTo(tx + w + sz * 0.07, ty)
        ctx.closePath()
        ctx.fill()
      }
      // Spire
      ctx.fillRect(cx - sz * 0.03, cy - sz * 0.7, sz * 0.06, sz * 0.16)
      ctx.restore()
    }

    function drawShip(cx: number, cy: number, sz: number) {
      ctx.save()
      ctx.globalAlpha = 0.05
      ctx.fillStyle   = "#D4AF37"
      // Hull
      ctx.beginPath()
      ctx.moveTo(cx - sz,       cy)
      ctx.lineTo(cx - sz * 0.7, cy + sz * 0.32)
      ctx.lineTo(cx + sz * 0.7, cy + sz * 0.32)
      ctx.lineTo(cx + sz,       cy)
      ctx.closePath()
      ctx.fill()
      // Container stacks
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = i % 2 === 0 ? "#D4AF37" : "#FF8C00"
        ctx.fillRect(cx - sz * 0.55 + i * sz * 0.28, cy - sz * 0.25, sz * 0.24, sz * 0.25)
      }
      // Crane arm
      ctx.fillStyle = "#D4AF37"
      ctx.fillRect(cx + sz * 0.5, cy - sz * 0.65, sz * 0.06, sz * 0.65)
      ctx.beginPath()
      ctx.moveTo(cx + sz * 0.53, cy - sz * 0.65)
      ctx.lineTo(cx + sz * 0.1,  cy - sz * 0.4)
      ctx.strokeStyle = "#D4AF37"
      ctx.lineWidth   = sz * 0.025
      ctx.stroke()
      ctx.restore()
    }

    function drawHandshake(cx: number, cy: number, sz: number) {
      ctx.save()
      ctx.globalAlpha = 0.05
      ctx.fillStyle   = "#FF8C00"
      // Left hand going right
      ctx.beginPath()
      ctx.roundRect(cx - sz * 0.05, cy - sz * 0.15, sz * 0.7, sz * 0.30, sz * 0.08)
      ctx.fill()
      // Right hand going left
      ctx.beginPath()
      ctx.roundRect(cx + sz * 0.1, cy - sz * 0.14, sz * 0.62, sz * 0.28, sz * 0.07)
      ctx.fillStyle = "#D4AF37"
      ctx.fill()
      ctx.restore()
    }

    // ── Trade routes (static faint lines) ────────────────────────────────────
    function drawTradeRouteLines() {
      for (let ri = 0; ri < ROUTES.length; ri++) {
        const r = ROUTES[ri]
        ctx.save()
        ctx.globalAlpha = 0.055 + ri * 0.008
        ctx.strokeStyle = `rgb(${r.color})`
        ctx.lineWidth   = 0.7
        ctx.setLineDash([5, 10])
        ctx.beginPath()
        ctx.moveTo(r.p0[0] * W, r.p0[1] * H)
        ctx.bezierCurveTo(
          r.p1[0] * W, r.p1[1] * H,
          r.p2[0] * W, r.p2[1] * H,
          r.p3[0] * W, r.p3[1] * H,
        )
        ctx.stroke()
        ctx.setLineDash([])
        ctx.restore()
      }
    }

    // ── Animated trade particles ──────────────────────────────────────────────
    function drawTradeParticles() {
      for (const tp of tradeParticles) {
        const pts = routePts[tp.route]
        if (!pts?.length) continue
        const [x, y] = pts[Math.min(Math.floor(tp.t * pts.length), pts.length - 1)]
        const px = x * W, py = y * H
        const col = ROUTES[tp.route].color

        // Outer glow
        ctx.save()
        ctx.globalAlpha = tp.a * 0.35
        const g = ctx.createRadialGradient(px, py, 0, px, py, tp.r * 5)
        g.addColorStop(0, `rgba(${col},0.8)`)
        g.addColorStop(1, "transparent")
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(px, py, tp.r * 5, 0, Math.PI * 2)
        ctx.fill()

        // Core dot
        ctx.globalAlpha = tp.a
        ctx.beginPath()
        ctx.arc(px, py, tp.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgb(${col})`
        ctx.shadowBlur = 10
        ctx.shadowColor = `rgb(${col})`
        ctx.fill()
        ctx.shadowBlur = 0
        ctx.restore()

        tp.t = (tp.t + tp.speed) % 1
      }
    }

    // ── Floating particle network ─────────────────────────────────────────────
    function drawFloatingNetwork() {
      for (let i = 0; i < floatParticles.length; i++) {
        const p = floatParticles[i]
        p.x += p.vx; p.y += p.vy
        if (p.x < 0) p.x = 1; if (p.x > 1) p.x = 0
        if (p.y < 0) p.y = 1; if (p.y > 1) p.y = 0

        ctx.beginPath()
        ctx.arc(p.x * W, p.y * H, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(147,197,253,${p.a})`
        ctx.fill()

        for (let j = i + 1; j < floatParticles.length; j++) {
          const q = floatParticles[j]
          const dx = (p.x - q.x) * W, dy = (p.y - q.y) * H
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 80) {
            ctx.beginPath()
            ctx.moveTo(p.x * W, p.y * H)
            ctx.lineTo(q.x * W, q.y * H)
            ctx.strokeStyle = `rgba(147,197,253,${(1 - dist / 80) * 0.055})`
            ctx.lineWidth   = 0.4
            ctx.stroke()
          }
        }
      }
    }

    // ── Regional pulse rings ──────────────────────────────────────────────────
    function drawPulses() {
      const PULSES = [
        { x: 0.20, y: 0.50, col: "74,222,128",   period: 100 },  // Tanzania
        { x: 0.80, y: 0.40, col: "248,113,113",   period: 100 },  // China
        { x: 0.50, y: 0.50, col: "212,175,55",    period: 140 },  // Ocean midpoint
      ]
      for (const p of PULSES) {
        const progress = (frame % p.period) / p.period
        const r = progress * Math.min(W, H) * 0.12
        const a = (1 - progress) * 0.14
        ctx.save()
        ctx.globalAlpha = a
        ctx.beginPath()
        ctx.arc(p.x * W, p.y * H, r, 0, Math.PI * 2)
        ctx.strokeStyle = `rgb(${p.col})`
        ctx.lineWidth   = 1.2
        ctx.stroke()
        ctx.restore()
      }
    }

    // ── World grid lines (horizontal bands) ──────────────────────────────────
    function drawWorldGrid() {
      ctx.save()
      ctx.globalAlpha = 0.04
      ctx.strokeStyle = "#3b82f6"
      ctx.lineWidth   = 0.5

      // Horizontal latitude bands
      for (let i = 0; i <= 6; i++) {
        const y = H * (i / 6)
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(W, y)
        ctx.stroke()
      }
      // Vertical meridians
      for (let i = 0; i <= 10; i++) {
        const x = W * (i / 10)
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, H)
        ctx.stroke()
      }
      ctx.restore()
    }

    // ── Main loop ─────────────────────────────────────────────────────────────
    function render() {
      ctx.clearRect(0, 0, W, H)

      drawBaseGradients()
      drawWorldGrid()
      drawStars()
      drawChineseLattice()
      drawAfricanPattern()
      drawAfricaContour()
      drawChinaContour()
      drawWatermarkText()
      drawSilhouettes()
      drawTradeRouteLines()
      drawTradeParticles()
      drawPulses()
      drawFloatingNetwork()

      frame++
      raf = requestAnimationFrame(render)
    }
    raf = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("resize", resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ display: "block" }}
    />
  )
}
