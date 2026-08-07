import { useEffect, useRef, useState, useCallback } from 'react'
import type { PatternResult, BeadColor } from '../types'
import {
  getExportOptions,
  renderPatternWithLegend,
  downloadCanvas,
} from '../lib/patternRenderer'
import { ColorLegend } from './ColorLegend'
import { PatternLightbox } from './PatternLightbox'
import { ColorPalettePicker } from './ColorPalettePicker'
import { floodFill } from '../lib/floodFill' // 新增
import { useI18n } from '../i18n/LanguageProvider'

interface PatternPreviewProps {
  pattern: PatternResult
  showGridLines: boolean
  showColorCodes: boolean
  onRemoveColor: (hex: string) => void
  onPaintCell: (x: number, y: number) => void
  onSelectColor: (color: BeadColor) => void
  selectedColor: BeadColor | null
  onMirrorPattern: () => void
  canUndo: boolean
  canRedo: boolean
  onUndo: () => void
  onRedo: () => void
  onStartBatch: () => void
  onEndBatch: () => void
  // 新增：setPattern 用于油漆桶
  setPattern: (pattern: PatternResult) => void
}

const PREVIEW_CELL_SIZE = 18
const MAX_PREVIEW_HEIGHT = 500
const MAX_PREVIEW_WIDTH = 800

function fitCanvasDisplay(
  canvas: HTMLCanvasElement,
  target: HTMLCanvasElement
) {
  target.width = canvas.width
  target.height = canvas.height
  const ctx = target.getContext('2d')!
  ctx.imageSmoothingEnabled = false
  ctx.drawImage(canvas, 0, 0)

  let displayW = canvas.width
  let displayH = canvas.height

  if (displayH > MAX_PREVIEW_HEIGHT) {
    displayW = (displayW * MAX_PREVIEW_HEIGHT) / displayH
    displayH = MAX_PREVIEW_HEIGHT
  }

  if (displayW > MAX_PREVIEW_WIDTH) {
    displayH = (displayH * MAX_PREVIEW_WIDTH) / displayW
    displayW = MAX_PREVIEW_WIDTH
  }

  target.style.width = `${Math.floor(displayW)}px`
  target.style.height = `${Math.floor(displayH)}px`
}

