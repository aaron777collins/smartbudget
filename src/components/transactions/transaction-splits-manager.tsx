'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Split, Tag } from 'lucide-react';
import { SplitTransactionEditor } from './split-transaction-editor';
import { CategorySelector } from './category-selector';

interface Transaction {
  id: string;
  description: string;
  merchantName: string;
  amount: string;
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
  splits?: Array<{
    id: string;
    categoryId: string;
    amount: string;
    percentage?: string;
    notes?: string;
  }>;
  confidenceScore?: number;
}

interface TransactionSplitsManagerProps {
  transaction: Transaction;
  transactionId: string;
  showSplitEditor: boolean;
  editing: boolean;
  formData: Partial<Transaction>;
  onToggleSplitEditor: (show: boolean) => void;
  onSplitsUpdate: () => Promise<void>;
  onCategoryChange: (categoryId: string | null, subcategoryId: string | null) => void;
}

export function TransactionSplitsManager({
  transaction,
  transactionId,
  showSplitEditor,
  editing,
  formData,
  onToggleSplitEditor,
  onSplitsUpdate,
  onCategoryChange,
}: TransactionSplitsManagerProps) {
  if (showSplitEditor) {
    return (
      <div className="border-t pt-4">
        <SplitTransactionEditor
          transactionId={transactionId}
          transactionAmount={transaction.amount ? parseFloat(transaction.amount) : 0}
          existingSplits={transaction.splits?.map(s => ({
            id: s.id,
            categoryId: s.categoryId,
            amount: parseFloat(s.amount),
            percentage: s.percentage ? parseFloat(s.percentage) : undefined,
            notes: s.notes,
          }))}
          onSave={async () => {
            onToggleSplitEditor(false);
            await onSplitsUpdate();
          }}
          onCancel={() => onToggleSplitEditor(false)}
        />
      </div>
    );
  }

  // Split Status Display
  if (transaction.splits && transaction.splits.length > 0) {
    return (
      <div className="space-y-2 p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-2">
            <Split className="h-4 w-4" />
            Split Transaction
          </Label>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onToggleSplitEditor(true)}
          >
            Edit Splits
          </Button>
        </div>
        <div className="space-y-1 text-sm">
          {transaction.splits.map((split, idx) => (
            <div key={split.id} className="flex justify-between items-center">
              <span className="text-muted-foreground">Split {idx + 1}</span>
              <Badge variant="secondary">
                ${parseFloat(split.amount).toFixed(2)}
                {split.percentage && ` (${parseFloat(split.percentage).toFixed(1)}%)`}
              </Badge>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Category Section (only show if not split)
  return (
    <>
      {editing ? (
        <CategorySelector
          categoryId={formData.category?.id}
          subcategoryId={formData.subcategory?.id}
          onCategoryChange={onCategoryChange}
          transactionId={transactionId}
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => onToggleSplitEditor(true)}
            >
              <Split className="mr-2 h-4 w-4" />
              Split Transaction
            </Button>
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => onToggleSplitEditor(true)}
            >
              <Split className="mr-2 h-4 w-4" />
              Split Transaction
            </Button>
          </div>
          <div className="text-sm text-muted-foreground">
            No category assigned
          </div>
        </div>
      )}
    </>
  );
}
