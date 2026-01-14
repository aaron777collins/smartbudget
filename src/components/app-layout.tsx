"use client"

import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen">
      <Header />
      <div className="flex h-[calc(100vh-4rem)]">
        <aside className="hidden md:flex w-64 border-r">
          <Sidebar />
        </aside>
        <main className="flex-1 overflow-y-auto p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
