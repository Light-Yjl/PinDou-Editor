import { preload, removeBackground } from '@imgly/background-removal'
import { checkModelsReady, resolveModelPublicPath } from './modelStatus'

type ModelId = 'isnet_fp16' | 'isnet_quint8'

function getConfig(
  publicPath: string,
  model: ModelId,
  onProgress?: (progress: number) => void,
) {
  return {
    publicPath,
    model,
    device: 'cpu' as const,
    proxyToWorker: false,
    fetchArgs: { cache: 'force-cache' as RequestCache },
    progress: (_key: string, current: number, total: number) => {
      if (onProgress && total > 0) {
        onProgress(Math.round((current / total) * 100))
      }
    },
  }
}

async function requireLocalModels(): Promise<string> {
  if (await checkModelsReady()) return resolveModelPublicPath()
  throw new Error('MODELS_NOT_READY')
}

async function toBlob(source: string | Blob): Promise<Blob> {
  if (source instanceof Blob) return source
  const res = await fetch(source)
  return res.blob()
}

/** Downscale large photos to reduce WASM memory pressure during cutout */
async function prepareImageForCutout(source: string | Blob, maxSide = 1280): Promise<Blob> {
  const blob = await toBlob(source)
  const bitmap = await createImageBitmap(blob)
  const longest = Math.max(bitmap.width, bitmap.height)

  if (longest <= maxSide) return blob

  const scale = maxSide / longest
  const width = Math.max(1, Math.round(bitmap.width * scale))
  const height = Math.max(1, Math.round(bitmap.height * scale))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return blob

  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (result) => (result ? resolve(result) : reject(new Error('IMAGE_RESIZE_FAILED'))),
      'image/png',
    )
  })
}

const MODEL_FALLBACKS: ModelId[] = ['isnet_fp16', 'isnet_quint8']

export async function removeImageBackground(
  imageSource: string | Blob,
  onProgress?: (progress: number) => void,
): Promise<Blob> {
  const publicPath = await requireLocalModels()
  const prepared = await prepareImageForCutout(imageSource)

  let lastError: unknown = null

  for (const model of MODEL_FALLBACKS) {
    try {
      const config = getConfig(publicPath, model, onProgress)
      await preload(config)
      return await removeBackground(prepared, config)
    } catch (err) {
      lastError = err
      console.warn(`[PinDou Studio] Cutout failed with ${model}:`, err)
    }
  }

  throw lastError instanceof Error ? lastError : new Error('CUTOUT_FAILED')
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}
