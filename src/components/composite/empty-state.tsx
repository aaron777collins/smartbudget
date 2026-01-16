import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { LucideIcon, Inbox } from 'lucide-react'

export interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
    variant?: 'default' | 'secondary' | 'outline' | 'ghost'
  }
  secondaryAction?: {
    label: string
    onClick: () => void
    variant?: 'default' | 'secondary' | 'outline' | 'ghost'
  }
  className?: string
  iconClassName?: string
  compact?: boolean
  variant?: 'default' | 'card'
}

/**
 * EmptyState - A reusable composite component for displaying empty states
 *
 * Features:
 * - Customizable icon, title, and description
 * - Primary and secondary call-to-action buttons
 * - Multiple variants (inline or card-based)
 * - Compact mode for smaller spaces
 * - Fully accessible with proper ARIA labels
 * - Consistent styling across the application
 *
 * @example
 * ```tsx
 * <EmptyState
 *   icon={Inbox}
 *   title="No transactions yet"
 *   description="Get started by importing your first transaction or creating one manually."
 *   action={{
 *     label: "Import Transactions",
 *     onClick: () => handleImport(),
 *   }}
 *   secondaryAction={{
 *     label: "Create Manually",
 *     onClick: () => handleCreate(),
 *     variant: "outline"
 *   }}
 * />
 * ```
 */
export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  secondaryAction,
  className,
  iconClassName,
  compact = false,
  variant = 'default',
}: EmptyStateProps) {
  const content = (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        compact ? 'py-8' : 'py-12',
        className
      )}
      role="status"
      aria-label={`Empty state: ${title}`}
    >
      <div
        className={cn(
          'rounded-full bg-muted p-3 mb-4',
          compact && 'p-2',
          iconClassName
        )}
      >
        <Icon
          className={cn(
            'text-muted-foreground',
            compact ? 'h-6 w-6' : 'h-8 w-8'
          )}
          aria-hidden="true"
        />
      </div>

      <h3
        className={cn(
          'font-semibold text-foreground',
          compact ? 'text-base mb-1' : 'text-lg mb-2'
        )}
      >
        {title}
      </h3>

      {description && (
        <p
          className={cn(
            'text-muted-foreground max-w-md',
            compact ? 'text-xs mb-3' : 'text-sm mb-4'
          )}
        >
          {description}
        </p>
      )}

      {(action || secondaryAction) && (
        <div className="flex flex-col sm:flex-row gap-2 mt-2">
          {action && (
            <Button
              onClick={action.onClick}
              variant={action.variant || 'default'}
              size={compact ? 'sm' : 'default'}
            >
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              onClick={secondaryAction.onClick}
              variant={secondaryAction.variant || 'outline'}
              size={compact ? 'sm' : 'default'}
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  )

  if (variant === 'card') {
    return (
      <Card className={cn('w-full', className)}>
        <CardContent className="p-0">{content}</CardContent>
      </Card>
    )
  }

  return content
}

/**
 * EmptyStateList - Specialized empty state for list views
 */
export function EmptyStateList({
  title = 'No items found',
  description,
  action,
  className,
}: Omit<EmptyStateProps, 'icon' | 'variant'>) {
  return (
    <EmptyState
      icon={Inbox}
      title={title}
      description={description}
      action={action}
      className={className}
      compact
    />
  )
}

/**
 * EmptyStateSearch - Specialized empty state for search results
 */
export function EmptyStateSearch({
  searchTerm,
  onClearSearch,
  className,
}: {
  searchTerm?: string
  onClearSearch?: () => void
  className?: string
}) {
  return (
    <EmptyState
      icon={Inbox}
      title="No results found"
      description={
        searchTerm
          ? `We couldn't find anything matching "${searchTerm}". Try adjusting your search.`
          : 'Try adjusting your search or filters to find what you\'re looking for.'
      }
      action={
        onClearSearch
          ? {
              label: 'Clear Search',
              onClick: onClearSearch,
              variant: 'outline',
            }
          : undefined
      }
      className={className}
      compact
    />
  )
}

/**
 * EmptyStateError - Specialized empty state for error states
 */
export function EmptyStateError({
  title = 'Something went wrong',
  description = 'We encountered an error loading this content. Please try again.',
  onRetry,
  className,
}: {
  title?: string
  description?: string
  onRetry?: () => void
  className?: string
}) {
  return (
    <EmptyState
      icon={Inbox}
      title={title}
      description={description}
      action={
        onRetry
          ? {
              label: 'Try Again',
              onClick: onRetry,
            }
          : undefined
      }
      className={className}
      iconClassName="bg-destructive/10"
      compact
    />
  )
}
