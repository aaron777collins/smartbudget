import { Suspense } from 'react';
import { Metadata } from 'next';
import BudgetAnalyticsClient from './budget-analytics-client';

export const metadata: Metadata = {
  title: 'Budget Analytics | SmartBudget',
  description: 'View historical budget performance and spending trends',
};

export default function BudgetAnalyticsPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <Suspense fallback={<div className="text-center">Loading analytics...</div>}>
        <BudgetAnalyticsClient />
      </Suspense>
    </div>
  );
}
