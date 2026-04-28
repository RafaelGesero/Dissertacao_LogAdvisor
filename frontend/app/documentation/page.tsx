"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { AppHeader } from "@/components/app-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  BookOpen,
  Code,
  Shield,
  FileText,
  Zap,
  ExternalLink,
  Terminal,
} from "lucide-react"

const docSections = [
  {
    id: "getting-started",
    title: "Getting Started",
    icon: Zap,
    items: [
      {
        title: "Introduction",
        content:
          "LogSecure is a security logging analysis tool that helps Java developers implement proper logging practices based on industry security standards like OWASP, PCI-DSS, GDPR, and HIPAA.",
      },
      {
        title: "Quick Start",
        content:
          "1. Go to the Analyzer page\n2. Select your application type and framework\n3. Choose the data types your application handles\n4. Select compliance requirements\n5. Run the analysis to get recommendations",
      },
      {
        title: "System Requirements",
        content:
          "- Java 11 or higher\n- Spring Boot 2.x / 3.x, Quarkus, or Micronaut\n- Maven or Gradle build system\n- Git repository (optional for code analysis)",
      },
    ],
  },
  {
    id: "analysis",
    title: "Application Analysis",
    icon: Code,
    items: [
      {
        title: "Attribute Selection",
        content:
          "Select application attributes to help the system understand your application context. This includes application type (Web, API, Microservice), framework, data types processed, and compliance requirements.",
      },
      {
        title: "Natural Language Description",
        content:
          "You can describe your application in natural language. Our LangChain4j-powered AI will analyze your description and provide relevant logging recommendations based on security best practices.",
      },
      {
        title: "Code Import",
        content:
          "Import your code directly by providing a Git repository URL or uploading source files. The system will analyze your codebase and identify areas where security logging should be implemented.",
      },
    ],
  },
  {
    id: "security-events",
    title: "Security Events",
    icon: Shield,
    items: [
      {
        title: "Mandatory Events",
        content:
          "Based on your compliance requirements, the system identifies mandatory security events that must be logged. These include authentication events, authorization decisions, data access, and security violations.",
      },
      {
        title: "Event Categories",
        content:
          "Events are categorized by:\n- Authentication: Login, logout, password changes\n- Authorization: Access grants/denials\n- Data Access: Read/write operations on sensitive data\n- Session Management: Session creation, termination\n- Security: Validation failures, suspicious activities",
      },
      {
        title: "Priority Levels",
        content:
          "Events are assigned priority levels (Critical, High, Medium, Low) based on their security impact. Critical events must be logged immediately and may require real-time alerting.",
      },
    ],
  },
  {
    id: "log-formats",
    title: "Log Formats",
    icon: FileText,
    items: [
      {
        title: "JSON Structured Logging",
        content:
          "Recommended for modern log aggregation systems like ELK Stack, Splunk, or Datadog. Provides structured data that can be easily parsed and queried.",
      },
      {
        title: "Elastic Common Schema (ECS)",
        content:
          "Use ECS format for Elasticsearch-based logging systems. This provides standardized field names and structures compatible with Elastic observability tools.",
      },
      {
        title: "Traditional Formats",
        content:
          "Logback and Log4j2 pattern layouts are supported for traditional logging needs. These can be enhanced with MDC context for additional metadata.",
      },
    ],
  },
  {
    id: "data-protection",
    title: "Data Protection",
    icon: Shield,
    items: [
      {
        title: "Never Log",
        content:
          "Certain data types should never appear in logs: passwords, CVV numbers, full credit card numbers, API keys, and other secrets. Use placeholders like [REDACTED] if reference is needed.",
      },
      {
        title: "Masking Strategies",
        content:
          "For data that needs to be referenced but protected:\n- Email: j***@example.com\n- Credit Card: ****-****-****-1234\n- SSN: ***-**-1234\n- Phone: ***-***-1234",
      },
      {
        title: "Encryption Requirements",
        content:
          "Data marked as 'Encryption Required' must be encrypted at rest and in transit. This includes PII, PHI, payment data, and authentication credentials.",
      },
    ],
  },
]

