"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Shield,
  Database,
  Share2,
  ShieldCheck,
  UserCircle,
  LogOut,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { signOut, useCurrentUser } from "@/lib/auth"

const baseNavigation = [
  {
    title: "Overview",
    items: [
      { name: "Start", href: "/", icon: LayoutDashboard },
      { name: "Shared Analyses", href: "/shared", icon: Share2 },
      { name: "Knowledge Base", href: "/knowledge-base", icon: Database },
    ],
  },
]

const adminNavigation = {
  title: "Administration",
  items: [{ name: "All Analyses & Users", href: "/admin", icon: ShieldCheck }],
}

export function AppSidebar() {
  const pathname = usePathname()
  const me = useCurrentUser()
  const navigation = me?.role === "ADMIN" ? [...baseNavigation, adminNavigation] : baseNavigation

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-border bg-sidebar">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center gap-2 border-b border-border px-6">
          <Shield className="h-6 w-6 text-accent" />
          <span className="text-lg font-semibold text-foreground">LoggingAdvisor</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-6 overflow-y-auto px-4 py-2">
          {navigation.map((section) => (
            <div key={section.title}>
              <h3 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {section.title}
              </h3>
              <ul className="space-y-1">
                {section.items.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 rounded-md px-2 py-2 text-sm font-medium transition-colors",
                          isActive
                            ? "bg-sidebar-accent text-sidebar-accent-foreground"
                            : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        )}
                      >
                        <item.icon className="h-4 w-4" />
                        {item.name}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Account */}
        <div className="border-t border-border p-4 space-y-1">
          <Link
            href="/account"
            className={cn(
              "flex items-center gap-3 rounded-md px-2 py-2 text-sm font-medium transition-colors",
              pathname === "/account"
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
          >
            <UserCircle className="h-4 w-4 shrink-0" />
            <span className="truncate">{me?.email ?? "Account"}</span>
          </Link>
          <button
            onClick={signOut}
            className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </div>
    </aside>
  )
}
