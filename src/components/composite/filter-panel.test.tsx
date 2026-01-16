import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FilterPanel, FilterConfig } from './filter-panel'

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  X: () => <span data-testid="x-icon">X</span>,
  Filter: () => <span data-testid="filter-icon">Filter</span>,
}))

describe('FilterPanel', () => {
  const mockFilters: FilterConfig[] = [
    { id: 'name', label: 'Name', type: 'text', value: null },
    { id: 'category', label: 'Category', type: 'select', value: null, options: [
      { label: 'Food', value: 'food' },
      { label: 'Transport', value: 'transport' },
    ]},
    { id: 'amount', label: 'Min Amount', type: 'number', value: null },
    { id: 'date', label: 'Date', type: 'date', value: null },
    { id: 'active', label: 'Active Only', type: 'boolean', value: false },
  ]

  const defaultProps = {
    filters: mockFilters,
    activeFilters: {},
    onFilterChange: vi.fn(),
    onClearFilters: vi.fn(),
  }

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Basic Rendering', () => {
    it('renders with default title', () => {
      render(<FilterPanel {...defaultProps} />)

      expect(screen.getByText('Filters')).toBeInTheDocument()
    })

    it('renders with custom title', () => {
      render(<FilterPanel {...defaultProps} title="Custom Filters" />)

      expect(screen.getByText('Custom Filters')).toBeInTheDocument()
    })

    it('renders with description', () => {
      render(
        <FilterPanel
          {...defaultProps}
          description="Filter transactions by criteria"
        />
      )

      expect(screen.getByText('Filter transactions by criteria')).toBeInTheDocument()
    })

    it('renders filter icon', () => {
      render(<FilterPanel {...defaultProps} />)

      expect(screen.getByTestId('filter-icon')).toBeInTheDocument()
    })

    it('renders all filter labels', () => {
      render(<FilterPanel {...defaultProps} />)

      expect(screen.getByText('Name')).toBeInTheDocument()
      expect(screen.getByText('Category')).toBeInTheDocument()
      expect(screen.getByText('Min Amount')).toBeInTheDocument()
      expect(screen.getByText('Date')).toBeInTheDocument()
      expect(screen.getByText('Active Only')).toBeInTheDocument()
    })

    it('renders message when no filters provided', () => {
      render(
        <FilterPanel
          {...defaultProps}
          filters={[]}
        />
      )

      expect(screen.getByText('No filters available')).toBeInTheDocument()
    })
  })

  describe('Filter Types', () => {
    it('renders text input filter', () => {
      render(<FilterPanel {...defaultProps} />)

      const input = screen.getByPlaceholderText('Enter name')
      expect(input).toBeInTheDocument()
      expect(input).toHaveAttribute('type', 'text')
    })

    it('renders select filter with options', () => {
      render(<FilterPanel {...defaultProps} />)

      const select = screen.getByLabelText('Category') as HTMLSelectElement
      expect(select).toBeInTheDocument()
      expect(select.tagName).toBe('SELECT')

      // Check for "All" option and category options
      expect(screen.getByRole('option', { name: 'All' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'Food' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'Transport' })).toBeInTheDocument()
    })

    it('renders number input filter', () => {
      render(<FilterPanel {...defaultProps} />)

      const input = screen.getByPlaceholderText('Enter min amount')
      expect(input).toBeInTheDocument()
      expect(input).toHaveAttribute('type', 'number')
    })

    it('renders date input filter', () => {
      render(<FilterPanel {...defaultProps} />)

      const input = screen.getByLabelText('Date')
      expect(input).toBeInTheDocument()
      expect(input).toHaveAttribute('type', 'date')
    })

    it('renders boolean checkbox filter', () => {
      render(<FilterPanel {...defaultProps} />)

      const checkbox = screen.getAllByLabelText('Active Only')[0] as HTMLInputElement
      expect(checkbox).toBeInTheDocument()
      expect(checkbox).toHaveAttribute('type', 'checkbox')
    })

    it('renders custom filter with render prop', () => {
      const customFilters: FilterConfig[] = [
        {
          id: 'custom',
          label: 'Custom Filter',
          type: 'custom',
          value: null,
          render: (value, onChange) => (
            <div data-testid="custom-filter">Custom Content</div>
          ),
        },
      ]

      render(
        <FilterPanel
          {...defaultProps}
          filters={customFilters}
        />
      )

      expect(screen.getByTestId('custom-filter')).toBeInTheDocument()
    })
  })

  describe('Filter Interactions', () => {
    it('calls onFilterChange when text input changes', async () => {
      const handleFilterChange = vi.fn()
      const user = userEvent.setup()

      render(
        <FilterPanel
          {...defaultProps}
          onFilterChange={handleFilterChange}
        />
      )

      const input = screen.getByPlaceholderText('Enter name')
      await user.type(input, 'Test')

      expect(handleFilterChange).toHaveBeenCalledWith('name', 'T')
      expect(handleFilterChange).toHaveBeenCalledWith('name', 'Te')
      expect(handleFilterChange).toHaveBeenCalledWith('name', 'Tes')
      expect(handleFilterChange).toHaveBeenCalledWith('name', 'Test')
    })

    it('calls onFilterChange when select changes', async () => {
      const handleFilterChange = vi.fn()
      const user = userEvent.setup()

      render(
        <FilterPanel
          {...defaultProps}
          onFilterChange={handleFilterChange}
        />
      )

      const select = screen.getByLabelText('Category')
      await user.selectOptions(select, 'food')

      expect(handleFilterChange).toHaveBeenCalledWith('category', 'food')
    })

    it('calls onFilterChange with null when select is cleared', async () => {
      const handleFilterChange = vi.fn()
      const user = userEvent.setup()

      render(
        <FilterPanel
          {...defaultProps}
          onFilterChange={handleFilterChange}
        />
      )

      const select = screen.getByLabelText('Category')
      await user.selectOptions(select, '')

      expect(handleFilterChange).toHaveBeenCalledWith('category', null)
    })

    it('calls onFilterChange when number input changes', async () => {
      const handleFilterChange = vi.fn()
      const user = userEvent.setup()

      render(
        <FilterPanel
          {...defaultProps}
          onFilterChange={handleFilterChange}
        />
      )

      const input = screen.getByPlaceholderText('Enter min amount')
      await user.type(input, '100')

      expect(handleFilterChange).toHaveBeenCalledWith('amount', 1)
      expect(handleFilterChange).toHaveBeenCalledWith('amount', 10)
      expect(handleFilterChange).toHaveBeenCalledWith('amount', 100)
    })

    it('calls onFilterChange when date input changes', async () => {
      const handleFilterChange = vi.fn()
      const user = userEvent.setup()

      render(
        <FilterPanel
          {...defaultProps}
          onFilterChange={handleFilterChange}
        />
      )

      const input = screen.getByLabelText('Date')
      await user.type(input, '2024-01-15')

      expect(handleFilterChange).toHaveBeenCalled()
    })

    it('calls onFilterChange when checkbox is toggled', async () => {
      const handleFilterChange = vi.fn()
      const user = userEvent.setup()

      render(
        <FilterPanel
          {...defaultProps}
          onFilterChange={handleFilterChange}
        />
      )

      const checkbox = screen.getAllByLabelText('Active Only')[0]
      await user.click(checkbox)

      expect(handleFilterChange).toHaveBeenCalledWith('active', true)
    })
  })

  describe('Active Filters', () => {
    it('displays active filter count badge', () => {
      render(
        <FilterPanel
          {...defaultProps}
          activeFilters={{ name: 'Test', amount: 100 }}
        />
      )

      expect(screen.getByText('2')).toBeInTheDocument()
    })

    it('does not show badge when no active filters', () => {
      render(<FilterPanel {...defaultProps} />)

      expect(screen.queryByText('0')).not.toBeInTheDocument()
    })

    it('counts non-null values as active', () => {
      render(
        <FilterPanel
          {...defaultProps}
          activeFilters={{
            name: 'Test',
            amount: null,
            category: '',
            date: '2024-01-01',
          }}
        />
      )

      // Only 'name' and 'date' should count (null and empty string are excluded)
      expect(screen.getByText('2')).toBeInTheDocument()
    })

    it('shows Clear button when filters are active', () => {
      render(
        <FilterPanel
          {...defaultProps}
          activeFilters={{ name: 'Test' }}
        />
      )

      expect(screen.getByText('Clear')).toBeInTheDocument()
    })

    it('does not show Clear button when no active filters', () => {
      render(<FilterPanel {...defaultProps} />)

      expect(screen.queryByText('Clear')).not.toBeInTheDocument()
    })

    it('calls onClearFilters when Clear is clicked', async () => {
      const handleClearFilters = vi.fn()
      const user = userEvent.setup()

      render(
        <FilterPanel
          {...defaultProps}
          activeFilters={{ name: 'Test' }}
          onClearFilters={handleClearFilters}
        />
      )

      await user.click(screen.getByText('Clear'))

      expect(handleClearFilters).toHaveBeenCalledTimes(1)
    })

    it('populates filter inputs with active values', () => {
      render(
        <FilterPanel
          {...defaultProps}
          activeFilters={{
            name: 'John Doe',
            category: 'food',
            amount: 50,
          }}
        />
      )

      expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument()
      expect(screen.getByDisplayValue('50')).toBeInTheDocument()

      const select = screen.getByLabelText('Category') as HTMLSelectElement
      expect(select.value).toBe('food')
    })
  })

  describe('Collapsible Behavior', () => {
    it('renders expanded by default when collapsible', () => {
      render(
        <FilterPanel
          {...defaultProps}
          collapsible={true}
        />
      )

      expect(screen.getByText('Name')).toBeInTheDocument()
    })

    it('renders collapsed when defaultCollapsed is true', () => {
      render(
        <FilterPanel
          {...defaultProps}
          collapsible={true}
          defaultCollapsed={true}
        />
      )

      expect(screen.queryByText('Name')).not.toBeInTheDocument()
    })

    it('toggles collapsed state when header is clicked', async () => {
      const user = userEvent.setup()

      render(
        <FilterPanel
          {...defaultProps}
          collapsible={true}
        />
      )

      expect(screen.getByText('Name')).toBeInTheDocument()

      // Click header to collapse
      await user.click(screen.getByText('Filters'))

      expect(screen.queryByText('Name')).not.toBeInTheDocument()

      // Click again to expand
      await user.click(screen.getByText('Filters'))

      expect(screen.getByText('Name')).toBeInTheDocument()
    })

    it('does not toggle when not collapsible', async () => {
      const user = userEvent.setup()

      render(
        <FilterPanel
          {...defaultProps}
          collapsible={false}
        />
      )

      expect(screen.getByText('Name')).toBeInTheDocument()

      await user.click(screen.getByText('Filters'))

      expect(screen.getByText('Name')).toBeInTheDocument()
    })

    it('applies hover styles to header when collapsible', () => {
      const { container } = render(
        <FilterPanel
          {...defaultProps}
          collapsible={true}
        />
      )

      const header = container.querySelector('.cursor-pointer')
      expect(header).toBeInTheDocument()
    })

    it('Clear button click does not toggle collapse', async () => {
      const user = userEvent.setup()

      render(
        <FilterPanel
          {...defaultProps}
          collapsible={true}
          activeFilters={{ name: 'Test' }}
        />
      )

      expect(screen.getByText('Name')).toBeInTheDocument()

      await user.click(screen.getByText('Clear'))

      // Panel should still be expanded
      expect(screen.getByText('Name')).toBeInTheDocument()
    })
  })

  describe('Custom Rendering', () => {
    it('uses renderCustomFilter prop for all filters', () => {
      const renderCustomFilter = vi.fn((filter) => (
        <div data-testid={`custom-${filter.id}`}>Custom {filter.label}</div>
      ))

      render(
        <FilterPanel
          {...defaultProps}
          renderCustomFilter={renderCustomFilter}
        />
      )

      expect(screen.getByTestId('custom-name')).toBeInTheDocument()
      expect(screen.getByTestId('custom-category')).toBeInTheDocument()
      expect(renderCustomFilter).toHaveBeenCalledTimes(5)
    })

    it('custom filter render prop takes precedence over renderCustomFilter', () => {
      const customFilters: FilterConfig[] = [
        {
          id: 'custom',
          label: 'Custom',
          type: 'custom',
          value: null,
          render: () => <div data-testid="filter-render">Filter Render</div>,
        },
      ]

      render(
        <FilterPanel
          {...defaultProps}
          filters={customFilters}
          renderCustomFilter={() => <div>Global Render</div>}
        />
      )

      expect(screen.getByTestId('filter-render')).toBeInTheDocument()
      expect(screen.queryByText('Global Render')).not.toBeInTheDocument()
    })

    it('custom filter receives value and onChange', () => {
      const onChange = vi.fn()
      const customFilters: FilterConfig[] = [
        {
          id: 'custom',
          label: 'Custom',
          type: 'custom',
          value: 'initial',
          render: (value, handleChange) => (
            <button onClick={() => handleChange('new-value')}>
              Value: {value}
            </button>
          ),
        },
      ]

      const user = userEvent.setup()
      render(
        <FilterPanel
          {...defaultProps}
          filters={customFilters}
          activeFilters={{ custom: 'test-value' }}
          onFilterChange={onChange}
        />
      )

      expect(screen.getByText('Value: test-value')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('associates labels with inputs', () => {
      render(<FilterPanel {...defaultProps} />)

      const nameInput = screen.getByLabelText('Name')
      const categorySelect = screen.getByLabelText('Category')
      const amountInput = screen.getByLabelText('Min Amount')
      const dateInput = screen.getByLabelText('Date')

      expect(nameInput).toBeInTheDocument()
      expect(categorySelect).toBeInTheDocument()
      expect(amountInput).toBeInTheDocument()
      expect(dateInput).toBeInTheDocument()
    })

    it('marks filter icon as aria-hidden', () => {
      const { container } = render(<FilterPanel {...defaultProps} />)

      const filterIcon = container.querySelector('[aria-hidden="true"]')
      expect(filterIcon).toBeInTheDocument()
    })

    it('all inputs have proper IDs', () => {
      render(<FilterPanel {...defaultProps} />)

      expect(document.getElementById('filter-name')).toBeInTheDocument()
      expect(document.getElementById('filter-category')).toBeInTheDocument()
      expect(document.getElementById('filter-amount')).toBeInTheDocument()
      expect(document.getElementById('filter-date')).toBeInTheDocument()
      expect(document.getElementById('filter-active')).toBeInTheDocument()
    })
  })

  describe('Custom Styling', () => {
    it('accepts custom className', () => {
      const { container } = render(
        <FilterPanel
          {...defaultProps}
          className="custom-filter-panel"
        />
      )

      const panel = container.querySelector('.custom-filter-panel')
      expect(panel).toBeInTheDocument()
    })

    it('preserves base classes with custom className', () => {
      const { container } = render(
        <FilterPanel
          {...defaultProps}
          className="custom-class"
        />
      )

      const panel = container.querySelector('.custom-class')
      expect(panel).toHaveClass('transition-all')
      expect(panel).toHaveClass('duration-200')
    })
  })
})
