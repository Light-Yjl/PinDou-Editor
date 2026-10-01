import { getFilteredPalette } from './colorPalette'
import { findNearestColor, reducePaletteUsage } from './colorMatching'
import type { BeadColor, PatternResult } from '../types'

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()

    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

export async function generatePattern(
  imageSrc: string,
  gridWidth: number,
  maxColors: number,
  excludedColors: string[] = [],
): Promise<PatternResult> {

  const img = await loadImage(imageSrc)
  // 根据用户删除的颜色过滤色板
  const palette =
    getFilteredPalette(excludedColors)
  const aspectRatio =
    img.height / img.width
  const gridHeight =
    Math.max(
      1,
      Math.round(gridWidth * aspectRatio)
    )

  if (gridHeight > 300) throw new Error('图片过长，请先裁剪图片或降低图纸宽度（高度上限 300 格）。')

  const canvas =
    document.createElement('canvas')
  canvas.width = gridWidth
  canvas.height = gridHeight

  const ctx =
    canvas.getContext('2d')!

  ctx.drawImage(
    img,
    0,
    0,
    gridWidth,
    gridHeight
  )

  const imageData =
    ctx.getImageData(
      0,
      0,
      gridWidth,
      gridHeight
    )

  const rawColors: BeadColor[][] = []
  const cells: PatternResult['cells'] = []

  for(
    let y = 0;
    y < gridHeight;
    y++
  ){
    const colorRow: BeadColor[] = []
    const cellRow: PatternResult['cells'][number] = []

    for(
      let x = 0;
      x < gridWidth;
      x++
    ){
      const i =
        (y * gridWidth + x) * 4
      const r =
        imageData.data[i]
      const g =
        imageData.data[i + 1]
      const b =
        imageData.data[i + 2]
      const a =
        imageData.data[i + 3]


      // 透明区域
      if(a < 128){

        colorRow.push(
          palette[0]
        )

        cellRow.push({
          color:null,
          x,
          y
        })


      }else{

        const matched =
          findNearestColor(
            r,
            g,
            b,
            palette
          )

        colorRow.push(
          matched
        )

        cellRow.push({
          color:matched,
          x,
          y
        })

      }

    }

    rawColors.push(
      colorRow
    )

    cells.push(
      cellRow
    )

  }

  // 限制最终使用颜色数量
  const reduced =
    reducePaletteUsage(
      rawColors,
      maxColors,
      excludedColors
    )

  for(
    let y = 0;
    y < gridHeight;
    y++
  ){

    for(
      let x = 0;
      x < gridWidth;
      x++
    ){

      const cell =
        cells[y][x]

      if(cell.color !== null){
        cell.color =
          reduced[y][x]
      }
    }
  }

  const colorCounts =
    new Map<
      string,
      {
        color:BeadColor
        count:number
      }
    >()

  let totalBeads = 0

  for(const row of cells){

    for(const cell of row){

      if(cell.color){
        totalBeads++

        const existing =
          colorCounts.get(
            cell.color.id
          )

        if(existing){
          existing.count++
        }else{
          colorCounts.set(
            cell.color.id,
            {
              color:cell.color,
              count:1
            }
          )
        }
      }
    }
  }
  return {
    width:gridWidth,
    height:gridHeight,
    cells,
    colorCounts,
    totalBeads

  }

}
