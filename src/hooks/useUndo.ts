import { useState, useCallback, useRef } from 'react'

interface UseUndoOptions {
  maxHistory?: number
}

export function useUndo<T>(
  initialState: T,
  options: UseUndoOptions = {}
) {
  const { maxHistory = 50 } = options

  const [history, setHistory] = useState<T[]>([initialState])
  const [currentIndex, setCurrentIndex] = useState(0)
  const isUndoRedoRef = useRef(false)
  
  const [isBatchMode, setIsBatchMode] = useState(false)
  // 使用 ref 存储批量开始时的状态
  const batchStartStateRef = useRef<T | null>(null)
  // 使用 ref 存储批量过程中是否有变化
  const batchHasChangeRef = useRef(false)

  const currentState = history[currentIndex]

  const setState = useCallback(
    (newState: T | ((prev: T) => T)) => {
      if (isUndoRedoRef.current) {
        const next = typeof newState === 'function' 
          ? (newState as (prev: T) => T)(currentState)
          : newState
        const newHistory = [...history]
        newHistory[currentIndex] = next
        setHistory(newHistory)
        return
      }

      // 批量模式：只更新当前状态，不记录历史
      if (isBatchMode) {
        const next = typeof newState === 'function'
          ? (newState as (prev: T) => T)(batchStartStateRef.current ?? currentState)
          : newState
        batchStartStateRef.current = next
        batchHasChangeRef.current = true
        // 直接更新历史中的当前项（不增加历史记录）
        const newHistory = [...history]
        newHistory[currentIndex] = next
        setHistory(newHistory)
        return
      }

      // 正常模式：直接记录历史
      const next = typeof newState === 'function'
        ? (newState as (prev: T) => T)(currentState)
        : newState

      if (JSON.stringify(next) === JSON.stringify(currentState)) {
        return
      }

      const newHistory = history.slice(0, currentIndex + 1)
      newHistory.push(next)
      
      if (newHistory.length > maxHistory) {
        newHistory.shift()
        setCurrentIndex((prev) => Math.min(prev, maxHistory - 1))
      } else {
        setCurrentIndex((prev) => prev + 1)
      }
      
      setHistory(newHistory)
    },
    [currentState, history, currentIndex, maxHistory, isBatchMode]
  )

  const startBatch = useCallback(() => {
    if (isBatchMode) return
    setIsBatchMode(true)
    // 记录开始时的状态
    batchStartStateRef.current = currentState
    batchHasChangeRef.current = false
  }, [isBatchMode, currentState])

  const endBatch = useCallback(() => {
    if (!isBatchMode) return
    
    const finalState = batchStartStateRef.current
    setIsBatchMode(false)
    
    if (finalState === null) {
      batchStartStateRef.current = null
      batchHasChangeRef.current = false
      return
    }
    
    // 检查是否有变化
    const currentStateValue = history[currentIndex]
    const hasChange = batchHasChangeRef.current && 
      JSON.stringify(finalState) !== JSON.stringify(currentStateValue)
    
    batchStartStateRef.current = null
    batchHasChangeRef.current = false
    
    if (!hasChange) {
      return
    }
    
    // 将最终状态记录到历史
    const newHistory = history.slice(0, currentIndex + 1)
    newHistory.push(finalState)
    
    if (newHistory.length > maxHistory) {
      newHistory.shift()
      setCurrentIndex((prev) => Math.min(prev, maxHistory - 1))
    } else {
      setCurrentIndex((prev) => prev + 1)
    }
    
    setHistory(newHistory)
  }, [isBatchMode, history, currentIndex, maxHistory])

  const undo = useCallback(() => {
    if (currentIndex > 0) {
      isUndoRedoRef.current = true
      setCurrentIndex((prev) => prev - 1)
      setTimeout(() => {
        isUndoRedoRef.current = false
      }, 0)
      return true
    }
    return false
  }, [currentIndex])

  const redo = useCallback(() => {
    if (currentIndex < history.length - 1) {
      isUndoRedoRef.current = true
      setCurrentIndex((prev) => prev + 1)
      setTimeout(() => {
        isUndoRedoRef.current = false
      }, 0)
      return true
    }
    return false
  }, [currentIndex, history.length])

  const canUndo = currentIndex > 0
  const canRedo = currentIndex < history.length - 1

  const clearHistory = useCallback((newState: T) => {
    setHistory([newState])
    setCurrentIndex(0)
    batchStartStateRef.current = null
    batchHasChangeRef.current = false
    setIsBatchMode(false)
  }, [])

  return {
    state: currentState,
    setState,
    undo,
    redo,
    canUndo,
    canRedo,
    clearHistory,
    historyLength: history.length,
    currentIndex,
    startBatch,
    endBatch,
    isBatchMode,
  }
}