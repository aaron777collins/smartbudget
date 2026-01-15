'use client'

/**
 * Session Timeout Warning Modal
 *
 * Displays a warning to users when their session is about to expire
 * due to inactivity. Allows them to extend the session or logout.
 */

import { useEffect } from 'react'
import { signOut } from 'next-auth/react'
import { useSessionTimeout } from '@/hooks/useSessionTimeout'

export function SessionTimeoutModal() {
  const { showWarning, isExpired, timeRemainingFormatted, resetActivity } =
    useSessionTimeout()

  // Auto-logout when session expires
  useEffect(() => {
    if (isExpired) {
      signOut({ callbackUrl: '/auth/signin?session_expired=true' })
    }
  }, [isExpired])

  // Don't render if no warning needed
  if (!showWarning && !isExpired) {
    return null
  }

  // Session expired - show final message briefly before redirect
  if (isExpired) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="mx-4 max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
          <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h2 className="text-lg font-semibold">Session Expired</h2>
          </div>
          <p className="mt-3 text-gray-700 dark:text-gray-300">
            Your session has expired due to inactivity. You will be redirected to
            the login page.
          </p>
        </div>
      </div>
    )
  }

  // Warning modal - session about to expire
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="mx-4 max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
        <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400">
          <svg
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <h2 className="text-lg font-semibold">Session Timeout Warning</h2>
        </div>

        <p className="mt-3 text-gray-700 dark:text-gray-300">
          Your session will expire in{' '}
          <span className="font-semibold text-amber-600 dark:text-amber-400">
            {timeRemainingFormatted}
          </span>{' '}
          due to inactivity.
        </p>

        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Would you like to continue your session?
        </p>

        <div className="mt-6 flex gap-3">
          <button
            onClick={resetActivity}
            className="flex-1 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            Continue Session
          </button>
          <button
            onClick={() =>
              signOut({ callbackUrl: '/auth/signin?session_expired=true' })
            }
            className="rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  )
}
