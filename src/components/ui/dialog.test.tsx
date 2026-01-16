import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from './dialog'

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  X: () => <span data-testid="x-icon">X</span>,
}))

describe('Dialog Components', () => {
  describe('Dialog Basic Functionality', () => {
    it('renders dialog trigger and content', async () => {
      const user = userEvent.setup()

      render(
        <Dialog>
          <DialogTrigger>Open Dialog</DialogTrigger>
          <DialogContent>
            <DialogTitle>Dialog Title</DialogTitle>
            <DialogDescription>Dialog Description</DialogDescription>
          </DialogContent>
        </Dialog>
      )

      // Trigger should be visible
      expect(screen.getByText('Open Dialog')).toBeInTheDocument()

      // Content should not be visible initially
      expect(screen.queryByText('Dialog Title')).not.toBeInTheDocument()

      // Open dialog
      await user.click(screen.getByText('Open Dialog'))

      // Content should now be visible
      await waitFor(() => {
        expect(screen.getByText('Dialog Title')).toBeInTheDocument()
        expect(screen.getByText('Dialog Description')).toBeInTheDocument()
      })
    })

    it('closes dialog when close button is clicked', async () => {
      const user = userEvent.setup()

      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <DialogTitle>Title</DialogTitle>
          </DialogContent>
        </Dialog>
      )

      // Open dialog
      await user.click(screen.getByText('Open'))
      await waitFor(() => {
        expect(screen.getByText('Title')).toBeInTheDocument()
      })

      // Close dialog using the X button
      const closeButton = screen.getByRole('button', { name: /close/i })
      await user.click(closeButton)

      // Dialog should close
      await waitFor(() => {
        expect(screen.queryByText('Title')).not.toBeInTheDocument()
      })
    })

    it('closes dialog with explicit DialogClose button', async () => {
      const user = userEvent.setup()

      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <DialogTitle>Title</DialogTitle>
            <DialogFooter>
              <DialogClose asChild>
                <button>Cancel</button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )

      await user.click(screen.getByText('Open'))
      await waitFor(() => {
        expect(screen.getByText('Title')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Cancel'))
      await waitFor(() => {
        expect(screen.queryByText('Title')).not.toBeInTheDocument()
      })
    })

    it('supports controlled dialog state', async () => {
      const handleOpenChange = vi.fn()

      const ControlledDialog = () => {
        const [open, setOpen] = React.useState(false)

        return (
          <Dialog
            open={open}
            onOpenChange={(isOpen) => {
              setOpen(isOpen)
              handleOpenChange(isOpen)
            }}
          >
            <DialogTrigger onClick={() => setOpen(true)}>Open</DialogTrigger>
            <DialogContent>
              <DialogTitle>Controlled Dialog</DialogTitle>
            </DialogContent>
          </Dialog>
        )
      }

      const user = userEvent.setup()
      render(<ControlledDialog />)

      await user.click(screen.getByText('Open'))
      await waitFor(() => {
        expect(screen.getByText('Controlled Dialog')).toBeInTheDocument()
      })
      expect(handleOpenChange).toHaveBeenCalledWith(true)
    })
  })

  describe('DialogContent', () => {
    it('renders with default styles', async () => {
      const user = userEvent.setup()

      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent data-testid="dialog-content">
            <DialogTitle>Title</DialogTitle>
          </DialogContent>
        </Dialog>
      )

      await user.click(screen.getByText('Open'))
      await waitFor(() => {
        const content = screen.getByTestId('dialog-content')
        expect(content).toBeInTheDocument()
        expect(content).toHaveClass('fixed')
        expect(content).toHaveClass('flex')
        expect(content).toHaveClass('flex-col')
        expect(content).toHaveClass('max-w-lg')
      })
    })

    it('has aria-modal attribute', async () => {
      const user = userEvent.setup()

      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent data-testid="dialog-content">
            <DialogTitle>Title</DialogTitle>
          </DialogContent>
        </Dialog>
      )

      await user.click(screen.getByText('Open'))
      await waitFor(() => {
        expect(screen.getByTestId('dialog-content')).toHaveAttribute('aria-modal', 'true')
      })
    })

    it('includes close button with screen reader text', async () => {
      const user = userEvent.setup()

      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <DialogTitle>Title</DialogTitle>
          </DialogContent>
        </Dialog>
      )

      await user.click(screen.getByText('Open'))
      await waitFor(() => {
        expect(screen.getByText('Close')).toHaveClass('sr-only')
        expect(screen.getByTestId('x-icon')).toBeInTheDocument()
      })
    })

    it('accepts custom className', async () => {
      const user = userEvent.setup()

      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent className="custom-dialog" data-testid="dialog-content">
            <DialogTitle>Title</DialogTitle>
          </DialogContent>
        </Dialog>
      )

      await user.click(screen.getByText('Open'))
      await waitFor(() => {
        expect(screen.getByTestId('dialog-content')).toHaveClass('custom-dialog')
      })
    })
  })

  describe('DialogHeader', () => {
    it('renders header content', async () => {
      const user = userEvent.setup()

      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <DialogHeader data-testid="dialog-header">
              <DialogTitle>Header Title</DialogTitle>
              <DialogDescription>Header Description</DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      )

      await user.click(screen.getByText('Open'))
      await waitFor(() => {
        const header = screen.getByTestId('dialog-header')
        expect(header).toBeInTheDocument()
        expect(header).toHaveClass('flex')
        expect(header).toHaveClass('flex-col')
        expect(header).toHaveClass('space-y-1.5')
      })
    })

    it('accepts custom className', async () => {
      const user = userEvent.setup()

      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <DialogHeader className="custom-header" data-testid="header">
              <DialogTitle>Title</DialogTitle>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      )

      await user.click(screen.getByText('Open'))
      await waitFor(() => {
        expect(screen.getByTestId('header')).toHaveClass('custom-header')
      })
    })
  })

  describe('DialogBody', () => {
    it('renders scrollable body content', async () => {
      const user = userEvent.setup()

      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <DialogBody data-testid="dialog-body">
              <p>Body content</p>
            </DialogBody>
          </DialogContent>
        </Dialog>
      )

      await user.click(screen.getByText('Open'))
      await waitFor(() => {
        const body = screen.getByTestId('dialog-body')
        expect(body).toBeInTheDocument()
        expect(body).toHaveClass('flex-1')
        expect(body).toHaveClass('overflow-y-auto')
        expect(body).toHaveClass('min-h-0')
      })
    })

    it('accepts custom className', async () => {
      const user = userEvent.setup()

      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <DialogBody className="custom-body" data-testid="body">
              Content
            </DialogBody>
          </DialogContent>
        </Dialog>
      )

      await user.click(screen.getByText('Open'))
      await waitFor(() => {
        expect(screen.getByTestId('body')).toHaveClass('custom-body')
      })
    })
  })

  describe('DialogFooter', () => {
    it('renders footer with buttons', async () => {
      const user = userEvent.setup()

      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <DialogFooter data-testid="dialog-footer">
              <button>Cancel</button>
              <button>Confirm</button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )

      await user.click(screen.getByText('Open'))
      await waitFor(() => {
        const footer = screen.getByTestId('dialog-footer')
        expect(footer).toBeInTheDocument()
        expect(footer).toHaveClass('flex')
        expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument()
      })
    })

    it('has responsive layout classes', async () => {
      const user = userEvent.setup()

      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <DialogFooter data-testid="footer">
              <button>Action</button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )

      await user.click(screen.getByText('Open'))
      await waitFor(() => {
        const footer = screen.getByTestId('footer')
        expect(footer).toHaveClass('flex-col-reverse')
        expect(footer).toHaveClass('sm:flex-row')
        expect(footer).toHaveClass('sm:justify-end')
      })
    })
  })

  describe('DialogTitle', () => {
    it('renders title with proper styling', async () => {
      const user = userEvent.setup()

      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <DialogTitle data-testid="title">Dialog Title</DialogTitle>
          </DialogContent>
        </Dialog>
      )

      await user.click(screen.getByText('Open'))
      await waitFor(() => {
        const title = screen.getByTestId('title')
        expect(title).toHaveTextContent('Dialog Title')
        expect(title).toHaveClass('text-lg')
        expect(title).toHaveClass('font-semibold')
        expect(title).toHaveClass('leading-none')
      })
    })

    it('accepts custom className', async () => {
      const user = userEvent.setup()

      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <DialogTitle className="custom-title" data-testid="title">
              Title
            </DialogTitle>
          </DialogContent>
        </Dialog>
      )

      await user.click(screen.getByText('Open'))
      await waitFor(() => {
        expect(screen.getByTestId('title')).toHaveClass('custom-title')
      })
    })
  })

  describe('DialogDescription', () => {
    it('renders description with proper styling', async () => {
      const user = userEvent.setup()

      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <DialogTitle>Title</DialogTitle>
            <DialogDescription data-testid="description">
              Description text
            </DialogDescription>
          </DialogContent>
        </Dialog>
      )

      await user.click(screen.getByText('Open'))
      await waitFor(() => {
        const description = screen.getByTestId('description')
        expect(description).toHaveTextContent('Description text')
        expect(description).toHaveClass('text-sm')
        expect(description).toHaveClass('text-muted-foreground')
      })
    })

    it('accepts custom className', async () => {
      const user = userEvent.setup()

      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <DialogTitle>Title</DialogTitle>
            <DialogDescription className="custom-desc" data-testid="desc">
              Description
            </DialogDescription>
          </DialogContent>
        </Dialog>
      )

      await user.click(screen.getByText('Open'))
      await waitFor(() => {
        expect(screen.getByTestId('desc')).toHaveClass('custom-desc')
      })
    })
  })

  describe('Complete Dialog Structure', () => {
    it('renders full dialog with all components', async () => {
      const handleSubmit = vi.fn()
      const user = userEvent.setup()

      render(
        <Dialog>
          <DialogTrigger>Open Form</DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Form Dialog</DialogTitle>
              <DialogDescription>Fill out the form below</DialogDescription>
            </DialogHeader>
            <DialogBody>
              <form id="test-form" onSubmit={handleSubmit}>
                <input placeholder="Enter text" />
              </form>
            </DialogBody>
            <DialogFooter>
              <DialogClose asChild>
                <button type="button">Cancel</button>
              </DialogClose>
              <button type="submit" form="test-form">Submit</button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )

      await user.click(screen.getByText('Open Form'))
      await waitFor(() => {
        expect(screen.getByText('Form Dialog')).toBeInTheDocument()
        expect(screen.getByText('Fill out the form below')).toBeInTheDocument()
        expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('traps focus within dialog', async () => {
      const user = userEvent.setup()

      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <DialogTitle>Title</DialogTitle>
            <DialogFooter>
              <button>First Button</button>
              <button>Second Button</button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )

      await user.click(screen.getByText('Open'))
      await waitFor(() => {
        expect(screen.getByText('Title')).toBeInTheDocument()
      })

      // Tab through focusable elements
      await user.tab()
      expect(screen.getByRole('button', { name: 'First Button' })).toHaveFocus()

      await user.tab()
      expect(screen.getByRole('button', { name: 'Second Button' })).toHaveFocus()
    })

    it('closes on Escape key', async () => {
      const user = userEvent.setup()

      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <DialogTitle>Title</DialogTitle>
          </DialogContent>
        </Dialog>
      )

      await user.click(screen.getByText('Open'))
      await waitFor(() => {
        expect(screen.getByText('Title')).toBeInTheDocument()
      })

      await user.keyboard('{Escape}')
      await waitFor(() => {
        expect(screen.queryByText('Title')).not.toBeInTheDocument()
      })
    })
  })
})
