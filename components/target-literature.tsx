"use client"

import useSWR from "swr"
import { BookOpen, ExternalLink, Quote } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { fetchTargetLiterature } from "@/lib/literature"

export function TargetLiterature({
  symbol,
  disease,
}: {
  symbol: string
  disease?: string
}) {
  const { data, error, isLoading } = useSWR(
    ["literature", symbol, disease ?? ""],
    () => fetchTargetLiterature(symbol, disease),
  )

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <BookOpen className="size-4 text-primary" />
          <h3 className="text-base font-semibold text-foreground">
            Related literature
          </h3>
        </div>
        {data && data.length > 0 && (
          <Badge variant="secondary">{data.length} recent</Badge>
        )}
      </div>
      <p className="text-sm text-muted-foreground">
        Recent peer-reviewed publications mentioning {symbol}
        {disease ? ` in ${disease}` : ""}, sourced live from Europe PMC. Select
        one to read the full record.
      </p>

      {isLoading && (
        <div className="flex flex-col gap-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-[72px] w-full rounded-lg" />
          ))}
        </div>
      )}

      {error && (
        <p className="rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
          Could not load literature for this target.
        </p>
      )}

      {data && data.length === 0 && (
        <p className="rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
          No indexed publications were found for {symbol}
          {disease ? ` in ${disease}` : ""} yet.
        </p>
      )}

      {data && data.length > 0 && (
        <ul className="flex flex-col gap-2">
          {data.map((article) => (
            <li key={article.id}>
              <a
                href={article.url}
                target="_blank"
                rel="noreferrer"
                className="group flex w-full items-start gap-4 rounded-lg border bg-card px-4 py-3 transition-colors hover:border-primary/40 hover:bg-accent"
              >
                <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Quote className="size-4" />
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="text-sm leading-snug font-medium text-foreground text-pretty">
                    {article.title}
                  </span>
                  {article.authors && (
                    <span className="truncate text-xs text-muted-foreground">
                      {article.authors}
                    </span>
                  )}
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    {article.journal && (
                      <Badge variant="outline" className="font-normal">
                        {article.journal}
                      </Badge>
                    )}
                    {article.year && (
                      <Badge variant="secondary">{article.year}</Badge>
                    )}
                    {article.citedByCount != null &&
                      article.citedByCount > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {article.citedByCount} citation
                          {article.citedByCount === 1 ? "" : "s"}
                        </span>
                      )}
                  </div>
                </div>
                <ExternalLink className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
