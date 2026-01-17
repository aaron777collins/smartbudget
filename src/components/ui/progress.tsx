"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"

/**
 * Get the color class for progress indicator based on percentage
 * Following AICEO design principles:
 * - Green (<80%): Healthy budget usage
 * - Amber (80-100%): Approaching limit
 * - Red (>100%): Over budget
 */
function getProgressColor(value: number | null | undefined): string {
  const percentage = value || 0

  if (percentage < 80) {
    return "bg-success" // Green - healthy
  } else if (percentage <= 100) {
    return "bg-warning" // Amber - approaching limit
  } else {
    return "bg-error" // Red - over budget
  }
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      "relative h-4 w-full overflow-hidden rounded-full bg-secondary",
      className
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className={cn(
        "h-full w-full flex-1 transition-all duration-200",
        getProgressColor(value)
      )}
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
))
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
