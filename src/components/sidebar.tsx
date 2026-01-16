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
    color: "text-sky-500",
  },
  {
    label: "Transactions",
    icon: CreditCard,
    href: "/transactions",
    color: "text-violet-500",
  },
  {
    label: "Accounts",
    icon: Wallet,
    href: "/accounts",
    color: "text-pink-700",
  },
  {
    label: "Budgets",
    icon: PieChart,
    href: "/budgets",
    color: "text-orange-700",
  },
  {
    label: "Recurring",
    icon: Repeat,
    href: "/recurring",
    color: "text-purple-600",
  },
  {
    label: "Tags",
    icon: Hash,
    href: "/tags",
    color: "text-cyan-600",
  },
  {
    label: "Goals",
    icon: Target,
    href: "/goals",
    color: "text-emerald-500",
  },
  {
    label: "Insights",
    icon: TrendingUp,
    href: "/insights",
    color: "text-green-700",
  },
  {
    label: "Import",
    icon: Upload,
    href: "/import",
    color: "text-blue-500",
  },
  {
    label: "Jobs",
    icon: ListTodo,
    href: "/jobs",
    color: "text-indigo-500",
  },
  {
    label: "Settings",
    icon: Settings,
    href: "/settings",
    color: "text-gray-700",
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
                "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:bg-accent hover:text-accent-foreground rounded-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]",
                pathname === route.href
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground"
              )}
              aria-current={pathname === route.href ? "page" : undefined}
              role="listitem"
            >
              <div className="flex items-center flex-1">
                <route.icon
                  className={cn(
                    "h-5 w-5 mr-3 transition-all duration-200 group-hover:scale-110 group-hover:rotate-3",
                    route.color
                  )}
                  aria-hidden="true"
                />
                {route.label}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}
