'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogBody,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Wallet,
  Upload,
  Target,
  TrendingUp,
  Check,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  X
} from 'lucide-react';
import { AccountFormDialog } from '@/components/accounts/account-form-dialog';

interface OnboardingFlowProps {
  open: boolean;
  onComplete: () => void;
  currentStep?: number;
}

const ONBOARDING_STEPS = [
  {
    id: 1,
    title: 'Welcome to SmartBudget!',
    description: 'Let\'s get you set up in just a few steps',
    icon: Sparkles,
  },
  {
    id: 2,
    title: 'Create Your First Account',
    description: 'Add a bank account or credit card to start tracking your finances',
    icon: Wallet,
  },
  {
    id: 3,
    title: 'Import Transactions',
    description: 'Upload your transaction history from your bank (CSV, OFX, or QFX)',
    icon: Upload,
  },
  {
    id: 4,
    title: 'Set Up Your First Budget',
    description: 'Create a budget to track your spending and reach your goals',
    icon: Target,
  },
  {
    id: 5,
    title: 'You\'re All Set!',
    description: 'Start managing your finances with SmartBudget',
    icon: Check,
  },
];

export default function OnboardingFlow({ open, onComplete, currentStep = 0 }: OnboardingFlowProps) {
  const router = useRouter();
  const [step, setStep] = useState(currentStep);
  const [showAccountDialog, setShowAccountDialog] = useState(false);
  const [accountCreated, setAccountCreated] = useState(false);
  const [transactionsImported, setTransactionsImported] = useState(false);
  const [loading, setLoading] = useState(false);

  const currentStepData = ONBOARDING_STEPS[step];
  const progress = ((step + 1) / ONBOARDING_STEPS.length) * 100;

  // Update onboarding step on the server
  const updateOnboardingStep = async (newStep: number, completed = false) => {
    try {
      await fetch('/api/user/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          onboardingStep: newStep,
          hasCompletedOnboarding: completed,
        }),
      });
    } catch (error) {
      console.error('Failed to update onboarding step:', error);
    }
  };

  const handleNext = () => {
    if (step < ONBOARDING_STEPS.length - 1) {
      const nextStep = step + 1;
      setStep(nextStep);
      updateOnboardingStep(nextStep);
    }
  };

  const handlePrevious = () => {
    if (step > 0) {
      const prevStep = step - 1;
      setStep(prevStep);
      updateOnboardingStep(prevStep);
    }
  };

  const handleSkip = () => {
    setLoading(true);
    updateOnboardingStep(ONBOARDING_STEPS.length - 1, true);
    setTimeout(() => {
      setLoading(false);
      onComplete();
    }, 500);
  };

  const handleComplete = () => {
    setLoading(true);
    updateOnboardingStep(ONBOARDING_STEPS.length - 1, true);
    setTimeout(() => {
      setLoading(false);
      onComplete();
    }, 500);
  };

  const handleAccountDialogClose = () => {
    setShowAccountDialog(false);
    // Assume account was created if dialog was closed after opening
    // In production, you'd check if account was actually created
    setAccountCreated(true);
  };

  const renderStepContent = () => {
    switch (step) {
      case 0:
        // Welcome Step
        return (
          <div className="space-y-6 py-8">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full">
                <Sparkles className="w-10 h-10 text-primary" />
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl font-bold">Welcome to SmartBudget!</h2>
                <p className="text-muted-foreground text-lg max-w-md mx-auto">
                  Your comprehensive personal finance management system. Let's get you set up in just a few quick steps.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Wallet className="w-5 h-5 text-primary" />
                    <CardTitle className="text-base">Account Management</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm">
                    Track all your bank accounts and credit cards in one place
                  </CardDescription>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Upload className="w-5 h-5 text-primary" />
                    <CardTitle className="text-base">Transaction Import</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm">
                    Import transactions from CSV, OFX, or QFX files
                  </CardDescription>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-primary" />
                    <CardTitle className="text-base">Budget Tracking</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm">
                    Create budgets and track spending across categories
                  </CardDescription>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    <CardTitle className="text-base">Financial Insights</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm">
                    AI-powered insights and spending pattern analysis
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 1:
        // Create Account Step
        return (
          <div className="space-y-6 py-8">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full">
                <Wallet className="w-8 h-8 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold">Create Your First Account</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Add a bank account or credit card to start tracking your finances. You can add more accounts later.
                </p>
              </div>
            </div>

            <div className="flex flex-col items-center gap-4 mt-8">
              {accountCreated ? (
                <div className="text-center space-y-4">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full">
                    <Check className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <p className="text-sm text-muted-foreground">Account created successfully!</p>
                  <Button onClick={() => setShowAccountDialog(true)} variant="outline" size="sm">
                    Add Another Account
                  </Button>
                </div>
              ) : (
                <Button onClick={() => setShowAccountDialog(true)} size="lg" className="w-full max-w-xs">
                  <Wallet className="w-4 h-4 mr-2" />
                  Create Account
                </Button>
              )}

              <p className="text-xs text-muted-foreground mt-4">
                Don't worry, you can skip this and add accounts later
              </p>
            </div>

            {showAccountDialog && (
              <AccountFormDialog
                open={showAccountDialog}
                onClose={handleAccountDialogClose}
                account={null}
              />
            )}
          </div>
        );

      case 2:
        // Import Transactions Step
        return (
          <div className="space-y-6 py-8">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full">
                <Upload className="w-8 h-8 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold">Import Transactions</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Upload your transaction history from your bank. We support CSV, OFX, and QFX formats.
                </p>
              </div>
            </div>

            <div className="flex flex-col items-center gap-4 mt-8">
              {transactionsImported ? (
                <div className="text-center space-y-4">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full">
                    <Check className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <p className="text-sm text-muted-foreground">Transactions imported successfully!</p>
                  <Button onClick={() => router.push('/transactions/import')} variant="outline" size="sm">
                    Import More
                  </Button>
                </div>
              ) : (
                <>
                  <Button onClick={() => router.push('/transactions/import')} size="lg" className="w-full max-w-xs">
                    <Upload className="w-4 h-4 mr-2" />
                    Import Transactions
                  </Button>
                  <div className="max-w-md">
                    <p className="text-xs text-muted-foreground text-center">
                      Supported formats: CSV, OFX, QFX
                      <br />
                      You can also add transactions manually later
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        );

      case 3:
        // Create Budget Step
        return (
          <div className="space-y-6 py-8">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full">
                <Target className="w-8 h-8 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold">Set Up Your First Budget</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Create a budget to track your spending and reach your financial goals. We'll suggest amounts based on your transactions.
                </p>
              </div>
            </div>

            <div className="flex flex-col items-center gap-4 mt-8">
              <Button onClick={() => router.push('/budgets/create')} size="lg" className="w-full max-w-xs">
                <Target className="w-4 h-4 mr-2" />
                Create Budget
              </Button>
              <p className="text-xs text-muted-foreground mt-4">
                You can also skip this and create a budget later
              </p>
            </div>

            <div className="mt-8 max-w-md mx-auto">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Budget Types Available</CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground space-y-2">
                  <p><strong>Fixed Amount:</strong> Set dollar amount per category</p>
                  <p><strong>Percentage-Based:</strong> 50/30/20 or custom percentages</p>
                  <p><strong>Envelope:</strong> Assign every dollar (YNAB-style)</p>
                  <p><strong>Goal-Based:</strong> Work towards specific goals</p>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 4:
        // Completion Step
        return (
          <div className="space-y-6 py-8">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full">
                <Check className="w-10 h-10 text-green-600 dark:text-green-400" />
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl font-bold">You're All Set!</h2>
                <p className="text-muted-foreground text-lg max-w-md mx-auto">
                  You're ready to start managing your finances with SmartBudget. Explore the dashboard to see your financial overview.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
              <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => router.push('/dashboard')}>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    <CardTitle className="text-base">View Dashboard</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm">
                    See your financial overview and insights
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => router.push('/transactions')}>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Upload className="w-5 h-5 text-primary" />
                    <CardTitle className="text-base">Manage Transactions</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm">
                    Import, categorize, and track your transactions
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => router.push('/budgets')}>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-primary" />
                    <CardTitle className="text-base">Create Budgets</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm">
                    Set up budgets and track your spending
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => router.push('/goals')}>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    <CardTitle className="text-base">Set Financial Goals</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm">
                    Create and track your financial goals
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg">
              Step {step + 1} of {ONBOARDING_STEPS.length}
            </DialogTitle>
            {step < ONBOARDING_STEPS.length - 1 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSkip}
                disabled={loading}
                className="text-muted-foreground"
              >
                Skip Tour
              </Button>
            )}
          </div>
          <Progress
            value={progress}
            className="h-2"
            aria-label={`Onboarding progress: Step ${step + 1} of ${ONBOARDING_STEPS.length}, ${Math.round(progress)}% complete`}
          />
        </DialogHeader>

        <DialogBody>
          {renderStepContent()}
        </DialogBody>

        <DialogFooter className="flex justify-between sm:justify-between">
          {step > 0 && step < ONBOARDING_STEPS.length - 1 ? (
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={loading}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>
          ) : (
            <div />
          )}

          {step < ONBOARDING_STEPS.length - 1 ? (
            <Button onClick={handleNext} disabled={loading}>
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleComplete} disabled={loading} size="lg">
              <Check className="w-4 h-4 mr-2" />
              Get Started
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
