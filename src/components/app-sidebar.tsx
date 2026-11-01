import * as React from 'react'
import { Link, useRouterState } from '@tanstack/react-router'

import {
  IconChartBar,
  IconClock,
  IconMusic,
  IconPlaylist,
  IconSettings,
  IconUsers,
} from '@tabler/icons-react'
import { NavUser } from '@/components/nav-user'
import { cn } from '@/lib/utils'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar'

const navMain = [
  {
    title: 'Dashboard',
    url: '/dashboard',
    icon: <IconChartBar className="size-4" />,
  },
  {
    title: 'Top tracks',
    url: '/top-tracks',
    icon: <IconMusic className="size-4" />,
  },
  {
    title: 'Top artists',
    url: '/top-artists',
    icon: <IconUsers className="size-4" />,
  },
  {
    title: 'Recent plays',
    url: '/recent',
    icon: <IconClock className="size-4" />,
  },
  {
    title: 'Playlists',
    url: '/playlists',
    icon: <IconPlaylist className="size-4" />,
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const router = useRouterState()
  const currentPath = router.location.pathname
  const { isMobile, setOpenMobile } = useSidebar()

  // The mobile sidebar is a drawer; close it once a destination is picked.
  const closeOnMobile = () => {
    if (isMobile) setOpenMobile(false)
  }

  const isActive = (url: string) =>
    currentPath === url || currentPath.startsWith(`${url}/`)

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              render={<Link to="/dashboard" onClick={closeOnMobile} />}
            >
              <img src="/icon.svg" alt="" className="size-8 rounded-lg" />
              <span className="truncate text-base font-bold tracking-tight">
                SpotiTrack
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navMain.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    isActive={isActive(item.url)}
                    render={<Link to={item.url} onClick={closeOnMobile} />}
                  >
                    <span
                      className={cn(
                        'flex text-muted-foreground',
                        isActive(item.url) && 'text-primary',
                      )}
                    >
                      {item.icon}
                    </span>
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={isActive('/settings')}
              render={<Link to="/settings" onClick={closeOnMobile} />}
            >
              <span
                className={cn(
                  'flex text-muted-foreground',
                  isActive('/settings') && 'text-primary',
                )}
              >
                <IconSettings className="size-4" />
              </span>
              <span>Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
