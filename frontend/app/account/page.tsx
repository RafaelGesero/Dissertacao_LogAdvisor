"use client"

import { useState } from "react"
import { API_URL, apiJson, errorMessage, signOut, useCurrentUser } from "@/lib/auth"
import { AppSidebar } from "@/components/app-sidebar"
import { AppHeader } from "@/components/app-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, CheckCircle2, KeyRound, Loader2, LogOut, User } from "lucide-react"

const MIN_PASSWORD = 5

export default function AccountPage() {
  const me = useCurrentUser()
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
    if (next.length < MIN_PASSWORD) return setError(`The new password must have at least ${MIN_PASSWORD} characters.`)
    if (next !== confirm) return setError("The new passwords do not match.")

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
      setError(err instanceof Error ? err.message : "Could not change the password.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <div className="flex-1 pl-64">
        <AppHeader title="Account" description="Your LoggingAdvisor account" />
        <main className="p-6 space-y-6 max-w-2xl">
          <Card className="border-border bg-card">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-md bg-accent/20 p-2">
                  <User className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <CardTitle className="text-foreground">Profile</CardTitle>
                  <CardDescription>Signed-in user</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {me ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Username</span>
                    <span className="text-foreground">{me.email}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Role</span>
                    <Badge variant="outline" className="border-border">
                      {me.role === "ADMIN" ? "Administrator" : "User"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Analyses</span>
                    <span className="text-foreground">{me.analyses}</span>
                  </div>
                </>
              ) : (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              )}
              <div className="pt-2">
                <Button variant="outline" className="gap-2" onClick={signOut}>
                  <LogOut className="h-4 w-4" />
                  Sign out
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-md bg-accent/20 p-2">
                  <KeyRound className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <CardTitle className="text-foreground">Change password</CardTitle>
                  <CardDescription>At least {MIN_PASSWORD} characters</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="current">Current password</Label>
                  <Input id="current" type="password" autoComplete="current-password" required
                    value={current} onChange={(e) => setCurrent(e.target.value)} className="bg-input border-border" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="new">New password</Label>
                  <Input id="new" type="password" autoComplete="new-password" required minLength={MIN_PASSWORD}
                    value={next} onChange={(e) => setNext(e.target.value)} className="bg-input border-border" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="confirm">Confirm new password</Label>
                  <Input id="confirm" type="password" autoComplete="new-password" required
                    value={confirm} onChange={(e) => setConfirm(e.target.value)} className="bg-input border-border" />
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-sm text-red-400 bg-red-950/20 border border-red-800/30 rounded-md p-3">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    {error}
                  </div>
                )}
                {done && (
                  <div className="flex items-center gap-2 text-sm text-green-400 bg-green-950/20 border border-green-800/30 rounded-md p-3">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    Password changed.
                  </div>
                )}

                <Button type="submit" disabled={saving} className="bg-accent text-accent-foreground hover:bg-accent/90">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Change password"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}
