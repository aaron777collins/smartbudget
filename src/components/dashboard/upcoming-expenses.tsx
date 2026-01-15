'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, DollarSign, AlertCircle, ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { HoverScale } from '@/components/ui/animated';

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
      return <Badge variant="destructive">Overdue</Badge>;
    } else if (expense.isDueToday) {
      return <Badge className="bg-orange-500">Due Today</Badge>;
    } else if (expense.isDueSoon) {
      return <Badge className="bg-yellow-500">Due Soon</Badge>;
    } else {
      return <Badge variant="secondary">{expense.daysUntil} days</Badge>;
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
    <Card>
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
          <div className="grid grid-cols-4 gap-2 p-3 bg-muted rounded-lg text-sm">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="font-bold">{summary.total}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Amount</p>
              <p className="font-bold">${summary.totalAmount.toFixed(0)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Due Soon</p>
              <p className="font-bold text-yellow-600">{summary.dueSoon}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Overdue</p>
              <p className="font-bold text-red-600">{summary.overdue}</p>
            </div>
          </div>
        )}

        {/* Expenses List */}
        <div className="space-y-2">
          {expenses.slice(0, 5).map((expense) => (
            <div
              key={expense.id}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
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
                <p className="font-bold flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  {parseFloat(expense.amount.toString()).toFixed(2)}
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
  );
}
