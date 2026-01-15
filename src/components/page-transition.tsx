"use client"

import { motion, AnimatePresence } from "framer-motion"
import { usePathname } from "next/navigation"
import { ReactNode } from "react"

interface PageTransitionProps {
  children: ReactNode
}

/**
 * Page Transition Wrapper
 *
 * Provides smooth fade + slide animations when navigating between pages.
 * Uses AnimatePresence to handle exit animations.
 *
 * Features:
 * - Fade in/out with subtle slide up
 * - Smooth 300ms transitions
 * - Exit animations on page change
 * - Uses pathname as key for proper animation triggering
 */
export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname()

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 10 }}
        animate={{
          opacity: 1,
          y: 0,
          transition: {
            duration: 0.3,
            ease: [0.25, 0.46, 0.45, 0.94], // easeOutQuad
          }
        }}
        exit={{
          opacity: 0,
          y: -10,
          transition: {
            duration: 0.2,
            ease: [0.4, 0, 1, 1], // easeOutCubic
          }
        }}
        style={{ width: "100%", height: "100%" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
