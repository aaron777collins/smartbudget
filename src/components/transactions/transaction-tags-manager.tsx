'use client';

import { Label } from '@/components/ui/label';
import { TagSelector } from './tag-selector';

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface TransactionTagsManagerProps {
  selectedTags: Tag[];
  onTagsChange: (tags: Tag[]) => Promise<void>;
  updatingTags: boolean;
}

export function TransactionTagsManager({
  selectedTags,
  onTagsChange,
  updatingTags,
}: TransactionTagsManagerProps) {
  return (
    <div className="space-y-2">
      <Label>Tags</Label>
      <TagSelector
        selectedTags={selectedTags}
        onChange={onTagsChange}
      />
      {updatingTags && (
        <p className="text-xs text-muted-foreground">Updating tags...</p>
      )}
    </div>
  );
}
