"use client"

import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { PageTransition } from "@/components/page-transition"
import { QuickActionFAB } from "@/components/quick-action-fab"

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen">
      {/* Skip to main content link for keyboard navigation */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:shadow-lg focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:transition-all focus:duration-200"
      >
        Skip to main content
      </a>
      <Header />
      <div className="flex h-[calc(100vh-4rem)]">
        <aside className="hidden md:flex w-64 border-r" aria-label="Main navigation">
          <Sidebar />
        </aside>
        <main id="main-content" className="flex-1 overflow-y-auto p-8" tabIndex={-1}>
          <PageTransition>
            {children}
          </PageTransition>
        </main>
      </div>
      {/* Quick Action FAB - Mobile only */}
      <QuickActionFAB />
    </div>
  )
}
