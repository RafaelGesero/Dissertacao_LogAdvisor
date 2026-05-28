"use client"

import { useState, useEffect } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { AppHeader } from "@/components/app-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  MessageSquare,
  ListChecks,
  Sparkles,
  Code2,
  Clock,
  ChevronRight,
  AlertTriangle,
  Loader2,
  FileText,
  ShieldCheck,
  BookOpen,
  ExternalLink,
} from "lucide-react"

type ArticleSource = {
  title: string
  link: string
  publication: string
}

type LogSection = {
  technology: string
  content: string
}

type AnalysisResult = {
  logStructure: LogSection[]
  storageTips: string
  sources: ArticleSource[]
  keywords: string
}

const NO_INFO = "Não foi encontrada informação relevante sobre o tema em questão"

const CONTENT_SECTIONS = [
  { key: "Mandatory Fields", label: "Mandatory Fields", Icon: ListChecks },
  { key: "Log Levels", label: "Log Levels", Icon: FileText },
  { key: "Security Events", label: "Security Events", Icon: ShieldCheck },
  { key: "Example", label: "Example", Icon: Code2 },
]

function parseContent(content: string) {
  const blocks: { label: string; Icon: React.ElementType; text: string; isCode: boolean }[] = []
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
    blocks.push({ label, Icon, text: after.slice(0, end).trim(), isCode: key === "Example" })
  }
  if (blocks.length === 0) {
    blocks.push({ label: "", Icon: FileText, text: content, isCode: false })
  }
  return blocks
}

type SessionEntry = {
  id: number
  keywords: string
  date: string
  result: AnalysisResult
}

const appTypes = [
  { id: "web", label: "Web Application" },
  { id: "api", label: "REST API" },
  { id: "microservice", label: "Microservice" },
  { id: "mobile-backend", label: "Mobile Backend" },
  { id: "batch", label: "Batch Processing" },
]

const frameworks = [
  { id: "spring", label: "Spring Boot" },
  { id: "quarkus", label: "Quarkus" },
  { id: "micronaut", label: "Micronaut" },
  { id: "jakarta", label: "Jakarta EE" },
  { id: "other", label: "Other" },
]

const dataTypes = [
  { id: "pii", label: "Personal Data (PII)" },
  { id: "financial", label: "Financial Data" },
  { id: "health", label: "Health Information (PHI)" },
  { id: "auth", label: "Authentication Data" },
  { id: "payment", label: "Payment Card Data (PCI)" },
  { id: "internal", label: "Internal Business Data" },
]

const securityStandards = [
  { id: "gdpr", label: "GDPR" },
  { id: "pci-dss", label: "PCI-DSS" },
  { id: "hipaa", label: "HIPAA" },
  { id: "owasp", label: "OWASP Top 10" },
  { id: "iso27001", label: "ISO 27001" },
  { id: "soc2", label: "SOC 2" },
]

