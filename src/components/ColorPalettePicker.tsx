import { useState, useMemo } from 'react'
import { BEAD_PALETTE } from '../lib/colorPalette'
import type { BeadColor } from '../types'
import { useI18n } from '../i18n/LanguageProvider'

interface ColorPalettePickerProps {
  selectedColor: BeadColor | null
  onSelectColor: (color: BeadColor) => void
  excludedColors?: string[]
}

export function ColorPalettePicker({
  selectedColor,
  onSelectColor,
  excludedColors = [],
}: ColorPalettePickerProps) {
  const { t } = useI18n()
  const [searchTerm, setSearchTerm] = useState('')
  const [showAll, setShowAll] = useState(false)

  // 过滤掉已排除的颜色
  const availableColors = useMemo(() => {
    return BEAD_PALETTE.filter(
      (color) => !excludedColors.includes(color.hex.toLowerCase())
    )
  }, [excludedColors])

  // 搜索过滤
  const filteredColors = useMemo(() => {
    if (!searchTerm.trim()) return availableColors
    const term = searchTerm.toLowerCase().trim()
    return availableColors.filter(
      (color) =>
        color.code.toLowerCase().includes(term) ||
        color.name.toLowerCase().includes(term) ||
        color.hex.toLowerCase().includes(term)
    )
  }, [availableColors, searchTerm])

  // 按颜色分组（按首字母）
  const groupedColors = useMemo(() => {
    const groups: Record<string, BeadColor[]> = {}
    const displayColors = showAll ? filteredColors : filteredColors.slice(0, 60)
    for (const color of displayColors) {
      const key = color.code.charAt(0)
      if (!groups[key]) groups[key] = []
      groups[key].push(color)
    }
    return groups
  }, [filteredColors, showAll])

  const totalColors = availableColors.length
  const displayCount = showAll ? filteredColors.length : Math.min(60, filteredColors.length)

  // 判断颜色深浅
  function isLightColor(hex: string): boolean {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return (r * 299 + g * 587 + b * 114) / 1000 > 140
  }

  return (
    <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-sm font-semibold text-slate-700">
          🎨 {t.controls.colorPalette || '全部色盘'}
        </h4>
        <span className="text-xs text-slate-400">
          {displayCount} / {totalColors} {t.controls.colors || '种颜色'}
        </span>
      </div>

      {/* 搜索框 */}
      <div className="mb-3">
        <input
          type="text"
          placeholder={t.controls.searchColor || '搜索颜色 (名称/编号/色值)...'}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
        />
      </div>

      {/* 颜色网格 */}
      <div className="max-h-48 overflow-y-auto">
        {Object.entries(groupedColors).map(([group, colors]) => (
          <div key={group} className="mb-2">
            <div className="mb-1 text-xs font-medium text-slate-400">{group}</div>
            <div className="grid grid-cols-8 gap-1 sm:grid-cols-10 md:grid-cols-12">
              {colors.map((color) => {
                const isSelected = selectedColor?.id === color.id
                const light = isLightColor(color.hex)
                return (
                  <button
                    key={color.id}
                    onClick={() => onSelectColor(color)}
                    className={`relative aspect-square rounded-md transition-all hover:scale-110 ${
                      isSelected
                        ? 'ring-2 ring-indigo-500 ring-offset-2'
                        : 'ring-1 ring-slate-200 hover:ring-indigo-300'
                    }`}
                    style={{ backgroundColor: color.hex }}
                    title={`${color.code} - ${color.name}`}
                  >
                    {isSelected && (
                      <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white drop-shadow-md">
                        ✓
                      </span>
                    )}
                    {/* 字号从 6px 增大到 9px */}
                    <span
                      className={`absolute bottom-0.5 right-0.5 text-[9px] font-semibold ${
                        light ? 'text-slate-700' : 'text-white/90'
                      }`}
                    >
                      {color.code}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* 显示更多按钮 */}
      {!showAll && filteredColors.length > 60 && (
        <button
          onClick={() => setShowAll(true)}
          className="mt-2 w-full rounded-lg border border-slate-200 py-1.5 text-xs text-slate-500 transition hover:bg-slate-50"
        >
          {t.controls.showAll || '显示全部颜色'} ({filteredColors.length - 60} {t.controls.more || '更多'})
        </button>
      )}

      {showAll && filteredColors.length > 60 && (
        <button
          onClick={() => setShowAll(false)}
          className="mt-2 w-full rounded-lg border border-slate-200 py-1.5 text-xs text-slate-500 transition hover:bg-slate-50"
        >
          {t.controls.showLess || '收起'}
        </button>
      )}

      {/* 当前选中颜色显示 */}
      {selectedColor && (
        <div className="mt-3 flex items-center gap-3 rounded-lg bg-indigo-50 p-2">
          <div
            className="h-8 w-8 rounded-md ring-1 ring-slate-200"
            style={{ backgroundColor: selectedColor.hex }}
          />
          <div>
            <div className="text-sm font-semibold text-slate-700">
              {selectedColor.code} - {selectedColor.name}
            </div>
            <div className="text-xs text-slate-400">{selectedColor.hex}</div>
          </div>
          <button
            onClick={() => onSelectColor(selectedColor)}
            className="ml-auto rounded-lg bg-indigo-600 px-3 py-1 text-xs text-white hover:bg-indigo-700"
          >
            ✓ {t.controls.selected || '已选中'}
          </button>
        </div>
      )}
    </div>
  )
}