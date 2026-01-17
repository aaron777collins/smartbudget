'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Filter, X, AlertCircle } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { Badge } from '@/components/ui/badge';
import { Shake } from '@/components/ui/animated';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Account {
  id: string;
  name: string;
  institution: string;
}

interface Category {
  id: string;
  name: string;
  color: string;
}

interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface TransactionFilters {
  accountId?: string;
  categoryId?: string;
  tagId?: string;
  dateRange?: DateRange;
  minAmount?: string;
  maxAmount?: string;
  type?: string;
  isReconciled?: string;
  isRecurring?: string;
}

interface AdvancedFiltersProps {
  filters: TransactionFilters;
  onFiltersChange: (filters: TransactionFilters) => void;
  onClearFilters: () => void;
}

export function AdvancedFilters({
  filters,
  onFiltersChange,
  onClearFilters,
}: AdvancedFiltersProps) {
  const [open, setOpen] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [localFilters, setLocalFilters] = useState<TransactionFilters>(filters);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAccounts();
    fetchCategories();
    fetchTags();
  }, []);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const fetchAccounts = async () => {
    try {
      const response = await fetch('/api/accounts');
      if (response.ok) {
        const data = await response.json();
        setAccounts(data);
      } else {
        throw new Error('Failed to fetch accounts');
      }
    } catch (err) {
      console.error('Error fetching accounts:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load accounts';
      setError(errorMessage);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      } else {
        throw new Error('Failed to fetch categories');
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load categories';
      setError(errorMessage);
    }
  };

  const fetchTags = async () => {
    try {
      const response = await fetch('/api/tags');
      if (response.ok) {
        const data = await response.json();
        setTags(data);
      } else {
        throw new Error('Failed to fetch tags');
      }
    } catch (err) {
      console.error('Error fetching tags:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load tags';
      setError(errorMessage);
    }
  };

  const handleApplyFilters = () => {
    onFiltersChange(localFilters);
    setOpen(false);
  };

  const handleClearAll = () => {
    setLocalFilters({});
    onClearFilters();
    setOpen(false);
  };

  const activeFilterCount = Object.keys(filters).filter((key) => {
    const value = filters[key as keyof TransactionFilters];
    if (key === 'dateRange' && value) {
      return (value as DateRange).from || (value as DateRange).to;
    }
    return value !== undefined && value !== '';
  }).length;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="relative">
          <Filter className="mr-2 h-4 w-4" />
          Advanced Filters
          {activeFilterCount > 0 && (
            <Badge className="ml-2 px-1.5 py-0.5 h-5 min-w-[20px]" variant="secondary">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Advanced Filters</DialogTitle>
          <DialogDescription>
            Apply filters to narrow down your transaction search
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Shake trigger={!!error} duration={0.5} intensity={10}>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </Shake>
        )}

        <div className="grid gap-6 py-4">
          {/* Account Filter */}
          <div className="grid gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
            <Label htmlFor="account">Account</Label>
            <Select
              value={localFilters.accountId || ''}
              onValueChange={(value) =>
                setLocalFilters({ ...localFilters, accountId: value || undefined })
              }
            >
              <SelectTrigger id="account">
                <SelectValue placeholder="All accounts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All accounts</SelectItem>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name} - {account.institution}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Category Filter */}
          <div className="grid gap-2 animate-in fade-in slide-in-from-top-2 duration-300 delay-75">
            <Label htmlFor="category">Category</Label>
            <Select
              value={localFilters.categoryId || ''}
              onValueChange={(value) =>
                setLocalFilters({ ...localFilters, categoryId: value || undefined })
              }
            >
              <SelectTrigger id="category">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    <div className="flex items-center gap-2">
                      <div
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      {category.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tag Filter */}
          <div className="grid gap-2 animate-in fade-in slide-in-from-top-2 duration-300 delay-150">
            <Label htmlFor="tag">Tag</Label>
            <Select
              value={localFilters.tagId || ''}
              onValueChange={(value) =>
                setLocalFilters({ ...localFilters, tagId: value || undefined })
              }
            >
              <SelectTrigger id="tag">
                <SelectValue placeholder="All tags" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All tags</SelectItem>
                {tags.map((tag) => (
                  <SelectItem key={tag.id} value={tag.id}>
                    <div className="flex items-center gap-2">
                      <div
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: tag.color }}
                      />
                      {tag.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Range Filter */}
          <div className="grid gap-2 animate-in fade-in slide-in-from-top-2 duration-300 delay-200">
            <Label>Date Range</Label>
            <DateRangePicker
              dateRange={localFilters.dateRange}
              onDateRangeChange={(range) =>
                setLocalFilters({ ...localFilters, dateRange: range })
              }
            />
            {localFilters.dateRange && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocalFilters({ ...localFilters, dateRange: undefined })}
                className="w-fit"
              >
                <X className="mr-1 h-3 w-3" />
                Clear date range
              </Button>
            )}
          </div>

          {/* Amount Range */}
          <div className="grid gap-2 animate-in fade-in slide-in-from-top-2 duration-300 delay-300">
            <Label>Amount Range</Label>
            <div className="flex gap-2 items-center">
              <Input
                type="number"
                placeholder="Min"
                value={localFilters.minAmount || ''}
                onChange={(e) =>
                  setLocalFilters({ ...localFilters, minAmount: e.target.value })
                }
                step="0.01"
              />
              <span className="text-muted-foreground">to</span>
              <Input
                type="number"
                placeholder="Max"
                value={localFilters.maxAmount || ''}
                onChange={(e) =>
                  setLocalFilters({ ...localFilters, maxAmount: e.target.value })
                }
                step="0.01"
              />
            </div>
          </div>

          {/* Transaction Type */}
          <div className="grid gap-2 animate-in fade-in slide-in-from-top-2 duration-300 delay-[350ms]">
            <Label htmlFor="type">Transaction Type</Label>
            <Select
              value={localFilters.type || ''}
              onValueChange={(value) =>
                setLocalFilters({ ...localFilters, type: value || undefined })
              }
            >
              <SelectTrigger id="type">
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All types</SelectItem>
                <SelectItem value="DEBIT">Debit (Expenses)</SelectItem>
                <SelectItem value="CREDIT">Credit (Income)</SelectItem>
                <SelectItem value="TRANSFER">Transfer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Reconciliation Status */}
          <div className="grid gap-2 animate-in fade-in slide-in-from-top-2 duration-300 delay-[400ms]">
            <Label htmlFor="reconciled">Reconciliation Status</Label>
            <Select
              value={localFilters.isReconciled || ''}
              onValueChange={(value) =>
                setLocalFilters({ ...localFilters, isReconciled: value || undefined })
              }
            >
              <SelectTrigger id="reconciled">
                <SelectValue placeholder="All transactions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All transactions</SelectItem>
                <SelectItem value="true">Reconciled</SelectItem>
                <SelectItem value="false">Unreconciled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Recurring Status */}
          <div className="grid gap-2 animate-in fade-in slide-in-from-top-2 duration-300 delay-[450ms]">
            <Label htmlFor="recurring">Recurring Status</Label>
            <Select
              value={localFilters.isRecurring || ''}
              onValueChange={(value) =>
                setLocalFilters({ ...localFilters, isRecurring: value || undefined })
              }
            >
              <SelectTrigger id="recurring">
                <SelectValue placeholder="All transactions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All transactions</SelectItem>
                <SelectItem value="true">Recurring only</SelectItem>
                <SelectItem value="false">One-time only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="flex gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300 delay-500">
          <Button variant="outline" onClick={handleClearAll}>
            Clear All
          </Button>
          <Button onClick={handleApplyFilters}>Apply Filters</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
