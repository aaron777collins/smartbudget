'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Monthly Income</CardTitle>
        <DollarSign className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formatCurrency(current)}</div>

        {average > 0 && (
          <div className="flex items-center text-xs text-muted-foreground mt-1">
            {isAboveAverage && (
              <>
                <TrendingUp className="mr-1 h-4 w-4 text-green-500" />
                <span className="text-green-500">
                  +{Math.abs(vsAveragePercentage).toFixed(1)}%
                </span>
              </>
            )}
            {isBelowAverage && (
              <>
                <TrendingDown className="mr-1 h-4 w-4 text-red-500" />
                <span className="text-red-500">
                  {vsAveragePercentage.toFixed(1)}%
                </span>
              </>
            )}
            {!isAboveAverage && !isBelowAverage && (
              <span className="text-gray-500">At average</span>
            )}
            <span className="ml-1">vs average ({formatCurrency(average)})</span>
          </div>
        )}

        {topSources.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Income Sources
            </p>
            <div className="space-y-2">
              {topSources.map((source, index) => (
                <div key={source.id} className="flex items-center">
                  <div className={`h-2 w-2 rounded-full ${getCategoryColor(index)} mr-2`} />
                  <div className="flex-1 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground truncate">
                      {source.name}
                    </span>
                    <span className="text-xs font-medium ml-2">
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
