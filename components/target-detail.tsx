"use client"

import useSWR from "swr"
import { ArrowLeft, Atom, ExternalLink, Loader2 } from "lucide-react"

import { ProteinViewer } from "@/components/protein-viewer"
import { SuggestedDrugs } from "@/components/suggested-drugs"
import { TargetLiterature } from "@/components/target-literature"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import type { RankedTarget } from "@/lib/api"
import { fetchPdbText, fetchProteinInfo } from "@/lib/structure"

function StructurePanel({ symbol }: { symbol: string }) {
  const {
    data: info,
    error: infoError,
    isLoading: infoLoading,
  } = useSWR(["protein", symbol], () => fetchProteinInfo(symbol))

  const { data: pdbText, error: pdbError } = useSWR(
    info ? ["pdb", info.pdbUrl] : null,
    () => fetchPdbText(info!.pdbUrl),
  )

  if (infoLoading) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="aspect-[4/3] w-full rounded-lg" />
        <Skeleton className="h-8 w-1/2" />
      </div>
    )
  }

  if (infoError || !info) {
    return (
      <div className="flex aspect-[4/3] flex-col items-center justify-center gap-2 rounded-lg border border-dashed text-center text-sm text-muted-foreground">
        <Atom className="size-6" />
        <span className="font-medium text-foreground">
          No structure available
        </span>
        <span className="max-w-xs">
          We couldn&apos;t resolve a reviewed human structure for {symbol}.
        </span>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {pdbText ? (
        <ProteinViewer pdbText={pdbText} />
      ) : pdbError ? (
        <div className="flex aspect-[4/3] flex-col items-center justify-center gap-2 rounded-lg border border-dashed text-center text-sm text-muted-foreground">
          <Atom className="size-6" />
          Structure model could not be downloaded.
        </div>
      ) : (
        <div className="flex aspect-[4/3] flex-col items-center justify-center gap-2 rounded-lg border bg-[#0b1120] text-sm text-slate-300">
          <Loader2 className="size-5 animate-spin" />
          Loading AlphaFold model…
        </div>
      )}

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span>
          UniProt{" "}
          <a
            href={info.uniProtUrl}
            target="_blank"
            rel="noreferrer"
            className="font-mono text-primary hover:underline"
          >
            {info.accession}
          </a>
        </span>
        {info.sequenceLength && <span>{info.sequenceLength} aa</span>}
        <a
          href={info.alphaFoldUrl}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1 text-primary hover:underline"
        >
          AlphaFold entry
          <ExternalLink className="size-3" />
        </a>
      </div>
    </div>
  )
}

function DescriptionPanel({
  target,
  symbol,
}: {
  target: RankedTarget
  symbol: string
}) {
  const { data: info, isLoading } = useSWR(["protein", symbol], () =>
    fetchProteinInfo(symbol),
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-semibold text-foreground">
          Target area &amp; function
        </h3>
        {isLoading ? (
          <div className="flex flex-col gap-2 pt-1">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ) : info?.functionText ? (
          <p className="text-sm leading-relaxed text-foreground">
            {info.functionText}
          </p>
        ) : (
          <p className="text-sm leading-relaxed text-muted-foreground">
            {target.name} is a prioritized target. A curated functional summary
            is not available from UniProt for this entry.
          </p>
        )}
      </div>

      {target.explanation && (
        <>
          <Separator />
          <div className="flex flex-col gap-1">
            <h3 className="text-sm font-semibold text-foreground">
              Why it was prioritized
            </h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {target.explanation}
            </p>
          </div>
        </>
      )}

      <Separator />
      <div className="grid grid-cols-2 gap-3">
        <Metric label="Association score" value={target.score.toFixed(2)} />
        <Metric label="Tractability" value={target.tractability.toFixed(2)} />
        <Metric
          label="Overall association"
          value={target.overall_association.toFixed(2)}
        />
        <Metric label="Rank" value={`#${target.rank}`} />
      </div>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-md border bg-muted/40 px-3 py-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="font-mono text-base tabular-nums text-foreground">
        {value}
      </span>
    </div>
  )
}

export function TargetDetail({
  target,
  disease,
  onBack,
}: {
  target: RankedTarget
  disease?: string
  onBack: () => void
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="-ml-2 w-fit"
        >
          <ArrowLeft data-icon="inline-start" />
          Back to targets
        </Button>

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <h2 className="font-mono text-2xl font-semibold tracking-tight text-foreground">
                {target.symbol}
              </h2>
              <Badge variant="secondary">Rank #{target.rank}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">{target.name}</p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Atom className="size-4 text-primary" />
            3D structure &amp; target area
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
          <StructurePanel symbol={target.symbol} />
          <DescriptionPanel target={target} symbol={target.symbol} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <SuggestedDrugs symbol={target.symbol} targetId={target.target_id} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <TargetLiterature symbol={target.symbol} disease={disease} />
        </CardContent>
      </Card>
    </div>
  )
}
