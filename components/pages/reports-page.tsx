"use client"

import { ChevronRight, FileText, FolderOpen } from "lucide-react"

import { useApp } from "@/components/app-store"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export function ReportsPage() {
  const { savedReports, openReport, navigate } = useApp()

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-foreground text-xl font-semibold tracking-tight">
          Saved Reports
        </h2>
        <p className="text-muted-foreground text-sm">
          Documents you have generated and saved from your analyses.
        </p>
      </div>

      {savedReports.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
            <div className="bg-primary/10 text-primary flex size-12 items-center justify-center rounded-full">
              <FolderOpen className="size-6" />
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-foreground text-sm font-medium">
                No saved reports yet
              </p>
              <p className="text-muted-foreground max-w-sm text-sm">
                Run an analysis, generate a document, and save it to find it
                here.
              </p>
            </div>
            <Button onClick={() => navigate("search")}>New Analysis</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {savedReports.map((report) => (
            <Card key={report.id}>
              <CardContent className="flex items-center gap-4 py-4">
                <div className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-lg">
                  <FileText className="size-5" />
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <p className="text-foreground truncate text-sm font-medium">
                    {report.disease}
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-muted-foreground text-xs">
                      {formatDate(report.generatedAt)}
                    </span>
                    <Badge variant="secondary">
                      {report.result.targets.length} targets
                    </Badge>
                    {report.usedProprietaryData && (
                      <Badge variant="outline">proprietary data</Badge>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openReport(report.id)}
                >
                  Open
                  <ChevronRight data-icon="inline-end" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}
