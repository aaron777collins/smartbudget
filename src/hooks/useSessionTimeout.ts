'use client'

/**
 * Client-side Session Timeout Hook
 *
 * Monitors session inactivity and displays warning before expiration.
 * Automatically logs out user when session expires.
 */

import { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { SESSION_CONFIG } from '@/lib/session-manager'

interface SessionTimeoutState {
  timeRemaining: number // milliseconds until timeout
  showWarning: boolean
  isExpired: boolean
}

export function useSessionTimeout() {
  const { data: session, status } = useSession()
  const [state, setState] = useState<SessionTimeoutState>({
    timeRemaining: SESSION_CONFIG.INACTIVITY_TIMEOUT,
    showWarning: false,
    isExpired: false,
  })

  // Track last activity time
  const [lastActivity, setLastActivity] = useState<number>(Date.now())

  // Update last activity on user interaction
  const updateActivity = useCallback(() => {
    setLastActivity(Date.now())
  }, [])

  // Reset activity timer (called when user dismisses warning)
  const resetActivity = useCallback(() => {
    setLastActivity(Date.now())
    setState((prev) => ({
      ...prev,
      showWarning: false,
      isExpired: false,
      timeRemaining: SESSION_CONFIG.INACTIVITY_TIMEOUT,
    }))
  }, [])

  // Setup activity listeners
  useEffect(() => {
    if (status !== 'authenticated') return

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove']

    // Throttle activity updates to avoid excessive re-renders
    let throttleTimer: NodeJS.Timeout | null = null
    const throttledUpdateActivity = () => {
      if (!throttleTimer) {
        throttleTimer = setTimeout(() => {
          updateActivity()
          throttleTimer = null
        }, 5000) // Update at most every 5 seconds
      }
    }

    events.forEach((event) => {
      window.addEventListener(event, throttledUpdateActivity)
    })

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, throttledUpdateActivity)
      })
      if (throttleTimer) {
        clearTimeout(throttleTimer)
      }
    }
  }, [status, updateActivity])

  // Monitor inactivity and update state
  useEffect(() => {
    if (status !== 'authenticated' || !session) return

    const checkInterval = setInterval(() => {
      const now = Date.now()
      const inactiveFor = now - lastActivity
      const remaining = SESSION_CONFIG.INACTIVITY_TIMEOUT - inactiveFor

      // Session expired
      if (remaining <= 0) {
        setState({
          timeRemaining: 0,
          showWarning: false,
          isExpired: true,
        })
        clearInterval(checkInterval)
        return
      }

      // Show warning if within threshold
      const shouldWarn = remaining <= SESSION_CONFIG.WARNING_THRESHOLD

      setState({
        timeRemaining: remaining,
        showWarning: shouldWarn,
        isExpired: false,
      })
    }, 1000) // Check every second

    return () => clearInterval(checkInterval)
  }, [status, session, lastActivity])

  return {
    ...state,
    resetActivity,
    // Helper to format time remaining
    timeRemainingFormatted: formatTimeRemaining(state.timeRemaining),
  }
}

/**
 * Format milliseconds into human-readable time
 */
function formatTimeRemaining(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  if (minutes > 0) {
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }
  return `${seconds}s`
}
