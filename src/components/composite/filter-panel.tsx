import React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { X, Filter, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ANIMATION } from '@/lib/design-tokens'

export interface FilterConfig {
  id: string
  label: string
  value: string | number | boolean | null
  type: 'text' | 'select' | 'date' | 'number' | 'boolean' | 'custom'
  options?: Array<{ label: string; value: string | number }>
  render?: (value: any, onChange: (value: any) => void) => React.ReactNode
}

export interface FilterPanelProps {
  title?: string
  description?: string
  filters: FilterConfig[]
  activeFilters: Record<string, any>
  onFilterChange: (filterId: string, value: any) => void
  onClearFilters: () => void
  className?: string
  collapsible?: boolean
  defaultCollapsed?: boolean
  renderCustomFilter?: (filter: FilterConfig) => React.ReactNode
}

/**
 * FilterPanel - A reusable composite component for building filter UIs
 *
 * Features:
 * - Supports multiple filter types (text, select, date, number, boolean, custom)
 * - Active filter badge indicators
 * - Clear all filters functionality
 * - Optional collapsible panel
 * - Fully customizable with render props
 * - Accessible with proper labels and ARIA attributes
 *
 * @example
 * ```tsx
 * <FilterPanel
 *   title="Transaction Filters"
 *   description="Filter transactions by criteria"
 *   filters={[
 *     { id: 'category', label: 'Category', type: 'select', value: null, options: [...] },
 *     { id: 'amount', label: 'Min Amount', type: 'number', value: null },
 *     { id: 'dateFrom', label: 'From Date', type: 'date', value: null },
 *   ]}
 *   activeFilters={activeFilters}
 *   onFilterChange={handleFilterChange}
 *   onClearFilters={handleClearFilters}
 * />
 * ```
 */
export function FilterPanel({
  title = 'Filters',
  description,
  filters,
  activeFilters,
  onFilterChange,
  onClearFilters,
  className,
  collapsible = false,
  defaultCollapsed = false,
  renderCustomFilter,
}: FilterPanelProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed)

  // Count active filters
  const activeFilterCount = Object.values(activeFilters).filter(
    (value) => value !== null && value !== undefined && value !== ''
  ).length

  const hasActiveFilters = activeFilterCount > 0

  const toggleCollapse = () => {
    if (collapsible) {
      setIsCollapsed(!isCollapsed)
    }
  }

  return (
    <Card className={cn('transition-all duration-200', className)}>
      <CardHeader
        className={cn(
          'flex flex-row items-center justify-between space-y-0',
          collapsible && 'cursor-pointer hover:bg-accent/50'
        )}
        onClick={collapsible ? toggleCollapse : undefined}
      >
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <div>
            <CardTitle className="text-base font-semibold">
              {title}
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-2">
                  {activeFilterCount}
                </Badge>
              )}
            </CardTitle>
            {description && (
              <CardDescription className="text-xs mt-1">
                {description}
              </CardDescription>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onClearFilters()
              }}
              className="h-8 px-2 text-xs"
            >
              <X className="h-3 w-3 mr-1" />
              Clear
            </Button>
          )}
          {collapsible && (
            <ChevronDown
              className={cn(
                'h-4 w-4 text-muted-foreground',
                isCollapsed ? ANIMATION.iconRotation.collapsed : ANIMATION.iconRotation.expanded
              )}
              aria-hidden="true"
            />
          )}
        </div>
      </CardHeader>

      {(!collapsible || !isCollapsed) && (
        <CardContent className="space-y-4">
          {filters.map((filter) => {
            const value = activeFilters[filter.id] ?? filter.value

            return (
              <div key={filter.id} className="space-y-2">
                <label
                  htmlFor={`filter-${filter.id}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {filter.label}
                </label>

                {filter.type === 'custom' && filter.render ? (
                  filter.render(value, (newValue) => onFilterChange(filter.id, newValue))
                ) : renderCustomFilter ? (
                  renderCustomFilter(filter)
                ) : (
                  <DefaultFilterInput
                    filter={filter}
                    value={value}
                    onChange={(newValue) => onFilterChange(filter.id, newValue)}
                  />
                )}
              </div>
            )
          })}

          {filters.length === 0 && (
            <div className="text-sm text-muted-foreground text-center py-4">
              No filters available
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}

/**
 * Default filter input renderer for built-in filter types
 */
function DefaultFilterInput({
  filter,
  value,
  onChange,
}: {
  filter: FilterConfig
  value: any
  onChange: (value: any) => void
}) {
  const inputId = `filter-${filter.id}`

  switch (filter.type) {
    case 'text':
      return (
        <input
          id={inputId}
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          placeholder={`Enter ${filter.label.toLowerCase()}`}
        />
      )

    case 'number':
      return (
        <input
          id={inputId}
          type="number"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          placeholder={`Enter ${filter.label.toLowerCase()}`}
        />
      )

    case 'date':
      return (
        <input
          id={inputId}
          type="date"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        />
      )

    case 'select':
      return (
        <select
          id={inputId}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value || null)}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="">All</option>
          {filter.options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )

    case 'boolean':
      return (
        <div className="flex items-center gap-2">
          <input
            id={inputId}
            type="checkbox"
            checked={!!value}
            onChange={(e) => onChange(e.target.checked)}
            className="h-4 w-4 rounded border-input text-primary focus:ring-2 focus:ring-ring focus:ring-offset-2"
          />
          <label htmlFor={inputId} className="text-sm text-muted-foreground cursor-pointer">
            {filter.label}
          </label>
        </div>
      )

    default:
      return (
        <div className="text-sm text-muted-foreground">
          Unsupported filter type: {filter.type}
        </div>
      )
  }
}
