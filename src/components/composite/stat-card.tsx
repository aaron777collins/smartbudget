import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ELEVATION } from '@/lib/design-tokens'
import { cn } from '@/lib/utils'
import { LucideIcon, TrendingUp, TrendingDown, Minus, Info } from 'lucide-react'

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
  sparkline?: Array<{ label: string; value: number }>
  hoverDetails?: {
    title?: string
    items: Array<{ label: string; value: string | number }>
  }
  formatValue?: (value: string | number) => string
  elevation?: 'low' | 'medium' | 'high'
  className?: string
  delay?: number
  onClick?: () => void
}

/**
 * Sparkline - Mini line chart for visualizing trends
 */
function Sparkline({ data }: { data: Array<{ label: string; value: number }> }) {
  if (data.length === 0) return null

  const values = data.map(d => d.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min

  const width = 100
  const height = 32
  const padding = 2

  const points = values.map((value, index) => {
    const x = (index / (values.length - 1)) * (width - 2 * padding) + padding
    const y = range === 0
      ? height / 2
      : height - padding - ((value - min) / range) * (height - 2 * padding)
    return `${x},${y}`
  }).join(' ')

  return (
    <svg
      width="100%"
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="text-primary/50"
      aria-hidden="true"
    >
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        points={points}
      />
    </svg>
  )
}

/**
 * StatCard - A reusable composite component for displaying key metrics
 *
 * Features:
 * - Flexible metric display with icon, value, and description
 * - Optional trend indicators with automatic direction icons
 * - Badge support for status/category indicators
 * - Sparklines for visualizing trends over time
 * - Hover details popover for additional information
 * - Custom value formatting function
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
 *   sparkline={[
 *     { label: 'Jan', value: 1000 },
 *     { label: 'Feb', value: 1500 },
 *     { label: 'Mar', value: 1200 },
 *   ]}
 *   hoverDetails={{
 *     title: 'Revenue Breakdown',
 *     items: [
 *       { label: 'This month', value: '$45,231.89' },
 *       { label: 'Last month', value: '$37,692.41' },
 *       { label: 'Average', value: '$41,462.15' },
 *     ]
 *   }}
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
  sparkline,
  hoverDetails,
  formatValue,
  elevation = 'low',
  className,
  delay = 0,
  onClick,
}: StatCardProps) {
  const isInteractive = !!onClick
  const hasHoverDetails = !!hoverDetails

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

  // Format value if formatter provided
  const displayValue = formatValue ? formatValue(value) : value

  const cardContent = (
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
        <div className="flex items-center gap-1">
          {hasHoverDetails && (
            <Info
              className="h-3.5 w-3.5 text-muted-foreground"
              aria-label="Additional details available on hover"
            />
          )}
          {Icon && (
            <Icon
              className="h-4 w-4 text-muted-foreground"
              aria-hidden="true"
            />
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-baseline justify-between gap-2">
            <div className="text-2xl font-bold tabular-nums">
              {displayValue}
            </div>
            {badge && (
              <Badge variant={badge.variant || 'default'}>
                {badge.label}
              </Badge>
            )}
          </div>

          {sparkline && sparkline.length > 0 && (
            <div className="mt-2 mb-1">
              <Sparkline data={sparkline} />
            </div>
          )}

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

  // Wrap with popover if hover details are provided
  if (hasHoverDetails) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          {cardContent}
        </PopoverTrigger>
        <PopoverContent className="w-64" align="start">
          <div className="space-y-3">
            {hoverDetails.title && (
              <h4 className="font-medium text-sm">{hoverDetails.title}</h4>
            )}
            <div className="space-y-2">
              {hoverDetails.items.map((item, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="font-medium tabular-nums">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    )
  }

  return cardContent
}
