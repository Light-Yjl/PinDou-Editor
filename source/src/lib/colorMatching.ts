import type { BeadColor } from '../types'

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ]
}

function rgbToLab(r: number, g: number, b: number): [number, number, number] {
  let rr = r / 255
  let gg = g / 255
  let bb = b / 255

  rr = rr > 0.04045 ? Math.pow((rr + 0.055) / 1.055, 2.4) : rr / 12.92
  gg = gg > 0.04045 ? Math.pow((gg + 0.055) / 1.055, 2.4) : gg / 12.92
  bb = bb > 0.04045 ? Math.pow((bb + 0.055) / 1.055, 2.4) : bb / 12.92

  let x = (rr * 0.4124 + gg * 0.3576 + bb * 0.1805) / 0.95047
  let y = (rr * 0.2126 + gg * 0.7152 + bb * 0.0722) / 1.0
  let z = (rr * 0.0193 + gg * 0.1192 + bb * 0.9505) / 1.08883

  x = x > 0.008856 ? Math.pow(x, 1 / 3) : 7.787 * x + 16 / 116
  y = y > 0.008856 ? Math.pow(y, 1 / 3) : 7.787 * y + 16 / 116
  z = z > 0.008856 ? Math.pow(z, 1 / 3) : 7.787 * z + 16 / 116

  return [116 * y - 16, 500 * (x - y), 200 * (y - z)]
}

function deltaE(lab1: [number, number, number], lab2: [number, number, number]): number {
  const dL = lab1[0] - lab2[0]
  const da = lab1[1] - lab2[1]
  const db = lab1[2] - lab2[2]
  return Math.sqrt(dL * dL + da * da + db * db)
}

const labCache = new Map<string, [number, number, number]>()

function getLab(hex: string): [number, number, number] {
  let lab = labCache.get(hex)
  if (!lab) {
    const [r, g, b] = hexToRgb(hex)
    lab = rgbToLab(r, g, b)
    labCache.set(hex, lab)
  }
  return lab
}

export function findNearestColor(
  r: number,
  g: number,
  b: number,
  palette: BeadColor[],
): BeadColor {
  const targetLab = rgbToLab(r, g, b)
  let best = palette[0]
  let bestDist = Infinity

  for (const color of palette) {
    const dist = deltaE(targetLab, getLab(color.hex))
    if (dist < bestDist) {
      bestDist = dist
      best = color
    }
  }

  return best
}

/** 将使用频率较低的颜色合并到最近的主色 */
export function reducePaletteUsage(
  cells: BeadColor[][],
  maxColors: number,
  excludedColors: string[] = [],
): BeadColor[][] {
  const counts = new Map<string, number>()
  for (const row of cells) {
    for (const color of row) {
      counts.set(color.id, (counts.get(color.id) ?? 0) + 1)
    }
  }

  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1])
  const filteredSorted =
  sorted.filter(([id])=>{

    const color =
      cells
      .flat()
      .find(c=>c.id===id)

    if(!color)
      return false


    return !excludedColors.includes(
      color.hex
    )

  })
  if (filteredSorted.length <= maxColors)
  return cells

  const keepIds =
  new Set(
    filteredSorted
      .slice(0,maxColors)
      .map(([id])=>id)
  )
  const palette = filteredSorted.map(([id]) => {
    const cell = cells.flat().find((c) => c.id === id)!
    return cell
  })

  return cells.map((row) =>
    row.map((color) => {
      if (keepIds.has(color.id)) return color
      const [r, g, b] = hexToRgb(color.hex)
      const kept = palette.filter((c) => keepIds.has(c.id))
      return findNearestColor(r, g, b, kept)
    }),
  )
}

export function removeColorsFromCells(
  cells: BeadColor[][],
  excludedColors:string[]
): BeadColor[][] {


  const remainColors = [
    ...new Map(
      cells
      .flat()
      .filter(
        c =>
          !excludedColors.includes(
            c.hex
          )
      )
      .map(
        c=>[
          c.id,
          c
        ]
      )
    ).values()
  ]


  return cells.map(row=>

    row.map(color=>{


      if(
        excludedColors.includes(
          color.hex
        )
      ){

        const [r,g,b]=hexToRgb(
          color.hex
        )


        return findNearestColor(
          r,
          g,
          b,
          remainColors
        )

      }


      return color

    })

  )

}