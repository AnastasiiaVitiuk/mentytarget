import { ChevronRight, ExternalLink } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import type { RankedTarget } from "@/lib/api"

function ScoreBar({ score }: { score: number }) {
  const tone =
    score >= 0.85
      ? "bg-chart-1"
      : score >= 0.7
        ? "bg-chart-2"
        : "bg-chart-3"
  return (
    <div className="flex items-center gap-3">
      <div className="h-2 w-28 overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full", tone)}
          style={{ width: `${Math.round(score * 100)}%` }}
        />
      </div>
      <span className="font-mono text-sm tabular-nums text-foreground">
        {score.toFixed(2)}
      </span>
    </div>
  )
}

const evidenceStyles: Record<string, string> = {
  genetic_association: "border-transparent bg-chart-1/15 text-chart-1",
  literature: "border-transparent bg-chart-4/15 text-chart-4",
  animal_model: "border-transparent bg-chart-2/15 text-chart-2",
  somatic_mutation: "border-transparent bg-chart-3/15 text-chart-3",
}

function EvidenceBadges({ evidence }: { evidence: RankedTarget["evidence"] }) {
  return (
    <div className="flex flex-wrap gap-1">
      {evidence.map((e) => (
        <Badge
          key={e.datatype}
          variant="outline"
          className={evidenceStyles[e.datatype] ?? "border-transparent bg-muted text-muted-foreground"}
        >
          {e.datatype.replace(/_/g, " ")}
        </Badge>
      ))}
    </div>
  )
}

function LiteratureLinks({ literature }: { literature: RankedTarget["literature"] }) {
  if (!literature || literature.length === 0) {
    return <span className="text-xs text-muted-foreground">—</span>
  }
  return (
    <div className="flex flex-col gap-1">
      {literature.map((lit) => (
        <a
          key={lit.pubmed_id}
          href={`https://pubmed.ncbi.nlm.nih.gov/${lit.pubmed_id}/`}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-1 text-xs text-primary hover:underline"
        >
          PMID {lit.pubmed_id}
          {lit.year ? ` (${lit.year})` : ""}
          <ExternalLink className="size-3" />
        </a>
      ))}
    </div>
  )
}

export function TargetTable({
  targets,
  onSelect,
}: {
  targets: RankedTarget[]
  onSelect?: (target: RankedTarget) => void
}) {
  const sorted = [...targets].sort((a, b) => b.score - a.score)

  return (
    <div className="overflow-hidden rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="w-[22%]">Target</TableHead>
            <TableHead className="w-[15%]">Score</TableHead>
            <TableHead className="w-[11%]">Tractability</TableHead>
            <TableHead className="w-[23%]">Evidence</TableHead>
            <TableHead className="w-[22%]">Literature</TableHead>
            <TableHead className="w-[7%]" aria-label="Open detail" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((target) => (
            <TableRow
              key={target.target_id}
              onClick={() => onSelect?.(target)}
              tabIndex={onSelect ? 0 : undefined}
              role={onSelect ? "button" : undefined}
              onKeyDown={(e) => {
                if (onSelect && (e.key === "Enter" || e.key === " ")) {
                  e.preventDefault()
                  onSelect(target)
                }
              }}
              className={cn(
                onSelect &&
                  "cursor-pointer transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-none",
              )}
            >
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-mono text-sm font-semibold text-foreground">
                    {target.symbol}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {target.name}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <ScoreBar score={target.score} />
              </TableCell>
              <TableCell>
                <span className="font-mono text-sm tabular-nums text-muted-foreground">
                  {target.tractability.toFixed(2)}
                </span>
              </TableCell>
              <TableCell>
                <EvidenceBadges evidence={target.evidence} />
              </TableCell>
              <TableCell>
                <LiteratureLinks literature={target.literature} />
              </TableCell>
              <TableCell>
                {onSelect && (
                  <ChevronRight className="size-4 text-muted-foreground" />
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
