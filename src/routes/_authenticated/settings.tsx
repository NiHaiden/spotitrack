import { createFileRoute, useRouter } from '@tanstack/react-router'
import { IconBrandSpotify, IconLogout, IconRefresh } from '@tabler/icons-react'
import type * as React from 'react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { signIn, signOut, useSession } from '@/lib/auth-client'
import { useTheme } from '@/components/theme-provider'
import { formatVersion } from '@/lib/version'
import { PageHeader, Panel } from '@/components/page'
import { cn } from '@/lib/utils'
import { initials } from '@/lib/format'

export const Route = createFileRoute('/_authenticated/settings')({
  component: SettingsPage,
})

function SettingsPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const { theme, toggleTheme } = useTheme()
  const user = session?.user

  return (
    <div className="w-full max-w-2xl space-y-8 lg:space-y-10">
      <PageHeader
        title="Settings"
        description="Manage your account and preferences."
      />

      {/* The account leads: who is signed in and the Spotify link behind it */}
      <Panel surface>
        <div className="flex items-center gap-4">
          <Avatar className="size-14">
            <AvatarImage src={user?.image ?? undefined} alt="" />
            <AvatarFallback className="bg-background text-lg">
              {initials(user?.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <p className="truncate text-lg leading-snug font-semibold">
              {user?.name ?? 'Unknown'}
            </p>
            <p className="truncate text-sm text-muted-foreground">
              {user?.email ?? 'No email'}
            </p>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1.5 text-[13px] font-medium text-emerald-700 dark:text-emerald-400">
            <IconBrandSpotify className="size-4" />
            Connected
          </span>
        </div>
        <SettingRow
          className="mt-5 border-t border-border pt-5"
          title="Spotify connection"
          description="Re-authenticate to refresh your permissions."
        >
          <Button
            variant="outline"
            size="sm"
            className="gap-2 bg-background"
            onClick={() =>
              signIn.social({
                provider: 'spotify',
                callbackURL: '/settings',
              })
            }
          >
            <IconRefresh className="size-4" />
            Reconnect
          </Button>
        </SettingRow>
      </Panel>

      <Panel title="Appearance">
        <SettingRow
          title={<Label htmlFor="dark-mode">Dark mode</Label>}
          description={
            theme === 'dark' ? 'Using dark theme.' : 'Using light theme.'
          }
        >
          <Switch
            id="dark-mode"
            aria-label="Dark mode"
            checked={theme === 'dark'}
            onCheckedChange={toggleTheme}
          />
        </SettingRow>
      </Panel>

      <Panel title="Session">
        <SettingRow
          title="Sign out"
          description="Your listening history stays saved when you sign out."
        >
          <Button
            variant="outline"
            size="sm"
            className="gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={async () => {
              await signOut()
              router.navigate({ to: '/sign-in' })
            }}
          >
            <IconLogout className="size-4" />
            Sign out
          </Button>
        </SettingRow>
      </Panel>

      <p className="text-xs text-muted-foreground">
        SpotiTrack {formatVersion()}
      </p>
    </div>
  )
}

/** One setting: what it is on the left, its control on the right. */
function SettingRow({
  title,
  description,
  className,
  children,
}: {
  title: React.ReactNode
  description: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={cn('flex items-center justify-between gap-4', className)}>
      <div className="flex min-w-0 flex-col gap-0.5">
        <div className="text-sm leading-snug font-medium">{title}</div>
        <p className="text-[13px] leading-snug text-muted-foreground">
          {description}
        </p>
      </div>
      {children}
    </div>
  )
}
