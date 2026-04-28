"use client"

import Link from "next/link"
import { AppSidebar } from "@/components/app-sidebar"
import { AppHeader } from "@/components/app-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Code2,
  ShieldCheck,
  FileText,
  Lock,
  Store,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
} from "lucide-react"

const quickActions = [
  {
    title: "Analyze Application",
    description: "Configure and analyze your Java application",
    icon: Code2,
    href: "/analyzer",
    color: "bg-blue-500/20 text-blue-400",
  },
  {
    title: "Security Events",
    description: "View mandatory security logging events",
    icon: ShieldCheck,
    href: "/security-events",
    color: "bg-green-500/20 text-green-400",
  },
  {
    title: "Log Suggestions",
    description: "Get log format and insertion recommendations",
    icon: FileText,
    href: "/log-suggestions",
    color: "bg-purple-500/20 text-purple-400",
  },
  {
    title: "Data Protection",
    description: "Review data encryption guidelines",
    icon: Lock,
    href: "/data-protection",
    color: "bg-orange-500/20 text-orange-400",
  },
]

const recentAnalyses = [
  {
    id: 1,
    name: "payment-service",
    type: "Microservice",
    framework: "Spring Boot",
    status: "Complete",
    issues: 3,
    date: "2 hours ago",
  },
  {
    id: 2,
    name: "user-auth-api",
    type: "REST API",
    framework: "Quarkus",
    status: "In Progress",
    issues: 0,
    date: "5 hours ago",
  },
  {
    id: 3,
    name: "order-management",
    type: "Web Application",
    framework: "Spring Boot",
    status: "Complete",
    issues: 7,
    date: "1 day ago",
  },
]

const complianceMetrics = [
  { name: "OWASP Top 10", coverage: 85, total: 10, covered: 8 },
  { name: "PCI-DSS", coverage: 72, total: 12, covered: 9 },
  { name: "GDPR", coverage: 90, total: 8, covered: 7 },
  { name: "HIPAA", coverage: 65, total: 15, covered: 10 },
]

export default function DashboardPage() {
  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <div className="flex-1 pl-64">
        <AppHeader
          title="Dashboard"
          description="Security logging analysis overview"
        />
        <main className="p-6 space-y-6">
          {/* Stats Overview */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="border-border bg-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Applications Analyzed</p>
                    <p className="text-2xl font-semibold text-foreground">12</p>
                  </div>
                  <div className="rounded-md bg-accent/20 p-2">
                    <TrendingUp className="h-5 w-5 text-accent" />
                  </div>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  <span className="text-green-400">+3</span> this week
                </p>
              </CardContent>
            </Card>
            <Card className="border-border bg-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Security Issues Found</p>
                    <p className="text-2xl font-semibold text-foreground">23</p>
                  </div>
                  <div className="rounded-md bg-red-500/20 p-2">
                    <AlertTriangle className="h-5 w-5 text-red-400" />
                  </div>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  <span className="text-red-400">5 critical</span> need attention
                </p>
              </CardContent>
            </Card>
            <Card className="border-border bg-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Issues Resolved</p>
                    <p className="text-2xl font-semibold text-foreground">18</p>
                  </div>
                  <div className="rounded-md bg-green-500/20 p-2">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                  </div>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  <span className="text-green-400">78%</span> resolution rate
                </p>
              </CardContent>
            </Card>
            <Card className="border-border bg-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Pending Reviews</p>
                    <p className="text-2xl font-semibold text-foreground">5</p>
                  </div>
                  <div className="rounded-md bg-yellow-500/20 p-2">
                    <Clock className="h-5 w-5 text-yellow-400" />
                  </div>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  <span className="text-yellow-400">2</span> awaiting approval
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Quick Actions */}
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-lg font-semibold text-foreground">Quick Actions</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {quickActions.map((action) => (
                  <Link key={action.title} href={action.href}>
                    <Card className="border-border bg-card hover:bg-muted/50 transition-colors cursor-pointer h-full">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className={`rounded-md p-2 ${action.color}`}>
                            <action.icon className="h-5 w-5" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium text-foreground">{action.title}</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              {action.description}
                            </p>
                          </div>
                          <ArrowRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>

              {/* Recent Analyses */}
              <h2 className="text-lg font-semibold text-foreground pt-4">Recent Analyses</h2>
              <Card className="border-border bg-card">
                <CardContent className="p-0">
                  <div className="divide-y divide-border">
                    {recentAnalyses.map((analysis) => (
                      <div
                        key={analysis.id}
                        className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="rounded-md bg-accent/20 p-2">
                            <Code2 className="h-5 w-5 text-accent" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{analysis.name}</p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span>{analysis.type}</span>
                              <span>•</span>
                              <span>{analysis.framework}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <Badge
                              variant="outline"
                              className={
                                analysis.status === "Complete"
                                  ? "bg-green-500/20 text-green-400 border-green-500/30"
                                  : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                              }
                            >
                              {analysis.status}
                            </Badge>
                            {analysis.issues > 0 && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {analysis.issues} issues
                              </p>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground w-24 text-right">
                            {analysis.date}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Compliance Metrics */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">Compliance Coverage</h2>
              <Card className="border-border bg-card">
                <CardContent className="p-4 space-y-6">
                  {complianceMetrics.map((metric) => (
                    <div key={metric.name} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground">{metric.name}</span>
                        <span className="text-sm text-muted-foreground">
                          {metric.covered}/{metric.total}
                        </span>
                      </div>
                      <Progress value={metric.coverage} className="h-2" />
                      <p className="text-xs text-muted-foreground">
                        {metric.coverage}% coverage
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Marketplace Preview */}
              <h2 className="text-lg font-semibold text-foreground pt-4">From Marketplace</h2>
              <Card className="border-border bg-card">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <Store className="h-5 w-5 text-accent" />
                    <CardTitle className="text-base text-foreground">Popular Configs</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="rounded-md border border-border bg-muted/50 p-3">
                    <p className="text-sm font-medium text-foreground">Spring Boot Security Logging</p>
                    <p className="text-xs text-muted-foreground">1,234 downloads</p>
                  </div>
                  <div className="rounded-md border border-border bg-muted/50 p-3">
                    <p className="text-sm font-medium text-foreground">GDPR Compliant Logger</p>
                    <p className="text-xs text-muted-foreground">892 downloads</p>
                  </div>
                  <Button variant="outline" className="w-full border-border text-foreground hover:bg-muted" asChild>
                    <Link href="/marketplace">
                      View All
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
