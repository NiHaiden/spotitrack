import { createFileRoute } from "@tanstack/react-router"
import { auth } from "@/lib/auth"

export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        const response = await auth.handler(request)
        console.log("[AUTH GET]", request.url, response.status, response.headers.get('content-type'))
        return response
      },
      POST: async ({ request }: { request: Request }) => {
        const response = await auth.handler(request)
        console.log("[AUTH POST]", request.url, response.status, response.headers.get('content-type'))
        return response
      },
    },
  },
})
