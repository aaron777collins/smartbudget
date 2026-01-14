'use client';

import { useState, useEffect } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils';
import type { TimeframeValue } from './timeframe-selector';
import { getPeriodForAPI, buildTimeframeParams } from '@/lib/timeframe';

interface CategoryData {
  id: string;
  name: string;
  color: string;
  icon: string;
  amount: number;
  transactionCount: number;
  percentage: number;
}

interface CategoryBreakdownData {
  period: {
    type: string;
    start: string;
    end: string;
  };
  totalSpending: number;
  chartData: CategoryData[];
  topCategories: CategoryData[];
  summary: {
    categoryCount: number;
    averagePerCategory: number;
    transactionCount: number;
  };
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
}

const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="rounded-lg border bg-background p-3 shadow-md">
        <p className="font-semibold mb-1">{data.name}</p>
        <p className="text-sm">
          Amount: <span className="font-bold">{formatCurrency(data.amount)}</span>
        </p>
        <p className="text-sm">
          Percentage: <span className="font-bold">{data.percentage.toFixed(1)}%</span>
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {data.transactionCount} transaction{data.transactionCount !== 1 ? 's' : ''}
        </p>
      </div>
    );
  }
  return null;
};

const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  // Only show label if percentage is greater than 5%
  if (percent < 0.05) {
    return null;
  }

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      className="text-xs font-semibold"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

interface CategoryBreakdownChartProps {
  timeframe: TimeframeValue;
}

export function CategoryBreakdownChart({ timeframe }: CategoryBreakdownChartProps) {
  const [data, setData] = useState<CategoryBreakdownData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        const period = getPeriodForAPI(timeframe);
        const timeframeParams = buildTimeframeParams(timeframe);
        const params = new URLSearchParams({
          period,
          ...timeframeParams
        });
        const response = await fetch(`/api/dashboard/category-breakdown?${params}`);

        if (!response.ok) {
          throw new Error('Failed to fetch category breakdown');
        }

        const result = await response.json();
        setData(result);
        setError(null);
      } catch (err) {
        console.error('Error fetching category breakdown:', err);
        setError('Failed to load category breakdown');
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [timeframe]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Category Breakdown</CardTitle>
          <CardDescription>Current month spending by category</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[400px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Category Breakdown</CardTitle>
          <CardDescription>Current month spending by category</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[400px] items-center justify-center text-muted-foreground">
            {error || 'No data available'}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (data.chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Category Breakdown</CardTitle>
          <CardDescription>Current month spending by category</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[400px] items-center justify-center text-muted-foreground">
            No spending data for this period
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Category Breakdown</CardTitle>
        <CardDescription>
          Current month spending by category
        </CardDescription>
        <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Total Spending: </span>
            <span className="font-semibold">{formatCurrency(data.totalSpending)}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Categories: </span>
            <span className="font-semibold">{data.summary.categoryCount}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Pie Chart */}
          <div className="flex-1" role="img" aria-label={`Category breakdown pie chart showing spending across ${data.summary.categoryCount} categories. Total spending: ${formatCurrency(data.totalSpending)}.${data.topCategories.length > 0 ? ` Top category: ${data.topCategories[0].name} with ${formatCurrency(data.topCategories[0].amount)}.` : ''}`}>
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={data.chartData as any[]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={CustomLabel}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="amount"
                >
                  {data.chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Top Categories List */}
          <div className="lg:w-64 space-y-3">
            <h3 className="font-semibold text-sm">Top Categories</h3>
            {data.topCategories.map((category, index) => (
              <div
                key={category.id}
                className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div
                    className="h-3 w-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: category.color }}
                  />
                  <span className="text-sm font-medium truncate">{category.name}</span>
                </div>
                <div className="text-right flex-shrink-0 ml-2">
                  <div className="text-sm font-semibold">
                    {formatCurrency(category.amount)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {category.percentage.toFixed(1)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
