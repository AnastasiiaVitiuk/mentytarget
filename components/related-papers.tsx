import { FileText } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { Paper } from "@/lib/targets-data"

export function RelatedPapers({ papers }: { papers: Paper[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Related Papers</CardTitle>
        <CardDescription>
          Recent literature linked to the top-ranked targets
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="flex flex-col">
          {papers.map((paper, index) => (
            <li
              key={paper.title}
              className={
                index > 0 ? "border-t border-border pt-4 mt-4" : undefined
              }
            >
              <div className="flex gap-3">
                <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground">
                  <FileText className="size-4" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <p className="text-sm font-medium leading-snug text-foreground text-pretty">
                    {paper.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {paper.journal} · {paper.year}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {paper.targets.map((target) => (
                      <Badge
                        key={target}
                        variant="secondary"
                        className="font-mono text-[11px]"
                      >
                        {target}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
