import { getPresetById, type PatternPreset } from './presets'

export interface ImageAnalysis {
  imageWidth: number
  imageHeight: number
  estimatedColors: number
  hasSimpleBackground: boolean
  presetId: string
  gridWidth: number
  maxColors: number
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

function samplePixel(
  data: Uint8ClampedArray,
  width: number,
  x: number,
  y: number,
): [number, number, number] {
  const i = (y * width + x) * 4
  return [data[i], data[i + 1], data[i + 2]]
}

function colorDistance(a: [number, number, number], b: [number, number, number]): number {
  return Math.sqrt(
    (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2,
  )
}

function pickPresetBySize(maxDim: number, estimatedColors: number): PatternPreset {
  let presetId: string

  // ===== 修改点 1：小图用更少颜色 =====
  if (maxDim <= 200) presetId = 'tiny'
  else if (maxDim <= 400) presetId = 'mini'
  else if (maxDim <= 800) presetId = 'simple'
  else if (maxDim <= 1500) presetId = 'standard'
  else presetId = 'large'

  // ===== 修改点 2：基于实际颜色数选择，不强行增加 =====
  if (estimatedColors <= 8) presetId = 'tiny'
  else if (estimatedColors <= 15) presetId = 'mini'
  else if (estimatedColors <= 25) presetId = 'simple'

  return getPresetById(presetId) ?? getPresetById('default')!
}

// ===== 修改点 3：简化颜色数量逻辑，用图片实际颜色数 =====
function adjustMaxColors(base: number, estimatedColors: number): number {
  // 直接基于图片实际颜色数，不强行增加
  if (estimatedColors <= 6) return Math.min(base, 6)
  if (estimatedColors <= 10) return Math.min(base, 10)
  if (estimatedColors <= 15) return Math.min(base, 15)
  if (estimatedColors <= 25) return Math.min(base, 25)
  // 大图复杂图片才用更多颜色
  return Math.min(base, 35)
}



export async function analyzeImage(source: string): Promise<ImageAnalysis> {
  const img = await loadImage(source)
  const sampleW = 96
  const sampleH = Math.max(1, Math.round((img.height / img.width) * sampleW))

  const canvas = document.createElement('canvas')
  canvas.width = sampleW
  canvas.height = sampleH
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0, sampleW, sampleH)
  const { data, width, height } = ctx.getImageData(0, 0, sampleW, sampleH)

  const buckets = new Set<string>()
  for (let i = 0; i < data.length; i += 16) {
    const r = data[i] >> 3
    const g = data[i + 1] >> 3
    const b = data[i + 2] >> 3
    buckets.add(`${r},${g},${b}`)
  }
  const estimatedColors = buckets.size

  const corners: [number, number, number][] = [
    samplePixel(data, width, 0, 0),
    samplePixel(data, width, width - 1, 0),
    samplePixel(data, width, 0, height - 1),
    samplePixel(data, width, width - 1, height - 1),
  ]
  const avgCorner = corners.reduce(
    (acc, c) => [acc[0] + c[0], acc[1] + c[1], acc[2] + c[2]] as [number, number, number],
    [0, 0, 0],
  ).map((v) => v / 4) as [number, number, number]
  const hasSimpleBackground = corners.every((c) => colorDistance(c, avgCorner) < 35)

  const maxDim = Math.max(img.width, img.height)
  const preset = pickPresetBySize(maxDim, estimatedColors)
  
  // ===== 修改点 4：网格宽度根据图片实际大小调整 =====
  let gridWidth = Math.min(
    Math.max(15, Math.round(maxDim / 12)),
    60
  )
  
  // 小挂件用更小网格
  if (maxDim <= 300) gridWidth = Math.min(25, Math.max(10, Math.round(maxDim / 15)))
  
  const maxColors = adjustMaxColors(preset.maxColors, estimatedColors)

  return {
    imageWidth: img.width,
    imageHeight: img.height,
    estimatedColors,
    hasSimpleBackground,
    presetId: preset.id,
    gridWidth,
    maxColors,
  }
}
