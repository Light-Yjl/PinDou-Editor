import { preload, removeBackground } from '@imgly/background-removal'
self.onmessage = async ({ data }) => {
  try {
    const config = {
      publicPath: data.publicPath as string, model: 'isnet_quint8' as const,
      device: 'cpu' as const, proxyToWorker: false,
      fetchArgs: { cache: 'force-cache' as RequestCache },
      progress: (_key: string, current: number, total: number) => {
        if (total > 0) self.postMessage({ type: 'progress', value: Math.round(current / total * 100) })
      },
    }
    if (data.action === 'prepare') { await preload(config); self.postMessage({ type: 'done' }) }
    else { const blob = await removeBackground(data.blob as Blob, config); self.postMessage({ type: 'done', blob }) }
  } catch (error) {
    self.postMessage({ type: 'error', message: 'AI 抠图失败，请检查网络或关闭自动抠图后继续。' + (error instanceof Error ? ` (${error.message})` : '') })
  }
}
