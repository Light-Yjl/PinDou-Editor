const { app, BrowserWindow, dialog, ipcMain, session } = require('electron')
const { spawn } = require('child_process')
const path = require('path')
const fs = require('fs')
const http = require('http')

const ROOT = path.join(__dirname, '..')
const DIST_INDEX = path.join(ROOT, 'dist', 'index.html')
const LOG_FILE = path.join(ROOT, 'startup.log')
const VITE_BIN = path.join(ROOT, 'node_modules', 'vite', 'bin', 'vite.js')
const DOWNLOAD_SCRIPT = path.join(ROOT, 'scripts', 'download-models.mjs')
const MODEL_MARKER = path.join(ROOT, 'public', 'bg-removal', 'resources.json')
const USE_BUILT = fs.existsSync(DIST_INDEX) && process.env.ELECTRON_DEV !== '1'

let serverProcess = null
let mainWindow = null

app.setPath('userData', path.join(ROOT, '.electron-user-data'))

function log(message) {
  const line = `[${new Date().toISOString()}] ${message}\n`
  try {
    fs.appendFileSync(LOG_FILE, line)
  } catch {
    // ignore log write errors
  }
  console.log(message)
}

function showFatalError(title, message) {
  log(`FATAL: ${title} - ${message}`)
  dialog.showErrorBox(title, message)
}

function waitForServer(url, timeout = 60000) {
  return new Promise((resolve, reject) => {
    const start = Date.now()

    const check = () => {
      const req = http.get(url, (res) => {
        if (res.statusCode && res.statusCode < 500) resolve()
        else retry()
      })
      req.on('error', retry)
      req.setTimeout(2000, () => {
        req.destroy()
        retry()
      })
    }

    const retry = () => {
      if (Date.now() - start > timeout) {
        reject(new Error(`Server timeout: ${url}`))
        return
      }
      setTimeout(check, 500)
    }

    check()
  })
}

function waitForPortFree(port, timeout = 10000) {
  const url = `http://127.0.0.1:${port}`
  return new Promise((resolve, reject) => {
    const start = Date.now()

    const check = () => {
      const req = http.get(url, () => {
        if (Date.now() - start > timeout) {
          reject(new Error(`Port ${port} still in use`))
          return
        }
        setTimeout(check, 400)
      })
      req.on('error', () => resolve())
      req.setTimeout(1500, () => {
        req.destroy()
        resolve()
      })
    }

    check()
  })
}

function killPort(port) {
  if (process.platform !== 'win32') return

  try {
    const { execSync } = require('child_process')
    const output = execSync(`netstat -ano | findstr "127.0.0.1:${port}" | findstr LISTENING`, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    })

    const pids = new Set()
    for (const line of output.split('\n')) {
      const parts = line.trim().split(/\s+/)
      const pid = parts[parts.length - 1]
      if (pid && /^\d+$/.test(pid) && pid !== '0') pids.add(pid)
    }

    for (const pid of pids) {
      log(`Killing process ${pid} on port ${port}`)
      try {
        execSync(`taskkill /F /PID ${pid} /T`, { stdio: 'ignore' })
      } catch {
        // process may already be gone
      }
    }
  } catch {
    // no process on port
  }
}

function spawnVite(args) {
  if (!fs.existsSync(VITE_BIN)) {
    throw new Error('vite not found. Run: npm install')
  }

  log(`Starting: node vite ${args.join(' ')}`)

  const child = spawn(process.execPath, [VITE_BIN, ...args], {
    cwd: ROOT,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: process.env,
    windowsHide: true,
  })

  child.stdout.on('data', (data) => log(String(data).trim()))
  child.stderr.on('data', (data) => log(String(data).trim()))
  child.on('error', (err) => log(`Spawn error: ${err.message}`))

  return child
}

async function startLocalServer() {
  const port = USE_BUILT ? 4173 : 5173
  const url = `http://127.0.0.1:${port}`

  killPort(port)
  await waitForPortFree(port)

  const args = USE_BUILT
    ? ['preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort']
    : ['--host', '127.0.0.1', '--port', String(port), '--strictPort']

  serverProcess = spawnVite(args)

  serverProcess.on('exit', (code) => {
    if (code && code !== 0) {
      log(`Vite exited with code ${code}`)
    }
  })

  await waitForServer(url)
  log(`Server ready: ${url}`)
  return url
}

