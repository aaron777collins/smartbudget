'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Info,
  ArrowLeft,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FadeIn } from '@/components/ui/animated';

interface HistoricalPerformance {
  month: string;
  date: string;
  budgetId: string;
  budgetName: string;
  budgeted: number;
  spent: number;
  remaining: number;
  variance: number;
  percentUsed: number;
  underBudget: boolean;
  status: 'good' | 'near' | 'over';
}

interface CategoryTrend {
  categoryInfo: {
    id: string;
    name: string;
    slug: string;
    color: string;
    icon: string;
  };
  data: Array<{
    month: string;
    date: string;
    spent: number;
    budgeted: number;
    percentUsed: number;
  }>;
}

interface Insight {
  type: 'success' | 'warning' | 'info';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
}

interface AnalyticsData {
  budgets: Array<{
    id: string;
    name: string;
    type: string;
    period: string;
    startDate: string;
    totalAmount: number;
  }>;
  historicalPerformance: HistoricalPerformance[];
  categoryTrends: CategoryTrend[];
  insights: Insight[];
}

export default function BudgetAnalyticsClient() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [months, setMonths] = useState(6);

  const fetchAnalytics = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      setError(null);

      const response = await fetch(`/api/budgets/analytics?months=${months}`);
      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }

      const analyticsData: AnalyticsData = await response.json();
      setData(analyticsData);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [months]);

  const handleRefresh = () => {
    fetchAnalytics(false);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Budget Analytics</h1>
            <p className="text-muted-foreground">Historical performance and spending trends</p>
          </div>
        </div>
        <div className="text-center py-12">Loading analytics...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Budget Analytics</h1>
            <p className="text-muted-foreground">Historical performance and spending trends</p>
          </div>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error || 'Failed to load analytics'}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const { historicalPerformance, categoryTrends, insights } = data;

  // Calculate summary statistics
  const totalMonths = historicalPerformance.length;
  const underBudgetMonths = historicalPerformance.filter(p => p.underBudget).length;
  const avgUtilization = totalMonths > 0
    ? historicalPerformance.reduce((sum, p) => sum + p.percentUsed, 0) / totalMonths
    : 0;
  const totalSaved = historicalPerformance
    .filter(p => p.underBudget)
    .reduce((sum, p) => sum + Math.abs(p.variance), 0);
  const totalOverspent = historicalPerformance
    .filter(p => !p.underBudget)
    .reduce((sum, p) => sum + p.variance, 0);

  // Prepare data for charts
  const performanceChartData = historicalPerformance.map(p => ({
    month: p.month,
    Budgeted: p.budgeted,
    Spent: p.spent,
    Remaining: Math.max(0, p.remaining),
  }));

  const utilizationChartData = historicalPerformance.map(p => ({
    month: p.month,
    'Budget Used (%)': p.percentUsed,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/budgets">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Budget Analytics</h1>
            <p className="text-muted-foreground">Historical performance and spending trends</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={months}
            onChange={(e) => setMonths(parseInt(e.target.value, 10))}
            className="border rounded-md px-3 py-2 text-sm"
          >
            <option value={3}>Last 3 months</option>
            <option value={6}>Last 6 months</option>
            <option value={12}>Last 12 months</option>
          </select>
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Months Analyzed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMonths}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {underBudgetMonths} under budget
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg. Budget Used
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgUtilization.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {avgUtilization < 100 ? 'Under budget avg.' : 'Over budget avg.'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Saved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              ${totalSaved.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Across {underBudgetMonths} months
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Overspent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-error">
              ${totalOverspent.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Across {totalMonths - underBudgetMonths} months
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Insights */}
      {insights.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Insights & Recommendations</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {insights.map((insight, index) => (
              <Alert
                key={index}
                variant={insight.type === 'warning' ? 'destructive' : 'default'}
              >
                {insight.type === 'success' && <CheckCircle className="h-4 w-4" />}
                {insight.type === 'warning' && <AlertCircle className="h-4 w-4" />}
                {insight.type === 'info' && <Info className="h-4 w-4" />}
                <AlertTitle className="flex items-center gap-2">
                  {insight.title}
                  <Badge variant={insight.priority === 'high' ? 'destructive' : 'secondary'}>
                    {insight.priority}
                  </Badge>
                </AlertTitle>
                <AlertDescription>{insight.description}</AlertDescription>
              </Alert>
            ))}
          </div>
        </div>
      )}

      {/* Charts */}
      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="performance">Budget Performance</TabsTrigger>
          <TabsTrigger value="utilization">Budget Utilization</TabsTrigger>
          <TabsTrigger value="categories">Category Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Budget vs. Actual Spending</CardTitle>
              <CardDescription>
                Compare your budgeted amounts to actual spending over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FadeIn duration={0.5} delay={0.1}>
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={performanceChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip
                      formatter={(value: number | undefined) => value ? `$${value.toFixed(2)}` : '$0.00'}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="Budgeted"
                      stackId="1"
                      stroke="#8884d8"
                      fill="#8884d8"
                      fillOpacity={0.6}
                      animationBegin={0}
                      animationDuration={800}
                      animationEasing="ease-out"
                    />
                    <Area
                      type="monotone"
                      dataKey="Spent"
                      stackId="2"
                      stroke="#ef4444"
                      fill="#ef4444"
                      fillOpacity={0.6}
                      animationBegin={100}
                      animationDuration={800}
                      animationEasing="ease-out"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </FadeIn>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Monthly Budget Status</CardTitle>
              <CardDescription>
                Track how often you stayed under or over budget
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {historicalPerformance.map((perf, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-20 text-sm font-medium">{perf.month}</div>
                      <Badge
                        variant={
                          perf.status === 'good'
                            ? 'default'
                            : perf.status === 'near'
                            ? 'secondary'
                            : 'destructive'
                        }
                      >
                        {perf.status === 'good'
                          ? 'Under Budget'
                          : perf.status === 'near'
                          ? 'Near Limit'
                          : 'Over Budget'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-muted-foreground">
                        ${perf.spent.toFixed(2)} / ${perf.budgeted.toFixed(2)}
                      </span>
                      <div
                        className={`flex items-center gap-1 font-medium ${
                          perf.underBudget ? 'text-success' : 'text-error'
                        }`}
                      >
                        {perf.underBudget ? (
                          <TrendingDown className="h-4 w-4" />
                        ) : (
                          <TrendingUp className="h-4 w-4" />
                        )}
                        {Math.abs(perf.variance).toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="utilization" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Budget Utilization Rate</CardTitle>
              <CardDescription>
                Percentage of budget used each month
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FadeIn duration={0.5} delay={0.1}>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={utilizationChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip
                      formatter={(value: number | undefined) => value ? `${value.toFixed(1)}%` : '0.0%'}
                    />
                    <Legend />
                    <Bar
                      dataKey="Budget Used (%)"
                      fill="#8884d8"
                      animationBegin={0}
                      animationDuration={800}
                      animationEasing="ease-out"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </FadeIn>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          {categoryTrends.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No category data available for the selected period
              </CardContent>
            </Card>
          ) : (
            categoryTrends.slice(0, 5).map((trend) => (
              <Card key={trend.categoryInfo.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: trend.categoryInfo.color }}
                    />
                    {trend.categoryInfo.name}
                  </CardTitle>
                  <CardDescription>
                    Spending trend over the last {months} months
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FadeIn duration={0.5} delay={0.1}>
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={trend.data}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip
                          formatter={(value: number | undefined) => value ? `$${value.toFixed(2)}` : '$0.00'}
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="budgeted"
                          stroke={trend.categoryInfo.color}
                          strokeDasharray="5 5"
                          name="Budgeted"
                          animationBegin={0}
                          animationDuration={800}
                          animationEasing="ease-out"
                        />
                        <Line
                          type="monotone"
                          dataKey="spent"
                          stroke={trend.categoryInfo.color}
                          strokeWidth={2}
                          name="Spent"
                          animationBegin={100}
                          animationDuration={800}
                          animationEasing="ease-out"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </FadeIn>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
