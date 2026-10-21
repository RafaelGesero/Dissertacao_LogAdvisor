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
import { type Language, useT } from "@/lib/i18n"
import type { TranslationKey } from "@/lib/translations"

type Explanation = { summary: string; steps: string[]; pros: string[]; cons: string[] }

const EXPLANATIONS: Record<Language, Record<SearchMode, Explanation>> = {
  en: {
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
        "For each technology, Google Scholar is searched (via SerpAPI) for up to 5 articles that are not in the knowledge base yet.",
        "The new articles are saved in the knowledge base and listed in the Sources tab of the result.",
        "Only then is the knowledge base searched: the analysis uses every article in it (old and new) that matches the technologies of your description.",
      ],
      pros: ["Brings in recent literature", "The knowledge base grows with every search"],
      cons: ["Slower", "Uses SerpAPI search credits", "New articles are not reviewed before being used"],
  },
  },
  pt: {
    RULES: {
      summary:
        "Usa um conjunto fixo de regras extraídas dos 28 artigos da bibliografia da dissertação. A resposta baseia-se apenas nesse conjunto: não usa a base de conhecimento nem pesquisa na internet.",
      steps: [
        "A IA extrai da tua descrição as tecnologias, a arquitetura e o contexto (por exemplo saúde ou RGPD).",
        "Cada tecnologia é associada a uma secção das regras: correspondência direta, por derivação (por exemplo Kotlin → Java) ou a base genérica quando nenhuma secção a cobre.",
        "A estrutura de logs de cada tecnologia (campos obrigatórios, níveis, eventos de segurança, template de log e regras) vem diretamente das regras, sem IA.",
        "A IA escreve as secções Segurança, Tipos de dados e Armazenamento usando apenas as regras mais relevantes para a tua aplicação, citando os IDs das regras e as fontes.",
      ],
      pros: ["Rápido e reprodutível", "Cada recomendação é rastreável até uma regra e um artigo", "Indica quando uma tecnologia não está coberta"],
      cons: ["Estático: não inclui literatura publicada depois de as regras terem sido construídas"],
    },
    KB: {
      summary:
        "Usa apenas os artigos científicos já guardados na base de conhecimento. Não pesquisa nada na internet e não altera a base de conhecimento.",
      steps: [
        "A IA extrai até 4 tecnologias da tua descrição.",
        "Para cada tecnologia, uma pesquisa semântica encontra os artigos mais relevantes na base de conhecimento (pesquisa vetorial no Chroma).",
        "A IA escreve a estrutura de logs de cada tecnologia com base apenas nesses artigos, e ainda as orientações de segurança, tipos de dados e armazenamento.",
        "Se a base de conhecimento não tiver nada relevante para uma tecnologia, a resposta di-lo em vez de inventar.",
      ],
      pros: ["Rápido", "Usa artigos que já reviste e organizaste", "Não gasta créditos de pesquisa"],
      cons: ["Limitado ao que já está na base de conhecimento"],
    },
    KB_WITH_NEW: {
      summary:
        "Procura artigos novos no Google Scholar, adiciona-os à base de conhecimento e depois responde com a base de conhecimento toda, artigos antigos e novos.",
      steps: [
        "A IA extrai até 4 tecnologias da tua descrição.",
        "Para cada tecnologia, pesquisa no Google Scholar (através da SerpAPI) até 5 artigos que ainda não estão na base de conhecimento.",
        "Os artigos novos são guardados na base de conhecimento e listados no separador Fontes do resultado.",
        "Só depois é pesquisada a base de conhecimento: a análise usa todos os artigos (antigos e novos) que correspondem às tecnologias da tua descrição.",
      ],
      pros: ["Traz literatura recente", "A base de conhecimento cresce a cada pesquisa"],
      cons: ["Mais lento", "Gasta créditos de pesquisa da SerpAPI", "Os artigos novos não são revistos antes de serem usados"],
    },
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
  groups: { key: string; label: string; items: { id: string; text: string }[] }[]
  sources: { key: string; reference: string; citation: string }[]
}

const EVIDENCE_TONE: Record<string, string> = {
  direta: "text-emerald-300 bg-emerald-500/10 border-emerald-500/25",
  parcial: "text-amber-300 bg-amber-500/10 border-amber-500/25",
  derivada: "text-zinc-300 bg-zinc-500/10 border-zinc-500/25",
}


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

const GROUP_KEYS: Record<string, TranslationKey> = {
  UNIVERSAL: "rules.group.UNIVERSAL",
  SECURITY: "rules.group.SECURITY",
  EVENT_CODES: "rules.group.EVENT_CODES",
  STANDARDS: "rules.group.STANDARDS",
  ANONYMISATION: "rules.group.ANONYMISATION",
  DATA_TYPE: "rules.group.DATA_TYPE",
  NEVER_LOG: "rules.group.NEVER_LOG",
  GDPR: "rules.group.GDPR",
  RETENTION: "rules.group.RETENTION",
  ENCRYPTION: "rules.group.ENCRYPTION",
}

