import { useEffect, useRef, useState } from 'react'

export function ExportDialog({ canvas, filename, onClose }: { canvas: HTMLCanvasElement; filename: string; onClose: () => void }) {
  const [file, setFile] = useState<File | null>(null)
  const [url, setUrl] = useState('')
  const [error, setError] = useState('')
  const closeRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    let cancelled = false
    let objectUrl = ''
    const previouslyFocused = document.activeElement as HTMLElement | null
    closeRef.current?.focus()
    canvas.toBlob(blob => {
      if (cancelled) return
      if (!blob) { setError('图片太大，无法导出。请降低图纸宽度后重试。'); return }
      objectUrl = URL.createObjectURL(blob)
      setFile(new File([blob], filename, { type: 'image/png' }))
      setUrl(objectUrl)
    }, 'image/png')
    return () => { cancelled = true; if (objectUrl) URL.revokeObjectURL(objectUrl); previouslyFocused?.focus() }
  }, [canvas, filename])
  const share = async () => {
    if (!file) return
    try { await navigator.share({ files: [file], title: '拼豆图纸' }) }
    catch (err) { if (!(err instanceof Error && err.name === 'AbortError')) setError('未能分享，请使用下载按钮，或长按下方图片保存。') }
  }
  return <div role="dialog" aria-modal="true" aria-label="保存图纸" className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-3" onKeyDown={event => { if (event.key === 'Escape') { event.stopPropagation(); onClose() } }}>
    <div className="flex max-h-[94dvh] w-full max-w-3xl flex-col rounded-2xl bg-white p-4">
      <div className="flex items-center justify-between gap-3"><h2 className="font-semibold">保存图纸</h2><button ref={closeRef} onClick={onClose} className="rounded-lg px-4 py-2">关闭</button></div>
      <p className="my-3 text-sm text-slate-600">手机可长按图片保存，或点击分享选择存储位置。</p>
      {error && <p role="alert" className="mb-3 text-sm text-red-600">{error}</p>}
      {!file && !error && <p role="status">正在生成 PNG…</p>}
      <div className="mb-3 flex flex-wrap gap-3">
        {url && <a href={url} download={filename} className="rounded-lg bg-emerald-600 px-4 py-3 text-sm text-white">下载 PNG</a>}
        {file && navigator.canShare?.({ files: [file] }) && <button onClick={share} className="rounded-lg bg-indigo-600 px-4 py-3 text-sm text-white">分享 / 保存到手机</button>}
      </div>
      <div className="min-h-0 overflow-auto">{url && <img src={url} alt="可长按保存的完整拼豆图纸及色号统计" className="mx-auto h-auto max-w-full" />}</div>
    </div>
  </div>
}
