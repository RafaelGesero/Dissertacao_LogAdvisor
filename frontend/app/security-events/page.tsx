"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { AppHeader } from "@/components/app-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { AlertTriangle, CheckCircle, Info, Shield, Copy, ExternalLink } from "lucide-react"

const mandatoryEvents = [
  {
    id: 1,
    event: "Authentication Success",
    category: "Authentication",
    standard: "OWASP",
    priority: "Critical",
    description: "Log successful user authentication attempts",
    example: "User 'john.doe' successfully authenticated from IP 192.168.1.1",
  },
  {
    id: 2,
    event: "Authentication Failure",
    category: "Authentication",
    standard: "OWASP",
    priority: "Critical",
    description: "Log failed authentication attempts with reason",
    example: "Failed login attempt for user 'john.doe' - Invalid password (attempt 3/5)",
  },
  {
    id: 3,
    event: "Authorization Denied",
    category: "Authorization",
    standard: "OWASP",
    priority: "High",
    description: "Log when users attempt to access unauthorized resources",
    example: "User 'john.doe' denied access to /admin/users - Insufficient permissions",
  },
  {
    id: 4,
    event: "Session Created",
    category: "Session Management",
    standard: "PCI-DSS",
    priority: "High",
    description: "Log new session creation events",
    example: "Session created for user 'john.doe' - Session ID: abc123***",
  },
  {
    id: 5,
    event: "Session Terminated",
    category: "Session Management",
    standard: "PCI-DSS",
    priority: "Medium",
    description: "Log session termination (logout, timeout, revocation)",
    example: "Session terminated for user 'john.doe' - Reason: User logout",
  },
  {
    id: 6,
    event: "Data Access - Sensitive",
    category: "Data Access",
    standard: "GDPR",
    priority: "Critical",
    description: "Log access to sensitive/personal data",
    example: "User 'john.doe' accessed customer PII record ID: 12345",
  },
  {
    id: 7,
    event: "Data Modification",
    category: "Data Access",
    standard: "SOC2",
    priority: "High",
    description: "Log all data modification operations",
    example: "User 'john.doe' modified customer record ID: 12345 - Fields: email, phone",
  },
  {
    id: 8,
    event: "Input Validation Failure",
    category: "Security",
    standard: "OWASP",
    priority: "High",
    description: "Log input validation failures that could indicate attacks",
    example: "Input validation failed - Potential SQL injection detected in 'search' parameter",
  },
]

const categoryColors: Record<string, string> = {
  Authentication: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  Authorization: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  "Session Management": "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  "Data Access": "bg-green-500/20 text-green-400 border-green-500/30",
  Security: "bg-red-500/20 text-red-400 border-red-500/30",
}

const priorityIcons: Record<string, React.ReactNode> = {
  Critical: <AlertTriangle className="h-4 w-4 text-red-400" />,
  High: <AlertTriangle className="h-4 w-4 text-orange-400" />,
  Medium: <Info className="h-4 w-4 text-yellow-400" />,
  Low: <CheckCircle className="h-4 w-4 text-green-400" />,
}

export default function SecurityEventsPage() {
  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <div className="flex-1 pl-64">
        <AppHeader
          title="Security Events"
          description="Mandatory logging events based on security standards"
        />
        <main className="p-6 space-y-6">
          {/* Stats */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="border-border bg-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-md bg-red-500/20 p-2">
                    <AlertTriangle className="h-5 w-5 text-red-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold text-foreground">4</p>
                    <p className="text-sm text-muted-foreground">Critical Events</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border bg-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-md bg-orange-500/20 p-2">
                    <AlertTriangle className="h-5 w-5 text-orange-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold text-foreground">3</p>
                    <p className="text-sm text-muted-foreground">High Priority</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border bg-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-md bg-yellow-500/20 p-2">
                    <Info className="h-5 w-5 text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold text-foreground">1</p>
                    <p className="text-sm text-muted-foreground">Medium Priority</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border bg-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-md bg-accent/20 p-2">
                    <Shield className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold text-foreground">5</p>
                    <p className="text-sm text-muted-foreground">Standards Covered</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Events Table */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-foreground">Mandatory Security Events</CardTitle>
              <CardDescription>
                Events that must be logged according to selected compliance standards
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="all">
                <TabsList className="mb-4 bg-muted">
                  <TabsTrigger value="all">All Events</TabsTrigger>
                  <TabsTrigger value="authentication">Authentication</TabsTrigger>
                  <TabsTrigger value="authorization">Authorization</TabsTrigger>
                  <TabsTrigger value="data">Data Access</TabsTrigger>
                </TabsList>
                <TabsContent value="all">
                  <div className="rounded-md border border-border">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-border hover:bg-muted/50">
                          <TableHead className="text-muted-foreground">Event</TableHead>
                          <TableHead className="text-muted-foreground">Category</TableHead>
                          <TableHead className="text-muted-foreground">Standard</TableHead>
                          <TableHead className="text-muted-foreground">Priority</TableHead>
                          <TableHead className="text-muted-foreground">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {mandatoryEvents.map((event) => (
                          <TableRow key={event.id} className="border-border hover:bg-muted/50">
                            <TableCell>
                              <div>
                                <p className="font-medium text-foreground">{event.event}</p>
                                <p className="text-sm text-muted-foreground">{event.description}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={categoryColors[event.category]}
                              >
                                {event.category}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="border-border text-muted-foreground">
                                {event.standard}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {priorityIcons[event.priority]}
                                <span className="text-foreground">{event.priority}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                  <Copy className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                  <ExternalLink className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>
                <TabsContent value="authentication">
                  <div className="rounded-md border border-border p-8 text-center">
                    <p className="text-muted-foreground">Filtered view for Authentication events</p>
                  </div>
                </TabsContent>
                <TabsContent value="authorization">
                  <div className="rounded-md border border-border p-8 text-center">
                    <p className="text-muted-foreground">Filtered view for Authorization events</p>
                  </div>
                </TabsContent>
                <TabsContent value="data">
                  <div className="rounded-md border border-border p-8 text-center">
                    <p className="text-muted-foreground">Filtered view for Data Access events</p>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}
