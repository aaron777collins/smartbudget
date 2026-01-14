'use client';

import { useEffect, useState } from 'react';
import { NetWorthCard } from '@/components/dashboard/net-worth-card';
import { MonthlySpendingCard } from '@/components/dashboard/monthly-spending-card';
import { MonthlyIncomeCard } from '@/components/dashboard/monthly-income-card';
import { CashFlowCard } from '@/components/dashboard/cash-flow-card';
import { SpendingTrendsChart } from '@/components/dashboard/spending-trends-chart';
import { CategoryBreakdownChart } from '@/components/dashboard/category-breakdown-chart';
import { Skeleton } from '@/components/ui/skeleton';

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
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-800">
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
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
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

      {/* Visualizations Section */}
      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
        <SpendingTrendsChart />
        <CategoryBreakdownChart />
      </div>

      {/* Future sections:
          - Recent Transactions
          - Upcoming Recurring Expenses
          - Financial Goals Progress
      */}
    </div>
  );
}
