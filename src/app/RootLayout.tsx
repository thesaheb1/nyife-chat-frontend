import type { ReactNode } from "react"
import { AppSidebar, type SidebarRoute } from "@/components/app-sidebar"
import Header from "@/components/header"
import {
    SidebarInset,
    SidebarProvider,
} from "@/components/ui/sidebar"
import Breadcrumbs from "@/components/bread-crumbs"
import { usePathname } from "@/hooks/use-pathname"

interface RootLayoutProps {
    children: ReactNode,
    sidebar: SidebarRoute[]
}

export default function RootLayout({ children, sidebar }: RootLayoutProps) {
    const path = usePathname();
    return (
        <SidebarProvider>
            <AppSidebar routes={sidebar} />
            <SidebarInset>
                <Header />
                <div className="flex flex-1 flex-col gap-4 p-5 pt-0">
                    <Breadcrumbs showHome={path !== "/"} />
                    {children}
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}
