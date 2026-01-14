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
import { Badge } from '@/components/ui/badge';
import { Loader2, TrendingUp, Calendar, DollarSign, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';

interface RecurringPattern {
  merchantName: string;
  frequency: string;
  amount: number;
  categoryId: string;
  nextDueDate: string;
  transactionIds: string[];
  confidence: number;
}

interface DetectionSummary {
  totalTransactionsAnalyzed: number;
  merchantsAnalyzed: number;
  patternsDetected: number;
  lookbackMonths: number;
  minOccurrences: number;
}

interface RecurringDetectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRulesCreated: () => void;
}

export function RecurringDetectionDialog({
  open,
  onOpenChange,
  onRulesCreated,
}: RecurringDetectionDialogProps) {
  const [loading, setLoading] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [patterns, setPatterns] = useState<RecurringPattern[]>([]);
  const [summary, setSummary] = useState<DetectionSummary | null>(null);
  const [selectedPatterns, setSelectedPatterns] = useState<Set<number>>(new Set());

  const detectPatterns = async () => {
    setDetecting(true);
    try {
      const response = await fetch('/api/recurring-rules/detect?minOccurrences=3&lookbackMonths=6');
      if (!response.ok) throw new Error('Failed to detect patterns');

      const data = await response.json();
      setPatterns(data.patterns || []);
      setSummary(data.summary);

      // Auto-select patterns with confidence >= 0.8
      const highConfidenceIndices = data.patterns
        .map((p: RecurringPattern, idx: number) => (p.confidence >= 0.8 ? idx : -1))
        .filter((idx: number) => idx >= 0);
      setSelectedPatterns(new Set(highConfidenceIndices));

      if (data.patterns.length === 0) {
        toast.info('No recurring patterns detected', {
          description: 'Try adding more transaction history first.',
        });
      } else {
        toast.success(`Found ${data.patterns.length} recurring patterns!`);
      }
    } catch (error) {
      console.error('Error detecting patterns:', error);
      toast.error('Failed to detect recurring patterns');
    } finally {
      setDetecting(false);
    }
  };

  const createRules = async () => {
    if (selectedPatterns.size === 0) {
      toast.warning('Please select at least one pattern to create');
      return;
    }

    setLoading(true);
    try {
      const selectedPatternsList = Array.from(selectedPatterns).map((idx) => patterns[idx]);

      const promises = selectedPatternsList.map((pattern) =>
        fetch('/api/recurring-rules', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(pattern),
        })
      );

      const results = await Promise.all(promises);
      const successCount = results.filter((r) => r.ok).length;

      if (successCount === selectedPatternsList.length) {
        toast.success(`Created ${successCount} recurring rules!`);
        onRulesCreated();
        onOpenChange(false);
        // Reset state
        setPatterns([]);
        setSummary(null);
        setSelectedPatterns(new Set());
      } else {
        toast.warning(`Created ${successCount} of ${selectedPatternsList.length} rules`);
        onRulesCreated();
      }
    } catch (error) {
      console.error('Error creating rules:', error);
      toast.error('Failed to create recurring rules');
    } finally {
      setLoading(false);
    }
  };

  const togglePattern = (index: number) => {
    const newSelected = new Set(selectedPatterns);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedPatterns(newSelected);
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.8) {
      return <Badge className="bg-green-500">High: {(confidence * 100).toFixed(0)}%</Badge>;
    } else if (confidence >= 0.7) {
      return <Badge className="bg-yellow-500">Medium: {(confidence * 100).toFixed(0)}%</Badge>;
    } else {
      return <Badge variant="secondary">Low: {(confidence * 100).toFixed(0)}%</Badge>;
    }
  };

  const getFrequencyLabel = (frequency: string) => {
    return frequency.replace('_', '-').toLowerCase();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detect Recurring Transactions</DialogTitle>
          <DialogDescription>
            Automatically detect recurring patterns from your transaction history
          </DialogDescription>
        </DialogHeader>

        {!summary ? (
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This will analyze your transactions from the last 6 months to detect recurring
                patterns (subscriptions, bills, etc.). Patterns with at least 3 occurrences will be
                detected.
              </AlertDescription>
            </Alert>

            <Button onClick={detectPatterns} disabled={detecting} className="w-full">
              {detecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing Transactions...
                </>
              ) : (
                'Start Detection'
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Transactions Analyzed</p>
                <p className="text-2xl font-bold">{summary.totalTransactionsAnalyzed}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Patterns Found</p>
                <p className="text-2xl font-bold">{summary.patternsDetected}</p>
              </div>
            </div>

            {/* Patterns List */}
            {patterns.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">
                    Select patterns to create recurring rules ({selectedPatterns.size} selected)
                  </h3>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedPatterns(new Set(patterns.map((_, i) => i)))}
                    >
                      Select All
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedPatterns(new Set())}
                    >
                      Clear
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {patterns.map((pattern, index) => (
                    <div
                      key={index}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedPatterns.has(index)
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => togglePattern(index)}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{pattern.merchantName}</h4>
                            {getConfidenceBadge(pattern.confidence)}
                          </div>

                          <div className="grid grid-cols-3 gap-3 text-sm">
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <TrendingUp className="h-3 w-3" />
                              <span className="capitalize">
                                {getFrequencyLabel(pattern.frequency)}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <DollarSign className="h-3 w-3" />
                              <span>${pattern.amount.toFixed(2)}</span>
                            </div>
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              <span>
                                Next: {new Date(pattern.nextDueDate).toLocaleDateString()}
                              </span>
                            </div>
                          </div>

                          <p className="text-xs text-muted-foreground">
                            {pattern.transactionIds.length} occurrences detected
                          </p>
                        </div>

                        <input
                          type="checkbox"
                          checked={selectedPatterns.has(index)}
                          onChange={() => togglePattern(index)}
                          className="mt-1"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No recurring patterns found. Try adding more transaction history or adjusting the
                  detection criteria.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          {summary && patterns.length > 0 && (
            <Button onClick={createRules} disabled={loading || selectedPatterns.size === 0}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                `Create ${selectedPatterns.size} Rule${selectedPatterns.size !== 1 ? 's' : ''}`
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
