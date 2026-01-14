'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Info,
  Lightbulb,
  DollarSign,
  Calendar,
  Repeat
} from 'lucide-react';

interface Insight {
  type: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  data?: any;
}

interface Anomaly {
  type: string;
  severity: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  amount?: number;
  category?: string;
  merchant?: string;
  data?: any;
}

interface SavingsOpportunity {
  type: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  potentialSavings: number;
  data?: any;
}

interface Subscription {
  merchant: string;
  category: string;
  amount: number;
  frequency: string;
  isActive: boolean;
  lastCharge: string;
  nextExpectedCharge: string | null;
  monthlyEquivalent: number;
}

interface WeeklyDigest {
  period: {
    start: string;
    end: string;
    label: string;
  };
  summary: {
    income: number;
    expenses: number;
    netCashFlow: number;
    transactionCount: number;
    avgTransactionSize: number;
  };
  comparison: {
    incomeChange: number;
    expenseChange: number;
  };
  topCategories: Array<{
    category: string;
    amount: number;
    percentage: number;
  }>;
  insights: Array<{
    type: 'warning' | 'positive' | 'info';
    message: string;
  }>;
}

export function InsightsClient() {
  const [patterns, setPatterns] = useState<any>(null);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [savings, setSavings] = useState<SavingsOpportunity[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [weeklyDigest, setWeeklyDigest] = useState<WeeklyDigest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchInsights() {
      try {
        setLoading(true);
        setError(null);

        // Fetch all insights in parallel
        const [patternsRes, anomaliesRes, savingsRes, subscriptionsRes, digestRes] = await Promise.all([
          fetch('/api/insights/spending-patterns'),
          fetch('/api/insights/anomalies'),
          fetch('/api/insights/savings-opportunities'),
          fetch('/api/insights/subscriptions'),
          fetch('/api/insights/weekly-digest'),
        ]);

        if (!patternsRes.ok || !anomaliesRes.ok || !savingsRes.ok || !subscriptionsRes.ok || !digestRes.ok) {
          throw new Error('Failed to fetch insights data');
        }

        const [patternsData, anomaliesData, savingsData, subscriptionsData, digestData] = await Promise.all([
          patternsRes.json(),
          anomaliesRes.json(),
          savingsRes.json(),
          subscriptionsRes.json(),
          digestRes.json(),
        ]);

        setPatterns(patternsData);
        setAnomalies(anomaliesData.anomalies || []);
        setSavings(savingsData.opportunities || []);
        setSubscriptions(subscriptionsData.subscriptions || []);
        setWeeklyDigest(digestData);
      } catch (err) {
        console.error('Error fetching insights:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchInsights();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Financial Insights</h2>
        </div>
        <div className="grid gap-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-[200px]" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Financial Insights</h2>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-800">
            Error loading insights: {error}
          </p>
        </div>
      </div>
    );
  }

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high': return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'medium': return <Info className="h-5 w-5 text-yellow-500" />;
      case 'low': return <CheckCircle2 className="h-5 w-5 text-blue-500" />;
      default: return <Info className="h-5 w-5" />;
    }
  };

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Financial Insights</h2>
        <Badge variant="outline">AI-Powered Analysis</Badge>
      </div>

      {/* Weekly Digest */}
      {weeklyDigest && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              <CardTitle>Weekly Digest</CardTitle>
            </div>
            <CardDescription>{weeklyDigest.period.label}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Income</p>
                <p className="text-2xl font-bold text-green-600">
                  ${weeklyDigest.summary.income.toLocaleString()}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Expenses</p>
                <p className="text-2xl font-bold text-red-600">
                  ${weeklyDigest.summary.expenses.toLocaleString()}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Net Cash Flow</p>
                <p className={`text-2xl font-bold ${weeklyDigest.summary.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${weeklyDigest.summary.netCashFlow.toLocaleString()}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Transactions</p>
                <p className="text-2xl font-bold">{weeklyDigest.summary.transactionCount}</p>
              </div>
            </div>

            {weeklyDigest.insights.length > 0 && (
              <div className="space-y-2 pt-4 border-t">
                {weeklyDigest.insights.map((insight, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    {insight.type === 'positive' && <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />}
                    {insight.type === 'warning' && <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />}
                    {insight.type === 'info' && <Info className="h-5 w-5 text-blue-500 mt-0.5" />}
                    <p className="text-sm">{insight.message}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Spending Patterns */}
      {patterns && patterns.insights && patterns.insights.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              <CardTitle>Spending Patterns</CardTitle>
            </div>
            <CardDescription>Insights from your transaction history</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {patterns.insights.map((insight: Insight, idx: number) => (
                <div key={idx} className="flex items-start justify-between gap-4 p-3 rounded-lg bg-muted/50">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{insight.title}</p>
                      <Badge variant={getImpactColor(insight.impact) as any} className="text-xs">
                        {insight.impact} impact
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{insight.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Savings Opportunities */}
      {savings.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-600" />
              <CardTitle>Savings Opportunities</CardTitle>
            </div>
            <CardDescription>
              Potential monthly savings: ${savings.reduce((sum, s) => sum + s.potentialSavings, 0).toFixed(2)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {savings.map((opportunity, idx) => (
                <div key={idx} className="flex items-start justify-between gap-4 p-3 rounded-lg bg-muted/50">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{opportunity.title}</p>
                      <Badge variant={getImpactColor(opportunity.impact) as any} className="text-xs">
                        {opportunity.impact} impact
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{opportunity.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Potential Savings</p>
                    <p className="text-lg font-bold text-green-600">
                      ${opportunity.potentialSavings.toFixed(2)}/mo
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Anomalies */}
      {anomalies.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <CardTitle>Unusual Activity Detected</CardTitle>
            </div>
            <CardDescription>Transactions that differ from your usual patterns</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {anomalies.slice(0, 5).map((anomaly, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  {getSeverityIcon(anomaly.severity)}
                  <div className="flex-1 space-y-1">
                    <p className="font-medium">{anomaly.title}</p>
                    <p className="text-sm text-muted-foreground">{anomaly.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Subscriptions */}
      {subscriptions.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Repeat className="h-5 w-5 text-indigo-600" />
              <CardTitle>Subscription Audit</CardTitle>
            </div>
            <CardDescription>
              {subscriptions.filter(s => s.isActive).length} active subscriptions
              (${subscriptions.filter(s => s.isActive).reduce((sum, s) => sum + s.monthlyEquivalent, 0).toFixed(2)}/month)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {subscriptions.slice(0, 10).map((sub, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{sub.merchant}</p>
                      <Badge variant={sub.isActive ? 'default' : 'secondary'} className="text-xs">
                        {sub.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {sub.frequency}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{sub.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">${sub.amount.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">
                      ${sub.monthlyEquivalent.toFixed(2)}/mo
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {patterns?.insights?.length === 0 && savings.length === 0 && anomalies.length === 0 && subscriptions.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Lightbulb className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No insights yet</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              Add more transactions to see personalized financial insights and recommendations.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
