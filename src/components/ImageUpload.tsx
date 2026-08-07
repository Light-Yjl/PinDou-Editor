import { useCallback, useRef } from 'react'
import { useI18n } from '../i18n/LanguageProvider'

interface ImageUploadProps {
  onImageSelect: (file: File, previewUrl: string) => void
  disabled?: boolean
}

export function ImageUpload({ onImageSelect, disabled }: ImageUploadProps) {
  const { t } = useI18n()
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith('image/')) return
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
