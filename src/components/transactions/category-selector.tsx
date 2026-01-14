'use client';

import { useState, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tag, Sparkles } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
}

interface Subcategory {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
}

interface CategorySelectorProps {
  categoryId?: string | null;
  subcategoryId?: string | null;
  onCategoryChange?: (categoryId: string | null, subcategoryId: string | null) => void;
  transactionId?: string;
  transactionDescription?: string;
  transactionMerchant?: string;
  transactionAmount?: number;
  showAutoCategorize?: boolean;
}

export function CategorySelector({
  categoryId,
  subcategoryId,
  onCategoryChange,
  transactionId,
  transactionDescription,
  transactionMerchant,
  transactionAmount,
  showAutoCategorize = true,
}: CategorySelectorProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(categoryId || null);
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string | null>(subcategoryId || null);
  const [loading, setLoading] = useState(false);
  const [autoCategorizing, setAutoCategorizing] = useState(false);

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
  }, []);

  // Fetch subcategories when category changes
  useEffect(() => {
    if (selectedCategoryId) {
      fetchSubcategories(selectedCategoryId);
    } else {
      setSubcategories([]);
    }
  }, [selectedCategoryId]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/categories');
      if (!response.ok) throw new Error('Failed to fetch categories');

      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubcategories = async (categoryId: string) => {
    try {
      const response = await fetch(`/api/categories/${categoryId}/subcategories`);
      if (!response.ok) throw new Error('Failed to fetch subcategories');

      const data = await response.json();
      setSubcategories(data);
    } catch (error) {
      console.error('Error fetching subcategories:', error);
      setSubcategories([]);
    }
  };

  const handleCategoryChange = (newCategoryId: string) => {
    setSelectedCategoryId(newCategoryId);
    setSelectedSubcategoryId(null); // Reset subcategory when category changes
    onCategoryChange?.(newCategoryId, null);
  };

  const handleSubcategoryChange = (newSubcategoryId: string) => {
    setSelectedSubcategoryId(newSubcategoryId);
    onCategoryChange?.(selectedCategoryId, newSubcategoryId);
  };

  const handleAutoCategorize = async () => {
    if (!transactionDescription || !transactionMerchant) {
      alert('Transaction data required for auto-categorization');
      return;
    }

    try {
      setAutoCategorizing(true);

      // Call categorization API
      const response = await fetch('/api/transactions/categorize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactions: [{
            description: transactionDescription,
            merchantName: transactionMerchant,
            amount: transactionAmount || 0,
            transactionId,
          }],
        }),
      });

      if (!response.ok) throw new Error('Failed to auto-categorize');

      const data = await response.json();
      const result = data.results?.[0];

      if (result?.categoryId && result?.subcategoryId) {
        // Update selections
        setSelectedCategoryId(result.categoryId);
        setSelectedSubcategoryId(result.subcategoryId);
        onCategoryChange?.(result.categoryId, result.subcategoryId);

        // If we have a transaction ID, update it directly
        if (transactionId) {
          await updateTransactionCategory(result.categoryId, result.subcategoryId);
        }

        // Show confidence score
        if (result.confidence) {
          const confidencePercent = Math.round(result.confidence * 100);
          console.log(`Auto-categorized with ${confidencePercent}% confidence (matched: ${result.matchedKeyword})`);
        }
      } else {
        alert('Could not auto-categorize this transaction. Please select a category manually.');
      }
    } catch (error) {
      console.error('Error auto-categorizing:', error);
      alert('Failed to auto-categorize transaction');
    } finally {
      setAutoCategorizing(false);
    }
  };

  const updateTransactionCategory = async (categoryId: string, subcategoryId: string) => {
    if (!transactionId) return;

    try {
      const response = await fetch(`/api/transactions/${transactionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          categoryId,
          subcategoryId,
        }),
      });

      if (!response.ok) throw new Error('Failed to update transaction');
    } catch (error) {
      console.error('Error updating transaction category:', error);
      throw error;
    }
  };

  const selectedCategory = categories.find(c => c.id === selectedCategoryId);
  const selectedSubcategory = subcategories.find(s => s.id === selectedSubcategoryId);

  return (
    <div className="space-y-4">
      {/* Auto-categorize button */}
      {showAutoCategorize && transactionDescription && transactionMerchant && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={handleAutoCategorize}
            disabled={autoCategorizing}
            className="gap-2"
          >
            <Sparkles className="h-4 w-4" />
            {autoCategorizing ? 'Auto-categorizing...' : 'Auto-categorize'}
          </Button>
        </div>
      )}

      {/* Category Selection */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Tag className="h-4 w-4" />
          Category
        </Label>
        <Select
          value={selectedCategoryId || undefined}
          onValueChange={handleCategoryChange}
          disabled={loading}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                <div className="flex items-center gap-2">
                  <span>{category.icon}</span>
                  <span>{category.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedCategory && (
          <Badge
            variant="secondary"
            style={{
              backgroundColor: `${selectedCategory.color}20`,
              borderColor: selectedCategory.color,
              color: selectedCategory.color,
            }}
          >
            {selectedCategory.icon} {selectedCategory.name}
          </Badge>
        )}
      </div>

      {/* Subcategory Selection */}
      {selectedCategoryId && subcategories.length > 0 && (
        <div className="space-y-2">
          <Label>Subcategory</Label>
          <Select
            value={selectedSubcategoryId || undefined}
            onValueChange={handleSubcategoryChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a subcategory" />
            </SelectTrigger>
            <SelectContent>
              {subcategories.map((subcategory) => (
                <SelectItem key={subcategory.id} value={subcategory.id}>
                  {subcategory.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedSubcategory && (
            <Badge variant="outline">
              {selectedSubcategory.name}
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
