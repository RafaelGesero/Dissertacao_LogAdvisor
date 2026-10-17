"use client"

import { useState, useEffect } from "react"
import { API_URL, apiFetch, apiJson, errorMessage } from "@/lib/auth"
import {
  type AnalysisResult,
  type HistoryEntry,
  type SearchMode,
  SEARCH_MODES,
  historyToResult,
} from "@/lib/analysis"
import { AppSidebar } from "@/components/app-sidebar"
import { AppHeader } from "@/components/app-header"
import { AnalysisResultDialog } from "@/components/analysis-result-dialog"
import { AnalysisList } from "@/components/analysis-list"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { Sparkles, AlertTriangle, Loader2 } from "lucide-react"

const LOADING_STEPS: Record<SearchMode, string> = {
  RULES: "Reading the rules file…",
  KB: "Searching the knowledge base…",
  KB_WITH_NEW: "Looking for new articles, adding them to the knowledge base and analysing…",
}

export default function HomePage() {
  const [description, setDescription] = useState("")
  const [mode, setMode] = useState<SearchMode>("RULES")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeResult, setActiveResult] = useState<AnalysisResult | null>(null)
  const [resultOpen, setResultOpen] = useState(false)
  const [history, setHistory] = useState<AnalysisResult[]>([])

  useEffect(() => {
    apiFetch(`${API_URL}/log/history`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((entries: HistoryEntry[]) => setHistory(entries.map(historyToResult)))
      .catch(() => {})
  }, [])

  const handleAnalyze = async () => {
    const query = description.trim()
    if (!query) return
    setIsLoading(true)
    setError(null)
    try {
      const res = await apiJson(`${API_URL}/log/advice`, "POST", { query, mode })
      if (!res.ok) throw new Error(await errorMessage(res))
      const data: AnalysisResult = await res.json()
      const result: AnalysisResult = {
        ...data,
        query,
        createdAt: new Date().toLocaleString("pt-PT", {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
      }
      setHistory((prev) => [result, ...prev])
      setActiveResult(result)
      setResultOpen(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to get analysis. Is the backend running?")
    } finally {
      setIsLoading(false)
    }
  }

  const openEntry = (entry: AnalysisResult) => {
    setActiveResult(entry)
    setResultOpen(true)
  }

  const deleteEntry = async (id?: number) => {
    if (id === undefined) return
    const res = await apiFetch(`${API_URL}/log/history/${id}`, { method: "DELETE" })
    if (res.ok) setHistory((prev) => prev.filter((en) => en.historyId !== id))
  }

  const onSharedChange = (id: number, shared: boolean) => {
    setHistory((prev) => prev.map((h) => (h.historyId === id ? { ...h, shared } : h)))
    setActiveResult((r) => (r && r.historyId === id ? { ...r, shared } : r))
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />

      <div className="flex-1 pl-64">
        <AppHeader
          title="LoggingAdvisor"
          description="Describe your application to get security logging recommendations"
        />

        <main className="p-6 space-y-6 max-w-5xl">
          {/* Search mode */}
          <div className="space-y-2">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Search mode</h2>
            <div role="radiogroup" className="grid gap-3 md:grid-cols-3">
              {SEARCH_MODES.map((m) => {
                const selected = m.value === mode
                return (
                  <button
                    key={m.value}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    disabled={isLoading}
                    onClick={() => setMode(m.value)}
                    className={cn(
                      "text-left rounded-lg border p-4 transition-colors disabled:opacity-60",
                      selected ? "border-accent bg-accent/10" : "border-border bg-card hover:bg-muted/40"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <m.Icon className={cn("h-4 w-4", selected ? "text-accent" : "text-muted-foreground")} />
                      <span className="text-sm font-medium text-foreground">{m.title}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{m.description}</p>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Input card */}
          <Card className="border-border bg-card">
            <CardContent className="p-4 space-y-4">
              <Textarea
                placeholder="Describe your application — its purpose, architecture, what sensitive data it handles, and any specific security concerns you have..."
                className="min-h-[180px] resize-none bg-input border-border text-foreground placeholder:text-muted-foreground text-sm focus-visible:ring-accent"
                value={description}
                maxLength={5000}
                onChange={(e) => setDescription(e.target.value)}
              />
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  {isLoading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-accent" />
                      <span>{LOADING_STEPS[mode]}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5 text-accent" />
                      <span>{"Powered by LangChain4j + Groq"}</span>
                    </>
                  )}
                </div>
                <Button
                  suppressHydrationWarning
                  className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2"
                  disabled={!description.trim() || isLoading}
                  onClick={handleAnalyze}
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  Analyze
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Error */}
          {error && (
            <Card className="border-red-800/50 bg-red-950/20">
              <CardContent className="p-4 flex items-center gap-3">
                <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
                <p className="text-sm text-red-400">{error}</p>
              </CardContent>
            </Card>
          )}

          {/* History */}
          {history.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">My Analyses</h2>
              <AnalysisList items={history} onOpen={openEntry} onDelete={(entry) => deleteEntry(entry.historyId)} />
            </div>
          )}
        </main>
      </div>

      <AnalysisResultDialog
        result={activeResult}
        open={resultOpen}
        onOpenChange={setResultOpen}
        canShare
        onSharedChange={onSharedChange}
      />
    </div>
  )
}
