"use client"

import { useEffect, useMemo, useState } from "react"
import { API_URL, apiFetch, apiJson, errorMessage, useCurrentUser, type CurrentUser } from "@/lib/auth"
import { type AnalysisResult, type HistoryEntry, displayKeywords, historyToResult } from "@/lib/analysis"
import { AppShell } from "@/components/app-shell"
import { EmptyState, ErrorBanner, LoadingState, StatTile } from "@/components/page-parts"
import { AnalysisList } from "@/components/analysis-list"
import { AnalysisResultDialog } from "@/components/analysis-result-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { FileText, KeyRound, Loader2, Lock, Search, Share2, Users } from "lucide-react"
import { useT } from "@/lib/i18n"

const ALL = "__all__"

export default function AdminPage() {
  const me = useCurrentUser()
  const { t, lang } = useT()
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
      .catch((e) => setError(e instanceof Error ? e.message : t("admin.loadError")))
      .finally(() => setIsLoading(false))
  }, [isAdmin])

  const visible = useMemo(() => {
    const q = filter.trim().toLowerCase()
    return analyses.filter(
      (a) =>
        (owner === ALL || a.owner === owner) &&
        (!q || [displayKeywords(a.keywords), a.query].some((v) => v?.toLowerCase().includes(q)))
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
    if (newPassword.length < 5) return setResetError(t("account.error.length", { n: 5 }))
    setResetting(true)
    try {
      const res = await apiJson(`${API_URL}/admin/users/${resetUser.id}/password`, "PUT", { newPassword })
      if (!res.ok) throw new Error(await errorMessage(res))
      setResetDone(resetUser.email)
      setResetUser(null)
      setNewPassword("")
    } catch (e) {
      setResetError(e instanceof Error ? e.message : t("admin.resetError"))
    } finally {
      setResetting(false)
    }
  }

  return (
    <AppShell title={t("admin.title")} description={t("admin.subtitle")}>
      <div className="space-y-6">
          {me && !isAdmin && (
            <EmptyState icon={Lock} title={t("admin.only.title")} description={t("admin.only.text")} />
          )}

          {isAdmin && isLoading && <LoadingState label={t("common.loading")} />}
          {error && <ErrorBanner message={error} />}

          {isAdmin && !isLoading && !error && (
            <>
            <div className="grid gap-4 sm:grid-cols-3">
              <StatTile label={t("admin.users")} value={users.length} icon={Users} />
              <StatTile label={t("admin.analyses")} value={analyses.length} icon={FileText} />
              <StatTile label={t("admin.sharedAnalyses")} value={analyses.filter((a) => a.shared).length} icon={Share2} />
            </div>

            <Tabs defaultValue="analyses" className="space-y-4">
              <TabsList className="bg-muted">
                <TabsTrigger value="analyses" className="gap-1.5">
                  <FileText className="h-3.5 w-3.5" />
                  {t("admin.tab.analyses")}
                </TabsTrigger>
                <TabsTrigger value="users" className="gap-1.5">
                  <Users className="h-3.5 w-3.5" />
                  {t("admin.users")}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="analyses" className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <Select value={owner} onValueChange={setOwner}>
                    <SelectTrigger className="w-64 bg-input border-border">
                      <SelectValue placeholder={t("admin.allUsers")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL}>{t("admin.allUsers")}</SelectItem>
                      {users.map((u) => (
                        <SelectItem key={u.id} value={u.email}>
                          {u.email} ({u.analyses})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="relative w-72">
                    <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder={t("admin.filter")}
                      className="h-9 pl-8 bg-input border-border text-sm"
                      value={filter}
                      onChange={(e) => setFilter(e.target.value)}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground ml-auto">{t("admin.shown", { n: visible.length })}</span>
                </div>

                {visible.length === 0 ? (
                  <EmptyState icon={FileText} title={t("admin.noAnalyses")} />
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
                  <p className="text-sm text-emerald-300">{t("admin.resetDone", { user: resetDone })}</p>
                )}
                <div className="overflow-hidden rounded-xl border border-border bg-card">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="pl-5">{t("admin.col.user")}</TableHead>
                        <TableHead>{t("account.role")}</TableHead>
                        <TableHead>{t("admin.col.created")}</TableHead>
                        <TableHead className="text-right">{t("admin.analyses")}</TableHead>
                        <TableHead />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((u) => (
                        <TableRow key={u.id}>
                          <TableCell className="pl-5 font-medium text-foreground">{u.email}</TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={u.role === "ADMIN" ? "border-accent/40 text-accent font-normal" : "border-border font-normal"}
                            >
                              {u.role === "ADMIN" ? t("role.admin") : t("role.user")}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-xs">
                            {u.createdAt ? new Date(u.createdAt).toLocaleDateString(lang === "pt" ? "pt-PT" : "en-GB") : "—"}
                          </TableCell>
                          <TableCell className="text-right">{u.analyses}</TableCell>
                          <TableCell className="text-right pr-4">
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
                              {t("admin.resetPassword")}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            </Tabs>
            </>
          )}
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
            <DialogTitle>{t("admin.resetPassword")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {t("admin.newPasswordFor")} <span className="text-foreground">{resetUser?.email}</span>
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="reset-password">{t("account.new")}</Label>
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
              {t("common.cancel")}
            </Button>
            <Button
              className="bg-accent text-accent-foreground hover:bg-accent/90"
              disabled={resetting}
              onClick={submitReset}
            >
              {resetting ? <Loader2 className="h-4 w-4 animate-spin" /> : t("admin.reset")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  )
}
