'use client';

import { useEffect, useState } from 'react';
import {
  Target,
  Plus,
  TrendingUp,
  Calendar,
  DollarSign,
  Trash2,
  Edit,
  CheckCircle2,
  Circle,
  AlertCircle,
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';

// Types
type GoalType = 'SAVINGS' | 'DEBT_PAYOFF' | 'NET_WORTH' | 'INVESTMENT';

interface Goal {
  id: string;
  name: string;
  type: GoalType;
  targetAmount: number;
  currentAmount: number;
  targetDate: string | null;
  icon: string;
  color: string;
  isCompleted: boolean;
  progress: number;
  createdAt: string;
  updatedAt: string;
}

interface GoalProgress {
  goalId: string;
  goalName: string;
  type: GoalType;
  currentAmount: number;
  targetAmount: number;
  remaining: number;
  progress: number;
  isCompleted: boolean;
  targetDate: string | null;
  daysRemaining: number | null;
  dailyRequiredAmount: number | null;
  weeklyRequiredAmount: number | null;
  monthlyRequiredAmount: number | null;
  projectedCompletionDate: string | null;
  onTrack: boolean | null;
}

const goalTypeLabels: Record<GoalType, string> = {
  SAVINGS: 'Savings Goal',
  DEBT_PAYOFF: 'Debt Payoff',
  NET_WORTH: 'Net Worth',
  INVESTMENT: 'Investment',
};

const goalTypeColors: Record<GoalType, string> = {
  SAVINGS: '#10B981',
  DEBT_PAYOFF: '#EF4444',
  NET_WORTH: '#3B82F6',
  INVESTMENT: '#8B5CF6',
};

export function GoalsClient() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [goalProgress, setGoalProgress] = useState<GoalProgress | null>(null);

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/goals');
      if (!response.ok) throw new Error('Failed to fetch goals');
      const data = await response.json();
      setGoals(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load goals');
    } finally {
      setLoading(false);
    }
  };

  const fetchGoalProgress = async (goalId: string) => {
    try {
      const response = await fetch(`/api/goals/${goalId}/progress`);
      if (!response.ok) throw new Error('Failed to fetch goal progress');
      const data = await response.json();
      setGoalProgress(data);
    } catch (err) {
      console.error('Error fetching goal progress:', err);
    }
  };

  const handleCreateGoal = async (goalData: any) => {
    try {
      const response = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(goalData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create goal');
      }

      await fetchGoals();
      setShowCreateModal(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create goal');
    }
  };

  const handleUpdateGoal = async (goalId: string, updates: any) => {
    try {
      const response = await fetch(`/api/goals/${goalId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update goal');
      }

      await fetchGoals();
      setEditingGoal(null);
      setSelectedGoal(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update goal');
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (!confirm('Are you sure you want to delete this goal?')) return;

    try {
      const response = await fetch(`/api/goals/${goalId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete goal');
      }

      await fetchGoals();
      setSelectedGoal(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete goal');
    }
  };

  const handleAddProgress = async (goalId: string, amount: number) => {
    try {
      const response = await fetch(`/api/goals/${goalId}/progress`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update progress');
      }

      await fetchGoals();
      if (selectedGoal?.id === goalId) {
        await fetchGoalProgress(goalId);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update progress');
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          <p className="font-semibold">Error loading goals</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  const activeGoals = goals.filter((g) => !g.isCompleted);
  const completedGoals = goals.filter((g) => g.isCompleted);

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Financial Goals</h1>
          <p className="text-gray-600 mt-1">
            Track your progress toward your financial objectives
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Goal
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-600 mb-2">
            <Target className="w-4 h-4" />
            <span className="text-sm font-medium">Total Goals</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{goals.length}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-blue-600 mb-2">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm font-medium">Active</span>
          </div>
          <p className="text-2xl font-bold text-blue-600">{activeGoals.length}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-green-600 mb-2">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-sm font-medium">Completed</span>
          </div>
          <p className="text-2xl font-bold text-green-600">
            {completedGoals.length}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-purple-600 mb-2">
            <DollarSign className="w-4 h-4" />
            <span className="text-sm font-medium">Total Target</span>
          </div>
          <p className="text-2xl font-bold text-purple-600">
            ${goals.reduce((sum, g) => sum + Number(g.targetAmount), 0).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Active Goals */}
      {activeGoals.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Active Goals</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeGoals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onSelect={(g) => {
                  setSelectedGoal(g);
                  fetchGoalProgress(g.id);
                }}
                onEdit={setEditingGoal}
                onDelete={handleDeleteGoal}
              />
            ))}
          </div>
        </div>
      )}

      {/* Completed Goals */}
      {completedGoals.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Completed Goals
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {completedGoals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onSelect={(g) => {
                  setSelectedGoal(g);
                  fetchGoalProgress(g.id);
                }}
                onEdit={setEditingGoal}
                onDelete={handleDeleteGoal}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {goals.length === 0 && (
        <div className="text-center py-12">
          <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No goals yet
          </h3>
          <p className="text-gray-600 mb-6">
            Create your first financial goal to start tracking your progress
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create Your First Goal
          </button>
        </div>
      )}

      {/* Create/Edit Modal */}
      {(showCreateModal || editingGoal) && (
        <GoalFormModal
          goal={editingGoal}
          onClose={() => {
            setShowCreateModal(false);
            setEditingGoal(null);
          }}
          onSubmit={(data) => {
            if (editingGoal) {
              handleUpdateGoal(editingGoal.id, data);
            } else {
              handleCreateGoal(data);
            }
          }}
        />
      )}

      {/* Goal Detail Modal */}
      {selectedGoal && (
        <GoalDetailModal
          goal={selectedGoal}
          progress={goalProgress}
          onClose={() => {
            setSelectedGoal(null);
            setGoalProgress(null);
          }}
          onAddProgress={handleAddProgress}
          onEdit={() => {
            setEditingGoal(selectedGoal);
            setSelectedGoal(null);
          }}
        />
      )}
    </div>
  );
}

// Goal Card Component
function GoalCard({
  goal,
  onSelect,
  onEdit,
  onDelete,
}: {
  goal: Goal;
  onSelect: (goal: Goal) => void;
  onEdit: (goal: Goal) => void;
  onDelete: (goalId: string) => void;
}) {
  const progressPercentage = Math.min(goal.progress, 100);
  const remaining = Number(goal.targetAmount) - Number(goal.currentAmount);

  return (
    <div
      className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onSelect(goal)}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {goal.isCompleted ? (
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          ) : (
            <Circle className="w-5 h-5 text-gray-400" />
          )}
          <span
            className="px-2 py-1 text-xs font-medium rounded"
            style={{
              backgroundColor: `${goal.color}20`,
              color: goal.color,
            }}
          >
            {goalTypeLabels[goal.type]}
          </span>
        </div>
        <div className="flex gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(goal);
            }}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <Edit className="w-4 h-4 text-gray-600" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(goal.id);
            }}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <Trash2 className="w-4 h-4 text-red-600" />
          </button>
        </div>
      </div>

      <h3 className="text-lg font-semibold text-gray-900 mb-3">{goal.name}</h3>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
          <span>${Number(goal.currentAmount).toLocaleString()}</span>
          <span>${Number(goal.targetAmount).toLocaleString()}</span>
        </div>
        <Progress
          value={progressPercentage}
          className="h-2"
          aria-label={`${goal.name} progress: ${progressPercentage.toFixed(1)}% complete, $${Number(goal.currentAmount).toLocaleString()} of $${Number(goal.targetAmount).toLocaleString()}`}
        />
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          {progressPercentage.toFixed(1)}% complete
          {!goal.isCompleted && ` · $${remaining.toLocaleString()} remaining`}
        </p>
      </div>

      {/* Target Date */}
      {goal.targetDate && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar className="w-4 h-4" />
          <span>
            Target: {new Date(goal.targetDate).toLocaleDateString()}
          </span>
        </div>
      )}
    </div>
  );
}

