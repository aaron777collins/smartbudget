"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface ScreenReaderAnnouncerProps {
  message: string
  politeness?: "polite" | "assertive" | "off"
  clearOnUnmount?: boolean
  className?: string
}

/**
 * ScreenReaderAnnouncer Component
 *
 * Announces dynamic content changes to screen readers using aria-live regions.
 * This component is visually hidden but accessible to assistive technologies.
 *
 * Usage:
 * - politeness="polite" (default): Waits for user to pause before announcing
 * - politeness="assertive": Interrupts current announcements immediately
 * - politeness="off": Disables announcements
 *
 * Examples:
 * - Data loading: <ScreenReaderAnnouncer message="Loading transactions..." />
 * - Data loaded: <ScreenReaderAnnouncer message="12 transactions loaded" />
 * - Error: <ScreenReaderAnnouncer message="Error loading data" politeness="assertive" />
 * - Success: <ScreenReaderAnnouncer message="Transaction saved successfully" />
 */
export function ScreenReaderAnnouncer({
  message,
  politeness = "polite",
  clearOnUnmount = true,
  className,
}: ScreenReaderAnnouncerProps) {
  const [announcement, setAnnouncement] = React.useState(message)

  React.useEffect(() => {
    // Small delay to ensure the announcement is picked up by screen readers
    const timer = setTimeout(() => {
      setAnnouncement(message)
    }, 100)

    return () => {
      clearTimeout(timer)
      if (clearOnUnmount) {
        setAnnouncement("")
      }
    }
  }, [message, clearOnUnmount])

  return (
    <div
      role="status"
      aria-live={politeness}
      aria-atomic="true"
      className={cn(
        "sr-only",
        className
      )}
    >
      {announcement}
    </div>
  )
}

interface LiveRegionProps extends React.HTMLAttributes<HTMLDivElement> {
  politeness?: "polite" | "assertive" | "off"
  atomic?: boolean
  relevant?: "additions" | "removals" | "text" | "all" | "additions text"
}

/**
 * LiveRegion Component
 *
 * A more flexible aria-live region for wrapping dynamic content.
 * Use this when you want to announce changes to visible content.
 *
 * Example:
 * <LiveRegion politeness="polite">
 *   <p>You have {unreadCount} unread messages</p>
 * </LiveRegion>
 */
export function LiveRegion({
  politeness = "polite",
  atomic = true,
  relevant = "additions text",
  children,
  className,
  ...props
}: LiveRegionProps) {
  return (
    <div
      role="status"
      aria-live={politeness}
      aria-atomic={atomic}
      aria-relevant={relevant}
      className={className}
      {...props}
    >
      {children}
    </div>
  )
}

/**
 * useAnnouncement Hook
 *
 * A React hook for programmatically announcing messages to screen readers.
 *
 * Example:
 * const announce = useAnnouncement()
 *
 * // Later in your code
 * announce("Data saved successfully")
 * announce("Error: Invalid input", "assertive")
 */
export function useAnnouncement() {
  const [announcement, setAnnouncement] = React.useState<{
    message: string
    politeness: "polite" | "assertive"
  } | null>(null)

  const announce = React.useCallback(
    (message: string, politeness: "polite" | "assertive" = "polite") => {
      setAnnouncement({ message, politeness })

      // Clear announcement after a delay to allow re-announcing the same message
      setTimeout(() => {
        setAnnouncement(null)
      }, 1000)
    },
    []
  )

  const AnnouncementRegion = React.useMemo(
    () => (
      <>
        {announcement && (
          <ScreenReaderAnnouncer
            message={announcement.message}
            politeness={announcement.politeness}
          />
        )}
      </>
    ),
    [announcement]
  )

  return { announce, AnnouncementRegion }
}
