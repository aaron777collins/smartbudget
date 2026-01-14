import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(
  amount: number,
  compactOrCurrency: boolean | string = false,
  currencyParam?: string
): string {
  // Handle backward compatibility:
  // formatCurrency(100, 'USD') -> compact=false, currency='USD'
  // formatCurrency(100, true) -> compact=true, currency='USD'
  // formatCurrency(100, true, 'CAD') -> compact=true, currency='CAD'

  let compact = false;
  let currency = 'USD';

  if (typeof compactOrCurrency === 'boolean') {
    compact = compactOrCurrency;
    currency = currencyParam || 'USD';
  } else if (typeof compactOrCurrency === 'string') {
    // Old signature: formatCurrency(amount, currency)
    compact = false;
    currency = compactOrCurrency;
  }

  if (compact) {
    // Compact format for charts (e.g., $1.2K, $45.3K)
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(1)}K`;
    } else {
      return `$${amount.toFixed(0)}`;
    }
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
