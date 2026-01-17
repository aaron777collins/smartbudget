'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shake, Pulse } from '@/components/ui/animated';
import { Wallet, CreditCard, Landmark, PiggyBank, TrendingUp, HelpCircle, Trash2, CheckCircle } from 'lucide-react';
import { ScreenReaderAnnouncer } from '@/components/ui/screen-reader-announcer';

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
}

interface AccountFormDialogProps {
  open: boolean;
  onClose: () => void;
  account: Account | null;
}

const accountTypes = [
  { value: 'CHECKING', label: 'Checking' },
  { value: 'SAVINGS', label: 'Savings' },
  { value: 'CREDIT_CARD', label: 'Credit Card' },
  { value: 'INVESTMENT', label: 'Investment' },
  { value: 'LOAN', label: 'Loan' },
  { value: 'OTHER', label: 'Other' },
];

const iconOptions = [
  { value: 'wallet', label: 'Wallet', icon: Wallet },
  { value: 'credit-card', label: 'Credit Card', icon: CreditCard },
  { value: 'landmark', label: 'Bank', icon: Landmark },
  { value: 'piggy-bank', label: 'Piggy Bank', icon: PiggyBank },
  { value: 'trending-up', label: 'Investment', icon: TrendingUp },
  { value: 'help-circle', label: 'Other', icon: HelpCircle },
];

const colorOptions = [
  { value: '#2563EB', label: 'Blue' },
  { value: '#10B981', label: 'Green' },
  { value: '#F59E0B', label: 'Amber' },
  { value: '#EF4444', label: 'Red' },
  { value: '#8B5CF6', label: 'Purple' },
  { value: '#EC4899', label: 'Pink' },
  { value: '#14B8A6', label: 'Teal' },
  { value: '#6366F1', label: 'Indigo' },
];

