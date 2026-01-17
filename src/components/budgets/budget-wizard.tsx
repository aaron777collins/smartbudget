'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ArrowLeft,
  ArrowRight,
  Calendar as CalendarIcon,
  Check,
  Wallet,
  Target,
  TrendingUp,
  Sparkles,
  DollarSign,
  Plus,
  Minus,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';

type BudgetType = 'ENVELOPE' | 'PERCENTAGE' | 'FIXED_AMOUNT' | 'GOAL_BASED';
type BudgetPeriod = 'WEEKLY' | 'BI_WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';

interface CategoryAllocation {
  categoryId: string;
  categoryName: string;
  amount?: number;
  suggestedAmount?: number;
  color?: string;
  icon?: string;
}

interface TemplateData {
  name: string;
  description: string;
  type: BudgetType;
  period?: BudgetPeriod;
  totalAmount?: number;
  categories: CategoryAllocation[];
  analysis?: {
    periodsAnalyzed: number;
    transactionCount: number;
    monthlyAverage: number;
  };
}

interface Category {
  id: string;
  name: string;
  slug: string;
  color: string;
  icon: string;
}

const budgetTypes = [
  { value: 'FIXED_AMOUNT', label: 'Fixed Amount', description: 'Set dollar amount per category', icon: DollarSign },
  { value: 'PERCENTAGE', label: 'Percentage-Based', description: '50/30/20 or custom percentages', icon: Target },
  { value: 'ENVELOPE', label: 'Envelope Budgeting', description: 'Assign every dollar (YNAB-style)', icon: Wallet },
  { value: 'GOAL_BASED', label: 'Goal-Based', description: 'Work towards specific goals', icon: TrendingUp },
];

const budgetPeriods = [
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'BI_WEEKLY', label: 'Bi-Weekly' },
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'QUARTERLY', label: 'Quarterly' },
  { value: 'YEARLY', label: 'Yearly' },
];

