"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  Target,
  Settings,
  Upload,
  TrendingUp,
  ListTodo,
  Repeat,
  Hash,
  Menu,
} from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

// Secondary routes accessible via the "More" menu
const secondaryRoutes = [
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

export function MobileMenu() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          className="flex items-center justify-center w-full h-full transition-all duration-200"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5 transition-transform duration-200" aria-hidden="true" />
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64">
        <SheetHeader>
          <SheetTitle>Menu</SheetTitle>
        </SheetHeader>
        <nav className="mt-6" aria-label="Secondary navigation">
          <div className="space-y-1" role="list">
            {secondaryRoutes.map((route) => {
              const isActive = pathname === route.href

              return (
                <Link
                  key={route.href}
                  href={route.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center w-full p-3 rounded-lg transition-colors duration-200",
                    "text-sm font-medium",
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                  aria-current={isActive ? "page" : undefined}
                  role="listitem"
                >
                  <route.icon
                    className={cn("h-5 w-5 mr-3", route.color)}
                    aria-hidden="true"
                  />
                  {route.label}
                </Link>
              )
            })}
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  )
}
