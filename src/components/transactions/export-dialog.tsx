'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Download, FileText, FileSpreadsheet, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters?: {
    search?: string;
    accountId?: string;
    categoryId?: string;
    tagId?: string;
    startDate?: string;
    endDate?: string;
    minAmount?: string;
    maxAmount?: string;
    type?: string;
    isReconciled?: string;
    isRecurring?: string;
  };
}

export function ExportDialog({ open, onOpenChange, filters = {} }: ExportDialogProps) {
  const [selectedFormat, setSelectedFormat] = useState<'csv' | 'json'>('csv');
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);

    try {
      // Build query string with filters
      const params = new URLSearchParams({
        format: selectedFormat,
        ...filters,
      });

      // Make API request
      const response = await fetch(`/api/transactions/export?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Export failed');
      }

      if (selectedFormat === 'json') {
        // Handle JSON export
        const data = await response.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `transactions_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast.success(`Exported ${data.count} transactions to JSON`);
      } else {
        // Handle CSV export
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast.success('Transactions exported to CSV');
      }

      onOpenChange(false);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export transactions');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Export Transactions</DialogTitle>
          <DialogDescription>
            Export your transactions in CSV or JSON format. Current filters will be applied to the export.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Format Selection */}
          <div className="space-y-3">
            <Label>Export Format</Label>
            <div className="grid grid-cols-2 gap-3">
              {/* CSV Option */}
              <button
                type="button"
                onClick={() => setSelectedFormat('csv')}
                className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 p-6 transition-all hover:bg-accent ${
                  selectedFormat === 'csv'
                    ? 'border-primary bg-primary/5'
                    : 'border-border'
                }`}
              >
                <FileSpreadsheet
                  className={`h-8 w-8 ${
                    selectedFormat === 'csv' ? 'text-primary' : 'text-muted-foreground'
                  }`}
                />
                <div className="text-center">
                  <div className="font-semibold">CSV</div>
                  <div className="text-xs text-muted-foreground">
                    Excel compatible
                  </div>
                </div>
              </button>

              {/* JSON Option */}
              <button
                type="button"
                onClick={() => setSelectedFormat('json')}
                className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 p-6 transition-all hover:bg-accent ${
                  selectedFormat === 'json'
                    ? 'border-primary bg-primary/5'
                    : 'border-border'
                }`}
              >
                <FileText
                  className={`h-8 w-8 ${
                    selectedFormat === 'json' ? 'text-primary' : 'text-muted-foreground'
                  }`}
                />
                <div className="text-center">
                  <div className="font-semibold">JSON</div>
                  <div className="text-xs text-muted-foreground">
                    Detailed data
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Active Filters Info */}
          {Object.keys(filters).length > 0 && (
            <div className="rounded-lg bg-muted p-4">
              <div className="text-sm font-medium mb-2">Active Filters</div>
              <div className="text-xs text-muted-foreground">
                Your current filters will be applied to the export. Only matching transactions will be included.
              </div>
            </div>
          )}

          {/* Format Details */}
          <div className="rounded-lg border p-4 text-sm">
            {selectedFormat === 'csv' ? (
              <div className="space-y-2">
                <div className="font-medium">CSV Export includes:</div>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Date, description, merchant, amount</li>
                  <li>Account, category, subcategory</li>
                  <li>Tags, notes, status flags</li>
                  <li>Compatible with Excel and Google Sheets</li>
                </ul>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="font-medium">JSON Export includes:</div>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Complete transaction data</li>
                  <li>All relationships (account, category, tags)</li>
                  <li>Metadata and timestamps</li>
                  <li>Suitable for data analysis and backups</li>
                </ul>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isExporting}
          >
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Export
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
