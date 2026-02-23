import { Fragment } from "react"
import {
  Link,
  createFileRoute,
  Outlet,
  redirect,
  useRouterState,
} from "@tanstack/react-router"
import { AppSidebar } from "@/components/app-sidebar"
import { BackgroundSyncStatus } from "@/components/background-sync-status"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { getSession } from "@/lib/auth-queries"

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async ({ location }) => {
    const session = await getSession()
    if (!session) {
      throw redirect({
        to: "/sign-in",
        search: { redirect: location.href },
      })
    }
    return { user: session.user }
  },
  component: AuthenticatedLayout,
})

const breadcrumbLabels: Record<string, string> = {
  dashboard: "Dashboard",
  "top-tracks": "Top Tracks",
  "top-artists": "Top Artists",
  recent: "Recent Plays",
  playlists: "Playlists",
  settings: "Settings",
}

function segmentLabel(segment: string) {
  return (
    breadcrumbLabels[segment] ??
    segment
      .split("-")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  )
}

function buildBreadcrumbItems(pathname: string) {
  const segments = pathname.split("/").filter(Boolean)

  if (!segments.length) {
    return [{ href: "/dashboard", label: "Dashboard" }]
  }

  return segments.map((segment, index) => {
    const href = `/${segments.slice(0, index + 1).join("/")}`
    return {
      href,
      label: segmentLabel(segment),
    }
  })
}

function AuthenticatedLayout() {
  const pathname = useRouterState({ select: state => state.location.pathname })
  const breadcrumbs = buildBreadcrumbItems(pathname)

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink render={<Link to="/dashboard" />}>
                    SpotiTrack
                  </BreadcrumbLink>
                </BreadcrumbItem>

                {breadcrumbs.map((item, index) => {
                  const isLast = index === breadcrumbs.length - 1

                  return (
                    <Fragment key={item.href}>
                      <BreadcrumbSeparator className="hidden md:block" />
                      <BreadcrumbItem>
                        {isLast ? (
                          <BreadcrumbPage>{item.label}</BreadcrumbPage>
                        ) : (
                          <BreadcrumbLink render={<Link to={item.href} />}>
                            {item.label}
                          </BreadcrumbLink>
                        )}
                      </BreadcrumbItem>
                    </Fragment>
                  )
                })}
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          <div className="ml-auto">
            <BackgroundSyncStatus />
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
