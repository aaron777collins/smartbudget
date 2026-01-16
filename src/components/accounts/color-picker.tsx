'use client';

import { Label } from '@/components/ui/label';

export interface ColorOption {
  value: string;
  label: string;
}

export const colorOptions: ColorOption[] = [
  { value: '#2563EB', label: 'Blue' },
  { value: '#10B981', label: 'Green' },
  { value: '#F59E0B', label: 'Amber' },
  { value: '#EF4444', label: 'Red' },
  { value: '#8B5CF6', label: 'Purple' },
  { value: '#EC4899', label: 'Pink' },
  { value: '#14B8A6', label: 'Teal' },
  { value: '#6366F1', label: 'Indigo' },
];

interface ColorPickerProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

export function ColorPicker({ value, onChange, label = 'Color' }: ColorPickerProps) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex flex-wrap gap-2">
        {colorOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`w-10 h-10 rounded-full border-2 transition-all ${
              value === option.value ? 'border-foreground scale-110' : 'border-border'
            }`}
            style={{ backgroundColor: option.value }}
            title={option.label}
            aria-label={`Select ${option.label} color`}
          />
        ))}
      </div>
    </div>
  );
}
