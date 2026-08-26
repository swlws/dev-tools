import { useCallback, useSyncExternalStore } from 'react'

const STORAGE_KEY = 'qr-favorites'

export interface Favorite {
  id: string
  text: string
  label?: string
  createdAt: number
}

function read(): Favorite[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as Favorite[]) : []
  } catch {
    return []
  }
}

const listeners = new Set<() => void>()
let snapshot = read()

function subscribe(cb: () => void) {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

function getSnapshot() {
  return snapshot
}

function write(next: Favorite[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // ignore quota / disabled storage
  }
  snapshot = next
  listeners.forEach((cb) => cb())
}

// Duplicates allowed: each add prepends a new entry, newest first.
export function addFavorite(text: string, label?: string) {
  const entry: Favorite = {
    id: crypto.randomUUID(),
    text,
    label: label?.trim() || undefined,
    createdAt: Date.now(),
  }
  write([entry, ...read()])
}

export function removeFavorite(id: string) {
  write(read().filter((f) => f.id !== id))
}

export function useQrFavorites() {
  const favorites = useSyncExternalStore(subscribe, getSnapshot, () => [] as Favorite[])
  const add = useCallback((text: string, label?: string) => addFavorite(text, label), [])
  const remove = useCallback((id: string) => removeFavorite(id), [])
  return { favorites, add, remove }
}