function syncModelsToDist() {
  const primaryDir = path.join(ROOT, 'public', 'bg-removal')
  const distDir = path.join(ROOT, 'dist', 'bg-removal')
  const marker = path.join(primaryDir, 'resources.json')

  if (!fs.existsSync(marker) || !fs.existsSync(path.join(ROOT, 'dist'))) return

  const countModelFiles = (dir) => {
    if (!fs.existsSync(dir)) return 0
    return fs.readdirSync(dir).filter((name) => name !== 'README.md' && name !== '.gitkeep').length
  }

  const srcCount = countModelFiles(primaryDir)
  const dstCount = countModelFiles(distDir)

  if (srcCount === dstCount && fs.existsSync(path.join(distDir, 'resources.json'))) {
    log(`Models already synced (${srcCount} files)`)
    return
  }

  fs.mkdirSync(distDir, { recursive: true })
  fs.cpSync(primaryDir, distDir, { recursive: true, force: true })
  log(`Models synced to dist/bg-removal/ (${srcCount} files)`)
}

function enableCrossOriginIsolation() {
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    if (!details.url.startsWith('http://127.0.0.1:')) {
      callback({ responseHeaders: details.responseHeaders })
      return
    }

    const headers = { ...details.responseHeaders }
    headers['Cross-Origin-Opener-Policy'] = ['same-origin']
    headers['Cross-Origin-Embedder-Policy'] = ['credentialless']
    headers['Cross-Origin-Resource-Policy'] = ['same-origin']
    callback({ responseHeaders: headers })
  })
}

function createWindow(url) {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 960,
    minHeight: 640,
    title: 'PinDou Studio',
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
  })

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.loadURL(url).catch((err) => {
    showFatalError('Load failed', err.message)
    app.quit()
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

function cleanupServer() {
  if (!serverProcess || serverProcess.killed) return

  log('Stopping local server...')

  if (process.platform === 'win32') {
    spawn('taskkill', ['/pid', String(serverProcess.pid), '/f', '/t'], {
      shell: true,
      stdio: 'ignore',
      windowsHide: true,
    })
  } else {
    serverProcess.kill('SIGTERM')
  }

  serverProcess = null
}

const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  log('Another instance is already running, exiting.')
  app.quit()
  process.exit(0)
} else {
  ipcMain.handle('bg-models:check', () => {
    return fs.existsSync(MODEL_MARKER)
  })

  ipcMain.handle('bg-models:download', () => {
    return new Promise((resolve, reject) => {
      log('Downloading AI background removal models...')
      const child = spawn('node', [DOWNLOAD_SCRIPT], {
        cwd: ROOT,
        stdio: ['ignore', 'pipe', 'pipe'],
        windowsHide: true,
        shell: process.platform === 'win32',
        env: process.env,
      })

      child.stdout.on('data', (data) => log(String(data).trim()))
      child.stderr.on('data', (data) => log(String(data).trim()))
      child.on('error', reject)
      child.on('close', (code) => {
        if (code === 0) {
          syncModelsToDist()
          resolve(true)
        } else reject(new Error(`Model download failed (code ${code})`))
      })
    })
  })

  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })

  app.whenReady().then(async () => {
    try {
      log('App starting...')
      enableCrossOriginIsolation()
      syncModelsToDist()
      if (USE_BUILT && !fs.existsSync(DIST_INDEX)) {
        throw new Error('dist/index.html not found. Run: npm run build')
      }
      const url = await startLocalServer()
      createWindow(url)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      showFatalError(
        'Startup failed',
        `${msg}\n\nCheck startup.log in the project folder.`,
      )
      app.quit()
      process.exit(1)
    }
  })

  app.on('window-all-closed', () => {
    cleanupServer()
    app.quit()
  })

  app.on('before-quit', () => {
    cleanupServer()
  })
}
