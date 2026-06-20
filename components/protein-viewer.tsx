"use client"

import * as React from "react"
import { Loader2, Maximize2, RotateCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

declare global {
  interface Window {
    $3Dmol?: any
  }
}

const THREEDMOL_SRC = "https://3dmol.org/build/3Dmol-min.js"

let loaderPromise: Promise<void> | null = null

function load3Dmol(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"))
  if (window.$3Dmol) return Promise.resolve()
  if (loaderPromise) return loaderPromise

  loaderPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${THREEDMOL_SRC}"]`,
    )
    if (existing) {
      existing.addEventListener("load", () => resolve())
      existing.addEventListener("error", () => reject(new Error("Failed to load 3Dmol")))
      return
    }
    const script = document.createElement("script")
    script.src = THREEDMOL_SRC
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error("Failed to load 3Dmol viewer"))
    document.head.appendChild(script)
  })
  return loaderPromise
}

type Representation = "cartoon" | "stick" | "sphere" | "surface"

const REPRESENTATIONS: { value: Representation; label: string }[] = [
  { value: "cartoon", label: "Cartoon" },
  { value: "stick", label: "Sticks" },
  { value: "sphere", label: "Spheres" },
  { value: "surface", label: "Surface" },
]

export function ProteinViewer({
  pdbText,
  className,
}: {
  pdbText: string
  className?: string
}) {
  const hostRef = React.useRef<HTMLDivElement | null>(null)
  const viewerRef = React.useRef<any>(null)
  const surfaceRef = React.useRef<any>(null)
  const [ready, setReady] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [rep, setRep] = React.useState<Representation>("cartoon")
  const [spinning, setSpinning] = React.useState(true)

  // Initialize viewer + load model once per pdbText.
  React.useEffect(() => {
    let cancelled = false
    setReady(false)
    setError(null)

    load3Dmol()
      .then(() => {
        if (cancelled || !hostRef.current || !window.$3Dmol) return
        const $3Dmol = window.$3Dmol

        // Reset any previous viewer instance.
        hostRef.current.innerHTML = ""
        const viewer = $3Dmol.createViewer(hostRef.current, {
          backgroundColor: "0x0b1120",
          antialias: true,
        })
        viewerRef.current = viewer

        viewer.addModel(pdbText, "pdb")
        applyStyle(viewer, "cartoon")

        // Residue-level hover labels.
        viewer.setHoverable(
          {},
          true,
          (atom: any) => {
            if (!atom) return
            viewer.addLabel(
              `${atom.resn} ${atom.resi} · ${atom.atom}`,
              {
                position: atom,
                backgroundColor: "0x111827",
                backgroundOpacity: 0.9,
                fontColor: "white",
                fontSize: 12,
                borderThickness: 0.5,
                borderColor: "0x38bdf8",
              },
            )
          },
          (atom: any) => {
            if (atom) viewer.removeAllLabels()
          },
        )

        viewer.zoomTo()
        viewer.render()
        viewer.spin("y", 0.5)
        if (!cancelled) {
          setReady(true)
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message ?? "Failed to render structure")
      })

    return () => {
      cancelled = true
      if (viewerRef.current) {
        try {
          viewerRef.current.clear()
        } catch {
          /* noop */
        }
      }
      viewerRef.current = null
      surfaceRef.current = null
    }
  }, [pdbText])

  function applyStyle(viewer: any, representation: Representation) {
    if (!window.$3Dmol) return
    // Remove any prior surface.
    if (surfaceRef.current != null) {
      try {
        viewer.removeSurface(surfaceRef.current)
      } catch {
        /* noop */
      }
      surfaceRef.current = null
    }
    viewer.setStyle({}, {})

    if (representation === "cartoon") {
      viewer.setStyle({}, { cartoon: { color: "spectrum" } })
    } else if (representation === "stick") {
      viewer.setStyle({}, { stick: { radius: 0.18, colorscheme: "Jmol" } })
    } else if (representation === "sphere") {
      viewer.setStyle({}, { sphere: { scale: 0.32, colorscheme: "Jmol" } })
    } else if (representation === "surface") {
      viewer.setStyle({}, { cartoon: { color: "spectrum" } })
      surfaceRef.current = viewer.addSurface(window.$3Dmol.SurfaceType.VDW, {
        opacity: 0.78,
        color: "0x60a5fa",
      })
    }
    viewer.render()
  }

  function handleRep(next: Representation) {
    setRep(next)
    if (viewerRef.current) applyStyle(viewerRef.current, next)
  }

  function toggleSpin() {
    const viewer = viewerRef.current
    if (!viewer) return
    if (spinning) {
      viewer.spin(false)
    } else {
      viewer.spin("y", 0.5)
    }
    setSpinning((s) => !s)
  }

  function resetView() {
    const viewer = viewerRef.current
    if (!viewer) return
    viewer.zoomTo()
    viewer.render()
  }

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg border bg-[#0b1120]">
        <div ref={hostRef} className="absolute inset-0" />
        {!ready && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-sm text-slate-300">
            <Loader2 className="size-5 animate-spin" />
            Rendering 3D structure…
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 px-6 text-center text-sm text-slate-300">
            <span className="font-medium text-slate-100">
              Structure unavailable
            </span>
            <span className="text-slate-400">{error}</span>
          </div>
        )}
        {ready && (
          <span className="absolute bottom-2 right-3 text-[10px] uppercase tracking-wide text-slate-500">
            Drag to rotate · scroll to zoom · hover for residues
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1">
          {REPRESENTATIONS.map((r) => (
            <Button
              key={r.value}
              size="sm"
              variant={rep === r.value ? "default" : "outline"}
              onClick={() => handleRep(r.value)}
              disabled={!ready}
            >
              {r.label}
            </Button>
          ))}
        </div>
        <div className="ml-auto flex gap-1">
          <Button
            size="sm"
            variant="outline"
            onClick={toggleSpin}
            disabled={!ready}
          >
            <RotateCw data-icon="inline-start" />
            {spinning ? "Stop" : "Spin"}
          </Button>
          <Button size="sm" variant="outline" onClick={resetView} disabled={!ready}>
            <Maximize2 data-icon="inline-start" />
            Reset
          </Button>
        </div>
      </div>
    </div>
  )
}
