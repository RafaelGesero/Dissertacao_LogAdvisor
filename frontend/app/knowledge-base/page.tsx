"use client"

import { useEffect, useState } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { AppHeader } from "@/components/app-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  BookOpen,
  ExternalLink,
  FileText,
  Loader2,
  AlertTriangle,
  Search,
  RefreshCw,
  Database,
} from "lucide-react"

type Article = {
  title: string
  link: string
  snippet: string
  publication: string
}

export default function KnowledgeBasePage() {
  const [articles, setArticles] = useState<Article[]>([])
  const [filtered, setFiltered] = useState<Article[]>([])
  const [search, setSearch] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchArticles = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/log/articlesKB`)
      if (!res.ok) throw new Error(`Server error: ${res.status}`)
      const data: Article[] = await res.json()
      setArticles(data)
      setFiltered(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load knowledge base.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchArticles()
  }, [])

  useEffect(() => {
    const q = search.toLowerCase()
    setFiltered(
      q
        ? articles.filter(
            (a) =>
              a.title?.toLowerCase().includes(q) ||
              a.publication?.toLowerCase().includes(q) ||
              a.snippet?.toLowerCase().includes(q)
          )
        : articles
    )
  }, [search, articles])

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
                    <> &mdash; showing <span className="font-semibold text-foreground">{filtered.length}</span></>
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
                  ? "Run an analysis — articles found via SerpAPI are automatically saved here."
                  : "Try a different search term."}
              </p>
            </div>
          )}

          {/* Article list */}
          {!isLoading && filtered.length > 0 && (
            <div className="space-y-3">
              {filtered.map((article, i) => (
                <Card key={i} className="border-border bg-card">
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
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
