"use client"

import * as React from "react"
import useSWR from "swr"
import {
  AlertTriangle,
  ChevronRight,
  ExternalLink,
  FlaskConical,
  Loader2,
  Pill,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import {
  fetchDrugDetail,
  fetchKnownDrugs,
  stageLabel,
  stageRank,
  type DrugDetail,
  type KnownDrug,
} from "@/lib/opentargets"
import { cn } from "@/lib/utils"

function stageTone(stage: string | null): string {
  const rank = stageRank(stage)
  if (rank >= 4.5) return "border-transparent bg-chart-1/15 text-chart-1"
  if (rank >= 3) return "border-transparent bg-chart-2/15 text-chart-2"
  if (rank > 0) return "border-transparent bg-chart-3/15 text-chart-3"
  return "border-transparent bg-muted text-muted-foreground"
}

function DrugDetailBody({ chemblId }: { chemblId: string }) {
  const { data, error, isLoading } = useSWR<DrugDetail>(
    ["drug", chemblId],
    () => fetchDrugDetail(chemblId),
  )

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3 px-4">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <p className="px-4 text-sm text-muted-foreground">
        Could not load details for this drug.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-5 px-4 pb-8">
      <div className="flex flex-wrap gap-2">
        <Badge className={stageTone(data.maximumClinicalStage)}>
          {stageLabel(data.maximumClinicalStage)}
        </Badge>
        {data.drugType && <Badge variant="secondary">{data.drugType}</Badge>}
        {data.hasBeenWithdrawn && (
          <Badge variant="outline" className="text-chart-3">
            Withdrawn
          </Badge>
        )}
        {data.blackBoxWarning && (
          <Badge variant="outline" className="text-chart-3">
            <AlertTriangle data-icon="inline-start" />
            Black box warning
          </Badge>
        )}
      </div>

      {data.description && (
        <p className="text-sm leading-relaxed text-foreground">
          {data.description}
        </p>
      )}

      {data.mechanisms.length > 0 && (
        <section className="flex flex-col gap-2">
          <h4 className="text-sm font-semibold text-foreground">
            Mechanism of action
          </h4>
          <ul className="flex flex-col gap-2">
            {data.mechanisms.map((m, i) => (
              <li
                key={i}
                className="rounded-md border bg-muted/40 px-3 py-2 text-sm text-foreground"
              >
                {m.mechanismOfAction}
                {m.actionType && (
                  <span className="text-muted-foreground">
                    {" "}
                    ({m.actionType.toLowerCase()})
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {data.indications.length > 0 && (
        <section className="flex flex-col gap-2">
          <h4 className="text-sm font-semibold text-foreground">
            Indications
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {data.indications.map((ind, i) => (
              <Badge key={i} variant="outline" className="font-normal">
                {ind.name}
              </Badge>
            ))}
          </div>
        </section>
      )}

      {data.tradeNames.length > 0 && (
        <section className="flex flex-col gap-1">
          <h4 className="text-sm font-semibold text-foreground">Trade names</h4>
          <p className="text-sm text-muted-foreground">
            {data.tradeNames.join(", ")}
          </p>
        </section>
      )}

      <Separator />

      <a
        href={data.chemblUrl}
        target="_blank"
        rel="noreferrer"
        className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
      >
        View {data.id} on ChEMBL
        <ExternalLink className="size-3.5" />
      </a>
    </div>
  )
}

function DrugRow({
  drug,
  onClick,
}: {
  drug: KnownDrug
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center gap-4 rounded-lg border bg-card px-4 py-3 text-left transition-colors hover:border-primary/40 hover:bg-accent"
    >
      <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
        <Pill className="size-4" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-semibold text-foreground">
          {drug.prefName}
        </span>
        <span className="truncate text-xs text-muted-foreground">
          {drug.mechanismOfAction ?? drug.drugType ?? "Investigational compound"}
        </span>
      </div>
      <Badge className={cn("shrink-0", stageTone(drug.stage))}>
        {stageLabel(drug.stage)}
      </Badge>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </button>
  )
}

export function SuggestedDrugs({
  symbol,
  targetId,
}: {
  symbol: string
  targetId: string
}) {
  const { data, error, isLoading } = useSWR(
    ["knownDrugs", symbol, targetId],
    () => fetchKnownDrugs(symbol, targetId),
  )
  const [openDrug, setOpenDrug] = React.useState<KnownDrug | null>(null)

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <FlaskConical className="size-4 text-primary" />
          <h3 className="text-base font-semibold text-foreground">
            Suggested drugs
          </h3>
        </div>
        {data && (
          <Badge variant="secondary">
            {data.count} known compound{data.count === 1 ? "" : "s"}
          </Badge>
        )}
      </div>
      <p className="text-sm text-muted-foreground">
        Clinically tested and approved compounds acting on {symbol}, sourced
        from the Open Targets Platform. Select one to learn more.
      </p>

      {isLoading && (
        <div className="flex flex-col gap-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-[58px] w-full rounded-lg" />
          ))}
        </div>
      )}

      {error && (
        <p className="rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
          Could not load drugs for this target.
        </p>
      )}

      {data && data.drugs.length === 0 && (
        <p className="rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
          No known drugs are recorded for {symbol} yet. This may represent a
          novel, undrugged opportunity.
        </p>
      )}

      {data && data.drugs.length > 0 && (
        <div className="flex flex-col gap-2">
          {data.drugs.map((drug) => (
            <DrugRow
              key={drug.drugId}
              drug={drug}
              onClick={() => setOpenDrug(drug)}
            />
          ))}
        </div>
      )}

      <Sheet
        open={openDrug != null}
        onOpenChange={(open) => !open && setOpenDrug(null)}
      >
        <SheetContent className="w-full gap-4 overflow-y-auto sm:max-w-md">
          {openDrug && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <Pill className="size-4 text-primary" />
                  {openDrug.prefName}
                </SheetTitle>
                <SheetDescription>
                  Acts on {symbol}
                  {openDrug.diseaseName ? ` · studied in ${openDrug.diseaseName}` : ""}
                </SheetDescription>
              </SheetHeader>
              <DrugDetailBody chemblId={openDrug.drugId} />
            </>
          )}
        </SheetContent>
      </Sheet>
    </section>
  )
}
