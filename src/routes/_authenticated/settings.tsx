import { createFileRoute, useRouter } from "@tanstack/react-router"
import {
  IconBrandSpotify,
  IconClock,
  IconLogout,
  IconMoon,
  IconMusic,
  IconPlaylist,
  IconRefresh,
  IconShieldCheck,
  IconSun,
  IconUser,
} from "@tabler/icons-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { signIn, signOut, useSession } from "@/lib/auth-client"
import { useTheme } from "@/components/theme-provider"

export const Route = createFileRoute("/_authenticated/settings")({
  component: SettingsPage,
})

const SPOTIFY_SCOPES = [
  {
    scope: "user-read-email",
    label: "Email",
    description: "Read your email address",
    icon: IconUser,
  },
  {
    scope: "user-read-private",
    label: "Profile",
    description: "Read your profile information",
    icon: IconUser,
  },
  {
    scope: "user-top-read",
    label: "Top Items",
    description: "Read your top artists and tracks",
    icon: IconMusic,
  },
  {
    scope: "user-read-recently-played",
    label: "Recent Plays",
    description: "Read your recently played tracks",
    icon: IconClock,
  },
  {
    scope: "playlist-read-private",
    label: "Private Playlists",
    description: "Read your private playlists",
    icon: IconPlaylist,
  },
  {
    scope: "playlist-read-collaborative",
    label: "Collaborative Playlists",
    description: "Read collaborative playlists you're part of",
    icon: IconPlaylist,
  },
]

function SettingsPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const { theme, toggleTheme } = useTheme()
  const user = session?.user

  return (
    <div className="w-full space-y-6 pt-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">
          Manage your account and preferences.
        </p>
      </div>

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
              <AvatarFallback className="text-lg">
                {user?.name
                  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                  ?.split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2) ?? "?"}
              </AvatarFallback>
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
          <div className="flex items-center justify-between">
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
        <CardContent className="space-y-4">
          <div>
            <p className="mb-3 text-sm font-medium">Granted Permissions</p>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {SPOTIFY_SCOPES.map(({ scope, label, description, icon: Icon }) => (
                <div
                  key={scope}
                  className="flex items-start gap-3 rounded-lg border p-3"
                >
                  <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium leading-none">{label}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Reconnect</p>
              <p className="text-xs text-muted-foreground">
                Re-authenticate with Spotify to refresh your permissions.
              </p>
            </div>
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {theme === "dark" ? (
                <IconMoon className="size-5 text-muted-foreground" />
              ) : (
                <IconSun className="size-5 text-muted-foreground" />
              )}
              <div className="space-y-0.5">
                <Label htmlFor="dark-mode">Dark Mode</Label>
                <p className="text-xs text-muted-foreground">
                  {theme === "dark"
                    ? "Using dark theme."
                    : "Using light theme."}
                </p>
              </div>
            </div>
            <Switch
              id="dark-mode"
              checked={theme === "dark"}
              onCheckedChange={toggleTheme}
            />
          </div>
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
          <CardDescription>
            Configure your listening analytics experience.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="compact-view">Compact View</Label>
              <p className="text-xs text-muted-foreground">
                Use a more condensed layout for lists.
              </p>
            </div>
            <Switch id="compact-view" />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="show-explicit">Show Explicit Content</Label>
              <p className="text-xs text-muted-foreground">
                Display explicit tracks in your lists.
              </p>
            </div>
            <Switch id="show-explicit" defaultChecked />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="album-art">Album Art Previews</Label>
              <p className="text-xs text-muted-foreground">
                Show album artwork in track listings.
              </p>
            </div>
            <Switch id="album-art" defaultChecked />
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>
            Irreversible actions for your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Sign Out</p>
              <p className="text-xs text-muted-foreground">
                End your session and return to the sign-in page.
              </p>
            </div>
            <Button
              variant="destructive"
              size="sm"
              className="gap-2"
              onClick={async () => {
                await signOut()
                router.navigate({ to: "/sign-in" })
              }}
            >
              <IconLogout className="size-4" />
              Sign Out
            </Button>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Revoke Access</p>
              <p className="text-xs text-muted-foreground">
                Remove SpotiTrack from your Spotify connected apps. Visit your{" "}
                <a
                  href="https://www.spotify.com/account/apps/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline underline-offset-4"
                >
                  Spotify settings
                </a>{" "}
                to manage this.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
