'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { useCounterAnimation } from '@/hooks/use-counter-animation';
import { COLORS, ELEVATION } from '@/lib/design-tokens';

interface IncomeSource {
  id: string;
  name: string;
  amount: number;
  percentage: number;
}

interface MonthlyIncomeCardProps {
  current: number;
  average: number;
  vsAveragePercentage: number;
  sources: IncomeSource[];
}

export function MonthlyIncomeCard({
  current,
  average,
  vsAveragePercentage,
  sources,
}: MonthlyIncomeCardProps) {
  const animatedCurrent = useCounterAnimation({ end: current, duration: 1200, decimals: 2 });
  const animatedAverage = useCounterAnimation({ end: average, duration: 1200, decimals: 2, delay: 100 });
  const animatedPercentage = useCounterAnimation({ end: vsAveragePercentage, duration: 1200, decimals: 1, delay: 100 });
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
    }).format(amount);
  };

  const isAboveAverage = vsAveragePercentage > 0;
  const isBelowAverage = vsAveragePercentage < 0;

  // Get top 3 sources
  const topSources = sources
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 3);

  const getCategoryColor = (index: number) => {
    const colors = [
      'bg-green-500',
      'bg-emerald-500',
      'bg-teal-500',
    ];
    return colors[index] || 'bg-gray-500';
  };

  return (
    <Card className={`${ELEVATION.medium} transition-all duration-300 hover:${ELEVATION.highest} hover:scale-[1.02] animate-in fade-in slide-in-from-bottom-4 duration-300 delay-100 ${COLORS.gradient.green}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Monthly Income</CardTitle>
        <DollarSign className="h-4 w-4 text-muted-foreground transition-transform duration-300 group-hover:scale-110" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tabular-nums">{formatCurrency(animatedCurrent)}</div>

        {average > 0 && (
          <div className="flex items-center text-xs text-muted-foreground mt-1 animate-in fade-in slide-in-from-bottom-2 duration-300 delay-200">
            {isAboveAverage && (
              <>
                <TrendingUp className={`mr-1 h-4 w-4 ${COLORS.trend.up} animate-in zoom-in duration-200 delay-300`} />
                <span className={`${COLORS.trend.up} tabular-nums`}>
                  +{Math.abs(animatedPercentage).toFixed(1)}%
                </span>
              </>
            )}
            {isBelowAverage && (
              <>
                <TrendingDown className={`mr-1 h-4 w-4 ${COLORS.trend.down} animate-in zoom-in duration-300 delay-300`} />
                <span className={`${COLORS.trend.down} tabular-nums`}>
                  {animatedPercentage.toFixed(1)}%
                </span>
              </>
            )}
            {!isAboveAverage && !isBelowAverage && (
              <span className="text-gray-500">At average</span>
            )}
            <span className="ml-1 tabular-nums">vs average ({formatCurrency(animatedAverage)})</span>
          </div>
        )}

        {topSources.length > 0 && (
          <div className="mt-4 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-300">
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Income Sources
            </p>
            <div className="space-y-2">
              {topSources.map((source, index) => (
                <div
                  key={source.id}
                  className="flex items-center animate-in fade-in slide-in-from-left-2 duration-300"
                  style={{ animationDelay: `${400 + index * 100}ms` }}
                >
                  <div className={`h-2 w-2 rounded-full ${getCategoryColor(index)} mr-2 transition-transform duration-200 hover:scale-150`} />
                  <div className="flex-1 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground truncate">
                      {source.name}
                    </span>
                    <span className="text-xs font-medium ml-2 tabular-nums">
                      {formatCurrency(source.amount)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {topSources.length === 0 && (
          <p className="text-xs text-muted-foreground mt-2">
            No income recorded this month
          </p>
        )}
      </CardContent>
    </Card>
  );
}
