"use client"

import { useState, type ElementType } from "react"
import { API_URL, apiJson, errorMessage } from "@/lib/auth"
import { type AnalysisResult, displayKeywords, modeInfo } from "@/lib/analysis"
import { ToneBadge } from "@/components/page-parts"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  ListChecks,
  Code2,
  FileText,
  ShieldCheck,
  BookOpen,
  ExternalLink,
  Fingerprint,
  HardDrive,
  Info,
  Scale,
  Sparkles,
  User,
  Share2,
} from "lucide-react"

const NO_INFO = "Não foi encontrada informação relevante sobre o tema em questão"

const CONTENT_SECTIONS = [
  { key: "Evidence", label: "Evidence", Icon: Info },
  { key: "Mandatory Fields", label: "Mandatory Fields", Icon: ListChecks },
  { key: "Log Levels", label: "Log Levels", Icon: FileText },
  { key: "Security Events", label: "Security Events", Icon: ShieldCheck },
  { key: "Log Template", label: "Log Template", Icon: Code2 },
  { key: "Key Rules", label: "Key Rules", Icon: Scale },
]

function parseContent(content: string) {
  const blocks: { label: string; Icon: ElementType; text: string; isCode: boolean }[] = []
  for (let i = 0; i < CONTENT_SECTIONS.length; i++) {
    const { key, label, Icon } = CONTENT_SECTIONS[i]
    const marker = `${key}:`
    const start = content.indexOf(marker)
    if (start === -1) continue
    const after = content.slice(start + marker.length)
    let end = after.length
    for (let j = i + 1; j < CONTENT_SECTIONS.length; j++) {
      const idx = after.indexOf(`${CONTENT_SECTIONS[j].key}:`)
      if (idx !== -1 && idx < end) end = idx
    }
    blocks.push({ label, Icon, text: after.slice(0, end).trim(), isCode: key === "Log Template" })
  }
  if (blocks.length === 0) {
    blocks.push({ label: "", Icon: FileText, text: content, isCode: false })
  }
  return blocks
}

function TextPanel({ text, empty }: { text: string; empty: string }) {
  if (!text?.trim()) {
    return <p className="text-sm text-muted-foreground text-center py-10">{empty}</p>
  }
  return (
    <p className="text-sm text-foreground bg-muted/40 rounded-lg p-5 border border-border leading-7 whitespace-pre-line">
      {text}
    </p>
  )
}

