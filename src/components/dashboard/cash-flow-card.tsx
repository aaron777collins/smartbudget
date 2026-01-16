'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUpCircle, ArrowDownCircle, MinusCircle } from 'lucide-react';
import { useCounterAnimation } from '@/hooks/use-counter-animation';

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
  const animatedCurrent = useCounterAnimation({ end: current, duration: 1200, decimals: 2 });
  const animatedProjected = useCounterAnimation({ end: projectedEndOfMonth, duration: 1200, decimals: 2, delay: 100 });
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
    }).format(amount);
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'positive':
        return <ArrowUpCircle className="h-4 w-4 text-green-500" />;
      case 'negative':
        return <ArrowDownCircle className="h-4 w-4 text-red-500" />;
      default:
        return <MinusCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'positive':
        return 'text-green-600';
      case 'negative':
        return 'text-red-600';
      default:
        return 'text-gray-600';
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
    <Card className="transition-all duration-300 hover:shadow-lg hover:scale-[1.02] animate-in fade-in slide-in-from-bottom-4 duration-500 delay-[225ms]">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Cash Flow</CardTitle>
        <div className="animate-in zoom-in duration-300 delay-300">
          {getTrendIcon()}
        </div>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${getTrendColor()} tabular-nums transition-colors duration-300`}>
          {formatCurrency(animatedCurrent)}
        </div>

        <div className="flex items-center text-xs text-muted-foreground mt-1 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-200">
          <span className={`${getTrendColor()} transition-colors duration-300`}>{getTrendText()}</span>
        </div>

        <div className="mt-4 pt-3 border-t animate-in fade-in slide-in-from-bottom-2 duration-500 delay-300">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              Projected (End of Month)
            </span>
            <span className={`text-xs font-medium ${getTrendColor()} tabular-nums transition-colors duration-300`}>
              {formatCurrency(animatedProjected)}
            </span>
          </div>
        </div>

        <p className="text-xs text-muted-foreground mt-2 animate-in fade-in duration-500 delay-[400ms]">
          Income minus expenses for this month
        </p>
      </CardContent>
    </Card>
  );
}
