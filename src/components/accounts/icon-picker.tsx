'use client';

import { Wallet, CreditCard, Landmark, PiggyBank, TrendingUp, HelpCircle, LucideIcon } from 'lucide-react';
import { Label } from '@/components/ui/label';

export interface IconOption {
  value: string;
  label: string;
  icon: LucideIcon;
}

export const iconOptions: IconOption[] = [
  { value: 'wallet', label: 'Wallet', icon: Wallet },
  { value: 'credit-card', label: 'Credit Card', icon: CreditCard },
  { value: 'landmark', label: 'Bank', icon: Landmark },
  { value: 'piggy-bank', label: 'Piggy Bank', icon: PiggyBank },
  { value: 'trending-up', label: 'Investment', icon: TrendingUp },
  { value: 'help-circle', label: 'Other', icon: HelpCircle },
];

interface IconPickerProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

export function IconPicker({ value, onChange, label = 'Icon' }: IconPickerProps) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="grid grid-cols-3 gap-2">
        {iconOptions.map((option) => {
          const IconComponent = option.icon;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={`flex items-center gap-2 p-3 rounded-md border transition-colors ${
                value === option.value
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:bg-accent'
              }`}
            >
              <IconComponent className="h-4 w-4" />
              <span className="text-sm">{option.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
