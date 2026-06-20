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
import type { Modality, Resource, Target } from "@/lib/targets-data"

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

function ModalityBadge({ modality }: { modality: Modality }) {
  return (
    <Badge variant={modality === "Antibody" ? "outline" : "secondary"}>
      {modality}
    </Badge>
  )
}

const resourceStyles: Record<Resource, string> = {
  GWAS: "border-transparent bg-chart-1/15 text-chart-1",
  Transcriptomics: "border-transparent bg-chart-2/15 text-chart-2",
  Literature: "border-transparent bg-chart-4/15 text-chart-4",
}

function ResourceBadge({ resource }: { resource: Resource }) {
  return (
    <Badge variant="outline" className={resourceStyles[resource]}>
      {resource}
    </Badge>
  )
}

export function TargetTable({ targets }: { targets: Target[] }) {
  const sorted = [...targets].sort((a, b) => b.score - a.score)

  return (
    <div className="overflow-hidden rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="w-[34%]">Target</TableHead>
            <TableHead className="w-[26%]">Score</TableHead>
            <TableHead className="w-[20%]">Modality</TableHead>
            <TableHead className="w-[20%]">Resource</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((target) => (
            <TableRow key={target.symbol}>
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
                <ModalityBadge modality={target.modality} />
              </TableCell>
              <TableCell>
                <ResourceBadge resource={target.resource} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
