const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('pindou', {
  checkBgModels: () => ipcRenderer.invoke('bg-models:check'),
  downloadBgModels: () => ipcRenderer.invoke('bg-models:download'),
})
