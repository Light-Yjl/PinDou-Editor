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
  onPaintCell: (x: number, y: number) => void
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
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [brushMode, setBrushMode] = useState<'paint' | 'erase' | 'fill'>(externalBrushMode)
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null)
  const [showPalettePicker, setShowPalettePicker] = useState(false)
  
  const [isDragging, setIsDragging] = useState(false)
  const [lastPaintedPos, setLastPaintedPos] = useState<{ x: number; y: number } | null>(null)
  const batchActiveRef = useRef(false)

  // 同步外部 brushMode
  useEffect(() => {
    setBrushMode(externalBrushMode)
  }, [externalBrushMode])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault()
        if (canUndo) onUndo()
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault()
        if (canRedo) onRedo()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
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
  }, [pattern, showGridLines, showColorCodes])

  const getCellPosition = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>): { x: number; y: number } | null => {
      const canvas = canvasRef.current
      if (!canvas) return null

      const rect = canvas.getBoundingClientRect()
      const xRatio = (e.clientX - rect.left) / rect.width
      const yRatio = (e.clientY - rect.top) / rect.height

      const x = Math.floor(xRatio * pattern.width)
      const y = Math.floor(yRatio * pattern.height)

      if (x < 0 || x >= pattern.width || y < 0 || y >= pattern.height) {
        return null
      }

      return { x, y }
    },
    [pattern]
  )

  const handlePaint = useCallback(
    (x: number, y: number) => {
      if (brushMode === 'paint' && !selectedColor) {
        return
      }
      if (brushMode === 'erase' && !selectedColor) {
        onPaintCell(x, y)
        return
      }
      onPaintCell(x, y)
    },
    [brushMode, selectedColor, onPaintCell]
  )

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

  // ===== 鼠标按下 =====
  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const pos = getCellPosition(e)
      if (!pos) return
      if (e.button !== 0) return

      if (brushMode === 'fill') {
        handleFill(pos.x, pos.y)
        return
      }

      onStartBatch()
      batchActiveRef.current = true
      setIsDragging(true)
      setLastPaintedPos(pos)
      handlePaint(pos.x, pos.y)
    },
    [getCellPosition, brushMode, handleFill, handlePaint, onStartBatch]
  )

  // ===== 鼠标移动 =====
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const pos = getCellPosition(e)
      
      if (pos) {
        setHoverPos(pos)
      } else {
        setHoverPos(null)
      }

      if (brushMode === 'fill') return

      if (isDragging && pos) {
        if (!lastPaintedPos || lastPaintedPos.x !== pos.x || lastPaintedPos.y !== pos.y) {
          setLastPaintedPos(pos)
          handlePaint(pos.x, pos.y)
        }
      }
    },
    [isDragging, lastPaintedPos, getCellPosition, handlePaint, brushMode]
  )

  // ===== 鼠标松开 =====
  const handleMouseUp = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (e.button !== 0) return
      if (brushMode === 'fill') return

      if (isDragging && batchActiveRef.current) {
        setIsDragging(false)
        setLastPaintedPos(null)
        batchActiveRef.current = false
        onEndBatch()
      }
    },
    [isDragging, onEndBatch, brushMode]
  )

  // ===== 鼠标离开 =====
  const handleMouseLeave = useCallback(() => {
    setHoverPos(null)
    if (brushMode === 'fill') return
    
    if (isDragging && batchActiveRef.current) {
      setIsDragging(false)
      setLastPaintedPos(null)
      batchActiveRef.current = false
      onEndBatch()
    }
  }, [isDragging, onEndBatch, brushMode])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex max-h-[94vh] max-w-[98vw] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
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
                onClick={() => setBrushMode('paint')}
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
                onClick={() => setBrushMode('erase')}
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
                onClick={() => setBrushMode('fill')}
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

        <div className="flex-1 overflow-y-auto p-4">
          {hoverPos && (
            <div className="mb-2 text-xs text-slate-400">
              📍 ({hoverPos.x + 1}, {hoverPos.y + 1})
              {brushMode === 'fill' && selectedColor && (
                <span className="ml-2 text-indigo-500">🪣 点击填充</span>
              )}
            </div>
          )}

          <div
            ref={containerRef}
            className="flex justify-center rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100"
          >
            <canvas
              ref={canvasRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
              className={`block select-none ${
                brushMode === 'fill' ? 'cursor-pointer' : 'cursor-crosshair'
              }`}
              style={{ imageRendering: 'pixelated', touchAction: 'none', userSelect: 'none' }}
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