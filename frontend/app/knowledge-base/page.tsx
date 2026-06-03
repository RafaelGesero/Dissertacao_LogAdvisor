"use client"

import { useEffect, useState } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { AppHeader } from "@/components/app-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  BookOpen,
  ExternalLink,
  FileText,
  Loader2,
  AlertTriangle,
  Search,
  RefreshCw,
  Database,
  Plus,
  Trash2,
} from "lucide-react"

type Article = {
  title: string
  link: string
  snippet: string
  publication: string
  technology: string
}

const EMPTY_FORM: Article = { title: "", link: "", snippet: "", publication: "", technology: "" }

function groupByTechnology(articles: Article[]): Record<string, Article[]> {
  return articles.reduce((acc, a) => {
    const key = a.technology?.trim() || "Other"
    if (!acc[key]) acc[key] = []
    acc[key].push(a)
    return acc
  }, {} as Record<string, Article[]>)
}

function ArticleCard({ article }: { article: Article }) {
  return (
    <Card className="border-border bg-card">
      <CardContent className="p-4 flex items-start gap-4">
        <div className="rounded-md bg-accent/10 p-2 shrink-0 mt-0.5">
          <FileText className="h-4 w-4 text-accent" />
        </div>
        <div className="flex-1 min-w-0 space-y-1.5">
          <p className="text-sm font-medium text-foreground leading-snug">
            {article.title || "Untitled"}
          </p>
          {article.publication && (
            <Badge
              variant="outline"
              className="border-border text-muted-foreground text-xs font-normal"
            >
              {article.publication}
            </Badge>
          )}
          {article.snippet && (
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
              {article.snippet}
            </p>
          )}
        </div>
        {article.link && (
          <a
            href={article.link}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 text-muted-foreground hover:text-accent transition-colors mt-0.5"
            title="Open article"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        )}
      </CardContent>
    </Card>
  )
}

