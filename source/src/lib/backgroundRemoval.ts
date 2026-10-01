import { resolveModelPublicPath } from './modelStatus'
import { runCutoutWorker } from './cutoutClient'
export async function removeImageBackground(source: string | Blob, onProgress?: (progress: number) => void): Promise<Blob> {
  let blob = source instanceof Blob ? source : await (await fetch(source)).blob()
  const bitmap = await createImageBitmap(blob)
  try {
    const scale = Math.min(1, 1280 / Math.max(bitmap.width, bitmap.height))
    if (scale < 1) {
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(bitmap.width * scale))
      canvas.height = Math.max(1, Math.round(bitmap.height * scale))
      canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
      blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('图片缩小失败')), 'image/png'))
    }
  } finally { bitmap.close() }
  const result = await runCutoutWorker('remove', resolveModelPublicPath(), blob, onProgress)
  if (!(result instanceof Blob)) throw new Error('AI 抠图未返回图片，请重试。')
  return result
}
export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result as string); reader.onerror = reject; reader.readAsDataURL(blob) })
}
