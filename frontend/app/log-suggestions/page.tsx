"use client"

import { useState } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { AppHeader } from "@/components/app-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  FileCode,
  Copy,
  Check,
  AlertCircle,
  GitBranch,
  Zap,
  Code,
  Terminal,
} from "lucide-react"

const logFormats = [
  {
    id: "json",
    name: "JSON Structured",
    description: "Best for modern log aggregation systems",
    example: `{
  "timestamp": "2024-01-15T10:30:45.123Z",
  "level": "INFO",
  "logger": "com.app.security.AuthService",
  "message": "User authentication successful",
  "context": {
    "userId": "user-123",
    "sessionId": "sess-***456",
    "ipAddress": "192.168.1.1",
    "userAgent": "Mozilla/5.0...",
    "action": "LOGIN",
    "result": "SUCCESS"
  },
  "traceId": "abc-123-def-456"
}`,
  },
  {
    id: "logback",
    name: "Logback Pattern",
    description: "Traditional Java logging format",
    example: `2024-01-15 10:30:45.123 [main] INFO  c.a.s.AuthService - 
  User authentication successful | 
  userId=user-123 | 
  sessionId=sess-***456 | 
  action=LOGIN | 
  result=SUCCESS | 
  traceId=abc-123-def-456`,
  },
  {
    id: "ecs",
    name: "Elastic Common Schema",
    description: "Compatible with Elasticsearch",
    example: `{
  "@timestamp": "2024-01-15T10:30:45.123Z",
  "log.level": "info",
  "log.logger": "com.app.security.AuthService",
  "message": "User authentication successful",
  "event.action": "user-login",
  "event.outcome": "success",
  "user.id": "user-123",
  "source.ip": "192.168.1.1",
  "trace.id": "abc-123-def-456"
}`,
  },
]

const insertionPoints = [
  {
    id: 1,
    location: "Catch Blocks",
    icon: AlertCircle,
    description: "Log exceptions with full context and stack traces",
    priority: "Critical",
    codeExample: `try {
    userService.authenticate(credentials);
} catch (AuthenticationException e) {
    log.error("Authentication failed", Map.of(
        "userId", credentials.getUsername(),
        "reason", e.getMessage(),
        "attemptNumber", getAttemptCount(credentials.getUsername())
    ));
    throw e;
}`,
  },
  {
    id: 2,
    location: "Method Entry/Exit",
    icon: GitBranch,
    description: "Track execution flow for critical business methods",
    priority: "High",
    codeExample: `@LogExecution
public PaymentResult processPayment(PaymentRequest request) {
    log.info("Processing payment", Map.of(
        "orderId", request.getOrderId(),
        "amount", "[MASKED]",
        "currency", request.getCurrency()
    ));
    
    // Business logic...
    
    log.info("Payment completed", Map.of(
        "orderId", request.getOrderId(),
        "transactionId", result.getTransactionId(),
        "status", result.getStatus()
    ));
    return result;
}`,
  },
  {
    id: 3,
    location: "Decision Points",
    icon: Zap,
    description: "Log critical business decisions and their outcomes",
    priority: "High",
    codeExample: `public AuthorizationResult authorize(User user, Resource resource) {
    boolean hasPermission = checkPermissions(user, resource);
    
    log.info("Authorization decision", Map.of(
        "userId", user.getId(),
        "resourceId", resource.getId(),
        "resourceType", resource.getType(),
        "action", resource.getRequestedAction(),
        "decision", hasPermission ? "GRANTED" : "DENIED",
        "reason", hasPermission ? "Permission matched" : "Insufficient privileges"
    ));
    
    return new AuthorizationResult(hasPermission);
}`,
  },
  {
    id: 4,
    location: "External API Calls",
    icon: Terminal,
    description: "Log all interactions with external services",
    priority: "Medium",
    codeExample: `public ApiResponse callExternalService(ApiRequest request) {
    String correlationId = generateCorrelationId();
    
    log.info("External API call started", Map.of(
        "service", "PaymentGateway",
        "endpoint", request.getEndpoint(),
        "correlationId", correlationId
    ));
    
    long startTime = System.currentTimeMillis();
    ApiResponse response = httpClient.execute(request);
    long duration = System.currentTimeMillis() - startTime;
    
    log.info("External API call completed", Map.of(
        "service", "PaymentGateway",
        "correlationId", correlationId,
        "statusCode", response.getStatusCode(),
        "durationMs", duration
    ));
    
    return response;
}`,
  },
]

export default function LogSuggestionsPage() {
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <div className="flex-1 pl-64">
        <AppHeader
          title="Log Suggestions"
          description="Recommended log formats and insertion points"
        />
        <main className="p-6 space-y-6">
          <Tabs defaultValue="formats" className="space-y-6">
            <TabsList className="bg-muted">
              <TabsTrigger value="formats">Log Formats</TabsTrigger>
              <TabsTrigger value="insertion">Insertion Points</TabsTrigger>
            </TabsList>

            {/* Log Formats Tab */}
            <TabsContent value="formats" className="space-y-6">
              <div className="grid gap-6">
                {logFormats.map((format) => (
                  <Card key={format.id} className="border-border bg-card">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="rounded-md bg-accent/20 p-2">
                            <FileCode className="h-5 w-5 text-accent" />
                          </div>
                          <div>
                            <CardTitle className="text-foreground">{format.name}</CardTitle>
                            <CardDescription>{format.description}</CardDescription>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-border text-foreground hover:bg-muted"
                          onClick={() => copyToClipboard(format.example, format.id)}
                        >
                          {copiedId === format.id ? (
                            <>
                              <Check className="mr-2 h-4 w-4" />
                              Copied
                            </>
                          ) : (
                            <>
                              <Copy className="mr-2 h-4 w-4" />
                              Copy
                            </>
                          )}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[200px] w-full rounded-md border border-border bg-muted/50 p-4">
                        <pre className="text-sm text-foreground font-mono">
                          {format.example}
                        </pre>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Insertion Points Tab */}
            <TabsContent value="insertion" className="space-y-6">
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="text-foreground">Recommended Log Insertion Points</CardTitle>
                  <CardDescription>
                    Strategic locations in your code where logs should be added
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    {insertionPoints.map((point) => (
                      <AccordionItem key={point.id} value={`item-${point.id}`} className="border-border">
                        <AccordionTrigger className="hover:no-underline">
                          <div className="flex items-center gap-4">
                            <div className="rounded-md bg-accent/20 p-2">
                              <point.icon className="h-5 w-5 text-accent" />
                            </div>
                            <div className="text-left">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-foreground">{point.location}</span>
                                <Badge
                                  variant="outline"
                                  className={
                                    point.priority === "Critical"
                                      ? "bg-red-500/20 text-red-400 border-red-500/30"
                                      : point.priority === "High"
                                      ? "bg-orange-500/20 text-orange-400 border-orange-500/30"
                                      : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                                  }
                                >
                                  {point.priority}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">{point.description}</p>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="mt-4 space-y-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Code className="h-4 w-4" />
                                <span>Java Code Example</span>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-muted-foreground hover:text-foreground"
                                onClick={() => copyToClipboard(point.codeExample, `point-${point.id}`)}
                              >
                                {copiedId === `point-${point.id}` ? (
                                  <Check className="h-4 w-4" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                            <ScrollArea className="h-[250px] w-full rounded-md border border-border bg-muted/50 p-4">
                              <pre className="text-sm text-foreground font-mono">
                                {point.codeExample}
                              </pre>
                            </ScrollArea>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  )
}
