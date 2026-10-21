"use client"

import Link from "next/link"
import { LogOut, Menu, UserCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { signOut, useCurrentUser } from "@/lib/auth"
import { LanguageSwitch, useT } from "@/lib/i18n"
import { initials } from "@/components/app-sidebar"
import { cn } from "@/lib/utils"

interface AppHeaderProps {
  title: string
  description?: string
  /** Buttons shown next to the title (page actions). */
  actions?: React.ReactNode
  onMenuClick?: () => void
  /** Max width of the centred header content; matches the page container. */
  containerClassName?: string
}

export function AppHeader({ title, description, actions, onMenuClick, containerClassName }: AppHeaderProps) {
  const me = useCurrentUser()
  const { t } = useT()

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className={cn("mx-auto flex h-16 w-full items-center gap-3 px-4 sm:px-6 lg:px-8", containerClassName ?? "max-w-6xl")}>
        {onMenuClick && (
          <Button variant="ghost" size="icon" className="-ml-2 lg:hidden" onClick={onMenuClick} aria-label={t("nav.openMenu")}>
            <Menu className="h-5 w-5" />
          </Button>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-semibold tracking-tight text-foreground">{title}</h1>
          {description && <p className="hidden truncate text-xs text-muted-foreground sm:block">{description}</p>}
        </div>
        {actions && <div className="hidden items-center gap-2 md:flex">{actions}</div>}
        <LanguageSwitch />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/20 text-xs font-semibold text-accent ring-1 ring-accent/30 transition hover:bg-accent/30"
              aria-label={t("nav.accountMenu")}
            >
              {initials(me?.email)}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <p className="truncate text-sm font-medium">{me?.email ?? t("nav.account")}</p>
              <p className="text-xs text-muted-foreground">{me?.role === "ADMIN" ? t("role.admin") : t("role.user")}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/account" className="gap-2">
                <UserCircle className="h-4 w-4" />
                {t("nav.accountPassword")}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={signOut} className="gap-2">
              <LogOut className="h-4 w-4" />
              {t("nav.signOut")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2 border-t border-border px-4 py-2 sm:px-6 md:hidden">{actions}</div>
      )}
    </header>
  )
}
