'use client';

import { Component, ReactNode } from 'react';
import * as Sentry from '@sentry/nextjs';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary component that catches JavaScript errors anywhere in the child component tree
 * and displays a fallback UI instead of crashing the entire application.
 *
 * Integrates with Sentry for automatic error reporting.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log the error to Sentry
    Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
        },
      },
    });

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error Boundary caught an error:', error, errorInfo);
    }
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback(this.state.error!, this.reset);
      }

      // Default fallback UI
      return (
        <div className="flex min-h-screen items-center justify-center bg-muted px-4">
          <div className="w-full max-w-md rounded-lg border border-error/20 bg-card p-8 shadow-lg">
            <div className="mb-4 flex items-center justify-center">
              <div className="rounded-full bg-error/10 p-3">
                <AlertCircle className="h-8 w-8 text-error" />
              </div>
            </div>

            <h2 className="mb-2 text-center text-2xl font-bold text-foreground">
              Something went wrong
            </h2>

            <p className="mb-6 text-center text-muted-foreground">
              We're sorry for the inconvenience. An error occurred while loading this page.
              Our team has been notified and is working on a fix.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-6 rounded-md bg-muted p-4">
                <p className="mb-2 text-sm font-semibold text-foreground">
                  Error Details (Development Only):
                </p>
                <pre className="max-h-40 overflow-auto text-xs text-error">
                  {this.state.error.message}
                </pre>
              </div>
            )}

            <div className="flex flex-col gap-3">
              <Button onClick={this.reset} className="w-full">
                Try Again
              </Button>
              <Button
                onClick={() => window.location.href = '/'}
                variant="outline"
                className="w-full"
              >
                Go to Dashboard
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Lightweight error boundary wrapper for specific sections
 */
export function ErrorBoundaryWrapper({ children, name }: { children: ReactNode; name?: string }) {
  return (
    <ErrorBoundary
      fallback={(error, reset) => (
        <div className="rounded-lg border border-error/20 bg-error/10 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-error" />
            <div className="flex-1">
              <h3 className="font-semibold text-error">
                {name ? `Error in ${name}` : 'An error occurred'}
              </h3>
              <p className="mt-1 text-sm text-error">
                Failed to load this section. Please try refreshing the page.
              </p>
              {process.env.NODE_ENV === 'development' && (
                <pre className="mt-2 text-xs text-error">
                  {error.message}
                </pre>
              )}
              <Button
                onClick={reset}
                variant="outline"
                size="sm"
                className="mt-3"
              >
                Try Again
              </Button>
            </div>
          </div>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  );
}
