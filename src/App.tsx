import { useCallback, useEffect, useState } from 'react'
import { ImageUpload } from './components/ImageUpload'
import { Controls } from './components/Controls'
import { PatternPreview } from './components/PatternPreview'
import { LanguageSwitcher } from './components/LanguageSwitcher'
import { removeImageBackground, blobToDataUrl } from './lib/backgroundRemoval'
import { generatePattern } from './lib/imageProcessor'
import { analyzeImage, type ImageAnalysis } from './lib/imageAnalyzer'
import {
  canDownloadModelsInApp,
  checkModelsReady,
  downloadModels,
} from './lib/modelStatus'
import {
  DEFAULT_PRESET,
  type PatternPreset,
} from './lib/presets'
import { useI18n } from './i18n/LanguageProvider'
import type { PatternResult, BeadColor } from './types'
import { mirrorImage } from './lib/imageTransform'
import { mirrorPattern } from './lib/patternTransform'
import { useUndo } from './hooks/useUndo'

type ProcessingStage =
  | 'idle'
  | 'downloading-models'
  | 'removing-bg'
  | 'generating'
  | 'analyzing'

export default function App() {
  const { t } = useI18n()

  const [originalUrl, setOriginalUrl] = useState<string | null>(null)
  const [processedUrl, setProcessedUrl] = useState<string | null>(null)
  const [imageAnalysis, setImageAnalysis] = useState<ImageAnalysis | null>(null)
  const [selectedColor, setSelectedColor] = useState<BeadColor | null>(null)
  const [excludedColors, setExcludedColors] = useState<string[]>([])
  const [removeBackground, setRemoveBackground] = useState(false)
  const [modelsReady, setModelsReady] = useState(false)
  const [modelsDownloading, setModelsDownloading] = useState(false)
  const [canDownloadModels, setCanDownloadModels] = useState(false)
  const [autoDetectParams, setAutoDetectParams] = useState(true)
  const [gridWidth, setGridWidth] = useState(DEFAULT_PRESET.gridWidth)
  const [maxColors, setMaxColors] = useState(DEFAULT_PRESET.maxColors)
  const [showGridLines, setShowGridLines] = useState(true)
  const [showColorCodes, setShowColorCodes] = useState(true)
  const [stage, setStage] = useState<ProcessingStage>('idle')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const isProcessing = stage !== 'idle'

  // ===== 使用 useUndo 管理 pattern =====
  const {
    state: pattern,
    setState: setPattern,
    undo,
    redo,
    canUndo,
    canRedo,
    clearHistory,
    startBatch,
    endBatch,
  } = useUndo<PatternResult | null>(null, { maxHistory: 50 })

  // 键盘快捷键：Ctrl+Z 撤销，Ctrl+Y 重做
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault()
        if (canUndo) {
          undo()
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault()
        if (canRedo) {
          redo()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [canUndo, canRedo, undo, redo])

  useEffect(() => {
    setCanDownloadModels(canDownloadModelsInApp())
    checkModelsReady().then(setModelsReady)
  }, [])

  const handleDownloadModels = useCallback(async () => {
    if (modelsReady || modelsDownloading) return
    setError(null)
    setModelsDownloading(true)
    setStage('downloading-models')

    try {
      await downloadModels()
      setModelsReady(true)
    } catch (err) {
      console.error(err)
      setError(t.errors.modelsDownloadFailed)
    } finally {
      setModelsDownloading(false)
      setStage('idle')
    }
  }, [modelsReady, modelsDownloading, t.errors.modelsDownloadFailed])

  const handleRemoveBackgroundChange = useCallback(
    (enabled: boolean) => {
      if (enabled && !modelsReady) return
      setRemoveBackground(enabled)
    },
    [modelsReady]
  )

  const handleImageSelect = useCallback(
    async (_file: File, previewUrl: string) => {
      setOriginalUrl(previewUrl)
      setProcessedUrl(null)
      setPattern(null)
      clearHistory(null)
      setError(null)
      setImageAnalysis(null)
      setExcludedColors([])
      setSelectedColor(null)

      try {
        setStage('analyzing')
        const analysis = await analyzeImage(previewUrl)
        setImageAnalysis(analysis)

        if (autoDetectParams) {
          setGridWidth(analysis.gridWidth)
          setMaxColors(analysis.maxColors)
        }
      } catch (err) {
        console.error(err)
        setError(err instanceof Error ? err.message : '分析图片失败')
      } finally {
        setStage('idle')
      }
    },
    [autoDetectParams, setPattern, clearHistory]
  )

  const handleAutoDetectParamsChange = useCallback(
    (enabled: boolean) => {
      setAutoDetectParams(enabled)
      if (enabled && imageAnalysis) {
        setGridWidth(imageAnalysis.gridWidth)
        setMaxColors(imageAnalysis.maxColors)
      }
    },
    [imageAnalysis]
  )

  const handleApplyPreset = useCallback((preset: PatternPreset) => {
    setGridWidth(preset.gridWidth)
    setMaxColors(preset.maxColors)
  }, [])

  const handleGenerate = useCallback(async () => {
    if (!originalUrl) return

    setError(null)
    setPattern(null)
    setSelectedColor(null)

    try {
      let sourceUrl = originalUrl
      if (removeBackground) {
        setStage('removing-bg')
        setProgress(0)
        const blob = await removeImageBackground(originalUrl, setProgress)
        sourceUrl = await blobToDataUrl(blob)
        setProcessedUrl(sourceUrl)
      } else {
        setProcessedUrl(null)
      }

      setStage('generating')
      const result = await generatePattern(
        sourceUrl,
        gridWidth,
        maxColors,
        excludedColors
      )
      setPattern(result)
    } catch (err) {
      console.error(err)
      const detail = err instanceof Error ? err.message : String(err)
      setError(`${t.errors.generateFailed} ${detail}`)
    } finally {
      setStage('idle')
      setProgress(0)
    }
  }, [originalUrl, removeBackground, gridWidth, maxColors, excludedColors, t.errors, setPattern])

  const handleMirrorImage = useCallback(async () => {
    if (!originalUrl) return
    const result = await mirrorImage(originalUrl)
    setOriginalUrl(result)
  }, [originalUrl])

  const handleMirrorPattern = useCallback(() => {
    if (!pattern) return
    const mirrored = mirrorPattern(pattern)
    setPattern(mirrored)
  }, [pattern, setPattern])

  const handleClear = useCallback(() => {
    setOriginalUrl(null)
    setProcessedUrl(null)
    setPattern(null)
    clearHistory(null)
    setImageAnalysis(null)
    setExcludedColors([])
    setSelectedColor(null)
    setError(null)
  }, [setPattern, clearHistory])

  // ===== 核心：格子编辑函数 =====
  const handlePaintCell = useCallback(
    (x: number, y: number) => {
      if (!pattern) return

      if (x < 0 || y < 0 || y >= pattern.height || x >= pattern.width) {
        return
      }

      const cell = pattern.cells[y][x]
      const currentColor = cell?.color

      // 如果没有选中颜色 → 擦除当前格子
      if (!selectedColor) {
        if (!currentColor) return

        const nextCells = pattern.cells.map((row, rowIndex) =>
          row.map((currentCell, columnIndex) => {
            if (rowIndex === y && columnIndex === x) {
              return { ...currentCell, color: null }
            }
            return currentCell
          })
        )

        const nextColorCounts = new Map(pattern.colorCounts)
        const existing = nextColorCounts.get(currentColor.id)
        if (existing) {
          if (existing.count <= 1) {
            nextColorCounts.delete(currentColor.id)
          } else {
            existing.count -= 1
          }
        }

        setPattern({
          ...pattern,
          cells: nextCells,
          colorCounts: nextColorCounts,
          totalBeads: Math.max(0, pattern.totalBeads - 1),
        })
        return
      }

      // 如果格子颜色与选中颜色相同 → 擦除（点击切换）
      if (currentColor && currentColor.id === selectedColor.id) {
        const nextCells = pattern.cells.map((row, rowIndex) =>
          row.map((currentCell, columnIndex) => {
            if (rowIndex === y && columnIndex === x) {
              return { ...currentCell, color: null }
            }
            return currentCell
          })
        )

        const nextColorCounts = new Map(pattern.colorCounts)
        const existing = nextColorCounts.get(currentColor.id)
        if (existing) {
          if (existing.count <= 1) {
            nextColorCounts.delete(currentColor.id)
          } else {
            existing.count -= 1
          }
        }

        setPattern({
          ...pattern,
          cells: nextCells,
          colorCounts: nextColorCounts,
          totalBeads: Math.max(0, pattern.totalBeads - 1),
        })
        return
      }

      // 格子为空或颜色不同 → 上色/替换
      const nextCells = pattern.cells.map((row, rowIndex) =>
        row.map((currentCell, columnIndex) => {
          if (rowIndex === y && columnIndex === x) {
            return { ...currentCell, color: selectedColor }
          }
          return currentCell
        })
      )

      const nextColorCounts = new Map(pattern.colorCounts)

      if (currentColor) {
        const old = nextColorCounts.get(currentColor.id)
        if (old) {
          if (old.count <= 1) {
            nextColorCounts.delete(currentColor.id)
          } else {
            old.count -= 1
          }
        }
        const newColor = nextColorCounts.get(selectedColor.id)
        if (newColor) {
          newColor.count += 1
        } else {
          nextColorCounts.set(selectedColor.id, {
            color: selectedColor,
            count: 1,
          })
        }

        setPattern({
          ...pattern,
          cells: nextCells,
          colorCounts: nextColorCounts,
          totalBeads: pattern.totalBeads,
        })
        return
      }

      const newColor = nextColorCounts.get(selectedColor.id)
      if (newColor) {
        newColor.count += 1
      } else {
        nextColorCounts.set(selectedColor.id, {
          color: selectedColor,
          count: 1,
        })
      }

      setPattern({
        ...pattern,
        cells: nextCells,
        colorCounts: nextColorCounts,
        totalBeads: pattern.totalBeads + 1,
      })
    },
    [pattern, selectedColor, setPattern]
  )

  const handleRemoveColorAndGenerate = useCallback(
    async (hex: string) => {
      if (!originalUrl || !pattern || isProcessing) return
      if (excludedColors.includes(hex)) return

      const nextExcludedColors = [...excludedColors, hex]
      setExcludedColors(nextExcludedColors)
      setSelectedColor(null)
      setError(null)
      setPattern(null)

      try {
        setStage('generating')
        setProgress(0)

        const sourceUrl = processedUrl ?? originalUrl
        const result = await generatePattern(
          sourceUrl,
          gridWidth,
          maxColors,
          nextExcludedColors
        )

        setPattern(result)
      } catch (err) {
        console.error(err)
        const detail = err instanceof Error ? err.message : String(err)
        setError(`${t.errors.generateFailed} ${detail}`)
      } finally {
        setStage('idle')
        setProgress(0)
      }
    },
    [originalUrl, pattern, isProcessing, excludedColors, processedUrl, gridWidth, maxColors, t.errors, setPattern]
  )

  const previewImage = processedUrl ?? originalUrl

  const processingText =
    stage === 'analyzing'
      ? t.processing.analyzing
      : stage === 'downloading-models'
      ? t.controls.downloadModelsDownloading
      : stage === 'removing-bg'
      ? t.processing.removingBg
      : t.processing.generating

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-50">
      <header className="border-b border-slate-200/60 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-start justify-between gap-4 px-4 py-5">
          <div>
            {isProcessing && (
              <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
                <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
                <p>{processingText}</p>
                {stage === 'removing-bg' && progress > 0 && (
                  <div className="mt-4">
                    <div className="h-2 rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-indigo-600"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
            <h1 className="text-2xl font-bold text-slate-800">{t.app.title}</h1>
            <p className="mt-1 text-sm text-slate-500">{t.app.subtitle}</p>
          </div>
          <LanguageSwitcher />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-700 ring-1 ring-red-200">
            <strong>错误：</strong> {error}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
          <div className="space-y-6">
            {!originalUrl ? (
              <ImageUpload onImageSelect={handleImageSelect} disabled={isProcessing} />
            ) : (
              <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
                <div className="p-4">
                  <img src={previewImage ?? undefined} className="max-h-48 mx-auto" />
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      onClick={handleMirrorImage}
                      className="rounded-lg bg-indigo-500 px-4 py-2 text-sm text-white transition hover:bg-indigo-600"
                    >
                      🔄 镜像原图
                    </button>
                    <button
                      onClick={handleClear}
                      className="rounded-lg bg-red-500 px-4 py-2 text-sm text-white transition hover:bg-red-600"
                    >
                      🗑 清空
                    </button>
                  </div>
                </div>
              </div>
            )}

            <Controls
              removeBackground={removeBackground}
              onRemoveBackgroundChange={handleRemoveBackgroundChange}
              modelsReady={modelsReady}
              modelsDownloading={modelsDownloading}
              canDownloadModels={canDownloadModels}
              onDownloadModels={handleDownloadModels}
              autoDetectParams={autoDetectParams}
              onAutoDetectParamsChange={handleAutoDetectParamsChange}
              gridWidth={gridWidth}
              onGridWidthChange={setGridWidth}
              maxColors={maxColors}
              onMaxColorsChange={setMaxColors}
              showGridLines={showGridLines}
              onShowGridLinesChange={setShowGridLines}
              showColorCodes={showColorCodes}
              onShowColorCodesChange={setShowColorCodes}
              onApplyPreset={handleApplyPreset}
              onGenerate={handleGenerate}
              isProcessing={isProcessing}
              hasImage={!!originalUrl}
              imageAnalysis={imageAnalysis}
            />
          </div>

          <div className="space-y-6">
            {pattern && !isProcessing && (
              <PatternPreview
                pattern={pattern}
                showGridLines={showGridLines}
                showColorCodes={showColorCodes}
                onRemoveColor={handleRemoveColorAndGenerate}
                onPaintCell={handlePaintCell}
                onSelectColor={setSelectedColor}
                selectedColor={selectedColor}
                onMirrorPattern={handleMirrorPattern}
                canUndo={canUndo}
                canRedo={canRedo}
                onUndo={undo}
                onRedo={redo}
                onStartBatch={startBatch}
                onEndBatch={endBatch}
                setPattern={setPattern}  // 新增
              />
            )}
          </div>
        </div>
      </main>
    </div>
  )
}