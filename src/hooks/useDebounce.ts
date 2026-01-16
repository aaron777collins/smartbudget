import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook for debouncing values to reduce unnecessary re-renders and API calls
 *
 * Features:
 * - Delays updating the value until user stops typing/changing
 * - Configurable delay (default: 500ms)
 * - Prevents unnecessary API calls on every keystroke
 * - Cleans up timeout on unmount to prevent memory leaks
 *
 * @example
 * ```tsx
 * function SearchInput() {
 *   const [searchTerm, setSearchTerm] = useState('');
 *   const debouncedSearch = useDebounce(searchTerm, 500);
 *
 *   // This effect only runs when user stops typing for 500ms
 *   useEffect(() => {
 *     if (debouncedSearch) {
 *       fetchSearchResults(debouncedSearch);
 *     }
 *   }, [debouncedSearch]);
 *
 *   return (
 *     <input
 *       value={searchTerm}
 *       onChange={(e) => setSearchTerm(e.target.value)}
 *       placeholder="Search transactions..."
 *     />
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * function FilterPanel() {
 *   const [minAmount, setMinAmount] = useState(0);
 *   const [maxAmount, setMaxAmount] = useState(1000);
 *
 *   const debouncedMin = useDebounce(minAmount, 300);
 *   const debouncedMax = useDebounce(maxAmount, 300);
 *
 *   // API is only called when user stops adjusting sliders
 *   const { data } = useQuery({
 *     queryKey: ['transactions', debouncedMin, debouncedMax],
 *     queryFn: () => fetchTransactions({ min: debouncedMin, max: debouncedMax }),
 *   });
 *
 *   return (
 *     <div>
 *       <Slider value={minAmount} onChange={setMinAmount} />
 *       <Slider value={maxAmount} onChange={setMaxAmount} />
 *     </div>
 *   );
 * }
 * ```
 *
 * @template T - The type of value being debounced
 * @param value - The value to debounce (e.g., search input, slider value)
 * @param delay - Delay in milliseconds before updating (default: 500ms)
 * @returns The debounced value
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set up new timeout to update debounced value
    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup function to clear timeout on unmount or value change
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Options for useDebounceCallback
 */
export interface DebounceCallbackOptions {
  /**
   * Delay in milliseconds (default: 500)
   */
  delay?: number;

  /**
   * Call the function immediately on the leading edge (default: false)
   */
  leading?: boolean;

  /**
   * Maximum time the function can be delayed before it's invoked (default: none)
   */
  maxWait?: number;
}

/**
 * Custom hook for debouncing callbacks/functions
 *
 * Similar to useDebounce but for functions instead of values.
 * Useful for debouncing event handlers, API calls, or any function.
 *
 * @example
 * ```tsx
 * function AutoSaveForm() {
 *   const [formData, setFormData] = useState({});
 *
 *   const debouncedSave = useDebounceCallback(
 *     (data) => {
 *       saveToServer(data);
 *     },
 *     { delay: 1000 }
 *   );
 *
 *   const handleChange = (field: string, value: string) => {
 *     const newData = { ...formData, [field]: value };
 *     setFormData(newData);
 *     debouncedSave(newData); // Auto-saves 1s after last change
 *   };
 *
 *   return <form>...</form>;
 * }
 * ```
 *
 * @template T - The function type being debounced
 * @param callback - The function to debounce
 * @param options - Debounce configuration options
 * @returns The debounced function
 */
export function useDebounceCallback<T extends (...args: any[]) => any>(
  callback: T,
  options: DebounceCallbackOptions = {}
): (...args: Parameters<T>) => void {
  const { delay = 500, leading = false, maxWait } = options;

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const maxWaitTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastCallTimeRef = useRef<number>(0);
  const callbackRef = useRef(callback);

  // Update callback ref to always use latest version
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (maxWaitTimeoutRef.current) {
        clearTimeout(maxWaitTimeoutRef.current);
      }
    };
  }, []);

  const debouncedCallback = (...args: Parameters<T>) => {
    const now = Date.now();
    const timeSinceLastCall = now - lastCallTimeRef.current;

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Leading edge: call immediately on first invocation
    if (leading && timeSinceLastCall > delay) {
      callbackRef.current(...args);
      lastCallTimeRef.current = now;
      return;
    }

    // Set up maxWait timeout if specified and not already set
    if (maxWait && !maxWaitTimeoutRef.current && timeSinceLastCall < maxWait) {
      maxWaitTimeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
        lastCallTimeRef.current = Date.now();
        maxWaitTimeoutRef.current = null;
      }, maxWait - timeSinceLastCall);
    }

    // Set up normal debounce timeout
    timeoutRef.current = setTimeout(() => {
      callbackRef.current(...args);
      lastCallTimeRef.current = Date.now();

      // Clear maxWait timeout if it exists
      if (maxWaitTimeoutRef.current) {
        clearTimeout(maxWaitTimeoutRef.current);
        maxWaitTimeoutRef.current = null;
      }
    }, delay);
  };

  return debouncedCallback;
}
