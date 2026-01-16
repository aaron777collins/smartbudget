'use client';

import { useState, lazy, Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { NetWorthCard } from '@/components/dashboard/net-worth-card';
import { MonthlySpendingCard } from '@/components/dashboard/monthly-spending-card';
import { MonthlyIncomeCard } from '@/components/dashboard/monthly-income-card';
import { CashFlowCard } from '@/components/dashboard/cash-flow-card';
import { TimeframeSelector, type TimeframeValue } from '@/components/dashboard/timeframe-selector';
import { UpcomingExpenses } from '@/components/dashboard/upcoming-expenses';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { SPACING } from '@/lib/design-tokens';

// Lazy load Recharts components for bundle optimization (~60-70KB gzipped)
const SpendingTrendsChart = lazy(() => import('@/components/dashboard/spending-trends-chart').then(m => ({ default: m.SpendingTrendsChart })));
const CategoryBreakdownChart = lazy(() => import('@/components/dashboard/category-breakdown-chart').then(m => ({ default: m.CategoryBreakdownChart })));

// Lazy load D3-based visualization components for bundle optimization (~90KB gzipped)
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
  const [timeframe, setTimeframe] = useState<TimeframeValue>({
    period: 'this-month'
  });

  // Use React Query for data fetching with automatic caching and background refetching
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard', 'overview'],
    queryFn: async () => {
      return apiClient.get<DashboardData>('/api/dashboard/overview');
    },
    // Dashboard data changes frequently, use shorter stale time
    staleTime: 2 * 60 * 1000, // 2 minutes
    // Keep data in cache for 10 minutes
    gcTime: 10 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className={`flex-1 ${SPACING.section.default} ${SPACING.page.containerResponsive}`}>
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
      <div className={`flex-1 ${SPACING.section.default} ${SPACING.page.containerResponsive}`}>
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Error loading dashboard: {error instanceof Error ? error.message : 'An error occurred'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className={`flex-1 ${SPACING.section.default} ${SPACING.page.containerResponsive}`}>
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
      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
        <Suspense fallback={
          <Card className="animate-in fade-in duration-300">
            <CardHeader>
              <Skeleton className="h-6 w-40 mb-2" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[400px] w-full" />
            </CardContent>
          </Card>
        }>
          <SpendingTrendsChart timeframe={timeframe} />
        </Suspense>
        <Suspense fallback={
          <Card className="animate-in fade-in duration-300">
            <CardHeader>
              <Skeleton className="h-6 w-40 mb-2" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[300px] w-full" />
            </CardContent>
          </Card>
        }>
          <CategoryBreakdownChart timeframe={timeframe} />
        </Suspense>
      </div>

      {/* D3.js Custom Visualizations Section - Lazy loaded for performance */}
      <div className="grid gap-4 md:grid-cols-1">
        <Suspense fallback={
          <Card className="animate-in fade-in duration-300">
            <CardHeader>
              <Skeleton className="h-6 w-40 mb-2" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[500px] w-full" />
            </CardContent>
          </Card>
        }>
          <CashFlowSankey timeframe={timeframe} />
        </Suspense>
      </div>

      <div className="grid gap-4 md:grid-cols-1">
        <Suspense fallback={
          <Card className="animate-in fade-in duration-300">
            <CardHeader>
              <Skeleton className="h-6 w-40 mb-2" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[400px] w-full" />
            </CardContent>
          </Card>
        }>
          <CategoryHeatmap timeframe={timeframe} />
        </Suspense>
      </div>

      <div className="grid gap-4 md:grid-cols-1">
        <Suspense fallback={
          <Card className="animate-in fade-in duration-300">
            <CardHeader>
              <Skeleton className="h-6 w-40 mb-2" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[500px] w-full" />
            </CardContent>
          </Card>
        }>
          <CategoryCorrelationMatrix timeframe={timeframe} />
        </Suspense>
      </div>

      {/* Upcoming Recurring Expenses */}
      <div className="grid gap-4 md:grid-cols-1">
        <UpcomingExpenses />
      </div>

      {/* Future sections:
          - Recent Transactions
          - Financial Goals Progress
      */}
    </div>
  );
}
