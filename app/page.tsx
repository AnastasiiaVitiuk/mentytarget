import { AppProvider } from "@/components/app-store"
import { DashboardShell } from "@/components/dashboard-shell"

export default function Page() {
  return (
    <AppProvider>
      <DashboardShell />
    </AppProvider>
  )
}
