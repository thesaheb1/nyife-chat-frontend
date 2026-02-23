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
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
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

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMainItems} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
