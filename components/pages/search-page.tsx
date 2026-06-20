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
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

const EXAMPLES = [
  "Major depressive disorder",
  "Schizophrenia",
  "Bipolar disorder",
  "Autism spectrum disorder",
]

const MODALITIES = [
  { value: "small_molecule", label: "Small Molecule" },
  { value: "antibody", label: "Antibody" },
  { value: "protac", label: "PROTAC" },
  { value: "other", label: "Other" },
] as const

export function SearchPage() {
  const { runAnalysis } = useApp()
  const [query, setQuery] = React.useState("")
  const [file, setFile] = React.useState<File | null>(null)
  const [open, setOpen] = React.useState(false)
  const [modality, setModality] = React.useState<string | null>("small_molecule")

  function submit(event: React.FormEvent) {
  event.preventDefault()
  if (!query.trim()) return
  runAnalysis(query, file, modality ?? "small_molecule")
}

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div className="flex flex-col gap-2 text-center">
        <h2 className="text-2xl font-semibold tracking-tight text-balance text-foreground">
          Identify therapeutic targets for psychiatric disorders
        </h2>
        <p className="text-pretty text-sm text-muted-foreground">
          Search a disease to surface AI-prioritized targets, ranked by
          multi-omic evidence and supporting literature.
        </p>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-5 pt-6">
          <form onSubmit={submit} className="flex flex-col gap-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
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
                  className="rounded-full border border-border bg-secondary/50 px-3 py-1 text-xs font-medium text-secondary-foreground transition-colors hover:border-primary/40 hover:bg-accent"
                >
                  {example}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="modality-select" className="text-sm font-medium">
                Modality
              </Label>
              <Select value={modality ?? "small_molecule"} onValueChange={setModality}>
                <SelectTrigger id="modality-select" className="h-11">
                  <SelectValue placeholder="Select a modality" />
                </SelectTrigger>
                <SelectContent>
                  {MODALITIES.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Targets will be ranked by tractability for this treatment type.
              </p>
            </div>

            <Collapsible open={open} onOpenChange={setOpen}>
              <CollapsibleTrigger
                render={
                  <button
                    type="button"
                    className="flex w-full items-center justify-between rounded-lg border border-border bg-secondary/40 px-4 py-3 text-left text-sm font-medium text-foreground transition-colors hover:bg-accent/50"
                  >
                    <span className="flex items-center gap-2">
                      <FlaskConical className="size-4 text-primary" />
                      Add your own proprietary data
                      <span className="text-xs font-normal text-muted-foreground">
                        (optional)
                      </span>
                    </span>
                    <ChevronDown
                      className={cn(
                        "size-4 text-muted-foreground transition-transform",
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