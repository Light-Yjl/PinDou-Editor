export interface BeadColor {
  id: string
  name: string
  hex: string
  code: string
}

export interface PatternCell {
  color: BeadColor | null
  x: number
  y: number
}

export interface PatternResult {
  width: number
  height: number
  cells: PatternCell[][]
  colorCounts: Map<string, { color: BeadColor; count: number }>
  totalBeads: number
}

export interface GenerateOptions {
  gridWidth: number
  removeBackground: boolean
  showGridLines: boolean
  showColorCodes: boolean
  cellSize: number
  maxColors: number
}
