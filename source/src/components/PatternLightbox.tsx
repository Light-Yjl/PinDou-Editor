import { useCanvasPointer } from '../hooks/useCanvasPointer'
import { useEffect, useRef, useState, useCallback } from 'react'
import type { PatternResult, BeadColor } from '../types'
import { renderPatternWithLegend } from '../lib/patternRenderer'
import { ColorLegend } from './ColorLegend'
import { ColorPalettePicker } from './ColorPalettePicker'
import { floodFill } from '../lib/floodFill'
import { useI18n } from '../i18n/LanguageProvider'

interface PatternLightboxProps {
  pattern: PatternResult
  showGridLines: boolean
  showColorCodes: boolean
  onClose: () => void
  onPaintCell: (x: number, y: number, erase?: boolean) => void
  onSelectColor: (color: BeadColor) => void
  selectedColor: BeadColor | null
  canUndo: boolean
  canRedo: boolean
  onUndo: () => void
  onRedo: () => void
  onStartBatch: () => void
  onEndBatch: () => void
  setPattern: (pattern: PatternResult) => void
  brushMode: 'paint' | 'erase' | 'fill'
}

const LIGHTBOX_CELL_SIZE = 28
const MAX_LIGHTBOX_WIDTH = 1000

function fitLightboxCanvas(source: HTMLCanvasElement, target: HTMLCanvasElement) {
  target.width = source.width
  target.height = source.height
  const ctx = target.getContext('2d')!
  ctx.imageSmoothingEnabled = false
  ctx.drawImage(source, 0, 0)

  if (source.width > MAX_LIGHTBOX_WIDTH) {
    const scale = MAX_LIGHTBOX_WIDTH / source.width
    target.style.width = `${MAX_LIGHTBOX_WIDTH}px`
    target.style.height = `${Math.floor(source.height * scale)}px`
  } else {
    target.style.width = `${source.width}px`
    target.style.height = `${source.height}px`
  }
}