const apiEndpoints = [
  { method: "POST", endpoint: "/api/analyze", description: "Submit application for analysis" },
  { method: "GET", endpoint: "/api/events/{appId}", description: "Get security events for application" },
  { method: "GET", endpoint: "/api/suggestions/{appId}", description: "Get log suggestions" },
  { method: "POST", endpoint: "/api/search", description: "Search academic articles (SerpApi)" },
  { method: "GET", endpoint: "/api/marketplace", description: "List marketplace items" },
  { method: "POST", endpoint: "/api/marketplace", description: "Submit new configuration" },
]

export default function DocumentationPage() {
  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <div className="flex-1 pl-64">
        <AppHeader
          title="Documentation"
          description="Learn how to use LogSecure effectively"
        />
        <main className="p-6">
          <div className="grid gap-6 lg:grid-cols-4">
            {/* Sidebar Navigation */}
            <div className="space-y-4">
              <Card className="border-border bg-card sticky top-6">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-foreground">On This Page</CardTitle>
                </CardHeader>
                <CardContent>
                  <nav className="space-y-1">
                    {docSections.map((section) => (
                      <a
                        key={section.id}
                        href={`#${section.id}`}
                        className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                      >
                        <section.icon className="h-4 w-4" />
                        {section.title}
                      </a>
                    ))}
                    <a
                      href="#api-reference"
                      className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    >
                      <Terminal className="h-4 w-4" />
                      API Reference
                    </a>
                  </nav>
                </CardContent>
              </Card>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3 space-y-8">
              {/* Documentation Sections */}
              {docSections.map((section) => (
                <section key={section.id} id={section.id}>
                  <Card className="border-border bg-card">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="rounded-md bg-accent/20 p-2">
                          <section.icon className="h-5 w-5 text-accent" />
                        </div>
                        <CardTitle className="text-foreground">{section.title}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Accordion type="single" collapsible className="w-full">
                        {section.items.map((item, index) => (
                          <AccordionItem
                            key={index}
                            value={`${section.id}-${index}`}
                            className="border-border"
                          >
                            <AccordionTrigger className="text-foreground hover:no-underline">
                              {item.title}
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="prose prose-sm prose-invert max-w-none">
                                <pre className="whitespace-pre-wrap text-muted-foreground bg-transparent p-0 font-sans">
                                  {item.content}
                                </pre>
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </CardContent>
                  </Card>
                </section>
              ))}

              {/* API Reference */}
              <section id="api-reference">
                <Card className="border-border bg-card">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="rounded-md bg-accent/20 p-2">
                        <Terminal className="h-5 w-5 text-accent" />
                      </div>
                      <div>
                        <CardTitle className="text-foreground">API Reference</CardTitle>
                        <CardDescription>Backend API endpoints for integration</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-md border border-border">
                      <div className="divide-y divide-border">
                        {apiEndpoints.map((endpoint, index) => (
                          <div key={index} className="flex items-center gap-4 p-4">
                            <Badge
                              variant="outline"
                              className={
                                endpoint.method === "GET"
                                  ? "bg-green-500/20 text-green-400 border-green-500/30 font-mono"
                                  : "bg-blue-500/20 text-blue-400 border-blue-500/30 font-mono"
                              }
                            >
                              {endpoint.method}
                            </Badge>
                            <code className="flex-1 text-sm text-foreground font-mono">
                              {endpoint.endpoint}
                            </code>
                            <span className="text-sm text-muted-foreground">
                              {endpoint.description}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </section>

              {/* External Resources */}
              <Card className="border-border bg-card">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="rounded-md bg-accent/20 p-2">
                      <BookOpen className="h-5 w-5 text-accent" />
                    </div>
                    <CardTitle className="text-foreground">External Resources</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {[
                      { name: "OWASP Logging Cheat Sheet", url: "https://cheatsheetseries.owasp.org" },
                      { name: "PCI-DSS Requirements", url: "https://www.pcisecuritystandards.org" },
                      { name: "GDPR Guidelines", url: "https://gdpr.eu" },
                      { name: "LangChain4j Documentation", url: "https://docs.langchain4j.dev" },
                    ].map((resource) => (
                      <a
                        key={resource.name}
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between rounded-md border border-border bg-muted/50 p-3 hover:bg-muted transition-colors"
                      >
                        <span className="text-sm text-foreground">{resource.name}</span>
                        <ExternalLink className="h-4 w-4 text-muted-foreground" />
                      </a>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
