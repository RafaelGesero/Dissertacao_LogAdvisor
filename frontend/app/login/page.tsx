"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { setToken } from "@/lib/auth"
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
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      if (!res.ok) {
        const msg = mode === "register" && res.status === 409
          ? "Email já registado."
          : "Credenciais inválidas."
        throw new Error(msg)
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
          <CardTitle className="text-foreground text-xl">LogAdvisor</CardTitle>
          <p className="text-sm text-muted-foreground">
            {mode === "login" ? "Inicia sessão para continuar" : "Cria uma conta"}
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-foreground text-sm">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-input border-border text-foreground"
                placeholder="email@exemplo.com"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-foreground text-sm">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-input border-border text-foreground"
                placeholder="••••••••"
              />
            </div>

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
                onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(null) }}
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
