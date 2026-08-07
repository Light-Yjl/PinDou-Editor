import type { PatternResult, PatternCell, BeadColor } from '../types'

/**
 * 洪水填充算法 - 填充相连的同色区域
 * @param pattern 当前图案
 * @param startX 起始 X 坐标
 * @param startY 起始 Y 坐标
 * @param targetColor 要替换的目标颜色（null 表示填充空白区域）
 * @param fillColor 要填充的颜色
 * @returns 填充后的新图案
 */
export function floodFill(
  pattern: PatternResult,
  startX: number,
  startY: number,
  targetColor: BeadColor | null,
  fillColor: BeadColor
): PatternResult {
  const { width, height, cells, colorCounts } = pattern

  // 如果起始位置的颜色就是填充颜色，不需要填充
  const startCell = cells[startY]?.[startX]
  if (!startCell) return pattern
  
  const startColor = startCell.color
  
  // 如果目标颜色和填充颜色相同，不需要填充
  if (targetColor && fillColor.id === targetColor.id) {
    return pattern
  }
  // 如果填充空白区域，但起始格子有颜色，不需要填充
  if (!targetColor && startColor !== null) {
    return pattern
  }
  // 如果填充颜色区域，但起始格子是空的，不需要填充
  if (targetColor && startColor === null) {
    return pattern
  }

  // 深拷贝 cells
  const newCells: PatternCell[][] = cells.map(row =>
    row.map(cell => ({
      ...cell,
      color: cell.color ? { ...cell.color } : null,
    }))
  )

  // BFS 队列
  const queue: { x: number; y: number }[] = [{ x: startX, y: startY }]
  const visited = new Set<string>()
  const fillPositions: { x: number; y: number }[] = []

  while (queue.length > 0) {
    const { x, y } = queue.shift()!
    const key = `${x},${y}`
    
    if (visited.has(key)) continue
    visited.add(key)

    const cell = newCells[y]?.[x]
    if (!cell) continue

    // 检查颜色是否匹配
    const cellColor = cell.color
    if (targetColor === null) {
      // 填充空白区域
      if (cellColor !== null) continue
    } else {
      // 填充颜色区域
      if (!cellColor || cellColor.id !== targetColor.id) continue
    }

    // 记录需要填充的位置
    fillPositions.push({ x, y })

    // 四个方向
    const directions = [
      { dx: 0, dy: -1 }, // 上
      { dx: 0, dy: 1 },  // 下
      { dx: -1, dy: 0 }, // 左
      { dx: 1, dy: 0 },  // 右
    ]

    for (const { dx, dy } of directions) {
      const nx = x + dx
      const ny = y + dy
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        const nKey = `${nx},${ny}`
        if (!visited.has(nKey)) {
          queue.push({ x: nx, y: ny })
        }
      }
    }
  }

  // 如果没有需要填充的位置，返回原图案
  if (fillPositions.length === 0) {
    return pattern
  }

  // 计算新的颜色统计
  const newColorCounts = new Map(colorCounts)

  // 如果是填充空白区域，直接添加新颜色计数
  if (targetColor === null) {
    // 减少空白区域数量（不需要记录，因为空白不计入 colorCounts）
    // 增加填充颜色的数量
    const existing = newColorCounts.get(fillColor.id)
    if (existing) {
      existing.count += fillPositions.length
    } else {
      newColorCounts.set(fillColor.id, {
        color: fillColor,
        count: fillPositions.length,
      })
    }
  } else {
    // 减少目标颜色的数量
    const targetExisting = newColorCounts.get(targetColor.id)
    if (targetExisting) {
      targetExisting.count -= fillPositions.length
      if (targetExisting.count <= 0) {
        newColorCounts.delete(targetColor.id)
      }
    }

    // 增加填充颜色的数量
    const fillExisting = newColorCounts.get(fillColor.id)
    if (fillExisting) {
      fillExisting.count += fillPositions.length
    } else {
      newColorCounts.set(fillColor.id, {
        color: fillColor,
        count: fillPositions.length,
      })
    }
  }

  // 填充颜色
  for (const { x, y } of fillPositions) {
    newCells[y][x] = {
      ...newCells[y][x],
      color: { ...fillColor },
    }
  }

  // 计算新的总珠数
  let newTotalBeads = 0
  for (const [, value] of newColorCounts) {
    newTotalBeads += value.count
  }

  return {
    width,
    height,
    cells: newCells,
    colorCounts: newColorCounts,
    totalBeads: newTotalBeads,
  }
}