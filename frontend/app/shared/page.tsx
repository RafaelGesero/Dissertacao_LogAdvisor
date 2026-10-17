"use client"

import { useEffect, useMemo, useState } from "react"
import { API_URL, apiFetch, errorMessage, useCurrentUser } from "@/lib/auth"
import { type AnalysisResult, type HistoryEntry, historyToResult } from "@/lib/analysis"
import { AppSidebar } from "@/components/app-sidebar"
import { AppHeader } from "@/components/app-header"
import { AnalysisList } from "@/components/analysis-list"
import { AnalysisResultDialog } from "@/components/analysis-result-dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { AlertTriangle, Loader2, Search, Share2 } from "lucide-react"

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
    return items.filter((i) =>
      [i.keywords, i.query, i.owner].some((v) => v?.toLowerCase().includes(q))
    )
  }, [items, filter])

  const isMine = (item: AnalysisResult | null) => !!item && !!me && item.owner === me.email

  // Un-sharing your own analysis removes it from this page
  const onSharedChange = (id: number, shared: boolean) => {
    setActive((r) => (r && r.historyId === id ? { ...r, shared } : r))
    if (!shared) setItems((prev) => prev.filter((i) => i.historyId !== id))
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <div className="flex-1 pl-64">
        <AppHeader
          title="Shared Analyses"
          description="Analyses that other LoggingAdvisor users chose to share"
        />
        <main className="p-6 space-y-6 max-w-5xl">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Share2 className="h-4 w-4 text-accent" />
              <span>
                <span className="text-foreground font-medium">{items.length}</span> shared{" "}
                {items.length === 1 ? "analysis" : "analyses"}
              </span>
            </div>
            <div className="relative w-72">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Filter by technology, description or user…"
                className="pl-8 bg-input border-border text-sm"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              />
            </div>
          </div>

          {isLoading && (
            <div className="flex justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}

          {error && (
            <Card className="border-red-800/50 bg-red-950/20">
              <CardContent className="p-4 flex items-center gap-3">
                <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
                <p className="text-sm text-red-400">{error}</p>
              </CardContent>
            </Card>
          )}

          {!isLoading && !error && visible.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-10">
              {items.length === 0
                ? "Nobody has shared an analysis yet. Open one of your analyses and turn on “Share with other users”."
                : "No shared analysis matches the filter."}
            </p>
          )}

          <AnalysisList
            items={visible}
            showOwner
            showShared={false}
            onOpen={(item) => {
              setActive(item)
              setOpen(true)
            }}
          />
        </main>
      </div>

      <AnalysisResultDialog
        result={active}
        open={open}
        onOpenChange={setOpen}
        showOwner
        canShare={isMine(active) || me?.role === "ADMIN"}
        onSharedChange={onSharedChange}
      />
    </div>
  )
}
