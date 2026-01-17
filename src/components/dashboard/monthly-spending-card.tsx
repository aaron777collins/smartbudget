'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CreditCard } from 'lucide-react';
import { CountUp, HoverScale } from '@/components/ui/animated';
import { getBudgetStatusColor } from '@/lib/design-tokens';

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

  const statusColors = getBudgetStatusColor(budgetUsedPercentage);

  return (
    <HoverScale scale={1.02} className="cursor-pointer">
      <Card className="transition-shadow duration-300 hover:shadow-lg">
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
                <div className="flex items-center justify-between text-sm font-medium text-muted-foreground mb-1">
                  <span>Budget Progress</span>
                  <span className={`${statusColors.text} font-mono`}>
                    {budgetUsedPercentage.toFixed(0)}%
                  </span>
                </div>
                <Progress
                  value={Math.min(budgetUsedPercentage, 100)}
                  className={`h-2 ${statusColors.progressBar}`}
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
    </HoverScale>
  );
}