export function PatternLightbox({
  pattern,
  showGridLines,
  showColorCodes,
  onClose,
  onPaintCell,
  onSelectColor,
  selectedColor,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onStartBatch,
  onEndBatch,
  setPattern,
  brushMode: externalBrushMode,
}: PatternLightboxProps) {
  const { t } = useI18n()
  const [zoom, setZoom] = useState(1)
  const [isPanning, setIsPanning] = useState(true)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [brushMode, setBrushMode] = useState<'paint' | 'erase' | 'fill'>(externalBrushMode)
  const [showPalettePicker, setShowPalettePicker] = useState(false)
  

  // 同步外部 brushMode
  useEffect(() => {
    setBrushMode(externalBrushMode)
  }, [externalBrushMode])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.target instanceof HTMLElement && e.target.matches("input,textarea,select")) return
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault()
        e.stopImmediatePropagation()
        if (canUndo) onUndo()
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault()
        e.stopImmediatePropagation()
        if (canRedo) onRedo()
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [onClose, canUndo, canRedo, onUndo, onRedo])

  useEffect(() => {
    const canvas = renderPatternWithLegend(pattern, {
      cellSize: LIGHTBOX_CELL_SIZE,
      showGridLines,
      showColorCodes,
      includeLegend: false,
      majorGridEvery: 10,
    })
    const target = canvasRef.current
    if (!target) return
    fitLightboxCanvas(canvas, target)
    target.style.width = `${Math.round(parseFloat(target.style.width) * zoom)}px`
    target.style.height = `${Math.round(parseFloat(target.style.height) * zoom)}px`
  }, [pattern, showGridLines, showColorCodes, zoom])

  const handlePaint = useCallback((x: number, y: number) => {
    if (brushMode === 'paint' && !selectedColor) return
    onPaintCell(x, y, brushMode === 'erase')
  }, [brushMode, selectedColor, onPaintCell])

  // ===== 油漆桶填充 =====
  const handleFill = useCallback(
    (x: number, y: number) => {
      if (!selectedColor) {
        return
      }

      const cell = pattern.cells[y]?.[x]
      if (!cell) return

      const currentColor = cell.color

      if (currentColor && currentColor.id === selectedColor.id) {
        return
      }

      onStartBatch()
      
      const newPattern = floodFill(
        pattern,
        x,
        y,
        currentColor ?? null,
        selectedColor
      )
      
      setPattern(newPattern)
      onEndBatch()
    },
    [pattern, selectedColor, setPattern, onStartBatch, onEndBatch]
  )

  const pointer = useCanvasPointer(pattern.width, pattern.height,
    brushMode === 'fill' ? handleFill : handlePaint, onStartBatch, onEndBatch, brushMode === 'fill', !isPanning)

  return (
    <div
      role="dialog" aria-modal="true" aria-label="图纸编辑" className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-1 sm:p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex w-full max-h-[96dvh] max-w-[1100px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-3">
          <div>
            <h3 className="font-semibold text-slate-800">
              ✏️ {t.lightbox.title}（可编辑）
            </h3>
            <p className="text-xs text-slate-400">
              {t.lightbox.hint(pattern.width, pattern.height)}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-lg bg-slate-100 p-0.5">
              <button
                onClick={() => { setBrushMode('paint'); setIsPanning(false) }}
                className={`rounded-md px-3 py-1 text-xs font-medium transition ${
                  brushMode === 'paint'
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
                title="画笔"
              >
                🖊 画笔
              </button>
              <button
                onClick={() => { setBrushMode('erase'); setIsPanning(false) }}
                className={`rounded-md px-3 py-1 text-xs font-medium transition ${
                  brushMode === 'erase'
                    ? 'bg-white text-red-500 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
                title="擦除"
              >
                🧹 擦除
              </button>
              <button
                onClick={() => { setBrushMode('fill'); setIsPanning(false) }}
                className={`rounded-md px-3 py-1 text-xs font-medium transition ${
                  brushMode === 'fill'
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
                title="油漆桶"
              >
                🪣 油漆桶
              </button>
            </div>

            <div className="flex rounded-lg bg-slate-100 p-0.5">
              <button
                onClick={onUndo}
                disabled={!canUndo}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                  canUndo
                    ? 'text-slate-700 hover:bg-white hover:shadow-sm'
                    : 'cursor-not-allowed text-slate-300'
                }`}
                title="撤销 (Ctrl+Z)"
              >
                ↩️
              </button>
              <button
                onClick={onRedo}
                disabled={!canRedo}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                  canRedo
                    ? 'text-slate-700 hover:bg-white hover:shadow-sm'
                    : 'cursor-not-allowed text-slate-300'
                }`}
                title="重做 (Ctrl+Y)"
              >
                ↪️
              </button>
            </div>

            {brushMode !== 'erase' && selectedColor && (
              <div
                className="h-5 w-5 rounded border border-slate-200"
                style={{ backgroundColor: selectedColor.hex }}
              />
            )}

            <button
              onClick={onClose}
              className="rounded-lg px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-100"
            >
              ✕ {t.lightbox.close}
            </button>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-3 border-b p-3 text-sm">
          <button className="rounded-lg bg-indigo-100 px-3 py-2 text-indigo-800" onClick={() => setIsPanning(value => !value)}>{isPanning ? '当前：移动图纸 · 点击切换绘制' : '当前：绘制 · 点击切换移动'}</button>
          <label className="flex items-center gap-2">缩放 <input aria-label="图纸缩放" type="range" min="0.3" max="3" step="0.1" value={zoom} onChange={e => setZoom(Number(e.target.value))} /> {Math.round(zoom * 100)}%</label>
        </div>
        <div className="min-h-0 flex-1 overflow-auto p-3">

          <div
            ref={containerRef}
            className="w-max min-w-full rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100"
          >
            <canvas
              ref={canvasRef}
              {...pointer}
              className={`block select-none ${
                brushMode === 'fill' ? 'cursor-pointer' : 'cursor-crosshair'
              }`}
              style={{ imageRendering: 'pixelated', touchAction: isPanning ? 'auto' : 'none', userSelect: 'none' }}
            />
          </div>

          <div className="mx-auto mt-6 max-w-4xl">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setShowPalettePicker(!showPalettePicker)}
                className="text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:underline"
              >
                {showPalettePicker ? '📘 收起色盘' : '🎨 打开全部色盘'}
              </button>
              {selectedColor && (
                <span className="text-xs text-slate-400">
                  当前: {selectedColor.code}
                </span>
              )}
            </div>

            {showPalettePicker && (
              <ColorPalettePicker
                selectedColor={selectedColor}
                onSelectColor={onSelectColor}
              />
            )}

            <ColorLegend
              pattern={pattern}
              onRemoveColor={(_hex: string) => {}}
              onSelectColor={onSelectColor}
              selectedColor={selectedColor}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
