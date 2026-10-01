import { useCallback, useRef, useState } from 'react'
import { History } from '../lib/history'
export function useUndo<T>(initialState: T, options: { maxHistory?: number } = {}) {
  const ref = useRef<History<T> | null>(null)
  ref.current ??= new History(initialState, options.maxHistory ?? 50)
  const history = ref.current
  const [, refresh] = useState(0)
  const update = useCallback(() => refresh(value => value + 1), [])
  const setState = useCallback((next: T | ((previous: T) => T)) => { history.set(next); update() }, [history, update])
  const undo = useCallback(() => { history.undo(); update() }, [history, update])
  const redo = useCallback(() => { history.redo(); update() }, [history, update])
  const startBatch = useCallback(() => { history.start() }, [history])
  const endBatch = useCallback(() => { history.end(); update() }, [history, update])
  const clearHistory = useCallback((value: T) => { history.clear(value); update() }, [history, update])
  return { state: history.value, setState, undo, redo, canUndo: history.index > 0,
    canRedo: history.index < history.entries.length - 1, clearHistory, startBatch, endBatch }
}
