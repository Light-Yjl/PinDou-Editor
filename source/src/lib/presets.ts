export interface PatternPreset {
  id: string
  gridWidth: number
  maxColors: number
  
}

export const PATTERN_PRESETS: PatternPreset[] = [
  { id: 'default', gridWidth: 40, maxColors: 20 },
  { id: 'tiny', gridWidth: 15, maxColors: 6 },     // 👈 新增：小挂件用
  { id: 'mini', gridWidth: 20, maxColors: 10 },
  { id: 'simple', gridWidth: 35, maxColors: 12 },
  { id: 'standard', gridWidth: 50, maxColors: 18 },
  { id: 'large', gridWidth: 70, maxColors: 25 },
  { id: 'fine', gridWidth: 85, maxColors: 35 },
]

export const DEFAULT_PRESET = PATTERN_PRESETS[0]

export function findMatchingPreset(
  gridWidth: number,
  maxColors: number,
): PatternPreset | null {
  return (
    PATTERN_PRESETS.find(
      (p) => p.gridWidth === gridWidth && p.maxColors === maxColors,
    ) ?? null
  )
}

export function getPresetById(id: string): PatternPreset | undefined {
  return PATTERN_PRESETS.find((p) => p.id === id)
}
