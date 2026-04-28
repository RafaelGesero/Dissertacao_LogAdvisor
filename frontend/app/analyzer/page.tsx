"use client"

import { useState } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { AppHeader } from "@/components/app-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Upload, GitBranch, FileCode, Sparkles, ArrowRight } from "lucide-react"

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

export default function AnalyzerPage() {
  const [selectedDataTypes, setSelectedDataTypes] = useState<string[]>([])
  const [selectedStandards, setSelectedStandards] = useState<string[]>([])
  const [gitUrl, setGitUrl] = useState("")
  const [description, setDescription] = useState("")

  const toggleDataType = (id: string) => {
    setSelectedDataTypes((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    )
  }

  const toggleStandard = (id: string) => {
    setSelectedStandards((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    )
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <div className="flex-1 pl-64">
        <AppHeader
          title="Application Analyzer"
          description="Configure your application details for security analysis"
        />
        <main className="p-6">
          <Tabs defaultValue="attributes" className="space-y-6">
            <TabsList className="bg-muted">
              <TabsTrigger value="attributes">Attributes</TabsTrigger>
              <TabsTrigger value="description">Description</TabsTrigger>
              <TabsTrigger value="code">Code Import</TabsTrigger>
            </TabsList>

            {/* Attributes Tab */}
            <TabsContent value="attributes" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                {/* Application Type */}
                <Card className="border-border bg-card">
                  <CardHeader>
                    <CardTitle className="text-foreground">Application Type</CardTitle>
                    <CardDescription>Select your application architecture</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Select>
                      <SelectTrigger className="bg-input border-border text-foreground">
                        <SelectValue placeholder="Select application type" />
                      </SelectTrigger>
                      <SelectContent>
                        {appTypes.map((type) => (
                          <SelectItem key={type.id} value={type.id}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>

                {/* Framework */}
                <Card className="border-border bg-card">
                  <CardHeader>
                    <CardTitle className="text-foreground">Framework</CardTitle>
                    <CardDescription>Choose your Java framework</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Select>
                      <SelectTrigger className="bg-input border-border text-foreground">
                        <SelectValue placeholder="Select framework" />
                      </SelectTrigger>
                      <SelectContent>
                        {frameworks.map((fw) => (
                          <SelectItem key={fw.id} value={fw.id}>
                            {fw.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>
              </div>

              {/* Data Types */}
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="text-foreground">Data Types Processed</CardTitle>
                  <CardDescription>
                    Select all data types that your application handles
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                    {dataTypes.map((type) => (
                      <div key={type.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={type.id}
                          checked={selectedDataTypes.includes(type.id)}
                          onCheckedChange={() => toggleDataType(type.id)}
                        />
                        <Label
                          htmlFor={type.id}
                          className="text-sm font-medium text-foreground cursor-pointer"
                        >
                          {type.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Security Standards */}
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="text-foreground">Compliance Requirements</CardTitle>
                  <CardDescription>
                    Select the security standards your application must comply with
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {securityStandards.map((standard) => (
                      <Badge
                        key={standard.id}
                        variant={selectedStandards.includes(standard.id) ? "default" : "outline"}
                        className={`cursor-pointer transition-colors ${
                          selectedStandards.includes(standard.id)
                            ? "bg-accent text-accent-foreground hover:bg-accent/80"
                            : "border-border text-muted-foreground hover:bg-muted"
                        }`}
                        onClick={() => toggleStandard(standard.id)}
                      >
                        {standard.label}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Description Tab */}
            <TabsContent value="description" className="space-y-6">
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <Sparkles className="h-5 w-5 text-accent" />
                    Describe Your Application
                  </CardTitle>
                  <CardDescription>
                    Provide a detailed description of your application. Our AI will analyze it and
                    suggest security logging recommendations.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    placeholder="Describe your application's functionality, architecture, user interactions, and any specific security concerns..."
                    className="min-h-[200px] bg-input border-border text-foreground placeholder:text-muted-foreground"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Sparkles className="h-4 w-4" />
                    <span>Powered by LangChain4j for intelligent analysis</span>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Code Import Tab */}
            <TabsContent value="code" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                {/* Git URL */}
                <Card className="border-border bg-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-foreground">
                      <GitBranch className="h-5 w-5 text-accent" />
                      Git Repository
                    </CardTitle>
                    <CardDescription>
                      Provide a Git URL for automatic code analysis
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="git-url" className="text-foreground">Repository URL</Label>
                      <Input
                        id="git-url"
                        placeholder="https://github.com/username/repository"
                        className="bg-input border-border text-foreground placeholder:text-muted-foreground"
                        value={gitUrl}
                        onChange={(e) => setGitUrl(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="branch" className="text-foreground">Branch</Label>
                      <Input
                        id="branch"
                        placeholder="main"
                        className="bg-input border-border text-foreground placeholder:text-muted-foreground"
                      />
                    </div>
                    <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                      <GitBranch className="mr-2 h-4 w-4" />
                      Connect Repository
                    </Button>
                  </CardContent>
                </Card>

                {/* File Upload */}
                <Card className="border-border bg-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-foreground">
                      <FileCode className="h-5 w-5 text-accent" />
                      Upload Code
                    </CardTitle>
                    <CardDescription>
                      Upload your Java source files or a ZIP archive
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/50 p-8">
                      <Upload className="mb-4 h-10 w-10 text-muted-foreground" />
                      <p className="mb-2 text-sm text-foreground">
                        Drag and drop your files here
                      </p>
                      <p className="mb-4 text-xs text-muted-foreground">
                        Supports .java, .xml, .properties, .yaml, .zip
                      </p>
                      <Button variant="outline" className="border-border text-foreground hover:bg-muted">
                        Browse Files
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>

          {/* Analyze Button */}
          <div className="mt-8 flex justify-end">
            <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
              Analyze Application
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </main>
      </div>
    </div>
  )
}
