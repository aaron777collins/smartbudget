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
import { Trash2 } from 'lucide-react';
import { AccountForm, AccountFormData } from './account-form';
import { AccountDeleteConfirmation } from './account-delete-confirmation';

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

export function AccountFormDialog({ open, onClose, account }: AccountFormDialogProps) {
  const isEditing = !!account;

  const [formData, setFormData] = useState<AccountFormData>({
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
    setShowDeleteConfirm(false);
  }, [account, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
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

      onClose();
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

    try {
      const response = await fetch(`/api/accounts/${account.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete account');
      }

      onClose();
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
          <AccountDeleteConfirmation
            onConfirm={handleDelete}
            onCancel={() => setShowDeleteConfirm(false)}
            loading={loading}
          />
        ) : (
          <form onSubmit={handleSubmit}>
            <AccountForm
              formData={formData}
              onChange={setFormData}
              isEditing={isEditing}
              error={error}
            />

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
