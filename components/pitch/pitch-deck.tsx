"use client"

import * as React from "react"
import {
  ArrowRight,
  Boxes,
  Brain,
  ChevronLeft,
  ChevronRight,
  Cloud,
  Database,
  Dna,
  FileText,
  FlaskConical,
  Gauge,
  GitBranch,
  Layers,
  Microscope,
  Server,
  Sparkles,
  Target,
} from "lucide-react"

import { StructureSlide } from "@/components/pitch/structure-slide"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/* ------------------------------------------------------------------ */
/* Reusable slide chrome                                               */
/* ------------------------------------------------------------------ */

function Kicker({ icon: Icon, label }: { icon: typeof Dna; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-lg">
        <Icon className="size-5" />
      </span>
      <span className="text-primary text-sm font-semibold tracking-wide uppercase">
        {label}
      </span>
    </div>
  )
}

function SlideShell({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex h-full w-full flex-col items-center justify-center px-6 py-16 md:px-12",
        className,
      )}
    >
      {children}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Slides                                                              */
/* ------------------------------------------------------------------ */

function TitleSlide() {
  return (
    <SlideShell>
      <div className="flex max-w-4xl flex-col items-center gap-8 text-center">
        <div className="bg-primary text-primary-foreground flex size-16 items-center justify-center rounded-2xl shadow-sm">
          <Dna className="size-8" />
        </div>
        <div className="flex flex-col gap-4">
          <h1 className="text-foreground text-5xl font-semibold text-balance md:text-7xl">
            MentyTarget
          </h1>
          <p className="text-muted-foreground mx-auto max-w-2xl text-xl leading-relaxed text-pretty md:text-2xl">
            AI-powered target identification for psychiatric disorders — from a
            disease name to a ranked, explainable, structurally-validated drug
            target.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {["Next.js", "FastAPI", "LightGBM", "Open Targets", "AlphaFold"].map(
            (t) => (
              <Badge key={t} variant="secondary" className="text-sm">
                {t}
              </Badge>
            ),
          )}
        </div>
        <p className="text-muted-foreground text-sm">
          Use ← / → to navigate · press F for fullscreen
        </p>
      </div>
    </SlideShell>
  )
}

