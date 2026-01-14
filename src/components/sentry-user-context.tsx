'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { ErrorHandler } from '@/lib/error-handler';

/**
 * Component that sets Sentry user context based on the current authenticated user
 * Should be placed high in the component tree (e.g., in layout)
 */
export function SentryUserContext() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'loading') {
      return;
    }

    if (session?.user) {
      // Set user context in Sentry
      ErrorHandler.setUserContext({
        id: session.user.id || 'unknown',
        email: session.user.email || undefined,
        username: session.user.name || undefined,
      });
    } else {
      // Clear user context when logged out
      ErrorHandler.clearUserContext();
    }
  }, [session, status]);

  // This component doesn't render anything
  return null;
}
