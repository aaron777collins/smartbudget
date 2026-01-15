'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { CountUp } from '@/components/ui/animated';

interface NetWorthCardProps {
  current: number;
  change: number;
  changePercentage: number;
  sparklineData?: Array<{ month: string; value: number }>;
}

export function NetWorthCard({
  current,
  change,
  changePercentage,
  sparklineData = [],
}: NetWorthCardProps) {
  const isPositive = change > 0;
  const isNegative = change < 0;
  const isNeutral = change === 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
    }).format(amount);
  };

  const formatPercentage = (percentage: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(percentage / 100);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Net Worth</CardTitle>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          className="h-4 w-4 text-muted-foreground"
        >
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold font-mono">
          <CountUp
            to={current}
            duration={1.2}
            decimals={2}
            prefix="CA$"
            className="font-mono"
          />
        </div>
        <div className="flex items-center text-xs text-muted-foreground mt-1">
          {isPositive && (
            <>
              <TrendingUp className="mr-1 h-4 w-4 text-green-500" />
              <span className="text-green-500 font-mono">
                +{formatCurrency(change)} ({formatPercentage(changePercentage)})
              </span>
            </>
          )}
          {isNegative && (
            <>
              <TrendingDown className="mr-1 h-4 w-4 text-red-500" />
              <span className="text-red-500 font-mono">
                {formatCurrency(change)} ({formatPercentage(changePercentage)})
              </span>
            </>
          )}
          {isNeutral && (
            <>
              <Minus className="mr-1 h-4 w-4 text-gray-500" />
              <span className="text-gray-500">No change</span>
            </>
          )}
          <span className="ml-1">from last month</span>
        </div>
        {sparklineData.length > 0 && (
          <div className="mt-4">
            <SimplifiedSparkline data={sparklineData} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SimplifiedSparkline({ data }: { data: Array<{ month: string; value: number }> }) {
  if (data.length === 0) return null;

  const values = data.map(d => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;

  const width = 100;
  const height = 40;
  const padding = 2;

  const points = values.map((value, index) => {
    const x = (index / (values.length - 1)) * (width - 2 * padding) + padding;
    const y = range === 0
      ? height / 2
      : height - padding - ((value - min) / range) * (height - 2 * padding);
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg
      width="100%"
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="text-blue-500"
    >
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        points={points}
      />
    </svg>
  );
}
