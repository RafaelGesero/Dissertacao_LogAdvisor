"use client"

import { useEffect, useMemo, useState } from "react"
import { API_URL, apiFetch, errorMessage, useCurrentUser } from "@/lib/auth"
import { type AnalysisResult, type HistoryEntry, displayKeywords, historyToResult } from "@/lib/analysis"
import { AppShell } from "@/components/app-shell"
import { AnalysisList } from "@/components/analysis-list"
import { AnalysisResultDialog } from "@/components/analysis-result-dialog"
import { EmptyState, ErrorBanner, LoadingState, SectionHeader } from "@/components/page-parts"
import { Input } from "@/components/ui/input"
import { Search, Share2 } from "lucide-react"

export default function SharedAnalysesPage() {
  const me = useCurrentUser()
  const [items, setItems] = useState<AnalysisResult[]>([])
  const [filter, setFilter] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [active, setActive] = useState<AnalysisResult | null>(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    apiFetch(`${API_URL}/log/shared`)
      .then(async (r) => {
        if (!r.ok) throw new Error(await errorMessage(r))
        return r.json()
      })
      .then((entries: HistoryEntry[]) => setItems(entries.map(historyToResult)))
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load shared analyses."))
      .finally(() => setIsLoading(false))
  }, [])

  const visible = useMemo(() => {
    const q = filter.trim().toLowerCase()
    if (!q) return items
    return items.filter((i) => [displayKeywords(i.keywords), i.query, i.owner].some((v) => v?.toLowerCase().includes(q)))
  }, [items, filter])

  const isMine = (item: AnalysisResult | null) => !!item && !!me && item.owner === me.email

  // Un-sharing an analysis removes it from this page
  const onSharedChange = (id: number, shared: boolean) => {
    setActive((r) => (r && r.historyId === id ? { ...r, shared } : r))
    if (!shared) setItems((prev) => prev.filter((i) => i.historyId !== id))
  }

  return (
    <AppShell title="Shared Analyses" description="Analyses that LoggingAdvisor users chose to share with everyone">
      <div className="mx-auto max-w-4xl space-y-6">
        <SectionHeader
          title="Shared with everyone"
          description="Open an analysis to see its log structure, security guidance and sources."
          count={items.length}
        >
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Technology, description or user…"
              className="h-9 w-64 border-border bg-input pl-8 text-sm"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
        </SectionHeader>

        {isLoading && <LoadingState label="Loading shared analyses…" />}
        {error && <ErrorBanner message={error} />}

        {!isLoading && !error && visible.length === 0 && (
          <EmptyState
            icon={Share2}
            title={items.length === 0 ? "Nothing shared yet" : "No shared analysis matches the filter"}
            description={
              items.length === 0
                ? "Open one of your analyses and turn on “Share with other users” to show it here."
                : undefined
            }
          />
        )}

        {visible.length > 0 && (
          <AnalysisList
            items={visible}
            showOwner
            showShared={false}
            onOpen={(item) => {
              setActive(item)
              setOpen(true)
            }}
          />
        )}
      </div>

      <AnalysisResultDialog
        result={active}
        open={open}
        onOpenChange={setOpen}
        showOwner
        canShare={isMine(active) || me?.role === "ADMIN"}
        onSharedChange={onSharedChange}
      />
    </AppShell>
  )
}
