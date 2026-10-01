let worker: Worker | null = null
let prepared = false
let busy = false
export const isCutoutPrepared = () => prepared
export async function runCutoutWorker(action: 'prepare' | 'remove', publicPath: string, blob?: Blob, progress?: (value: number) => void): Promise<Blob | undefined> {
  if (busy) throw new Error('AI 正在处理中，请稍候。')
  busy = true
  try {
    worker ??= new Worker(new URL('./cutout.worker.ts', import.meta.url), { type: 'module' })
    const active = worker
    return await new Promise((resolve, reject) => {
      const fail = (message: string) => { clearTimeout(timer); active.terminate(); worker = null; prepared = false; reject(new Error(message)) }
      const timer = setTimeout(() => fail('AI 处理超时。请重试，或关闭自动抠图后生成图纸。'), 180000)
      active.onerror = () => fail('此浏览器未能运行 AI 抠图。请使用最新版系统浏览器，或关闭自动抠图。')
      active.onmessage = ({ data }) => {
        if (data.type === 'progress') { progress?.(data.value); return }
        if (data.type === 'error') { fail(data.message); return }
        clearTimeout(timer); prepared = true; resolve(data.blob)
      }
      active.postMessage({ action, publicPath, blob })
    })
  } finally { busy = false }
}
