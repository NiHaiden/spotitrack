import * as React from "react"
import { Link, useRouterState } from "@tanstack/react-router"

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
  SidebarSeparator,
} from "@/components/ui/sidebar"
import {
  IconChartBar,
  IconMusic,
  IconUsers,
  IconClock,
  IconPlaylist,
  IconSettings,
  IconBrandSpotify,
} from "@tabler/icons-react"

const navMain = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: <IconChartBar />,
  },
  {
    title: "Top Tracks",
    url: "/top-tracks",
    icon: <IconMusic />,
  },
  {
    title: "Top Artists",
    url: "/top-artists",
    icon: <IconUsers />,
  },
  {
    title: "Recent Plays",
    url: "/recent",
    icon: <IconClock />,
  },
  {
    title: "Playlists",
    url: "/playlists",
    icon: <IconPlaylist />,
  },
]

const navSecondary = [
  {
    title: "Settings",
    url: "/settings",
    icon: <IconSettings />,
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
              <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                <IconBrandSpotify className="size-5" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">SpotiTrack</span>
                <span className="truncate text-xs text-muted-foreground">
                  Listening stats
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarSeparator />
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Overview</SidebarGroupLabel>
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
        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              {navSecondary.map((item) => (
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
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
