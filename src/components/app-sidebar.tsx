import * as React from "react"
import { Link, useRouterState } from "@tanstack/react-router"

import {
  IconChartBar,
  IconClock,
  IconMusic,
  IconPlaylist,
  IconSettings,
  IconUsers,
} from "@tabler/icons-react"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"

const navMain = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: <IconChartBar className="size-5" />,
  },
  {
    title: "Top Tracks",
    url: "/top-tracks",
    icon: <IconMusic className="size-5" />,
  },
  {
    title: "Top Artists",
    url: "/top-artists",
    icon: <IconUsers className="size-5" />,
  },
  {
    title: "Recent Plays",
    url: "/recent",
    icon: <IconClock className="size-5" />,
  },
  {
    title: "Playlists",
    url: "/playlists",
    icon: <IconPlaylist className="size-5" />,
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const router = useRouterState()
  const currentPath = router.location.pathname

  const isActive = (url: string) =>
    currentPath === url || currentPath.startsWith(`${url}/`)

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              render={<Link to="/dashboard" />}
            >
              <img src="/icon.svg" alt="SpotiTrack" className="size-8 rounded-lg" />
              <span className="truncate text-base font-bold tracking-tight">
                SpotTrack
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="mb-1 text-[11px] font-medium uppercase tracking-widest text-muted-foreground/60">
            Overview
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navMain.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    isActive={isActive(item.url)}
                    render={<Link to={item.url} />}
                  >
                    {item.icon}
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
              isActive={isActive("/settings")}
              render={<Link to="/settings" />}
            >
              <IconSettings className="size-5" />
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
