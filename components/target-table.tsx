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
    score >= 0.85 ? "bg-chart-1" : score >= 0.7 ? "bg-chart-2" : "bg-chart-3"
  return (
    <div className="flex items-center gap-3">
      <div className="bg-muted h-2 w-28 overflow-hidden rounded-full">
        <div
          className={cn("h-full rounded-full", tone)}
          style={{ width: `${Math.round(score * 100)}%` }}
        />
      </div>
      <span className="text-foreground font-mono text-sm tabular-nums">
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
          className={
            evidenceStyles[e.datatype] ??
            "bg-muted text-muted-foreground border-transparent"
          }
        >
          {e.datatype.replace(/_/g, " ")}
        </Badge>
      ))}
    </div>
  )
}

export function TargetTable({ targets }: { targets: RankedTarget[] }) {
  const sorted = [...targets].sort((a, b) => b.score - a.score)

  return (
    <div className="overflow-hidden rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="w-[30%]">Target</TableHead>
            <TableHead className="w-[20%]">Score</TableHead>
            <TableHead className="w-[15%]">Tractability</TableHead>
            <TableHead className="w-[35%]">Evidence</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((target) => (
            <TableRow key={target.target_id}>
              <TableCell>
                <div className="flex flex-col">
                  <span className="text-foreground font-mono text-sm font-semibold">
                    {target.symbol}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {target.name}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <ScoreBar score={target.score} />
              </TableCell>
              <TableCell>
                <span className="text-muted-foreground font-mono text-sm tabular-nums">
                  {target.tractability.toFixed(2)}
                </span>
              </TableCell>
              <TableCell>
                <EvidenceBadges evidence={target.evidence} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