export default function HomePage() {
  const [description, setDescription] = useState("")
  const [appType, setAppType] = useState("")
  const [framework, setFramework] = useState("")
  const [selectedDataTypes, setSelectedDataTypes] = useState<string[]>([])
  const [selectedStandards, setSelectedStandards] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeResult, setActiveResult] = useState<AnalysisResult | null>(null)
  const [resultOpen, setResultOpen] = useState(false)
  const [sessionHistory, setSessionHistory] = useState<SessionEntry[]>([])

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/log/history`)
      .then((r) => r.ok ? r.json() : Promise.reject(r.status))
      .then((entries: { id: number; keywords: string; createdAt: string; logStructure: LogSection[]; storageTips: string; sources: ArticleSource[] }[]) => {
        setSessionHistory(
          entries.map((e) => ({
            id: e.id,
            keywords: e.keywords,
            date: e.createdAt,
            result: {
              logStructure: e.logStructure,
              storageTips: e.storageTips,
              sources: e.sources,
              keywords: e.keywords,
            },
          }))
        )
      })
      .catch(() => {})
  }, [])

  const toggleDataType = (id: string) =>
    setSelectedDataTypes((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    )

  const toggleStandard = (id: string) =>
    setSelectedStandards((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    )

  const handleAnalyze = async (query: string) => {
    if (!query.trim()) return
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/log/advice?query=${encodeURIComponent(query)}`
      )
      if (!res.ok) throw new Error(`Server error: ${res.status}`)
      const data: AnalysisResult = await res.json()

      const entry: SessionEntry = {
        id: Date.now(),
        keywords: data.keywords || query,
        date: new Date().toLocaleString("pt-PT", {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        result: data,
      }
      setSessionHistory((prev) => [entry, ...prev])
      setActiveResult(data)
      setResultOpen(true)
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Failed to get analysis. Is the backend running?"
      )
    } finally {
      setIsLoading(false)
    }
  }

  const buildQuestionnaireQuery = () =>
    [
      appType && `Application type: ${appType}`,
      framework && `Framework: ${framework}`,
      selectedDataTypes.length > 0 && `Data types: ${selectedDataTypes.join(", ")}`,
      selectedStandards.length > 0 && `Compliance standards: ${selectedStandards.join(", ")}`,
    ]
      .filter(Boolean)
      .join(". ")

  const openEntry = (entry: SessionEntry) => {
    setActiveResult(entry.result)
    setResultOpen(true)
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />

      <div className="flex-1 pl-64">
        <AppHeader
          title="LogAdvisor"
          description="Describe your application to get security logging recommendations"
        />

        <main className="p-6 space-y-6 max-w-5xl">
          {/* Input card */}
          <Card className="border-border bg-card">
            <CardContent className="p-0">
              <Tabs defaultValue="prompt" className="w-full">
                <div className="border-b border-border px-4 pt-4">
                  <TabsList className="bg-muted h-9">
                    <TabsTrigger value="prompt" className="gap-2 text-sm">
                      <MessageSquare className="h-3.5 w-3.5" />
                      Free Text
                    </TabsTrigger>
                    <TabsTrigger value="questionnaire" className="gap-2 text-sm">
                      <ListChecks className="h-3.5 w-3.5" />
                      Questionnaire
                    </TabsTrigger>
                  </TabsList>
                </div>

                {/* Free text */}
                <TabsContent value="prompt" className="m-0">
                  <div className="p-4 space-y-4">
                    <Textarea
                      placeholder="Describe your application — its purpose, architecture, what sensitive data it handles, and any specific security concerns you have..."
                      className="min-h-[180px] resize-none bg-input border-border text-foreground placeholder:text-muted-foreground text-sm focus-visible:ring-accent"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Sparkles className="h-3.5 w-3.5 text-accent" />
                        <span>{"Powered by LangChain4j + Groq"}</span>
                      </div>
                      <Button
                        suppressHydrationWarning
                        className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2"
                        disabled={!description.trim() || isLoading}
                        onClick={() => handleAnalyze(description)}
                      >
                        {isLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Sparkles className="h-4 w-4" />
                        )}
                        Analyze
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                {/* Questionnaire */}
                <TabsContent value="questionnaire" className="m-0">
                  <div className="p-4 space-y-5">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label className="text-sm text-foreground">Application Type</Label>
                        <Select onValueChange={setAppType}>
                          <SelectTrigger className="bg-input border-border text-foreground h-9">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            {appTypes.map((t) => (
                              <SelectItem key={t.id} value={t.id}>
                                {t.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-sm text-foreground">Framework</Label>
                        <Select onValueChange={setFramework}>
                          <SelectTrigger className="bg-input border-border text-foreground h-9">
                            <SelectValue placeholder="Select framework" />
                          </SelectTrigger>
                          <SelectContent>
                            {frameworks.map((f) => (
                              <SelectItem key={f.id} value={f.id}>
                                {f.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm text-foreground">Data Types Handled</Label>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {dataTypes.map((dt) => (
                          <div key={dt.id} className="flex items-center gap-2">
                            <Checkbox
                              id={dt.id}
                              checked={selectedDataTypes.includes(dt.id)}
                              onCheckedChange={() => toggleDataType(dt.id)}
                            />
                            <Label
                              htmlFor={dt.id}
                              className="text-sm text-muted-foreground cursor-pointer font-normal"
                            >
                              {dt.label}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm text-foreground">Compliance Requirements</Label>
                      <div className="flex flex-wrap gap-2">
                        {securityStandards.map((s) => (
                          <Badge
                            key={s.id}
                            variant={selectedStandards.includes(s.id) ? "default" : "outline"}
                            className={`cursor-pointer transition-colors ${
                              selectedStandards.includes(s.id)
                                ? "bg-accent text-accent-foreground hover:bg-accent/80"
                                : "border-border text-muted-foreground hover:bg-muted"
                            }`}
                            onClick={() => toggleStandard(s.id)}
                          >
                            {s.label}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button
                        suppressHydrationWarning
                        className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2"
                        disabled={!appType || isLoading}
                        onClick={() => handleAnalyze(buildQuestionnaireQuery())}
                      >
                        {isLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Sparkles className="h-4 w-4" />
                        )}
                        Analyze
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
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

          {/* Session history */}
          {sessionHistory.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Recent Analyses
              </h2>
              <div className="space-y-2">
                {sessionHistory.map((entry) => (
                  <Card
                    key={entry.id}
                    className="border-border bg-card hover:bg-muted/40 transition-colors cursor-pointer"
                    onClick={() => openEntry(entry)}
                  >
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="rounded-md bg-accent/10 p-2 shrink-0">
                          <Code2 className="h-4 w-4 text-accent" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {entry.keywords}
                          </p>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                            <Clock className="h-3 w-3" />
                            {entry.date}
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 ml-4" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Results dialog */}
      <Dialog open={resultOpen} onOpenChange={setResultOpen}>
        <DialogContent
          className="max-w-2xl bg-card border-border text-foreground flex flex-col gap-0 p-0"
          style={{ maxHeight: "85vh" }}
        >
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-border shrink-0">
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <Code2 className="h-5 w-5 text-accent" />
              {activeResult?.keywords || "Analysis Results"}
            </DialogTitle>
          </DialogHeader>

          {activeResult && (
            <Tabs defaultValue="structure" className="flex flex-col flex-1 overflow-hidden">
              <div className="px-6 pt-4 shrink-0">
                <TabsList className="bg-muted">
                  <TabsTrigger value="structure" className="gap-1.5 text-sm">
                    <FileText className="h-3.5 w-3.5" />
                    Log Structure
                  </TabsTrigger>
                  <TabsTrigger value="security" className="gap-1.5 text-sm">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Security &amp; Data
                  </TabsTrigger>
                  <TabsTrigger value="sources" className="gap-1.5 text-sm">
                    <BookOpen className="h-3.5 w-3.5" />
                    Sources
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="overflow-y-auto flex-1 px-6 py-4">
                <TabsContent value="structure" className="mt-0">
                  <Tabs defaultValue={activeResult.logStructure[0]?.technology ?? ""}>
                    <TabsList className="bg-muted flex-wrap h-auto gap-1 mb-4">
                      {activeResult.logStructure.map((s) => (
                        <TabsTrigger key={s.technology} value={s.technology} className="text-xs">
                          {s.technology}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                    {activeResult.logStructure.map((s) => (
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
                          </div>
                        )}
                      </TabsContent>
                    ))}
                  </Tabs>
                </TabsContent>

                <TabsContent value="security" className="mt-0">
                  <p className="text-sm text-foreground bg-muted/50 rounded-md p-4 border border-border leading-relaxed whitespace-pre-line">
                    {activeResult.storageTips}
                  </p>
                </TabsContent>

                <TabsContent value="sources" className="mt-0">
                  {activeResult.sources?.length > 0 ? (
                    <div className="space-y-3">
                      {activeResult.sources.map((source, i) => (
                        <div
                          key={i}
                          className="rounded-md bg-muted/50 border border-border p-3 space-y-1.5"
                        >
                          <p className="text-sm font-medium text-foreground leading-snug">
                            {source.title || "Untitled"}
                          </p>
                          {source.publication && (
                            <p className="text-xs text-muted-foreground">{source.publication}</p>
                          )}
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
    </div>
  )
}
