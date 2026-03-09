import { createFileRoute, redirect } from "@tanstack/react-router"
import { Button } from "@/components/ui/button"
import { signIn } from "@/lib/auth-client"
import { getSession } from "@/lib/auth-queries"
import { IconBrandSpotify } from "@tabler/icons-react"
import { formatVersion } from "@/lib/version"

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
    <div className="flex min-h-svh bg-background">
      {/* Left side — branding */}
      <div className="relative hidden flex-1 flex-col justify-between overflow-hidden bg-primary p-12 text-primary-foreground lg:flex">
        {/* Decorative bars — echoing the icon waveform */}
        <div className="pointer-events-none absolute inset-0 flex items-end justify-center gap-6 px-24 pb-0 opacity-[0.08]">
          <div className="w-16 rounded-t-2xl bg-current" style={{ height: "30%" }} />
          <div className="w-16 rounded-t-2xl bg-current" style={{ height: "50%" }} />
          <div className="w-16 rounded-t-2xl bg-current" style={{ height: "70%" }} />
          <div className="w-16 rounded-t-2xl bg-current" style={{ height: "90%" }} />
          <div className="w-16 rounded-t-2xl bg-current" style={{ height: "55%" }} />
          <div className="w-16 rounded-t-2xl bg-current" style={{ height: "40%" }} />
          <div className="w-16 rounded-t-2xl bg-current" style={{ height: "65%" }} />
        </div>

        <div className="relative flex items-center gap-3">
          <img src="/icon.svg" alt="SpotiTrack" className="size-10 rounded-lg" />
          <span className="text-lg font-bold tracking-tight">SpotiTrack</span>
        </div>

        <div className="relative max-w-lg">
          <h1 className="text-4xl font-bold leading-tight tracking-tight">
            Your listening,
            <br />
            beautifully tracked.
          </h1>
          <p className="mt-4 text-base leading-relaxed text-primary-foreground/70">
            Discover patterns in your music taste, explore your top artists and
            tracks, and watch your listening history unfold over time.
          </p>
        </div>

        <p className="relative text-xs text-primary-foreground/40">
          {formatVersion()}
        </p>
      </div>

      {/* Right side — sign in */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 lg:max-w-xl">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="mb-10 flex items-center gap-3 lg:hidden">
            <img src="/icon.svg" alt="SpotiTrack" className="size-9 rounded-lg" />
            <span className="text-lg font-bold tracking-tight">SpotiTrack</span>
          </div>

          <h2 className="text-2xl font-bold tracking-tight">Welcome back</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Sign in with your Spotify account to continue.
          </p>

          <Button
            className="mt-8 w-full gap-2.5"
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

          <p className="mt-6 text-center text-xs leading-relaxed text-muted-foreground/60">
            We access your listening data to show you insights.
            <br />
            Revoke access anytime in your Spotify settings.
          </p>
        </div>
      </div>
    </div>
  )
}
