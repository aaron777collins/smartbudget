'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';
import { Button } from '@/components/ui/button';
import { AlertCircle, Home, RefreshCw } from 'lucide-react';

/**
 * Error component for handling errors in Next.js App Router
 * This component is automatically wrapped by Next.js and will catch errors in any nested route
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to Sentry
    Sentry.captureException(error, {
      tags: {
        source: 'app-error-boundary',
      },
      extra: {
        digest: error.digest,
      },
    });

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Next.js Error Boundary caught an error:', error);
    }
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-lg rounded-lg border border-red-200 bg-white p-8 shadow-lg">
        <div className="mb-6 flex items-center justify-center">
          <div className="rounded-full bg-red-100 p-4">
            <AlertCircle className="h-10 w-10 text-red-600" />
          </div>
        </div>

        <h1 className="mb-3 text-center text-3xl font-bold text-gray-900">
          Oops! Something went wrong
        </h1>

        <p className="mb-6 text-center text-gray-600">
          We encountered an unexpected error while loading this page.
          Our team has been automatically notified and is looking into it.
        </p>

        {process.env.NODE_ENV === 'development' && (
          <div className="mb-6 rounded-md border border-gray-200 bg-gray-50 p-4">
            <p className="mb-2 text-sm font-semibold text-gray-700">
              Error Details (Development Only):
            </p>
            <pre className="max-h-48 overflow-auto text-xs text-red-600">
              {error.message}
              {error.digest && `\n\nError Digest: ${error.digest}`}
            </pre>
            {error.stack && (
              <details className="mt-2">
                <summary className="cursor-pointer text-xs font-medium text-gray-700">
                  Stack Trace
                </summary>
                <pre className="mt-2 max-h-64 overflow-auto text-xs text-gray-600">
                  {error.stack}
                </pre>
              </details>
            )}
          </div>
        )}

        <div className="flex flex-col gap-3">
          <Button
            onClick={reset}
            className="w-full"
            size="lg"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
          <Button
            onClick={() => window.location.href = '/'}
            variant="outline"
            className="w-full"
            size="lg"
          >
            <Home className="mr-2 h-4 w-4" />
            Go to Dashboard
          </Button>
        </div>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>
            If this problem persists, please contact support or try again later.
          </p>
        </div>
      </div>
    </div>
  );
}
