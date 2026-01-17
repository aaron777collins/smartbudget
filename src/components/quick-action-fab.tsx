'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, CreditCard, PieChart, X } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

/**
 * Quick Action Floating Action Button (FAB)
 *
 * Provides easy access to common actions from anywhere in the app:
 * - Add Transaction
 * - Create Budget
 *
 * Design:
 * - Shows only on mobile/tablet (hidden on desktop with md:hidden)
 * - Fixed bottom-right position with proper spacing
 * - Expands upward to reveal action buttons
 * - Smooth animations using Framer Motion
 * - Uses brand colors and proper shadows for depth
 *
 * Accessibility:
 * - Keyboard navigable
 * - Clear labels for screen readers
 * - Proper z-index to stay above content
 * - Escape key closes the expanded menu
 */
export function QuickActionFAB() {
  const [open, setOpen] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  const toggleOpen = () => setOpen(!open);

  // Close FAB when Escape key is pressed
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && open) {
        setOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open]);

  // If user prefers reduced motion, render simplified version without animations
  if (shouldReduceMotion) {
    return (
      <div className="fixed bottom-6 right-6 z-50 md:hidden">
        <div className="flex flex-col items-end gap-3">
          {/* Action Buttons - Show without animation when open */}
          {open && (
            <div className="flex flex-col items-end gap-3">
              {/* Create Budget Action */}
              <Link href="/budgets/create">
                <Button
                  size="lg"
                  variant="secondary"
                  className="h-14 rounded-full shadow-lg hover:shadow-xl transition-shadow px-6 gap-2"
                  onClick={() => setOpen(false)}
                >
                  <PieChart className="h-5 w-5" />
                  <span className="font-medium">New Budget</span>
                </Button>
              </Link>

              {/* Add Transaction Action */}
              <Link href="/transactions">
                <Button
                  size="lg"
                  variant="secondary"
                  className="h-14 rounded-full shadow-lg hover:shadow-xl transition-shadow px-6 gap-2"
                  onClick={() => setOpen(false)}
                >
                  <CreditCard className="h-5 w-5" />
                  <span className="font-medium">Add Transaction</span>
                </Button>
              </Link>
            </div>
          )}

          {/* Main FAB Button - Always visible */}
          <Button
            size="icon"
            className={cn(
              'h-16 w-16 rounded-full shadow-xl hover:shadow-2xl transition-shadow',
              open && 'bg-primary/90'
            )}
            onClick={toggleOpen}
            aria-label={open ? 'Close quick actions' : 'Open quick actions'}
          >
            {open ? (
              <X className="h-7 w-7" />
            ) : (
              <Plus className="h-7 w-7" />
            )}
          </Button>
        </div>
      </div>
    );
  }

  // Full animated version for users who don't prefer reduced motion
  return (
    <div className="fixed bottom-6 right-6 z-50 md:hidden">
      <div className="flex flex-col items-end gap-3">
        {/* Action Buttons - Only show when expanded */}
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col items-end gap-3"
            >
              {/* Create Budget Action */}
              <Link href="/budgets/create">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  transition={{ duration: 0.2, delay: 0.05 }}
                >
                  <Button
                    size="lg"
                    variant="secondary"
                    className="h-14 rounded-full shadow-lg hover:shadow-xl transition-shadow px-6 gap-2"
                    onClick={() => setOpen(false)}
                  >
                    <PieChart className="h-5 w-5" />
                    <span className="font-medium">New Budget</span>
                  </Button>
                </motion.div>
              </Link>

              {/* Add Transaction Action */}
              <Link href="/transactions">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Button
                    size="lg"
                    variant="secondary"
                    className="h-14 rounded-full shadow-lg hover:shadow-xl transition-shadow px-6 gap-2"
                    onClick={() => setOpen(false)}
                  >
                    <CreditCard className="h-5 w-5" />
                    <span className="font-medium">Add Transaction</span>
                  </Button>
                </motion.div>
              </Link>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main FAB Button - Always visible */}
        <motion.div
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <Button
            size="icon"
            className={cn(
              'h-16 w-16 rounded-full shadow-xl hover:shadow-2xl transition-shadow',
              open && 'bg-primary/90'
            )}
            onClick={toggleOpen}
            aria-label={open ? 'Close quick actions' : 'Open quick actions'}
          >
            {open ? (
              <X className="h-7 w-7" />
            ) : (
              <Plus className="h-7 w-7" />
            )}
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
