import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Input } from './input'

describe('Input', () => {
  describe('Rendering', () => {
    it('renders input element', () => {
      render(<Input />)
      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })

    it('renders with placeholder', () => {
      render(<Input placeholder="Enter text..." />)
      expect(screen.getByPlaceholderText('Enter text...')).toBeInTheDocument()
    })

    it('renders with default value', () => {
      render(<Input defaultValue="Default text" />)
      expect(screen.getByDisplayValue('Default text')).toBeInTheDocument()
    })

    it('forwards ref to input element', () => {
      const ref = vi.fn()
      render(<Input ref={ref} />)
      expect(ref).toHaveBeenCalledWith(expect.any(HTMLInputElement))
    })

    it('renders with custom className', () => {
      render(<Input className="custom-input" />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveClass('custom-input')
      // Should also have base classes
      expect(input).toHaveClass('flex')
      expect(input).toHaveClass('rounded-md')
    })
  })

  describe('Input Types', () => {
    it('renders text input by default', () => {
      render(<Input />)
      expect(screen.getByRole('textbox')).toHaveAttribute('type', 'text')
    })

    it('renders email input', () => {
      render(<Input type="email" />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('type', 'email')
    })

    it('renders password input', () => {
      render(<Input type="password" />)
      const input = document.querySelector('input[type="password"]')
      expect(input).toBeInTheDocument()
    })

    it('renders number input', () => {
      render(<Input type="number" />)
      const input = screen.getByRole('spinbutton')
      expect(input).toHaveAttribute('type', 'number')
    })

    it('renders date input', () => {
      render(<Input type="date" />)
      const input = document.querySelector('input[type="date"]')
      expect(input).toBeInTheDocument()
    })

    it('renders file input', () => {
      render(<Input type="file" />)
      const input = document.querySelector('input[type="file"]')
      expect(input).toBeInTheDocument()
      // File inputs have special styling classes
      expect(input).toHaveClass('file:border-0')
      expect(input).toHaveClass('file:bg-transparent')
    })

    it('renders search input', () => {
      render(<Input type="search" />)
      const input = screen.getByRole('searchbox')
      expect(input).toHaveAttribute('type', 'search')
    })
  })

  describe('States', () => {
    it('handles disabled state', () => {
      render(<Input disabled />)
      const input = screen.getByRole('textbox')
      expect(input).toBeDisabled()
      expect(input).toHaveClass('disabled:cursor-not-allowed')
      expect(input).toHaveClass('disabled:opacity-50')
    })

    it('handles readOnly state', () => {
      render(<Input readOnly value="Read only" />)
      const input = screen.getByDisplayValue('Read only')
      expect(input).toHaveAttribute('readonly')
    })

    it('handles required state', () => {
      render(<Input required />)
      expect(screen.getByRole('textbox')).toBeRequired()
    })
  })

  describe('Value and Change Handling', () => {
    it('handles controlled input', async () => {
      const handleChange = vi.fn()
      const user = userEvent.setup()

      const { rerender } = render(
        <Input value="" onChange={handleChange} />
      )

      const input = screen.getByRole('textbox')
      await user.type(input, 'Hello')

      expect(handleChange).toHaveBeenCalledTimes(5) // One call per character
    })

    it('handles uncontrolled input', async () => {
      const user = userEvent.setup()

      render(<Input defaultValue="" />)
      const input = screen.getByRole('textbox') as HTMLInputElement

      await user.type(input, 'Test')

      expect(input.value).toBe('Test')
    })

    it('handles onChange event', async () => {
      const handleChange = vi.fn()
      const user = userEvent.setup()

      render(<Input onChange={handleChange} />)
      await user.type(screen.getByRole('textbox'), 'A')

      expect(handleChange).toHaveBeenCalled()
      expect(handleChange.mock.calls[0][0]).toBeInstanceOf(Object) // Event object
    })

    it('clears input value', async () => {
      const user = userEvent.setup()

      render(<Input defaultValue="Initial" />)
      const input = screen.getByRole('textbox') as HTMLInputElement

      await user.clear(input)

      expect(input.value).toBe('')
    })
  })

  describe('Keyboard Interactions', () => {
    it('handles focus and blur', async () => {
      const handleFocus = vi.fn()
      const handleBlur = vi.fn()
      const user = userEvent.setup()

      render(<Input onFocus={handleFocus} onBlur={handleBlur} />)
      const input = screen.getByRole('textbox')

      await user.click(input)
      expect(handleFocus).toHaveBeenCalledTimes(1)

      await user.tab()
      expect(handleBlur).toHaveBeenCalledTimes(1)
    })

    it('handles Enter key', async () => {
      const handleKeyDown = vi.fn()
      const user = userEvent.setup()

      render(<Input onKeyDown={handleKeyDown} />)
      const input = screen.getByRole('textbox')

      input.focus()
      await user.keyboard('{Enter}')

      expect(handleKeyDown).toHaveBeenCalled()
      expect(handleKeyDown.mock.calls[0][0].key).toBe('Enter')
    })

    it('handles Escape key', async () => {
      const handleKeyDown = vi.fn()
      const user = userEvent.setup()

      render(<Input onKeyDown={handleKeyDown} />)
      const input = screen.getByRole('textbox')

      input.focus()
      await user.keyboard('{Escape}')

      expect(handleKeyDown).toHaveBeenCalled()
      expect(handleKeyDown.mock.calls[0][0].key).toBe('Escape')
    })
  })

  describe('Accessibility', () => {
    it('supports aria-label', () => {
      render(<Input aria-label="Username" />)
      expect(screen.getByLabelText('Username')).toBeInTheDocument()
    })

    it('supports aria-describedby', () => {
      render(
        <>
          <Input aria-describedby="help-text" />
          <span id="help-text">Enter your name</span>
        </>
      )
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('aria-describedby', 'help-text')
    })

    it('supports aria-invalid for error state', () => {
      render(<Input aria-invalid="true" />)
      expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true')
    })

    it('has proper focus styles', () => {
      render(<Input />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveClass('focus-visible:outline-none')
      expect(input).toHaveClass('focus-visible:ring-2')
      expect(input).toHaveClass('focus-visible:ring-ring')
    })

    it('links to label via htmlFor', () => {
      render(
        <>
          <label htmlFor="test-input">Email</label>
          <Input id="test-input" />
        </>
      )
      expect(screen.getByLabelText('Email')).toBeInTheDocument()
    })
  })

  describe('HTML Attributes', () => {
    it('supports name attribute', () => {
      render(<Input name="email" />)
      expect(screen.getByRole('textbox')).toHaveAttribute('name', 'email')
    })

    it('supports id attribute', () => {
      render(<Input id="custom-id" />)
      expect(screen.getByRole('textbox')).toHaveAttribute('id', 'custom-id')
    })

    it('supports maxLength attribute', () => {
      render(<Input maxLength={10} />)
      expect(screen.getByRole('textbox')).toHaveAttribute('maxLength', '10')
    })

    it('supports pattern attribute', () => {
      render(<Input pattern="[0-9]*" />)
      expect(screen.getByRole('textbox')).toHaveAttribute('pattern', '[0-9]*')
    })

    it('supports autoComplete attribute', () => {
      render(<Input autoComplete="email" />)
      expect(screen.getByRole('textbox')).toHaveAttribute('autoComplete', 'email')
    })

    it('supports autoFocus attribute', () => {
      render(<Input autoFocus />)
      expect(screen.getByRole('textbox')).toHaveAttribute('autoFocus')
    })
  })

  describe('Number Input Specifics', () => {
    it('supports min and max for number input', () => {
      render(<Input type="number" min={0} max={100} />)
      const input = screen.getByRole('spinbutton')
      expect(input).toHaveAttribute('min', '0')
      expect(input).toHaveAttribute('max', '100')
    })

    it('supports step for number input', () => {
      render(<Input type="number" step={0.01} />)
      const input = screen.getByRole('spinbutton')
      expect(input).toHaveAttribute('step', '0.01')
    })
  })
})
