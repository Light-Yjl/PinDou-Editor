import {
  PATTERN_PRESETS,
  findMatchingPreset,
  type PatternPreset,
} from '../lib/presets'
import type { ImageAnalysis } from '../lib/imageAnalyzer'
import { useI18n } from '../i18n/LanguageProvider'
import { formatAnalysisReason, getPresetDesc, getPresetName } from '../i18n/locales'

interface ControlsProps {
  removeBackground: boolean
  onRemoveBackgroundChange: (value: boolean) => void
  modelsReady: boolean
  modelsDownloading: boolean
  canDownloadModels: boolean
  onDownloadModels: () => void
  autoDetectParams: boolean
  onAutoDetectParamsChange: (value: boolean) => void
  gridWidth: number
  onGridWidthChange: (value: number) => void
  maxColors: number
  onMaxColorsChange: (value: number) => void
  showGridLines: boolean
  onShowGridLinesChange: (value: boolean) => void
  showColorCodes: boolean
  onShowColorCodesChange: (value: boolean) => void
  onApplyPreset: (preset: PatternPreset) => void
  onGenerate: () => void
  isProcessing: boolean
  hasImage: boolean
  imageAnalysis: ImageAnalysis | null
}

export function Controls({
  removeBackground,
  onRemoveBackgroundChange,
  modelsReady,
  modelsDownloading,
  canDownloadModels,
  onDownloadModels,
  autoDetectParams,
  onAutoDetectParamsChange,
  gridWidth,
  onGridWidthChange,
  maxColors,
  onMaxColorsChange,
  showGridLines,
  onShowGridLinesChange,
  showColorCodes,
  onShowColorCodesChange,
  onApplyPreset,
  onGenerate,
  isProcessing,
  hasImage,
  imageAnalysis,
}: ControlsProps) {
  const { locale, t } = useI18n()
  const paramsLocked = autoDetectParams && hasImage
  const activePreset = findMatchingPreset(gridWidth, maxColors)
  const isAutoApplied =
    imageAnalysis &&
    imageAnalysis.gridWidth === gridWidth &&
    imageAnalysis.maxColors === maxColors

  return (
    <div className="space-y-5 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
      <h2 className="text-lg font-semibold text-slate-800">{t.controls.title}</h2>

      <label className="flex cursor-pointer items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
        <div>
          <p className="font-medium text-slate-700">{t.controls.autoDetect}</p>
          <p className="text-xs text-slate-400">{t.controls.autoDetectHint}</p>
        </div>
        <input
          type="checkbox"
          checked={autoDetectParams}
          onChange={(e) => onAutoDetectParamsChange(e.target.checked)}
          disabled={isProcessing}
          className="h-5 w-5 rounded accent-indigo-600"
        />
      </label>

      {autoDetectParams && imageAnalysis && (
        <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 px-4 py-3">
          <p className="text-sm font-medium text-indigo-700">
            {t.controls.detected}「{getPresetName(locale, imageAnalysis.presetId)}」
          </p>
          <p className="mt-1 text-xs text-indigo-500/90">
            {formatAnalysisReason(locale, imageAnalysis)}
          </p>
          <p className="mt-1 text-xs font-medium text-indigo-600">
            {t.controls.presetSize(imageAnalysis.gridWidth, imageAnalysis.maxColors)}
            {isAutoApplied ? ` ${t.controls.applied}` : ''}
          </p>
        </div>
      )}

      {modelsReady ? (
        <div className="flex items-center justify-between rounded-xl bg-emerald-50 px-4 py-3 ring-1 ring-emerald-100">
          <div>
            <p className="font-medium text-emerald-800">{t.controls.downloadModelsDone}</p>
            <p className="text-xs text-emerald-600/80">{t.controls.autoCutoutHint}</p>
          </div>
          <span className="text-lg text-emerald-500" aria-hidden>
            ✓
          </span>
        </div>
      ) : (
        <div className="rounded-xl bg-amber-50/80 px-4 py-3 ring-1 ring-amber-100">
          <p className="font-medium text-amber-900">{t.controls.downloadModels}</p>
          <p className="mt-1 text-xs text-amber-700/90">{t.controls.downloadModelsHint}</p>
          {canDownloadModels ? (
            <button
              type="button"
              onClick={onDownloadModels}
              disabled={isProcessing || modelsDownloading}
              className="mt-3 w-full rounded-lg bg-amber-600 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:bg-amber-300"
            >
              {modelsDownloading ? t.controls.downloadModelsDownloading : t.controls.downloadModels}
            </button>
          ) : (
            <p className="mt-2 text-xs text-amber-700">{t.controls.downloadModelsDesktopOnly}</p>
          )}
        </div>
      )}

      <label
        className={`flex items-center justify-between rounded-xl px-4 py-3 ${
          modelsReady
            ? 'cursor-pointer bg-slate-50'
            : 'cursor-not-allowed bg-slate-50/60 opacity-60'
        }`}
      >
        <div>
          <p className="font-medium text-slate-700">{t.controls.autoCutout}</p>
          <p className="text-xs text-slate-400">
            {modelsReady ? t.controls.autoCutoutHint : t.controls.autoCutoutLocked}
          </p>
        </div>
        <input
          type="checkbox"
          checked={removeBackground}
          onChange={(e) => onRemoveBackgroundChange(e.target.checked)}
          disabled={!modelsReady || isProcessing}
          className="h-5 w-5 rounded accent-indigo-600 disabled:opacity-50"
        />
      </label>

      <div
        className={`space-y-5 rounded-xl transition ${
          paramsLocked ? 'bg-slate-50/80 p-4 ring-1 ring-slate-200' : ''
        }`}
      >
        {paramsLocked && (
          <p className="text-xs font-medium text-slate-400">{t.controls.paramsLocked}</p>
        )}

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-sm font-medium text-slate-700">{t.controls.presets}</label>
            {activePreset && (
              <span className="text-xs text-indigo-500">
                {getPresetName(locale, activePreset.id)}
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {PATTERN_PRESETS.map((preset) => {
              const isActive = activePreset?.id === preset.id
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => onApplyPreset(preset)}
                  disabled={isProcessing || paramsLocked}
                  title={getPresetDesc(locale, preset.id)}
                  className={`rounded-xl px-3 py-2.5 text-left transition ${
                    isActive
                      ? 'bg-indigo-600 text-white ring-2 ring-indigo-300'
                      : 'bg-slate-50 text-slate-700 hover:bg-indigo-50 hover:text-indigo-700'
                  } disabled:cursor-not-allowed disabled:opacity-50`}
                >
                  <p className="text-sm font-semibold">{getPresetName(locale, preset.id)}</p>
                  <p
                    className={`mt-0.5 text-xs ${
                      isActive ? 'text-indigo-100' : 'text-slate-400'
                    }`}
                  >
                    {t.controls.presetSize(preset.gridWidth, preset.maxColors)}
                  </p>
                </button>
              )
            })}
          </div>
          {!activePreset && !paramsLocked && (
            <p className="mt-2 text-xs text-slate-400">{t.controls.manualAdjust}</p>
          )}
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-sm font-medium text-slate-700">{t.controls.gridWidth}</label>
            <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-sm font-semibold text-indigo-600">
              {gridWidth}
            </span>
          </div>
          <input
            type="range"
            min={10}
            max={100}
            value={gridWidth}
            onChange={(e) => onGridWidthChange(Number(e.target.value))}
            disabled={paramsLocked}
            className="w-full accent-indigo-600 disabled:opacity-50"
          />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-sm font-medium text-slate-700">{t.controls.maxColors}</label>
            <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-sm font-semibold text-indigo-600">
              {maxColors}
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={80}
            value={maxColors}
            onChange={(e) => onMaxColorsChange(Number(e.target.value))}
            disabled={paramsLocked}
            className="w-full accent-indigo-600 disabled:opacity-50"
          />
        </div>
      </div>

      <div className="flex gap-4">
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={showGridLines}
            onChange={(e) => onShowGridLinesChange(e.target.checked)}
            className="accent-indigo-600"
          />
          {t.controls.showGrid}
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={showColorCodes}
            onChange={(e) => onShowColorCodesChange(e.target.checked)}
            className="accent-indigo-600"
          />
          {t.controls.showCodes}
        </label>
      </div>

      <button
        onClick={onGenerate}
        disabled={!hasImage || isProcessing}
        className="w-full rounded-xl bg-indigo-600 py-3.5 text-base font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        {isProcessing ? t.controls.processing : t.controls.generate}
      </button>
    </div>
  )
}
