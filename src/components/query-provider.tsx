'use client';

/**
 * React Query Provider Component
 *
 * Wraps the application with QueryClientProvider to enable data fetching,
 * caching, and state management throughout the app.
 *
 * This is a client component because QueryClientProvider uses React context
 * which requires client-side rendering.
 */

import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from '@/lib/query-client';
import { useState } from 'react';

interface QueryProviderProps {
  children: React.ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  // Create query client in state to ensure it's only created once per session
  // This is the recommended approach for Next.js App Router
  const [client] = useState(() => queryClient);

  return (
    <QueryClientProvider client={client}>
      {children}
      {/* React Query DevTools - only shown in development */}
      <ReactQueryDevtools initialIsOpen={false} position="bottom" />
    </QueryClientProvider>
  );
}
