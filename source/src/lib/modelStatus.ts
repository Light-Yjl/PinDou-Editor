import { runCutoutWorker, isCutoutPrepared } from './cutoutClient'
export function resolveModelPublicPath(): string { return new URL(`${import.meta.env.BASE_URL}bg-removal/`, document.baseURI).href }
export function canDownloadModelsInApp(): boolean { return typeof Worker !== 'undefined' && typeof WebAssembly !== 'undefined' && typeof OffscreenCanvas !== 'undefined' }
export async function checkModelsReady(): Promise<boolean> { return isCutoutPrepared() }
export async function downloadModels(): Promise<void> { await runCutoutWorker('prepare', resolveModelPublicPath()) }
