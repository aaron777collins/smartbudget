import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StatCard } from './stat-card'
import { DollarSign } from 'lucide-react'

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  DollarSign: () => <span data-testid="dollar-icon">$</span>,
  TrendingUp: () => <span data-testid="trending-up">↑</span>,
  TrendingDown: () => <span data-testid="trending-down">↓</span>,
  Minus: () => <span data-testid="minus">−</span>,
  Info: () => <span data-testid="info-icon">ℹ</span>,
}))

describe('StatCard', () => {
  describe('Basic Rendering', () => {
    it('renders with required props only', () => {
      render(<StatCard title="Total Revenue" value="$45,231.89" />)

      expect(screen.getByText('Total Revenue')).toBeInTheDocument()
      expect(screen.getByText('$45,231.89')).toBeInTheDocument()
    })

    it('renders with numeric value', () => {
      render(<StatCard title="Total Users" value={12345} />)

      expect(screen.getByText('Total Users')).toBeInTheDocument()
      expect(screen.getByText('12345')).toBeInTheDocument()
    })

    it('renders with description', () => {
      render(
        <StatCard
          title="Revenue"
          value="$1,000"
          description="All accounts"
        />
      )

      expect(screen.getByText('All accounts')).toBeInTheDocument()
    })

    it('renders with icon', () => {
      render(
        <StatCard
          title="Revenue"
          value="$1,000"
          icon={DollarSign}
        />
      )

      expect(screen.getByTestId('dollar-icon')).toBeInTheDocument()
    })
  })

  describe('Trend Indicators', () => {
    it('renders upward trend', () => {
      render(
        <StatCard
          title="Revenue"
          value="$1,000"
          trend={{ value: 20.1, label: 'from last month', direction: 'up' }}
        />
      )

      expect(screen.getByTestId('trending-up')).toBeInTheDocument()
      expect(screen.getByText('+20.1%')).toBeInTheDocument()
      expect(screen.getByText('from last month')).toBeInTheDocument()
    })

    it('renders downward trend', () => {
      render(
        <StatCard
          title="Revenue"
          value="$1,000"
          trend={{ value: -15.5, label: 'from last month', direction: 'down' }}
        />
      )

      expect(screen.getByTestId('trending-down')).toBeInTheDocument()
      expect(screen.getByText('-15.5%')).toBeInTheDocument()
    })

    it('renders neutral trend', () => {
      render(
        <StatCard
          title="Revenue"
          value="$1,000"
          trend={{ value: 0, label: 'no change', direction: 'neutral' }}
        />
      )

      expect(screen.getByTestId('minus')).toBeInTheDocument()
      expect(screen.getByText('0%')).toBeInTheDocument()
    })

    it('renders trend without label', () => {
      render(
        <StatCard
          title="Revenue"
          value="$1,000"
          trend={{ value: 10, label: '', direction: 'up' }}
        />
      )

      expect(screen.getByText('+10%')).toBeInTheDocument()
      expect(screen.queryByText('from last month')).not.toBeInTheDocument()
    })

    it('applies correct color classes for upward trend', () => {
      const { container } = render(
        <StatCard
          title="Revenue"
          value="$1,000"
          trend={{ value: 20, label: 'up', direction: 'up' }}
        />
      )

      const trendElement = container.querySelector('.text-green-600')
      expect(trendElement).toBeInTheDocument()
    })

    it('applies correct color classes for downward trend', () => {
      const { container } = render(
        <StatCard
          title="Revenue"
          value="$1,000"
          trend={{ value: -20, label: 'down', direction: 'down' }}
        />
      )

      const trendElement = container.querySelector('.text-red-600')
      expect(trendElement).toBeInTheDocument()
    })

    it('applies correct color classes for neutral trend', () => {
      const { container } = render(
        <StatCard
          title="Revenue"
          value="$1,000"
          trend={{ value: 0, label: 'neutral', direction: 'neutral' }}
        />
      )

      const trendElement = container.querySelector('.text-muted-foreground')
      expect(trendElement).toBeInTheDocument()
    })
  })

  describe('Badge Support', () => {
    it('renders badge with default variant', () => {
      render(
        <StatCard
          title="Revenue"
          value="$1,000"
          badge={{ label: 'Active' }}
        />
      )

      expect(screen.getByText('Active')).toBeInTheDocument()
    })

    it('renders badge with specific variant', () => {
      render(
        <StatCard
          title="Revenue"
          value="$1,000"
          badge={{ label: 'Warning', variant: 'destructive' }}
        />
      )

      expect(screen.getByText('Warning')).toBeInTheDocument()
    })

    it('renders both trend and badge together', () => {
      render(
        <StatCard
          title="Revenue"
          value="$1,000"
          trend={{ value: 10, label: 'up', direction: 'up' }}
          badge={{ label: 'Active' }}
        />
      )

      expect(screen.getByText('+10%')).toBeInTheDocument()
      expect(screen.getByText('Active')).toBeInTheDocument()
    })
  })

  describe('Elevation Variants', () => {
    it('applies low elevation by default', () => {
      const { container } = render(
        <StatCard title="Revenue" value="$1,000" />
      )

      const card = container.querySelector('.shadow-sm')
      expect(card).toBeInTheDocument()
    })

    it('applies medium elevation', () => {
      const { container } = render(
        <StatCard title="Revenue" value="$1,000" elevation="medium" />
      )

      const card = container.querySelector('.shadow-md')
      expect(card).toBeInTheDocument()
    })

    it('applies high elevation', () => {
      const { container } = render(
        <StatCard title="Revenue" value="$1,000" elevation="high" />
      )

      const card = container.querySelector('.shadow-lg')
      expect(card).toBeInTheDocument()
    })
  })

  describe('Animation', () => {
    it('applies default animation delay', () => {
      const { container } = render(
        <StatCard title="Revenue" value="$1,000" />
      )

      const card = container.querySelector('[style*="animation-delay: 0ms"]')
      expect(card).toBeInTheDocument()
    })

    it('applies custom animation delay', () => {
      const { container } = render(
        <StatCard title="Revenue" value="$1,000" delay={300} />
      )

      const card = container.querySelector('[style*="animation-delay: 300ms"]')
      expect(card).toBeInTheDocument()
    })

    it('has fade-in animation class', () => {
      const { container } = render(
        <StatCard title="Revenue" value="$1,000" />
      )

      const card = container.querySelector('.animate-in')
      expect(card).toBeInTheDocument()
    })
  })

  describe('Interactive Behavior', () => {
    it('renders as button when onClick is provided', () => {
      render(
        <StatCard
          title="Revenue"
          value="$1,000"
          onClick={() => {}}
        />
      )

      const card = screen.getByRole('button')
      expect(card).toBeInTheDocument()
    })

    it('does not have button role without onClick', () => {
      render(<StatCard title="Revenue" value="$1,000" />)

      expect(screen.queryByRole('button')).not.toBeInTheDocument()
    })

    it('handles click events', async () => {
      const handleClick = vi.fn()
      const user = userEvent.setup()

      render(
        <StatCard
          title="Revenue"
          value="$1,000"
          onClick={handleClick}
        />
      )

      await user.click(screen.getByRole('button'))
      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('applies cursor pointer when interactive', () => {
      const { container } = render(
        <StatCard
          title="Revenue"
          value="$1,000"
          onClick={() => {}}
        />
      )

      const card = container.querySelector('.cursor-pointer')
      expect(card).toBeInTheDocument()
    })

    it('applies hover styles when interactive', () => {
      const { container } = render(
        <StatCard
          title="Revenue"
          value="$1,000"
          onClick={() => {}}
        />
      )

      const card = container.querySelector('.hover\\:shadow-lg')
      expect(card).toBeInTheDocument()
    })

    it('has tabIndex when interactive', () => {
      render(
        <StatCard
          title="Revenue"
          value="$1,000"
          onClick={() => {}}
        />
      )

      const card = screen.getByRole('button')
      expect(card).toHaveAttribute('tabIndex', '0')
    })

    it('does not have tabIndex when not interactive', () => {
      const { container } = render(
        <StatCard title="Revenue" value="$1,000" />
      )

      const card = container.firstChild
      expect(card).not.toHaveAttribute('tabIndex')
    })
  })

  describe('Keyboard Interactions', () => {
    it('handles Enter key when interactive', async () => {
      const handleClick = vi.fn()
      const user = userEvent.setup()

      render(
        <StatCard
          title="Revenue"
          value="$1,000"
          onClick={handleClick}
        />
      )

      const card = screen.getByRole('button')
      card.focus()
      await user.keyboard('{Enter}')

      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('handles Space key when interactive', async () => {
      const handleClick = vi.fn()
      const user = userEvent.setup()

      render(
        <StatCard
          title="Revenue"
          value="$1,000"
          onClick={handleClick}
        />
      )

      const card = screen.getByRole('button')
      card.focus()
      await user.keyboard(' ')

      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('does not trigger on other keys', async () => {
      const handleClick = vi.fn()
      const user = userEvent.setup()

      render(
        <StatCard
          title="Revenue"
          value="$1,000"
          onClick={handleClick}
        />
      )

      const card = screen.getByRole('button')
      card.focus()
      await user.keyboard('a')

      expect(handleClick).not.toHaveBeenCalled()
    })
  })

  describe('Accessibility', () => {
    it('has aria-label for trend indicator', () => {
      render(
        <StatCard
          title="Revenue"
          value="$1,000"
          trend={{ value: 20, label: 'from last month', direction: 'up' }}
        />
      )

      const trendLabel = screen.getByLabelText(/increased by 20%/i)
      expect(trendLabel).toBeInTheDocument()
    })

    it('has aria-label for downward trend', () => {
      render(
        <StatCard
          title="Revenue"
          value="$1,000"
          trend={{ value: -10, label: 'from last month', direction: 'down' }}
        />
      )

      const trendLabel = screen.getByLabelText(/decreased by 10%/i)
      expect(trendLabel).toBeInTheDocument()
    })

    it('has aria-label for neutral trend', () => {
      render(
        <StatCard
          title="Revenue"
          value="$1,000"
          trend={{ value: 0, label: 'no change', direction: 'neutral' }}
        />
      )

      const trendLabel = screen.getByLabelText(/no change by 0%/i)
      expect(trendLabel).toBeInTheDocument()
    })

    it('marks icon as aria-hidden', () => {
      const { container } = render(
        <StatCard
          title="Revenue"
          value="$1,000"
          icon={DollarSign}
        />
      )

      const icon = container.querySelector('[aria-hidden="true"]')
      expect(icon).toBeInTheDocument()
    })
  })

  describe('Custom Styling', () => {
    it('accepts custom className', () => {
      const { container } = render(
        <StatCard
          title="Revenue"
          value="$1,000"
          className="custom-stat-card"
        />
      )

      const card = container.querySelector('.custom-stat-card')
      expect(card).toBeInTheDocument()
    })

    it('preserves base classes with custom className', () => {
      const { container } = render(
        <StatCard
          title="Revenue"
          value="$1,000"
          className="custom-class"
        />
      )

      const card = container.querySelector('.custom-class')
      expect(card).toHaveClass('transition-all')
      expect(card).toHaveClass('duration-200')
    })
  })

  describe('Complete Integration', () => {
    it('renders stat card with all features', () => {
      const handleClick = vi.fn()

      render(
        <StatCard
          title="Total Revenue"
          value="$45,231.89"
          description="From all accounts"
          icon={DollarSign}
          trend={{ value: 20.1, label: 'from last month', direction: 'up' }}
          badge={{ label: 'Active', variant: 'secondary' }}
          elevation="high"
          delay={200}
          onClick={handleClick}
          className="custom-card"
        />
      )

      expect(screen.getByText('Total Revenue')).toBeInTheDocument()
      expect(screen.getByText('$45,231.89')).toBeInTheDocument()
      expect(screen.getByText('From all accounts')).toBeInTheDocument()
      expect(screen.getByTestId('dollar-icon')).toBeInTheDocument()
      expect(screen.getByText('+20.1%')).toBeInTheDocument()
      expect(screen.getByText('from last month')).toBeInTheDocument()
      expect(screen.getByText('Active')).toBeInTheDocument()
      expect(screen.getByRole('button')).toBeInTheDocument()
    })
  })

  describe('Sparklines', () => {
    it('renders sparkline when data is provided', () => {
      const { container } = render(
        <StatCard
          title="Revenue"
          value="$1,000"
          sparkline={[
            { label: 'Jan', value: 100 },
            { label: 'Feb', value: 150 },
            { label: 'Mar', value: 120 },
          ]}
        />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
      expect(svg).toHaveAttribute('aria-hidden', 'true')
    })

    it('does not render sparkline when data is empty', () => {
      const { container } = render(
        <StatCard
          title="Revenue"
          value="$1,000"
          sparkline={[]}
        />
      )

      const svg = container.querySelector('svg')
      expect(svg).not.toBeInTheDocument()
    })

    it('renders sparkline with proper SVG structure', () => {
      const { container } = render(
        <StatCard
          title="Revenue"
          value="$1,000"
          sparkline={[
            { label: 'Jan', value: 100 },
            { label: 'Feb', value: 200 },
            { label: 'Mar', value: 150 },
          ]}
        />
      )

      const polyline = container.querySelector('polyline')
      expect(polyline).toBeInTheDocument()
      expect(polyline).toHaveAttribute('fill', 'none')
      expect(polyline).toHaveAttribute('stroke', 'currentColor')
    })

    it('handles sparkline with single data point', () => {
      const { container } = render(
        <StatCard
          title="Revenue"
          value="$1,000"
          sparkline={[{ label: 'Jan', value: 100 }]}
        />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })
  })

  describe('Hover Details', () => {
    it('renders info icon when hover details provided', () => {
      render(
        <StatCard
          title="Revenue"
          value="$1,000"
          hoverDetails={{
            title: 'Details',
            items: [{ label: 'Item 1', value: '100' }]
          }}
        />
      )

      expect(screen.getByTestId('info-icon')).toBeInTheDocument()
      expect(screen.getByLabelText('Additional details available on hover')).toBeInTheDocument()
    })

    it('does not render info icon without hover details', () => {
      render(<StatCard title="Revenue" value="$1,000" />)

      expect(screen.queryByTestId('info-icon')).not.toBeInTheDocument()
    })

    it('renders hover details with title', async () => {
      const user = userEvent.setup()

      render(
        <StatCard
          title="Revenue"
          value="$1,000"
          hoverDetails={{
            title: 'Revenue Breakdown',
            items: [
              { label: 'This month', value: '$1,000' },
              { label: 'Last month', value: '$800' },
            ]
          }}
        />
      )

      // Click to open popover
      const card = screen.getByText('Revenue').closest('[role="button"]')
      if (card) await user.click(card)

      expect(screen.getByText('Revenue Breakdown')).toBeInTheDocument()
      expect(screen.getByText('This month')).toBeInTheDocument()
      expect(screen.getByText('$1,000')).toBeInTheDocument()
      expect(screen.getByText('Last month')).toBeInTheDocument()
      expect(screen.getByText('$800')).toBeInTheDocument()
    })

    it('renders hover details without title', async () => {
      const user = userEvent.setup()

      render(
        <StatCard
          title="Revenue"
          value="$1,000"
          hoverDetails={{
            items: [
              { label: 'Current', value: '$1,000' },
            ]
          }}
        />
      )

      const card = screen.getByText('Revenue').closest('[role="button"]')
      if (card) await user.click(card)

      expect(screen.getByText('Current')).toBeInTheDocument()
      expect(screen.getByText('$1,000')).toBeInTheDocument()
    })
  })

  describe('Custom Value Formatting', () => {
    it('formats value with custom formatter', () => {
      const formatter = (val: string | number) => `€ ${val}`

      render(
        <StatCard
          title="Revenue"
          value={1000}
          formatValue={formatter}
        />
      )

      expect(screen.getByText('€ 1000')).toBeInTheDocument()
    })

    it('uses default value without formatter', () => {
      render(<StatCard title="Revenue" value="$1,000" />)

      expect(screen.getByText('$1,000')).toBeInTheDocument()
    })

    it('formats string values', () => {
      const formatter = (val: string | number) => String(val).toUpperCase()

      render(
        <StatCard
          title="Status"
          value="active"
          formatValue={formatter}
        />
      )

      expect(screen.getByText('ACTIVE')).toBeInTheDocument()
    })

    it('formats numeric values with decimals', () => {
      const formatter = (val: string | number) =>
        typeof val === 'number' ? val.toFixed(2) : val

      render(
        <StatCard
          title="Score"
          value={95.678}
          formatValue={formatter}
        />
      )

      expect(screen.getByText('95.68')).toBeInTheDocument()
    })
  })

  describe('Enhanced Features Integration', () => {
    it('renders with sparkline, hover details, and custom formatting', async () => {
      const user = userEvent.setup()
      const formatter = (val: string | number) => `$${val}`

      const { container } = render(
        <StatCard
          title="Revenue"
          value={1000}
          formatValue={formatter}
          sparkline={[
            { label: 'Jan', value: 800 },
            { label: 'Feb', value: 900 },
            { label: 'Mar', value: 1000 },
          ]}
          hoverDetails={{
            title: 'Monthly Revenue',
            items: [
              { label: 'Average', value: '$900' },
              { label: 'Peak', value: '$1,000' },
            ]
          }}
          trend={{ value: 25, label: 'vs last quarter', direction: 'up' }}
        />
      )

      // Check formatted value
      expect(screen.getByText('$1000')).toBeInTheDocument()

      // Check sparkline
      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()

      // Check info icon
      expect(screen.getByTestId('info-icon')).toBeInTheDocument()

      // Check trend
      expect(screen.getByText('+25%')).toBeInTheDocument()

      // Open popover and check details
      const card = screen.getByText('Revenue').closest('[role="button"]')
      if (card) await user.click(card)

      expect(screen.getByText('Monthly Revenue')).toBeInTheDocument()
      expect(screen.getByText('Average')).toBeInTheDocument()
      expect(screen.getByText('Peak')).toBeInTheDocument()
    })
  })
})
