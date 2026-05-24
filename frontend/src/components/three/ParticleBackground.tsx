import React, { useRef, useMemo, useEffect } from 'react'

export function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const particles = useMemo(() => {
    const count = 80
    return Array.from({ length: count }, () => ({
      x: Math.random() * 2 - 1,
      y: Math.random() * 2 - 1,
      z: Math.random() * 2 - 1,
      size: Math.random() * 0.003 + 0.001,
      speed: Math.random() * 0.2 + 0.05,
      opacity: Math.random() * 0.5 + 0.1,
    }))
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number
    let mouseX = 0
    let mouseY = 0
    let time = 0

    const handleResize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth) * 2 - 1
      mouseY = (e.clientY / window.innerHeight) * 2 - 1
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    window.addEventListener('mousemove', handleMouseMove)

    const render = () => {
      time += 0.005
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const projected = particles.map((p) => {
        const x = p.x + mouseX * 0.1 + Math.sin(time * p.speed + p.z) * 0.05
        const y = p.y + mouseY * 0.1 + Math.cos(time * p.speed + p.z) * 0.05
        const sx = (x / 2 + 0.5) * canvas.width
        const sy = (y / 2 + 0.5) * canvas.height
        const sz = p.size * canvas.width
        return { x: sx, y: sy, size: sz, opacity: p.opacity }
      })

      // Draw connections
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.06)'
      ctx.lineWidth = 0.5
      for (let i = 0; i < projected.length; i++) {
        for (let j = i + 1; j < projected.length; j++) {
          const dx = projected[i].x - projected[j].x
          const dy = projected[i].y - projected[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 200) {
            ctx.globalAlpha = (1 - dist / 200) * 0.3
            ctx.beginPath()
            ctx.moveTo(projected[i].x, projected[i].y)
            ctx.lineTo(projected[j].x, projected[j].y)
            ctx.stroke()
          }
        }
      }

      // Draw particles
      projected.forEach((p) => {
        ctx.globalAlpha = p.opacity
        ctx.fillStyle = '#818cf8'
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fill()
      })

      ctx.globalAlpha = 1
      animationFrameId = requestAnimationFrame(render)
    }

    render()

    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [particles])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  )
}
