"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { errorMessage, setToken } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Shield, Loader2, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<"login" | "register">("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (mode === "register") {
      if (password.length < 5) return setError("A password tem de ter pelo menos 5 caracteres.")
      if (password !== confirm) return setError("As passwords não coincidem.")
    }
    setLoading(true)

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      if (!res.ok) {
        throw new Error(await errorMessage(res, mode === "login" ? "Credenciais inválidas." : "Não foi possível criar a conta."))
      }

      const data = await res.json()
      setToken(data.token)
      router.push("/")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido.")
    } finally {
      setLoading(false)
    }
  }

  const switchMode = (next: "login" | "register") => {
    setMode(next)
    setError(null)
    setConfirm("")
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-4">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--color-accent)_0%,transparent_55%)] opacity-20"
      />
      <div className="relative w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/15 ring-1 ring-accent/40">
            <Shield className="h-6 w-6 text-accent" />
          </div>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground">LoggingAdvisor</h1>
          <p className="mt-1 text-sm text-muted-foreground">Recomendações de logging seguro para a tua aplicação</p>
        </div>

        <div className="rounded-2xl border border-border bg-card/90 p-6 shadow-xl shadow-black/30 backdrop-blur">
          <div className="mb-6 grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
            {(["login", "register"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => switchMode(m)}
                className={cn(
                  "rounded-md py-1.5 text-sm font-medium transition-colors",
                  mode === m ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {m === "login" ? "Entrar" : "Criar conta"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm text-foreground">
                Nome de utilizador
              </Label>
              <Input
                id="email"
                type="text"
                autoComplete="username"
                autoCapitalize="none"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-10 border-border bg-input text-foreground"
                placeholder="ex.: rafael"
              />
              {mode === "register" && (
                <p className="text-xs text-muted-foreground">3 a 50 caracteres: letras, números, ".", "_" ou "-".</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm text-foreground">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-10 border-border bg-input text-foreground"
                placeholder="••••••••"
              />
              {mode === "register" && <p className="text-xs text-muted-foreground">Mínimo de 5 caracteres.</p>}
            </div>

            {mode === "register" && (
              <div className="space-y-1.5">
                <Label htmlFor="confirm" className="text-sm text-foreground">Confirmar password</Label>
                <Input
                  id="confirm"
                  type="password"
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  className="h-10 border-border bg-input text-foreground"
                  placeholder="••••••••"
                />
              </div>
            )}

            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="h-10 w-full bg-accent text-accent-foreground hover:bg-accent/90"
              disabled={loading}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : mode === "login" ? "Entrar" : "Criar conta"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
