'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';

/**
 * Global error component for catching errors at the root level
 * This file catches errors that happen in the root layout
 * Must be a separate file from error.tsx
 */
export default function GlobalError({
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
        source: 'global-error-boundary',
      },
      extra: {
        digest: error.digest,
      },
    });

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Global Error Boundary caught an error:', error);
    }
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div style={{
          display: 'flex',
          minHeight: '100vh',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f9fafb',
          padding: '1rem',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}>
          <div style={{
            width: '100%',
            maxWidth: '32rem',
            borderRadius: '0.5rem',
            border: '1px solid #fecaca',
            backgroundColor: 'white',
            padding: '2rem',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          }}>
            <div style={{
              marginBottom: '1.5rem',
              textAlign: 'center',
            }}>
              <div style={{
                display: 'inline-block',
                borderRadius: '9999px',
                backgroundColor: '#fee2e2',
                padding: '1rem',
              }}>
                <svg
                  style={{ width: '2.5rem', height: '2.5rem', color: '#dc2626' }}
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
              </div>
            </div>

            <h1 style={{
              marginBottom: '0.75rem',
              textAlign: 'center',
              fontSize: '1.875rem',
              fontWeight: 'bold',
              color: '#111827',
            }}>
              Critical Error
            </h1>

            <p style={{
              marginBottom: '1.5rem',
              textAlign: 'center',
              color: '#4b5563',
            }}>
              A critical error occurred. Our team has been notified.
              Please try refreshing the page.
            </p>

            {process.env.NODE_ENV === 'development' && (
              <div style={{
                marginBottom: '1.5rem',
                borderRadius: '0.375rem',
                border: '1px solid #e5e7eb',
                backgroundColor: '#f9fafb',
                padding: '1rem',
              }}>
                <p style={{
                  marginBottom: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#374151',
                }}>
                  Error Details (Development Only):
                </p>
                <pre style={{
                  maxHeight: '12rem',
                  overflow: 'auto',
                  fontSize: '0.75rem',
                  color: '#dc2626',
                  whiteSpace: 'pre-wrap',
                  wordWrap: 'break-word',
                }}>
                  {error.message}
                  {error.digest && `\n\nError Digest: ${error.digest}`}
                </pre>
              </div>
            )}

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
            }}>
              <button
                onClick={reset}
                style={{
                  width: '100%',
                  padding: '0.75rem 1.5rem',
                  fontSize: '1rem',
                  fontWeight: '500',
                  color: 'white',
                  backgroundColor: '#2563eb',
                  border: 'none',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.href = '/'}
                style={{
                  width: '100%',
                  padding: '0.75rem 1.5rem',
                  fontSize: '1rem',
                  fontWeight: '500',
                  color: '#374151',
                  backgroundColor: 'white',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
