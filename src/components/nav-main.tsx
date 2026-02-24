import { ChevronRight } from "lucide-react"
import { Link, useLocation } from "react-router-dom"
import type { ReactNode } from "react"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: ReactNode
    isActive?: boolean
    items?: {
      title: string
      url: string
    }[]
  }[]
}) {
  const location = useLocation()
  const matchesPath = (path: string) =>
    location.pathname === path || location.pathname.startsWith(`${path}/`)

  const getActiveState = (item: {
    url: string
    items?: {
      title: string
      url: string
    }[]
  }) => {
    const childItems = item.items ?? []
    const isItemActive = matchesPath(item.url)
    const isChildActive = childItems.some((subItem) => matchesPath(subItem.url))

    return {
      childItems,
      hasChildren: childItems.length > 0,
      isItemActive,
      isChildActive,
      isActive: isItemActive || isChildActive,
    }
  }

  return (
    <SidebarGroup className="px-0">
      <SidebarGroupLabel className="hidden">Main Menu</SidebarGroupLabel>
      <SidebarMenu className="gap-1">
        {items.map((item) => {
          const { childItems, hasChildren, isItemActive, isActive } = getActiveState(item)

          return hasChildren ? (
            <Collapsible
              key={`${item.title}-${item.url}`}
              asChild
              defaultOpen={item.isActive || isActive}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton
                    tooltip={item.title}
                    isActive={isActive}
                    className="h-10 rounded-none border border-transparent px-2 text-[16px] font-normal text-zinc-700 transition-colors hover:bg-zinc-200/70 hover:text-zinc-900 data-[active=true]:bg-[#f7eeeb] data-[active=true]:text-[#ff5100] data-[active=true]:shadow-[inset_3px_0_0_0_#ff5100] dark:text-zinc-300 dark:hover:bg-zinc-900 dark:hover:text-zinc-100 dark:data-[active=true]:bg-zinc-900/80 dark:data-[active=true]:text-orange-400"
                  >
                    <span className="inline-flex size-5 items-center justify-center text-current [&>svg]:size-4 [&>svg]:shrink-0">
                      {item.icon}
                    </span>
                    <span>{item.title}</span>
                    <ChevronRight className="ml-auto size-4 opacity-70 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub className="ml-7 mt-1 border-l border-zinc-300 pl-2 dark:border-zinc-700">
                    {childItems.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.title}>
                        <SidebarMenuSubButton
                          asChild
                          isActive={matchesPath(subItem.url)}
                          className="h-8 rounded-sm px-2 text-[14px] text-zinc-600 transition-colors hover:bg-zinc-200/70 hover:text-zinc-900 data-[active=true]:bg-[#f7eeeb] data-[active=true]:text-[#ff5100] dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100 dark:data-[active=true]:bg-zinc-900/80 dark:data-[active=true]:text-orange-400"
                        >
                          <Link to={subItem.url}>
                            <span>{subItem.title}</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          ) : (
            <SidebarMenuItem key={`${item.title}-${item.url}`}>
              <SidebarMenuButton
                asChild
                isActive={isItemActive}
                tooltip={item.title}
                className="h-10 rounded-none border border-transparent px-2 text-[16px] font-normal text-zinc-700 transition-colors hover:bg-zinc-200/70 hover:text-zinc-900 data-[active=true]:bg-[#f7eeeb] data-[active=true]:text-[#ff5100] data-[active=true]:shadow-[inset_3px_0_0_0_#ff5100] dark:text-zinc-300 dark:hover:bg-zinc-900 dark:hover:text-zinc-100 dark:data-[active=true]:bg-zinc-900/80 dark:data-[active=true]:text-orange-400"
              >
                <Link to={item.url}>
                  <span className="inline-flex size-5 items-center justify-center text-current [&>svg]:size-4 [&>svg]:shrink-0">
                    {item.icon}
                  </span>
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
