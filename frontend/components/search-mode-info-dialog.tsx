"use client"

import { useEffect, useMemo, useState } from "react"
import { API_URL, apiFetch, errorMessage } from "@/lib/auth"
import { type SearchMode, modeInfo } from "@/lib/analysis"
import { ErrorBanner, LoadingState, ToneBadge } from "@/components/page-parts"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { CheckCircle2, MinusCircle, Search } from "lucide-react"
import { cn } from "@/lib/utils"

const EXPLANATIONS: Record<SearchMode, { summary: string; steps: string[]; pros: string[]; cons: string[] }> = {
  RULES: {
    summary:
      "Uses a fixed set of rules extracted from the 28 articles of the dissertation bibliography. The answer is grounded in that curated set only: no knowledge base and no internet search.",
    steps: [
      "The AI extracts the technologies, architecture and context (e.g. healthcare, GDPR) from your description.",
      "Each technology is matched to a section of the rules: a direct match, a match by derivation (e.g. Kotlin → Java), or the generic baseline when no section covers it.",
      "The log structure of each technology (mandatory fields, log levels, security events, log template and rules) comes straight from the rules, without AI.",
      "The AI writes the Security, Data Types and Storage guidance using only the rules most relevant to your application, citing rule IDs and sources.",
    ],
    pros: ["Fast and reproducible", "Every recommendation traceable to a rule and an article", "Says when a technology is not covered"],
    cons: ["Static: does not include literature published after the rules were built"],
  },
  KB: {
    summary:
      "Uses only the academic articles already stored in the knowledge base. Nothing is searched on the internet and the knowledge base is not changed.",
    steps: [
      "The AI extracts up to 4 technologies from your description.",
      "For each technology, a semantic search finds the most relevant articles in the knowledge base (vector search in Chroma).",
      "The AI writes the log structure for each technology based only on those articles, plus the security, data types and storage guidance.",
      "If the knowledge base has nothing relevant for a technology, the answer says so instead of inventing.",
    ],
    pros: ["Fast", "Uses articles you have reviewed and curated", "No search credits used"],
    cons: ["Limited to what is already in the knowledge base"],
  },
  KB_WITH_NEW: {
    summary:
      "Finds new articles on Google Scholar, adds them to the knowledge base and then answers using the whole knowledge base, old and new articles together.",
    steps: [
      "The AI extracts up to 4 technologies from your description.",
      "Google Scholar is searched (via SerpAPI) for 5 to 10 articles that are not in the knowledge base yet, alternating between the technologies.",
      "The new articles are saved in the knowledge base and listed in the Sources tab of the result.",
      "The analysis then runs like “Knowledge base”, over every article that matches your application.",
    ],
    pros: ["Brings in recent literature", "The knowledge base grows with every search"],
    cons: ["Slower", "Uses SerpAPI search credits", "New articles are not reviewed before being used"],
  },
}

type TechSection = {
  id: string
  name: string
  category: string
  evidence: string
  sources: string[]
  recognises: string[]
  recognisesDerived: string[]
  combineWith: string[]
  template: string[]
  notes: string[]
  rules: string[]
  limitations: string
}

type RulesView = {
  version: string
  technologies: TechSection[]
  groups: { label: string; items: { id: string; text: string }[] }[]
  sources: { key: string; reference: string; citation: string }[]
}

const EVIDENCE_TONE: Record<string, string> = {
  direta: "text-emerald-300 bg-emerald-500/10 border-emerald-500/25",
  parcial: "text-amber-300 bg-amber-500/10 border-amber-500/25",
  derivada: "text-zinc-300 bg-zinc-500/10 border-zinc-500/25",
}

const EVIDENCE_LABEL: Record<string, string> = { direta: "direct evidence", parcial: "partial evidence", derivada: "derived" }

function Chips({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-1">
      {items.map((t) => (
        <span key={t} className="rounded border border-border bg-muted/50 px-1.5 py-0.5 text-[11px] text-foreground">
          {t}
        </span>
      ))}
    </div>
  )
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
      {children}
    </div>
  )
}

