"use client"

import { type AnalysisResult, modeInfo } from "@/lib/analysis"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Code2, Clock, ChevronRight, Trash2, Share2, User } from "lucide-react"

type Props = {
  items: AnalysisResult[]
  onOpen: (item: AnalysisResult) => void
  onDelete?: (item: AnalysisResult) => void
  showOwner?: boolean
  showShared?: boolean
}

export function AnalysisList({ items, onOpen, onDelete, showOwner, showShared = true }: Props) {
  return (
    <div className="space-y-2">
      {items.map((entry, i) => {
        const m = modeInfo(entry.mode)
        return (
          <Card
            key={entry.historyId ?? i}
            className="border-border bg-card hover:bg-muted/40 transition-colors cursor-pointer"
            onClick={() => onOpen(entry)}
          >
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-4 min-w-0">
                <div className="rounded-md bg-accent/10 p-2 shrink-0">
                  <Code2 className="h-4 w-4 text-accent" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{entry.keywords}</p>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-0.5">
                    {showOwner && entry.owner && (
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {entry.owner}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {entry.createdAt}
                    </span>
                    <Badge variant="outline" className="border-border font-normal gap-1 py-0">
                      <m.Icon className="h-3 w-3" />
                      {m.short}
                    </Badge>
                    {showShared && entry.shared && (
                      <Badge variant="outline" className="border-accent/40 text-accent font-normal gap-1 py-0">
                        <Share2 className="h-3 w-3" />
                        Shared
                      </Badge>
                    )}
                  </div>
                  {entry.query && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{entry.query}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-4">
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                {onDelete && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onDelete(entry)
                    }}
                    className="p-1 rounded text-muted-foreground hover:text-red-400 hover:bg-red-950/30 transition-colors"
                    title="Delete analysis"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
