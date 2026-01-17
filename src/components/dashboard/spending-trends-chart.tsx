'use client';

import { useState, useEffect, useRef } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils';
import type { TimeframeValue } from './timeframe-selector';
import { getMonthsFromTimeframe, buildTimeframeParams } from '@/lib/timeframe';
import { FadeIn } from '@/components/ui/animated';
import { getCurrentTheme, getChartColorByIndex } from '@/lib/design-tokens';

interface CategoryMetadata {
  id: string;
  name: string;
  color: string;
}

interface ChartDataPoint {
  month: string;
  [categoryName: string]: string | number;
}

interface SpendingTrendsData {
  chartData: ChartDataPoint[];
  categories: CategoryMetadata[];
  summary: {
    totalMonths: number;
    averageMonthlySpending: number;
    highestMonth: { month: string; total: number };
    lowestMonth: { month: string; total: number };
  };
}

interface TooltipPayload {
  name: string;
  value: number;
  color: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    // Calculate total for this month
    const total = payload.reduce((sum, entry) => sum + (entry.value || 0), 0);

    return (
      <div className="rounded-lg border bg-background p-3 shadow-md">
        <p className="font-semibold mb-2">{label}</p>
        <p className="text-sm font-bold font-mono mb-2">
          Total: {formatCurrency(total)}
        </p>
        <div className="space-y-1">
          {payload
            .filter(entry => entry.value > 0)
            .sort((a, b) => b.value - a.value)
            .map((entry, index) => (
              <div key={index} className="flex items-center gap-2 text-xs text-muted-foreground">
                <div
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="flex-1">{entry.name}:</span>
                <span className="font-semibold font-mono">{formatCurrency(entry.value)}</span>
              </div>
            ))}
        </div>
      </div>
    );
  }

  return null;
};

interface SpendingTrendsChartProps {
  timeframe: TimeframeValue;
}

export function SpendingTrendsChart({ timeframe }: SpendingTrendsChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<SpendingTrendsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const theme = getCurrentTheme();

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        const months = getMonthsFromTimeframe(timeframe);
        const params = new URLSearchParams({ months: months.toString() });
        const response = await fetch(`/api/dashboard/spending-trends?${params}`);

        if (!response.ok) {
          throw new Error('Failed to fetch spending trends');
        }

        const result = await response.json();
        setData(result);
        setError(null);
      } catch (err) {
        console.error('Error fetching spending trends:', err);
        setError('Failed to load spending trends');
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
          <CardTitle>Spending Trends</CardTitle>
          <CardDescription>Monthly spending by category (Last 12 months)</CardDescription>
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
          <CardTitle>Spending Trends</CardTitle>
          <CardDescription>Monthly spending by category</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[400px] items-center justify-center text-muted-foreground">
            {error || 'No data available'}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Spending Trends</CardTitle>
        <CardDescription>
          Monthly spending by category (Last {data.summary.totalMonths} months)
        </CardDescription>
        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Average Monthly: </span>
            <span className="font-semibold font-mono">
              {formatCurrency(data.summary.averageMonthlySpending)}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Highest: </span>
            <span className="font-semibold font-mono">
              {formatCurrency(data.summary.highestMonth.total)}
            </span>
            <span className="hidden sm:inline"> ({data.summary.highestMonth.month})</span>
          </div>
          <ChartExportButton
            chartRef={chartRef}
            filename="spending-trends"
            data={data.chartData.map(month => {
              const row: Record<string, any> = { Month: month.month };
              data.categories.forEach(cat => {
                row[cat.name] = month[cat.name] || 0;
              });
              return row;
            })}
          />
        </div>
      </CardHeader>
      <CardContent>
        <FadeIn duration={0.5} delay={0.1}>
          <div role="img" aria-label={`Spending trends chart showing monthly spending by category. Average monthly spending is ${formatCurrency(data.summary.averageMonthlySpending)}. Highest spending month was ${data.summary.highestMonth.month} with ${formatCurrency(data.summary.highestMonth.total)}.`}>
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart
                data={data.chartData}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
              <defs>
                {data.categories.map((category, index) => {
                  const color = getChartColorByIndex(index, theme);
                  return (
                    <linearGradient
                      key={category.id}
                      id={`color-${category.id}`}
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor={color} stopOpacity={0.8} />
                      <stop offset="95%" stopColor={color} stopOpacity={0.1} />
                    </linearGradient>
                  );
                })}
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="month"
                className="text-xs text-muted-foreground"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis
                className="text-xs text-muted-foreground"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="circle"
              />
              {data.categories.map((category, index) => {
                const color = getChartColorByIndex(index, theme);
                return (
                  <Area
                    key={category.id}
                    type="monotone"
                    dataKey={category.name}
                    stackId="1"
                    stroke={color}
                    fill={`url(#color-${category.id})`}
                    fillOpacity={1}
                    animationBegin={index * 100}
                    animationDuration={800}
                    animationEasing="ease-out"
                  />
                );
              })}
            </AreaChart>
          </ResponsiveContainer>
          </div>
        </FadeIn>
      </CardContent>
    </Card>
  );
}
