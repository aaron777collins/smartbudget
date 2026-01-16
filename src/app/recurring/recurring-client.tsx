'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Repeat,
  Plus,
  Search,
  Trash2,
  Calendar,
  DollarSign,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';
import { RecurringDetectionDialog } from '@/components/recurring/recurring-detection-dialog';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface RecurringRule {
  id: string;
  merchantName: string;
  frequency: string;
  amount: number;
  categoryId: string;
  nextDueDate: string;
  _count: {
    transactions: number;
  };
}

export default function RecurringClient() {
  const [loading, setLoading] = useState(true);
  const [rules, setRules] = useState<RecurringRule[]>([]);
  const [detectionDialogOpen, setDetectionDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/recurring-rules');
      if (!response.ok) throw new Error('Failed to fetch recurring rules');

      const data = await response.json();
      setRules(data.recurringRules || []);
    } catch (error) {
      console.error('Error fetching recurring rules:', error);
      toast.error('Failed to load recurring rules');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedRuleId) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/recurring-rules/${selectedRuleId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete rule');

      toast.success('Recurring rule deleted');
      setDeleteDialogOpen(false);
      setSelectedRuleId(null);
      fetchRules();
    } catch (error) {
      console.error('Error deleting rule:', error);
      toast.error('Failed to delete recurring rule');
    } finally {
      setDeleting(false);
    }
  };

  const openDeleteDialog = (ruleId: string) => {
    setSelectedRuleId(ruleId);
    setDeleteDialogOpen(true);
  };

  const getFrequencyLabel = (frequency: string) => {
    return frequency.replace('_', '-').toLowerCase();
  };

  const getDaysUntilDue = (nextDueDate: string) => {
    const today = new Date();
    const dueDate = new Date(nextDueDate);
    const diffMs = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getDueBadge = (daysUntil: number) => {
    if (daysUntil < 0) {
      return <Badge variant="destructive">Overdue</Badge>;
    } else if (daysUntil === 0) {
      return <Badge className="bg-warning">Due Today</Badge>;
    } else if (daysUntil <= 7) {
      return <Badge className="bg-warning">Due Soon</Badge>;
    } else {
      return <Badge variant="secondary">{daysUntil} days</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Repeat className="h-8 w-8" />
            Recurring Transactions
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your recurring bills, subscriptions, and expenses
          </p>
        </div>
        <Button onClick={() => setDetectionDialogOpen(true)}>
          <Search className="mr-2 h-4 w-4" />
          Detect Patterns
        </Button>
      </div>

      {/* Rules List */}
      {rules.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Repeat className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Recurring Transactions Yet</h3>
            <p className="text-muted-foreground text-center mb-6 max-w-md">
              Automatically detect recurring patterns from your transaction history to track bills
              and subscriptions.
            </p>
            <Button onClick={() => setDetectionDialogOpen(true)}>
              <Search className="mr-2 h-4 w-4" />
              Detect Recurring Patterns
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Summary Stats */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Rules
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{rules.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Monthly Estimated
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  $
                  {rules
                    .reduce((sum, rule) => {
                      // Convert to monthly equivalent
                      let monthlyAmount = parseFloat(rule.amount.toString());
                      if (rule.frequency === 'WEEKLY') monthlyAmount *= 4;
                      if (rule.frequency === 'BI_WEEKLY') monthlyAmount *= 2;
                      if (rule.frequency === 'QUARTERLY') monthlyAmount /= 3;
                      if (rule.frequency === 'YEARLY') monthlyAmount /= 12;
                      return sum + monthlyAmount;
                    }, 0)
                    .toFixed(2)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Due Soon
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {rules.filter((r) => getDaysUntilDue(r.nextDueDate) <= 7).length}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Rules Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {rules.map((rule) => {
              const daysUntil = getDaysUntilDue(rule.nextDueDate);
              return (
                <Card key={rule.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1">
                        <CardTitle className="text-lg">{rule.merchantName}</CardTitle>
                        <div className="flex items-center gap-2">
                          {getDueBadge(daysUntil)}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openDeleteDialog(rule.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">${parseFloat(rule.amount.toString()).toFixed(2)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        <span className="capitalize">{getFrequencyLabel(rule.frequency)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Next: {new Date(rule.nextDueDate).toLocaleDateString()}</span>
                    </div>

                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground">
                        {rule._count.transactions} linked transaction
                        {rule._count.transactions !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}

      {/* Detection Dialog */}
      <RecurringDetectionDialog
        open={detectionDialogOpen}
        onOpenChange={setDetectionDialogOpen}
        onRulesCreated={fetchRules}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Recurring Rule?</AlertDialogTitle>
            <AlertDialogDescription>
              This will unlink all associated transactions and remove the recurring rule. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
