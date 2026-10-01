import type { PatternResult, BeadColor } from '../types'
export function paintCell(pattern: PatternResult, x: number, y: number, color: BeadColor | null): PatternResult {
  const cell = pattern.cells[y]?.[x]
  if (!cell || cell.color?.id === color?.id) return pattern
  const cells = pattern.cells.slice(); cells[y] = cells[y].slice(); cells[y][x] = { ...cell, color }
  const counts = new Map([...pattern.colorCounts].map(([id, item]) => [id, { ...item }]))
  if (cell.color) { const old = counts.get(cell.color.id); if (old) { old.count--; if (!old.count) counts.delete(cell.color.id) } }
  if (color) { const next = counts.get(color.id); if (next) next.count++; else counts.set(color.id, { color, count: 1 }) }
  return { ...pattern, cells, colorCounts: counts, totalBeads: pattern.totalBeads + Number(!!color) - Number(!!cell.color) }
}
