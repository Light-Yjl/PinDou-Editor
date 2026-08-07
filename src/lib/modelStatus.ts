const LOCAL_MODEL_PATH = `${import.meta.env.BASE_URL}bg-removal/`

export function resolveModelPublicPath(): string {
  return new URL('bg-removal/', window.location.href).href
}

async function isLocalModelsReady(): Promise<boolean> {
  const publicPath = resolveModelPublicPath()
  try {
    const res = await fetch(new URL('resources.json', publicPath))
    if (!res.ok) return false

    const resources = (await res.json()) as Record<
      string,
      { chunks: Array<{ name: string }> }
    >
    const chunkNames = new Set<string>()
    for (const entry of Object.values(resources)) {
      for (const chunk of entry.chunks) {
        chunkNames.add(chunk.name)
      }
    }

    const checks = await Promise.all(
      [...chunkNames].slice(0, 3).map(async (name) => {
        const chunkRes = await fetch(new URL(name, publicPath), { method: 'HEAD' })
        return chunkRes.ok
      }),
    )
    return checks.every(Boolean)
  } catch {
    return false
  }
}

export function canDownloadModelsInApp(): boolean {
  return typeof window.pindou?.downloadBgModels === 'function'
}

export async function checkModelsReady(): Promise<boolean> {
  if (window.pindou) {
    const onDisk = await window.pindou.checkBgModels()
    if (!onDisk) return false
  }
  return isLocalModelsReady()
}

export async function downloadModels(): Promise<void> {
  if (!window.pindou) {
    throw new Error('MODEL_DOWNLOAD_DESKTOP_ONLY')
  }

  const already = await window.pindou.checkBgModels()
  if (already) return

  await window.pindou.downloadBgModels()

  if (!(await checkModelsReady())) {
    throw new Error('MODEL_DOWNLOAD_INCOMPLETE')
  }
}

export { LOCAL_MODEL_PATH }
