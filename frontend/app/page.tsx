"use client"

import { useEffect, useMemo, useState } from "react"
import { API_URL, apiFetch, apiJson, errorMessage } from "@/lib/auth"
import {
  type AnalysisResult,
  type HistoryEntry,
  type SearchMode,
  SEARCH_MODES,
  displayKeywords,
  historyToResult,
} from "@/lib/analysis"
import { AppShell } from "@/components/app-shell"
import { AnalysisList } from "@/components/analysis-list"
import { AnalysisResultDialog } from "@/components/analysis-result-dialog"
import { SearchModeInfoDialog } from "@/components/search-mode-info-dialog"
import { EmptyState, ErrorBanner, SectionHeader } from "@/components/page-parts"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { Check, FileSearch, Info, Loader2, Search, Sparkles } from "lucide-react"

const MAX_DESCRIPTION = 5000

const LOADING_STEPS: Record<SearchMode, string> = {
  RULES: "Applying the predefined rules…",
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
  const [filter, setFilter] = useState("")
  const [infoMode, setInfoMode] = useState<SearchMode | null>(null)

  useEffect(() => {
    apiFetch(`${API_URL}/log/history`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((entries: HistoryEntry[]) => setHistory(entries.map(historyToResult)))
      .catch(() => {})
  }, [])

  const visibleHistory = useMemo(() => {
    const q = filter.trim().toLowerCase()
    if (!q) return history
    return history.filter((h) => [displayKeywords(h.keywords), h.query].some((v) => v?.toLowerCase().includes(q)))
  }, [history, filter])

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
    <AppShell title="Start" description="Describe your application to get security logging recommendations">
      <div className="space-y-10">
        {/* Hero */}
        <section className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
            <Sparkles className="h-3.5 w-3.5" />
            LoggingAdvisor
          </span>
          <h2 className="mt-4 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            What should your application log?
          </h2>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            Describe your application and get the log structure, security events, data handling and storage
            recommendations, backed by academic research.
          </p>
        </section>

        {/* Composer */}
        <section className="mx-auto max-w-4xl overflow-hidden rounded-2xl border border-border bg-card shadow-lg shadow-black/20">
          <div role="radiogroup" aria-label="Search mode" className="grid gap-2 border-b border-border p-3 sm:grid-cols-3">
            {SEARCH_MODES.map((m) => {
              const selected = m.value === mode
              const select = () => !isLoading && setMode(m.value)
              return (
                <div
                  key={m.value}
                  role="radio"
                  aria-checked={selected}
                  aria-disabled={isLoading}
                  tabIndex={0}
                  onClick={select}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault()
                      select()
                    }
                  }}
                  className={cn(
                    "relative cursor-pointer rounded-xl border p-3.5 pr-10 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60",
                    isLoading && "cursor-not-allowed opacity-60",
                    selected
                      ? "border-accent/60 bg-accent/10 ring-1 ring-accent/40"
                      : "border-transparent hover:border-border hover:bg-muted/40"
                  )}
                >
                  <button
                    type="button"
                    aria-label={`How “${m.title}” works`}
                    title={`How “${m.title}” works`}
                    onClick={(e) => {
                      e.stopPropagation()
                      setInfoMode(m.value)
                    }}
                    onKeyDown={(e) => e.stopPropagation()}
                    className="absolute right-2.5 top-2.5 rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <Info className="h-4 w-4" />
                  </button>
                  <div className="flex items-center gap-2.5">
                    <span className={cn("flex h-7 w-7 items-center justify-center rounded-lg border", m.tone)}>
                      <m.Icon className="h-3.5 w-3.5" />
                    </span>
                    <span className="text-sm font-medium text-foreground">{m.title}</span>
                    {selected && <Check className="h-4 w-4 text-accent" />}
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{m.description}</p>
                </div>
              )
            })}
          </div>

          <div className="p-4 sm:p-5">
            <Textarea
              placeholder="e.g. A web application for booking medical appointments. Backend in Java with Spring Boot and PostgreSQL, frontend in React. Patients sign in with email and password and the system stores clinical data…"
              className="min-h-[170px] resize-y border-0 bg-transparent p-0 text-[15px] leading-relaxed text-foreground shadow-none placeholder:text-muted-foreground/70 focus-visible:ring-0"
              value={description}
              maxLength={MAX_DESCRIPTION}
              onChange={(e) => setDescription(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && !isLoading) handleAnalyze()
              }}
            />
          </div>

          <div className="flex flex-col gap-3 border-t border-border bg-muted/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div className="flex min-h-5 items-center gap-2 text-xs text-muted-foreground">
              {isLoading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-accent" />
                  <span>{LOADING_STEPS[mode]}</span>
                </>
              ) : (
                <span>
                  {description.length.toLocaleString("pt-PT")} / {MAX_DESCRIPTION.toLocaleString("pt-PT")} characters
                  <span className="hidden sm:inline"> · Ctrl + Enter to analyse</span>
                </span>
              )}
            </div>
            <Button
              suppressHydrationWarning
              className="gap-2 bg-accent px-5 text-accent-foreground hover:bg-accent/90"
              disabled={!description.trim() || isLoading}
              onClick={handleAnalyze}
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Analyze
            </Button>
          </div>
        </section>

        {error && <ErrorBanner message={error} className="mx-auto max-w-4xl" />}

        {/* History */}
        <section className="mx-auto max-w-4xl space-y-4">
          <SectionHeader title="My analyses" count={history.length}>
            {history.length > 0 && (
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Filter analyses…"
                  className="h-9 w-56 border-border bg-input pl-8 text-sm"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                />
              </div>
            )}
          </SectionHeader>

          {history.length === 0 ? (
            <EmptyState
              icon={FileSearch}
              title="No analyses yet"
              description="Describe your application above and choose a search mode to get your first recommendation."
            />
          ) : visibleHistory.length === 0 ? (
            <EmptyState icon={Search} title="No analysis matches the filter" />
          ) : (
            <AnalysisList
              items={visibleHistory}
              onOpen={(entry) => {
                setActiveResult(entry)
                setResultOpen(true)
              }}
              onDelete={(entry) => deleteEntry(entry.historyId)}
            />
          )}
        </section>
      </div>

      <SearchModeInfoDialog mode={infoMode} onOpenChange={(open) => !open && setInfoMode(null)} />

      <AnalysisResultDialog
        result={activeResult}
        open={resultOpen}
        onOpenChange={setResultOpen}
        canShare
        onSharedChange={onSharedChange}
      />
    </AppShell>
  )
}
