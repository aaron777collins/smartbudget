'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUpCircle, ArrowDownCircle, MinusCircle } from 'lucide-react';
import { CountUp, HoverScale } from '@/components/ui/animated';

interface CashFlowCardProps {
  current: number;
  trend: 'positive' | 'negative' | 'neutral';
  projectedEndOfMonth: number;
}

export function CashFlowCard({
  current,
  trend,
  projectedEndOfMonth,
}: CashFlowCardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
    }).format(amount);
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'positive':
        return <ArrowUpCircle className="h-4 w-4 text-success" />;
      case 'negative':
        return <ArrowDownCircle className="h-4 w-4 text-error" />;
      default:
        return <MinusCircle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'positive':
        return 'text-success';
      case 'negative':
        return 'text-error';
      default:
        return 'text-muted-foreground';
    }
  };

  const getTrendText = () => {
    switch (trend) {
      case 'positive':
        return 'Positive cash flow';
      case 'negative':
        return 'Negative cash flow';
      default:
        return 'Break even';
    }
  };

  return (
    <HoverScale scale={1.02} className="cursor-pointer">
      <Card className="transition-shadow duration-300 hover:shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Cash Flow</CardTitle>
          {getTrendIcon()}
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold font-mono ${getTrendColor()}`}>
            <CountUp
              to={Math.abs(current)}
              duration={1.2}
              decimals={2}
              prefix={current >= 0 ? "CA$" : "-CA$"}
              className="font-mono"
            />
          </div>

          <div className="flex items-center text-xs text-muted-foreground mt-1">
            <span className={getTrendColor()}>{getTrendText()}</span>
          </div>

          <div className="mt-4 pt-3 border-t">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Projected (End of Month)
              </span>
              <span className={`text-xs font-medium font-mono ${getTrendColor()}`}>
                {formatCurrency(projectedEndOfMonth)}
              </span>
            </div>
          </div>

          <p className="text-xs text-muted-foreground mt-2">
            Income minus expenses for this month
          </p>
        </CardContent>
      </Card>
    </HoverScale>
  );
}
