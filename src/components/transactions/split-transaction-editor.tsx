'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shake, Pulse } from '@/components/ui/animated';
import { Plus, X, AlertCircle, Check } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Split {
  id?: string;
  categoryId: string;
  categoryName?: string;
  categoryColor?: string;
  amount: number;
  percentage?: number;
  notes?: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
}

interface SplitTransactionEditorProps {
  transactionId: string;
  transactionAmount: number;
  existingSplits?: Split[];
  onSave?: () => void;
  onCancel?: () => void;
}

export function SplitTransactionEditor({
  transactionId,
  transactionAmount,
  existingSplits = [],
  onSave,
  onCancel,
}: SplitTransactionEditorProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [splits, setSplits] = useState<Split[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const absTransactionAmount = Math.abs(transactionAmount);

  useEffect(() => {
    fetchCategories();

    // Initialize with existing splits or create one empty split
    if (existingSplits.length > 0) {
      setSplits(existingSplits.map(s => ({
        ...s,
        amount: parseFloat(s.amount.toString()),
      })));
    } else {
      // Start with one empty split
      setSplits([{ categoryId: '', amount: 0 }]);
    }
  }, [existingSplits]);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      if (!response.ok) throw new Error('Failed to fetch categories');
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setError('Failed to load categories');
    }
  };

  const addSplit = () => {
    setSplits([...splits, { categoryId: '', amount: 0 }]);
  };

  const removeSplit = (index: number) => {
    if (splits.length <= 1) {
      setError('You must have at least one split');
      return;
    }
    setSplits(splits.filter((_, i) => i !== index));
  };

  const updateSplit = (index: number, field: keyof Split, value: string | number) => {
    const newSplits = [...splits];
    newSplits[index] = { ...newSplits[index], [field]: value };

    // Calculate percentage when amount changes
    if (field === 'amount' && typeof value === 'number' && absTransactionAmount > 0) {
      newSplits[index].percentage = (value / absTransactionAmount) * 100;
    }

    setSplits(newSplits);
    setError(null);
  };

  const validateSplits = (): boolean => {
    // Check all splits have categories
    if (splits.some(s => !s.categoryId)) {
      setError('All splits must have a category selected');
      return false;
    }

    // Check all splits have amounts > 0
    if (splits.some(s => s.amount <= 0)) {
      setError('All split amounts must be greater than zero');
      return false;
    }

    // Check total equals transaction amount (allow 0.01 difference for floating point)
    const total = splits.reduce((sum, s) => sum + s.amount, 0);
    if (Math.abs(total - absTransactionAmount) > 0.01) {
      setError(
        `Split total ($${total.toFixed(2)}) must equal transaction amount ($${absTransactionAmount.toFixed(2)})`
      );
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateSplits()) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/transactions/${transactionId}/split`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          splits: splits.map(s => ({
            categoryId: s.categoryId,
            amount: s.amount,
            percentage: s.percentage,
            notes: s.notes,
          })),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save splits');
      }

      setSuccess(true);
      setTimeout(() => {
        onSave?.();
      }, 1000);
    } catch (error) {
      console.error('Error saving splits:', error);
      setError(error instanceof Error ? error.message : 'Failed to save splits');
    } finally {
      setLoading(false);
    }
  };

  const handleDistributeEvenly = () => {
    if (splits.length === 0) return;

    const amountPerSplit = absTransactionAmount / splits.length;
    const newSplits = splits.map(s => ({
      ...s,
      amount: parseFloat(amountPerSplit.toFixed(2)),
      percentage: (100 / splits.length),
    }));

    // Adjust last split to account for rounding
    const total = newSplits.reduce((sum, s, i) => i < newSplits.length - 1 ? sum + s.amount : sum, 0);
    newSplits[newSplits.length - 1].amount = parseFloat((absTransactionAmount - total).toFixed(2));
    newSplits[newSplits.length - 1].percentage = parseFloat(((newSplits[newSplits.length - 1].amount / absTransactionAmount) * 100).toFixed(2));

    setSplits(newSplits);
  };

  const totalAmount = splits.reduce((sum, s) => sum + (s.amount || 0), 0);
  const remaining = absTransactionAmount - totalAmount;
  const isValid = Math.abs(remaining) < 0.01;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Split Transaction</h3>
          <p className="text-sm text-muted-foreground">
            Divide this transaction across multiple categories
          </p>
        </div>
        <Badge
          variant={isValid ? 'default' : 'destructive'}
          className="text-base px-3 py-1"
        >
          ${absTransactionAmount.toFixed(2)}
        </Badge>
      </div>

      {/* Splits List */}
      <div className="space-y-3">
        {splits.map((split, index) => {
          const category = categories.find(c => c.id === split.categoryId);

          return (
            <div
              key={index}
              className="flex items-start gap-3 p-4 border rounded-lg bg-muted/50"
            >
              <div className="flex-1 space-y-3">
                {/* Category Selector */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Category</Label>
                  <Select
                    value={split.categoryId}
                    onValueChange={(value) => {
                      updateSplit(index, 'categoryId', value);
                      const cat = categories.find(c => c.id === value);
                      if (cat) {
                        updateSplit(index, 'categoryName', cat.name);
                        updateSplit(index, 'categoryColor', cat.color);
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category">
                        {category && (
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: category.color }}
                            />
                            <span>{category.name}</span>
                          </div>
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: cat.color }}
                            />
                            <span>{cat.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Amount and Percentage */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Amount</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        $
                      </span>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        max={absTransactionAmount}
                        value={split.amount || ''}
                        onChange={(e) =>
                          updateSplit(index, 'amount', parseFloat(e.target.value) || 0)
                        }
                        className="pl-7"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Percentage</Label>
                    <div className="relative">
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={split.percentage?.toFixed(1) || '0.0'}
                        onChange={(e) => {
                          const pct = parseFloat(e.target.value) || 0;
                          updateSplit(index, 'percentage', pct);
                          updateSplit(index, 'amount', (absTransactionAmount * pct) / 100);
                        }}
                        className="pr-7"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        %
                      </span>
                    </div>
                  </div>
                </div>

                {/* Notes (Optional) */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Notes (Optional)</Label>
                  <Input
                    value={split.notes || ''}
                    onChange={(e) => updateSplit(index, 'notes', e.target.value)}
                    placeholder="Add notes for this split..."
                  />
                </div>
              </div>

              {/* Remove Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeSplit(index)}
                disabled={splits.length <= 1}
                className="mt-6"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          );
        })}
      </div>

      {/* Add Split Button */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={addSplit}
          className="flex-1"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Split
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDistributeEvenly}
          className="flex-1"
        >
          Distribute Evenly
        </Button>
      </div>

      {/* Summary */}
      <div className="p-4 bg-muted rounded-lg space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Total Allocated:</span>
          <span className="font-medium">${totalAmount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Remaining:</span>
          <span
            className={`font-medium ${
              Math.abs(remaining) < 0.01
                ? 'text-success'
                : 'text-error'
            }`}
          >
            ${remaining.toFixed(2)}
          </span>
        </div>
        {isValid && (
          <div className="flex items-center gap-2 text-success text-sm pt-2">
            <Check className="h-4 w-4" />
            <span>Split amounts match transaction total</span>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <Shake trigger={!!error} duration={0.5} intensity={10}>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </Shake>
      )}

      {/* Success Display */}
      {success && (
        <Pulse scale={1.02} duration={0.6}>
          <Alert className="border-success/20 text-success">
            <Check className="h-4 w-4 text-success" />
            <AlertDescription>Splits saved successfully!</AlertDescription>
          </Alert>
        </Pulse>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2 pt-2">
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={loading}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={loading || !isValid}
          className="flex-1"
        >
          {loading ? 'Saving...' : 'Save Splits'}
        </Button>
      </div>
    </div>
  );
}
