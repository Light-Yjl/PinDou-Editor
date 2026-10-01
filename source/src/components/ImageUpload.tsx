import { useCallback, useRef, useState } from 'react'
import { useI18n } from '../i18n/LanguageProvider'

interface ImageUploadProps {
  onImageSelect: (file: File, previewUrl: string) => void
  disabled?: boolean
}

export function ImageUpload({ onImageSelect, disabled }: ImageUploadProps) {
  const { t } = useI18n()
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState('')

  const handleFile = useCallback(
    (file: File) => {
      setError('')
      if (!file.type.startsWith('image/')) { setError('请选择 JPG、PNG 或 WebP 图片。'); return }
      if (file.size > 25 * 1024 * 1024) { setError('图片超过 25 MB，请缩小后重试。'); return }
      const url = URL.createObjectURL(file)
      onImageSelect(file, url)
    },
    [onImageSelect],
  )

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      if (disabled) return
      const file = e.dataTransfer.files[0]
      if (file) handleFile(file)
    },
    [disabled, handleFile],
  )

  return (
    <div
      className={`relative rounded-2xl border-2 border-dashed transition-colors ${
        disabled
          ? 'border-slate-200 bg-slate-50 cursor-not-allowed'
          : 'border-indigo-200 bg-white hover:border-indigo-400 hover:bg-indigo-50/30 cursor-pointer'
      }`}
      onClick={() => !disabled && inputRef.current?.click()}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label="上传图片"
      onKeyDown={e => { if (!disabled && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); inputRef.current?.click() } }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        disabled={disabled}
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
        }}
      />
      <div className="flex flex-col items-center justify-center gap-3 px-6 py-12">
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100 text-2xl">
          📷
        </div>
        <div className="text-center">
          <p className="text-base font-medium text-slate-700">{t.upload.title}</p>
          <p className="mt-1 text-sm text-slate-400">{t.upload.hint}</p>
        </div>
      </div>
    </div>
  )
}
