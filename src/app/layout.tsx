import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { SessionProvider } from "@/components/session-provider";
import { QueryProvider } from "@/components/query-provider";
import { ErrorBoundary } from "@/components/error-boundary";
import { SentryUserContext } from "@/components/sentry-user-context";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SmartBudget - Personal Finance Management",
  description: "Intelligent personal finance management with AI-powered transaction categorization",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        {/* Skip to main content link for keyboard navigation */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:shadow-lg"
        >
          Skip to main content
        </a>
        <ErrorBoundary>
          <SessionProvider>
            <SentryUserContext />
            <QueryProvider>
              <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                disableTransitionOnChange
              >
                {children}
                <Toaster
                  position="top-right"
                  richColors
                  expand={false}
                  duration={3000}
                  closeButton
                  toastOptions={{
                    className: 'animate-in slide-in-from-top-5 duration-300',
                    classNames: {
                      success: 'bg-success text-success-foreground border-success',
                      error: 'bg-destructive text-destructive-foreground border-destructive',
                      warning: 'bg-warning text-warning-foreground border-warning',
                      info: 'bg-info text-info-foreground border-info',
                    }
                  }}
                />
              </ThemeProvider>
            </QueryProvider>
          </SessionProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
