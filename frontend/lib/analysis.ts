import type { ElementType } from "react"
import { BookOpen, Database, Globe } from "lucide-react"

export type SearchMode = "RULES" | "KB" | "KB_WITH_NEW"

export type ArticleSource = {
  id?: number
  title: string
  link: string
  publication: string
  technology: string
}

export type LogSection = {
  technology: string
  content: string
}

export type AnalysisResult = {
  historyId?: number
  query?: string
  keywords: string
  mode: SearchMode
  shared: boolean
  owner?: string | null
  createdAt?: string
  logStructure: LogSection[]
  securityGuidance: string
  dataTypes: string
  storageTips: string
  sources: ArticleSource[]
  newArticles: ArticleSource[]
}

/** Shape returned by /log/history, /log/shared and /admin/history. */
export type HistoryEntry = {
  id: number
  keywords: string
  query: string
  createdAt: string
  mode: SearchMode
  shared: boolean
  owner: string | null
  logStructure: LogSection[]
  securityGuidance: string | null
  dataTypes: string | null
  storageTips: string | null
  sources: ArticleSource[]
  newArticles: ArticleSource[] | null
}

export function historyToResult(e: HistoryEntry): AnalysisResult {
  return {
    historyId: e.id,
    query: e.query,
    keywords: e.keywords,
    mode: e.mode,
    shared: e.shared,
    owner: e.owner,
    createdAt: e.createdAt,
    logStructure: e.logStructure ?? [],
    securityGuidance: e.securityGuidance ?? "",
    dataTypes: e.dataTypes ?? "",
    storageTips: e.storageTips ?? "",
    sources: e.sources ?? [],
    newArticles: e.newArticles ?? [],
  }
}

export const SEARCH_MODES: {
  value: SearchMode
  title: string
  short: string
  description: string
  Icon: ElementType
  /** Badge/icon colours for this mode. */
  tone: string
}[] = [
  {
    value: "RULES",
    title: "Predefined rules",
    short: "Predefined rules",
    description: "Uses the rules built from the 28 articles of the dissertation bibliography.",
    Icon: BookOpen,
    tone: "text-sky-300 bg-sky-500/10 border-sky-500/25",
  },
  {
    value: "KB",
    title: "Knowledge base",
    short: "KB",
    description: "Uses only the articles already stored in the knowledge base.",
    Icon: Database,
    tone: "text-emerald-300 bg-emerald-500/10 border-emerald-500/25",
  },
  {
    value: "KB_WITH_NEW",
    title: "KB + new articles",
    short: "KB + new",
    description: "Finds 5–10 new articles, adds them to the knowledge base, then uses the whole base.",
    Icon: Globe,
    tone: "text-amber-300 bg-amber-500/10 border-amber-500/25",
  },
]

export function modeInfo(mode: SearchMode | undefined) {
  return SEARCH_MODES.find((m) => m.value === mode) ?? SEARCH_MODES[2]
}

/** Older analyses stored the fixed search terms with the keywords; they are noise in titles. */
const FIXED_SEARCH_TERMS = /\s*security logging data protection information security\s*$/i

export function displayKeywords(keywords: string | undefined): string {
  const k = (keywords ?? "").replace(FIXED_SEARCH_TERMS, "").trim()
  return k || "Analysis"
}
