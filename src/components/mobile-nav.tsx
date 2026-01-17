"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { Menu } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
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

export function MobileNav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label="Toggle navigation menu"
        >
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] sm:w-[320px]">
        <SheetHeader>
          <SheetTitle>Navigation</SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col space-y-1 mt-4" aria-label="Mobile navigation">
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              onClick={() => setOpen(false)}
              className={cn(
                "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:bg-accent hover:text-accent-foreground rounded-lg transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                pathname === route.href
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground"
              )}
              aria-current={pathname === route.href ? "page" : undefined}
            >
              <div className="flex items-center flex-1">
                <route.icon className={cn("h-5 w-5 mr-3", route.color)} aria-hidden="true" />
                {route.label}
              </div>
            </Link>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  )
}
