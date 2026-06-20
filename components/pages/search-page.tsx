"use client"

import * as React from "react"
import { ChevronDown, FlaskConical, Search } from "lucide-react"

import { useApp } from "@/components/app-store"
import { DataUpload } from "@/components/data-upload"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

const EXAMPLES = [
  "Major depressive disorder",
  "Schizophrenia",
  "Bipolar disorder",
  "Autism spectrum disorder",
]

export function SearchPage() {
  const { runAnalysis } = useApp()
  const [query, setQuery] = React.useState("")
  const [file, setFile] = React.useState<File | null>(null)
  const [open, setOpen] = React.useState(false)

  function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!query.trim()) return
    runAnalysis(query, file)
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div className="flex flex-col gap-2 text-center">
        <h2 className="text-foreground text-2xl font-semibold tracking-tight text-balance">
          Identify therapeutic targets for psychiatric disorders
        </h2>
        <p className="text-muted-foreground text-sm text-pretty">
          Search a disease to surface AI-prioritized targets, ranked by
          multi-omic evidence and supporting literature.
        </p>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-5 pt-6">
          <form onSubmit={submit} className="flex flex-col gap-3">
            <div className="relative">
              <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search a disease (e.g. depression, schizophrenia)"
                className="h-12 pl-9 text-base"
                aria-label="Search a disease"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {EXAMPLES.map((example) => (
                <button
                  key={example}
                  type="button"
                  onClick={() => setQuery(example)}
                  className="border-border bg-secondary/50 text-secondary-foreground hover:border-primary/40 hover:bg-accent rounded-full border px-3 py-1 text-xs font-medium transition-colors"
                >
                  {example}
                </button>
              ))}
            </div>

            <Collapsible open={open} onOpenChange={setOpen}>
              <CollapsibleTrigger
                render={
                  <button
                    type="button"
                    className="border-border bg-secondary/40 text-foreground hover:bg-accent/50 flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left text-sm font-medium transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <FlaskConical className="text-primary size-4" />
                      Add your own proprietary data
                      <span className="text-muted-foreground text-xs font-normal">
                        (optional)
                      </span>
                    </span>
                    <ChevronDown
                      className={cn(
                        "text-muted-foreground size-4 transition-transform",
                        open && "rotate-180",
                      )}
                    />
                  </button>
                }
              />
              <CollapsibleContent className="pt-3">
                <DataUpload file={file} onFileChange={setFile} />
              </CollapsibleContent>
            </Collapsible>

            <Button
              type="submit"
              size="lg"
              className="h-12 text-base"
              disabled={!query.trim()}
            >
              <FlaskConical data-icon="inline-start" />
              Analyze
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
