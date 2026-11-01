import { createFileRoute, redirect } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { signIn } from '@/lib/auth-client'
import { getSession } from '@/lib/auth-queries'
import { IconBrandSpotify } from '@tabler/icons-react'
import { formatVersion } from '@/lib/version'
import { SignInDemo } from '@/components/sign-in-demo/sign-in-demo'
import { useTheme } from '@/components/theme-provider'

export const Route = createFileRoute('/sign-in')({
  beforeLoad: async () => {
    const session = await getSession()
    if (session?.user) {
      throw redirect({ to: '/dashboard' })
    }
  },
  component: SignInPage,
})

function SignInPage() {
  const { theme } = useTheme()
  return (
    <div className="flex min-h-svh bg-background">
      {/* Left side — branding, with the dashboard demo running off the bottom */}
      <div className="relative hidden flex-1 flex-col overflow-hidden bg-primary text-primary-foreground lg:flex">
        <div className="relative p-12 pb-8">
          <div className="flex items-center gap-3">
            <img
              src="/icon.svg"
              alt="SpotiTrack"
              className="size-10 rounded-lg"
            />
            <span className="text-lg font-bold tracking-tight">SpotiTrack</span>
          </div>

          <div className="mt-14 max-w-lg">
            <h1 className="text-4xl font-bold leading-tight tracking-tight">
              Your listening,
              <br />
              beautifully tracked.
            </h1>
            <p className="mt-4 text-base leading-relaxed text-primary-foreground/70">
              Discover patterns in your music taste, explore your top artists
              and tracks, and watch your listening history unfold over time.
            </p>
          </div>
        </div>

        {/* The panel is the demo's ground and crop: the window runs off its right and bottom */}
        <div className="mt-auto w-full pl-12" aria-hidden="true">
          <div className="max-w-[704px]">
            <SignInDemo theme={theme} />
          </div>
        </div>
      </div>

      {/* Right side — sign in */}
      <div className="relative flex flex-1 flex-col items-center justify-center px-6 lg:max-w-sm xl:max-w-md">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="mb-10 flex items-center gap-3 lg:hidden">
            <img
              src="/icon.svg"
              alt="SpotiTrack"
              className="size-9 rounded-lg"
            />
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
                provider: 'spotify',
                callbackURL: '/dashboard',
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

        <p className="absolute bottom-6 text-xs text-muted-foreground/40">
          {formatVersion()}
        </p>
      </div>
    </div>
  )
}
