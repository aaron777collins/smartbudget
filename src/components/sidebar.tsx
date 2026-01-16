"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  CreditCard,
  Wallet,
  PieChart,
  Target,
  Settings,
  Upload,
  TrendingUp,
  ListTodo,
  Repeat,
  Hash,
} from "lucide-react"

const routes = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
    color: "text-primary",
  },
  {
    label: "Transactions",
    icon: CreditCard,
    href: "/transactions",
    color: "text-primary",
  },
  {
    label: "Accounts",
    icon: Wallet,
    href: "/accounts",
    color: "text-primary",
  },
  {
    label: "Budgets",
    icon: PieChart,
    href: "/budgets",
    color: "text-warning",
  },
  {
    label: "Recurring",
    icon: Repeat,
    href: "/recurring",
    color: "text-primary",
  },
  {
    label: "Tags",
    icon: Hash,
    href: "/tags",
    color: "text-info",
  },
  {
    label: "Goals",
    icon: Target,
    href: "/goals",
    color: "text-success",
  },
  {
    label: "Insights",
    icon: TrendingUp,
    href: "/insights",
    color: "text-success",
  },
  {
    label: "Import",
    icon: Upload,
    href: "/import",
    color: "text-primary",
  },
  {
    label: "Jobs",
    icon: ListTodo,
    href: "/jobs",
    color: "text-primary",
  },
  {
    label: "Settings",
    icon: Settings,
    href: "/settings",
    color: "text-foreground",
  },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <nav className="space-y-4 py-4 flex flex-col h-full bg-card text-card-foreground" aria-label="Sidebar navigation">
      <div className="px-3 py-2 flex-1">
        <div className="space-y-1" role="list">
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:bg-accent hover:text-accent-foreground rounded-lg transition",
                pathname === route.href
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground"
              )}
              aria-current={pathname === route.href ? "page" : undefined}
              role="listitem"
            >
              <div className="flex items-center flex-1">
                <route.icon className={cn("h-5 w-5 mr-3", route.color)} aria-hidden="true" />
                {route.label}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}
