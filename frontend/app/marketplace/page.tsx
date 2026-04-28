"use client"

import { useState } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { AppHeader } from "@/components/app-header"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Search,
  Download,
  Star,
  Upload,
  User,
  Clock,
  Tag,
  FileCode,
  Settings2,
  Plus,
} from "lucide-react"

const promptTemplates = [
  {
    id: 1,
    name: "Spring Boot Security Logging",
    description: "Complete logging configuration for Spring Boot applications with security best practices",
    author: "SecurityPro",
    downloads: 1234,
    rating: 4.8,
    tags: ["Spring Boot", "Security", "Java"],
    category: "prompts",
    updatedAt: "2 days ago",
  },
  {
    id: 2,
    name: "GDPR Compliant Logger",
    description: "Pre-configured logging setup that automatically masks PII data according to GDPR",
    author: "DataPrivacy",
    downloads: 892,
    rating: 4.6,
    tags: ["GDPR", "PII", "Privacy"],
    category: "prompts",
    updatedAt: "1 week ago",
  },
  {
    id: 3,
    name: "Microservices Tracing Template",
    description: "Distributed tracing configuration with correlation IDs for microservices",
    author: "CloudArchitect",
    downloads: 756,
    rating: 4.9,
    tags: ["Microservices", "Tracing", "Distributed"],
    category: "prompts",
    updatedAt: "3 days ago",
  },
  {
    id: 4,
    name: "PCI-DSS Audit Logger",
    description: "Logging configuration that meets PCI-DSS audit requirements",
    author: "ComplianceExp",
    downloads: 654,
    rating: 4.7,
    tags: ["PCI-DSS", "Audit", "Compliance"],
    category: "prompts",
    updatedAt: "5 days ago",
  },
]

const loggingConfigs = [
  {
    id: 5,
    name: "Logback JSON Configuration",
    description: "Production-ready Logback configuration with JSON output for ELK stack",
    author: "DevOpsGuru",
    downloads: 2341,
    rating: 4.9,
    tags: ["Logback", "JSON", "ELK"],
    category: "configs",
    updatedAt: "1 day ago",
  },
  {
    id: 6,
    name: "Log4j2 Async Configuration",
    description: "High-performance async logging setup for Log4j2",
    author: "PerformanceKing",
    downloads: 1567,
    rating: 4.5,
    tags: ["Log4j2", "Async", "Performance"],
    category: "configs",
    updatedAt: "4 days ago",
  },
  {
    id: 7,
    name: "SLF4J MDC Wrapper",
    description: "Utility classes for managing MDC context across threads",
    author: "JavaMaster",
    downloads: 987,
    rating: 4.4,
    tags: ["SLF4J", "MDC", "Threading"],
    category: "configs",
    updatedAt: "1 week ago",
  },
  {
    id: 8,
    name: "Kubernetes Logging Sidecar",
    description: "Complete sidecar configuration for log aggregation in Kubernetes",
    author: "K8sExpert",
    downloads: 876,
    rating: 4.8,
    tags: ["Kubernetes", "Sidecar", "Aggregation"],
    category: "configs",
    updatedAt: "2 days ago",
  },
]

const allItems = [...promptTemplates, ...loggingConfigs]

export default function MarketplacePage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")

  const filteredItems = allItems.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesCategory =
      selectedCategory === "all" || item.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <div className="flex-1 pl-64">
        <AppHeader
          title="Marketplace"
          description="Share and discover logging configurations and prompt templates"
        />
        <main className="p-6 space-y-6">
          {/* Search and Actions */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search templates and configurations..."
                className="pl-10 bg-input border-border text-foreground placeholder:text-muted-foreground"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
                  <Upload className="mr-2 h-4 w-4" />
                  Share Configuration
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px] bg-card border-border">
                <DialogHeader>
                  <DialogTitle className="text-foreground">Share Your Configuration</DialogTitle>
                  <DialogDescription>
                    Upload your logging configuration or prompt template to help others
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-foreground">Name</Label>
                    <Input
                      id="name"
                      placeholder="My Awesome Configuration"
                      className="bg-input border-border text-foreground"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-foreground">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe what your configuration does..."
                      className="bg-input border-border text-foreground"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category" className="text-foreground">Category</Label>
                    <Select>
                      <SelectTrigger className="bg-input border-border text-foreground">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="prompts">Prompt Template</SelectItem>
                        <SelectItem value="configs">Logging Configuration</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tags" className="text-foreground">Tags</Label>
                    <Input
                      id="tags"
                      placeholder="spring-boot, security, java"
                      className="bg-input border-border text-foreground"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="file" className="text-foreground">Upload File</Label>
                    <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/50 p-6">
                      <div className="text-center">
                        <Plus className="mx-auto h-8 w-8 text-muted-foreground" />
                        <p className="mt-2 text-sm text-muted-foreground">
                          Click to upload or drag and drop
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" className="border-border text-foreground">
                    Cancel
                  </Button>
                  <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
                    Publish
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="all" onValueChange={setSelectedCategory}>
            <TabsList className="bg-muted">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="prompts">Prompt Templates</TabsTrigger>
              <TabsTrigger value="configs">Logging Configs</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredItems.map((item) => (
                  <MarketplaceCard key={item.id} item={item} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="prompts" className="mt-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredItems.map((item) => (
                  <MarketplaceCard key={item.id} item={item} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="configs" className="mt-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredItems.map((item) => (
                  <MarketplaceCard key={item.id} item={item} />
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  )
}

interface MarketplaceItem {
  id: number
  name: string
  description: string
  author: string
  downloads: number
  rating: number
  tags: string[]
  category: string
  updatedAt: string
}

function MarketplaceCard({ item }: { item: MarketplaceItem }) {
  return (
    <Card className="border-border bg-card flex flex-col">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="rounded-md bg-accent/20 p-2">
            {item.category === "prompts" ? (
              <FileCode className="h-5 w-5 text-accent" />
            ) : (
              <Settings2 className="h-5 w-5 text-accent" />
            )}
          </div>
          <div className="flex items-center gap-1 text-yellow-400">
            <Star className="h-4 w-4 fill-current" />
            <span className="text-sm text-foreground">{item.rating}</span>
          </div>
        </div>
        <CardTitle className="text-foreground mt-2">{item.name}</CardTitle>
        <CardDescription className="line-clamp-2">{item.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="flex flex-wrap gap-1">
          {item.tags.map((tag) => (
            <Badge
              key={tag}
              variant="outline"
              className="border-border text-muted-foreground text-xs"
            >
              <Tag className="mr-1 h-3 w-3" />
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex items-center justify-between border-t border-border pt-4">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <User className="h-4 w-4" />
            <span>{item.author}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{item.updatedAt}</span>
          </div>
        </div>
        <Button size="sm" variant="outline" className="border-border text-foreground hover:bg-muted">
          <Download className="mr-1 h-4 w-4" />
          {item.downloads}
        </Button>
      </CardFooter>
    </Card>
  )
}