export default function BudgetWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Basic Info
  const [name, setName] = useState('');
  const [type, setType] = useState<BudgetType>('FIXED_AMOUNT');
  const [period, setPeriod] = useState<BudgetPeriod>('MONTHLY');
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [isActive, setIsActive] = useState(true);
  const [rollover, setRollover] = useState(false);

  // Step 2: Template Selection
  const [selectedTemplate, setSelectedTemplate] = useState<'suggested' | '50-30-20' | 'previous' | 'custom'>('suggested');
  const [templateData, setTemplateData] = useState<TemplateData | null>(null);
  const [loadingTemplate, setLoadingTemplate] = useState(false);

  // Step 3: Category Allocation
  const [categories, setCategories] = useState<Category[]>([]);
  const [allocations, setAllocations] = useState<CategoryAllocation[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);

  const totalSteps = 4;
  const progress = (step / totalSteps) * 100;

  // Load categories on mount
  useEffect(() => {
    fetchCategories();
  }, []);

  // Load template when template selection changes
  useEffect(() => {
    if (step === 2 && selectedTemplate !== 'custom') {
      loadTemplate(selectedTemplate);
    }
  }, [selectedTemplate, step]);

  async function fetchCategories() {
    try {
      const response = await fetch('/api/categories');
      if (!response.ok) throw new Error('Failed to fetch categories');
      const data = await response.json();
      setCategories(data);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  }

  async function loadTemplate(templateType: 'suggested' | '50-30-20' | 'previous') {
    setLoadingTemplate(true);
    setError(null);
    try {
      const response = await fetch(`/api/budgets/templates?type=${templateType}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('No previous budget found. Please use a different template.');
        }
        throw new Error('Failed to load template');
      }
      const data: TemplateData = await response.json();
      setTemplateData(data);

      // Apply template data
      if (data.totalAmount) {
        setTotalAmount(data.totalAmount);
      }
      if (data.categories) {
        setAllocations(data.categories.map(c => ({
          categoryId: c.categoryId,
          categoryName: c.categoryName || c.categoryId,
          amount: c.amount || c.suggestedAmount || 0,
          color: c.color,
          icon: c.icon,
        })));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load template');
      setTemplateData(null);
      setAllocations([]);
    } finally {
      setLoadingTemplate(false);
    }
  }

  function handleNext() {
    // Validation
    if (step === 1) {
      if (!name.trim()) {
        setError('Budget name is required');
        return;
      }
    }

    if (step === 3) {
      if (allocations.length === 0) {
        setError('Please add at least one category');
        return;
      }
      const total = allocations.reduce((sum, a) => sum + (a.amount || 0), 0);
      setTotalAmount(total);
    }

    setError(null);
    setStep(step + 1);
  }

  function handleBack() {
    setError(null);
    setStep(step - 1);
  }

  function addCategory() {
    const availableCategories = categories.filter(
      c => !allocations.find(a => a.categoryId === c.id)
    );

    if (availableCategories.length === 0) {
      setError('All categories have been added');
      return;
    }

    const firstAvailable = availableCategories[0];
    setAllocations([...allocations, {
      categoryId: firstAvailable.id,
      categoryName: firstAvailable.name,
      amount: 0,
      color: firstAvailable.color,
      icon: firstAvailable.icon,
    }]);
  }

  function removeCategory(categoryId: string) {
    setAllocations(allocations.filter(a => a.categoryId !== categoryId));
  }

  function updateAllocation(categoryId: string, field: 'categoryId' | 'amount', value: string | number) {
    setAllocations(allocations.map(a => {
      if (a.categoryId === categoryId) {
        if (field === 'categoryId' && typeof value === 'string') {
          const category = categories.find(c => c.id === value);
          return {
            ...a,
            categoryId: value,
            categoryName: category?.name || value,
            color: category?.color,
            icon: category?.icon,
          };
        } else if (field === 'amount') {
          return { ...a, amount: Math.max(0, Number(value) || 0) };
        }
      }
      return a;
    }));
  }

  async function handleSubmit() {
    setLoading(true);
    setError(null);

    try {
      const budgetData = {
        name,
        type,
        period,
        startDate: startDate.toISOString(),
        totalAmount,
        isActive,
        rollover,
        categories: allocations.map(a => ({
          categoryId: a.categoryId,
          amount: a.amount,
        })),
      };

      const response = await fetch('/api/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(budgetData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create budget');
      }

      const result = await response.json();
      router.push(`/budgets/${result.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create budget');
      setLoading(false);
    }
  }

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between mb-4">
          <div>
            <CardTitle className="text-2xl">Create New Budget</CardTitle>
            <CardDescription>Step {step} of {totalSteps}</CardDescription>
          </div>
          <Badge variant="outline">
            {Math.round(progress)}% Complete
          </Badge>
        </div>
        <Progress value={progress} className="w-full" />
      </CardHeader>

      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Step 1: Basic Info */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Budget Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Monthly Budget 2026"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Budget Type *</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {budgetTypes.map((bt) => {
                  const Icon = bt.icon;
                  return (
                    <Card
                      key={bt.value}
                      className={`cursor-pointer transition-all ${
                        type === bt.value
                          ? 'border-primary ring-2 ring-primary'
                          : 'hover:border-primary/50'
                      }`}
                      onClick={() => setType(bt.value as BudgetType)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <Icon className="h-5 w-5 text-primary mt-0.5" />
                          <div>
                            <h4 className="font-semibold">{bt.label}</h4>
                            <p className="text-sm text-muted-foreground">{bt.description}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Budget Period *</Label>
                <Select value={period} onValueChange={(v) => setPeriod(v as BudgetPeriod)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {budgetPeriods.map((bp) => (
                      <SelectItem key={bp.value} value={bp.value}>
                        {bp.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Start Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(startDate, 'PPP')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={(date) => date && setStartDate(date)}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Template Selection */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <Label>Choose a Starting Point</Label>
              <p className="text-sm text-muted-foreground mt-1">
                Select a template to get started quickly, or start from scratch
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Card
                className={`cursor-pointer transition-all ${
                  selectedTemplate === 'suggested'
                    ? 'border-primary ring-2 ring-primary'
                    : 'hover:border-primary/50'
                }`}
                onClick={() => setSelectedTemplate('suggested')}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Sparkles className="h-5 w-5 text-warning mt-0.5" />
                    <div>
                      <h4 className="font-semibold">Suggested (AI)</h4>
                      <p className="text-sm text-muted-foreground">
                        Based on your spending history
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card
                className={`cursor-pointer transition-all ${
                  selectedTemplate === '50-30-20'
                    ? 'border-primary ring-2 ring-primary'
                    : 'hover:border-primary/50'
                }`}
                onClick={() => setSelectedTemplate('50-30-20')}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Target className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <h4 className="font-semibold">50/30/20 Rule</h4>
                      <p className="text-sm text-muted-foreground">
                        Needs, Wants, Savings
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card
                className={`cursor-pointer transition-all ${
                  selectedTemplate === 'previous'
                    ? 'border-primary ring-2 ring-primary'
                    : 'hover:border-primary/50'
                }`}
                onClick={() => setSelectedTemplate('previous')}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <CalendarIcon className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <h4 className="font-semibold">Copy Previous</h4>
                      <p className="text-sm text-muted-foreground">
                        Use your last budget
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card
                className={`cursor-pointer transition-all ${
                  selectedTemplate === 'custom'
                    ? 'border-primary ring-2 ring-primary'
                    : 'hover:border-primary/50'
                }`}
                onClick={() => setSelectedTemplate('custom')}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Plus className="h-5 w-5 text-success mt-0.5" />
                    <div>
                      <h4 className="font-semibold">Start from Scratch</h4>
                      <p className="text-sm text-muted-foreground">
                        Build your own budget
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {loadingTemplate && (
              <Card>
                <CardContent className="pt-6">
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            )}

            {templateData && !loadingTemplate && selectedTemplate !== 'custom' && (
              <Card className="border-primary/50 bg-primary/5">
                <CardHeader>
                  <CardTitle className="text-lg">{templateData.name}</CardTitle>
                  <CardDescription>{templateData.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  {templateData.analysis && (
                    <div className="text-sm space-y-1 mb-4">
                      <p>
                        <strong>Based on:</strong> {templateData.analysis.periodsAnalyzed} months, {templateData.analysis.transactionCount} transactions
                      </p>
                      <p>
                        <strong>Monthly Average:</strong> <span className="font-mono">${templateData.analysis.monthlyAverage.toLocaleString()}</span>
                      </p>
                    </div>
                  )}
                  <p className="text-sm text-muted-foreground">
                    {templateData.categories.length} categories • <span className="font-mono">${templateData.totalAmount?.toLocaleString() || 0}</span> total
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Step 3: Category Allocation */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <Label>Category Allocations</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Set the amount for each category
                </p>
              </div>
              <Button onClick={addCategory} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Category
              </Button>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {allocations.map((allocation) => (
                <Card key={allocation.categoryId}>
                  <CardContent className="p-4">
                    <div className="flex gap-3 items-start">
                      <div className="flex-1 space-y-3">
                        <div className="space-y-2">
                          <Label>Category</Label>
                          <Select
                            value={allocation.categoryId}
                            onValueChange={(v) => updateAllocation(allocation.categoryId, 'categoryId', v)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {categories
                                .filter(c => c.id === allocation.categoryId || !allocations.find(a => a.categoryId === c.id))
                                .map((cat) => (
                                  <SelectItem key={cat.id} value={cat.id}>
                                    {cat.name}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Amount ($)</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={allocation.amount}
                            onChange={(e) => updateAllocation(allocation.categoryId, 'amount', e.target.value)}
                          />
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeCategory(allocation.categoryId)}
                        className="text-error "
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Total Budget:</span>
                  <span className="text-2xl font-bold font-mono text-primary">
                    ${allocations.reduce((sum, a) => sum + (a.amount || 0), 0).toLocaleString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 4: Review and Create */}
        {step === 4 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Review Your Budget</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Name</Label>
                    <p className="font-semibold">{name}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Type</Label>
                    <p className="font-semibold">
                      {budgetTypes.find(bt => bt.value === type)?.label}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Period</Label>
                    <p className="font-semibold">
                      {budgetPeriods.find(bp => bp.value === period)?.label}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Start Date</Label>
                    <p className="font-semibold">{format(startDate, 'PPP')}</p>
                  </div>
                </div>

                <div>
                  <Label className="text-muted-foreground">Categories ({allocations.length})</Label>
                  <div className="mt-2 space-y-2">
                    {allocations.map((allocation) => (
                      <div key={allocation.categoryId} className="flex justify-between items-center p-2 bg-muted rounded">
                        <span>{allocation.categoryName}</span>
                        <span className="font-semibold font-mono">${(allocation.amount || 0).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-lg">Total Budget:</span>
                      <span className="text-3xl font-bold font-mono text-primary">
                        ${totalAmount.toLocaleString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-6 border-t">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={step === 1 || loading}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          {step < totalSteps ? (
            <Button onClick={handleNext} disabled={loading}>
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? 'Creating...' : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Create Budget
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
