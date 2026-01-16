'use client';

import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';

interface AccountDeleteConfirmationProps {
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export function AccountDeleteConfirmation({
  onConfirm,
  onCancel,
  loading = false,
}: AccountDeleteConfirmationProps) {
  return (
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
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="destructive"
          onClick={onConfirm}
          disabled={loading}
        >
          {loading ? 'Deleting...' : 'Delete Account'}
        </Button>
      </DialogFooter>
    </div>
  );
}
