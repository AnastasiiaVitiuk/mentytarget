"use client"

import useSWR from "swr"
import { Atom, ExternalLink, Loader2 } from "lucide-react"

import { ProteinViewer } from "@/components/protein-viewer"
import { Badge } from "@/components/ui/badge"
import { fetchPdbText, fetchProteinInfo } from "@/lib/structure"

/**
 * Live 3D structure slide. Resolves a psychiatric drug target (HTR2A, the
 * serotonin 2A receptor) to its UniProt entry and AlphaFold-predicted model,
 * then renders it interactively with the production ProteinViewer component.
 */
const DEMO_SYMBOL = "HTR2A"

async function loadStructure(symbol: string) {
  const info = await fetchProteinInfo(symbol)
  const pdbText = await fetchPdbText(info.pdbUrl)
  return { info, pdbText }
}

export function StructureSlide() {
  const { data, error, isLoading } = useSWR(["pitch-structure", DEMO_SYMBOL], () =>
    loadStructure(DEMO_SYMBOL),
  )

  return (
    <div className="grid w-full max-w-6xl gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-center">
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-2">
          <span className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-lg">
            <Atom className="size-5" />
          </span>
          <span className="text-primary text-sm font-semibold tracking-wide uppercase">
            Step 4 — Structural validation
          </span>
        </div>

        <h2 className="text-foreground text-4xl font-semibold text-balance lg:text-5xl">
          From a ranked name to a druggable 3D structure
        </h2>

        <p className="text-muted-foreground text-lg leading-relaxed text-pretty">
          Every prioritized target resolves to its reviewed{" "}
          <span className="text-foreground font-medium">UniProt</span> entry and
          an{" "}
          <span className="text-foreground font-medium">
            AlphaFold-predicted structure
          </span>
          , streamed live and rendered in-browser with 3Dmol.js. Reviewers can
          rotate, zoom, switch representations, and inspect residues to assess
          binding pockets and tractability.
        </p>

        <ul className="flex flex-col gap-3">
          {[
            "UniProt REST — gene symbol → reviewed human accession",
            "AlphaFold prediction API — accession → PDB model",
            "3Dmol.js — cartoon, surface, sticks & per-residue hover",
          ].map((item) => (
            <li
              key={item}
              className="text-foreground flex items-center gap-3 text-sm"
            >
              <span className="bg-primary size-1.5 shrink-0 rounded-full" />
              {item}
            </li>
          ))}
        </ul>

        {data && (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Badge variant="secondary" className="font-mono">
              {data.info.geneSymbol}
            </Badge>
            <span className="text-muted-foreground text-sm">
              {data.info.proteinName}
            </span>
            <a
              href={data.info.alphaFoldUrl}
              target="_blank"
              rel="noreferrer"
              className="text-primary ml-auto flex items-center gap-1 text-sm font-medium hover:underline"
            >
              AlphaFold entry
              <ExternalLink className="size-3.5" />
            </a>
          </div>
        )}
      </div>

      <div className="bg-card rounded-2xl border p-4 shadow-sm">
        {isLoading && (
          <div className="text-muted-foreground flex aspect-[4/3] flex-col items-center justify-center gap-2 text-sm">
            <Loader2 className="size-5 animate-spin" />
            Resolving structure from UniProt + AlphaFold…
          </div>
        )}
        {error && (
          <div className="text-muted-foreground flex aspect-[4/3] flex-col items-center justify-center gap-1 px-6 text-center text-sm">
            <span className="text-foreground font-medium">
              Live structure unavailable
            </span>
            <span>The viewer streams from public EBI APIs at runtime.</span>
          </div>
        )}
        {data && <ProteinViewer pdbText={data.pdbText} />}
      </div>
    </div>
  )
}
