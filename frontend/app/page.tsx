"use client"

import { useState } from "react"
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
  MessageSquare,
  ListChecks,
  Sparkles,
  Code2,
  Clock,
  ChevronRight,
  CheckCircle,
  AlertTriangle,
  Loader2,
  FileText,
  ShieldCheck,
  XCircle,
} from "lucide-react"

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

const historyItems = [
 
]

export default function HomePage() {
  const [description, setDescription] = useState("")
  const [appType, setAppType] = useState("")
  const [framework, setFramework] = useState("")
  const [selectedDataTypes, setSelectedDataTypes] = useState<string[]>([])
  const [selectedStandards, setSelectedStandards] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{ logStructure: string; storageTips: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

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
    setResult(null)
    setError(null)
    try {
      const res = await fetch(
        `http://localhost:8080/log/advice?query=${encodeURIComponent(query)}`
      )
      if (!res.ok) throw new Error(`Server error: ${res.status}`)
      const data = await res.json()
      setResult(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to get analysis. Is the backend running?")
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
                {/* Tab toggle */}
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
                    {/* App type + Framework */}
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

                    {/* Data types */}
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

                    {/* Standards */}
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
                <XCircle className="h-4 w-4 text-red-400 shrink-0" />
                <p className="text-sm text-red-400">{error}</p>
              </CardContent>
            </Card>
          )}

          {/* Results */}
          {result && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Analysis Results
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => setResult(null)}
                >
                  Clear
                </Button>
              </div>

              <Card className="border-border bg-card">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-accent" />
                    <p className="text-sm font-semibold text-foreground">Log Structure</p>
                  </div>
                  <pre className="text-xs text-foreground bg-muted/50 rounded-md p-3 border border-border whitespace-pre-wrap font-mono leading-relaxed">
                    {result.logStructure}
                  </pre>
                </CardContent>
              </Card>

              <Card className="border-border bg-card">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-accent" />
                    <p className="text-sm font-semibold text-foreground">Storage &amp; Compliance Tips</p>
                  </div>
                  <p className="text-sm text-foreground bg-muted/50 rounded-md p-3 border border-border leading-relaxed">
                    {result.storageTips}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* History */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Recent Analyses
            </h2>
            <div className="space-y-2">
              {historyItems.map((item) => (
                <Card
                  key={item.id}
                  className="border-border bg-card hover:bg-muted/40 transition-colors cursor-pointer"
                >
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-4">
                      <div className="rounded-md bg-accent/10 p-2">
                        <Code2 className="h-4 w-4 text-accent" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.type} · {item.framework}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {item.issues > 0 ? (
                        <div className="flex items-center gap-1 text-xs text-orange-400">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          {item.issues} recommendations
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-xs text-green-400">
                          <CheckCircle className="h-3.5 w-3.5" />
                          No issues
                        </div>
                      )}
                      <div className="flex items-center gap-1 text-xs text-muted-foreground w-20 justify-end">
                        <Clock className="h-3 w-3" />
                        {item.date}
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
