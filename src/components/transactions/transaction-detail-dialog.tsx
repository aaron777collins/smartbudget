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
import { Shake } from '@/components/ui/animated';
import { Calendar, DollarSign, Store, FileText, Tag, Trash2, Search, Loader2, Split } from 'lucide-react';
import { CategorySelector } from './category-selector';
import { SplitTransactionEditor } from './split-transaction-editor';
import { TagSelector } from './tag-selector';

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

interface ResearchResult {
  merchantName: string;
  businessName?: string;
  businessType?: string;
  categorySlug?: string;
  categoryName?: string;
  subcategorySlug?: string;
  subcategoryName?: string;
  confidence?: number;
  reasoning?: string;
  website?: string;
  location?: string;
  sources?: string[];
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
  const [researchResult, setResearchResult] = useState<ResearchResult | null>(null);
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
    // Update formData with new category selection
    setFormData((prev) => ({
      ...prev,
      category: categoryId ? {
        id: categoryId,
        name: prev.category?.name || '',
        slug: prev.category?.slug || '',
        icon: prev.category?.icon || '',
        color: prev.category?.color || '',
      } : undefined,
      subcategory: subcategoryId ? {
        id: subcategoryId,
        name: prev.subcategory?.name || '',
        slug: prev.subcategory?.slug || '',
      } : undefined,
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
      // Revert to previous state on error
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

      // If the research was successful and returned a category, offer to apply it
      if (result.categorySlug) {
        // Fetch the category to get its full details
        const categoriesResponse = await fetch('/api/categories');
        if (categoriesResponse.ok) {
          const categories = await categoriesResponse.json();
          const category = categories.find((c: { slug: string; id: string; name: string; icon: string; color: string }) => c.slug === result.categorySlug);

          if (category) {
            // Auto-populate the form with the suggested category
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
                id: '', // Will be filled when category selector loads subcategories
                name: result.subcategoryName || '',
                slug: result.subcategorySlug,
              } : undefined,
            }));

            // Switch to editing mode so user can review and save
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

  const handleApplyResearchResult = () => {
    if (!researchResult) return;

    // The category has already been set in handleResearchMerchant
    // Now just save the changes
    handleSave();
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
                    className={`text-2xl font-bold font-mono ${
                      transaction.type === 'DEBIT'
                        ? 'text-error'
                        : 'text-success'
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
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <Store className="h-4 w-4" />
                    Merchant Name
                  </Label>
                  {!editing && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleResearchMerchant}
                      disabled={researching}
                    >
                      {researching ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Researching...
                        </>
                      ) : (
                        <>
                          <Search className="mr-2 h-4 w-4" />
                          Research Merchant
                        </>
                      )}
                    </Button>
                  )}
                </div>
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

              {/* Research Results */}
              {researchResult && (
                <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h4 className="font-semibold text-primary">
                        Research Results
                      </h4>
                      <p className="text-sm text-primary">
                        Claude AI found information about this merchant
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    {researchResult.businessName && (
                      <div>
                        <strong className="text-primary">Business Name:</strong>{' '}
                        <span className="text-primary">{researchResult.businessName}</span>
                      </div>
                    )}
                    {researchResult.businessType && (
                      <div>
                        <strong className="text-primary">Business Type:</strong>{' '}
                        <span className="text-primary">{researchResult.businessType}</span>
                      </div>
                    )}
                    {researchResult.categoryName && (
                      <div>
                        <strong className="text-primary">Suggested Category:</strong>{' '}
                        <Badge
                          variant="secondary"
                          className="ml-1"
                        >
                          {researchResult.categoryName}
                          {researchResult.subcategoryName && ` → ${researchResult.subcategoryName}`}
                        </Badge>
                      </div>
                    )}
                    {researchResult.confidence !== undefined && (
                      <div>
                        <strong className="text-primary">Confidence:</strong>{' '}
                        <span className="text-primary">
                          {Math.round(researchResult.confidence * 100)}%
                        </span>
                      </div>
                    )}
                    {researchResult.reasoning && (
                      <div>
                        <strong className="text-primary">Reasoning:</strong>{' '}
                        <span className="text-primary">{researchResult.reasoning}</span>
                      </div>
                    )}
                    {researchResult.website && (
                      <div>
                        <strong className="text-primary">Website:</strong>{' '}
                        <a
                          href={researchResult.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {researchResult.website}
                        </a>
                      </div>
                    )}
                    {researchResult.location && (
                      <div>
                        <strong className="text-primary">Location:</strong>{' '}
                        <span className="text-primary">{researchResult.location}</span>
                      </div>
                    )}
                    {researchResult.sources && researchResult.sources.length > 0 && (
                      <div>
                        <strong className="text-primary">Sources:</strong>
                        <ul className="mt-1 space-y-1">
                          {researchResult.sources.map((source: string, idx: number) => (
                            <li key={idx}>
                              <a
                                href={source}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-primary hover:underline"
                              >
                                {source}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {editing && researchResult.categorySlug && (
                    <div className="pt-2 border-t border-primary/20">
                      <p className="text-xs text-primary">
                        The suggested category has been applied. Review and save when ready.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Research Error */}
              {researchError && (
                <Shake trigger={!!researchError} duration={0.5} intensity={10}>
                  <div className="p-4 bg-error/10 border border-error/20 rounded-lg">
                    <p className="text-sm text-error">
                      <strong>Research failed:</strong> {researchError}
                    </p>
                  </div>
                </Shake>
              )}

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

            {/* Split Transaction Section */}
            {showSplitEditor ? (
              <div className="border-t pt-4">
                <SplitTransactionEditor
                  transactionId={transactionId || ''}
                  transactionAmount={transaction.amount ? parseFloat(transaction.amount) : 0}
                  existingSplits={transaction.splits?.map(s => ({
                    id: s.id,
                    categoryId: s.categoryId,
                    amount: parseFloat(s.amount),
                    percentage: s.percentage ? parseFloat(s.percentage) : undefined,
                    notes: s.notes,
                  }))}
                  onSave={() => {
                    setShowSplitEditor(false);
                    fetchTransaction();
                    onUpdate?.();
                  }}
                  onCancel={() => setShowSplitEditor(false)}
                />
              </div>
            ) : (
              <>
                {/* Split Status Display */}
                {transaction.splits && transaction.splits.length > 0 && (
                  <div className="space-y-2 p-4 bg-primary/10 border border-primary/20 rounded-lg">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-2">
                        <Split className="h-4 w-4" />
                        Split Transaction
                      </Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowSplitEditor(true)}
                      >
                        Edit Splits
                      </Button>
                    </div>
                    <div className="space-y-1 text-sm">
                      {transaction.splits.map((split, idx) => (
                        <div key={split.id} className="flex justify-between items-center">
                          <span className="text-muted-foreground">Split {idx + 1}</span>
                          <Badge variant="secondary" className="font-mono">
                            ${parseFloat(split.amount).toFixed(2)}
                            {split.percentage && ` (${parseFloat(split.percentage).toFixed(1)}%)`}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Category (only show if not split) */}
                {(!transaction.splits || transaction.splits.length === 0) && (
                  <>
                    {editing ? (
                      <CategorySelector
                        categoryId={formData.category?.id}
                        subcategoryId={formData.subcategory?.id}
                        onCategoryChange={handleCategoryChange}
                        transactionId={transactionId || undefined}
                        transactionDescription={formData.description}
                        transactionMerchant={formData.merchantName}
                        transactionAmount={formData.amount ? parseFloat(formData.amount) : undefined}
                        showAutoCategorize={true}
                      />
                    ) : transaction.category ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="flex items-center gap-2">
                            <Tag className="h-4 w-4" />
                            Category
                          </Label>
                          {!editing && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setShowSplitEditor(true)}
                            >
                              <Split className="mr-2 h-4 w-4" />
                              Split Transaction
                            </Button>
                          )}
                        </div>
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
                        {transaction.confidenceScore && (
                          <div className="text-xs text-muted-foreground">
                            Confidence: {Math.round(transaction.confidenceScore * 100)}%
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="flex items-center gap-2">
                            <Tag className="h-4 w-4" />
                            Category
                          </Label>
                          {!editing && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setShowSplitEditor(true)}
                            >
                              <Split className="mr-2 h-4 w-4" />
                              Split Transaction
                            </Button>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          No category assigned
                        </div>
                      </div>
                    )}
                  </>
                )}
              </>
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
            <div className="space-y-2">
              <Label>Tags</Label>
              <TagSelector
                selectedTags={formData.tags || []}
                onChange={handleTagsChange}
              />
              {updatingTags && (
                <p className="text-xs text-muted-foreground">Updating tags...</p>
              )}
            </div>

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
