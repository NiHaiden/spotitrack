import {
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
      <SidebarInset>
        <header className="flex h-12 shrink-0 items-center px-6 lg:hidden">
          <SidebarTrigger className="-ml-2" />
        </header>
        <div className="flex flex-1 flex-col px-6 py-6 lg:px-10 lg:py-8">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
