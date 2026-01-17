'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, DollarSign, AlertCircle, ExternalLink, Clock, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { HoverScale, CountUp } from '@/components/ui/animated';

interface UpcomingExpense {
  id: string;
  merchantName: string;
  frequency: string;
  amount: number;
  nextDueDate: string;
  daysUntil: number;
  isOverdue: boolean;
  isDueToday: boolean;
  isDueSoon: boolean;
  _count: {
    transactions: number;
  };
}

interface UpcomingSummary {
  total: number;
  totalAmount: number;
  overdue: number;
  dueToday: number;
  dueSoon: number;
  daysAhead: number;
}

export function UpcomingExpenses() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState<UpcomingExpense[]>([]);
  const [summary, setSummary] = useState<UpcomingSummary | null>(null);

  useEffect(() => {
    fetchUpcomingExpenses();
  }, []);

  const fetchUpcomingExpenses = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/recurring-rules/upcoming?days=30');
      if (!response.ok) throw new Error('Failed to fetch upcoming expenses');

      const data = await response.json();
      setExpenses(data.upcomingExpenses || []);
      setSummary(data.summary);
    } catch (error) {
      console.error('Error fetching upcoming expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDueBadge = (expense: UpcomingExpense) => {
    if (expense.isOverdue) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <AlertCircle className="h-3 w-3" aria-label="Overdue" />
          Overdue
        </Badge>
      );
    } else if (expense.isDueToday) {
      return (
        <Badge className="bg-warning flex items-center gap-1">
          <Clock className="h-3 w-3" aria-label="Due today" />
          Due Today
        </Badge>
      );
    } else if (expense.isDueSoon) {
      return (
        <Badge className="bg-warning flex items-center gap-1">
          <Clock className="h-3 w-3" aria-label="Due soon" />
          Due Soon
        </Badge>
      );
    } else {
      return (
        <Badge variant="secondary" className="flex items-center gap-1">
          <CheckCircle className="h-3 w-3" aria-label="Upcoming" />
          {expense.daysUntil} days
        </Badge>
      );
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Upcoming Recurring Expenses
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (expenses.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Upcoming Recurring Expenses
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No upcoming recurring expenses found. Set up recurring transaction detection to track
              your bills and subscriptions.
            </AlertDescription>
          </Alert>
          <Button
            variant="outline"
            className="mt-4 w-full"
            onClick={() => router.push('/recurring')}
          >
            Manage Recurring Transactions
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <HoverScale scale={1.01} className="h-full">
      <Card className="h-full transition-shadow duration-300 hover:shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Upcoming Recurring Expenses
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/recurring')}
            >
              View All
              <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Bar */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-3 bg-muted rounded-lg text-sm">
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground">Total</p>
              <p className="font-bold">{summary.total}</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground">Amount</p>
              <p className="font-bold font-mono">
                <CountUp
                  to={summary.totalAmount}
                  duration={1.2}
                  decimals={0}
                  prefix="$"
                />
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground">Due Soon</p>
              <div className="flex items-center justify-center gap-1">
                <Clock className="h-4 w-4 text-warning" aria-label="Due soon" />
                <p className="font-bold text-warning">{summary.dueSoon}</p>
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground">Overdue</p>
              <div className="flex items-center justify-center gap-1">
                <AlertCircle className="h-4 w-4 text-error" aria-label="Overdue" />
                <p className="font-bold text-error">{summary.overdue}</p>
              </div>
            </div>
          </div>
        )}

        {/* Expenses List */}
        <div className="space-y-2">
          {expenses.slice(0, 5).map((expense) => (
            <div
              key={expense.id}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 hover:shadow-md transition-all duration-200 cursor-pointer"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium">{expense.merchantName}</p>
                  {getDueBadge(expense)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {new Date(expense.nextDueDate).toLocaleDateString()} •{' '}
                  {expense.frequency.replace('_', '-').toLowerCase()}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold font-mono flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  <CountUp
                    to={parseFloat(expense.amount.toString())}
                    duration={1.2}
                    decimals={2}
                  />
                </p>
              </div>
            </div>
          ))}
        </div>

        {expenses.length > 5 && (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => router.push('/recurring')}
          >
            View All {expenses.length} Expenses
          </Button>
        )}
      </CardContent>
    </Card>
    </HoverScale>
  );
}
