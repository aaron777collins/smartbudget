'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CreditCard } from 'lucide-react';
import { CountUp } from '@/components/ui/animated';

interface MonthlySpendingCardProps {
  current: number;
  budget: number | null;
  budgetUsedPercentage: number | null;
  daysRemaining: number;
}

export function MonthlySpendingCard({
  current,
  budget,
  budgetUsedPercentage,
  daysRemaining,
}: MonthlySpendingCardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
    }).format(amount);
  };

  const getStatusColor = () => {
    if (!budgetUsedPercentage) return 'text-muted-foreground';
    if (budgetUsedPercentage < 80) return 'text-green-600';
    if (budgetUsedPercentage < 100) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getProgressBarColor = () => {
    if (!budgetUsedPercentage) return '[&>div]:bg-blue-500';
    if (budgetUsedPercentage < 80) return '[&>div]:bg-green-500';
    if (budgetUsedPercentage < 100) return '[&>div]:bg-yellow-500';
    return '[&>div]:bg-red-500';
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Monthly Spending</CardTitle>
        <CreditCard className="h-4 w-4 text-muted-foreground" />
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

        {budget !== null && budgetUsedPercentage !== null ? (
          <>
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                <span>Budget Progress</span>
                <span className={`${getStatusColor()} font-mono`}>
                  {budgetUsedPercentage.toFixed(0)}%
                </span>
              </div>
              <Progress
                value={Math.min(budgetUsedPercentage, 100)}
                className={`h-2 ${getProgressBarColor()}`}
              />
              <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                <span className="font-mono">{formatCurrency(current)} of {formatCurrency(budget)}</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} remaining this month
            </p>
          </>
        ) : (
          <p className="text-xs text-muted-foreground mt-1">
            No active budget set
          </p>
        )}
      </CardContent>
    </Card>
  );
}
