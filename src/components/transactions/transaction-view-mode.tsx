'use client';

import { Badge } from '@/components/ui/badge';
import { DollarSign, Calendar, Store, FileText, Tag } from 'lucide-react';

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

interface TransactionViewModeProps {
  transaction: Transaction;
  formatAmount: (amount: string, type: string) => string;
  formatDate: (dateString: string) => string;
}

export function TransactionViewMode({
  transaction,
  formatAmount,
  formatDate,
}: TransactionViewModeProps) {
  return (
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
        <Badge variant={transaction.isReconciled ? 'default' : 'secondary'}>
          {transaction.isReconciled ? 'Reconciled' : 'Unreconciled'}
        </Badge>
      </div>

      {/* Basic Info */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Calendar className="h-4 w-4" />
            Date
          </div>
          <div className="text-sm">{formatDate(transaction.date)}</div>
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium">Account</div>
          <Badge
            variant="outline"
            style={{ borderColor: transaction.account.color }}
            className="text-sm"
          >
            {transaction.account.name}
          </Badge>
        </div>
      </div>

      {/* Merchant */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Store className="h-4 w-4" />
          Merchant
        </div>
        <div className="text-sm">{transaction.merchantName}</div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium">
          <FileText className="h-4 w-4" />
          Description
        </div>
        <div className="text-sm">{transaction.description}</div>
      </div>

      {/* Category - Only show if not split */}
      {!transaction.splits && (
        <div className="space-y-2">
          <div className="text-sm font-medium">Category</div>
          {transaction.category ? (
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                style={{ borderColor: transaction.category.color }}
              >
                {transaction.category.icon} {transaction.category.name}
              </Badge>
              {transaction.subcategory && (
                <Badge variant="secondary">{transaction.subcategory.name}</Badge>
              )}
              {transaction.confidenceScore !== undefined &&
                transaction.confidenceScore < 0.8 &&
                !transaction.userCorrected && (
                  <Badge variant="outline" className="text-orange-600">
                    Low Confidence ({Math.round(transaction.confidenceScore * 100)}%)
                  </Badge>
                )}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">Uncategorized</div>
          )}
        </div>
      )}

      {/* Split Status */}
      {transaction.splits && transaction.splits.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium">Split Transaction</div>
          <div className="text-sm text-muted-foreground">
            This transaction is split into {transaction.splits.length} categories
          </div>
        </div>
      )}

      {/* Notes */}
      {transaction.notes && (
        <div className="space-y-2">
          <div className="text-sm font-medium">Notes</div>
          <div className="text-sm text-muted-foreground">{transaction.notes}</div>
        </div>
      )}

      {/* Tags */}
      {transaction.tags.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Tag className="h-4 w-4" />
            Tags
          </div>
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

      {/* Metadata Footer */}
      <div className="pt-4 border-t text-xs text-muted-foreground space-y-1">
        {transaction.isRecurring && <div>• Recurring transaction</div>}
        {transaction.userCorrected && <div>• User-corrected category</div>}
        <div>• Transaction ID: {transaction.id.slice(0, 8)}...</div>
      </div>
    </div>
  );
}
