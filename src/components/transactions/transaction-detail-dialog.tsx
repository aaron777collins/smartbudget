'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Calendar, DollarSign, Store, FileText, Tag, Trash2 } from 'lucide-react';

interface Transaction {
  id: string;
  date: string;
  postedDate?: string;
  description: string;
  merchantName: string;
  amount: string;
  type: 'DEBIT' | 'CREDIT' | 'TRANSFER';
  account: {
    id: string;
    name: string;
    institution: string;
    color: string;
    icon: string;
  };
  category?: {
    id: string;
    name: string;
    slug: string;
    icon: string;
    color: string;
  };
  subcategory?: {
    id: string;
    name: string;
    slug: string;
  };
  tags: Array<{
    id: string;
    name: string;
    color: string;
  }>;
  notes?: string;
  isReconciled: boolean;
  isRecurring: boolean;
  confidenceScore?: number;
  userCorrected: boolean;
}

interface TransactionDetailDialogProps {
  transactionId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate?: () => void;
  onDelete?: () => void;
}

export function TransactionDetailDialog({
  transactionId,
  open,
  onOpenChange,
  onUpdate,
  onDelete,
}: TransactionDetailDialogProps) {
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Transaction>>({});

  useEffect(() => {
    if (transactionId && open) {
      fetchTransaction();
    }
  }, [transactionId, open]);

  const fetchTransaction = async () => {
    if (!transactionId) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/transactions/${transactionId}`);
      if (!response.ok) throw new Error('Failed to fetch transaction');

      const data = await response.json();
      setTransaction(data);
      setFormData(data);
    } catch (error) {
      console.error('Error fetching transaction:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!transactionId) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/transactions/${transactionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: formData.description,
          merchantName: formData.merchantName,
          amount: formData.amount,
          notes: formData.notes,
        }),
      });

      if (!response.ok) throw new Error('Failed to update transaction');

      const updated = await response.json();
      setTransaction(updated);
      setEditing(false);
      onUpdate?.();
    } catch (error) {
      console.error('Error updating transaction:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!transactionId) return;
    if (!confirm('Are you sure you want to delete this transaction?')) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/transactions/${transactionId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete transaction');

      onDelete?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Error deleting transaction:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amount: string, type: string) => {
    const num = parseFloat(amount);
    const formatted = new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
    }).format(Math.abs(num));

    return type === 'DEBIT' ? `-${formatted}` : formatted;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-CA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (!transaction && !loading) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Transaction Details</DialogTitle>
          <DialogDescription>
            View and edit transaction information
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center">
            <p className="text-muted-foreground">Loading transaction...</p>
          </div>
        ) : transaction ? (
          <div className="space-y-6">
            {/* Amount - Prominent Display */}
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-background rounded-full">
                  <DollarSign className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Amount</div>
                  <div
                    className={`text-2xl font-bold ${
                      transaction.type === 'DEBIT'
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-green-600 dark:text-green-400'
                    }`}
                  >
                    {formatAmount(transaction.amount, transaction.type)}
                  </div>
                </div>
              </div>
              <Badge
                variant={transaction.isReconciled ? 'default' : 'secondary'}
              >
                {transaction.isReconciled ? 'Reconciled' : 'Unreconciled'}
              </Badge>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Date
                </Label>
                {editing ? (
                  <Input
                    type="date"
                    value={formData.date?.split('T')[0]}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                  />
                ) : (
                  <div className="text-sm">{formatDate(transaction.date)}</div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Account</Label>
                <Badge
                  variant="outline"
                  style={{ borderColor: transaction.account.color }}
                  className="text-sm"
                >
                  {transaction.account.name}
                </Badge>
              </div>
            </div>

            {/* Merchant and Description */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Store className="h-4 w-4" />
                  Merchant Name
                </Label>
                {editing ? (
                  <Input
                    value={formData.merchantName}
                    onChange={(e) =>
                      setFormData({ ...formData, merchantName: e.target.value })
                    }
                  />
                ) : (
                  <div className="text-sm font-medium">
                    {transaction.merchantName}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Description
                </Label>
                {editing ? (
                  <Input
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                  />
                ) : (
                  <div className="text-sm text-muted-foreground">
                    {transaction.description}
                  </div>
                )}
              </div>
            </div>

            {/* Category */}
            {transaction.category && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Category
                </Label>
                <Badge
                  variant="secondary"
                  style={{
                    backgroundColor: `${transaction.category.color}20`,
                    color: transaction.category.color,
                  }}
                >
                  {transaction.category.name}
                  {transaction.subcategory &&
                    ` → ${transaction.subcategory.name}`}
                </Badge>
              </div>
            )}

            {/* Notes */}
            <div className="space-y-2">
              <Label>Notes</Label>
              {editing ? (
                <Input
                  value={formData.notes || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder="Add notes..."
                />
              ) : (
                <div className="text-sm text-muted-foreground">
                  {transaction.notes || 'No notes'}
                </div>
              )}
            </div>

            {/* Tags */}
            {transaction.tags.length > 0 && (
              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex flex-wrap gap-2">
                  {transaction.tags.map((tag) => (
                    <Badge
                      key={tag.id}
                      variant="outline"
                      style={{ borderColor: tag.color }}
                    >
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Metadata */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t text-sm text-muted-foreground">
              <div>
                <strong>Transaction Type:</strong> {transaction.type}
              </div>
              {transaction.isRecurring && (
                <div>
                  <strong>Recurring:</strong> Yes
                </div>
              )}
              {transaction.confidenceScore && (
                <div>
                  <strong>Categorization Confidence:</strong>{' '}
                  {Math.round(transaction.confidenceScore * 100)}%
                </div>
              )}
            </div>
          </div>
        ) : null}

        <DialogFooter className="flex justify-between sm:justify-between">
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
          <div className="flex gap-2">
            {editing ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditing(false);
                    setFormData(transaction || {});
                  }}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={loading}>
                  Save Changes
                </Button>
              </>
            ) : (
              <Button onClick={() => setEditing(true)}>Edit</Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