function ProblemSlide() {
  const stats = [
    {
      value: "~$2.6B",
      label: "Average cost to bring one CNS drug to market",
    },
    {
      value: "12–15 yrs",
      label: "Typical timeline from target to approval",
    },
    {
      value: "<10%",
      label: "Clinical success rate for psychiatric programs",
    },
  ]
  return (
    <SlideShell>
      <div className="flex w-full max-w-5xl flex-col gap-10">
        <div className="flex flex-col gap-5">
          <Kicker icon={Microscope} label="The problem" />
          <h2 className="text-foreground max-w-3xl text-4xl font-semibold text-balance md:text-5xl">
            Psychiatric drug discovery is slow, expensive, and mostly fails
          </h2>
          <p className="text-muted-foreground max-w-3xl text-lg leading-relaxed text-pretty">
            Evidence is scattered across genetics, transcriptomics, and decades
            of literature. Choosing the right target is the highest-leverage —
            and riskiest — decision a program makes.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {stats.map((s) => (
            <div
              key={s.label}
              className="bg-card flex flex-col gap-2 rounded-xl border p-6"
            >
              <span className="text-primary text-4xl font-semibold">
                {s.value}
              </span>
              <span className="text-muted-foreground text-sm leading-relaxed">
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </SlideShell>
  )
}

function SolutionSlide() {
  const steps = [
    {
      icon: Target,
      title: "Search a disease",
      body: "Type a psychiatric disorder — it resolves to an EFO/MONDO ontology id.",
    },
    {
      icon: Brain,
      title: "Rank the targets",
      body: "A learning-to-rank model scores every associated gene by evidence.",
    },
    {
      icon: Sparkles,
      title: "Explain the why",
      body: "SHAP attributions show exactly which evidence drove each ranking.",
    },
    {
      icon: Dna,
      title: "Validate in 3D",
      body: "Inspect the AlphaFold structure, known drugs, and supporting papers.",
    },
  ]
  return (
    <SlideShell>
      <div className="flex w-full max-w-6xl flex-col gap-10">
        <div className="flex flex-col gap-5">
          <Kicker icon={Sparkles} label="The solution" />
          <h2 className="text-foreground max-w-3xl text-4xl font-semibold text-balance md:text-5xl">
            One workflow: disease in, validated targets out
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {steps.map((s, i) => (
            <div
              key={s.title}
              className="bg-card relative flex flex-col gap-3 rounded-xl border p-6"
            >
              <span className="text-muted-foreground/40 absolute top-4 right-5 text-sm font-semibold">
                0{i + 1}
              </span>
              <span className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-lg">
                <s.icon className="size-5" />
              </span>
              <h3 className="text-foreground text-lg font-semibold">
                {s.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {s.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </SlideShell>
  )
}

function InfrastructureSlide() {
  const layers = [
    {
      icon: Layers,
      tag: "Frontend",
      title: "Next.js + React on Vercel",
      points: [
        "App Router, TypeScript, SWR data layer",
        "Interactive dashboard & 3D viewer",
        "Edge-deployed, globally cached",
      ],
    },
    {
      icon: Server,
      tag: "Backend",
      title: "FastAPI on Railway",
      points: [
        "Async scoring & ranking pipeline",
        "Pydantic-typed REST endpoints",
        "PDF report generation",
      ],
    },
    {
      icon: Database,
      tag: "Data",
      title: "Open biomedical APIs",
      points: [
        "Open Targets — associations & evidence",
        "UniProt — protein metadata",
        "AlphaFold — predicted structures",
      ],
    },
  ]
  return (
    <SlideShell>
      <div className="flex w-full max-w-6xl flex-col gap-10">
        <div className="flex flex-col gap-5">
          <Kicker icon={Cloud} label="Infrastructure" />
          <h2 className="text-foreground max-w-3xl text-4xl font-semibold text-balance md:text-5xl">
            A clean three-tier architecture
          </h2>
          <p className="text-muted-foreground max-w-3xl text-lg leading-relaxed text-pretty">
            Decoupled frontend and backend, powered entirely by public,
            citable biomedical data sources — no black-box datasets.
          </p>
        </div>
        <div className="grid items-stretch gap-4 md:grid-cols-3">
          {layers.map((l) => (
            <div
              key={l.tag}
              className="bg-card flex flex-col gap-4 rounded-xl border p-6"
            >
              <div className="flex items-center gap-3">
                <span className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-lg">
                  <l.icon className="size-5" />
                </span>
                <span className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                  {l.tag}
                </span>
              </div>
              <h3 className="text-foreground text-lg font-semibold">
                {l.title}
              </h3>
              <ul className="flex flex-col gap-2">
                {l.points.map((p) => (
                  <li
                    key={p}
                    className="text-muted-foreground flex items-start gap-2 text-sm leading-relaxed"
                  >
                    <span className="bg-primary mt-1.5 size-1.5 shrink-0 rounded-full" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </SlideShell>
  )
}

function PipelineSlide() {
  const steps = [
    { icon: Target, label: "Disease name", sub: "→ EFO / MONDO id" },
    { icon: Database, label: "Open Targets", sub: "+ optional CSV" },
    { icon: GitBranch, label: "Preprocess", sub: "evidence features" },
    { icon: Brain, label: "LightGBM rank", sub: "lambdarank / NDCG" },
    { icon: Sparkles, label: "SHAP", sub: "explanations" },
    { icon: FileText, label: "Dashboard + PDF", sub: "ranked output" },
  ]
  return (
    <SlideShell>
      <div className="flex w-full max-w-6xl flex-col gap-10">
        <div className="flex flex-col gap-5">
          <Kicker icon={GitBranch} label="Processing pipeline" />
          <h2 className="text-foreground max-w-3xl text-4xl font-semibold text-balance md:text-5xl">
            How a query becomes a ranked report
          </h2>
        </div>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch">
          {steps.map((s, i) => (
            <React.Fragment key={s.label}>
              <div className="bg-card flex flex-1 flex-col gap-2 rounded-xl border p-5">
                <span className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-lg">
                  <s.icon className="size-5" />
                </span>
                <span className="text-foreground text-sm font-semibold">
                  {s.label}
                </span>
                <span className="text-muted-foreground font-mono text-xs">
                  {s.sub}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className="flex items-center justify-center lg:px-1">
                  <ArrowRight className="text-muted-foreground/50 hidden size-5 lg:block" />
                  <ArrowRight className="text-muted-foreground/50 size-5 rotate-90 lg:hidden" />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
        <p className="text-muted-foreground max-w-3xl text-sm leading-relaxed">
          Proprietary RNA-seq, differential-expression, or proteomics signals
          can be uploaded as a CSV and fused into the same ranking — no
          retraining required.
        </p>
      </div>
    </SlideShell>
  )
}

function ModelsSlide() {
  const cards = [
    {
      icon: Brain,
      title: "LightGBM Learning-to-Rank",
      body: "A lambdarank objective optimizing NDCG — purpose-built for heterogeneous tabular evidence with native missing-value handling.",
      tags: ["lambdarank", "NDCG", "gradient boosting"],
    },
    {
      icon: Gauge,
      title: "Weak supervision",
      body: "Labels are derived from Open Targets itself: targets with an approved/clinical drug or strong genetic association are treated as positives. No manual labeling.",
      tags: ["self-labeled", "no annotation"],
    },
    {
      icon: Sparkles,
      title: "SHAP explanations",
      body: "Per-target SHAP attributions turn each ranking into a transparent, human-readable rationale shown directly on the dashboard.",
      tags: ["interpretable", "per-feature"],
    },
    {
      icon: FlaskConical,
      title: "Transparent fallback",
      body: "When no model is trained yet, a weighted-sum ranker keeps the API working out of the box — the system is never a black box.",
      tags: ["robust", "zero-config"],
    },
  ]
  return (
    <SlideShell>
      <div className="flex w-full max-w-6xl flex-col gap-10">
        <div className="flex flex-col gap-5">
          <Kicker icon={Brain} label="AI models" />
          <h2 className="text-foreground max-w-3xl text-4xl font-semibold text-balance md:text-5xl">
            Ranking that explains itself
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {cards.map((c) => (
            <div
              key={c.title}
              className="bg-card flex flex-col gap-4 rounded-xl border p-6"
            >
              <div className="flex items-center gap-3">
                <span className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-lg">
                  <c.icon className="size-5" />
                </span>
                <h3 className="text-foreground text-lg font-semibold">
                  {c.title}
                </h3>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {c.body}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {c.tags.map((t) => (
                  <Badge key={t} variant="outline" className="font-mono text-xs">
                    {t}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </SlideShell>
  )
}

function ExplainabilitySlide() {
  // Illustrative SHAP-style feature contributions for a top target.
  const contributions = [
    { feature: "genetic_association", value: 0.41 },
    { feature: "known_drug", value: 0.27 },
    { feature: "rna_expression", value: 0.18 },
    { feature: "literature", value: 0.11 },
    { feature: "animal_model", value: 0.07 },
  ]
  const max = Math.max(...contributions.map((c) => c.value))
  return (
    <SlideShell>
      <div className="grid w-full max-w-6xl gap-10 lg:grid-cols-[1fr_1.2fr] lg:items-center">
        <div className="flex flex-col gap-5">
          <Kicker icon={Sparkles} label="Explainability" />
          <h2 className="text-foreground text-4xl font-semibold text-balance lg:text-5xl">
            Every score comes with its receipts
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed text-pretty">
            For each target, SHAP attributions decompose the final score into
            the individual evidence types that pushed it up or down — so a
            scientist can trust, challenge, and act on the ranking.
          </p>
          <div className="bg-accent/50 text-accent-foreground rounded-lg border p-4 text-sm leading-relaxed">
            <span className="font-semibold">CACNA1C</span> ranks #1 for major
            depressive disorder, driven primarily by strong genetic-association
            evidence and existing clinical-stage compounds.
          </div>
        </div>
        <div className="bg-card flex flex-col gap-4 rounded-2xl border p-6">
          <div className="flex items-center justify-between">
            <span className="text-foreground text-sm font-semibold">
              Feature contributions
            </span>
            <Badge variant="secondary" className="font-mono text-xs">
              SHAP
            </Badge>
          </div>
          <div className="flex flex-col gap-3">
            {contributions.map((c) => (
              <div key={c.feature} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground font-mono">
                    {c.feature}
                  </span>
                  <span className="text-foreground font-medium">
                    +{c.value.toFixed(2)}
                  </span>
                </div>
                <div className="bg-muted h-2.5 w-full overflow-hidden rounded-full">
                  <div
                    className="bg-primary h-full rounded-full"
                    style={{ width: `${(c.value / max) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SlideShell>
  )
}

function ClosingSlide() {
  const recap = [
    { icon: Cloud, label: "Decoupled, public-data infrastructure" },
    { icon: Brain, label: "Explainable learning-to-rank models" },
    { icon: Dna, label: "Live 3D structural validation" },
  ]
  return (
    <SlideShell>
      <div className="flex max-w-3xl flex-col items-center gap-8 text-center">
        <span className="bg-primary text-primary-foreground flex size-14 items-center justify-center rounded-2xl">
          <Boxes className="size-7" />
        </span>
        <h2 className="text-foreground text-4xl font-semibold text-balance md:text-6xl">
          Faster, explainable target discovery for the brain
        </h2>
        <div className="flex flex-col gap-3">
          {recap.map((r) => (
            <div
              key={r.label}
              className="text-foreground flex items-center justify-center gap-3 text-lg"
            >
              <r.icon className="text-primary size-5" />
              {r.label}
            </div>
          ))}
        </div>
        <Button size="lg" asChild>
          <a href="/">
            Explore the live platform
            <ArrowRight data-icon="inline-end" />
          </a>
        </Button>
      </div>
    </SlideShell>
  )
}

/* ------------------------------------------------------------------ */
/* Deck shell + navigation                                             */
/* ------------------------------------------------------------------ */

const SLIDES: { id: string; render: () => React.ReactNode }[] = [
  { id: "Title", render: () => <TitleSlide /> },
  { id: "Problem", render: () => <ProblemSlide /> },
  { id: "Solution", render: () => <SolutionSlide /> },
  { id: "Infrastructure", render: () => <InfrastructureSlide /> },
  { id: "Pipeline", render: () => <PipelineSlide /> },
  { id: "Models", render: () => <ModelsSlide /> },
  { id: "Explainability", render: () => <ExplainabilitySlide /> },
  {
    id: "3D Structure",
    render: () => (
      <SlideShell>
        <StructureSlide />
      </SlideShell>
    ),
  },
  { id: "Closing", render: () => <ClosingSlide /> },
]

export function PitchDeck() {
  const [index, setIndex] = React.useState(0)
  const rootRef = React.useRef<HTMLDivElement | null>(null)

  const go = React.useCallback((next: number) => {
    setIndex((prev) => Math.min(SLIDES.length - 1, Math.max(0, next)))
  }, [])

  const toggleFullscreen = React.useCallback(() => {
    if (typeof document === "undefined") return
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {})
    } else {
      rootRef.current?.requestFullscreen().catch(() => {})
    }
  }, [])

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ") {
        e.preventDefault()
        setIndex((prev) => Math.min(SLIDES.length - 1, prev + 1))
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault()
        setIndex((prev) => Math.max(0, prev - 1))
      } else if (e.key === "Home") {
        setIndex(0)
      } else if (e.key === "End") {
        setIndex(SLIDES.length - 1)
      } else if (e.key === "f" || e.key === "F") {
        toggleFullscreen()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [toggleFullscreen])

  const current = SLIDES[index]

  return (
    <div ref={rootRef} className="bg-background relative h-dvh w-full overflow-hidden">
      {/* Slide stage */}
      <div key={current.id} className="animate-in fade-in slide-in-from-bottom-2 h-full duration-300">
        {current.render()}
      </div>

      {/* Top progress bar */}
      <div className="bg-muted absolute inset-x-0 top-0 h-1">
        <div
          className="bg-primary h-full transition-all duration-300"
          style={{ width: `${((index + 1) / SLIDES.length) * 100}%` }}
        />
      </div>

      {/* Brand + slide label */}
      <div className="absolute top-5 left-6 flex items-center gap-2 md:left-12">
        <span className="bg-primary text-primary-foreground flex size-7 items-center justify-center rounded-md">
          <Dna className="size-4" />
        </span>
        <span className="text-foreground text-sm font-semibold">
          MentyTarget
        </span>
      </div>

      {/* Controls */}
      <div className="absolute right-6 bottom-6 flex items-center gap-3 md:right-12">
        <span className="text-muted-foreground font-mono text-xs tabular-nums">
          {String(index + 1).padStart(2, "0")} / {String(SLIDES.length).padStart(2, "0")}
        </span>
        <div className="flex items-center gap-1.5">
          <Button
            size="icon"
            variant="outline"
            onClick={() => go(index - 1)}
            disabled={index === 0}
            aria-label="Previous slide"
          >
            <ChevronLeft />
          </Button>
          <Button
            size="icon"
            variant="outline"
            onClick={() => go(index + 1)}
            disabled={index === SLIDES.length - 1}
            aria-label="Next slide"
          >
            <ChevronRight />
          </Button>
        </div>
      </div>

      {/* Dot navigation */}
      <div className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 items-center gap-2 md:flex">
        {SLIDES.map((s, i) => (
          <button
            key={s.id}
            type="button"
            onClick={() => go(i)}
            aria-label={`Go to ${s.id} slide`}
            className={cn(
              "h-2 rounded-full transition-all",
              i === index
                ? "bg-primary w-6"
                : "bg-muted-foreground/30 hover:bg-muted-foreground/60 w-2",
            )}
          />
        ))}
      </div>
    </div>
  )
}
