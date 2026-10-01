import { useRef, type PointerEvent } from 'react'
export function useCanvasPointer(width: number, height: number, paint: (x: number, y: number) => void,
  start: () => void, end: () => void, fill: boolean, enabled = true) {
  const active = useRef<number | null>(null)
  const last = useRef<{ x: number; y: number } | null>(null)
  const position = (event: PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const x = Math.floor((event.clientX - rect.left) / rect.width * width)
    const y = Math.floor((event.clientY - rect.top) / rect.height * height)
    return x >= 0 && y >= 0 && x < width && y < height ? { x, y } : null
  }
  const finish = (event: PointerEvent<HTMLCanvasElement>) => {
    if (active.current !== event.pointerId) return
    active.current = null; last.current = null; end()
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
  }
  return {
    onPointerDown(event: PointerEvent<HTMLCanvasElement>) {
      if (!enabled || active.current !== null || !event.isPrimary || event.button !== 0) return
      const pos = position(event); if (!pos) return
      event.preventDefault()
      if (fill) { paint(pos.x, pos.y); return }
      active.current = event.pointerId; last.current = pos
      event.currentTarget.setPointerCapture(event.pointerId)
      start(); paint(pos.x, pos.y)
    },
    onPointerMove(event: PointerEvent<HTMLCanvasElement>) {
      if (active.current !== event.pointerId) return
      const pos = position(event); if (!pos) { last.current = null; return }
      const previous = last.current
      if (previous) {
        const steps = Math.max(Math.abs(pos.x - previous.x), Math.abs(pos.y - previous.y))
        for (let step = 1; step <= steps; step++) paint(Math.round(previous.x + (pos.x - previous.x) * step / steps), Math.round(previous.y + (pos.y - previous.y) * step / steps))
      } else paint(pos.x, pos.y)
      last.current = pos
    },
    onPointerUp: finish, onPointerCancel: finish, onLostPointerCapture: finish,
  }
}
