"use client"

import * as React from "react"

import { runAnalysisRequest, type Modality, type ScoreResponse } from "@/lib/api"

export type Page = "search" | "results" | "reports" | "settings"

export interface SavedReport {
  id: string
  disease: string
  generatedAt: string
  usedProprietaryData: boolean
  result: ScoreResponse
}

interface AppState {
  page: Page
  navigate: (page: Page) => void

  // Active analysis
  result: ScoreResponse | null
  usedProprietaryData: boolean
  isAnalyzing: boolean
  analysisError: string | null
  runAnalysis: (query: string, file: File | null, modality: string) => void

  // Document
  documentReady: boolean
  generateDocument: () => void

  // Reports
  savedReports: SavedReport[]
  saveCurrentReport: () => boolean
  openReport: (id: string) => void
  activeReportId: string | null
}

const AppContext = React.createContext<AppState | null>(null)

export function useApp() {
  const ctx = React.useContext(AppContext)
  if (!ctx) throw new Error("useApp must be used within AppProvider")
  return ctx
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [page, setPage] = React.useState<Page>("search")
  const [result, setResult] = React.useState<ScoreResponse | null>(null)
  const [usedProprietaryData, setUsedProprietaryData] = React.useState(false)
  const [isAnalyzing, setIsAnalyzing] = React.useState(false)
  const [analysisError, setAnalysisError] = React.useState<string | null>(null)
  const [documentReady, setDocumentReady] = React.useState(false)
  const [savedReports, setSavedReports] = React.useState<SavedReport[]>([])
  const [activeReportId, setActiveReportId] = React.useState<string | null>(null)

  const navigate = React.useCallback((next: Page) => setPage(next), [])

  const runAnalysis = React.useCallback(
    (query: string, file: File | null, modality: string) => {
      setIsAnalyzing(true)
      setAnalysisError(null)

      runAnalysisRequest(query, modality as Modality, file)
        .then((response) => {
          setResult(response)
          setUsedProprietaryData(Boolean(file))
          setDocumentReady(false)
          setActiveReportId(null)
          setPage("results")
        })
        .catch((err) => {
          setAnalysisError(
            err instanceof Error ? err.message : "Something went wrong. Please try again.",
          )
        })
        .finally(() => {
          setIsAnalyzing(false)
        })
    },
    [],
  )

  const generateDocument = React.useCallback(() => {
    setDocumentReady(true)
  }, [])

  const saveCurrentReport = React.useCallback(() => {
    if (!result) return false
    const id = `rpt_${Date.now()}`
    const report: SavedReport = {
      id,
      disease: result.disease_label,
      generatedAt: new Date().toISOString(),
      usedProprietaryData,
      result,
    }
    setSavedReports((prev) => [report, ...prev])
    setActiveReportId(id)
    return true
  }, [result, usedProprietaryData])

  const openReport = React.useCallback(
    (id: string) => {
      const report = savedReports.find((r) => r.id === id)
      if (!report) return
      setResult(report.result)
      setUsedProprietaryData(report.usedProprietaryData)
      setDocumentReady(true)
      setActiveReportId(id)
      setPage("results")
    },
    [savedReports],
  )

  const value: AppState = {
    page,
    navigate,
    result,
    usedProprietaryData,
    isAnalyzing,
    analysisError,
    runAnalysis,
    documentReady,
    generateDocument,
    savedReports,
    saveCurrentReport,
    openReport,
    activeReportId,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}