import { createFileRoute, redirect } from "@tanstack/react-router"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { signIn } from "@/lib/auth-client"
import { getSession } from "@/lib/auth-queries"
import { IconBrandSpotify } from "@tabler/icons-react"

export const Route = createFileRoute("/sign-in")({
  beforeLoad: async () => {
    const session = await getSession()
    if (session?.user) {
      throw redirect({ to: "/dashboard" })
    }
  },
  component: SignInPage,
})

function SignInPage() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <IconBrandSpotify className="size-7" />
          </div>
          <CardTitle className="text-2xl">Welcome to SpotiTrack</CardTitle>
          <CardDescription>
            Sign in with your Spotify account to view your listening stats and
            analytics.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            className="w-full gap-2"
            size="lg"
            onClick={async () => {
              await signIn.social({
                provider: "spotify",
                callbackURL: "/dashboard",
              })
            }}
          >
            <IconBrandSpotify className="size-5" />
            Continue with Spotify
          </Button>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            We'll access your listening data to show you insights. You can
            revoke access anytime in your Spotify settings.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
