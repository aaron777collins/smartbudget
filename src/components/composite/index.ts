/**
 * Composite Components
 *
 * Reusable composite components built on top of base UI components.
 * These provide higher-level abstractions for common UI patterns.
 */

export { StatCard, type StatCardProps } from './stat-card'
export { FilterPanel, type FilterPanelProps, type FilterConfig } from './filter-panel'
export { DataTable, type DataTableProps, type ColumnDef } from './data-table'
export {
  EmptyState,
  EmptyStateList,
  EmptyStateSearch,
  EmptyStateError,
  type EmptyStateProps,
} from './empty-state'
