import type { ReactNode } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import Header from "@/components/header"
import {
    SidebarInset,
    SidebarProvider,
} from "@/components/ui/sidebar"

interface RootLayoutProps {
    children: ReactNode,
    sidebar: any
}

export default function RootLayout({ children, sidebar }: RootLayoutProps) {
    console.log(sidebar)
    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <Header />
                <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
                    {children}
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}
