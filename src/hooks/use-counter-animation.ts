'use client';

import { useEffect, useRef, useState } from 'react';

interface UseCounterAnimationOptions {
  /**
   * The target value to count to
   */
  end: number;
  /**
   * The starting value (default: 0)
   */
  start?: number;
  /**
   * Duration of the animation in milliseconds (default: 1000)
   */
  duration?: number;
  /**
   * Delay before starting the animation in milliseconds (default: 0)
   */
  delay?: number;
  /**
   * Easing function (default: easeOutQuart)
   */
  easing?: (t: number) => number;
  /**
   * Number of decimal places to show (default: 0)
   */
  decimals?: number;
}

/**
 * Easing function for smooth deceleration
 */
const easeOutQuart = (t: number): number => {
  return 1 - Math.pow(1 - t, 4);
};

/**
 * Hook to animate a number counter with smooth easing
 *
 * @example
 * const value = useCounterAnimation({ end: 1234.56, duration: 1500, decimals: 2 });
 * return <div>{value.toFixed(2)}</div>;
 */
export function useCounterAnimation({
  end,
  start = 0,
  duration = 1000,
  delay = 0,
  easing = easeOutQuart,
  decimals = 0,
}: UseCounterAnimationOptions): number {
  const [count, setCount] = useState(start);
  const frameRef = useRef<number | undefined>(undefined);
  const startTimeRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    // Reset count when end value changes
    setCount(start);
    startTimeRef.current = undefined;

    const startAnimation = () => {
      const animate = (timestamp: number) => {
        if (!startTimeRef.current) {
          startTimeRef.current = timestamp;
        }

        const elapsed = timestamp - startTimeRef.current;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = easing(progress);

        const currentCount = start + (end - start) * easedProgress;

        // Round to specified decimal places
        const rounded = Math.round(currentCount * Math.pow(10, decimals)) / Math.pow(10, decimals);
        setCount(rounded);

        if (progress < 1) {
          frameRef.current = requestAnimationFrame(animate);
        }
      };

      frameRef.current = requestAnimationFrame(animate);
    };

    // Start animation after delay
    const timeoutId = setTimeout(startAnimation, delay);

    return () => {
      clearTimeout(timeoutId);
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [end, start, duration, delay, easing, decimals]);

  return count;
}
