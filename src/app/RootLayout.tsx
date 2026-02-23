import type { ReactNode } from "react"
import { AppSidebar, type SidebarRoute } from "@/components/app-sidebar"
import Header from "@/components/header"
import {
    SidebarInset,
    SidebarProvider,
} from "@/components/ui/sidebar"

interface RootLayoutProps {
    children: ReactNode,
    sidebar: SidebarRoute[]
}

export default function RootLayout({ children, sidebar }: RootLayoutProps) {
    return (
        <SidebarProvider>
            <AppSidebar routes={sidebar} />
            <SidebarInset>
                <Header />
                <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
                    {children}
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}
