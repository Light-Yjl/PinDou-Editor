import type { PatternResult } from '../types'

export interface RenderOptions {
  cellSize: number
  showGridLines: boolean
  showColorCodes: boolean
  includeLegend?: boolean
  majorGridEvery?: number
}

const EXPORT_CELL_SIZE = 24

export function renderPatternToCanvas(
  pattern: PatternResult,
  options: RenderOptions,
): HTMLCanvasElement {
  const { cellSize, showGridLines, showColorCodes, majorGridEvery = 10 } = options
  const { width, height, cells } = pattern

  const canvas = document.createElement('canvas')
  canvas.width = width * cellSize
  canvas.height = height * cellSize
  const ctx = canvas.getContext('2d')!

  ctx.imageSmoothingEnabled = false
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const cell = cells[y][x]
      const px = x * cellSize
      const py = y * cellSize

      if (cell.color) {
        ctx.fillStyle = cell.color.hex
        ctx.fillRect(px, py, cellSize, cellSize)

        if (showColorCodes && cellSize >= 10) {
          const isLight = isLightColor(cell.color.hex)
          ctx.fillStyle = isLight ? '#111111' : '#FFFFFF'
          const fontSize = Math.max(7, Math.floor(cellSize * 0.42))
          ctx.font = `bold ${fontSize}px Arial, "Microsoft YaHei", sans-serif`
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(formatCode(cell.color.code), px + cellSize / 2, py + cellSize / 2 + 0.5)
        }
      } else {
        ctx.fillStyle = '#F5F5F5'
        ctx.fillRect(px, py, cellSize, cellSize)
      }

      if (showGridLines) {
        ctx.strokeStyle = '#D1D5DB'
        ctx.lineWidth = 1
        ctx.strokeRect(px + 0.5, py + 0.5, cellSize - 1, cellSize - 1)
      }
    }
  }

  if (showGridLines && majorGridEvery > 0) {
    ctx.strokeStyle = '#F97316'
    ctx.lineWidth = 2

    for (let x = 0; x <= width; x += majorGridEvery) {
      ctx.beginPath()
      ctx.moveTo(x * cellSize + 0.5, 0)
      ctx.lineTo(x * cellSize + 0.5, height * cellSize)
      ctx.stroke()
    }
    for (let y = 0; y <= height; y += majorGridEvery) {
      ctx.beginPath()
      ctx.moveTo(0, y * cellSize + 0.5)
      ctx.lineTo(width * cellSize, y * cellSize + 0.5)
      ctx.stroke()
    }
  }

  return canvas
}

function formatCode(code: string): string {
  return code.replace(/^([A-Z])0+(\d+)$/, '$1$2')
}

function isLightColor(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return (r * 299 + g * 587 + b * 114) / 1000 > 140
}

export function renderLegendGrid(
  ctx: CanvasRenderingContext2D,
  pattern: PatternResult,
  x: number,
  y: number,
  maxWidth: number,
) {
  const sorted = [...pattern.colorCounts.values()].sort((a, b) => b.count - a.count)
  const cols = Math.min(12, Math.max(6, Math.floor(maxWidth / 100)))
  const cellW = Math.floor(maxWidth / cols)
  const cellH = 36
  const rows = Math.ceil(sorted.length / cols)

  sorted.forEach(({ color, count }, index) => {
    const col = index % cols
    const row = Math.floor(index / cols)
    const cx = x + col * cellW
    const cy = y + row * cellH

    ctx.fillStyle = color.hex
    ctx.fillRect(cx, cy, cellW - 2, cellH - 2)
    ctx.strokeStyle = 'rgba(0,0,0,0.15)'
    ctx.lineWidth = 1
    ctx.strokeRect(cx + 0.5, cy + 0.5, cellW - 3, cellH - 3)

    const label = `${formatCode(color.code)} (${count})`
    const light = isLightColor(color.hex)
    ctx.fillStyle = light ? '#111111' : '#FFFFFF'
    ctx.font = 'bold 13px Arial, "Microsoft YaHei", sans-serif'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    ctx.fillText(label, cx + 4, cy + 4, cellW - 8)
  })

  return rows * cellH + 8
}

export function renderPatternWithLegend(
  pattern: PatternResult,
  options: RenderOptions,
): HTMLCanvasElement {
  const patternCanvas = renderPatternToCanvas(pattern, options)
  if (!options.includeLegend) return patternCanvas

  const legendPadding = 24
  const legendGap = 48
  const headerHeight = 36
  const contentWidth = Math.max(patternCanvas.width, 720)

  const measureCanvas = document.createElement('canvas')
  const measureCtx = measureCanvas.getContext('2d')!
  const legendGridHeight = renderLegendGrid(
    measureCtx,
    pattern,
    0,
    0,
    contentWidth - legendPadding * 2,
  )

  const legendStartY = legendPadding + patternCanvas.height + legendGap
  const canvas = document.createElement('canvas')
  canvas.width = contentWidth
  canvas.height = legendStartY + headerHeight + legendGridHeight + legendPadding
  const ctx = canvas.getContext('2d')!

  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  const patternX = (canvas.width - patternCanvas.width) / 2
  ctx.drawImage(patternCanvas, patternX, legendPadding)

  ctx.fillStyle = '#1E293B'
  ctx.font = 'bold 18px Arial, "Microsoft YaHei", sans-serif'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  ctx.fillText('色号统计', legendPadding, legendStartY)

  ctx.font = '14px Arial, "Microsoft YaHei", sans-serif'
  ctx.fillStyle = '#64748B'
  ctx.textAlign = 'right'
  ctx.fillText(
    `${pattern.colorCounts.size} 种 · 共 ${pattern.totalBeads} 颗`,
    canvas.width - legendPadding,
    legendStartY + 2,
  )

  renderLegendGrid(
    ctx,
    pattern,
    legendPadding,
    legendStartY + headerHeight,
    contentWidth - legendPadding * 2,
  )

  return canvas
}

export function getExportOptions(showGridLines: boolean, showColorCodes: boolean): RenderOptions {
  return {
    cellSize: EXPORT_CELL_SIZE,
    showGridLines,
    showColorCodes,
    includeLegend: true,
    majorGridEvery: 10,
  }
}

export function downloadCanvas(canvas: HTMLCanvasElement, filename: string) {
  const link = document.createElement('a')
  link.download = filename
  link.href = canvas.toDataURL('image/png')
  link.click()
}
