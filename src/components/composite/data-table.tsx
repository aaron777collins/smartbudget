import React from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ColumnDef<T> {
  id: string
  header: string
  accessorKey?: keyof T
  accessorFn?: (row: T) => any
  cell?: (value: any, row: T, index: number) => React.ReactNode
  sortable?: boolean
  width?: string
  align?: 'left' | 'center' | 'right'
  className?: string
}

export interface DataTableProps<T> {
  columns: ColumnDef<T>[]
  data: T[]
  isLoading?: boolean
  emptyState?: React.ReactNode
  onRowClick?: (row: T, index: number) => void
  // Sorting
  sortable?: boolean
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  onSortChange?: (sortBy: string, sortOrder: 'asc' | 'desc') => void
  // Pagination
  pagination?: boolean
  page?: number
  pageSize?: number
  totalRows?: number
  onPageChange?: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
  // Styling
  className?: string
  striped?: boolean
  hoverable?: boolean
  compact?: boolean
  // Accessibility
  ariaLabel?: string
}

/**
 * DataTable - A reusable composite component for displaying tabular data
 *
 * Features:
 * - Column-based configuration with flexible data access
 * - Sortable columns with visual indicators
 * - Pagination with customizable page sizes
 * - Loading skeletons during data fetch
 * - Empty state handling
 * - Row click handlers for interactive tables
 * - Keyboard navigation support
 * - Fully accessible with ARIA labels
 * - Responsive design with horizontal scroll on mobile
 * - Striped rows and hover states
 *
 * @example
 * ```tsx
 * <DataTable
 *   columns={[
 *     { id: 'name', header: 'Name', accessorKey: 'name', sortable: true },
 *     { id: 'amount', header: 'Amount', accessorFn: (row) => row.amount, cell: (val) => formatCurrency(val) },
 *   ]}
 *   data={transactions}
 *   isLoading={isLoading}
 *   sortable
 *   pagination
 *   onRowClick={(row) => handleViewDetails(row)}
 * />
 * ```
 */
export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  isLoading = false,
  emptyState,
  onRowClick,
  sortable = false,
  sortBy,
  sortOrder = 'asc',
  onSortChange,
  pagination = false,
  page = 1,
  pageSize = 10,
  totalRows,
  onPageChange,
  onPageSizeChange,
  className,
  striped = false,
  hoverable = true,
  compact = false,
  ariaLabel = 'Data table',
}: DataTableProps<T>) {
  const [localSortBy, setLocalSortBy] = React.useState<string | undefined>(sortBy)
  const [localSortOrder, setLocalSortOrder] = React.useState<'asc' | 'desc'>(sortOrder)

  const currentSortBy = sortBy ?? localSortBy
  const currentSortOrder = sortOrder ?? localSortOrder

  const handleSort = (columnId: string) => {
    const newSortOrder =
      currentSortBy === columnId && currentSortOrder === 'asc' ? 'desc' : 'asc'

    if (onSortChange) {
      onSortChange(columnId, newSortOrder)
    } else {
      setLocalSortBy(columnId)
      setLocalSortOrder(newSortOrder)
    }
  }

  // Get cell value using accessorKey or accessorFn
  const getCellValue = (row: T, column: ColumnDef<T>) => {
    if (column.accessorFn) {
      return column.accessorFn(row)
    }
    if (column.accessorKey) {
      return row[column.accessorKey]
    }
    return null
  }

  // Calculate pagination values
  const totalPages = totalRows ? Math.ceil(totalRows / pageSize) : Math.ceil(data.length / pageSize)
  const startRow = (page - 1) * pageSize + 1
  const endRow = Math.min(page * pageSize, totalRows ?? data.length)
  const showingRows = totalRows ?? data.length

  return (
    <div className={cn('space-y-4', className)}>
      <div className="rounded-md border overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => {
                const isSortable = sortable && column.sortable !== false
                const isSorted = currentSortBy === column.id
                const SortIcon = isSorted
                  ? currentSortOrder === 'asc'
                    ? ChevronUp
                    : ChevronDown
                  : ChevronsUpDown

                return (
                  <TableHead
                    key={column.id}
                    style={{ width: column.width }}
                    className={cn(
                      column.align === 'center' && 'text-center',
                      column.align === 'right' && 'text-right',
                      column.className
                    )}
                  >
                    {isSortable ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                          '-ml-3 h-8 data-[state=open]:bg-accent',
                          column.align === 'center' && 'mx-auto',
                          column.align === 'right' && 'ml-auto'
                        )}
                        onClick={() => handleSort(column.id)}
                      >
                        <span>{column.header}</span>
                        <SortIcon
                          className={cn(
                            'ml-2 h-4 w-4',
                            isSorted ? 'text-foreground' : 'text-muted-foreground'
                          )}
                          aria-hidden="true"
                        />
                      </Button>
                    ) : (
                      column.header
                    )}
                  </TableHead>
                )
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              // Loading skeleton rows
              Array.from({ length: pageSize }).map((_, index) => (
                <TableRow key={`skeleton-${index}`}>
                  {columns.map((column) => (
                    <TableCell key={column.id}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : data.length === 0 ? (
              // Empty state
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  {emptyState || (
                    <div className="text-muted-foreground">No data available</div>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              // Data rows
              data.map((row, rowIndex) => (
                <TableRow
                  key={rowIndex}
                  onClick={onRowClick ? () => onRowClick(row, rowIndex) : undefined}
                  className={cn(
                    onRowClick && 'cursor-pointer',
                    hoverable && 'hover:bg-muted/50',
                    striped && rowIndex % 2 === 1 && 'bg-muted/20'
                  )}
                  tabIndex={onRowClick ? 0 : undefined}
                  onKeyDown={
                    onRowClick
                      ? (e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            onRowClick(row, rowIndex)
                          }
                        }
                      : undefined
                  }
                >
                  {columns.map((column) => {
                    const value = getCellValue(row, column)
                    const cellContent = column.cell ? column.cell(value, row, rowIndex) : value

                    return (
                      <TableCell
                        key={column.id}
                        className={cn(
                          compact && 'py-2',
                          column.align === 'center' && 'text-center',
                          column.align === 'right' && 'text-right',
                          column.className
                        )}
                      >
                        {cellContent}
                      </TableCell>
                    )
                  })}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {pagination && !isLoading && data.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2">
          <div className="text-sm text-muted-foreground">
            Showing {startRow} to {endRow} of {showingRows} rows
          </div>

          <div className="flex items-center gap-2">
            {/* Page size selector */}
            {onPageSizeChange && (
              <select
                value={pageSize}
                onChange={(e) => onPageSizeChange(Number(e.target.value))}
                className="h-8 rounded-md border border-input bg-transparent px-2 text-sm"
                aria-label="Rows per page"
              >
                {[10, 25, 50, 100].map((size) => (
                  <option key={size} value={size}>
                    {size} rows
                  </option>
                ))}
              </select>
            )}

            {/* Pagination controls */}
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => onPageChange?.(1)}
                disabled={page === 1}
                aria-label="First page"
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => onPageChange?.(page - 1)}
                disabled={page === 1}
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-1 px-2">
                <span className="text-sm">
                  Page {page} of {totalPages}
                </span>
              </div>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => onPageChange?.(page + 1)}
                disabled={page === totalPages}
                aria-label="Next page"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => onPageChange?.(totalPages)}
                disabled={page === totalPages}
                aria-label="Last page"
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
