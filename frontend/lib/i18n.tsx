"use client"

import { createContext, useCallback, useContext, useEffect, useState } from "react"
import { en, pt, type Dictionary } from "@/lib/translations"

export type Language = "en" | "pt"

const STORAGE_KEY = "loggingadvisor_lang"
const DICTIONARIES: Record<Language, Dictionary> = { en, pt }

/** The language stored by the switch, read outside React (e.g. to set Accept-Language on API calls). */
export function storedLanguage(): Language {
  if (typeof window === "undefined") return "en"
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === "en" || saved === "pt") return saved
  } catch {
    // storage unavailable
  }
  return navigator.language?.toLowerCase().startsWith("pt") ? "pt" : "en"
}

type Ctx = {
  lang: Language
  setLang: (lang: Language) => void
  t: (key: keyof Dictionary, vars?: Record<string, string | number>) => string
}

const LanguageContext = createContext<Ctx | null>(null)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>("en")

  useEffect(() => {
    setLangState(storedLanguage())
  }, [])

  useEffect(() => {
    document.documentElement.lang = lang === "pt" ? "pt-PT" : "en"
  }, [lang])

  const setLang = useCallback((next: Language) => {
    setLangState(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // storage unavailable: the choice lasts until reload
    }
  }, [])

  const t = useCallback(
    (key: keyof Dictionary, vars?: Record<string, string | number>) => {
      let text: string = DICTIONARIES[lang][key] ?? en[key] ?? String(key)
      if (vars) for (const [k, v] of Object.entries(vars)) text = text.replaceAll(`{${k}}`, String(v))
      return text
    },
    [lang]
  )

  return <LanguageContext.Provider value={{ lang, setLang, t }}>{children}</LanguageContext.Provider>
}

export function useT() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error("useT must be used inside LanguageProvider")
  return ctx
}

/** ISO date (or an already formatted one) in the chosen language. */
export function formatDate(value: string | undefined | null, lang: Language): string {
  if (!value) return ""
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleString(lang === "pt" ? "pt-PT" : "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function LanguageSwitch({ className }: { className?: string }) {
  const { lang, setLang, t } = useT()
  return (
    <div
      role="radiogroup"
      aria-label={t("lang.label")}
      className={`inline-flex items-center rounded-full border border-border bg-muted/60 p-0.5 text-[11px] font-semibold ${className ?? ""}`}
    >
      {(["pt", "en"] as const).map((l) => (
        <button
          key={l}
          type="button"
          role="radio"
          aria-checked={lang === l}
          title={l === "pt" ? "Português" : "English"}
          aria-label={l === "pt" ? "Português" : "English"}
          onClick={() => setLang(l)}
          className={`rounded-full px-2.5 py-1 transition-colors ${
            lang === l ? "bg-accent text-accent-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  )
}
