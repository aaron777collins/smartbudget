'use client';

import { useEffect, useState, lazy, Suspense } from 'react';
import { NetWorthCard } from '@/components/dashboard/net-worth-card';
import { MonthlySpendingCard } from '@/components/dashboard/monthly-spending-card';
import { MonthlyIncomeCard } from '@/components/dashboard/monthly-income-card';
import { CashFlowCard } from '@/components/dashboard/cash-flow-card';
import { TimeframeSelector, type TimeframeValue } from '@/components/dashboard/timeframe-selector';
import { UpcomingExpenses } from '@/components/dashboard/upcoming-expenses';
import { Skeleton } from '@/components/ui/skeleton';
import { Stagger } from '@/components/ui/animated';

// Lazy load ALL chart components for bundle optimization
const SpendingTrendsChart = lazy(() => import('@/components/dashboard/spending-trends-chart').then(m => ({ default: m.SpendingTrendsChart })));
const CategoryBreakdownChart = lazy(() => import('@/components/dashboard/category-breakdown-chart').then(m => ({ default: m.CategoryBreakdownChart })));
const CashFlowSankey = lazy(() => import('@/components/dashboard/cash-flow-sankey').then(m => ({ default: m.CashFlowSankey })));
const CategoryHeatmap = lazy(() => import('@/components/dashboard/category-heatmap').then(m => ({ default: m.CategoryHeatmap })));
const CategoryCorrelationMatrix = lazy(() => import('@/components/dashboard/category-correlation-matrix').then(m => ({ default: m.CategoryCorrelationMatrix })));

interface DashboardData {
  netWorth: {
    current: number;
    change: number;
    changePercentage: number;
    sparklineData: Array<{ month: string; value: number }>;
  };
  monthlySpending: {
    current: number;
    budget: number | null;
    budgetUsedPercentage: number | null;
    daysRemaining: number;
  };
  monthlyIncome: {
    current: number;
    average: number;
    vsAveragePercentage: number;
    sources: Array<{
      id: string;
      name: string;
      amount: number;
      percentage: number;
    }>;
  };
  cashFlow: {
    current: number;
    trend: 'positive' | 'negative' | 'neutral';
    projectedEndOfMonth: number;
  };
}

export function DashboardClient() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<TimeframeValue>({
    period: 'this-month'
  });

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/dashboard/overview');

        if (!response.ok) {
          throw new Error('Failed to fetch dashboard data');
        }

        const dashboardData = await response.json();
        setData(dashboardData);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-[140px]" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        </div>
        <div className="rounded-lg border border-error/20 bg-error/10 p-4">
          <p className="text-sm text-error">
            Error loading dashboard: {error}
          </p>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <TimeframeSelector value={timeframe} onChange={setTimeframe} />
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <NetWorthCard
          current={data.netWorth.current}
          change={data.netWorth.change}
          changePercentage={data.netWorth.changePercentage}
          sparklineData={data.netWorth.sparklineData}
        />
        <MonthlySpendingCard
          current={data.monthlySpending.current}
          budget={data.monthlySpending.budget}
          budgetUsedPercentage={data.monthlySpending.budgetUsedPercentage}
          daysRemaining={data.monthlySpending.daysRemaining}
        />
        <MonthlyIncomeCard
          current={data.monthlyIncome.current}
          average={data.monthlyIncome.average}
          vsAveragePercentage={data.monthlyIncome.vsAveragePercentage}
          sources={data.monthlyIncome.sources}
        />
        <CashFlowCard
          current={data.cashFlow.current}
          trend={data.cashFlow.trend}
          projectedEndOfMonth={data.cashFlow.projectedEndOfMonth}
        />
      </div>

      {/* Recharts Visualizations Section - Lazy loaded for performance */}
      <Stagger staggerDelay={0.1} initialDelay={0.2} duration={0.4}>
        <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
          <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
            <SpendingTrendsChart timeframe={timeframe} />
          </Suspense>
          <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
            <CategoryBreakdownChart timeframe={timeframe} />
          </Suspense>
        </div>

        {/* D3.js Custom Visualizations Section - Lazy loaded for performance */}
        <div className="grid gap-4 md:grid-cols-1">
          <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
            <CashFlowSankey timeframe={timeframe} />
          </Suspense>
        </div>

        <div className="grid gap-4 md:grid-cols-1">
          <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
            <CategoryHeatmap timeframe={timeframe} />
          </Suspense>
        </div>

        <div className="grid gap-4 md:grid-cols-1">
          <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
            <CategoryCorrelationMatrix timeframe={timeframe} />
          </Suspense>
        </div>

        {/* Upcoming Recurring Expenses */}
        <div className="grid gap-4 md:grid-cols-1">
          <UpcomingExpenses />
        </div>
      </Stagger>

      {/* Future sections:
          - Recent Transactions
          - Financial Goals Progress
      */}
    </div>
  );
}
