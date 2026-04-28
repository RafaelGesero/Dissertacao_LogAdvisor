"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { AppHeader } from "@/components/app-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Shield,
  Lock,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle,
  Info,
  Copy,
} from "lucide-react"

const dataFields = [
  {
    id: 1,
    field: "password",
    type: "Authentication",
    action: "Never Log",
    encryption: "Required",
    reason: "Sensitive credential - must never appear in logs",
    recommendation: "Use placeholder [REDACTED] if reference needed",
  },
  {
    id: 2,
    field: "creditCardNumber",
    type: "PCI Data",
    action: "Never Log",
    encryption: "Required",
    reason: "PCI-DSS compliance requirement",
    recommendation: "Log only last 4 digits: ****-****-****-1234",
  },
  {
    id: 3,
    field: "cvv",
    type: "PCI Data",
    action: "Never Log",
    encryption: "Required",
    reason: "CVV must never be stored or logged",
    recommendation: "Do not reference in any log statement",
  },
  {
    id: 4,
    field: "socialSecurityNumber",
    type: "PII",
    action: "Never Log",
    encryption: "Required",
    reason: "Highly sensitive PII",
    recommendation: "Use masked format: ***-**-1234",
  },
  {
    id: 5,
    field: "email",
    type: "PII",
    action: "Mask",
    encryption: "Recommended",
    reason: "Personal identifier under GDPR",
    recommendation: "Mask as j***@example.com",
  },
  {
    id: 6,
    field: "ipAddress",
    type: "PII",
    action: "Hash",
    encryption: "Optional",
    reason: "Can identify users - GDPR consideration",
    recommendation: "Log hashed or truncated: 192.168.xxx.xxx",
  },
  {
    id: 7,
    field: "sessionId",
    type: "Session",
    action: "Truncate",
    encryption: "Optional",
    reason: "Security risk if exposed in full",
    recommendation: "Log only first/last 4 characters: abc...xyz",
  },
  {
    id: 8,
    field: "userId",
    type: "Identifier",
    action: "Allow",
    encryption: "Optional",
    reason: "Non-sensitive identifier for audit trail",
    recommendation: "Safe to log for traceability",
  },
  {
    id: 9,
    field: "healthRecords",
    type: "PHI",
    action: "Never Log",
    encryption: "Required",
    reason: "HIPAA protected health information",
    recommendation: "Log only record ID, never content",
  },
  {
    id: 10,
    field: "apiKey",
    type: "Authentication",
    action: "Never Log",
    encryption: "Required",
    reason: "Secret credential for API access",
    recommendation: "Reference by name only, never value",
  },
]

const actionIcons: Record<string, React.ReactNode> = {
  "Never Log": <EyeOff className="h-4 w-4 text-red-400" />,
  Mask: <Eye className="h-4 w-4 text-orange-400" />,
  Hash: <Lock className="h-4 w-4 text-yellow-400" />,
  Truncate: <Info className="h-4 w-4 text-blue-400" />,
  Allow: <CheckCircle className="h-4 w-4 text-green-400" />,
}

const actionColors: Record<string, string> = {
  "Never Log": "bg-red-500/20 text-red-400 border-red-500/30",
  Mask: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  Hash: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  Truncate: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  Allow: "bg-green-500/20 text-green-400 border-green-500/30",
}

const encryptionColors: Record<string, string> = {
  Required: "bg-red-500/20 text-red-400 border-red-500/30",
  Recommended: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  Optional: "bg-muted text-muted-foreground border-border",
}

export default function DataProtectionPage() {
  const neverLogCount = dataFields.filter((f) => f.action === "Never Log").length
  const encryptionRequired = dataFields.filter((f) => f.encryption === "Required").length

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <div className="flex-1 pl-64">
        <AppHeader
          title="Data Protection"
          description="Data encryption and logging guidelines based on security standards"
        />
        <main className="p-6 space-y-6">
          {/* Warning Alert */}
          <Alert className="border-red-500/30 bg-red-500/10">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            <AlertTitle className="text-red-400">Security Notice</AlertTitle>
            <AlertDescription className="text-red-300">
              {neverLogCount} data fields in your application should never appear in logs.
              {encryptionRequired} fields require encryption at rest and in transit.
            </AlertDescription>
          </Alert>

          {/* Stats */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="border-border bg-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-md bg-red-500/20 p-2">
                    <EyeOff className="h-5 w-5 text-red-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold text-foreground">{neverLogCount}</p>
                    <p className="text-sm text-muted-foreground">Never Log</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border bg-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-md bg-orange-500/20 p-2">
                    <Eye className="h-5 w-5 text-orange-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold text-foreground">
                      {dataFields.filter((f) => f.action === "Mask").length}
                    </p>
                    <p className="text-sm text-muted-foreground">Mask Required</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border bg-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-md bg-accent/20 p-2">
                    <Lock className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold text-foreground">{encryptionRequired}</p>
                    <p className="text-sm text-muted-foreground">Encryption Required</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border bg-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-md bg-green-500/20 p-2">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold text-foreground">
                      {dataFields.filter((f) => f.action === "Allow").length}
                    </p>
                    <p className="text-sm text-muted-foreground">Safe to Log</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Data Fields Table */}
          <Card className="border-border bg-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <Shield className="h-5 w-5 text-accent" />
                    Data Field Guidelines
                  </CardTitle>
                  <CardDescription>
                    How each data type should be handled in your application logs
                  </CardDescription>
                </div>
                <Button variant="outline" className="border-border text-foreground hover:bg-muted">
                  <Copy className="mr-2 h-4 w-4" />
                  Export Guidelines
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border border-border">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-muted/50">
                      <TableHead className="text-muted-foreground">Field</TableHead>
                      <TableHead className="text-muted-foreground">Type</TableHead>
                      <TableHead className="text-muted-foreground">Log Action</TableHead>
                      <TableHead className="text-muted-foreground">Encryption</TableHead>
                      <TableHead className="text-muted-foreground">Recommendation</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dataFields.map((field) => (
                      <TableRow key={field.id} className="border-border hover:bg-muted/50">
                        <TableCell>
                          <code className="rounded bg-muted px-2 py-1 text-sm text-foreground font-mono">
                            {field.field}
                          </code>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="border-border text-muted-foreground">
                            {field.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={actionColors[field.action]}>
                            <span className="mr-1">{actionIcons[field.action]}</span>
                            {field.action}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={encryptionColors[field.encryption]}>
                            {field.encryption}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <p className="text-sm text-muted-foreground">{field.recommendation}</p>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}
