'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PlusCircle, Calendar, DollarSign, Target, Trash2, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import { TYPOGRAPHY } from '@/lib/design-tokens';

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
  type: 'ENVELOPE' | 'PERCENTAGE' | 'FIXED_AMOUNT' | 'GOAL_BASED';
  period: 'WEEKLY' | 'BI_WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  startDate: string;
  endDate: string | null;
  totalAmount: string;
  isActive: boolean;
  rollover: boolean;
  categories: BudgetCategory[];
  createdAt: string;
  updatedAt: string;
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

export default function BudgetsClient() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchBudgets();
  }, []);

  async function fetchBudgets() {
    try {
      setLoading(true);
      const response = await fetch('/api/budgets');
      if (!response.ok) {
        throw new Error('Failed to fetch budgets');
      }
      const data = await response.json();
      setBudgets(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  async function deleteBudget(id: string) {
    if (!confirm('Are you sure you want to delete this budget?')) {
      return;
    }

    try {
      const response = await fetch(`/api/budgets/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete budget');
      }

      // Refresh budgets list
      fetchBudgets();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete budget');
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-red-500">Error: {error}</p>
            <Button onClick={fetchBudgets} className="mt-4">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className={TYPOGRAPHY.pageTitle}>Budgets</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage your budgets to track spending
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/budgets/analytics">
            <Button variant="outline">
              <BarChart3 className="mr-2 h-4 w-4" />
              Analytics
            </Button>
          </Link>
          <Link href="/budgets/create">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Budget
            </Button>
          </Link>
        </div>
      </div>

      {budgets.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <Target className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No budgets yet</h3>
            <p className="text-muted-foreground mb-6">
              Get started by creating your first budget to track and manage your spending
            </p>
            <Link href="/budgets/create">
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Your First Budget
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {budgets.map((budget) => (
            <Card key={budget.id} className="relative">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle>{budget.name}</CardTitle>
                    <CardDescription>
                      {budgetTypeLabels[budget.type]} · {budgetPeriodLabels[budget.period]}
                    </CardDescription>
                  </div>
                  {budget.isActive && (
                    <Badge variant="default">Active</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="font-semibold">
                      ${Number(budget.totalAmount).toLocaleString()}
                    </span>
                    <span className="text-muted-foreground ml-1">total</span>
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>
                      Started {new Date(budget.startDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {budget.categories.length} categories
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {budget.categories.slice(0, 5).map((bc) => (
                      <Badge key={bc.id} variant="outline" className="text-xs">
                        {bc.category.name}
                      </Badge>
                    ))}
                    {budget.categories.length > 5 && (
                      <Badge variant="outline" className="text-xs">
                        +{budget.categories.length - 5} more
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Link href={`/budgets/${budget.id}`} className="flex-1">
                    <Button variant="outline" className="w-full">
                      View Details
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteBudget(budget.id)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    aria-label="Delete budget"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
