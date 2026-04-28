"use client"

import { useState } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { AppHeader } from "@/components/app-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Search,
  ExternalLink,
  BookOpen,
  Calendar,
  Users,
  Bookmark,
  BookmarkCheck,
  RefreshCw,
  FileText,
  Database,
} from "lucide-react"

const savedArticles = [
  {
    id: 1,
    title: "Security Logging and Monitoring Failures: A Comprehensive Analysis",
    authors: ["J. Smith", "M. Johnson"],
    source: "IEEE Security & Privacy",
    year: 2024,
    abstract:
      "This paper analyzes common failures in security logging implementations and provides best practices for effective monitoring...",
    url: "https://example.com/article1",
    tags: ["Security", "Logging", "Monitoring"],
    saved: true,
  },
  {
    id: 2,
    title: "GDPR-Compliant Logging Practices in Modern Web Applications",
    authors: ["A. Garcia", "L. Chen"],
    source: "Journal of Data Privacy",
    year: 2023,
    abstract:
      "We present a framework for implementing logging mechanisms that comply with GDPR requirements while maintaining operational visibility...",
    url: "https://example.com/article2",
    tags: ["GDPR", "Privacy", "Compliance"],
    saved: true,
  },
  {
    id: 3,
    title: "Machine Learning for Anomaly Detection in Security Logs",
    authors: ["R. Kumar", "S. Lee", "T. Wilson"],
    source: "ACM Computing Surveys",
    year: 2024,
    abstract:
      "A survey of machine learning techniques applied to security log analysis for detecting anomalous behavior and potential threats...",
    url: "https://example.com/article3",
    tags: ["ML", "Anomaly Detection", "Security"],
    saved: false,
  },
]

const searchResults = [
  {
    id: 4,
    title: "Best Practices for Application Logging in Java Enterprise Systems",
    authors: ["P. Anderson"],
    source: "Google Scholar",
    year: 2024,
    abstract:
      "Comprehensive guide to implementing effective logging strategies in Java EE and Spring Boot applications...",
    url: "https://example.com/article4",
    tags: ["Java", "Enterprise", "Best Practices"],
    saved: false,
  },
  {
    id: 5,
    title: "PCI-DSS Logging Requirements: Implementation Guide",
    authors: ["Security Standards Council"],
    source: "PCI Security Standards",
    year: 2023,
    abstract:
      "Official guidance on implementing logging mechanisms that meet PCI-DSS compliance requirements...",
    url: "https://example.com/article5",
    tags: ["PCI-DSS", "Compliance", "Standards"],
    saved: false,
  },
]

export default function ResearchPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [savedItems, setSavedItems] = useState<number[]>([1, 2])

  const toggleSave = (id: number) => {
    setSavedItems((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  const handleSearch = () => {
    setIsSearching(true)
    setTimeout(() => setIsSearching(false), 1500)
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <div className="flex-1 pl-64">
        <AppHeader
          title="Research"
          description="Search and discover security articles via SerpApi (Google Scholar)"
        />
        <main className="p-6 space-y-6">
          {/* Search Section */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Search className="h-5 w-5 text-accent" />
                Search Academic Articles
              </CardTitle>
              <CardDescription>
                Search Google Scholar for security and logging related articles in real-time
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Search for security logging, GDPR compliance, OWASP..."
                  className="flex-1 bg-input border-border text-foreground placeholder:text-muted-foreground"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
                <Button
                  onClick={handleSearch}
                  className="bg-accent text-accent-foreground hover:bg-accent/90"
                  disabled={isSearching}
                >
                  {isSearching ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      Search
                    </>
                  )}
                </Button>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Database className="h-4 w-4" />
                <span>Powered by SerpApi - Results are saved to knowledge base</span>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Search Results */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">Search Results</h2>
                <Badge variant="outline" className="border-border text-muted-foreground">
                  {searchResults.length} articles found
                </Badge>
              </div>
              <div className="space-y-4">
                {searchResults.map((article) => (
                  <ArticleCard
                    key={article.id}
                    article={article}
                    isSaved={savedItems.includes(article.id)}
                    onToggleSave={() => toggleSave(article.id)}
                  />
                ))}
              </div>
            </div>

            {/* Saved Articles */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">Saved to Knowledge Base</h2>
                <Badge variant="outline" className="border-border text-muted-foreground">
                  {savedItems.length} saved
                </Badge>
              </div>
              <Card className="border-border bg-card">
                <CardContent className="p-4">
                  <ScrollArea className="h-[500px] pr-4">
                    <div className="space-y-4">
                      {savedArticles
                        .filter((a) => savedItems.includes(a.id))
                        .map((article) => (
                          <div
                            key={article.id}
                            className="rounded-md border border-border bg-muted/50 p-3 space-y-2"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="text-sm font-medium text-foreground line-clamp-2">
                                {article.title}
                              </h3>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 shrink-0 text-accent"
                                onClick={() => toggleSave(article.id)}
                              >
                                <BookmarkCheck className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              <span>{article.year}</span>
                              <span>•</span>
                              <span>{article.source}</span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

interface Article {
  id: number
  title: string
  authors: string[]
  source: string
  year: number
  abstract: string
  url: string
  tags: string[]
  saved: boolean
}

function ArticleCard({
  article,
  isSaved,
  onToggleSave,
}: {
  article: Article
  isSaved: boolean
  onToggleSave: () => void
}) {
  return (
    <Card className="border-border bg-card">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="rounded-md bg-accent/20 p-2 mt-0.5">
              <FileText className="h-5 w-5 text-accent" />
            </div>
            <div className="space-y-1">
              <h3 className="font-medium text-foreground leading-tight">{article.title}</h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{article.authors.join(", ")}</span>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <BookOpen className="h-4 w-4" />
                  <span>{article.source}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{article.year}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 ${isSaved ? "text-accent" : "text-muted-foreground hover:text-foreground"}`}
              onClick={onToggleSave}
            >
              {isSaved ? (
                <BookmarkCheck className="h-4 w-4" />
              ) : (
                <Bookmark className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              asChild
            >
              <a href={article.url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2">{article.abstract}</p>
        <div className="flex flex-wrap gap-1">
          {article.tags.map((tag) => (
            <Badge
              key={tag}
              variant="outline"
              className="border-border text-muted-foreground text-xs"
            >
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
