'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { TransactionViewMode } from './transaction-view-mode';
import { TransactionEditForm } from './transaction-edit-form';
import { MerchantResearchPanel } from './merchant-research-panel';
import { TransactionSplitsManager } from './transaction-splits-manager';
import { TransactionTagsManager } from './transaction-tags-manager';

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
  splits?: Array<{
    id: string;
    categoryId: string;
    amount: string;
    percentage?: string;
    notes?: string;
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
  const [researching, setResearching] = useState(false);
  const [researchResult, setResearchResult] = useState<any>(null);
  const [researchError, setResearchError] = useState<string | null>(null);
  const [showSplitEditor, setShowSplitEditor] = useState(false);
  const [updatingTags, setUpdatingTags] = useState(false);

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
          categoryId: formData.category?.id,
          subcategoryId: formData.subcategory?.id,
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

  const handleCategoryChange = (categoryId: string | null, subcategoryId: string | null) => {
    setFormData((prev) => ({
      ...prev,
      category: categoryId ? {
        id: categoryId,
        name: prev.category?.name || '',
        slug: prev.category?.slug || '',
        icon: prev.category?.icon || '',
        color: prev.category?.color || '',
      } as any : undefined,
      subcategory: subcategoryId ? {
        id: subcategoryId,
        name: prev.subcategory?.name || '',
        slug: prev.subcategory?.slug || '',
      } as any : undefined,
    }));
  };

  const handleTagsChange = async (newTags: Array<{ id: string; name: string; color: string }>) => {
    if (!transactionId) return;

    setUpdatingTags(true);
    try {
      const response = await fetch(`/api/transactions/${transactionId}/tags`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tagIds: newTags.map(t => t.id),
        }),
      });

      if (!response.ok) throw new Error('Failed to update tags');

      const updated = await response.json();
      setTransaction(updated);
      setFormData(updated);
      onUpdate?.();
    } catch (error) {
      console.error('Error updating tags:', error);
      if (transaction) {
        setFormData(transaction);
      }
    } finally {
      setUpdatingTags(false);
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

  const handleResearchMerchant = async () => {
    if (!transaction) return;

    try {
      setResearching(true);
      setResearchError(null);
      setResearchResult(null);

      const response = await fetch('/api/merchants/research', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          merchantName: transaction.merchantName,
          amount: parseFloat(transaction.amount),
          date: transaction.date,
          saveToKnowledgeBase: true,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to research merchant');
      }

      const result = await response.json();
      setResearchResult(result);

      if (result.categorySlug) {
        const categoriesResponse = await fetch('/api/categories');
        if (categoriesResponse.ok) {
          const categories = await categoriesResponse.json();
          const category = categories.find((c: any) => c.slug === result.categorySlug);

          if (category) {
            setFormData((prev) => ({
              ...prev,
              category: {
                id: category.id,
                name: category.name,
                slug: category.slug,
                icon: category.icon,
                color: category.color,
              },
              subcategory: result.subcategorySlug ? {
                id: '',
                name: result.subcategoryName || '',
                slug: result.subcategorySlug,
              } : undefined,
            }));

            if (!editing) {
              setEditing(true);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error researching merchant:', error);
      setResearchError(error instanceof Error ? error.message : 'Failed to research merchant');
    } finally {
      setResearching(false);
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

        <DialogBody>
          {loading ? (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">Loading transaction...</p>
            </div>
          ) : transaction ? (
            <div className="space-y-6">
              {/* View Mode - Only show when not editing */}
              {!editing && (
                <TransactionViewMode
                  transaction={transaction}
                  formatAmount={formatAmount}
                  formatDate={formatDate}
                />
              )}

              {/* Edit Form - Only show when editing */}
              {editing && (
                <TransactionEditForm
                  formData={formData}
                  transactionId={transactionId || ''}
                  onFormChange={setFormData}
                  onCategoryChange={handleCategoryChange}
                  showCategorySelector={!transaction.splits || transaction.splits.length === 0}
                />
              )}

              {/* Merchant Research Panel - Show in both modes */}
              <MerchantResearchPanel
                researching={researching}
                researchResult={researchResult}
                researchError={researchError}
                editing={editing}
                onResearch={handleResearchMerchant}
              />

              {/* Split Transaction Manager - Show in both modes */}
              <TransactionSplitsManager
                transaction={transaction}
                transactionId={transactionId || ''}
                showSplitEditor={showSplitEditor}
                editing={editing}
                formData={formData}
                onToggleSplitEditor={setShowSplitEditor}
                onSplitsUpdate={async () => {
                  await fetchTransaction();
                  onUpdate?.();
                }}
                onCategoryChange={handleCategoryChange}
              />

              {/* Tags Manager - Always show */}
              <TransactionTagsManager
                selectedTags={formData.tags || []}
                onTagsChange={handleTagsChange}
                updatingTags={updatingTags}
              />
            </div>
          ) : null}
        </DialogBody>

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
