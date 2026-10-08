import {
  Link,
  createFileRoute,
  Outlet,
  redirect,
} from "@tanstack/react-router"
import { AppSidebar } from "@/components/app-sidebar"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
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

function AuthenticatedLayout() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="min-w-0">
        <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background/85 px-4 backdrop-blur-md lg:hidden">
          <SidebarTrigger className="-ml-1" aria-label="Open navigation" />
          <Link to="/dashboard" className="flex items-center gap-2">
            <img src="/icon.svg" alt="" className="size-7 rounded-md" />
            <span className="text-[15px] font-bold tracking-tight">SpotiTrack</span>
          </Link>
        </header>
        <div className="mx-auto flex w-full max-w-[1400px] min-w-0 flex-1 flex-col px-4 py-5 sm:px-6 sm:py-6 lg:px-10 lg:py-8">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