// Goal Form Modal Component
function GoalFormModal({
  goal,
  onClose,
  onSubmit,
}: {
  goal: Goal | null;
  onClose: () => void;
  onSubmit: (data: any) => void;
}) {
  const [formData, setFormData] = useState({
    name: goal?.name || '',
    type: goal?.type || ('SAVINGS' as GoalType),
    targetAmount: goal?.targetAmount || 0,
    currentAmount: goal?.currentAmount || 0,
    targetDate: goal?.targetDate
      ? new Date(goal.targetDate).toISOString().split('T')[0]
      : '',
    color: goal?.color || goalTypeColors.SAVINGS,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      targetDate: formData.targetDate || null,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          {goal ? 'Edit Goal' : 'Create New Goal'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Goal Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Emergency Fund"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Goal Type
            </label>
            <select
              value={formData.type}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  type: e.target.value as GoalType,
                  color: goalTypeColors[e.target.value as GoalType],
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Object.entries(goalTypeLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Target Amount
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={formData.targetAmount}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  targetAmount: parseFloat(e.target.value) || 0,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current Amount
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.currentAmount}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  currentAmount: parseFloat(e.target.value) || 0,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Target Date (Optional)
            </label>
            <input
              type="date"
              value={formData.targetDate}
              onChange={(e) =>
                setFormData({ ...formData, targetDate: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {goal ? 'Update Goal' : 'Create Goal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Goal Detail Modal Component
function GoalDetailModal({
  goal,
  progress,
  onClose,
  onAddProgress,
  onEdit,
}: {
  goal: Goal;
  progress: GoalProgress | null;
  onClose: () => void;
  onAddProgress: (goalId: string, amount: number) => void;
  onEdit: () => void;
}) {
  const [addAmount, setAddAmount] = useState('');

  const handleAddProgress = () => {
    const amount = parseFloat(addAmount);
    if (!isNaN(amount) && amount !== 0) {
      onAddProgress(goal.id, amount);
      setAddAmount('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{goal.name}</h2>
            <span
              className="inline-block mt-2 px-2 py-1 text-xs font-medium rounded"
              style={{
                backgroundColor: `${goal.color}20`,
                color: goal.color,
              }}
            >
              {goalTypeLabels[goal.type]}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        {/* Progress Overview */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-600">Current Amount</p>
              <p className="text-2xl font-bold text-gray-900">
                ${Number(goal.currentAmount).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Target Amount</p>
              <p className="text-2xl font-bold text-gray-900">
                ${Number(goal.targetAmount).toLocaleString()}
              </p>
            </div>
          </div>
          <Progress
            value={Math.min(goal.progress, 100)}
            className="h-3 mb-2"
            aria-label={`${goal.name} progress: ${goal.progress.toFixed(1)}% complete, $${Number(goal.currentAmount).toLocaleString()} of $${Number(goal.targetAmount).toLocaleString()}, $${(Number(goal.targetAmount) - Number(goal.currentAmount)).toLocaleString()} remaining`}
          />
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {goal.progress.toFixed(1)}% complete
            {!goal.isCompleted &&
              ` · $${(Number(goal.targetAmount) - Number(goal.currentAmount)).toLocaleString()} remaining`}
          </p>
        </div>

        {/* Detailed Progress Info */}
        {progress && (
          <div className="space-y-4 mb-6">
            {progress.targetDate && (
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-gray-600 mb-1">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm font-medium">Target Date</span>
                  </div>
                  <p className="text-lg font-semibold text-gray-900">
                    {new Date(progress.targetDate).toLocaleDateString()}
                  </p>
                  {progress.daysRemaining !== null && (
                    <p className="text-sm text-gray-600 mt-1">
                      {progress.daysRemaining > 0
                        ? `${progress.daysRemaining} days remaining`
                        : 'Overdue'}
                    </p>
                  )}
                </div>

                {progress.onTrack !== null && (
                  <div className="bg-white border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-gray-600 mb-1">
                      <TrendingUp className="w-4 h-4" />
                      <span className="text-sm font-medium">Status</span>
                    </div>
                    <p
                      className={`text-lg font-semibold ${
                        progress.onTrack ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {progress.onTrack ? 'On Track' : 'Behind Schedule'}
                    </p>
                  </div>
                )}
              </div>
            )}

            {progress.dailyRequiredAmount !== null && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm font-medium text-blue-900 mb-2">
                  Required Contribution Rates
                </p>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <p className="text-xs text-blue-700">Daily</p>
                    <p className="text-lg font-semibold text-blue-900">
                      ${progress.dailyRequiredAmount.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-blue-700">Weekly</p>
                    <p className="text-lg font-semibold text-blue-900">
                      ${progress.weeklyRequiredAmount?.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-blue-700">Monthly</p>
                    <p className="text-lg font-semibold text-blue-900">
                      ${progress.monthlyRequiredAmount?.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {progress.projectedCompletionDate && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <p className="text-sm font-medium text-purple-900 mb-1">
                  Projected Completion
                </p>
                <p className="text-lg font-semibold text-purple-900">
                  {new Date(progress.projectedCompletionDate).toLocaleDateString()}
                </p>
                <p className="text-xs text-purple-700 mt-1">
                  Based on your current progress rate
                </p>
              </div>
            )}
          </div>
        )}

        {/* Add Progress */}
        {!goal.isCompleted && (
          <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
            <p className="text-sm font-medium text-gray-700 mb-2">
              Update Progress
            </p>
            <div className="flex gap-2">
              <input
                type="number"
                step="0.01"
                value={addAmount}
                onChange={(e) => setAddAmount(e.target.value)}
                placeholder="Enter amount"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleAddProgress}
                disabled={!addAmount || parseFloat(addAmount) === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Add
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Enter positive amount to add, negative to subtract
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={onEdit}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Edit Goal
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
