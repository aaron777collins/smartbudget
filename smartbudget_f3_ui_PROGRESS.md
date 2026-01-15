# Progress: smartbudget_f3_ui

Started: Thu Jan 15 01:17:42 PM EST 2026

## Status

IN_PROGRESS

## Codebase Analysis

### Current State Overview

**Technology Stack:**
- Framework: Next.js 16.1.1 (App Router) with React 19.2.3
- Styling: Tailwind CSS 3.4.19 with tailwindcss-animate
- UI Components: shadcn/ui (21 components) built on Radix UI primitives
- Charts: Recharts 3.6.0 + D3.js 7.9.0 + d3-sankey 0.12.3
- Icons: Lucide React 0.562.0
- Theme: next-themes 0.4.6 (light/dark/system modes)
- Auth: NextAuth.js v5 beta
- Database: Prisma ORM
- State Management: React hooks + Server Components
- Notifications: Sonner 2.0.7

**File Structure:**
```
/src
├── /app                    # Next.js App Router pages + API routes
├── /components
│   ├── /ui                 # 21 shadcn/ui base components
│   ├── /dashboard          # Dashboard-specific components
│   ├── /transactions       # Transaction management components
│   ├── /budgets            # Budget components
│   └── header.tsx, sidebar.tsx, app-layout.tsx
├── /lib                    # Utilities and helpers
└── /types                  # TypeScript definitions
```

### What Already Exists

**Design System Foundation:**
- ✅ 4 CSS variables defined in globals.css (--background, --foreground, --primary, --muted-foreground)
- ✅ Tailwind CSS utility-first approach
- ✅ shadcn/ui component library with consistent variants (CVA pattern)
- ✅ Inter font from Google Fonts
- ⚠️ **Gap**: No comprehensive design token system, no dark mode CSS variables, inconsistent spacing usage

**Dashboard & Visualizations:**
- ✅ 8 chart components already implemented:
  - SpendingTrendsChart (Recharts stacked area)
  - CategoryBreakdownChart (Recharts pie chart)
  - CashFlowSankey (D3 sankey diagram)
  - CategoryHeatmap (D3 heatmap)
  - CategoryCorrelationMatrix (D3 correlation matrix)
  - NetWorthCard, MonthlySpendingCard, MonthlyIncomeCard, CashFlowCard (metric cards)
- ✅ TimeframeSelector for filtering visualizations
- ✅ Lazy loading for D3 components with Suspense
- ⚠️ **Gap**: Charts lack smooth animations, no count-up animations, limited interactivity, no gradient enhancements

**Animations & Interactions:**
- ✅ Basic Tailwind animations: animate-pulse (skeletons), animate-spin (loaders)
- ✅ Radix UI component animations: fade-in/out, zoom, slide for dialogs/popovers/dropdowns
- ✅ CSS transitions on buttons, inputs, switches (transition-colors, transition-all)
- ✅ Theme toggle with icon rotation animation
- ✅ react-dropzone for file drag-and-drop
- ⚠️ **Gap**: No animation library (Framer Motion), no micro-interactions, no page transitions, no count-up effects, no mobile gestures (swipe), no list stagger animations

**Transaction Management:**
- ✅ Transaction table with search and filtering
- ✅ Transaction detail dialog
- ✅ Advanced filters, split transaction editor, export dialog
- ✅ Category selector, tag selector
- ⚠️ **Gap**: No smooth list animations, no swipe gestures, no stagger loading, basic empty states

**Budget Management:**
- ✅ Budget cards with progress bars
- ✅ Budget creation and editing forms
- ✅ Budget analytics page with charts
- ⚠️ **Gap**: Progress bars lack smooth animations, no color-coded status indicators, no celebratory animations

**Dark Mode:**
- ✅ next-themes with system preference detection
- ✅ Theme toggle component in header (3 options: light/dark/system)
- ✅ Extensive use of dark: utility classes (72+ instances)
- ⚠️ **Gap**: No dark mode CSS variables defined, no smooth theme transition animation, colors not optimized for OLED

**Mobile/Responsive:**
- ✅ Mobile-first Tailwind breakpoints (sm:, md:, lg:, xl:)
- ✅ Responsive grids: grid-cols-1 → md:grid-cols-2 → lg:grid-cols-3/4
- ✅ Sidebar hidden on mobile (hidden md:flex)
- ✅ Input text sizing: text-base → md:text-sm
- ⚠️ **Gap**: No mobile navigation (bottom tabs, hamburger menu), no swipe gestures, tap targets slightly small (40px vs 44px recommended), no mobile-optimized navigation

