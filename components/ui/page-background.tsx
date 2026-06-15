"use client"

import { useEffect, useRef } from "react"

interface Node {
  x: number; y: number
  vx: number; vy: number
  radius: number; alpha: number
  pulse: number; pulseSpeed: number
}

interface Particle {
  x: number; y: number
  vx: number; vy: number
  life: number; maxLife: number
  size: number
}

interface Ring {
  x: number; y: number
  r: number; maxR: number
  alpha: number; speed: number
}

export function PageBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext("2d")!
    let animId = 0
    let W = 0, H = 0

    const NODES: Node[] = []
    const PARTICLES: Particle[] = []
    const RINGS: Ring[] = []

    // Hex grid pattern data (precomputed centers)
    const HEX_GRID: { x: number; y: number }[] = []

    function resize() {
      W = canvas.offsetWidth
      H = canvas.offsetHeight
      canvas.width  = W * devicePixelRatio
      canvas.height = H * devicePixelRatio
      ctx.scale(devicePixelRatio, devicePixelRatio)
      buildHexGrid()
    }

    function buildHexGrid() {
      HEX_GRID.length = 0
      const size = 60
      const cols = Math.ceil(W / (size * 1.5)) + 2
      const rows = Math.ceil(H / (size * Math.sqrt(3))) + 2
      for (let c = -1; c < cols; c++) {
        for (let r = -1; r < rows; r++) {
          const x = c * size * 1.5
          const y = r * size * Math.sqrt(3) + (c % 2) * size * Math.sqrt(3) / 2
          HEX_GRID.push({ x, y })
        }
      }
    }

    function initNodes() {
      NODES.length = 0
      const count = Math.min(40, Math.floor(W * H / 30000))
      for (let i = 0; i < count; i++) {
        NODES.push({
          x: Math.random() * W,
          y: Math.random() * H,
          vx: (Math.random() - 0.5) * 0.18,
          vy: (Math.random() - 0.5) * 0.18,
          radius: Math.random() * 2 + 1,
          alpha: Math.random() * 0.5 + 0.2,
          pulse: Math.random() * Math.PI * 2,
          pulseSpeed: Math.random() * 0.015 + 0.005,
        })
      }
    }

    function spawnParticle() {
      if (PARTICLES.length > 80) return
      const edge = Math.random() * 4 | 0
      let x = 0, y = 0
      if (edge === 0) { x = Math.random() * W; y = 0 }
      else if (edge === 1) { x = W; y = Math.random() * H }
      else if (edge === 2) { x = Math.random() * W; y = H }
      else { x = 0; y = Math.random() * H }
      const angle = Math.atan2(H / 2 - y, W / 2 - x) + (Math.random() - 0.5) * 1.5
      const speed = Math.random() * 0.4 + 0.1
      const life = Math.random() * 400 + 200
      PARTICLES.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life, maxLife: life, size: Math.random() * 1.5 + 0.5 })
    }

    function spawnRing() {
      if (RINGS.length > 6) return
      const node = NODES[Math.floor(Math.random() * NODES.length)]
      if (!node) return
      RINGS.push({ x: node.x, y: node.y, r: 0, maxR: Math.random() * 80 + 40, alpha: 0.5, speed: Math.random() * 0.4 + 0.2 })
    }

    function draw(tick: number) {
      ctx.clearRect(0, 0, W, H)

      // ── 1. Hex grid ──────────────────────────────────────────────────────
      const hexAlpha = 0.028
      ctx.strokeStyle = `rgba(100,160,255,${hexAlpha})`
      ctx.lineWidth = 0.5
      const hexSize = 60
      for (const { x, y } of HEX_GRID) {
        ctx.beginPath()
        for (let i = 0; i < 6; i++) {
          const a = (Math.PI / 3) * i - Math.PI / 6
          const px = x + hexSize * Math.cos(a)
          const py = y + hexSize * Math.sin(a)
          i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)
        }
        ctx.closePath()
        ctx.stroke()
      }

      // ── 2. Slow diagonal scan lines ───────────────────────────────────────
      const scanOffset = (tick * 0.12) % 120
      ctx.strokeStyle = "rgba(100,160,255,0.012)"
      ctx.lineWidth = 1
      for (let i = -H; i < W + H; i += 120) {
        ctx.beginPath()
        ctx.moveTo(i + scanOffset, 0)
        ctx.lineTo(i + scanOffset - H * 0.5, H)
        ctx.stroke()
      }

      // ── 3. Particle trails ────────────────────────────────────────────────
      for (let i = PARTICLES.length - 1; i >= 0; i--) {
        const p = PARTICLES[i]
        p.x += p.vx; p.y += p.vy; p.life--
        if (p.life <= 0) { PARTICLES.splice(i, 1); continue }
        const a = (p.life / p.maxLife) * 0.5
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(180,210,255,${a})`
        ctx.fill()
      }

      // ── 4. Node connections ───────────────────────────────────────────────
      const CONNECT_DIST = 160
      for (let i = 0; i < NODES.length; i++) {
        const a = NODES[i]
        for (let j = i + 1; j < NODES.length; j++) {
          const b = NODES[j]
          const dx = a.x - b.x, dy = a.y - b.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < CONNECT_DIST) {
            const lineA = (1 - dist / CONNECT_DIST) * 0.12
            const grad = ctx.createLinearGradient(a.x, a.y, b.x, b.y)
            grad.addColorStop(0, `rgba(120,180,255,${lineA})`)
            grad.addColorStop(0.5, `rgba(212,175,55,${lineA * 0.6})`)
            grad.addColorStop(1, `rgba(120,180,255,${lineA})`)
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            ctx.strokeStyle = grad
            ctx.lineWidth = 0.7
            ctx.stroke()
          }
        }
      }

      // ── 5. Nodes ──────────────────────────────────────────────────────────
      for (const n of NODES) {
        n.x += n.vx; n.y += n.vy
        n.pulse += n.pulseSpeed
        if (n.x < 0 || n.x > W) n.vx *= -1
        if (n.y < 0 || n.y > H) n.vy *= -1

        const pulseScale = 1 + Math.sin(n.pulse) * 0.4
        const r = n.radius * pulseScale
        const a = n.alpha * (0.7 + Math.sin(n.pulse) * 0.3)

        // Outer glow
        const grd = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, r * 5)
        grd.addColorStop(0, `rgba(140,190,255,${a * 0.3})`)
        grd.addColorStop(1, "rgba(0,0,0,0)")
        ctx.beginPath()
        ctx.arc(n.x, n.y, r * 5, 0, Math.PI * 2)
        ctx.fillStyle = grd
        ctx.fill()

        // Core dot
        ctx.beginPath()
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(160,210,255,${a})`
        ctx.fill()
      }

      // ── 6. Pulse rings ────────────────────────────────────────────────────
      for (let i = RINGS.length - 1; i >= 0; i--) {
        const ring = RINGS[i]
        ring.r += ring.speed
        ring.alpha = (1 - ring.r / ring.maxR) * 0.35
        if (ring.r >= ring.maxR) { RINGS.splice(i, 1); continue }
        ctx.beginPath()
        ctx.arc(ring.x, ring.y, ring.r, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(212,175,55,${ring.alpha})`
        ctx.lineWidth = 1
        ctx.stroke()
      }

      // ── 7. Floating trade-route dashes ────────────────────────────────────
      // Two slow-moving dashed arcs representing China <-> Tanzania connection
      const arcProgress = (tick * 0.002) % 1
      const arcCX = W * 0.5, arcCY = H * 0.5
      const arcRX = W * 0.38, arcRY = H * 0.22
      for (let trail = 0; trail < 3; trail++) {
        const t = (arcProgress + trail * 0.07) % 1
        const angle = t * Math.PI * 2
        const px = arcCX + arcRX * Math.cos(angle)
        const py = arcCY + arcRY * Math.sin(angle)
        const ta = 1 - Math.abs(trail - 1) * 0.4
        ctx.beginPath()
        ctx.arc(px, py, 1.8 - trail * 0.4, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(212,175,55,${ta * 0.5})`
        ctx.fill()
      }

      // Second arc — mirrored
      const arcProgress2 = (tick * 0.0015 + 0.5) % 1
      for (let trail = 0; trail < 3; trail++) {
        const t = (arcProgress2 + trail * 0.07) % 1
        const angle = t * Math.PI * 2
        const px = arcCX + arcRX * 0.7 * Math.cos(angle + Math.PI * 0.3)
        const py = arcCY + arcRY * 1.4 * Math.sin(angle + Math.PI * 0.3)
        const ta = 1 - Math.abs(trail - 1) * 0.4
        ctx.beginPath()
        ctx.arc(px, py, 1.5 - trail * 0.3, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(100,200,255,${ta * 0.4})`
        ctx.fill()
      }
    }

    let tick = 0
    let lastSpawn = 0, lastRing = 0

    function loop() {
      tick++
      if (tick - lastSpawn > 8) { spawnParticle(); lastSpawn = tick }
      if (tick - lastRing > 120) { spawnRing(); lastRing = tick }
      draw(tick)
      animId = requestAnimationFrame(loop)
    }

    resize()
    initNodes()
    spawnParticle()
    window.addEventListener("resize", () => { resize(); initNodes() })
    loop()

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener("resize", () => { resize(); initNodes() })
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0 }}
    />
  )
}
