import type { PatternResult, PatternCell } from '../types'

/**
 * 水平镜像拼豆图纸
 */
export function mirrorPattern(pattern: PatternResult): PatternResult {
  const { width, height, cells, colorCounts, totalBeads } = pattern

  // 水平翻转每个格子
  const mirroredCells: PatternCell[][] = cells.map((row) =>
    [...row].reverse().map((cell) => ({
      ...cell,
      x: width - 1 - cell.x, // 更新 x 坐标
    }))
  )

  // 颜色统计不变（只是位置变化，颜色数量不变）
  return {
    width,
    height,
    cells: mirroredCells,
    colorCounts: new Map(colorCounts),
    totalBeads,
  }
}

/**
 * 垂直镜像拼豆图纸
 */
export function mirrorPatternVertical(pattern: PatternResult): PatternResult {
  const { width, height, cells, colorCounts, totalBeads } = pattern

  // 垂直翻转每行
  const mirroredCells: PatternCell[][] = [...cells]
    .reverse()
    .map((row) =>
      row.map((cell) => ({
        ...cell,
        y: height - 1 - cell.y, // 更新 y 坐标
      }))
    )

  return {
    width,
    height,
    cells: mirroredCells,
    colorCounts: new Map(colorCounts),
    totalBeads,
  }
}

/**
 * 旋转 90 度
 */
export function rotatePattern(pattern: PatternResult): PatternResult {
  const { width, height, cells, colorCounts, totalBeads } = pattern

  const newWidth = height
  const newHeight = width
  const newCells: PatternCell[][] = []

  for (let y = 0; y < newHeight; y++) {
    newCells[y] = []
    for (let x = 0; x < newWidth; x++) {
      const originalX = y
      const originalY = width - 1 - x
      const originalCell = cells[originalY]?.[originalX]
      newCells[y][x] = {
        ...originalCell,
        x,
        y,
        color: originalCell?.color ?? null,
      }
    }
  }

  return {
    width: newWidth,
    height: newHeight,
    cells: newCells,
    colorCounts: new Map(colorCounts),
    totalBeads,
  }
}