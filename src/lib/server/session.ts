import { auth } from "@/lib/auth"

export async function getSessionFromRequest(request: Request) {
  return auth.api.getSession({ headers: request.headers })
}

export async function requireSession(request: Request) {
  const session = await getSessionFromRequest(request)
  if (!session) {
    return null
  }
  return session
}

export function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "cache-control": "no-store, max-age=0",
      "content-type": "application/json",
      pragma: "no-cache",
      "x-content-type-options": "nosniff",
    },
  })
}
