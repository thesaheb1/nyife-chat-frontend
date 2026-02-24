"use client"

import * as React from "react"
import {
  AudioWaveform,
  Command,
  GalleryVerticalEnd,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { useAppSelector } from "@/redux/store/hooks"

export type SidebarRoute = {
  path?: string
  pageKey?: string
  sidebarProps?: {
    displayText?: string
    icon?: React.ReactNode
  }
  child?: SidebarRoute[]
}

const data = {
  teams: [
    {
      name: "Complia 1",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
    {
      name: "Complia 2",
      logo: AudioWaveform,
      plan: "Startup",
    },
    {
      name: "Complia 3",
      logo: Command,
      plan: "Free",
    },
  ],
}

const createNavItems = (routes: SidebarRoute[] = []) => {
  return routes
    .map((route) => {
      const childItems = (route.child ?? [])
        .map((child) => {
          const childTitle = child.sidebarProps?.displayText
          if (!child.path || !childTitle) return null

          return {
            title: childTitle,
            url: child.path,
          }
        })
        .filter(Boolean) as { title: string; url: string }[]

      const ownTitle = route.sidebarProps?.displayText
      const ownPath = route.path

      if (!ownTitle) return null
      if (!ownPath && childItems.length === 0) return null

      return {
        title: ownTitle,
        url: ownPath ?? childItems[0].url,
        icon: route.sidebarProps?.icon,
        items: childItems.length > 0 ? childItems : undefined,
      }
    })
    .filter(Boolean) as {
      title: string
      url: string
      icon?: React.ReactNode
      items?: { title: string; url: string }[]
    }[]
}

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  routes?: SidebarRoute[]
}

export function AppSidebar({ routes = [], ...props }: AppSidebarProps) {
  const navMainItems = React.useMemo(() => createNavItems(routes), [routes])
  const userData = useAppSelector((state) => state.user.data)
  const userName = typeof userData.name === "string" && userData.name.trim() ? userData.name : "User"
  const userEmail =
    typeof userData.email === "string" && userData.email.trim()
      ? userData.email
      : "No email available"
  const userAvatar =
    typeof userData.avatar === "string" && userData.avatar.trim() ? userData.avatar : ""
  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-sidebar-border bg-sidebar text-sidebar-foreground"
      {...props}
    >
      <SidebarHeader className="gap-2 border-b border-sidebar-border px-2 py-2">
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent className="px-2 py-2">
        <NavMain items={navMainItems} />
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border px-2 py-2">
        <NavUser
          user={{
            name: userName,
            email: userEmail,
            avatar: userAvatar
          }}
        />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
