"use client"

import * as React from "react"
import { FileSpreadsheetIcon, UploadCloudIcon, XIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function DataUpload({
  file,
  onFileChange,
}: {
  file: File | null
  onFileChange: (file: File | null) => void
}) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = React.useState(false)

  function handleFiles(files: FileList | null) {
    const next = files?.[0]
    if (next) onFileChange(next)
  }

  if (file) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-border bg-secondary/60 p-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <FileSpreadsheetIcon className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">
            {file.name}
          </p>
          <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Remove file"
          onClick={() => {
            onFileChange(null)
            if (inputRef.current) inputRef.current.value = ""
          }}
        >
          <XIcon />
        </Button>
      </div>
    )
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          inputRef.current?.click()
        }
      }}
      onDragOver={(e) => {
        e.preventDefault()
        setIsDragging(true)
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault()
        setIsDragging(false)
        handleFiles(e.dataTransfer.files)
      }}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-input bg-secondary/30 px-6 py-10 text-center transition-colors outline-none hover:border-primary/50 hover:bg-accent/40 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/40",
        isDragging && "border-primary bg-accent/50"
      )}
    >
      <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <UploadCloudIcon className="size-6" />
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-foreground">
          Drop your CSV here, or{" "}
          <span className="text-primary underline-offset-2 hover:underline">
            browse
          </span>
        </p>
        <p className="text-xs text-muted-foreground">
          RNA-seq, differential expression, or proteomics data (.csv)
        </p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        className="sr-only"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  )
}
