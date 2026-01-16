import { Suspense, lazy } from 'react';
import { Metadata } from 'next';
import { SPACING } from '@/lib/design-tokens';

// Lazy load the analytics client to defer loading Recharts until needed
const BudgetAnalyticsClient = lazy(() => import('./budget-analytics-client'));

export const metadata: Metadata = {
  title: 'Budget Analytics | SmartBudget',
  description: 'View historical budget performance and spending trends',
};

export default function BudgetAnalyticsPage() {
  return (
    <div className={SPACING.page.container}>
      <Suspense fallback={<div className="text-center py-12">Loading analytics...</div>}>
        <BudgetAnalyticsClient />
      </Suspense>
    </div>
  );
}
