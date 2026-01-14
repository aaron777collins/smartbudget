'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Search,
  Wallet,
  CreditCard,
  Landmark,
  PiggyBank,
  TrendingUp,
  HelpCircle,
  Edit,
  Eye
} from 'lucide-react';
import { AccountFormDialog } from '@/components/accounts/account-form-dialog';
import { useRouter } from 'next/navigation';

interface Account {
  id: string;
  name: string;
  institution: string;
  accountType: string;
  accountNumber: string | null;
  currency: string;
  currentBalance: number;
  availableBalance: number | null;
  color: string;
  icon: string;
  isActive: boolean;
  _count?: {
    transactions: number;
  };
}

const accountTypeLabels: Record<string, string> = {
  CHECKING: 'Checking',
  SAVINGS: 'Savings',
  CREDIT_CARD: 'Credit Card',
  INVESTMENT: 'Investment',
  LOAN: 'Loan',
  OTHER: 'Other',
};

const accountIcons: Record<string, any> = {
  wallet: Wallet,
  'credit-card': CreditCard,
  landmark: Landmark,
  'piggy-bank': PiggyBank,
  'trending-up': TrendingUp,
  'help-circle': HelpCircle,
};

export default function AccountsPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);

      const response = await fetch(`/api/accounts?${params}`);
      if (!response.ok) throw new Error('Failed to fetch accounts');

      const data = await response.json();
      setAccounts(data);
    } catch (error) {
      console.error('Error fetching accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, [search]);

  const handleCreateAccount = () => {
    setEditingAccount(null);
    setIsFormOpen(true);
  };

  const handleEditAccount = (account: Account) => {
    setEditingAccount(account);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingAccount(null);
    fetchAccounts();
  };

  const handleViewTransactions = (accountId: string) => {
    router.push(`/transactions?account=${accountId}`);
  };

  const getAccountIcon = (iconName: string) => {
    const IconComponent = accountIcons[iconName] || Wallet;
    return <IconComponent className="h-5 w-5" />;
  };

  const formatCurrency = (amount: number, currency: string = 'CAD') => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const totalBalance = accounts
    .filter(a => a.isActive)
    .reduce((sum, account) => sum + Number(account.currentBalance), 0);

  const totalAvailable = accounts
    .filter(a => a.isActive && a.availableBalance !== null)
    .reduce((sum, account) => sum + Number(account.availableBalance || 0), 0);

  const activeAccounts = accounts.filter(a => a.isActive).length;
  const totalTransactions = accounts.reduce((sum, a) => sum + (a._count?.transactions || 0), 0);

  if (loading && accounts.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Loading accounts...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Accounts</h1>
          <p className="text-muted-foreground">
            Manage your bank accounts, credit cards, and investments
          </p>
        </div>
        <Button onClick={handleCreateAccount}>
          <Plus className="mr-2 h-4 w-4" />
          Add Account
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalBalance)}</div>
            <p className="text-xs text-muted-foreground">
              Across {activeAccounts} active account{activeAccounts !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalAvailable)}</div>
            <p className="text-xs text-muted-foreground">
              Available to spend
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTransactions}</div>
            <p className="text-xs text-muted-foreground">
              Across all accounts
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Your Accounts</CardTitle>
          <CardDescription>
            View and manage all your financial accounts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search accounts..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          {/* Accounts Table */}
          {accounts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Wallet className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No accounts yet</h3>
              <p className="text-muted-foreground mb-4">
                Get started by adding your first account
              </p>
              <Button onClick={handleCreateAccount}>
                <Plus className="mr-2 h-4 w-4" />
                Add Account
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Account</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Institution</TableHead>
                    <TableHead className="text-right">Current Balance</TableHead>
                    <TableHead className="text-right">Available</TableHead>
                    <TableHead className="text-center">Transactions</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accounts.map((account) => (
                    <TableRow key={account.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div
                            className="p-2 rounded-lg"
                            style={{ backgroundColor: `${account.color}20`, color: account.color }}
                          >
                            {getAccountIcon(account.icon)}
                          </div>
                          <div>
                            <div className="font-medium">{account.name}</div>
                            {account.accountNumber && (
                              <div className="text-sm text-muted-foreground">
                                ****{account.accountNumber}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {accountTypeLabels[account.accountType] || account.accountType}
                        </Badge>
                      </TableCell>
                      <TableCell>{account.institution}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(account.currentBalance, account.currency)}
                      </TableCell>
                      <TableCell className="text-right">
                        {account.availableBalance !== null
                          ? formatCurrency(account.availableBalance, account.currency)
                          : '-'}
                      </TableCell>
                      <TableCell className="text-center">
                        {account._count?.transactions || 0}
                      </TableCell>
                      <TableCell>
                        <Badge variant={account.isActive ? 'default' : 'secondary'}>
                          {account.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewTransactions(account.id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditAccount(account)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Account Form Dialog */}
      <AccountFormDialog
        open={isFormOpen}
        onClose={handleFormClose}
        account={editingAccount}
      />
    </div>
  );
}
