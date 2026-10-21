"use client"

import { useState } from "react"
import { AppSidebar, SidebarContent } from "@/components/app-sidebar"
import { AppHeader } from "@/components/app-header"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { useT } from "@/lib/i18n"

const WIDTHS = {
  narrow: "max-w-3xl",
  default: "max-w-6xl",
}

type Props = {
  title: string
  description?: string
  actions?: React.ReactNode
  width?: keyof typeof WIDTHS
  children: React.ReactNode
}

/** Sidebar + sticky header + centred page container shared by every page of the app. */
export function AppShell({ title, description, actions, width = "default", children }: Props) {
  const [menuOpen, setMenuOpen] = useState(false)
  const { t } = useT()

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />

      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="left" className="w-72 border-sidebar-border bg-sidebar p-0">
          <SheetTitle className="sr-only">{t("nav.navigation")}</SheetTitle>
          <SidebarContent onNavigate={() => setMenuOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="lg:pl-64">
        <AppHeader
          title={title}
          description={description}
          actions={actions}
          onMenuClick={() => setMenuOpen(true)}
          containerClassName={WIDTHS[width]}
        />
        <main className={cn("mx-auto w-full px-4 py-8 sm:px-6 lg:px-8", WIDTHS[width])}>{children}</main>
      </div>
    </div>
  )
}