function RulesBrowser() {
  const { t } = useT()
  // the technology loop below names its item "t", so translations are also reachable as "tr"
  const tr = t
  const evidenceLabel = (e: string) =>
    e === "direta" ? tr("rules.evidence.direct") : e === "parcial" ? tr("rules.evidence.partial") : e === "derivada" ? tr("rules.evidence.derived") : e
  const groupLabel = (key: string, label: string) => (GROUP_KEYS[key] ? tr(GROUP_KEYS[key]) : label)
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
      .catch((e) => setError(e instanceof Error ? e.message : t("rules.loadError")))
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
  if (!data) return <LoadingState label={t("rules.loading")} />

  return (
    <Tabs defaultValue="tech" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <TabsList className="bg-muted">
          <TabsTrigger value="tech">{t("rules.tab.technologies", { n: data.technologies.length })}</TabsTrigger>
          <TabsTrigger value="general">{t("rules.tab.general")}</TabsTrigger>
          <TabsTrigger value="sources">{t("rules.tab.sources", { n: data.sources.length })}</TabsTrigger>
        </TabsList>
        <span className="text-[11px] text-muted-foreground">{data.version}</span>
      </div>

      <TabsContent value="tech" className="mt-0 space-y-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("rules.search")}
            className="h-9 border-border bg-input pl-8 text-sm"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        {technologies.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">
            {tr("rules.noMatch", { q: query })}
          </p>
        )}
        <Accordion type="multiple" className="overflow-hidden rounded-xl border border-border">
          {technologies.map((t) => (
            <AccordionItem key={t.id} value={t.id} className="border-border px-4 last:border-b-0">
              <AccordionTrigger className="py-3 hover:no-underline">
                <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 pr-2 text-left">
                  <span className="text-sm font-medium text-foreground">{t.name}</span>
                  <ToneBadge tone={EVIDENCE_TONE[t.evidence] ?? EVIDENCE_TONE.derivada}>
                    {evidenceLabel(t.evidence)}
                  </ToneBadge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pb-4">
                {t.recognises.length > 0 && (
                  <Block title={tr("rules.recognises")}>
                    <Chips items={t.recognises} />
                  </Block>
                )}
                {t.recognisesDerived.length > 0 && (
                  <Block title={tr("rules.recognisesDerived")}>
                    <Chips items={t.recognisesDerived} />
                  </Block>
                )}
                {t.combineWith.length > 0 && (
                  <Block title={tr("rules.combinedWith")}>
                    <Chips items={t.combineWith.map((id) => names.get(id) ?? id)} />
                  </Block>
                )}
                <Block title={tr("rules.template")}>
                  <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-lg bg-zinc-900 p-3 font-mono text-[11px] leading-relaxed text-green-300">
                    {t.template.join("\n")}
                  </pre>
                </Block>
                {t.rules.length > 0 && (
                  <Block title={tr("rules.rules", { n: t.rules.length })}>
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
                  <Block title={tr("rules.notes")}>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      {t.notes.map((n) => (
                        <p key={n}>{n}</p>
                      ))}
                      {t.limitations && <p>{t.limitations}</p>}
                    </div>
                  </Block>
                )}
                {t.sources.length > 0 && (
                  <p className="text-[11px] text-muted-foreground">{tr("rules.sources")}: {t.sources.join(", ")}</p>
                )}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </TabsContent>

      <TabsContent value="general" className="mt-0">
        <p className="mb-3 text-xs text-muted-foreground">
          {tr("rules.generalIntro")}
        </p>
        <Accordion type="multiple" className="overflow-hidden rounded-xl border border-border">
          {data.groups
            .filter((g) => g.items.length > 0)
            .map((g) => (
              <AccordionItem key={g.label} value={g.label} className="border-border px-4 last:border-b-0">
                <AccordionTrigger className="py-3 hover:no-underline">
                  <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                    {groupLabel(g.key, g.label)}
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
  const { t, lang } = useT()
  const info = modeInfo(mode ?? "RULES")
  const text = EXPLANATIONS[lang][info.value]

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
            {t(info.title)}
          </DialogTitle>
          <DialogDescription className="text-sm leading-relaxed text-muted-foreground">{text.summary}</DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">{t("info.howItWorks")}</h3>
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
              <h3 className="text-xs font-semibold uppercase tracking-wide text-emerald-300">{t("info.strengths")}</h3>
              {text.pros.map((p) => (
                <p key={p} className="flex gap-2 text-sm text-foreground">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                  {p}
                </p>
              ))}
            </div>
            <div className="space-y-2 rounded-xl border border-border p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-amber-300">{t("info.limitations")}</h3>
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
              <h3 className="text-sm font-semibold text-foreground">{t("info.rulesTitle")}</h3>
              <RulesBrowser />
            </section>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