**Loading & Empty States:**
- ✅ Skeleton component with animate-pulse
- ✅ Used in dashboard, budgets, goals, charts
- ✅ Spinner icons (Loader2) with animate-spin for async operations
- ✅ Empty states with icons, headings, messages, CTAs (inline implementations)
- ⚠️ **Gap**: No dedicated EmptyState component, no custom illustrations (only Lucide icons), no skeleton screens for tables

**Accessibility:**
- ✅ Comprehensive ARIA labels on charts (role="img", aria-label)
- ✅ Navigation landmarks (aria-label on nav, sidebar, header)
- ✅ Keyboard navigation via Radix UI primitives (dialogs, dropdowns, selects, tabs)
- ✅ Focus indicators on all interactive elements (focus-visible:ring-2)
- ✅ Skip-to-main-content link in root layout
- ✅ Semantic HTML (proper tables, headings, main element)
- ✅ Screen reader support (aria-current, aria-hidden on decorative icons, sr-only class)
- ⚠️ **Gap**: Limited ARIA live regions, no reduced motion preferences respected in custom animations

**Error Handling:**
- ✅ 3-layer error boundary system (global, app-level, component-level)
- ✅ Sentry integration for error monitoring
- ✅ Simple error cards with red borders and retry buttons
- ✅ Error states in all data-fetching components

### What Needs Improvement

**Critical Gaps (High Priority):**

1. **Design System Completeness**
   - Missing: Comprehensive design tokens for spacing, colors, typography
   - Missing: Dark mode CSS variables (only Tailwind dark: classes)
   - Missing: Documented spacing scale (inconsistent px values throughout)
   - Missing: Border-radius token system
   - Missing: Comprehensive color palette with semantic colors

2. **Animation & Micro-interactions**
   - Missing: Animation library (Framer Motion or similar)
   - Missing: Page transition animations
   - Missing: Count-up animations for metrics
   - Missing: Stagger animations for lists
   - Missing: Progress bar animations
   - Missing: Success/celebration animations
   - Missing: Scroll-based animations

3. **Mobile Experience**
   - Missing: Mobile navigation (bottom tabs or hamburger menu)
   - Missing: Touch gestures (swipe to delete, pull to refresh)
   - Missing: Mobile-optimized tap targets (44px minimum)
   - Missing: Keyboard handling for mobile inputs

4. **Chart Enhancements**
   - Missing: Smooth loading animations for charts
   - Missing: Enhanced gradients and visual polish
   - Missing: More interactive tooltips
   - Missing: Chart theme optimization for dark mode

5. **Empty States & Loading**
   - Missing: Custom illustrations or high-quality empty state graphics
   - Missing: Dedicated EmptyState component
   - Missing: Skeleton screens for tables/lists
   - Missing: Optimistic UI patterns

**Medium Priority Gaps:**

1. **Transaction UI Polish**
   - Basic transaction cards, could be more visually engaging
   - No hover/swipe interactions on mobile
   - No grouping animations
   - No smooth reordering

2. **Budget UI Enhancement**
   - Progress bars lack smooth animations
   - No color-coded status system (green/yellow/orange/red)
   - No multi-step wizard for budget creation
   - No celebratory animations on creation

3. **Dashboard Metrics**
   - Metric cards are functional but lack visual polish
   - No trend indicators (sparklines exist but could be enhanced)
   - No number count-up animations
   - No hover effects with additional details

4. **Performance**
   - No bundle size analysis mentioned
   - No virtualization for long lists
   - No image optimization strategy
   - No service worker for offline support

**Low Priority Gaps:**

1. Form enhancements (floating labels, advanced validation animations)
2. Toast notification customization
3. Advanced keyboard shortcuts
4. High contrast mode support
5. Comprehensive user preferences

## Implementation Strategy

### Phase Dependencies

