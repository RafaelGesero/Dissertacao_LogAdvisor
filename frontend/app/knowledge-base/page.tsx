"use client"

import { useEffect, useState } from "react"
import { apiFetch } from "@/lib/auth"
import { AppShell } from "@/components/app-shell"
import { EmptyState, ErrorBanner, LoadingState, StatTile } from "@/components/page-parts"
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
  Layers,
  Search,
  RefreshCw,
  Database,
  Plus,
  Trash2,
} from "lucide-react"

type Article = {
  id: number
  title: string
  link: string
  snippet: string
  publication: string
  technology: string
}

const EMPTY_FORM: Article = { id: 0, title: "", link: "", snippet: "", publication: "", technology: "" }

function groupByTechnology(articles: Article[]): Record<string, Article[]> {
  return articles.reduce((acc, a) => {
    const key = a.technology?.trim() || "Other"
    if (!acc[key]) acc[key] = []
    acc[key].push(a)
    return acc
  }, {} as Record<string, Article[]>)
}

function ArticleRow({ article, onDelete }: { article: Article; onDelete: (id: number) => void }) {
  return (
    <li className="group flex items-start gap-4 px-4 py-4 transition-colors hover:bg-muted/30 sm:px-5">
      <div className="mt-0.5 hidden h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10 sm:flex">
        <FileText className="h-4 w-4 text-accent" />
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-sm font-medium leading-snug text-foreground">{article.title || "Untitled"}</p>
        {article.publication && <p className="truncate text-xs text-muted-foreground">{article.publication}</p>}
        {article.snippet && (
          <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground/90">{article.snippet}</p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {article.link && (
          <a
            href={article.link}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-accent"
            title="Open article"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        )}
        <button
          onClick={() => onDelete(article.id)}
          className="rounded-md p-1.5 text-muted-foreground transition hover:bg-red-500/10 hover:text-red-400 sm:opacity-0 sm:group-hover:opacity-100"
          title="Delete article"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </li>
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
      const res = await apiFetch(`${process.env.NEXT_PUBLIC_API_URL}/log/articlesKB`, { method: "DELETE" })
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
      const res = await apiFetch(`${process.env.NEXT_PUBLIC_API_URL}/log/articlesKB`)
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

  const handleDeleteArticle = async (id: number) => {
    try {
      const res = await apiFetch(`${process.env.NEXT_PUBLIC_API_URL}/log/articlesKB/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error(`Server error: ${res.status}`)
      setArticles((prev) => prev.filter((a) => a.id !== id))
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete article.")
    }
  }

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
      const res = await apiFetch(`${process.env.NEXT_PUBLIC_API_URL}/log/articlesKB`, {
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

  const actions = (
    <>
      <Button
        variant="outline"
        size="sm"
        className="h-8 gap-1.5 border-border text-muted-foreground hover:text-foreground"
        onClick={fetchArticles}
        disabled={isLoading}
      >
        <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
        Refresh
      </Button>
      <Button
        suppressHydrationWarning
        variant="outline"
        size="sm"
        className="h-8 gap-1.5 border-red-500/40 text-red-400 hover:bg-red-500/10 hover:text-red-300"
        onClick={() => setClearOpen(true)}
        disabled={articles.length === 0 || isLoading}
      >
        <Trash2 className="h-3.5 w-3.5" />
        Clear KB
      </Button>
      <Button
        size="sm"
        className="h-8 gap-1.5 bg-accent text-accent-foreground hover:bg-accent/90"
        onClick={handleOpenAdd}
      >
        <Plus className="h-3.5 w-3.5" />
        Add Article
      </Button>
    </>
  )

  return (
    <AppShell title="Knowledge Base" description="Academic articles indexed for retrieval" actions={actions}>
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <StatTile label="Articles indexed" value={isLoading ? "…" : articles.length} icon={Database} />
          <StatTile
            label="Technologies"
            value={isLoading ? "…" : Object.keys(groupByTechnology(articles)).length}
            icon={Layers}
          />
          <div className="flex items-center rounded-xl border border-border bg-card p-4">
            <div className="relative w-full">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Filter by title, journal, technology…"
                className="h-10 border-border bg-input pl-9 text-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        {error && <ErrorBanner message={error} />}
        {isLoading && <LoadingState label="Loading knowledge base…" />}

        {!isLoading && !error && filtered.length === 0 && (
          <EmptyState
            icon={BookOpen}
            title={articles.length === 0 ? "No articles in the knowledge base yet" : "No articles match your filter"}
            description={
              articles.length === 0
                ? "Run an analysis with “KB + new articles” or add articles manually."
                : "Try a different search term."
            }
          />
        )}

        {!isLoading && !error && technologies.length > 0 && (
          <Tabs defaultValue={technologies[0]} key={technologies.join("|")}>
            <TabsList className="mb-4 h-auto flex-wrap gap-1 bg-muted p-1">
              {technologies.map((tech) => (
                <TabsTrigger key={tech} value={tech} className="gap-1.5 text-xs">
                  {tech}
                  <span className="rounded-full bg-accent/20 px-1.5 text-[10px] font-semibold leading-4 text-accent">
                    {grouped[tech].length}
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>

            {technologies.map((tech) => (
              <TabsContent key={tech} value={tech} className="mt-0">
                <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
                  {grouped[tech].map((article) => (
                    <ArticleRow key={article.id} article={article} onDelete={handleDeleteArticle} />
                  ))}
                </ul>
              </TabsContent>
            ))}
          </Tabs>
        )}
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
    </AppShell>
  )
}
