import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { FormField } from './form-field'

describe('FormField', () => {
  describe('Basic Rendering', () => {
    it('renders input with label', () => {
      render(<FormField id="test" label="Test Field" type="text" />)

      expect(screen.getByLabelText(/Test Field/i)).toBeInTheDocument()
      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })

    it('renders textarea when type is "textarea"', () => {
      render(<FormField id="test" label="Test Field" type="textarea" />)

      const textarea = screen.getByLabelText(/Test Field/i)
      expect(textarea).toBeInTheDocument()
      expect(textarea.tagName).toBe('TEXTAREA')
    })

    it('renders with different input types', () => {
      const { rerender } = render(<FormField id="email" label="Email" type="email" />)
      expect(screen.getByLabelText(/Email/i)).toHaveAttribute('type', 'email')

      rerender(<FormField id="password" label="Password" type="password" />)
      expect(screen.getByLabelText(/Password/i)).toHaveAttribute('type', 'password')

      rerender(<FormField id="number" label="Number" type="number" />)
      expect(screen.getByLabelText(/Number/i)).toHaveAttribute('type', 'number')
    })

    it('applies custom className', () => {
      const { container } = render(
        <FormField id="test" label="Test" type="text" className="custom-class" />
      )

      expect(container.firstChild).toHaveClass('custom-class')
    })
  })

  describe('Floating Labels', () => {
    it('shows floating label by default', () => {
      render(<FormField id="test" label="Floating Label" type="text" />)

      const label = screen.getByText(/Floating Label/i)
      expect(label).toHaveClass('absolute')
    })

    it('floats label when input is focused', async () => {
      const user = userEvent.setup()
      render(<FormField id="test" label="Test Field" type="text" />)

      const input = screen.getByLabelText(/Test Field/i)
      const label = screen.getByText(/Test Field/i)

      // Initially not floated
      expect(label).toHaveClass('top-1/2')

      // Focus input
      await user.click(input)

      // Should float
      await waitFor(() => {
        expect(label).toHaveClass('top-1.5')
        expect(label).toHaveClass('text-xs')
      })
    })

    it('keeps label floated when input has value', async () => {
      const user = userEvent.setup()
      render(<FormField id="test" label="Test Field" type="text" />)

      const input = screen.getByLabelText(/Test Field/i)
      const label = screen.getByText(/Test Field/i)

      // Type value
      await user.type(input, 'test value')

      // Blur input
      await user.tab()

      // Label should stay floated
      await waitFor(() => {
        expect(label).toHaveClass('top-1.5')
        expect(label).toHaveClass('text-xs')
      })
    })

    it('returns label to default position when empty and blurred', async () => {
      const user = userEvent.setup()
      render(<FormField id="test" label="Test Field" type="text" />)

      const input = screen.getByLabelText(/Test Field/i)
      const label = screen.getByText(/Test Field/i)

      // Focus and blur without typing
      await user.click(input)
      await user.tab()

      // Label should return to default position
      await waitFor(() => {
        expect(label).toHaveClass('top-1/2')
      })
    })

    it('disables floating label when floating=false', () => {
      render(<FormField id="test" label="Static Label" type="text" floating={false} />)

      const label = screen.getByText(/Static Label/i)
      expect(label).not.toHaveClass('absolute')
      expect(label).toHaveClass('block')
    })

    it('shows placeholder with non-floating label', () => {
      render(
        <FormField
          id="test"
          label="Test"
          type="text"
          floating={false}
          placeholder="Enter value"
        />
      )

      expect(screen.getByPlaceholderText('Enter value')).toBeInTheDocument()
    })

    it('hides placeholder with floating label', () => {
      render(
        <FormField
          id="test"
          label="Test"
          type="text"
          floating={true}
          placeholder="Enter value"
        />
      )

      const input = screen.getByLabelText(/Test/i)
      expect(input).toHaveAttribute('placeholder', '')
    })
  })

  describe('Error States', () => {
    it('displays error message', () => {
      render(
        <FormField
          id="test"
          label="Test Field"
          type="text"
          error="This field is required"
        />
      )

      const error = screen.getByText('This field is required')
      expect(error).toBeInTheDocument()
      expect(error).toHaveAttribute('role', 'alert')
    })

    it('applies error styling to input', () => {
      render(
        <FormField
          id="test"
          label="Test Field"
          type="text"
          error="Invalid value"
        />
      )

      const input = screen.getByLabelText(/Test Field/i)
      expect(input).toHaveAttribute('aria-invalid', 'true')
    })

    it('applies error styling to label', () => {
      render(
        <FormField
          id="test"
          label="Test Field"
          type="text"
          error="Invalid value"
        />
      )

      const label = screen.getByText(/Test Field/i)
      expect(label).toHaveClass('text-destructive')
    })

    it('links error message to input with aria-describedby', () => {
      render(
        <FormField
          id="test"
          label="Test Field"
          type="text"
          error="This field is required"
        />
      )

      const input = screen.getByLabelText(/Test Field/i)
      expect(input).toHaveAttribute('aria-describedby', 'test-error')
    })

    it('shows error icon with error message', () => {
      render(
        <FormField
          id="test"
          label="Test Field"
          type="text"
          error="Invalid value"
        />
      )

      const errorMessage = screen.getByText('Invalid value')
      const svg = errorMessage.querySelector('svg')
      expect(svg).toBeInTheDocument()
      expect(svg).toHaveAttribute('aria-hidden', 'true')
    })

    it('hides helper text when error is shown', () => {
      render(
        <FormField
          id="test"
          label="Test Field"
          type="text"
          helperText="Helper text"
          error="Error message"
        />
      )

      expect(screen.getByText('Error message')).toBeInTheDocument()
      expect(screen.queryByText('Helper text')).not.toBeInTheDocument()
    })
  })

  describe('Helper Text', () => {
    it('displays helper text', () => {
      render(
        <FormField
          id="test"
          label="Test Field"
          type="text"
          helperText="This is helper text"
        />
      )

      expect(screen.getByText('This is helper text')).toBeInTheDocument()
    })

    it('links helper text to input with aria-describedby', () => {
      render(
        <FormField
          id="test"
          label="Test Field"
          type="text"
          helperText="Helper text"
        />
      )

      const input = screen.getByLabelText(/Test Field/i)
      expect(input).toHaveAttribute('aria-describedby', 'test-helper')
    })

    it('combines multiple aria-describedby values', () => {
      render(
        <FormField
          id="test"
          label="Test Field"
          type="text"
          helperText="Helper text"
          error="Error message"
        />
      )

      const input = screen.getByLabelText(/Test Field/i)
      expect(input).toHaveAttribute('aria-describedby', 'test-error')
    })
  })

  describe('Character Count', () => {
    it('shows character count when showCharCount=true and maxLength is set', () => {
      render(
        <FormField
          id="test"
          label="Test Field"
          type="text"
          maxLength={50}
          showCharCount
        />
      )

      expect(screen.getByText('0 / 50')).toBeInTheDocument()
    })

    it('updates character count as user types', async () => {
      const user = userEvent.setup()
      render(
        <FormField
          id="test"
          label="Test Field"
          type="text"
          maxLength={50}
          showCharCount
        />
      )

      const input = screen.getByLabelText(/Test Field/i)
      await user.type(input, 'Hello')

      expect(screen.getByText('5 / 50')).toBeInTheDocument()
    })

    it('shows warning color when approaching character limit', async () => {
      const user = userEvent.setup()
      render(
        <FormField
          id="test"
          label="Test Field"
          type="text"
          maxLength={10}
          showCharCount
        />
      )

      const input = screen.getByLabelText(/Test Field/i)
      await user.type(input, '123456789') // 9 chars, >90% of limit

      const charCount = screen.getByText('9 / 10')
      expect(charCount).toHaveClass('text-destructive')
    })

    it('does not show character count when showCharCount=false', () => {
      render(
        <FormField
          id="test"
          label="Test Field"
          type="text"
          maxLength={50}
          showCharCount={false}
        />
      )

      expect(screen.queryByText(/\/ 50/)).not.toBeInTheDocument()
    })

    it('links character count to input with aria-describedby', () => {
      render(
        <FormField
          id="test"
          label="Test Field"
          type="text"
          maxLength={50}
          showCharCount
        />
      )

      const input = screen.getByLabelText(/Test Field/i)
      expect(input).toHaveAttribute('aria-describedby', 'test-charcount')
    })
  })

  describe('Required Field', () => {
    it('shows asterisk for required fields', () => {
      render(<FormField id="test" label="Required Field" type="text" required />)

      const label = screen.getByText(/Required Field/i)
      // Check for asterisk in computed styles (via CSS after: content)
      const styles = window.getComputedStyle(label, '::after')
      expect(label).toHaveClass('after:content-[\'*\']')
    })

    it('applies required attribute to input', () => {
      render(<FormField id="test" label="Test Field" type="text" required />)

      const input = screen.getByLabelText(/Test Field/i)
      expect(input).toBeRequired()
    })
  })

  describe('Controlled Component', () => {
    it('works as controlled component with value prop', () => {
      const { rerender } = render(
        <FormField id="test" label="Test Field" type="text" value="initial" onChange={() => {}} />
      )

      const input = screen.getByLabelText(/Test Field/i) as HTMLInputElement
      expect(input.value).toBe('initial')

      rerender(
        <FormField id="test" label="Test Field" type="text" value="updated" onChange={() => {}} />
      )

      expect(input.value).toBe('updated')
    })

    it('calls onChange handler', async () => {
      const handleChange = vi.fn()
      const user = userEvent.setup()

      render(
        <FormField id="test" label="Test Field" type="text" onChange={handleChange} />
      )

      const input = screen.getByLabelText(/Test Field/i)
      await user.type(input, 'test')

      expect(handleChange).toHaveBeenCalled()
    })

    it('calls onFocus and onBlur handlers', async () => {
      const handleFocus = vi.fn()
      const handleBlur = vi.fn()
      const user = userEvent.setup()

      render(
        <FormField
          id="test"
          label="Test Field"
          type="text"
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
      )

      const input = screen.getByLabelText(/Test Field/i)

      await user.click(input)
      expect(handleFocus).toHaveBeenCalled()

      await user.tab()
      expect(handleBlur).toHaveBeenCalled()
    })
  })

  describe('Textarea Specific', () => {
    it('renders with min-height for textarea', () => {
      render(<FormField id="test" label="Test Field" type="textarea" />)

      const textarea = screen.getByLabelText(/Test Field/i)
      expect(textarea).toHaveClass('min-h-[80px]')
    })

    it('supports rows attribute for textarea', () => {
      render(<FormField id="test" label="Test Field" type="textarea" rows={5} />)

      const textarea = screen.getByLabelText(/Test Field/i)
      expect(textarea).toHaveAttribute('rows', '5')
    })

    it('shows character count for textarea', async () => {
      const user = userEvent.setup()
      render(
        <FormField
          id="test"
          label="Test Field"
          type="textarea"
          maxLength={200}
          showCharCount
        />
      )

      const textarea = screen.getByLabelText(/Test Field/i)
      await user.type(textarea, 'Test content')

      expect(screen.getByText(/12 \/ 200/)).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('associates label with input', () => {
      render(<FormField id="test-input" label="Accessible Field" type="text" />)

      const input = screen.getByLabelText('Accessible Field')
      expect(input).toHaveAttribute('id', 'test-input')
    })

    it('provides aria-invalid when error exists', () => {
      render(
        <FormField
          id="test"
          label="Test Field"
          type="text"
          error="Error message"
        />
      )

      const input = screen.getByLabelText(/Test Field/i)
      expect(input).toHaveAttribute('aria-invalid', 'true')
    })

    it('provides aria-describedby for all descriptive elements', () => {
      render(
        <FormField
          id="test"
          label="Test Field"
          type="text"
          helperText="Helper"
          maxLength={50}
          showCharCount
        />
      )

      const input = screen.getByLabelText(/Test Field/i)
      expect(input).toHaveAttribute('aria-describedby', 'test-helper test-charcount')
    })

    it('marks error message with role="alert"', () => {
      render(
        <FormField
          id="test"
          label="Test Field"
          type="text"
          error="Error message"
        />
      )

      const error = screen.getByRole('alert')
      expect(error).toHaveTextContent('Error message')
    })

    it('marks character count with aria-live="polite"', () => {
      render(
        <FormField
          id="test"
          label="Test Field"
          type="text"
          maxLength={50}
          showCharCount
        />
      )

      const charCount = screen.getByText('0 / 50')
      expect(charCount).toHaveAttribute('aria-live', 'polite')
    })
  })

  describe('Animation', () => {
    it('animates error message entrance', () => {
      render(
        <FormField
          id="test"
          label="Test Field"
          type="text"
          error="Error message"
        />
      )

      const error = screen.getByText('Error message')
      expect(error).toHaveClass('animate-in')
      expect(error).toHaveClass('fade-in')
      expect(error).toHaveClass('slide-in-from-top-1')
    })

    it('animates label transition smoothly', () => {
      render(<FormField id="test" label="Test Field" type="text" />)

      const label = screen.getByText(/Test Field/i)
      expect(label).toHaveClass('transition-all')
      expect(label).toHaveClass('duration-200')
      expect(label).toHaveClass('ease-in-out')
    })
  })

  describe('Edge Cases', () => {
    it('handles defaultValue prop', () => {
      render(
        <FormField
          id="test"
          label="Test Field"
          type="text"
          defaultValue="default value"
        />
      )

      const input = screen.getByLabelText(/Test Field/i) as HTMLInputElement
      expect(input.value).toBe('default value')
    })

    it('handles empty string value', () => {
      render(
        <FormField id="test" label="Test Field" type="text" value="" onChange={() => {}} />
      )

      const input = screen.getByLabelText(/Test Field/i) as HTMLInputElement
      expect(input.value).toBe('')
    })

    it('handles maxLength without showCharCount', () => {
      render(<FormField id="test" label="Test Field" type="text" maxLength={10} />)

      expect(screen.queryByText(/\/ 10/)).not.toBeInTheDocument()
    })
  })
})
