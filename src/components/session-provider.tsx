"use client"

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react"
import { SessionTimeoutModal } from "./session-timeout-modal"

export function SessionProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextAuthSessionProvider>
      {children}
      <SessionTimeoutModal />
    </NextAuthSessionProvider>
  )
}
