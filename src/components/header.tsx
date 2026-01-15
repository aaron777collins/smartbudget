"use client"

import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import { usePathname } from "next/navigation"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Wallet, LogOut, Settings, User } from "lucide-react"

export function Header() {
  const { data: session, status } = useSession()
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2" aria-label="SmartBudget home">
            <Wallet className="h-6 w-6 text-primary" aria-hidden="true" />
            <span className="font-bold text-xl">SmartBudget</span>
          </Link>
          {status === "authenticated" && (
            <nav className="flex items-center space-x-6 text-sm font-medium" aria-label="Primary navigation">
              <Link
                href="/dashboard"
                className="transition-colors hover:text-foreground/80 text-foreground/60"
                aria-current={pathname === "/dashboard" ? "page" : undefined}
              >
                Dashboard
              </Link>
              <Link
                href="/transactions"
                className="transition-colors hover:text-foreground/80 text-foreground/60"
                aria-current={pathname === "/transactions" ? "page" : undefined}
              >
                Transactions
              </Link>
              <Link
                href="/budgets"
                className="transition-colors hover:text-foreground/80 text-foreground/60"
                aria-current={pathname === "/budgets" ? "page" : undefined}
              >
                Budgets
              </Link>
              <Link
                href="/accounts"
                className="transition-colors hover:text-foreground/80 text-foreground/60"
                aria-current={pathname === "/accounts" ? "page" : undefined}
              >
                Accounts
              </Link>
            </nav>
          )}
        </div>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <ThemeToggle />
          {status === "authenticated" ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="User menu">
                  <Avatar>
                    <AvatarFallback>
                      {session?.user?.username?.charAt(0).toUpperCase() ||
                       session?.user?.name?.charAt(0).toUpperCase() ||
                       session?.user?.email?.charAt(0).toUpperCase() ||
                       "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {session?.user?.username || session?.user?.name || "User"}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {session?.user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="flex items-center cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="flex items-center cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="cursor-pointer text-red-600 focus:text-red-600"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center space-x-2">
              <Button asChild variant="ghost">
                <Link href="/auth/signin">Sign in</Link>
              </Button>
              <Button asChild>
                <Link href="/auth/signup">Sign up</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
