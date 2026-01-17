'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { HoverScale } from '@/components/ui/animated';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getContrastTextColor } from '@/lib/design-tokens';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Tag, Plus, Edit, Trash2, Hash } from 'lucide-react';
import { toast } from 'sonner';

interface TagData {
  id: string;
  name: string;
  color: string;
  _count: {
    transactions: number;
  };
}

const COLOR_PRESETS = [
  { name: 'Gray', value: '#6B7280' },
  { name: 'Red', value: '#EF4444' },
  { name: 'Orange', value: '#F97316' },
  { name: 'Amber', value: '#F59E0B' },
  { name: 'Yellow', value: '#EAB308' },
  { name: 'Lime', value: '#84CC16' },
  { name: 'Green', value: '#10B981' },
  { name: 'Emerald', value: '#059669' },
  { name: 'Teal', value: '#14B8A6' },
  { name: 'Cyan', value: '#06B6D4' },
  { name: 'Sky', value: '#0EA5E9' },
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Indigo', value: '#6366F1' },
  { name: 'Violet', value: '#8B5CF6' },
  { name: 'Purple', value: '#A855F7' },
  { name: 'Fuchsia', value: '#D946EF' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Rose', value: '#F43F5E' },
];

export default function TagsClient() {
  const [loading, setLoading] = useState(true);
  const [tags, setTags] = useState<TagData[]>([]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTag, setSelectedTag] = useState<TagData | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Form state
  const [formName, setFormName] = useState('');
  const [formColor, setFormColor] = useState('#6B7280');

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/tags');
      if (!response.ok) throw new Error('Failed to fetch tags');

      const data = await response.json();
      setTags(data);
    } catch (error) {
      console.error('Error fetching tags:', error);
      toast.error('Failed to load tags');
    } finally {
      setLoading(false);
    }
  };

  const openCreateDialog = () => {
    setFormName('');
    setFormColor('#6B7280');
    setCreateDialogOpen(true);
  };

  const openEditDialog = (tag: TagData) => {
    setSelectedTag(tag);
    setFormName(tag.name);
    setFormColor(tag.color);
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (tag: TagData) => {
    setSelectedTag(tag);
    setDeleteDialogOpen(true);
  };

  const handleCreate = async () => {
    if (!formName.trim()) {
      toast.error('Tag name is required');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName.trim(),
          color: formColor,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create tag');
      }

      toast.success('Tag created successfully');
      setCreateDialogOpen(false);
      fetchTags();
    } catch (error) {
      console.error('Error creating tag:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create tag');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedTag) return;
    if (!formName.trim()) {
      toast.error('Tag name is required');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/tags/${selectedTag.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName.trim(),
          color: formColor,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update tag');
      }

      toast.success('Tag updated successfully');
      setEditDialogOpen(false);
      setSelectedTag(null);
      fetchTags();
    } catch (error) {
      console.error('Error updating tag:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update tag');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedTag) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/tags/${selectedTag.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete tag');

      toast.success('Tag deleted successfully');
      setDeleteDialogOpen(false);
      setSelectedTag(null);
      fetchTags();
    } catch (error) {
      console.error('Error deleting tag:', error);
      toast.error('Failed to delete tag');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Hash className="h-8 w-8" />
            Tags
          </h1>
          <p className="text-muted-foreground mt-1">
            Organize your transactions with custom labels
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Create Tag
        </Button>
      </div>

      {/* Tags Grid */}
      {tags.length === 0 ? (
        <Card className="hover:shadow-lg transition-all duration-200">
          <CardContent className="p-12 text-center">
            <Tag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No tags yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first tag to start organizing transactions
            </p>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Create Tag
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {tags.map((tag) => {
            const textColor = getContrastTextColor(tag.color);
            return (
              <HoverScale key={tag.id} scale={1.02}>
                <Card className="h-full hover:shadow-lg transition-all duration-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <Badge
                        style={{
                          backgroundColor: tag.color,
                          color: textColor
                        }}
                      >
                        #{tag.name}
                      </Badge>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => openEditDialog(tag)}
                        aria-label={`Edit tag ${tag.name}`}
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => openDeleteDialog(tag)}
                        aria-label={`Delete tag ${tag.name}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground">
                    {tag._count.transactions}{' '}
                    {tag._count.transactions === 1 ? 'transaction' : 'transactions'}
                  </div>
                </CardContent>
              </Card>
            </HoverScale>
            );
          })}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Tag</DialogTitle>
            <DialogDescription>
              Add a new tag to organize your transactions
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g., Business, Vacation, Tax Deductible"
                maxLength={50}
              />
            </div>

            <div>
              <Label>Color</Label>
              <div className="grid grid-cols-6 gap-2 mt-2">
                {COLOR_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    className={`h-10 w-10 rounded-md border-2 transition-all ${
                      formColor === preset.value
                        ? 'border-primary scale-110'
                        : 'border-transparent hover:scale-105'
                    }`}
                    style={{ backgroundColor: preset.value }}
                    onClick={() => setFormColor(preset.value)}
                    title={preset.name}
                    aria-label={`Select ${preset.name} color`}
                  />
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateDialogOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={saving}>
              {saving ? 'Creating...' : 'Create Tag'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Tag</DialogTitle>
            <DialogDescription>
              Update tag name and color
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Tag name"
                maxLength={50}
              />
            </div>

            <div>
              <Label>Color</Label>
              <div className="grid grid-cols-6 gap-2 mt-2">
                {COLOR_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    className={`h-10 w-10 rounded-md border-2 transition-all ${
                      formColor === preset.value
                        ? 'border-primary scale-110'
                        : 'border-transparent hover:scale-105'
                    }`}
                    style={{ backgroundColor: preset.value }}
                    onClick={() => setFormColor(preset.value)}
                    title={preset.name}
                    aria-label={`Select ${preset.name} color`}
                  />
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Tag</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the tag &quot;{selectedTag?.name}&quot;?
              {selectedTag && selectedTag._count.transactions > 0 && (
                <span className="block mt-2 text-destructive font-medium">
                  This tag is used by {selectedTag._count.transactions}{' '}
                  {selectedTag._count.transactions === 1 ? 'transaction' : 'transactions'}.
                  It will be removed from all transactions.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
