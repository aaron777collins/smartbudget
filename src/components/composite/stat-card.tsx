import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ELEVATION } from '@/lib/design-tokens'
import { cn } from '@/lib/utils'
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react'

export interface StatCardProps {
  title: string
  value: string | number
  description?: string
  icon?: LucideIcon
  trend?: {
    value: number
    label: string
    direction?: 'up' | 'down' | 'neutral'
  }
  badge?: {
    label: string
    variant?: 'default' | 'secondary' | 'destructive' | 'outline'
  }
  elevation?: 'low' | 'medium' | 'high'
  className?: string
  delay?: number
  onClick?: () => void
}

/**
 * StatCard - A reusable composite component for displaying key metrics
 *
 * Features:
 * - Flexible metric display with icon, value, and description
 * - Optional trend indicators with automatic direction icons
 * - Badge support for status/category indicators
 * - Configurable elevation for visual hierarchy
 * - Fade-in animation with configurable delay
 * - Click handler for interactive cards
 * - Fully accessible with proper ARIA labels
 *
 * @example
 * ```tsx
 * <StatCard
 *   title="Total Revenue"
 *   value="$45,231.89"
 *   description="All accounts"
 *   icon={DollarSign}
 *   trend={{ value: 20.1, label: 'from last month', direction: 'up' }}
 *   elevation="high"
 * />
 * ```
 */
export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  badge,
  elevation = 'low',
  className,
  delay = 0,
  onClick,
}: StatCardProps) {
  const isInteractive = !!onClick

  // Determine trend direction icon
  const TrendIcon = trend?.direction === 'up'
    ? TrendingUp
    : trend?.direction === 'down'
    ? TrendingDown
    : Minus

  // Determine trend color based on direction
  const trendColorClass = trend?.direction === 'up'
    ? 'text-green-600 dark:text-green-400'
    : trend?.direction === 'down'
    ? 'text-red-600 dark:text-red-400'
    : 'text-muted-foreground'

  return (
    <Card
      className={cn(
        ELEVATION[elevation],
        'transition-all duration-200 animate-in fade-in',
        isInteractive && 'cursor-pointer hover:shadow-lg hover:scale-[1.02]',
        className
      )}
      style={{ animationDelay: `${delay}ms` }}
      onClick={onClick}
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onKeyDown={isInteractive ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick?.()
        }
      } : undefined}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {title}
        </CardTitle>
        {Icon && (
          <Icon
            className="h-4 w-4 text-muted-foreground"
            aria-hidden="true"
          />
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          <div className="flex items-baseline justify-between gap-2">
            <div className="text-2xl font-bold tabular-nums">
              {value}
            </div>
            {badge && (
              <Badge variant={badge.variant || 'default'}>
                {badge.label}
              </Badge>
            )}
          </div>

          {description && (
            <CardDescription className="text-xs">
              {description}
            </CardDescription>
          )}

          {trend && (
            <div
              className={cn(
                'flex items-center gap-1 text-xs font-medium',
                trendColorClass
              )}
              aria-label={`${trend.direction === 'up' ? 'Increased' : trend.direction === 'down' ? 'Decreased' : 'No change'} by ${Math.abs(trend.value)}%`}
            >
              <TrendIcon className="h-3 w-3" aria-hidden="true" />
              <span className="tabular-nums">
                {trend.value > 0 && '+'}
                {trend.value}%
              </span>
              {trend.label && (
                <span className="text-muted-foreground ml-1">
                  {trend.label}
                </span>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
