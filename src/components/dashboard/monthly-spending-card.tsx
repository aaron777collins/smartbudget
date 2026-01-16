'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CreditCard } from 'lucide-react';
import { useCounterAnimation } from '@/hooks/use-counter-animation';

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
  const animatedCurrent = useCounterAnimation({ end: current, duration: 1200, decimals: 2 });
  const animatedBudget = useCounterAnimation({ end: budget || 0, duration: 1200, decimals: 2, delay: 100 });
  const animatedPercentage = useCounterAnimation({ end: budgetUsedPercentage || 0, duration: 1200, decimals: 0, delay: 150 });
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
    <Card className="transition-all duration-300 hover:shadow-lg hover:scale-[1.02] animate-in fade-in slide-in-from-bottom-4 duration-500 delay-75">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Monthly Spending</CardTitle>
        <CreditCard className="h-4 w-4 text-muted-foreground transition-transform duration-300 group-hover:scale-110" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tabular-nums">{formatCurrency(animatedCurrent)}</div>

        {budget !== null && budgetUsedPercentage !== null ? (
          <>
            <div className="mt-3 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-150">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                <span>Budget Progress</span>
                <span className={`${getStatusColor()} tabular-nums transition-colors duration-300`}>
                  {animatedPercentage.toFixed(0)}%
                </span>
              </div>
              <Progress
                value={Math.min(animatedPercentage, 100)}
                className={`h-2 ${getProgressBarColor()} transition-all duration-500`}
              />
              <div className="flex items-center justify-between text-xs text-muted-foreground mt-1 tabular-nums">
                <span>{formatCurrency(animatedCurrent)} of {formatCurrency(animatedBudget)}</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2 animate-in fade-in duration-500 delay-300">
              {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} remaining this month
            </p>
          </>
        ) : (
          <p className="text-xs text-muted-foreground mt-1 animate-in fade-in duration-500 delay-150">
            No active budget set
          </p>
        )}
      </CardContent>
    </Card>
  );
}
