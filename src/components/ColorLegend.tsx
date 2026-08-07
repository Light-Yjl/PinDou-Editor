import type { PatternResult, BeadColor } from '../types'
import { useI18n } from '../i18n/LanguageProvider'
import { getColorName } from '../i18n/locales'

interface ColorLegendProps {
  pattern: PatternResult
  onRemoveColor: (hex: string) => void
  onSelectColor: (color: BeadColor) => void
  selectedColor?: BeadColor | null // 新增
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

export function ColorLegend({
  pattern,
  onRemoveColor,
  onSelectColor,
  selectedColor,
}: ColorLegendProps) {
  const { locale, t } = useI18n()

  const sorted = [...pattern.colorCounts.values()].sort((a, b) => b.count - a.count)

  return (
    <div className="relative z-10 mt-6 border-t border-slate-200 bg-white pt-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base font-semibold text-slate-800">
          {t.pattern.legend}
        </h3>
        <span className="text-sm text-slate-500">
          {t.pattern.legendSummary(sorted.length, pattern.totalBeads)}
        </span>
      </div>

      <div className="space-y-2">
        {sorted.map(({ color, count }) => {
          const light = isLightColor(color.hex)
          const colorName = getColorName(locale, color.id, color.name)
          const isSelected = selectedColor?.id === color.id

          return (
            <div
              key={color.id}
              className={`flex items-center justify-between rounded-lg border p-2 transition ${
                isSelected
                  ? 'border-indigo-400 bg-indigo-50 ring-2 ring-indigo-300'
                  : 'border-slate-100 hover:border-indigo-200'
              }`}
            >
              <div
                className="flex cursor-pointer items-center gap-3 flex-1"
                onClick={() => onSelectColor(color)}
              >
                <div
                  className="h-10 w-10 shrink-0 rounded-md ring-1 ring-black/10"
                  style={{ backgroundColor: color.hex }}
                />
                <div>
                  <div className="text-sm font-semibold" style={{ color: light ? '#111' : '#333' }}>
                    {formatCode(color.code)}
                    {isSelected && ' ✓'}
                  </div>
                  <div className="text-xs text-slate-500">
                    {colorName} · {count} {t.pattern.beadUnit}
                  </div>
                </div>
              </div>

              <button
                onClick={() => onRemoveColor(color.hex)}
                className="rounded-md px-3 py-1 text-xs text-red-500 hover:bg-red-50"
              >
                删除
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}