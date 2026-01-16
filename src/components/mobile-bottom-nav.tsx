"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  CreditCard,
  Wallet,
  PieChart,
  MoreHorizontal,
} from "lucide-react"
import { MobileMenu } from "@/components/mobile-menu"

const primaryRoutes = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
  },
  {
    label: "Transactions",
    icon: CreditCard,
    href: "/transactions",
  },
  {
    label: "Budgets",
    icon: PieChart,
    href: "/budgets",
  },
  {
    label: "Accounts",
    icon: Wallet,
    href: "/accounts",
  },
]

export function MobileBottomNav() {
  const pathname = usePathname()

  // Check if any secondary route is active
  const secondaryRoutes = ["/recurring", "/tags", "/goals", "/insights", "/import", "/jobs", "/settings"]
  const isMoreActive = secondaryRoutes.some(route => pathname === route)

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      aria-label="Mobile navigation"
    >
      <div className="flex items-center justify-around h-16 px-2">
        {primaryRoutes.map((route) => {
          const isActive = pathname === route.href

          return (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full min-w-0 transition-colors duration-200",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
              aria-current={isActive ? "page" : undefined}
              aria-label={route.label}
            >
              <route.icon
                className={cn(
                  "h-5 w-5 mb-1 transition-transform duration-200",
                  isActive && "scale-110"
                )}
                aria-hidden="true"
              />
              <span className={cn(
                "text-xs font-medium truncate max-w-full px-1",
                isActive && "font-semibold"
              )}>
                {route.label}
              </span>
            </Link>
          )
        })}

        {/* More menu button */}
        <div className={cn(
          "flex flex-col items-center justify-center flex-1 h-full min-w-0 transition-colors duration-200",
          isMoreActive
            ? "text-primary"
            : "text-muted-foreground hover:text-foreground"
        )}>
          <MobileMenu />
          <span className={cn(
            "text-xs font-medium truncate max-w-full px-1 mt-1",
            isMoreActive && "font-semibold"
          )}>
            More
          </span>
        </div>
      </div>
    </nav>
  )
}
