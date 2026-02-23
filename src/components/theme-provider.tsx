import { useRouter } from "@tanstack/react-router"
import { createContext, use } from "react"
import type { PropsWithChildren } from "react"
import type { Theme } from "@/lib/theme"
import { setThemeServerFn } from "@/lib/theme"

interface ThemeContextVal {
  theme: Theme
  setTheme: (val: Theme) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextVal | null>(null)

export function ThemeProvider({
  children,
  theme,
}: PropsWithChildren<{ theme: Theme }>) {
  const router = useRouter()

  function setTheme(val: Theme) {
    document.documentElement.classList.toggle("dark", val === "dark")
    void setThemeServerFn({ data: val }).then(() => router.invalidate())
  }

  function toggleTheme() {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  return (
    <ThemeContext value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext>
  )
}

export function useTheme() {
  const val = use(ThemeContext)
  if (!val) throw new Error("useTheme called outside of ThemeProvider!")
  return val
}
