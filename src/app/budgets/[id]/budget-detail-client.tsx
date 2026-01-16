'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  Edit,
  Trash2,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Gauge
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface BudgetCategory {
  id: string;
  categoryId: string;
  amount: string;
  spent: string;
  category: {
    id: string;
    name: string;
    slug: string;
    color: string;
    icon: string;
  };
}

interface Budget {
  id: string;
  name: string;
  type: string;
  period: string;
  startDate: string;
  endDate: string | null;
  totalAmount: string;
  isActive: boolean;
  rollover: boolean;
  categories: BudgetCategory[];
  createdAt: string;
  updatedAt: string;
}

interface BudgetProgress {
  totalSpent: string;
  totalBudget: string;
  remaining: string;
  percentageUsed: number;
  daysInPeriod: number;
  daysRemaining: number;
  categories: Array<{
    categoryId: string;
    categoryName: string;
    budgeted: string;
    spent: string;
    remaining: string;
    percentageUsed: number;
    transactionCount: number;
  }>;
}

const budgetTypeLabels: Record<string, string> = {
  ENVELOPE: 'Envelope',
  PERCENTAGE: 'Percentage-Based',
  FIXED_AMOUNT: 'Fixed Amount',
  GOAL_BASED: 'Goal-Based',
};

const budgetPeriodLabels: Record<string, string> = {
  WEEKLY: 'Weekly',
  BI_WEEKLY: 'Bi-Weekly',
  MONTHLY: 'Monthly',
  QUARTERLY: 'Quarterly',
  YEARLY: 'Yearly',
};

