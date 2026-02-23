import { useCallback, useSyncExternalStore } from "react"

function getTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light"
  const stored = localStorage.getItem("spotitrack-theme")
  if (stored === "dark" || stored === "light") return stored
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light"
}

function applyTheme(theme: "light" | "dark") {
  document.documentElement.classList.toggle("dark", theme === "dark")
}

let listeners: Array<() => void> = []

function subscribe(listener: () => void) {
  listeners.push(listener)
  return () => {
    listeners = listeners.filter((l) => l !== listener)
  }
}

function emitChange() {
  for (const listener of listeners) {
    listener()
  }
}

// Apply on load
if (typeof window !== "undefined") {
  applyTheme(getTheme())
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getTheme, () => "light")

  const setTheme = useCallback((next: "light" | "dark") => {
    localStorage.setItem("spotitrack-theme", next)
    applyTheme(next)
    emitChange()
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme(getTheme() === "dark" ? "light" : "dark")
  }, [setTheme])

  return { theme, setTheme, toggleTheme }
}