```
Phase 1 (Design System) → Foundation for all other phases
Phase 2 (Dashboard) → Requires Phase 1 tokens
Phase 3 (Transactions) → Requires Phase 1 tokens + Phase 5 animations
Phase 4 (Budgets) → Requires Phase 1 tokens + Phase 5 animations
Phase 5 (Animations) → Can start after Phase 1, needed by 2-4
Phase 6 (Mobile) → Requires Phase 1, benefits from Phase 5
Phase 7 (Dark Mode) → Requires Phase 1 tokens
Phase 8 (Loading/Empty) → Requires Phase 1 tokens + Phase 5 animations
Phase 9 (Accessibility) → Can run in parallel, audit after other phases
Phase 10 (Performance) → Final optimization after all features
```

### Recommended Task Order

1. **Phase 1 (Design System)** - Establishes foundation
2. **Phase 5 (Animations)** - Install libraries and create animation utilities
3. **Phase 2 (Dashboard)** - Enhance charts with new tokens and animations
4. **Phase 7 (Dark Mode)** - Perfect theme system while working on visual components
5. **Phase 8 (Loading/Empty)** - Create reusable states for all features
6. **Phase 3 (Transactions)** - Polish transaction UI with animations
7. **Phase 4 (Budgets)** - Enhance budget UI with animations
8. **Phase 6 (Mobile)** - Add mobile-specific features
9. **Phase 9 (Accessibility)** - Audit and fix accessibility issues
10. **Phase 10 (Performance)** - Final optimization and bundle analysis

## Task List

### Phase 1: Design System Enhancement (FOUNDATION)

- [ ] Task 1.1a: Audit and document current typography usage across all components
- [ ] Task 1.1b: Create comprehensive CSS custom properties file (design-tokens.css) with:
  - Typography scale (font-size, line-height, letter-spacing, font-weight)
  - Color palette (primary, secondary, semantic colors, 9-step grayscale)
  - Dark mode color mappings
- [ ] Task 1.1c: Update globals.css to import design tokens and remove hardcoded values
- [ ] Task 1.1d: Test all components with new CSS variables for regressions
- [ ] Task 1.2a: Define spacing scale constants (4px base: 4, 8, 12, 16, 24, 32, 48, 64, 96px)
- [ ] Task 1.2b: Define border-radius scale (sm: 4px, md: 8px, lg: 12px, xl: 16px, full: 9999px)
- [ ] Task 1.2c: Audit codebase for magic numbers and replace with spacing tokens
- [ ] Task 1.2d: Update Tailwind config to use design tokens (if not using arbitrary values)
- [ ] Task 1.3: Verify WCAG AA contrast ratios for all text colors (4.5:1 minimum)
- [ ] Task 1.4: Document design system in design-system.md file (colors, typography, spacing, components)

### Phase 5: Animation Library Setup (DEPENDENCY FOR 2-4)

- [ ] Task 5.0a: Install Framer Motion: `npm install framer-motion`
- [ ] Task 5.0b: Create animation utilities file (lib/animation-utils.ts) with common animation variants
- [ ] Task 5.0c: Add prefers-reduced-motion detection utility
- [ ] Task 5.1a: Create page transition wrapper component using Framer Motion AnimatePresence
- [ ] Task 5.1b: Apply page transitions to main routes (dashboard, transactions, budgets, etc.)
- [ ] Task 5.1c: Create scroll-based animation utilities with Framer Motion's useScroll hook
- [ ] Task 5.2a: Create reusable micro-interaction components (AnimatedButton, AnimatedCard, etc.)
- [ ] Task 5.2b: Add ripple effect utility for button clicks
- [ ] Task 5.2c: Create stagger animation utility for lists
- [ ] Task 5.2d: Create count-up animation hook for metrics
- [ ] Task 5.3: Test all animations respect prefers-reduced-motion media query

### Phase 2: Dashboard Enhancement

- [ ] Task 2.1a: Add smooth entrance animations to SpendingTrendsChart (Recharts with Framer Motion wrapper)
- [ ] Task 2.1b: Add smooth entrance animations to CategoryBreakdownChart
- [ ] Task 2.1c: Enhance chart gradients and visual styling with design tokens
- [ ] Task 2.1d: Add interactive tooltips with richer data to all charts
- [ ] Task 2.1e: Optimize chart colors for dark mode using design tokens
- [ ] Task 2.2a: Enhance metric cards (NetWorthCard, MonthlySpendingCard, etc.) with count-up animations
- [ ] Task 2.2b: Add hover effects to metric cards with additional details
- [ ] Task 2.2c: Add trend indicators (arrows, percentages) with color coding
- [ ] Task 2.2d: Add subtle gradient backgrounds or patterns to cards
- [ ] Task 2.3a: Create quick action FAB or action bar component for mobile
- [ ] Task 2.3b: Add "Add Transaction" quick action (prominent button)
- [ ] Task 2.3c: Create Smart Insights section component with AI-powered tips
- [ ] Task 2.3d: Add Recent Transactions preview with stagger animation

