"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Shield, Database, Share2, ShieldCheck, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"
import { signOut, useCurrentUser } from "@/lib/auth"
import { useT } from "@/lib/i18n"
import type { TranslationKey } from "@/lib/translations"

type NavSection = { title: TranslationKey; items: { name: TranslationKey; href: string; icon: React.ElementType }[] }

const baseNavigation: NavSection[] = [
  {
    title: "nav.workspace",
    items: [
      { name: "nav.start", href: "/", icon: LayoutDashboard },
      { name: "nav.shared", href: "/shared", icon: Share2 },
      { name: "nav.kb", href: "/knowledge-base", icon: Database },
    ],
  },
]

const adminNavigation: NavSection = {
  title: "nav.administration",
  items: [{ name: "nav.admin", href: "/admin", icon: ShieldCheck }],
}

export function initials(name: string | undefined) {
  return (name ?? "?").replace(/@.*/, "").slice(0, 2).toUpperCase()
}

/** Logo, navigation and signed-in user; used by the desktop sidebar and the mobile menu. */
export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  const me = useCurrentUser()
  const { t } = useT()
  const navigation = me?.role === "ADMIN" ? [...baseNavigation, adminNavigation] : baseNavigation

  return (
    <div className="flex h-full flex-col">
      <Link href="/" onClick={onNavigate} className="flex h-16 items-center gap-3 border-b border-sidebar-border px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/15 ring-1 ring-accent/30">
          <Shield className="h-5 w-5 text-accent" />
        </div>
        <div className="leading-tight">
          <p className="text-[15px] font-semibold text-foreground">LoggingAdvisor</p>
          <p className="text-[11px] text-muted-foreground">{t("brand.tagline")}</p>
        </div>
      </Link>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
        {navigation.map((section) => (
          <div key={section.title}>
            <h3 className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80">
              {t(section.title)}
            </h3>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = pathname === item.href
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      className={cn(
                        "relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-sidebar-accent text-foreground"
                          : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground"
                      )}
                    >
                      {isActive && <span className="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-accent" />}
                      <item.icon className={cn("h-4 w-4", isActive && "text-accent")} />
                      {t(item.name)}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-2 rounded-lg p-2 hover:bg-sidebar-accent/60 transition-colors">
          <Link href="/account" onClick={onNavigate} className="flex min-w-0 flex-1 items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/20 text-xs font-semibold text-accent">
              {initials(me?.email)}
            </div>
            <div className="min-w-0 leading-tight">
              <p className="truncate text-sm font-medium text-foreground">{me?.email ?? t("nav.account")}</p>
              <p className="text-[11px] text-muted-foreground">{me?.role === "ADMIN" ? t("role.admin") : t("role.user")}</p>
            </div>
          </Link>
          <button
            onClick={signOut}
            title={t("nav.signOut")}
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

export function AppSidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-sidebar-border bg-sidebar lg:block">
      <SidebarContent />
    </aside>
  )
}
