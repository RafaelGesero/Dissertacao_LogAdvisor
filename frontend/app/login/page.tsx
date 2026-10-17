"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { errorMessage, setToken } from "@/lib/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ShieldCheck, Loader2, AlertTriangle } from "lucide-react"

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

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-sm border-border bg-card">
        <CardHeader className="text-center space-y-2 pb-4">
          <div className="flex justify-center">
            <div className="rounded-full bg-accent/10 p-3">
              <ShieldCheck className="h-6 w-6 text-accent" />
            </div>
          </div>
          <CardTitle className="text-foreground text-xl">LoggingAdvisor</CardTitle>
          <p className="text-sm text-muted-foreground">
            {mode === "login" ? "Inicia sessão para continuar" : "Cria uma conta"}
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-foreground text-sm">
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
                className="bg-input border-border text-foreground"
                placeholder="ex.: rafael"
              />
              {mode === "register" && (
                <p className="text-xs text-muted-foreground">3 a 50 caracteres: letras, números, ".", "_" ou "-".</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-foreground text-sm">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-input border-border text-foreground"
                placeholder="••••••••"
              />
              {mode === "register" && (
                <p className="text-xs text-muted-foreground">Mínimo de 5 caracteres.</p>
              )}
            </div>

            {mode === "register" && (
              <div className="space-y-1.5">
                <Label htmlFor="confirm" className="text-foreground text-sm">Confirmar password</Label>
                <Input
                  id="confirm"
                  type="password"
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  className="bg-input border-border text-foreground"
                  placeholder="••••••••"
                />
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-400 bg-red-950/20 border border-red-800/30 rounded-md p-3">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
              disabled={loading}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : mode === "login" ? "Entrar" : "Registar"}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              {mode === "login" ? "Não tens conta? " : "Já tens conta? "}
              <button
                type="button"
                className="text-accent hover:underline"
                onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(null); setConfirm("") }}
              >
                {mode === "login" ? "Registar" : "Entrar"}
              </button>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