function SourceRow({ title, publication, link }: { title: string; publication?: string; link?: string }) {
  return (
    <div className="px-3 py-2 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-xs font-medium text-foreground leading-snug">{title || "Untitled"}</p>
        {publication && <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{publication}</p>}
      </div>
      {link && (
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 text-muted-foreground hover:text-accent transition-colors mt-0.5"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      )}
    </div>
  )
}

type Props = {
  result: AnalysisResult | null
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Shows the share switch (only the owner, or the admin, may change it). */
  canShare?: boolean
  /** Shows who made the analysis (shared page, admin page). */
  showOwner?: boolean
  onSharedChange?: (historyId: number, shared: boolean) => void
}

export function AnalysisResultDialog({ result, open, onOpenChange, canShare, showOwner, onSharedChange }: Props) {
  const [saving, setSaving] = useState(false)
  const [shareError, setShareError] = useState<string | null>(null)

  const toggleShare = async (shared: boolean) => {
    if (!result?.historyId) return
    setSaving(true)
    setShareError(null)
    try {
      const res = await apiJson(`${API_URL}/log/history/${result.historyId}/share`, "PUT", { shared })
      if (!res.ok) throw new Error(await errorMessage(res))
      onSharedChange?.(result.historyId, shared)
    } catch (e) {
      setShareError(e instanceof Error ? e.message : "Could not change sharing.")
    } finally {
      setSaving(false)
    }
  }

  const mode = modeInfo(result?.mode)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-[calc(100vw-2rem)] max-w-4xl sm:max-w-4xl bg-card border-border text-foreground flex flex-col gap-0 p-0 overflow-hidden"
        style={{ maxHeight: "88vh" }}
      >
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border shrink-0 space-y-3">
          <DialogTitle className="flex items-center gap-2 text-foreground pr-6">
            <Code2 className="h-5 w-5 text-accent shrink-0" />
            <span className="truncate">{result ? displayKeywords(result.keywords) : "Analysis Results"}</span>
          </DialogTitle>
          {result && (
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <ToneBadge tone={mode.tone} icon={mode.Icon}>
                {mode.title}
              </ToneBadge>
              {showOwner && result.owner && (
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {result.owner}
                </span>
              )}
              {result.createdAt && <span>{result.createdAt}</span>}

              {canShare && result.historyId && (
                <label className="ml-auto flex items-center gap-2 cursor-pointer select-none">
                  <Share2 className="h-3.5 w-3.5" />
                  <span className="text-foreground">Share with other users</span>
                  <Switch checked={result.shared} disabled={saving} onCheckedChange={toggleShare} className="data-[state=checked]:bg-accent" />
                </label>
              )}
              {!canShare && result.shared && (
                <Badge variant="outline" className="ml-auto border-accent/40 text-accent gap-1 font-normal">
                  <Share2 className="h-3 w-3" />
                  Shared
                </Badge>
              )}
            </div>
          )}
          {shareError && <p className="text-xs text-red-400">{shareError}</p>}
          {result?.query && (
            <details className="text-xs text-muted-foreground">
              <summary className="cursor-pointer hover:text-foreground">Application description</summary>
              <p className="mt-2 whitespace-pre-line leading-relaxed">{result.query}</p>
            </details>
          )}
        </DialogHeader>

        {result && (
          <Tabs
            key={result.historyId ?? result.keywords}
            defaultValue="structure"
            className="flex flex-col flex-1 overflow-hidden"
          >
            <div className="px-6 pt-4 shrink-0">
              <TabsList className="bg-muted flex-wrap h-auto">
                <TabsTrigger value="structure" className="gap-1.5 text-sm">
                  <FileText className="h-3.5 w-3.5" />
                  Log Structure
                </TabsTrigger>
                <TabsTrigger value="security" className="gap-1.5 text-sm">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Security
                </TabsTrigger>
                <TabsTrigger value="data" className="gap-1.5 text-sm">
                  <Fingerprint className="h-3.5 w-3.5" />
                  Data Types
                </TabsTrigger>
                <TabsTrigger value="storage" className="gap-1.5 text-sm">
                  <HardDrive className="h-3.5 w-3.5" />
                  Storage
                </TabsTrigger>
                <TabsTrigger value="sources" className="gap-1.5 text-sm">
                  <BookOpen className="h-3.5 w-3.5" />
                  Sources
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="overflow-y-auto flex-1 px-6 py-4">
              <TabsContent value="structure" className="mt-0">
                <Tabs defaultValue={result.logStructure[0]?.technology ?? ""}>
                  <TabsList className="bg-muted flex-wrap h-auto gap-1 mb-4">
                    {result.logStructure.map((s) => (
                      <TabsTrigger key={s.technology} value={s.technology} className="text-xs">
                        {s.technology}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  {result.logStructure.map((s) => (
                    <TabsContent key={s.technology} value={s.technology} className="mt-0">
                      {s.content === NO_INFO ? (
                        <p className="text-sm text-muted-foreground italic py-6 text-center">{s.content}</p>
                      ) : (
                        <div className="space-y-3">
                          {parseContent(s.content).map((block, i) => {
                            const Icon = block.Icon
                            return (
                              <div key={i} className="rounded-md border border-border overflow-hidden">
                                {block.label && (
                                  <div className="flex items-center gap-2 bg-muted/70 border-b border-border px-3 py-2">
                                    <Icon className="h-3.5 w-3.5 text-accent" />
                                    <span className="text-xs font-semibold text-foreground uppercase tracking-wide">
                                      {block.label}
                                    </span>
                                  </div>
                                )}
                                {block.isCode ? (
                                  <pre className="text-xs font-mono p-3 whitespace-pre-wrap bg-zinc-900 text-green-300 leading-relaxed">
                                    {block.text}
                                  </pre>
                                ) : (
                                  <p className="text-sm text-foreground p-3 whitespace-pre-line leading-relaxed">
                                    {block.text}
                                  </p>
                                )}
                              </div>
                            )
                          })}

                          {/* Sources for this technology */}
                          {(() => {
                            const techSources = (result.sources || []).filter(
                              (src) => src.technology?.toLowerCase() === s.technology.toLowerCase()
                            )
                            if (techSources.length === 0) return null
                            return (
                              <div className="rounded-md border border-border overflow-hidden">
                                <div className="flex items-center gap-2 bg-muted/70 border-b border-border px-3 py-2">
                                  <BookOpen className="h-3.5 w-3.5 text-accent" />
                                  <span className="text-xs font-semibold text-foreground uppercase tracking-wide">
                                    Sources
                                  </span>
                                  <span className="ml-auto text-[10px] text-muted-foreground">
                                    {techSources.length} {techSources.length === 1 ? "article" : "articles"}
                                  </span>
                                </div>
                                <div className="divide-y divide-border">
                                  {techSources.map((src, i) => (
                                    <SourceRow key={i} title={src.title} publication={src.publication} link={src.link} />
                                  ))}
                                </div>
                              </div>
                            )
                          })()}
                        </div>
                      )}
                    </TabsContent>
                  ))}
                </Tabs>
              </TabsContent>

              <TabsContent value="security" className="mt-0">
                <TextPanel text={result.securityGuidance} empty="No security guidance in this analysis." />
              </TabsContent>

              <TabsContent value="data" className="mt-0">
                <TextPanel text={result.dataTypes} empty="No data type guidance in this analysis." />
              </TabsContent>

              <TabsContent value="storage" className="mt-0">
                <TextPanel text={result.storageTips} empty="No storage tips in this analysis." />
              </TabsContent>

              <TabsContent value="sources" className="mt-0 space-y-4">
                {result.mode === "KB_WITH_NEW" && result.historyId !== undefined && (
                  <div className="rounded-md border border-accent/30 bg-accent/5 overflow-hidden">
                    <div className="flex items-center gap-2 border-b border-accent/20 px-3 py-2">
                      <Sparkles className="h-3.5 w-3.5 text-accent" />
                      <span className="text-xs font-semibold text-foreground uppercase tracking-wide">
                        New articles added to the knowledge base
                      </span>
                      <span className="ml-auto text-[10px] text-muted-foreground">{result.newArticles.length}</span>
                    </div>
                    {result.newArticles.length > 0 ? (
                      <div className="divide-y divide-border">
                        {result.newArticles.map((a, i) => (
                          <SourceRow
                            key={i}
                            title={a.title}
                            publication={[a.technology, a.publication].filter(Boolean).join(" · ")}
                            link={a.link}
                          />
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground px-3 py-3">
                        No new articles were found: every result was already in the knowledge base.
                      </p>
                    )}
                  </div>
                )}

                {result.sources?.length > 0 ? (
                  <div className="space-y-3">
                    {result.mode === "RULES" && (
                      <p className="text-xs text-muted-foreground">
                        Bibliography entries of the predefined rules cited in this analysis.
                      </p>
                    )}
                    {result.sources.map((source, i) => (
                      <div key={i} className="rounded-md bg-muted/50 border border-border p-3 space-y-1.5">
                        <p className="text-sm font-medium text-foreground leading-snug">{source.title || "Untitled"}</p>
                        {source.publication && <p className="text-xs text-muted-foreground">{source.publication}</p>}
                        {source.link && (
                          <a
                            href={source.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-accent hover:underline w-fit"
                          >
                            <ExternalLink className="h-3 w-3" />
                            View article
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-10">
                    No sources available for this analysis.
                  </p>
                )}
              </TabsContent>
            </div>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  )
}
