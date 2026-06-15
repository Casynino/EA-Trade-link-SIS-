"use client"

import { useRef, useEffect } from "react"

interface Star    { x: number; y: number; r: number; a: number; phase: number }
interface Particle { x: number; y: number; vx: number; vy: number; r: number; a: number }

export function StarfieldBg({ opacity = 1 }: { opacity?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D
    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    let W = 0, H = 0, raf = 0, frame = 0

    function resize() {
      W = canvas!.offsetWidth  || window.innerWidth
      H = canvas!.offsetHeight || window.innerHeight
      canvas!.width  = W * dpr
      canvas!.height = H * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener("resize", resize)

    // ── Stars ──────────────────────────────────────────────────────────────────
    const stars: Star[] = Array.from({ length: 180 }, () => ({
      x: Math.random(), y: Math.random(),
      r: 0.3 + Math.random() * 1.1,
      a: 0.05 + Math.random() * 0.25,
      phase: Math.random() * Math.PI * 2,
    }))

    // ── Floating particles with connection lines ────────────────────────────────
    const particles: Particle[] = Array.from({ length: 55 }, () => ({
      x: Math.random(), y: Math.random(),
      vx: (Math.random() - 0.5) * 0.00015,
      vy: (Math.random() - 0.5) * 0.00010,
      r: 0.8 + Math.random() * 1.4,
      a: 0.10 + Math.random() * 0.22,
    }))

    // ── Shooting stars ─────────────────────────────────────────────────────────
    interface Shoot { x: number; y: number; len: number; speed: number; a: number; active: boolean; timer: number }
    const shoots: Shoot[] = Array.from({ length: 3 }, () => ({
      x: 0, y: 0, len: 60 + Math.random() * 80, speed: 0.006 + Math.random() * 0.006,
      a: 0, active: false, timer: Math.floor(Math.random() * 300),
    }))

    function spawnShoot(s: Shoot) {
      s.x = Math.random() * 0.8
      s.y = Math.random() * 0.4
      s.len = 60 + Math.random() * 80
      s.speed = 0.005 + Math.random() * 0.005
      s.a = 0
      s.active = true
      s.timer = 200 + Math.floor(Math.random() * 400)
    }

    function render() {
      ctx.clearRect(0, 0, W, H)

      // ── Subtle blue grid ────────────────────────────────────────────────────
      ctx.save()
      ctx.globalAlpha = 0.028
      ctx.strokeStyle = "#3b82f6"
      ctx.lineWidth   = 0.5
      const cell = 52
      for (let x = 0; x < W; x += cell) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke() }
      for (let y = 0; y < H; y += cell) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke() }
      ctx.restore()

      // ── Twinkling stars ─────────────────────────────────────────────────────
      for (const s of stars) {
        const tw = 0.55 + 0.45 * Math.sin(s.phase + frame * 0.010)
        ctx.beginPath()
        ctx.arc(s.x * W, s.y * H, s.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(200,220,255,${s.a * tw})`
        ctx.fill()
      }

      // ── Shooting stars ──────────────────────────────────────────────────────
      for (const s of shoots) {
        if (!s.active) {
          s.timer--
          if (s.timer <= 0) spawnShoot(s)
          continue
        }
        s.x += s.speed
        s.y += s.speed * 0.45
        s.a = s.x < 0.3 ? s.x / 0.3 : s.x > 0.7 ? (1 - s.x) / 0.3 : 1

        const tail = s.len / W
        const grad = ctx.createLinearGradient((s.x - tail) * W, (s.y - tail * 0.45) * H, s.x * W, s.y * H)
        grad.addColorStop(0, "rgba(212,175,55,0)")
        grad.addColorStop(1, `rgba(212,175,55,${s.a * 0.7})`)

        ctx.save()
        ctx.globalAlpha = s.a
        ctx.beginPath()
        ctx.moveTo((s.x - tail) * W, (s.y - tail * 0.45) * H)
        ctx.lineTo(s.x * W, s.y * H)
        ctx.strokeStyle = grad
        ctx.lineWidth = 1.2
        ctx.stroke()
        ctx.restore()

        if (s.x > 1.05 || s.y > 1.05) { s.active = false; s.timer = 200 + Math.floor(Math.random() * 350) }
      }

      // ── Floating particle network ───────────────────────────────────────────
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]
        p.x += p.vx; p.y += p.vy
        if (p.x < 0) p.x = 1; if (p.x > 1) p.x = 0
        if (p.y < 0) p.y = 1; if (p.y > 1) p.y = 0

        ctx.beginPath()
        ctx.arc(p.x * W, p.y * H, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(147,197,253,${p.a})`
        ctx.fill()

        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j]
          const dx = (p.x - q.x) * W, dy = (p.y - q.y) * H
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 90) {
            ctx.beginPath()
            ctx.moveTo(p.x * W, p.y * H)
            ctx.lineTo(q.x * W, q.y * H)
            ctx.strokeStyle = `rgba(147,197,253,${(1 - dist / 90) * 0.045})`
            ctx.lineWidth   = 0.4
            ctx.stroke()
          }
        }
      }

      // ── Subtle radial glows (anchored) ──────────────────────────────────────
      const pulse = 0.7 + 0.3 * Math.sin(frame * 0.008)
      const glows = [
        { x: 0.15, y: 0.20, col: "200,16,46",   r: 0.22 },
        { x: 0.85, y: 0.75, col: "212,175,55",  r: 0.20 },
        { x: 0.50, y: 0.50, col: "96,165,250",  r: 0.18 },
      ]
      for (const g of glows) {
        const grd = ctx.createRadialGradient(g.x * W, g.y * H, 0, g.x * W, g.y * H, g.r * W)
        grd.addColorStop(0, `rgba(${g.col},${0.045 * pulse})`)
        grd.addColorStop(1, "transparent")
        ctx.save()
        ctx.fillStyle = grd
        ctx.fillRect(0, 0, W, H)
        ctx.restore()
      }

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
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0, opacity }}
    />
  )
}