export default function BudgetDetailClient({ budgetId }: { budgetId: string }) {
  const router = useRouter();
  const [budget, setBudget] = useState<Budget | null>(null);
  const [progress, setProgress] = useState<BudgetProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const previousProgressRef = useRef<BudgetProgress | null>(null);

  useEffect(() => {
    fetchBudget();
    fetchProgress();
  }, [budgetId]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchProgress(true);
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [budgetId, autoRefresh]);

  async function fetchBudget() {
    try {
      const response = await fetch(`/api/budgets/${budgetId}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Budget not found');
        }
        throw new Error('Failed to fetch budget');
      }
      const data = await response.json();
      setBudget(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  async function fetchProgress(silent = false) {
    if (!silent) {
      setIsRefreshing(true);
    }

    try {
      const response = await fetch(`/api/budgets/${budgetId}/progress`);
      if (response.ok) {
        const data = await response.json();

        // Check for budget alerts
        if (previousProgressRef.current) {
          checkBudgetAlerts(previousProgressRef.current, data);
        }

        previousProgressRef.current = data;
        setProgress(data);
      }
    } catch (err) {
      console.error('Error fetching progress:', err);
    } finally {
      if (!silent) {
        setIsRefreshing(false);
      }
    }
  }

  function checkBudgetAlerts(prevProgress: BudgetProgress, newProgress: BudgetProgress) {
    const prevPercentage = prevProgress.percentageUsed;
    const newPercentage = newProgress.percentageUsed;

    // Overall budget alerts
    if (prevPercentage < 80 && newPercentage >= 80 && newPercentage < 90) {
      toast.warning('Budget Alert', {
        description: `You've used ${newPercentage.toFixed(1)}% of your budget. Consider slowing down spending.`,
      });
    } else if (prevPercentage < 90 && newPercentage >= 90 && newPercentage < 100) {
      toast.warning('Budget Warning', {
        description: `You've used ${newPercentage.toFixed(1)}% of your budget. Approaching limit!`,
      });
    } else if (prevPercentage < 100 && newPercentage >= 100) {
      toast.error('Budget Exceeded', {
        description: `You've exceeded your budget by $${(Number(newProgress.totalSpent) - Number(newProgress.totalBudget)).toFixed(2)}`,
      });
    }

    // Category-level alerts
    newProgress.categories.forEach((newCat) => {
      const prevCat = prevProgress.categories.find(c => c.categoryId === newCat.categoryId);
      if (!prevCat) return;

      const prevCatPercent = prevCat.percentageUsed;
      const newCatPercent = newCat.percentageUsed;

      if (prevCatPercent < 90 && newCatPercent >= 90 && newCatPercent < 100) {
        toast.warning(`${newCat.categoryName} Alert`, {
          description: `${newCatPercent.toFixed(1)}% of budget used`,
        });
      } else if (prevCatPercent < 100 && newCatPercent >= 100) {
        toast.error(`${newCat.categoryName} Exceeded`, {
          description: `Budget limit exceeded`,
        });
      }
    });
  }

  async function deleteBudget() {
    if (!confirm('Are you sure you want to delete this budget?')) {
      return;
    }

    try {
      const response = await fetch(`/api/budgets/${budgetId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete budget');
      }

      router.push('/budgets');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete budget');
    }
  }

  function getProgressColor(percentage: number) {
    if (percentage < 80) return 'bg-green-500';
    if (percentage < 100) return 'bg-yellow-500';
    return 'bg-red-500';
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error || !budget) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || 'Budget not found'}</AlertDescription>
        </Alert>
        <Link href="/budgets">
          <Button className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Budgets
          </Button>
        </Link>
      </div>
    );
  }

  const totalSpent = progress ? Number(progress.totalSpent) : 0;
  const totalBudget = Number(budget.totalAmount);
  const remaining = totalBudget - totalSpent;
  const percentageUsed = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  // Calculate spending velocity
  const daysElapsed = progress ? progress.daysInPeriod - progress.daysRemaining : 0;
  const expectedSpentByNow = daysElapsed > 0 ? totalBudget * (daysElapsed / (progress?.daysInPeriod || 1)) : 0;
  const spendingVelocity = expectedSpentByNow > 0 ? (totalSpent / expectedSpentByNow) * 100 : 0;
  const projectedTotal = daysElapsed > 0 && progress ? (totalSpent / daysElapsed) * progress.daysInPeriod : totalSpent;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <Link href="/budgets">
            <Button variant="ghost" size="sm" className="mb-2">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Budgets
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{budget.name}</h1>
            {budget.isActive && <Badge variant="default">Active</Badge>}
          </div>
          <p className="text-muted-foreground mt-1">
            {budgetTypeLabels[budget.type]} · {budgetPeriodLabels[budget.period]}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => fetchProgress()}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
          <Button
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
          </Button>
          <Button variant="outline" size="icon" disabled>
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={deleteBudget}
            className="text-red-500 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Overall Progress Card */}
      <Card>
        <CardHeader>
          <CardTitle>Overall Progress</CardTitle>
          <CardDescription>
            Started {format(new Date(budget.startDate), 'PPP')}
            {budget.endDate && ` · Ends ${format(new Date(budget.endDate), 'PPP')}`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center text-sm">
            <span>Budget Used</span>
            <span className="font-semibold">{percentageUsed.toFixed(1)}%</span>
          </div>
          <Progress
            value={percentageUsed}
            className={getProgressColor(percentageUsed)}
            aria-label={`Overall budget usage: ${percentageUsed.toFixed(1)}% used, $${totalSpent.toLocaleString()} spent of $${totalBudget.toLocaleString()} budget`}
          />

          <div className="grid grid-cols-3 gap-4 pt-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Spent</p>
              <p className="text-2xl font-bold text-red-500">
                ${totalSpent.toLocaleString()}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Budget</p>
              <p className="text-2xl font-bold">
                ${totalBudget.toLocaleString()}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Remaining</p>
              <p className={`text-2xl font-bold ${remaining >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                ${Math.abs(remaining).toLocaleString()}
              </p>
            </div>
          </div>

          {progress && (
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                {progress.daysRemaining} days remaining in period
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Spending Velocity Card */}
      {progress && daysElapsed > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gauge className="h-5 w-5" />
              Spending Velocity
            </CardTitle>
            <CardDescription>
              Track your spending pace and projected total
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Spending Pace</p>
                <div className="flex items-center gap-2 mt-1">
                  <p className={`text-2xl font-bold ${
                    spendingVelocity > 110 ? 'text-red-500' :
                    spendingVelocity > 100 ? 'text-yellow-500' :
                    'text-green-500'
                  }`}>
                    {spendingVelocity.toFixed(0)}%
                  </p>
                  {spendingVelocity > 100 ? (
                    <TrendingUp className="h-5 w-5 text-red-500" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-green-500" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {spendingVelocity > 100
                    ? 'Spending faster than expected'
                    : 'Spending on track or slower'}
                </p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Projected Total</p>
                <p className={`text-2xl font-bold mt-1 ${
                  projectedTotal > totalBudget ? 'text-red-500' : 'text-green-500'
                }`}>
                  ${projectedTotal.toFixed(0).toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Based on {daysElapsed} days of spending
                </p>
              </div>
            </div>

            {projectedTotal > totalBudget && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  At current pace, you'll exceed your budget by ${(projectedTotal - totalBudget).toFixed(0).toLocaleString()}
                </AlertDescription>
              </Alert>
            )}

            <div className="pt-2 border-t">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Expected by now:</span>
                <span className="font-medium">${expectedSpentByNow.toFixed(0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-muted-foreground">Actual spent:</span>
                <span className="font-medium">${totalSpent.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-muted-foreground">Difference:</span>
                <span className={`font-medium ${
                  totalSpent > expectedSpentByNow ? 'text-red-500' : 'text-green-500'
                }`}>
                  ${Math.abs(totalSpent - expectedSpentByNow).toFixed(0).toLocaleString()}
                  {totalSpent > expectedSpentByNow ? ' over' : ' under'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Category Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Category Breakdown</CardTitle>
          <CardDescription>{budget.categories.length} categories</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {budget.categories.map((bc) => {
              const spent = Number(bc.spent);
              const budgeted = Number(bc.amount);
              const remaining = budgeted - spent;
              const percentage = budgeted > 0 ? (spent / budgeted) * 100 : 0;

              return (
                <div key={bc.id} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: bc.category.color }}
                      />
                      <span className="font-medium">{bc.category.name}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-muted-foreground">
                        ${spent.toLocaleString()} / ${budgeted.toLocaleString()}
                      </span>
                      <span className="font-semibold min-w-[50px] text-right">
                        {percentage.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress
                      value={percentage}
                      className={`flex-1 ${getProgressColor(percentage)}`}
                      aria-label={`${bc.category.name} budget: ${percentage.toFixed(0)}% used, $${spent.toLocaleString()} spent of $${budgeted.toLocaleString()} budgeted`}
                    />
                    {percentage > 100 ? (
                      <TrendingUp className="h-4 w-4 text-red-500" aria-label="Over budget" />
                    ) : percentage > 80 ? (
                      <AlertCircle className="h-4 w-4 text-yellow-500" aria-label="Approaching budget limit" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-green-500" aria-label="Within budget" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