function RulesBrowser() {
  const [data, setData] = useState<RulesView | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState("")

  useEffect(() => {
    apiFetch(`${API_URL}/rules`)
      .then(async (r) => {
        if (!r.ok) throw new Error(await errorMessage(r))
        return r.json()
      })
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : "Could not load the rules."))
  }, [])

  const technologies = useMemo(() => {
    if (!data) return []
    const q = query.trim().toLowerCase()
    if (!q) return data.technologies
    return data.technologies.filter((t) =>
      [t.name, ...t.recognises, ...t.recognisesDerived].some((v) => v.toLowerCase().includes(q))
    )
  }, [data, query])

  const names = useMemo(() => new Map((data?.technologies ?? []).map((t) => [t.id, t.name])), [data])

  if (error) return <ErrorBanner message={error} />
  if (!data) return <LoadingState label="Loading the rules…" />

  return (
    <Tabs defaultValue="tech" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <TabsList className="bg-muted">
          <TabsTrigger value="tech">Technologies ({data.technologies.length})</TabsTrigger>
          <TabsTrigger value="general">General rules</TabsTrigger>
          <TabsTrigger value="sources">Sources ({data.sources.length})</TabsTrigger>
        </TabsList>
        <span className="text-[11px] text-muted-foreground">{data.version}</span>
      </div>

      <TabsContent value="tech" className="mt-0 space-y-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Find a technology (e.g. Spring Boot, Django, Kubernetes)…"
            className="h-9 border-border bg-input pl-8 text-sm"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        {technologies.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No section recognises “{query}”. It would be answered with the generic baseline.
          </p>
        )}
        <Accordion type="multiple" className="overflow-hidden rounded-xl border border-border">
          {technologies.map((t) => (
            <AccordionItem key={t.id} value={t.id} className="border-border px-4 last:border-b-0">
              <AccordionTrigger className="py-3 hover:no-underline">
                <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 pr-2 text-left">
                  <span className="text-sm font-medium text-foreground">{t.name}</span>
                  <ToneBadge tone={EVIDENCE_TONE[t.evidence] ?? EVIDENCE_TONE.derivada}>
                    {EVIDENCE_LABEL[t.evidence] ?? t.evidence}
                  </ToneBadge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pb-4">
                {t.recognises.length > 0 && (
                  <Block title="Recognises">
                    <Chips items={t.recognises} />
                  </Block>
                )}
                {t.recognisesDerived.length > 0 && (
                  <Block title="Recognises by derivation">
                    <Chips items={t.recognisesDerived} />
                  </Block>
                )}
                {t.combineWith.length > 0 && (
                  <Block title="Combined with">
                    <Chips items={t.combineWith.map((id) => names.get(id) ?? id)} />
                  </Block>
                )}
                <Block title="Response template">
                  <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-lg bg-zinc-900 p-3 font-mono text-[11px] leading-relaxed text-green-300">
                    {t.template.join("\n")}
                  </pre>
                </Block>
                {t.rules.length > 0 && (
                  <Block title={`Rules (${t.rules.length})`}>
                    <ul className="space-y-1.5 text-xs leading-relaxed text-foreground">
                      {t.rules.map((r) => (
                        <li key={r} className="rounded-md bg-muted/40 px-2.5 py-1.5">
                          {r}
                        </li>
                      ))}
                    </ul>
                  </Block>
                )}
                {(t.notes.length > 0 || t.limitations) && (
                  <Block title="Notes and limitations">
                    <div className="space-y-1 text-xs text-muted-foreground">
                      {t.notes.map((n) => (
                        <p key={n}>{n}</p>
                      ))}
                      {t.limitations && <p>{t.limitations}</p>}
                    </div>
                  </Block>
                )}
                {t.sources.length > 0 && (
                  <p className="text-[11px] text-muted-foreground">Sources: {t.sources.join(", ")}</p>
                )}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </TabsContent>

      <TabsContent value="general" className="mt-0">
        <p className="mb-3 text-xs text-muted-foreground">
          Rules that apply to every application, whatever the technology.
        </p>
        <Accordion type="multiple" className="overflow-hidden rounded-xl border border-border">
          {data.groups
            .filter((g) => g.items.length > 0)
            .map((g) => (
              <AccordionItem key={g.label} value={g.label} className="border-border px-4 last:border-b-0">
                <AccordionTrigger className="py-3 hover:no-underline">
                  <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                    {g.label}
                    <span className="rounded-full bg-muted px-2 text-[11px] text-muted-foreground">{g.items.length}</span>
                  </span>
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  <ul className="space-y-1.5 text-xs leading-relaxed text-foreground">
                    {g.items.map((i) => (
                      <li key={i.id + i.text} className="rounded-md bg-muted/40 px-2.5 py-1.5">
                        {i.text}
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            ))}
        </Accordion>
      </TabsContent>

      <TabsContent value="sources" className="mt-0">
        <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border">
          {data.sources.map((s) => (
            <li key={s.key} className="px-4 py-3">
              <p className="text-xs font-semibold text-accent">
                {s.key} <span className="font-normal text-muted-foreground">· {s.reference}</span>
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-foreground">{s.citation}</p>
            </li>
          ))}
        </ul>
      </TabsContent>
    </Tabs>
  )
}

export function SearchModeInfoDialog({
  mode,
  onOpenChange,
}: {
  mode: SearchMode | null
  onOpenChange: (open: boolean) => void
}) {
  const info = modeInfo(mode ?? "RULES")
  const text = EXPLANATIONS[info.value]

  return (
    <Dialog open={mode !== null} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "flex w-[calc(100vw-2rem)] flex-col gap-0 overflow-hidden border-border bg-card p-0 text-foreground",
          info.value === "RULES" ? "max-w-4xl sm:max-w-4xl" : "max-w-xl sm:max-w-xl"
        )}
        style={{ maxHeight: "88vh" }}
      >
        <DialogHeader className="shrink-0 space-y-2 border-b border-border px-6 pb-4 pt-6">
          <DialogTitle className="flex items-center gap-3">
            <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg border", info.tone)}>
              <info.Icon className="h-4 w-4" />
            </span>
            {info.title}
          </DialogTitle>
          <DialogDescription className="text-sm leading-relaxed text-muted-foreground">{text.summary}</DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">How it works</h3>
            <ol className="space-y-2.5">
              {text.steps.map((step, i) => (
                <li key={i} className="flex gap-3 text-sm leading-relaxed text-foreground">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/15 text-xs font-semibold text-accent">
                    {i + 1}
                  </span>
                  <span className="pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
          </section>

          <section className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 rounded-xl border border-border p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-emerald-300">Strengths</h3>
              {text.pros.map((p) => (
                <p key={p} className="flex gap-2 text-sm text-foreground">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                  {p}
                </p>
              ))}
            </div>
            <div className="space-y-2 rounded-xl border border-border p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-amber-300">Limitations</h3>
              {text.cons.map((c) => (
                <p key={c} className="flex gap-2 text-sm text-foreground">
                  <MinusCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                  {c}
                </p>
              ))}
            </div>
          </section>

          {info.value === "RULES" && (
            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">The predefined rules</h3>
              <RulesBrowser />
            </section>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
