interface PindouBridge {
  checkBgModels: () => Promise<boolean>
  downloadBgModels: () => Promise<boolean>
}

declare global {
  interface Window {
    pindou?: PindouBridge
  }
}

export {}
