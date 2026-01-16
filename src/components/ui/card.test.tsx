import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from './card'

describe('Card Components', () => {
  describe('Card', () => {
    it('renders card element', () => {
      render(<Card>Card content</Card>)
      expect(screen.getByText('Card content')).toBeInTheDocument()
    })

    it('forwards ref to div element', () => {
      const ref = vi.fn()
      render(<Card ref={ref}>Card</Card>)
      expect(ref).toHaveBeenCalledWith(expect.any(HTMLDivElement))
    })

    it('applies base styles', () => {
      render(<Card data-testid="card">Card</Card>)
      const card = screen.getByTestId('card')
      expect(card).toHaveClass('rounded-lg')
      expect(card).toHaveClass('border')
      expect(card).toHaveClass('bg-card')
      expect(card).toHaveClass('text-card-foreground')
    })

    it('applies elevation styles from design tokens', () => {
      render(<Card data-testid="card">Card</Card>)
      const card = screen.getByTestId('card')
      // ELEVATION.low from design-tokens should be applied
      expect(card).toHaveClass('shadow-sm')
    })

    it('accepts custom className', () => {
      render(<Card className="custom-card" data-testid="card">Card</Card>)
      const card = screen.getByTestId('card')
      expect(card).toHaveClass('custom-card')
      expect(card).toHaveClass('rounded-lg') // Base classes still present
    })

    it('spreads HTML attributes', () => {
      render(
        <Card data-testid="card" role="article" aria-label="Card label">
          Card
        </Card>
      )
      const card = screen.getByTestId('card')
      expect(card).toHaveAttribute('role', 'article')
      expect(card).toHaveAttribute('aria-label', 'Card label')
    })
  })

  describe('CardHeader', () => {
    it('renders header element', () => {
      render(<CardHeader>Header content</CardHeader>)
      expect(screen.getByText('Header content')).toBeInTheDocument()
    })

    it('forwards ref to div element', () => {
      const ref = vi.fn()
      render(<CardHeader ref={ref}>Header</CardHeader>)
      expect(ref).toHaveBeenCalledWith(expect.any(HTMLDivElement))
    })

    it('applies base styles', () => {
      render(<CardHeader data-testid="header">Header</CardHeader>)
      const header = screen.getByTestId('header')
      expect(header).toHaveClass('flex')
      expect(header).toHaveClass('flex-col')
      expect(header).toHaveClass('space-y-1.5')
      expect(header).toHaveClass('p-6')
    })

    it('accepts custom className', () => {
      render(<CardHeader className="custom-header" data-testid="header">Header</CardHeader>)
      const header = screen.getByTestId('header')
      expect(header).toHaveClass('custom-header')
      expect(header).toHaveClass('flex') // Base classes still present
    })
  })

  describe('CardTitle', () => {
    it('renders title element', () => {
      render(<CardTitle>Title text</CardTitle>)
      expect(screen.getByText('Title text')).toBeInTheDocument()
    })

    it('forwards ref to div element', () => {
      const ref = vi.fn()
      render(<CardTitle ref={ref}>Title</CardTitle>)
      expect(ref).toHaveBeenCalledWith(expect.any(HTMLDivElement))
    })

    it('applies typography styles', () => {
      render(<CardTitle data-testid="title">Title</CardTitle>)
      const title = screen.getByTestId('title')
      expect(title).toHaveClass('text-2xl')
      expect(title).toHaveClass('font-semibold')
      expect(title).toHaveClass('leading-none')
      expect(title).toHaveClass('tracking-tight')
    })

    it('accepts custom className', () => {
      render(<CardTitle className="custom-title" data-testid="title">Title</CardTitle>)
      const title = screen.getByTestId('title')
      expect(title).toHaveClass('custom-title')
      expect(title).toHaveClass('text-2xl') // Base classes still present
    })
  })

  describe('CardDescription', () => {
    it('renders description element', () => {
      render(<CardDescription>Description text</CardDescription>)
      expect(screen.getByText('Description text')).toBeInTheDocument()
    })

    it('forwards ref to div element', () => {
      const ref = vi.fn()
      render(<CardDescription ref={ref}>Description</CardDescription>)
      expect(ref).toHaveBeenCalledWith(expect.any(HTMLDivElement))
    })

    it('applies text styles', () => {
      render(<CardDescription data-testid="description">Description</CardDescription>)
      const description = screen.getByTestId('description')
      expect(description).toHaveClass('text-sm')
      expect(description).toHaveClass('text-muted-foreground')
    })

    it('accepts custom className', () => {
      render(
        <CardDescription className="custom-description" data-testid="description">
          Description
        </CardDescription>
      )
      const description = screen.getByTestId('description')
      expect(description).toHaveClass('custom-description')
      expect(description).toHaveClass('text-sm') // Base classes still present
    })
  })

  describe('CardContent', () => {
    it('renders content element', () => {
      render(<CardContent>Content text</CardContent>)
      expect(screen.getByText('Content text')).toBeInTheDocument()
    })

    it('forwards ref to div element', () => {
      const ref = vi.fn()
      render(<CardContent ref={ref}>Content</CardContent>)
      expect(ref).toHaveBeenCalledWith(expect.any(HTMLDivElement))
    })

    it('applies padding styles', () => {
      render(<CardContent data-testid="content">Content</CardContent>)
      const content = screen.getByTestId('content')
      expect(content).toHaveClass('p-6')
      expect(content).toHaveClass('pt-0')
    })

    it('accepts custom className', () => {
      render(<CardContent className="custom-content" data-testid="content">Content</CardContent>)
      const content = screen.getByTestId('content')
      expect(content).toHaveClass('custom-content')
      expect(content).toHaveClass('p-6') // Base classes still present
    })
  })

  describe('CardFooter', () => {
    it('renders footer element', () => {
      render(<CardFooter>Footer content</CardFooter>)
      expect(screen.getByText('Footer content')).toBeInTheDocument()
    })

    it('forwards ref to div element', () => {
      const ref = vi.fn()
      render(<CardFooter ref={ref}>Footer</CardFooter>)
      expect(ref).toHaveBeenCalledWith(expect.any(HTMLDivElement))
    })

    it('applies layout styles', () => {
      render(<CardFooter data-testid="footer">Footer</CardFooter>)
      const footer = screen.getByTestId('footer')
      expect(footer).toHaveClass('flex')
      expect(footer).toHaveClass('items-center')
      expect(footer).toHaveClass('p-6')
      expect(footer).toHaveClass('pt-0')
    })

    it('accepts custom className', () => {
      render(<CardFooter className="custom-footer" data-testid="footer">Footer</CardFooter>)
      const footer = screen.getByTestId('footer')
      expect(footer).toHaveClass('custom-footer')
      expect(footer).toHaveClass('flex') // Base classes still present
    })
  })

  describe('Compound Component Integration', () => {
    it('renders complete card structure', () => {
      render(
        <Card data-testid="card">
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
            <CardDescription>Card Description</CardDescription>
          </CardHeader>
          <CardContent>Card Content</CardContent>
          <CardFooter>Card Footer</CardFooter>
        </Card>
      )

      expect(screen.getByText('Card Title')).toBeInTheDocument()
      expect(screen.getByText('Card Description')).toBeInTheDocument()
      expect(screen.getByText('Card Content')).toBeInTheDocument()
      expect(screen.getByText('Card Footer')).toBeInTheDocument()
    })

    it('renders card with only required parts', () => {
      render(
        <Card>
          <CardContent>Simple Card</CardContent>
        </Card>
      )

      expect(screen.getByText('Simple Card')).toBeInTheDocument()
    })

    it('renders card without footer', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Title</CardTitle>
          </CardHeader>
          <CardContent>Content</CardContent>
        </Card>
      )

      expect(screen.getByText('Title')).toBeInTheDocument()
      expect(screen.getByText('Content')).toBeInTheDocument()
    })

    it('renders nested content correctly', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>
              <span>Icon</span> Title with Icon
            </CardTitle>
            <CardDescription>Multi-line description with <strong>bold</strong> text</CardDescription>
          </CardHeader>
          <CardContent>
            <div>
              <p>Paragraph 1</p>
              <p>Paragraph 2</p>
            </div>
          </CardContent>
        </Card>
      )

      expect(screen.getByText('Icon')).toBeInTheDocument()
      expect(screen.getByText('Title with Icon')).toBeInTheDocument()
      expect(screen.getByText('bold')).toBeInTheDocument()
      expect(screen.getByText('Paragraph 1')).toBeInTheDocument()
      expect(screen.getByText('Paragraph 2')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('supports semantic HTML structure', () => {
      const { container } = render(
        <Card>
          <CardHeader>
            <CardTitle>Title</CardTitle>
          </CardHeader>
          <CardContent>Content</CardContent>
        </Card>
      )

      const divs = container.querySelectorAll('div')
      expect(divs.length).toBeGreaterThan(0)
    })

    it('supports ARIA attributes on card', () => {
      render(
        <Card role="article" aria-labelledby="card-title">
          <CardTitle id="card-title">Accessible Card</CardTitle>
          <CardContent>Content</CardContent>
        </Card>
      )

      const card = screen.getByRole('article')
      expect(card).toHaveAttribute('aria-labelledby', 'card-title')
    })

    it('supports data attributes for testing', () => {
      render(
        <Card data-testid="test-card" data-analytics="card-click">
          Content
        </Card>
      )

      const card = screen.getByTestId('test-card')
      expect(card).toHaveAttribute('data-analytics', 'card-click')
    })
  })
})