export function PatternPreview({
  pattern,
  showGridLines,
  showColorCodes,
  onRemoveColor,
  onPaintCell,
  onSelectColor,
  selectedColor,
  onMirrorPattern,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onStartBatch,
  onEndBatch,
  setPattern, // 新增
}: PatternPreviewProps) {
  const { t } = useI18n()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [brushMode, setBrushMode] = useState<'paint' | 'erase' | 'fill'>('paint') // 新增 fill 模式
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null)
  const [showPalettePicker, setShowPalettePicker] = useState(false)
  
  const [isDragging, setIsDragging] = useState(false)
  const [lastPaintedPos, setLastPaintedPos] = useState<{ x: number; y: number } | null>(null)
  const batchActiveRef = useRef(false)

  useEffect(() => {
    const canvas = renderPatternWithLegend(pattern, {
      cellSize: PREVIEW_CELL_SIZE,
      showGridLines,
      showColorCodes,
      includeLegend: false,
      majorGridEvery: 10,
    })

    const target = canvasRef.current
    if (!target) return

    fitCanvasDisplay(canvas, target)
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
        // 擦除模式：没有选中颜色也可以擦除
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

      // 如果点击的位置已经是目标颜色，不做任何事
      if (currentColor && currentColor.id === selectedColor.id) {
        return
      }

      // 开始批量
      onStartBatch()
      
      // 执行填充
      const newPattern = floodFill(
        pattern,
        x,
        y,
        currentColor ?? null,
        selectedColor
      )
      
      // 更新图案
      setPattern(newPattern)
      
      // 结束批量
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

      // 如果是油漆桶模式，直接填充
      if (brushMode === 'fill') {
        handleFill(pos.x, pos.y)
        return
      }

      // 画笔/擦除模式：开始批量
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

      // 油漆桶模式不处理拖拽
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
      // 油漆桶模式已经在 mousedown 中处理完了
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

  const handleDownload = () => {
    const canvas = renderPatternWithLegend(
      pattern,
      getExportOptions(showGridLines, showColorCodes)
    )
    downloadCanvas(canvas, t.pattern.filename(pattern.width, pattern.height))
  }

  return (
    <>
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-800">
            {t.pattern.title}
          </h2>

          <div className="flex flex-wrap items-center gap-3">
            {/* 工具按钮组 */}
            <div className="flex rounded-lg bg-slate-100 p-0.5">
              <button
                onClick={() => setBrushMode('paint')}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                  brushMode === 'paint'
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
                title="画笔：点击单格上色，拖拽连续绘制"
              >
                🖊 画笔
              </button>
              <button
                onClick={() => setBrushMode('erase')}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                  brushMode === 'erase'
                    ? 'bg-white text-red-500 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
                title="擦除：点击或拖拽擦除颜色"
              >
                🧹 擦除
              </button>
              <button
                onClick={() => setBrushMode('fill')}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                  brushMode === 'fill'
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
                title="油漆桶：点击填充相连的同色区域"
              >
                🪣 油漆桶
              </button>
            </div>

            <button
              onClick={onMirrorPattern}
              className="rounded-lg bg-purple-500 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-purple-600"
              title="水平镜像整个图纸"
            >
              🔄 镜像图纸
            </button>

            <div className="flex rounded-lg bg-slate-100 p-0.5">
              <button
                onClick={onUndo}
                disabled={!canUndo}
                className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition ${
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
                className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition ${
                  canRedo
                    ? 'text-slate-700 hover:bg-white hover:shadow-sm'
                    : 'cursor-not-allowed text-slate-300'
                }`}
                title="重做 (Ctrl+Y)"
              >
                ↪️
              </button>
            </div>

            {/* 选中颜色显示 */}
            {brushMode !== 'erase' && selectedColor && (
              <div className="flex items-center gap-2 rounded-lg bg-indigo-50 px-3 py-1.5">
                <div
                  className="h-5 w-5 rounded border border-slate-200"
                  style={{ backgroundColor: selectedColor.hex }}
                />
                <span className="text-xs font-medium text-indigo-700">
                  {selectedColor.code}
                </span>
              </div>
            )}

            {brushMode === 'paint' && !selectedColor && (
              <span className="text-xs text-amber-600">
                ⚠️ 请在图例或色盘中选择颜色
              </span>
            )}

            {brushMode === 'fill' && !selectedColor && (
              <span className="text-xs text-amber-600">
                ⚠️ 请先选择要填充的颜色
              </span>
            )}

            <span className="text-sm text-slate-400">
              {t.pattern.size(pattern.width, pattern.height)}
            </span>

            <button
              onClick={handleDownload}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
            >
              {t.pattern.download}
            </button>
          </div>
        </div>

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
          className="group relative flex justify-center overflow-hidden rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100"
          style={{ minHeight: 120 }}
          onDoubleClick={() => setLightboxOpen(true)}
          title={t.pattern.doubleClick}
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
            style={{ touchAction: 'none', userSelect: 'none' }}
          />

          <div className="pointer-events-none absolute inset-0 flex items-end justify-center bg-gradient-to-t from-black/20 to-transparent opacity-0 transition group-hover:opacity-100">
            <span className="mb-2 rounded-full bg-black/60 px-3 py-1 text-xs text-white">
              {brushMode === 'fill' 
                ? '🪣 点击填充相连区域' 
                : '点击单格 · 拖拽连续绘制'}
            </span>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <button
            onClick={() => setShowPalettePicker(!showPalettePicker)}
            className="text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:underline"
          >
            {showPalettePicker ? '📘 收起色盘' : '🎨 打开全部色盘'}
          </button>
          {selectedColor && (
            <span className="text-xs text-slate-400">
              当前: {selectedColor.code} {selectedColor.name}
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
          onRemoveColor={onRemoveColor}
          onSelectColor={onSelectColor}
          selectedColor={selectedColor}
        />
      </div>

      {lightboxOpen && (
        <PatternLightbox
          pattern={pattern}
          showGridLines={showGridLines}
          showColorCodes={showColorCodes}
          onClose={() => setLightboxOpen(false)}
          onPaintCell={onPaintCell}
          onSelectColor={onSelectColor}
          selectedColor={selectedColor}
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={onUndo}
          onRedo={onRedo}
          onStartBatch={onStartBatch}
          onEndBatch={onEndBatch}
          setPattern={setPattern} // 新增
          brushMode={brushMode} // 新增
        />
      )}
    </>
  )
}