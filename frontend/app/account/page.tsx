"use client"

import { useState } from "react"
import { API_URL, apiJson, errorMessage, signOut, useCurrentUser } from "@/lib/auth"
import { AppShell } from "@/components/app-shell"
import { initials } from "@/components/app-sidebar"
import { ErrorBanner } from "@/components/page-parts"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CheckCircle2, KeyRound, Loader2, LogOut } from "lucide-react"
import { useT } from "@/lib/i18n"

const MIN_PASSWORD = 5

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right text-foreground">{children}</span>
    </div>
  )
}

export default function AccountPage() {
  const me = useCurrentUser()
  const { t } = useT()
  const [current, setCurrent] = useState("")
  const [next, setNext] = useState("")
  const [confirm, setConfirm] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setDone(false)
    if (next.length < MIN_PASSWORD) return setError(t("account.error.length", { n: MIN_PASSWORD }))
    if (next !== confirm) return setError(t("account.error.match"))

    setSaving(true)
    try {
      const res = await apiJson(`${API_URL}/auth/change-password`, "POST", {
        currentPassword: current,
        newPassword: next,
      })
      if (!res.ok) throw new Error(await errorMessage(res))
      setDone(true)
      setCurrent("")
      setNext("")
      setConfirm("")
    } catch (err) {
      setError(err instanceof Error ? err.message : t("account.error.generic"))
    } finally {
      setSaving(false)
    }
  }

  return (
    <AppShell title={t("account.title")} description={t("account.subtitle")} width="narrow">
      <div className="space-y-6">
        <section className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="flex items-center gap-4 border-b border-border bg-gradient-to-r from-accent/15 to-transparent p-6">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/20 text-lg font-semibold text-accent ring-1 ring-accent/40">
              {initials(me?.email)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-lg font-semibold text-foreground">{me?.email ?? "…"}</p>
              <p className="text-sm text-muted-foreground">{me?.role === "ADMIN" ? t("role.admin") : t("role.user")}</p>
            </div>
            <Button variant="outline" size="sm" className="ml-auto gap-2" onClick={signOut}>
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">{t("nav.signOut")}</span>
            </Button>
          </div>
          <div className="divide-y divide-border px-6">
            <Row label={t("account.username")}>{me?.email ?? "—"}</Row>
            <Row label={t("account.role")}>{me?.role === "ADMIN" ? t("role.admin") : t("role.user")}</Row>
            <Row label={t("account.analyses")}>{me?.analyses ?? "—"}</Row>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card">
          <div className="flex items-center gap-3 border-b border-border p-6">
            <div className="rounded-lg bg-accent/15 p-2">
              <KeyRound className="h-5 w-5 text-accent" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">{t("account.changePassword")}</h2>
              <p className="text-sm text-muted-foreground">{t("account.minLength", { n: MIN_PASSWORD })}</p>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4 p-6">
            <div className="space-y-1.5">
              <Label htmlFor="current">{t("account.current")}</Label>
              <Input id="current" type="password" autoComplete="current-password" required
                value={current} onChange={(e) => setCurrent(e.target.value)} className="border-border bg-input" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="new">{t("account.new")}</Label>
                <Input id="new" type="password" autoComplete="new-password" required minLength={MIN_PASSWORD}
                  value={next} onChange={(e) => setNext(e.target.value)} className="border-border bg-input" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirm">{t("account.confirm")}</Label>
                <Input id="confirm" type="password" autoComplete="new-password" required
                  value={confirm} onChange={(e) => setConfirm(e.target.value)} className="border-border bg-input" />
              </div>
            </div>

            {error && <ErrorBanner message={error} />}
            {done && (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                {t("account.changed")}
              </div>
            )}

            <div className="flex justify-end">
              <Button type="submit" disabled={saving} className="bg-accent text-accent-foreground hover:bg-accent/90">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : t("account.changePassword")}
              </Button>
            </div>
          </form>
        </section>
      </div>
    </AppShell>
  )
}
