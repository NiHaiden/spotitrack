import { createFileRoute, useRouter } from "@tanstack/react-router"
import {
  IconBrandSpotify,
  IconLogout,
  IconMoon,
  IconRefresh,
  IconShieldCheck,
  IconSun,
} from "@tabler/icons-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { signIn, signOut, useSession } from "@/lib/auth-client"
import { useTheme } from "@/components/theme-provider"
import { formatVersion } from "@/lib/version"
import { PageHeader } from "@/components/page"
import { initials } from "@/lib/format"

export const Route = createFileRoute("/_authenticated/settings")({
  component: SettingsPage,
})

function SettingsPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const { theme, toggleTheme } = useTheme()
  const user = session?.user

  return (
    <div className="w-full max-w-3xl space-y-6">
      <PageHeader
        title={
          <span className="flex items-center gap-2.5">
            Settings
            <Badge variant="outline" className="font-mono text-xs font-normal">
              {formatVersion()}
            </Badge>
          </span>
        }
        description="Manage your account and preferences."
      />

      {/* Account */}
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>
            Your connected Spotify account information.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="size-16">
              <AvatarImage src={user?.image ?? undefined} alt={user?.name} />
              <AvatarFallback className="text-lg">{initials(user?.name)}</AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <p className="text-lg font-semibold leading-none">
                {user?.name ?? "Unknown"}
              </p>
              <p className="text-sm text-muted-foreground">
                {user?.email ?? "No email"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Spotify Connection */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1.5">
              <CardTitle className="flex items-center gap-2">
                <IconBrandSpotify className="size-5 text-[#1DB954]" />
                Spotify Connection
              </CardTitle>
              <CardDescription>
                Manage your Spotify integration and permissions.
              </CardDescription>
            </div>
            <Badge
              variant="outline"
              className="gap-1 border-green-500/30 bg-green-500/10 text-green-600 dark:text-green-400"
            >
              <IconShieldCheck className="size-3" />
              Connected
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              Re-authenticate to refresh your permissions.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() =>
                signIn.social({
                  provider: "spotify",
                  callbackURL: "/settings",
                })
              }
            >
              <IconRefresh className="size-4" />
              Reconnect
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>
            Customize how SpotiTrack looks.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {theme === "dark" ? (
                <IconMoon className="size-5 text-muted-foreground" />
              ) : (
                <IconSun className="size-5 text-muted-foreground" />
              )}
              <div className="space-y-0.5">
                <Label htmlFor="dark-mode">Dark mode</Label>
                <p className="text-xs text-muted-foreground">
                  {theme === "dark"
                    ? "Using dark theme."
                    : "Using light theme."}
                </p>
              </div>
            </div>
            <Switch
              id="dark-mode"
              aria-label="Dark mode"
              checked={theme === "dark"}
              onCheckedChange={toggleTheme}
            />
          </div>
        </CardContent>
      </Card>

      {/* Session */}
      <Card>
        <CardHeader>
          <CardTitle>Session</CardTitle>
          <CardDescription>
            Your listening history stays saved when you sign out.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Sign out</p>
              <p className="text-xs text-muted-foreground">
                End your session and return to the sign-in page.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={async () => {
                await signOut()
                router.navigate({ to: "/sign-in" })
              }}
            >
              <IconLogout className="size-4" />
              Sign out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
