"use client"

import * as React from "react"
import { FileText, Lock, Sparkles } from "lucide-react"

import { useApp } from "@/components/app-store"
import { DocumentView } from "@/components/document-view"
// import { RelatedPapers } from "@/components/related-papers"
import { TargetDetail } from "@/components/target-detail"
import { TargetTable } from "@/components/target-table"
import type { RankedTarget } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function ResultsPage() {
  const {
    result,
    usedProprietaryData,
    documentReady,
    generateDocument,
    navigate,
  } = useApp()
  const [tab, setTab] = React.useState(documentReady ? "document" : "raw")
  const [selected, setSelected] = React.useState<RankedTarget | null>(null)
  const [topN, setTopN] = React.useState("50")

  const totalTargets = result?.targets.length ?? 0

  // Build the "Show top N" options from what's actually available, capped at
  // the fetched pool size. "all" always reflects the full result set.
  const topNOptions = React.useMemo(() => {
    const presets = [10, 25, 50, 100]
    return presets.filter((n) => n < totalTargets)
  }, [totalTargets])

  // If the current selection isn't a valid option (e.g. a disease with fewer
  // targets than the default 50), fall back to showing all.
  const effectiveTopN =
    topN === "all" || topNOptions.includes(Number(topN)) ? topN : "all"

  // Slice client-side so changing N is instant (no re-fetch). Both the table
  // and the generated document consume this same sliced list.
  const visibleTargets = React.useMemo(() => {
    if (!result) return []
    if (effectiveTopN === "all") return result.targets
    return result.targets.slice(0, Number(effectiveTopN))
  }, [result, effectiveTopN])

  const slicedResult = React.useMemo(
    () => (result ? { ...result, targets: visibleTargets } : result),
    [result, visibleTargets],
  )

  function handleGenerate() {
    generateDocument()
    setTab("document")
  }

  if (!result) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-col items-center gap-4 py-16 text-center">
        <p className="text-muted-foreground text-sm">
          No analysis yet. Start by searching a disease.
        </p>
        <Button onClick={() => navigate("search")}>Go to Search</Button>
      </div>
    )
  }

  if (selected) {
    return (
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <TargetDetail
          target={selected}
          disease={result.disease_label}
          onBack={() => setSelected(null)}
        />
      </div>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-foreground text-xl font-semibold tracking-tight">
            {result.disease_label}
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">
              {visibleTargets.length === totalTargets
                ? `${totalTargets} targets`
                : `Top ${visibleTargets.length} of ${totalTargets} targets`}
            </Badge>
            {usedProprietaryData && (
              <Badge variant="outline">+ proprietary data</Badge>
            )}
            {result.model === "demo-fallback" && (
              <Badge
                variant="outline"
                className="border-chart-3/40 text-chart-3"
              >
                Demo data
              </Badge>
            )}
          </div>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="raw">Raw Data</TabsTrigger>
          <TabsTrigger value="document">
            {!documentReady && <Lock className="size-3.5" />}
            Document
          </TabsTrigger>
        </TabsList>

        <TabsContent value="raw" className="flex flex-col gap-6 pt-2">
          <Card>
            <CardHeader className="flex-row flex-wrap items-center justify-between gap-4">
              <div className="flex flex-col gap-1">
                <CardTitle>Prioritized Targets</CardTitle>
                <CardDescription>
                  Ranked by association score, highest first. Select a target to
                  explore its 3D structure and suggested drugs.
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Label
                  htmlFor="topn-select"
                  className="text-muted-foreground text-sm whitespace-nowrap"
                >
                  Show top
                </Label>
                <Select value={effectiveTopN} onValueChange={setTopN}>
                  <SelectTrigger id="topn-select" className="h-9 w-28">
                    <SelectValue>
                      {(value: string) =>
                        value === "all" ? `All (${totalTargets})` : value
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {topNOptions.map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {n}
                      </SelectItem>
                    ))}
                    <SelectItem value="all">All ({totalTargets})</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <TargetTable
                targets={visibleTargets}
                disease={result.disease_label}
                onSelect={setSelected}
              />
            </CardContent>
          </Card>

          {/* <RelatedPapers papers={result.papers} /> */}

          <div className="flex justify-end">
            <Button size="lg" onClick={handleGenerate}>
              <Sparkles data-icon="inline-start" />
              Generate Document
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="document" className="pt-2">
          {documentReady ? (
            <DocumentView result={slicedResult!} />
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
                <div className="bg-primary/10 text-primary flex size-12 items-center justify-center rounded-full">
                  <FileText className="size-6" />
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-foreground text-sm font-medium">
                    No document generated yet
                  </p>
                  <p className="text-muted-foreground max-w-sm text-sm">
                    Generate a narrative report from the Raw Data tab to
                    synthesize targets and literature into a shareable document.
                  </p>
                </div>
                <Button onClick={handleGenerate}>
                  <Sparkles data-icon="inline-start" />
                  Generate Document
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
