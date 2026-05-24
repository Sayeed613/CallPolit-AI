import React, { useRef, useEffect } from 'react'

export function WaveBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number
    let time = 0

    const handleResize = () => {
      canvas.width = window.innerWidth
      canvas.height = 300
    }

    handleResize()
    window.addEventListener('resize', handleResize)

    const render = () => {
      time += 0.008
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const waves = [
        { color: 'rgba(99, 102, 241, 0.08)', speed: 1, amplitude: 40, offset: 0 },
        { color: 'rgba(139, 92, 246, 0.06)', speed: 0.7, amplitude: 30, offset: 1.5 },
        { color: 'rgba(99, 102, 241, 0.04)', speed: 1.3, amplitude: 50, offset: 3 },
      ]

      waves.forEach((wave) => {
        ctx.beginPath()
        ctx.moveTo(0, canvas.height)

        for (let x = 0; x <= canvas.width; x += 2) {
          const y = canvas.height / 2
            + Math.sin(x * 0.005 * wave.speed + time + wave.offset) * wave.amplitude
            + Math.sin(x * 0.01 * wave.speed + time * 0.5 + wave.offset) * (wave.amplitude * 0.5)
          ctx.lineTo(x, y)
        }

        ctx.lineTo(canvas.width, canvas.height)
        ctx.closePath()
        ctx.fillStyle = wave.color
        ctx.fill()
      })

      animationFrameId = requestAnimationFrame(render)
    }

    render()

    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute bottom-0 left-0 w-full pointer-events-none"
      style={{ height: '300px' }}
    />
  )
}
