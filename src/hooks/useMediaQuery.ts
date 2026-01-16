import { useState, useEffect } from 'react';

/**
 * Standard Tailwind CSS breakpoints
 */
export const BREAKPOINTS = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

/**
 * Custom hook for responsive breakpoint detection using media queries
 *
 * Features:
 * - Detects screen size changes in real-time
 * - Works with any CSS media query string
 * - SSR-safe (returns false during server-side rendering)
 * - Automatically updates when window is resized
 * - Cleans up event listeners on unmount
 *
 * @example
 * ```tsx
 * function ResponsiveComponent() {
 *   const isMobile = useMediaQuery('(max-width: 768px)');
 *   const isDesktop = useMediaQuery('(min-width: 1024px)');
 *   const prefersDark = useMediaQuery('(prefers-color-scheme: dark)');
 *
 *   return (
 *     <div>
 *       {isMobile && <MobileNavigation />}
 *       {isDesktop && <DesktopSidebar />}
 *       {prefersDark && <p>You prefer dark mode!</p>}
 *     </div>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * function DashboardLayout() {
 *   // Using Tailwind breakpoints
 *   const isMobile = useMediaQuery(`(max-width: ${BREAKPOINTS.md})`);
 *   const isTablet = useMediaQuery(
 *     `(min-width: ${BREAKPOINTS.md}) and (max-width: ${BREAKPOINTS.lg})`
 *   );
 *   const isDesktop = useMediaQuery(`(min-width: ${BREAKPOINTS.lg})`);
 *
 *   return (
 *     <div>
 *       {isMobile && <BottomNav />}
 *       {isTablet && <CollapsibleSidebar />}
 *       {isDesktop && <FullSidebar />}
 *     </div>
 *   );
 * }
 * ```
 *
 * @param query - CSS media query string (e.g., '(max-width: 768px)')
 * @returns true if the media query matches, false otherwise
 */
export function useMediaQuery(query: string): boolean {
  // Initialize with false for SSR safety
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // Check if window is defined (client-side only)
    if (typeof window === 'undefined') {
      return;
    }

    // Create media query list
    const mediaQueryList = window.matchMedia(query);

    // Set initial value
    setMatches(mediaQueryList.matches);

    // Define event handler
    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Add event listener
    // Use addEventListener if available (modern browsers)
    // Fall back to addListener for older browsers
    if (mediaQueryList.addEventListener) {
      mediaQueryList.addEventListener('change', handleChange);
    } else {
      // @ts-ignore - Legacy API for older browsers
      mediaQueryList.addListener(handleChange);
    }

    // Cleanup function
    return () => {
      if (mediaQueryList.removeEventListener) {
        mediaQueryList.removeEventListener('change', handleChange);
      } else {
        // @ts-ignore - Legacy API for older browsers
        mediaQueryList.removeListener(handleChange);
      }
    };
  }, [query]);

  return matches;
}

/**
 * Convenience hooks for common breakpoints
 */

/**
 * Returns true if viewport width is less than 640px (Tailwind 'sm' breakpoint)
 */
export function useIsMobile(): boolean {
  return useMediaQuery(`(max-width: ${BREAKPOINTS.sm})`);
}

/**
 * Returns true if viewport width is between 640px and 1024px
 */
export function useIsTablet(): boolean {
  return useMediaQuery(
    `(min-width: ${BREAKPOINTS.sm}) and (max-width: ${BREAKPOINTS.lg})`
  );
}

/**
 * Returns true if viewport width is 1024px or greater (Tailwind 'lg' breakpoint)
 */
export function useIsDesktop(): boolean {
  return useMediaQuery(`(min-width: ${BREAKPOINTS.lg})`);
}

/**
 * Returns true if viewport width is less than 768px (common mobile breakpoint)
 */
export function useIsSmallScreen(): boolean {
  return useMediaQuery(`(max-width: ${BREAKPOINTS.md})`);
}

/**
 * Returns true if viewport width is 768px or greater (common tablet/desktop breakpoint)
 */
export function useIsLargeScreen(): boolean {
  return useMediaQuery(`(min-width: ${BREAKPOINTS.md})`);
}

/**
 * Returns true if user prefers reduced motion (accessibility)
 */
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)');
}

/**
 * Returns true if user prefers dark color scheme
 */
export function usePrefersDarkMode(): boolean {
  return useMediaQuery('(prefers-color-scheme: dark)');
}

/**
 * Hook that returns the current breakpoint name
 *
 * @example
 * ```tsx
 * function Component() {
 *   const breakpoint = useBreakpoint();
 *   // breakpoint will be one of: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
 *
 *   return <div>Current breakpoint: {breakpoint}</div>;
 * }
 * ```
 */
export function useBreakpoint(): 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' {
  const is2xl = useMediaQuery(`(min-width: ${BREAKPOINTS['2xl']})`);
  const isXl = useMediaQuery(`(min-width: ${BREAKPOINTS.xl})`);
  const isLg = useMediaQuery(`(min-width: ${BREAKPOINTS.lg})`);
  const isMd = useMediaQuery(`(min-width: ${BREAKPOINTS.md})`);
  const isSm = useMediaQuery(`(min-width: ${BREAKPOINTS.sm})`);

  if (is2xl) return '2xl';
  if (isXl) return 'xl';
  if (isLg) return 'lg';
  if (isMd) return 'md';
  if (isSm) return 'sm';
  return 'xs';
}

/**
 * Hook that returns detailed viewport information
 *
 * @example
 * ```tsx
 * function Component() {
 *   const viewport = useViewport();
 *
 *   return (
 *     <div>
 *       <p>Width: {viewport.width}px</p>
 *       <p>Height: {viewport.height}px</p>
 *       <p>Is Mobile: {viewport.isMobile ? 'Yes' : 'No'}</p>
 *       <p>Breakpoint: {viewport.breakpoint}</p>
 *     </div>
 *   );
 * }
 * ```
 */
export function useViewport() {
  const [viewport, setViewport] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  const breakpoint = useBreakpoint();
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const isDesktop = useIsDesktop();
  const isSmallScreen = useIsSmallScreen();
  const isLargeScreen = useIsLargeScreen();

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handleResize = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return {
    width: viewport.width,
    height: viewport.height,
    breakpoint,
    isMobile,
    isTablet,
    isDesktop,
    isSmallScreen,
    isLargeScreen,
  };
}