export default function KnowledgeBasePage() {
  const [articles, setArticles] = useState<Article[]>([])
  const [search, setSearch] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [addOpen, setAddOpen] = useState(false)
  const [form, setForm] = useState<Article>(EMPTY_FORM)
  const [formError, setFormError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const [clearOpen, setClearOpen] = useState(false)
  const [isClearing, setIsClearing] = useState(false)

  const handleClear = async () => {
    setIsClearing(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/log/articlesKB`, { method: "DELETE" })
      if (!res.ok) throw new Error(`Server error: ${res.status}`)
      setArticles([])
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to clear knowledge base.")
    } finally {
      setIsClearing(false)
      setClearOpen(false)
    }
  }

  const fetchArticles = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/log/articlesKB`)
      if (!res.ok) throw new Error(`Server error: ${res.status}`)
      const data: Article[] = await res.json()
      setArticles(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load knowledge base.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { fetchArticles() }, [])

  const filtered = search.trim()
    ? articles.filter((a) => {
        const q = search.toLowerCase()
        return (
          a.title?.toLowerCase().includes(q) ||
          a.publication?.toLowerCase().includes(q) ||
          a.snippet?.toLowerCase().includes(q) ||
          a.technology?.toLowerCase().includes(q)
        )
      })
    : articles

  const grouped = groupByTechnology(filtered)
  const technologies = Object.keys(grouped).sort((a, b) =>
    a === "Other" ? 1 : b === "Other" ? -1 : a.localeCompare(b)
  )

  const handleOpenAdd = () => {
    setForm(EMPTY_FORM)
    setFormError(null)
    setAddOpen(true)
  }

  const handleSave = async () => {
    if (!form.link.trim()) {
      setFormError("Link is required.")
      return
    }
    setIsSaving(true)
    setFormError(null)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/log/articlesKB`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error(`Server error: ${res.status}`)
      setAddOpen(false)
      await fetchArticles()
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Failed to save article.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <div className="flex-1 pl-64">
        <AppHeader
          title="Knowledge Base"
          description="All academic articles currently indexed in Chroma"
        />

        <main className="p-6 space-y-6 max-w-5xl">
          {/* Stats + controls */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Database className="h-4 w-4 text-accent" />
              {isLoading ? (
                <span>Loading…</span>
              ) : (
                <span>
                  <span className="font-semibold text-foreground">{articles.length}</span>{" "}
                  {articles.length === 1 ? "article" : "articles"} indexed
                  {filtered.length !== articles.length && (
                    <> &mdash; showing{" "}
                      <span className="font-semibold text-foreground">{filtered.length}</span>
                    </>
                  )}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Filter articles…"
                  className="pl-8 h-8 w-56 bg-input border-border text-foreground placeholder:text-muted-foreground text-sm"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 border-border text-muted-foreground hover:text-foreground h-8"
                onClick={fetchArticles}
                disabled={isLoading}
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button
                size="sm"
                className="gap-1.5 bg-accent text-accent-foreground hover:bg-accent/90 h-8"
                onClick={handleOpenAdd}
              >
                <Plus className="h-3.5 w-3.5" />
                Add Article
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 border-red-800/60 text-red-400 hover:bg-red-950/30 hover:text-red-300 h-8"
                onClick={() => setClearOpen(true)}
                disabled={articles.length === 0 || isLoading}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Clear KB
              </Button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <Card className="border-red-800/50 bg-red-950/20">
              <CardContent className="p-4 flex items-center gap-3">
                <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
                <p className="text-sm text-red-400">{error}</p>
              </CardContent>
            </Card>
          )}

          {/* Loading */}
          {isLoading && (
            <div className="flex items-center justify-center py-20 gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm">Loading knowledge base…</span>
            </div>
          )}

          {/* Empty state */}
          {!isLoading && !error && filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
              <div className="rounded-full bg-muted p-4">
                <BookOpen className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">
                {articles.length === 0
                  ? "No articles in the knowledge base yet."
                  : "No articles match your filter."}
              </p>
              <p className="text-xs text-muted-foreground max-w-xs">
                {articles.length === 0
                  ? "Run an analysis or add articles manually using the button above."
                  : "Try a different search term."}
              </p>
            </div>
          )}

          {/* Articles grouped by technology */}
          {!isLoading && !error && technologies.length > 0 && (
            <Tabs defaultValue={technologies[0]}>
              <TabsList className="bg-muted flex-wrap h-auto gap-1 mb-4">
                {technologies.map((tech) => (
                  <TabsTrigger key={tech} value={tech} className="text-xs gap-1.5">
                    {tech}
                    <span className="rounded-full bg-accent/20 text-accent px-1.5 py-0 text-[10px] font-semibold leading-4">
                      {grouped[tech].length}
                    </span>
                  </TabsTrigger>
                ))}
              </TabsList>

              {technologies.map((tech) => (
                <TabsContent key={tech} value={tech} className="mt-0 space-y-3">
                  {grouped[tech].map((article, i) => (
                    <ArticleCard key={i} article={article} />
                  ))}
                </TabsContent>
              ))}
            </Tabs>
          )}
        </main>
      </div>

      {/* Clear KB confirmation */}
      <AlertDialog open={clearOpen} onOpenChange={setClearOpen}>
        <AlertDialogContent className="bg-card border-border text-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-foreground">
              <Trash2 className="h-4 w-4 text-red-400" />
              Clear Knowledge Base
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              This will permanently remove all{" "}
              <span className="font-semibold text-foreground">{articles.length}</span>{" "}
              {articles.length === 1 ? "article" : "articles"} from Chroma. Future analyses will
              need to fetch new articles via SerpAPI. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="border-border text-muted-foreground hover:text-foreground"
              disabled={isClearing}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-700 hover:bg-red-600 text-white gap-1.5"
              onClick={handleClear}
              disabled={isClearing}
            >
              {isClearing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
              {isClearing ? "Clearing…" : "Yes, clear all"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Article dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-lg bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <BookOpen className="h-4 w-4 text-accent" />
              Add Article to Knowledge Base
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">
                Link <span className="text-red-400">*</span>
              </Label>
              <Input
                placeholder="https://doi.org/…"
                className="bg-input border-border text-foreground placeholder:text-muted-foreground text-sm"
                value={form.link}
                onChange={(e) => setForm((f) => ({ ...f, link: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">Title</Label>
              <Input
                placeholder="Article title"
                className="bg-input border-border text-foreground placeholder:text-muted-foreground text-sm"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">Technology</Label>
              <Input
                placeholder="e.g. Java, Python, SQL, Spring Boot…"
                className="bg-input border-border text-foreground placeholder:text-muted-foreground text-sm"
                value={form.technology}
                onChange={(e) => setForm((f) => ({ ...f, technology: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">Publication / Journal</Label>
              <Input
                placeholder="e.g. IEEE Transactions on Information Security, 2023"
                className="bg-input border-border text-foreground placeholder:text-muted-foreground text-sm"
                value={form.publication}
                onChange={(e) => setForm((f) => ({ ...f, publication: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">Abstract / Snippet</Label>
              <Textarea
                placeholder="Paste the abstract or a relevant excerpt…"
                className="resize-none min-h-[100px] bg-input border-border text-foreground placeholder:text-muted-foreground text-sm"
                value={form.snippet}
                onChange={(e) => setForm((f) => ({ ...f, snippet: e.target.value }))}
              />
            </div>

            {formError && (
              <p className="text-xs text-red-400 flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                {formError}
              </p>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              className="border-border text-muted-foreground hover:text-foreground"
              onClick={() => setAddOpen(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              className="bg-accent text-accent-foreground hover:bg-accent/90 gap-1.5"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
              {isSaving ? "Saving…" : "Add to KB"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
