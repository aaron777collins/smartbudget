import { Suspense } from 'react';
import { Metadata } from 'next';
import BudgetAnalyticsClient from './budget-analytics-client';
import { SPACING } from '@/lib/design-tokens';

export const metadata: Metadata = {
  title: 'Budget Analytics | SmartBudget',
  description: 'View historical budget performance and spending trends',
};

export default function BudgetAnalyticsPage() {
  return (
    <div className={SPACING.page.container}>
      <Suspense fallback={<div className="text-center">Loading analytics...</div>}>
        <BudgetAnalyticsClient />
      </Suspense>
    </div>
  );
}
