'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton, SkeletonTable } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TransactionDetailDialog } from '@/components/transactions/transaction-detail-dialog';
import { AdvancedFilters, TransactionFilters } from '@/components/transactions/advanced-filters';
import { ExportDialog } from '@/components/transactions/export-dialog';
import { Search, Filter, Download, Plus, Pencil, Trash2, Repeat, X } from 'lucide-react';
import { Badge as FilterBadge } from '@/components/ui/badge';
import { ScreenReaderAnnouncer } from '@/components/ui/screen-reader-announcer';
import { getCategoryBadgeColors } from '@/lib/design-tokens';

interface Transaction {
  id: string;
  date: string;
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
  isReconciled: boolean;
  isRecurring: boolean;
}

interface TransactionResponse {
  transactions: Transaction[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export default function TransactionsPage() {
  const { data: session } = useSession();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [offset, setOffset] = useState(0);
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedTagId, setSelectedTagId] = useState<string>('');
  const [availableTags, setAvailableTags] = useState<Array<{ id: string; name: string; color: string }>>([]);
  const [advancedFilters, setAdvancedFilters] = useState<TransactionFilters>({});
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [srMessage, setSrMessage] = useState<string>('');
  const limit = 50;

  useEffect(() => {
    if (session) {
      fetchTags();
    }
  }, [session]);

  useEffect(() => {
    if (session) {
      fetchTransactions();
    }
  }, [session, search, sortBy, sortOrder, offset, selectedTagId, advancedFilters]);

  const fetchTags = async () => {
    try {
      const response = await fetch('/api/tags');
      if (!response.ok) throw new Error('Failed to fetch tags');

      const data = await response.json();
      setAvailableTags(data);
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setSrMessage('Loading transactions...');
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
        sortBy,
        sortOrder,
      });

      if (search) {
        params.append('search', search);
      }

      if (selectedTagId) {
        params.append('tagId', selectedTagId);
      }

      // Add advanced filters
      if (advancedFilters.accountId) {
        params.append('accountId', advancedFilters.accountId);
      }
      if (advancedFilters.categoryId) {
        params.append('categoryId', advancedFilters.categoryId);
      }
      if (advancedFilters.tagId) {
        params.append('tagId', advancedFilters.tagId);
      }
      if (advancedFilters.dateRange?.from) {
        params.append('startDate', advancedFilters.dateRange.from.toISOString());
      }
      if (advancedFilters.dateRange?.to) {
        params.append('endDate', advancedFilters.dateRange.to.toISOString());
      }
      if (advancedFilters.minAmount) {
        params.append('minAmount', advancedFilters.minAmount);
      }
      if (advancedFilters.maxAmount) {
        params.append('maxAmount', advancedFilters.maxAmount);
      }
      if (advancedFilters.type) {
        params.append('type', advancedFilters.type);
      }
      if (advancedFilters.isReconciled) {
        params.append('isReconciled', advancedFilters.isReconciled);
      }
      if (advancedFilters.isRecurring) {
        params.append('isRecurring', advancedFilters.isRecurring);
      }

      const response = await fetch(`/api/transactions?${params}`);
      if (!response.ok) throw new Error('Failed to fetch transactions');

      const data: TransactionResponse = await response.json();
      setTransactions(data.transactions);
      setTotal(data.total);
      setSrMessage(`Loaded ${data.transactions.length} transactions. Total ${data.total} transactions found.`);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setSrMessage('Error loading transactions. Please try again.');
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
      month: 'short',
      day: 'numeric',
    });
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    setOffset(0); // Reset to first page
  };

  const handleTagFilter = (value: string) => {
    setSelectedTagId(value);
    setOffset(0); // Reset to first page
  };

  const handleNextPage = () => {
    if (offset + limit < total) {
      setOffset(offset + limit);
    }
  };

  const handlePrevPage = () => {
    if (offset > 0) {
      setOffset(Math.max(0, offset - limit));
    }
  };

  const handleViewTransaction = (transactionId: string) => {
    setSelectedTransactionId(transactionId);
    setDetailDialogOpen(true);
  };

  const handleTransactionUpdated = () => {
    fetchTransactions(); // Refresh the list
  };

  const handleTransactionDeleted = () => {
    fetchTransactions(); // Refresh the list
  };

  const handleAdvancedFiltersChange = (filters: TransactionFilters) => {
    setAdvancedFilters(filters);
    setOffset(0); // Reset to first page
  };

  const handleClearAdvancedFilters = () => {
    setAdvancedFilters({});
    setOffset(0); // Reset to first page
  };

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Please sign in to view transactions.</p>
      </div>
    );
  }

  // Loading skeleton state
  if (loading && transactions.length === 0) {
    return (
      <div className={`${SPACING.page.container} ${SPACING.section.relaxed}`}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-9 w-[200px]" />
            <Skeleton className="h-5 w-[300px]" />
          </div>
          <Skeleton className="h-10 w-[150px]" />
        </div>

        {/* Filters and Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col md:flex-row gap-4">
                <Skeleton className="h-10 flex-1" />
                <Skeleton className="h-10 w-[180px]" />
                <Skeleton className="h-10 w-[180px]" />
                <Skeleton className="h-10 w-[140px]" />
                <Skeleton className="h-10 w-[120px]" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transactions Table */}
        <Card>
          <div className="overflow-x-auto p-6">
            <SkeletonTable rows={10} columns={6} />
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {srMessage && <ScreenReaderAnnouncer message={srMessage} />}
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
          <p className="text-muted-foreground">
            View and manage all your transactions
          </p>
        </div>
        <Button className="sm:w-auto">
          <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
          Add Transaction
        </Button>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <Input
                placeholder="Search transactions..."
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
                aria-label="Search transactions"
              />
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="amount">Amount</SelectItem>
                <SelectItem value="merchantName">Merchant</SelectItem>
                <SelectItem value="description">Description</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortOrder} onValueChange={(val) => setSortOrder(val as 'asc' | 'desc')}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Order" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">Newest First</SelectItem>
                <SelectItem value="asc">Oldest First</SelectItem>
              </SelectContent>
            </Select>
            <AdvancedFilters
              filters={advancedFilters}
              onFiltersChange={handleAdvancedFiltersChange}
              onClearFilters={handleClearAdvancedFilters}
            />
            <Button variant="outline" onClick={() => setExportDialogOpen(true)} className="w-full sm:w-auto">
              <Download className="mr-2 h-4 w-4" aria-hidden="true" />
              Export
            </Button>
          </div>

          {/* Active Filters Display */}
          {(Object.keys(advancedFilters).length > 0 || selectedTagId) && (
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm text-muted-foreground">Active filters:</span>
              {selectedTagId && (
                <FilterBadge variant="secondary" className="gap-1">
                  Tag: {availableTags.find(t => t.id === selectedTagId)?.name}
                  <button
                    onClick={() => handleTagFilter('')}
                    className="ml-1 hover:bg-background/80 rounded-full p-2 transition-colors duration-200"
                    aria-label="Remove tag filter"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </FilterBadge>
              )}
              {advancedFilters.accountId && (
                <FilterBadge variant="secondary" className="gap-1">
                  Account
                  <button
                    onClick={() => handleAdvancedFiltersChange({ ...advancedFilters, accountId: undefined })}
                    className="ml-1 hover:bg-background/80 rounded-full p-2 transition-colors duration-200"
                    aria-label="Remove account filter"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </FilterBadge>
              )}
              {advancedFilters.categoryId && (
                <FilterBadge variant="secondary" className="gap-1">
                  Category
                  <button
                    onClick={() => handleAdvancedFiltersChange({ ...advancedFilters, categoryId: undefined })}
                    className="ml-1 hover:bg-background/80 rounded-full p-2 transition-colors duration-200"
                    aria-label="Remove category filter"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </FilterBadge>
              )}
              {advancedFilters.dateRange && (
                <FilterBadge variant="secondary" className="gap-1">
                  Date Range
                  <button
                    onClick={() => handleAdvancedFiltersChange({ ...advancedFilters, dateRange: undefined })}
                    className="ml-1 hover:bg-background/80 rounded-full p-2 transition-colors duration-200"
                    aria-label="Remove date range filter"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </FilterBadge>
              )}
              {(advancedFilters.minAmount || advancedFilters.maxAmount) && (
                <FilterBadge variant="secondary" className="gap-1">
                  Amount Range
                  <button
                    onClick={() => handleAdvancedFiltersChange({ ...advancedFilters, minAmount: undefined, maxAmount: undefined })}
                    className="ml-1 hover:bg-background/80 rounded-full p-2 transition-colors duration-200"
                    aria-label="Remove amount range filter"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </FilterBadge>
              )}
              {advancedFilters.type && (
                <FilterBadge variant="secondary" className="gap-1">
                  Type: {advancedFilters.type}
                  <button
                    onClick={() => handleAdvancedFiltersChange({ ...advancedFilters, type: undefined })}
                    className="ml-1 hover:bg-background/80 rounded-full p-2 transition-colors duration-200"
                    aria-label="Remove type filter"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </FilterBadge>
              )}
              {advancedFilters.isReconciled && (
                <FilterBadge variant="secondary" className="gap-1">
                  {advancedFilters.isReconciled === 'true' ? 'Reconciled' : 'Unreconciled'}
                  <button
                    onClick={() => handleAdvancedFiltersChange({ ...advancedFilters, isReconciled: undefined })}
                    className="ml-1 hover:bg-background/80 rounded-full p-2 transition-colors duration-200"
                    aria-label="Remove reconciliation filter"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </FilterBadge>
              )}
              {advancedFilters.isRecurring && (
                <FilterBadge variant="secondary" className="gap-1">
                  {advancedFilters.isRecurring === 'true' ? 'Recurring' : 'One-time'}
                  <button
                    onClick={() => handleAdvancedFiltersChange({ ...advancedFilters, isRecurring: undefined })}
                    className="ml-1 hover:bg-background/80 rounded-full p-2 transition-colors duration-200"
                    aria-label="Remove recurring filter"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </FilterBadge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  handleClearAdvancedFilters();
                  setSelectedTagId('');
                }}
                className="h-7"
              >
                Clear all
              </Button>
            </div>
          )}
        </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <div className="overflow-x-auto">
          <Table aria-label="Transactions table">
            <TableHeader>
              <TableRow>
                <TableHead scope="col">Date</TableHead>
                <TableHead scope="col">Merchant</TableHead>
                <TableHead scope="col" className="hidden lg:table-cell">Account</TableHead>
                <TableHead scope="col" className="hidden md:table-cell">Category</TableHead>
                <TableHead scope="col" className="text-right">Amount</TableHead>
                <TableHead scope="col" className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <p className="text-muted-foreground">
                      No transactions found. Import your first transactions to get started.
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-medium">
                      {formatDate(transaction.date)}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          {transaction.merchantName}
                          {transaction.isRecurring && (
                            <span title="Recurring transaction">
                              <Repeat className="h-3.5 w-3.5 text-primary" />
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {transaction.description}
                        </div>
                        {/* Show account and category inline on smaller screens */}
                        <div className="flex flex-wrap gap-2 mt-2 md:hidden">
                          <Badge
                            variant="outline"
                            style={{ borderColor: transaction.account.color }}
                            className="text-xs"
                          >
                            {transaction.account.name}
                          </Badge>
                          {transaction.category && (
                            <Badge
                              variant="secondary"
                              style={getCategoryBadgeColors(transaction.category.color)}
                              className="text-xs"
                            >
                              {transaction.category.name}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <Badge
                        variant="outline"
                        style={{ borderColor: transaction.account.color }}
                      >
                        {transaction.account.name}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {transaction.category ? (
                        <Badge
                          variant="secondary"
                          style={getCategoryBadgeColors(transaction.category.color)}
                        >
                          {transaction.category.name}
                        </Badge>
                      ) : (
                        <Badge variant="outline">Uncategorized</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={`font-mono ${
                          transaction.type === 'DEBIT'
                            ? 'text-error'
                            : 'text-success'
                        }`}
                      >
                        {formatAmount(transaction.amount, transaction.type)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleViewTransaction(transaction.id)}
                          aria-label={`View transaction for ${transaction.merchantName}`}
                        >
                          <Pencil className="h-4 w-4" aria-hidden="true" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {!loading && transactions.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-4 border-t">
            <div className="text-sm text-muted-foreground text-center sm:text-left">
              Showing {offset + 1} to {Math.min(offset + limit, total)} of {total}{' '}
              transactions
            </div>
            <div className="flex gap-2 justify-center sm:justify-end">
              <Button
                variant="outline"
                onClick={handlePrevPage}
                disabled={offset === 0}
                className="flex-1 sm:flex-initial"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                onClick={handleNextPage}
                disabled={offset + limit >= total}
                className="flex-1 sm:flex-initial"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Transaction Detail Dialog */}
      <TransactionDetailDialog
        transactionId={selectedTransactionId}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        onUpdate={handleTransactionUpdated}
        onDelete={handleTransactionDeleted}
      />

      {/* Export Dialog */}
      <ExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        filters={{
          search: search || undefined,
          accountId: advancedFilters.accountId,
          categoryId: advancedFilters.categoryId,
          tagId: advancedFilters.tagId || selectedTagId || undefined,
          startDate: advancedFilters.dateRange?.from?.toISOString(),
          endDate: advancedFilters.dateRange?.to?.toISOString(),
          minAmount: advancedFilters.minAmount,
          maxAmount: advancedFilters.maxAmount,
          type: advancedFilters.type,
          isReconciled: advancedFilters.isReconciled,
          isRecurring: advancedFilters.isRecurring,
        }}
      />
    </div>
  );
}
