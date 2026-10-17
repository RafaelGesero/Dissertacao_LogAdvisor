"use client"

import { useEffect, useMemo, useState } from "react"
import { API_URL, apiFetch, apiJson, errorMessage, useCurrentUser, type CurrentUser } from "@/lib/auth"
import { type AnalysisResult, type HistoryEntry, historyToResult } from "@/lib/analysis"
import { AppSidebar } from "@/components/app-sidebar"
import { AppHeader } from "@/components/app-header"
import { AnalysisList } from "@/components/analysis-list"
import { AnalysisResultDialog } from "@/components/analysis-result-dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertTriangle, KeyRound, Loader2, Lock, Search, Users, FileText } from "lucide-react"

const ALL = "__all__"

export default function AdminPage() {
  const me = useCurrentUser()
  const [analyses, setAnalyses] = useState<AnalysisResult[]>([])
  const [users, setUsers] = useState<CurrentUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [owner, setOwner] = useState(ALL)
  const [filter, setFilter] = useState("")
  const [active, setActive] = useState<AnalysisResult | null>(null)
  const [open, setOpen] = useState(false)

  const [resetUser, setResetUser] = useState<CurrentUser | null>(null)
  const [newPassword, setNewPassword] = useState("")
  const [resetError, setResetError] = useState<string | null>(null)
  const [resetDone, setResetDone] = useState<string | null>(null)
  const [resetting, setResetting] = useState(false)

  const isAdmin = me?.role === "ADMIN"

  useEffect(() => {
    if (!isAdmin) return
    Promise.all([apiFetch(`${API_URL}/admin/history`), apiFetch(`${API_URL}/admin/users`)])
      .then(async ([h, u]) => {
        if (!h.ok) throw new Error(await errorMessage(h))
        if (!u.ok) throw new Error(await errorMessage(u))
        const entries: HistoryEntry[] = await h.json()
        setAnalyses(entries.map(historyToResult))
        setUsers(await u.json())
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load admin data."))
      .finally(() => setIsLoading(false))
  }, [isAdmin])

  const visible = useMemo(() => {
    const q = filter.trim().toLowerCase()
    return analyses.filter(
      (a) =>
        (owner === ALL || a.owner === owner) &&
        (!q || [a.keywords, a.query].some((v) => v?.toLowerCase().includes(q)))
    )
  }, [analyses, owner, filter])

  const deleteAnalysis = async (item: AnalysisResult) => {
    if (!item.historyId) return
    const res = await apiFetch(`${API_URL}/log/history/${item.historyId}`, { method: "DELETE" })
    if (res.ok) setAnalyses((prev) => prev.filter((a) => a.historyId !== item.historyId))
  }

  const onSharedChange = (id: number, shared: boolean) => {
    setAnalyses((prev) => prev.map((a) => (a.historyId === id ? { ...a, shared } : a)))
    setActive((r) => (r && r.historyId === id ? { ...r, shared } : r))
  }

  const submitReset = async () => {
    if (!resetUser) return
    setResetError(null)
    if (newPassword.length < 5) return setResetError("The password must have at least 5 characters.")
    setResetting(true)
    try {
      const res = await apiJson(`${API_URL}/admin/users/${resetUser.id}/password`, "PUT", { newPassword })
      if (!res.ok) throw new Error(await errorMessage(res))
      setResetDone(resetUser.email)
      setResetUser(null)
      setNewPassword("")
    } catch (e) {
      setResetError(e instanceof Error ? e.message : "Could not reset the password.")
    } finally {
      setResetting(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <div className="flex-1 pl-64">
        <AppHeader title="Administration" description="Every analysis of every user, and user management" />
        <main className="p-6 space-y-6 max-w-5xl">
          {me && !isAdmin && (
            <Card className="border-border bg-card">
              <CardContent className="p-6 flex items-center gap-3 text-sm text-muted-foreground">
                <Lock className="h-4 w-4" />
                This page is only available to administrators.
              </CardContent>
            </Card>
          )}

          {isAdmin && isLoading && (
            <div className="flex justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}

          {error && (
            <Card className="border-red-800/50 bg-red-950/20">
              <CardContent className="p-4 flex items-center gap-3">
                <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
                <p className="text-sm text-red-400">{error}</p>
              </CardContent>
            </Card>
          )}

          {isAdmin && !isLoading && !error && (
            <Tabs defaultValue="analyses" className="space-y-4">
              <TabsList className="bg-muted">
                <TabsTrigger value="analyses" className="gap-1.5">
                  <FileText className="h-3.5 w-3.5" />
                  All analyses ({analyses.length})
                </TabsTrigger>
                <TabsTrigger value="users" className="gap-1.5">
                  <Users className="h-3.5 w-3.5" />
                  Users ({users.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="analyses" className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <Select value={owner} onValueChange={setOwner}>
                    <SelectTrigger className="w-64 bg-input border-border">
                      <SelectValue placeholder="All users" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL}>All users</SelectItem>
                      {users.map((u) => (
                        <SelectItem key={u.id} value={u.email}>
                          {u.email} ({u.analyses})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="relative w-72">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Filter by technology or description…"
                      className="pl-8 bg-input border-border text-sm"
                      value={filter}
                      onChange={(e) => setFilter(e.target.value)}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground ml-auto">{visible.length} shown</span>
                </div>

                {visible.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-10">No analyses.</p>
                ) : (
                  <AnalysisList
                    items={visible}
                    showOwner
                    onOpen={(item) => {
                      setActive(item)
                      setOpen(true)
                    }}
                    onDelete={deleteAnalysis}
                  />
                )}
              </TabsContent>

              <TabsContent value="users" className="space-y-4">
                {resetDone && (
                  <p className="text-sm text-green-400">Password of {resetDone} was reset.</p>
                )}
                <Card className="border-border bg-card">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Analyses</TableHead>
                        <TableHead />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((u) => (
                        <TableRow key={u.id}>
                          <TableCell className="text-foreground">{u.email}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="border-border font-normal">
                              {u.role === "ADMIN" ? "Admin" : "User"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-xs">
                            {u.createdAt ? new Date(u.createdAt).toLocaleDateString("pt-PT") : "—"}
                          </TableCell>
                          <TableCell className="text-right">{u.analyses}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-1.5 text-muted-foreground"
                              onClick={() => {
                                setResetUser(u)
                                setResetError(null)
                                setResetDone(null)
                                setNewPassword("")
                              }}
                            >
                              <KeyRound className="h-3.5 w-3.5" />
                              Reset password
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </main>
      </div>

      <AnalysisResultDialog
        result={active}
        open={open}
        onOpenChange={setOpen}
        showOwner
        canShare
        onSharedChange={onSharedChange}
      />

      <Dialog open={!!resetUser} onOpenChange={(o) => !o && setResetUser(null)}>
        <DialogContent className="bg-card border-border text-foreground max-w-sm">
          <DialogHeader>
            <DialogTitle>Reset password</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              New password for <span className="text-foreground">{resetUser?.email}</span>
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="reset-password">New password</Label>
              <Input
                id="reset-password"
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="bg-input border-border"
              />
            </div>
            {resetError && <p className="text-sm text-red-400">{resetError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetUser(null)}>
              Cancel
            </Button>
            <Button
              className="bg-accent text-accent-foreground hover:bg-accent/90"
              disabled={resetting}
              onClick={submitReset}
            >
              {resetting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Reset"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
