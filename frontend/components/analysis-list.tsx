"use client"

import { type AnalysisResult, displayKeywords, modeInfo } from "@/lib/analysis"
import { ToneBadge } from "@/components/page-parts"
import { ChevronRight, Trash2, Share2, User, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatDate, useT } from "@/lib/i18n"

type Props = {
  items: AnalysisResult[]
  onOpen: (item: AnalysisResult) => void
  onDelete?: (item: AnalysisResult) => void
  showOwner?: boolean
  showShared?: boolean
}

export function AnalysisList({ items, onOpen, onDelete, showOwner, showShared = true }: Props) {
  const { t, lang } = useT()
  return (
    <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
      {items.map((entry, i) => {
        const m = modeInfo(entry.mode)
        return (
          <li key={entry.historyId ?? i}>
            <div
              role="button"
              tabIndex={0}
              onClick={() => onOpen(entry)}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onOpen(entry)}
              className="group flex cursor-pointer items-center gap-4 px-4 py-3.5 transition-colors hover:bg-muted/40 focus-visible:bg-muted/40 focus-visible:outline-none sm:px-5"
            >
              <div className={cn("hidden h-9 w-9 shrink-0 items-center justify-center rounded-lg border sm:flex", m.tone)}>
                <m.Icon className="h-4 w-4" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{displayKeywords(entry.keywords, t("analysis.untitled"))}</p>
                {entry.query && <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{entry.query}</p>}
                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                  <ToneBadge tone={m.tone} icon={m.Icon}>
                    {t(m.short)}
                  </ToneBadge>
                  {showShared && entry.shared && (
                    <ToneBadge tone="text-accent bg-accent/10 border-accent/30" icon={Share2}>
                      {t("analysis.shared")}
                    </ToneBadge>
                  )}
                  {showOwner && entry.owner && (
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {entry.owner}
                    </span>
                  )}
                  {entry.createdAt && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDate(entry.createdAt, lang)}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-1">
                {onDelete && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onDelete(entry)
                    }}
                    className="rounded-md p-1.5 text-muted-foreground opacity-100 transition hover:bg-red-500/10 hover:text-red-400 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
                    title={t("analysis.delete")}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
                <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </div>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
