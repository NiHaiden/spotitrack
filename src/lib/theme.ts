import { createServerFn } from "@tanstack/react-start"
import { getCookie, setCookie } from "@tanstack/react-start/server"

export type Theme = "light" | "dark"
const STORAGE_KEY = "_preferred-theme"

export const getThemeServerFn = createServerFn().handler(
  async () => (getCookie(STORAGE_KEY) || "light") as Theme,
)

export const setThemeServerFn = createServerFn({ method: "POST" })
  .validator((data: unknown): Theme => {
    if (data === "light" || data === "dark") return data
    throw new Error("Invalid theme value")
  })
  .handler(async ({ data }) => {
    setCookie(STORAGE_KEY, data)
  })
