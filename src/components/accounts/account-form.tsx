'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { IconPicker } from './icon-picker';
import { ColorPicker } from './color-picker';

export interface AccountFormData {
  name: string;
  institution: string;
  accountType: string;
  accountNumber: string;
  currency: string;
  currentBalance: string;
  availableBalance: string;
  color: string;
  icon: string;
  isActive: boolean;
}

export const accountTypes = [
  { value: 'CHECKING', label: 'Checking' },
  { value: 'SAVINGS', label: 'Savings' },
  { value: 'CREDIT_CARD', label: 'Credit Card' },
  { value: 'INVESTMENT', label: 'Investment' },
  { value: 'LOAN', label: 'Loan' },
  { value: 'OTHER', label: 'Other' },
];

interface AccountFormProps {
  formData: AccountFormData;
  onChange: (formData: AccountFormData) => void;
  isEditing: boolean;
  error?: string;
}

export function AccountForm({ formData, onChange, isEditing, error }: AccountFormProps) {
  const updateField = (field: keyof AccountFormData, value: string | boolean) => {
    onChange({ ...formData, [field]: value });
  };

  return (
    <div className="space-y-4 py-4">
      {error && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-300 bg-destructive/10 border border-destructive rounded-md p-3 text-sm text-destructive">
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 flex-shrink-0">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Account Name */}
      <div className="space-y-2">
        <Label htmlFor="name">Account Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => updateField('name', e.target.value)}
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
          onChange={(e) => updateField('institution', e.target.value)}
          placeholder="e.g., CIBC"
          required
        />
      </div>

      {/* Account Type */}
      <div className="space-y-2">
        <Label htmlFor="accountType">Account Type *</Label>
        <Select
          value={formData.accountType}
          onValueChange={(value) => updateField('accountType', value)}
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
          onChange={(e) => updateField('accountNumber', e.target.value)}
          placeholder="1234"
          maxLength={4}
        />
      </div>

      {/* Currency */}
      <div className="space-y-2">
        <Label htmlFor="currency">Currency</Label>
        <Select
          value={formData.currency}
          onValueChange={(value) => updateField('currency', value)}
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
          onChange={(e) => updateField('currentBalance', e.target.value)}
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
          onChange={(e) => updateField('availableBalance', e.target.value)}
          placeholder="0.00"
        />
      </div>

      {/* Icon Picker */}
      <IconPicker
        value={formData.icon}
        onChange={(value) => updateField('icon', value)}
      />

      {/* Color Picker */}
      <ColorPicker
        value={formData.color}
        onChange={(value) => updateField('color', value)}
      />

      {/* Active Status */}
      {isEditing && (
        <div className="flex items-center gap-2">
          <input
            id="isActive"
            type="checkbox"
            checked={formData.isActive}
            onChange={(e) => updateField('isActive', e.target.checked)}
            className="h-4 w-4"
          />
          <Label htmlFor="isActive" className="cursor-pointer">
            Account is active
          </Label>
        </div>
      )}
    </div>
  );
}
