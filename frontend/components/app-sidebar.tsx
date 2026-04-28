"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Code2,
  FileText,
  ShieldCheck,
  Store,
  Settings,
  Search,
  BookOpen,
  Shield,
  Lock,
} from "lucide-react"
import { cn } from "@/lib/utils"

const navigation = [
  {
    title: "Overview",
    items: [
      { name: "Dashboard", href: "/", icon: LayoutDashboard },
      { name: "Analyzer", href: "/analyzer", icon: Code2 },
    ],
  },
  {
    title: "Analysis",
    items: [
      { name: "Security Events", href: "/security-events", icon: ShieldCheck },
      { name: "Log Suggestions", href: "/log-suggestions", icon: FileText },
      { name: "Data Protection", href: "/data-protection", icon: Lock },
    ],
  },
  {
    title: "Resources",
    items: [
      { name: "Marketplace", href: "/marketplace", icon: Store },
      { name: "Documentation", href: "/documentation", icon: BookOpen },
      { name: "Research", href: "/research", icon: Search },
    ],
  },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-border bg-sidebar">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center gap-2 border-b border-border px-6">
          <Shield className="h-6 w-6 text-accent" />
          <span className="text-lg font-semibold text-foreground">LogSecure</span>
        </div>

        {/* Search */}
        <div className="px-4 py-4">
          <div className="flex items-center gap-2 rounded-md border border-border bg-input px-3 py-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
            <kbd className="hidden rounded border border-border bg-muted px-1.5 py-0.5 text-xs text-muted-foreground sm:inline-block">
              ⌘K
            </kbd>
          </div>
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

        {/* Settings */}
        <div className="border-t border-border p-4">
          <Link
            href="/settings"
            className="flex items-center gap-3 rounded-md px-2 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <Settings className="h-4 w-4" />
            Settings
          </Link>
        </div>
      </div>
    </aside>
  )
}
