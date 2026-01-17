'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { CountUp, HoverScale } from '@/components/ui/animated';
import { getIncomeCategoryColor, trendColors } from '@/lib/design-tokens';

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


  return (
    <HoverScale scale={1.02} className="cursor-pointer">
      <Card className="transition-shadow duration-300 hover:shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Monthly Income</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
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

          {average > 0 && (
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              {isAboveAverage && (
                <>
                  <TrendingUp className="mr-1 h-4 w-4 text-success" />
                  <span className="text-success font-mono">
                    +{Math.abs(vsAveragePercentage).toFixed(1)}%
                  </span>
                </>
              )}
              {isBelowAverage && (
                <>
                  <TrendingDown className="mr-1 h-4 w-4 text-error" />
                  <span className="text-error font-mono">
                    {vsAveragePercentage.toFixed(1)}%
                  </span>
                </>
              )}
              {!isAboveAverage && !isBelowAverage && (
                <span className="text-muted-foreground">At average</span>
              )}
              <span className="ml-1 font-mono">vs average ({formatCurrency(average)})</span>
            </div>
          )}

          {topSources.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium text-muted-foreground mb-2">
                Income Sources
              </p>
              <div className="space-y-2">
                {topSources.map((source, index) => (
                  <div key={source.id} className="flex items-center">
                    <div className={`h-2 w-2 rounded-full ${getIncomeCategoryColor(index)} mr-2`} />
                    <div className="flex-1 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground truncate">
                        {source.name}
                      </span>
                      <span className="text-xs font-medium font-mono ml-2">
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
    </HoverScale>
  );
}
