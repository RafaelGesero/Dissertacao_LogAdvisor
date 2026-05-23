"use client"

import { useState } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { AppHeader } from "@/components/app-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Code2,
  Clock,
  Search,
  FileText,
  ShieldCheck,
  Trash2,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  Calendar,
  Filter,
} from "lucide-react"

type HistoryEntry = {
  id: number
  name: string
  query: string
  type: "free-text" | "questionnaire"
  appType?: string
  framework?: string
  standards?: string[]
  date: string
  timestamp: number
  logStructure: string
  storageTips: string
  recommendations: number
}

const mockHistory: HistoryEntry[] = [
]

const filterOptions = ["All", "Free Text", "Questionnaire"]

export default function HistoryPage() {
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState("All")
  const [selected, setSelected] = useState<HistoryEntry | null>(null)
  const [history, setHistory] = useState<HistoryEntry[]>(mockHistory)

  const filtered = history.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.query.toLowerCase().includes(search.toLowerCase())
    const matchesFilter =
      filter === "All" ||
      (filter === "Free Text" && item.type === "free-text") ||
      (filter === "Questionnaire" && item.type === "questionnaire")
    return matchesSearch && matchesFilter
  })

  const handleDelete = (id: number, e: React.MouseEvent) => {
    e.stopPropagation()
    setHistory((prev) => prev.filter((item) => item.id !== id))
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />

      <div className="flex-1 pl-64">
        <AppHeader
          title="History"
          description="All past analyses and their results"
        />

        <main className="p-6 space-y-4 max-w-5xl">
          {/* Search + filter bar */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or description..."
                className="pl-9 bg-input border-border text-foreground placeholder:text-muted-foreground"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-1">
              <Filter className="h-4 w-4 text-muted-foreground mr-1" />
              {filterOptions.map((opt) => (
                <Button
                  key={opt}
                  variant={filter === opt ? "default" : "outline"}
                  size="sm"
                  className={
                    filter === opt
                      ? "bg-accent text-accent-foreground hover:bg-accent/90 h-9"
                      : "border-border text-muted-foreground hover:bg-muted h-9"
                  }
                  onClick={() => setFilter(opt)}
                >
                  {opt}
                </Button>
              ))}
            </div>
          </div>

          {/* Count */}
          <p className="text-xs text-muted-foreground">
            {filtered.length} {filtered.length === 1 ? "analysis" : "analyses"} found
          </p>

          {/* List */}
          {filtered.length === 0 ? (
            <Card className="border-border bg-card">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <FileText className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-sm font-medium text-foreground">No analyses found</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {search ? "Try a different search term." : "Run your first analysis on the Start page."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {filtered.map((item) => (
                <Card
                  key={item.id}
                  className="border-border bg-card hover:bg-muted/40 transition-colors cursor-pointer"
                  onClick={() => setSelected(item)}
                >
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="rounded-md bg-accent/10 p-2 shrink-0">
                        <Code2 className="h-4 w-4 text-accent" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-foreground">{item.name}</p>
                          <Badge
                            variant="outline"
                            className="border-border text-muted-foreground text-xs shrink-0"
                          >
                            {item.type === "free-text" ? "Free Text" : "Questionnaire"}
                          </Badge>
                          {item.appType && (
                            <Badge
                              variant="outline"
                              className="border-border text-muted-foreground text-xs shrink-0"
                            >
                              {item.appType}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-lg">
                          {item.query}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0 ml-4">
                      {item.recommendations > 0 ? (
                        <div className="flex items-center gap-1 text-xs text-orange-400">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          {item.recommendations} tips
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-xs text-green-400">
                          <CheckCircle className="h-3.5 w-3.5" />
                          No issues
                        </div>
                      )}
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {item.date}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-red-400 hover:bg-red-400/10"
                        onClick={(e) => handleDelete(item.id, e)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Detail dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-2xl bg-card border-border text-foreground max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <Code2 className="h-5 w-5 text-accent" />
              {selected?.name}
            </DialogTitle>
          </DialogHeader>

          {selected && (
            <div className="space-y-5 mt-2">
              {/* Meta */}
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {selected.date}
                </div>
                <Badge variant="outline" className="border-border text-muted-foreground">
                  {selected.type === "free-text" ? "Free Text" : "Questionnaire"}
                </Badge>
                {selected.appType && (
                  <Badge variant="outline" className="border-border text-muted-foreground">
                    {selected.appType}
                  </Badge>
                )}
                {selected.framework && (
                  <Badge variant="outline" className="border-border text-muted-foreground">
                    {selected.framework}
                  </Badge>
                )}
                {selected.standards?.map((s) => (
                  <Badge key={s} variant="outline" className="border-border text-muted-foreground">
                    {s}
                  </Badge>
                ))}
              </div>

              {/* Query */}
              <div className="space-y-1.5">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Description
                </p>
                <p className="text-sm text-foreground bg-muted/50 rounded-md p-3 border border-border">
                  {selected.query}
                </p>
              </div>

              {/* Log Structure */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-accent" />
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Log Structure
                  </p>
                </div>
                <pre className="text-sm text-foreground bg-muted/50 rounded-md p-3 border border-border whitespace-pre-wrap font-mono">
                  {selected.logStructure}
                </pre>
              </div>

              {/* Storage Tips */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-accent" />
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Storage & Compliance Tips
                  </p>
                </div>
                <p className="text-sm text-foreground bg-muted/50 rounded-md p-3 border border-border leading-relaxed">
                  {selected.storageTips}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
