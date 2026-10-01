export class History<T> {
  entries: T[]
  index = 0
  batching = false
  value: T
  limit: number
  constructor(initial: T, limit = 50) { this.entries = [initial]; this.value = initial; this.limit = limit }
  set(next: T | ((previous: T) => T)) {
    const value = typeof next === 'function' ? (next as (previous: T) => T)(this.value) : next
    if (Object.is(value, this.value)) return
    this.value = value
    if (!this.batching) this.commit()
  }
  private commit() {
    if (Object.is(this.entries[this.index], this.value)) return
    this.entries = [...this.entries.slice(0, this.index + 1), this.value].slice(-this.limit)
    this.index = this.entries.length - 1
  }
  start() { this.batching = true }
  end() { if (!this.batching) return; this.batching = false; this.commit() }
  undo() { this.end(); if (this.index > 0) this.value = this.entries[--this.index] }
  redo() { this.end(); if (this.index < this.entries.length - 1) this.value = this.entries[++this.index] }
  clear(value: T) { this.entries = [value]; this.index = 0; this.value = value; this.batching = false }
}
