"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { useApp, type Page } from "@/components/app-store"
import { ResultsPage } from "@/components/pages/results-page"
import { ReportsPage } from "@/components/pages/reports-page"
import { SearchPage } from "@/components/pages/search-page"
import { SettingsPage } from "@/components/pages/settings-page"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

const HEADERS: Record<Page, { title: string; subtitle: string }> = {
  search: {
    title: "Target Search",
    subtitle: "AI-powered target identification for psychiatric disorders",
  },
  results: {
    title: "Analysis Results",
    subtitle: "Prioritized targets and supporting evidence",
  },
  reports: {
    title: "Reports",
    subtitle: "Your saved target identification documents",
  },
  settings: {
    title: "Settings",
    subtitle: "Account and subscription",
  },
}

export function DashboardShell() {
  const { page } = useApp()
  const header = HEADERS[page]

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-3 border-b border-border bg-card/60 px-4 backdrop-blur md:px-6">
          <SidebarTrigger />
          <div className="flex flex-col">
            <h1 className="text-sm font-semibold leading-tight text-foreground">
              {header.title}
            </h1>
            <p className="text-xs text-muted-foreground">{header.subtitle}</p>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          {page === "search" && <SearchPage />}
          {page === "results" && <ResultsPage />}
          {page === "reports" && <ReportsPage />}
          {page === "settings" && <SettingsPage />}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
