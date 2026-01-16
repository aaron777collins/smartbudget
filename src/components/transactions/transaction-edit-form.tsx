'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, Store, FileText } from 'lucide-react';
import { CategorySelector } from './category-selector';

interface Transaction {
  id: string;
  date: string;
  description: string;
  merchantName: string;
  amount: string;
  notes?: string;
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
}

interface TransactionEditFormProps {
  formData: Partial<Transaction>;
  transactionId: string;
  onFormChange: (data: Partial<Transaction>) => void;
  onCategoryChange: (categoryId: string | null, subcategoryId: string | null) => void;
  showCategorySelector?: boolean;
}

export function TransactionEditForm({
  formData,
  transactionId,
  onFormChange,
  onCategoryChange,
  showCategorySelector = true,
}: TransactionEditFormProps) {
  return (
    <div className="space-y-4">
      {/* Date Input */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Date
        </Label>
        <Input
          type="date"
          value={formData.date?.split('T')[0]}
          onChange={(e) =>
            onFormChange({ ...formData, date: e.target.value })
          }
        />
      </div>

      {/* Merchant Input */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Store className="h-4 w-4" />
          Merchant Name
        </Label>
        <Input
          value={formData.merchantName || ''}
          onChange={(e) =>
            onFormChange({ ...formData, merchantName: e.target.value })
          }
        />
      </div>

      {/* Description Input */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Description
        </Label>
        <Input
          value={formData.description || ''}
          onChange={(e) =>
            onFormChange({ ...formData, description: e.target.value })
          }
        />
      </div>

      {/* Category Selector */}
      {showCategorySelector && (
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
      )}

      {/* Notes Input */}
      <div className="space-y-2">
        <Label>Notes</Label>
        <Input
          value={formData.notes || ''}
          onChange={(e) =>
            onFormChange({ ...formData, notes: e.target.value })
          }
          placeholder="Add notes..."
        />
      </div>
    </div>
  );
}
