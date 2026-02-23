function resolveRequestUrl(input: string) {
  if (input.startsWith("http://") || input.startsWith("https://")) {
    return input
  }

  if (typeof window !== "undefined") {
    return input
  }

  const baseUrl =
    process.env.INTERNAL_APP_URL ||
    process.env.BETTER_AUTH_URL ||
    "http://localhost:3000"

  return new URL(input, baseUrl).toString()
}

async function getServerForwardHeaders() {
  if (typeof window !== "undefined") {
    return {}
  }

  try {
    const { getRequestHeaders } = await import("@tanstack/react-start/server")
    const requestHeaders = getRequestHeaders()

    return {
      ...(requestHeaders.get("cookie")
        ? { cookie: requestHeaders.get("cookie") as string }
        : {}),
      ...(requestHeaders.get("authorization")
        ? { authorization: requestHeaders.get("authorization") as string }
        : {}),
    }
  } catch {
    return {}
  }
}

export async function apiFetch<T>(
  input: string,
  init?: RequestInit,
): Promise<T> {
  const serverForwardHeaders = await getServerForwardHeaders()

  const response = await fetch(resolveRequestUrl(input), {
    ...init,
    headers: {
      "content-type": "application/json",
      ...serverForwardHeaders,
      ...(init?.headers ?? {}),
    },
  })

  if (response.status === 401) {
    if (typeof window === "undefined") {
      const { redirect } = await import("@tanstack/react-router")
      throw redirect({ to: "/sign-in" })
    }

    if (!window.location.pathname.startsWith("/sign-in")) {
      window.location.assign("/sign-in")
    }

    throw new Error("Unauthorized")
  }

  if (!response.ok) {
    let message = `Request failed (${response.status})`
    try {
      const payload = (await response.json()) as { error?: string }
      if (payload?.error) {
        message = payload.error
      }
    } catch {
      // ignore json parse failures
    }
    throw new Error(message)
  }

  if (response.status === 204) {
    return null as T
  }

  return response.json() as Promise<T>
}

export function formatMs(ms: number) {
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}:${String(seconds).padStart(2, "0")}`
}

export function formatDurationShort(ms: number) {
  const totalMinutes = Math.floor(ms / 1000 / 60)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
}

export function formatPlayedAt(dateString: string | Date) {
  const date = typeof dateString === "string" ? new Date(dateString) : dateString
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}