### Phase 7: Dark Mode Polish

- [ ] Task 7.1a: Add dark mode CSS variables to design-tokens.css
- [ ] Task 7.1b: Audit all dark: utility classes for proper contrast (WCAG AA)
- [ ] Task 7.1c: Test all charts in dark mode and adjust colors if needed
- [ ] Task 7.1d: Add smooth theme transition animation (Framer Motion layout animation)
- [ ] Task 7.1e: Optimize for OLED displays (true black #000000 backgrounds)
- [ ] Task 7.2: Test theme switching with no visual glitches or flashes

### Phase 8: Loading States & Empty States

- [ ] Task 8.1a: Create dedicated skeleton screen for table rows
- [ ] Task 8.1b: Add animated gradient shimmer to skeleton component
- [ ] Task 8.1c: Create optimistic UI utility for instant updates
- [ ] Task 8.1d: Add progress indicators for long operations (with percentage)
- [ ] Task 8.2a: Create reusable EmptyState component with illustration prop
- [ ] Task 8.2b: Find or create high-quality empty state illustrations (SVG)
- [ ] Task 8.2c: Update all empty states to use EmptyState component (transactions, budgets, goals, etc.)
- [ ] Task 8.2d: Add contextual messages and clear CTAs to all empty states

### Phase 3: Transaction Management Polish

- [ ] Task 3.1a: Enhance transaction card design with category icons and colors
- [ ] Task 3.1b: Add smooth list entrance animations with stagger effect
- [ ] Task 3.1c: Implement grouping headers with sticky positioning
- [ ] Task 3.1d: Add hover effects to transaction cards (scale, shadow)
- [ ] Task 3.1e: Implement swipe gestures on mobile (swipe left to delete, right to edit)
- [ ] Task 3.2a: Enhance transaction form modal with slide-in animation
- [ ] Task 3.2b: Add floating label animations to form inputs
- [ ] Task 3.2c: Create visual category selector grid with icons
- [ ] Task 3.2d: Add success animation after transaction save
- [ ] Task 3.2e: Implement undo toast notification after delete

### Phase 4: Budget Management Enhancement

- [ ] Task 4.1a: Add smooth progress bar animations to budget cards
- [ ] Task 4.1b: Implement color-coded status system (green/yellow/orange/red based on usage)
- [ ] Task 4.1c: Add animated transitions between budget status states
- [ ] Task 4.1d: Add hover effects with detailed breakdown
- [ ] Task 4.2a: Create multi-step wizard component for budget creation
- [ ] Task 4.2b: Add progress indicator to budget creation wizard
- [ ] Task 4.2c: Implement suggested amounts based on historical data
- [ ] Task 4.2d: Add celebratory animation on budget creation (confetti or success animation)

### Phase 6: Mobile Optimization

- [ ] Task 6.1a: Create bottom tab navigation component for mobile (Dashboard, Transactions, Budgets, More)
- [ ] Task 6.1b: Create hamburger menu component for secondary navigation
- [ ] Task 6.1c: Update app layout to show bottom tabs on mobile (< 768px)
- [ ] Task 6.1d: Audit all tap targets and increase to 44px minimum
- [ ] Task 6.1e: Test all forms on mobile with keyboard open (adjust viewport)
- [ ] Task 6.1f: Test responsive breakpoints on real devices (iOS Safari, Android Chrome)
- [ ] Task 6.2a: Install gesture library: `npm install react-use-gesture` or similar
- [ ] Task 6.2b: Implement swipe gestures for transaction list items
- [ ] Task 6.2c: Add pull-to-refresh gesture on lists
- [ ] Task 6.2d: Optimize scrolling performance (momentum, snap points)
- [ ] Task 6.2e: Test touch interactions don't conflict with browser defaults

### Phase 9: Accessibility & Usability

- [ ] Task 9.1a: Run WAVE accessibility audit on all pages and fix errors
- [ ] Task 9.1b: Run axe DevTools audit and fix violations
- [ ] Task 9.1c: Add ARIA live regions for dynamic content updates
- [ ] Task 9.1d: Test complete keyboard navigation flow (no mouse)
- [ ] Task 9.1e: Test screen reader navigation (NVDA, JAWS, or VoiceOver)
- [ ] Task 9.1f: Add keyboard shortcuts for common actions (document in help)
- [ ] Task 9.2a: Add tooltips to icon buttons with keyboard shortcut hints
- [ ] Task 9.2b: Enhance error messages with actionable solutions
- [ ] Task 9.2c: Add confirmation dialogs for destructive actions
- [ ] Task 9.2d: Create user preferences page (currency, date format, default views)

### Phase 10: Performance Optimization

- [ ] Task 10.1a: Run webpack-bundle-analyzer to identify large dependencies
- [ ] Task 10.1b: Implement code splitting for heavy routes
- [ ] Task 10.1c: Lazy load non-critical components beyond current D3 lazy loading
- [ ] Task 10.1d: Optimize images (convert to WebP, use next/image)
- [ ] Task 10.1e: Implement virtualization for transaction list (react-virtual or similar)
- [ ] Task 10.1f: Memoize expensive chart components with React.memo
- [ ] Task 10.2a: Implement service worker for offline support
- [ ] Task 10.2b: Add LocalStorage caching for user preferences
- [ ] Task 10.2c: Implement optimistic UI for all mutations (already in Task 8.1c)
- [ ] Task 10.2d: Reserve space for dynamic content to prevent layout shifts
- [ ] Task 10.3a: Run Lighthouse audit on all pages
- [ ] Task 10.3b: Achieve Lighthouse performance score > 90
- [ ] Task 10.3c: Achieve Lighthouse accessibility score = 100
- [ ] Task 10.3d: Fix any Lighthouse best practices issues

### Phase 11: Testing & Documentation

- [ ] Task 11.1: Visual regression testing on dashboard, transactions, budgets pages
- [ ] Task 11.2: Cross-browser testing (Chrome, Firefox, Safari, Edge)
- [ ] Task 11.3: Mobile device testing (iOS Safari, Android Chrome) with real devices
- [ ] Task 11.4: Performance testing on 3G network (Lighthouse mobile simulation)
- [ ] Task 11.5: Animation performance testing (ensure 60fps)
- [ ] Task 11.6: Dark mode visual testing on all pages
- [ ] Task 11.7: Empty state testing (verify all scenarios show proper empty states)
- [ ] Task 11.8: Loading state testing (verify skeletons show during delays)
- [ ] Task 11.9: Error state testing (force errors and verify handling)
- [ ] Task 11.10: Update design-system.md with all component patterns and guidelines

## Contingency Plans

### If Animation Performance Is Poor

**Symptoms**: Janky animations, frame drops, stuttering scrolls
**Options**:
1. **Simplify animations**: Reduce complexity, use CSS instead of JS where possible
2. **Conditional animations**: Detect device capability, disable complex animations on low-end devices
3. **Optimize animation code**: Use only transform/opacity properties, implement will-change carefully
4. **Progressive enhancement**: Provide basic experience without animations, enhance for capable devices

### If Bundle Size Exceeds Budget

**Symptoms**: Initial load > 200KB gzipped, slow First Contentful Paint
**Options**:
1. **Aggressive code splitting**: Split by route, split Framer Motion if too large
2. **Replace heavy dependencies**: Consider lightweight animation alternatives (CSS-only, minimal JS libraries)
3. **Defer non-critical features**: Load animations only when needed
4. **Tree shaking audit**: Ensure unused code is eliminated

### If Mobile Navigation Doesn't Fit

**Symptoms**: Bottom tabs feel cramped, navigation confusing
**Options**:
1. **Hamburger menu only**: Skip bottom tabs, use drawer navigation
2. **3-tab navigation**: Reduce to only Dashboard, Transactions, More (with nested menu)
3. **Hybrid approach**: Bottom tabs + hamburger for secondary features

### If Dark Mode Colors Fail Accessibility

**Symptoms**: WCAG AA contrast failures, readability issues
**Options**:
1. **Adjust color values**: Lighten text on dark backgrounds, darken backgrounds for more contrast
2. **Use elevated surfaces**: Layer cards with lighter grays on dark mode
3. **Provide high contrast mode**: Additional theme option for maximum contrast

## Notes

### Critical Success Factors

1. **Design tokens must be comprehensive and consistent** - This is the foundation for everything else
2. **Animations must respect prefers-reduced-motion** - Accessibility is non-negotiable
3. **Mobile experience must be tested on real devices** - Simulator testing is insufficient
4. **Performance budget must be maintained** - Don't sacrifice speed for beauty
5. **Dark mode must be indistinguishable in quality** - Not an afterthought

### Technical Decisions

**Animation Library Choice**: Framer Motion recommended because:
- React-first, excellent TypeScript support
- Powerful animation primitives
- Built-in gesture support
- Automatic accessibility (respects prefers-reduced-motion)
- Good bundle size for features provided (~30-40KB gzipped)

**Mobile Navigation Choice**: Bottom tabs + hamburger recommended because:
- Thumb-friendly for mobile users
- Industry standard pattern (iOS/Android apps)
- Clear primary actions always visible
- Secondary features in hamburger menu

**Design Token Strategy**: CSS custom properties recommended because:
- Easy theme switching
- No build step needed
- Can be updated at runtime
- Tailwind can reference them

### Potential Risks

1. **Scope creep**: Feature list is extensive, must prioritize ruthlessly
2. **Animation overload**: Too many animations can distract and slow down UX
3. **Mobile gestures conflicts**: Must not interfere with browser defaults
4. **Bundle size growth**: Adding Framer Motion + other libs increases bundle
5. **Dark mode edge cases**: Many components to test in both themes

### Time Estimates (Rough)

- Phase 1 (Design System): 4-6 hours
- Phase 5 (Animations Setup): 3-4 hours
- Phase 2 (Dashboard): 6-8 hours
- Phase 7 (Dark Mode): 3-4 hours
- Phase 8 (Loading/Empty): 4-5 hours
- Phase 3 (Transactions): 5-6 hours
- Phase 4 (Budgets): 4-5 hours
- Phase 6 (Mobile): 6-8 hours
- Phase 9 (Accessibility): 5-6 hours
- Phase 10 (Performance): 4-6 hours
- Phase 11 (Testing): 4-6 hours

**Total estimate**: 48-68 hours (6-8.5 days of focused work)

### Key Files to Modify

**Design System**:
- `/src/app/globals.css` - Add design tokens
- `/src/lib/design-tokens.css` - New file for comprehensive tokens

**Animation Setup**:
- `/src/lib/animation-utils.ts` - New file for animation utilities
- `/src/components/ui/animated-*` - New animated component variants

**Dashboard**:
- `/src/app/dashboard/dashboard-client.tsx`
- `/src/components/dashboard/*.tsx` (all chart components)

**Mobile**:
- `/src/components/mobile-nav.tsx` - New bottom tabs
- `/src/components/hamburger-menu.tsx` - New hamburger menu
- `/src/components/app-layout.tsx` - Update for mobile nav

**Empty States**:
- `/src/components/ui/empty-state.tsx` - New reusable component

**Accessibility**:
- All interactive components need ARIA live region updates

**Performance**:
- `next.config.js` - Bundle optimization
- Various component files for memoization

### Resources & References

**Design Inspiration**:
- Stripe Dashboard (polish and micro-interactions)
- Linear App (smooth animations and transitions)
- Notion (empty states and loading patterns)
- Dribbble/Mobbin (finance app design patterns)

**Technical Resources**:
- Framer Motion docs: https://www.framer.com/motion/
- Tailwind CSS docs: https://tailwindcss.com/
- WCAG 2.1 guidelines: https://www.w3.org/WAI/WCAG21/quickref/
- Lighthouse metrics: https://web.dev/vitals/

**Testing Tools**:
- Lighthouse (Chrome DevTools)
- WAVE browser extension
- axe DevTools browser extension
- Color contrast analyzer
- React DevTools Profiler

## Next Steps for Build Mode

When build mode begins, start with:
1. **Phase 1, Task 1.1a**: Audit typography usage
2. Continue in order through the task list
3. Test each phase thoroughly before moving to the next
4. Update this progress file with completed tasks
5. Document any deviations or issues encountered

Build mode should mark tasks as complete with `[x]` and add notes about implementation decisions or challenges faced.
