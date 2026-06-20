"use client"

import { Search, FileText, Settings, Dna } from "lucide-react"

import { useApp, type Page } from "@/components/app-store"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"

const navItems: { title: string; page: Page; icon: typeof Search }[] = [
  { title: "Search", page: "search", icon: Search },
  { title: "Reports", page: "reports", icon: FileText },
  { title: "Settings", page: "settings", icon: Settings },
]

export function AppSidebar() {
  const { page, navigate } = useApp()

  return (
    <Sidebar>
      <SidebarHeader className="border-sidebar-border border-b">
        <button
          type="button"
          onClick={() => navigate("search")}
          aria-label="Go to search"
          className="hover:bg-sidebar-accent flex items-center gap-2 rounded-lg px-2 py-3 text-left transition-colors"
        >
          <div className="bg-primary text-primary-foreground flex size-9 items-center justify-center rounded-lg">
            <Dna className="size-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-sidebar-foreground text-base leading-tight font-semibold">
              MentyTarget
            </span>
            <span className="text-muted-foreground text-xs">
              Target Discovery
            </span>
          </div>
        </button>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Platform</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    isActive={page === item.page}
                    tooltip={item.title}
                    onClick={() => navigate(item.page)}
                  >
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
