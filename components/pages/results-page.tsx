"use client"

import * as React from "react"
import { FileText, Lock, Sparkles } from "lucide-react"

import { useApp } from "@/components/app-store"
import { DocumentView } from "@/components/document-view"
import { RelatedPapers } from "@/components/related-papers"
import { TargetTable } from "@/components/target-table"
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

export function ResultsPage() {
  const {
    result,
    usedProprietaryData,
    documentReady,
    generateDocument,
    navigate,
  } = useApp()
  const [tab, setTab] = React.useState(documentReady ? "document" : "raw")

  function handleGenerate() {
    generateDocument()
    setTab("document")
  }

  if (!result) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-col items-center gap-4 py-16 text-center">
        <p className="text-sm text-muted-foreground">
          No analysis yet. Start by searching a disease.
        </p>
        <Button onClick={() => navigate("search")}>Go to Search</Button>
      </div>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            {result.disease}
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{result.targets.length} targets</Badge>
            {usedProprietaryData && (
              <Badge variant="outline">+ proprietary data</Badge>
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
            <CardHeader className="flex-row items-center justify-between gap-4">
              <div className="flex flex-col gap-1">
                <CardTitle>Prioritized Targets</CardTitle>
                <CardDescription>
                  Ranked by association score, highest first
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <TargetTable targets={result.targets} />
            </CardContent>
          </Card>

          <RelatedPapers papers={result.papers} />

          <div className="flex justify-end">
            <Button size="lg" onClick={handleGenerate}>
              <Sparkles data-icon="inline-start" />
              Generate Document
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="document" className="pt-2">
          {documentReady ? (
            <DocumentView result={result} />
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
                <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <FileText className="size-6" />
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium text-foreground">
                    No document generated yet
                  </p>
                  <p className="max-w-sm text-sm text-muted-foreground">
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