export function AccountFormDialog({ open, onClose, account }: AccountFormDialogProps) {
  const isEditing = !!account;

  const [formData, setFormData] = useState({
    name: '',
    institution: '',
    accountType: 'CHECKING',
    accountNumber: '',
    currency: 'CAD',
    currentBalance: '',
    availableBalance: '',
    color: '#2563EB',
    icon: 'wallet',
    isActive: true,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (account) {
      setFormData({
        name: account.name,
        institution: account.institution,
        accountType: account.accountType,
        accountNumber: account.accountNumber || '',
        currency: account.currency,
        currentBalance: account.currentBalance.toString(),
        availableBalance: account.availableBalance?.toString() || '',
        color: account.color,
        icon: account.icon,
        isActive: account.isActive,
      });
    } else {
      setFormData({
        name: '',
        institution: '',
        accountType: 'CHECKING',
        accountNumber: '',
        currency: 'CAD',
        currentBalance: '',
        availableBalance: '',
        color: '#2563EB',
        icon: 'wallet',
        isActive: true,
      });
    }
    setError('');
    setSuccess('');
    setShowDeleteConfirm(false);
  }, [account, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const body = {
        name: formData.name,
        institution: formData.institution,
        accountType: formData.accountType,
        accountNumber: formData.accountNumber || null,
        currency: formData.currency,
        currentBalance: parseFloat(formData.currentBalance),
        availableBalance: formData.availableBalance ? parseFloat(formData.availableBalance) : null,
        color: formData.color,
        icon: formData.icon,
        isActive: formData.isActive,
      };

      const url = isEditing ? `/api/accounts/${account.id}` : '/api/accounts';
      const method = isEditing ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save account');
      }

      setSuccess(isEditing ? 'Account updated successfully!' : 'Account created successfully!');
      setTimeout(() => onClose(), 1500);
    } catch (error) {
      console.error('Error saving account:', error);
      setError(error instanceof Error ? error.message : 'Failed to save account');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!account) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`/api/accounts/${account.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete account');
      }

      setSuccess('Account deleted successfully!');
      setTimeout(() => onClose(), 1500);
    } catch (error) {
      console.error('Error deleting account:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete account');
      setShowDeleteConfirm(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Account' : 'Add New Account'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update your account information'
              : 'Add a new bank account, credit card, or investment account'}
          </DialogDescription>
        </DialogHeader>

        {showDeleteConfirm ? (
          <div className="space-y-4 py-4">
            <div className="bg-destructive/10 border border-destructive rounded-md p-4">
              <p className="font-semibold text-destructive mb-2">Are you sure?</p>
              <p className="text-sm text-muted-foreground">
                This action cannot be undone. This will permanently delete the account.
              </p>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={loading}
              >
                {loading ? 'Deleting...' : 'Delete Account'}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              {success && (
                <>
                  <ScreenReaderAnnouncer message={success} />
                  <Pulse scale={1.02} duration={0.6}>
                    <Alert className="bg-success/10 border-success" role="status">
                      <CheckCircle className="h-4 w-4 text-success" />
                      <AlertDescription className="text-success">{success}</AlertDescription>
                    </Alert>
                  </Pulse>
                </>
              )}

              {error && (
                <>
                  <ScreenReaderAnnouncer
                    message={`Error: ${error}`}
                    politeness="assertive"
                  />
                  <Shake trigger={!!error} duration={0.5} intensity={10}>
                    <div className="bg-destructive/10 border border-destructive rounded-md p-3 text-sm text-destructive" role="alert">
                      {error}
                    </div>
                  </Shake>
                </>
              )}

              {/* Account Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Account Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., CIBC Checking"
                  required
                />
              </div>

              {/* Institution */}
              <div className="space-y-2">
                <Label htmlFor="institution">Institution *</Label>
                <Input
                  id="institution"
                  value={formData.institution}
                  onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                  placeholder="e.g., CIBC"
                  required
                />
              </div>

              {/* Account Type */}
              <div className="space-y-2">
                <Label htmlFor="accountType">Account Type *</Label>
                <Select
                  value={formData.accountType}
                  onValueChange={(value) => setFormData({ ...formData, accountType: value })}
                >
                  <SelectTrigger id="accountType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {accountTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Account Number */}
              <div className="space-y-2">
                <Label htmlFor="accountNumber">Account Number (Last 4 digits)</Label>
                <Input
                  id="accountNumber"
                  value={formData.accountNumber}
                  onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                  placeholder="1234"
                  maxLength={4}
                />
              </div>

              {/* Currency */}
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select
                  value={formData.currency}
                  onValueChange={(value) => setFormData({ ...formData, currency: value })}
                >
                  <SelectTrigger id="currency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CAD">CAD (Canadian Dollar)</SelectItem>
                    <SelectItem value="USD">USD (US Dollar)</SelectItem>
                    <SelectItem value="EUR">EUR (Euro)</SelectItem>
                    <SelectItem value="GBP">GBP (British Pound)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Current Balance */}
              <div className="space-y-2">
                <Label htmlFor="currentBalance">Current Balance *</Label>
                <Input
                  id="currentBalance"
                  type="number"
                  step="0.01"
                  value={formData.currentBalance}
                  onChange={(e) => setFormData({ ...formData, currentBalance: e.target.value })}
                  placeholder="0.00"
                  required
                />
              </div>

              {/* Available Balance */}
              <div className="space-y-2">
                <Label htmlFor="availableBalance">Available Balance</Label>
                <Input
                  id="availableBalance"
                  type="number"
                  step="0.01"
                  value={formData.availableBalance}
                  onChange={(e) => setFormData({ ...formData, availableBalance: e.target.value })}
                  placeholder="0.00"
                />
              </div>

              {/* Icon */}
              <div className="space-y-2">
                <Label>Icon</Label>
                <div className="grid grid-cols-3 gap-2">
                  {iconOptions.map((option) => {
                    const IconComponent = option.icon;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, icon: option.value })}
                        className={`flex items-center gap-2 p-3 rounded-md border transition-all duration-200 hover:scale-[1.02] ${
                          formData.icon === option.value
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:bg-accent'
                        }`}
                        aria-label={`Select ${option.label} icon`}
                      >
                        <IconComponent className="h-4 w-4" />
                        <span className="text-sm">{option.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Color */}
              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex flex-wrap gap-2">
                  {colorOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, color: option.value })}
                      className={`w-11 h-11 rounded-full border-2 transition-all duration-200 hover:scale-110 ${
                        formData.color === option.value ? 'border-foreground scale-110' : 'border-border'
                      }`}
                      style={{ backgroundColor: option.value }}
                      title={option.label}
                      aria-label={`Select color ${option.label}`}
                    />
                  ))}
                </div>
              </div>

              {/* Active Status */}
              {isEditing && (
                <div className="flex items-center gap-2">
                  <input
                    id="isActive"
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="isActive" className="cursor-pointer">
                    Account is active
                  </Label>
                </div>
              )}
            </div>

            <DialogFooter>
              {isEditing && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={loading}
                  className="mr-auto"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              )}
              <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Account'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
