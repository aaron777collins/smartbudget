# SmartBudget Design System

## Overview
This document defines the design tokens and guidelines for SmartBudget to ensure consistency across the application.

## Spacing Scale

### Base Unit: 8px (0.5rem)
Our spacing scale follows an 8px base unit system for consistent rhythm throughout the application.

### Available Spacing Tokens

| Token | Value | Pixels | Use Case |
|-------|-------|--------|----------|
| `--spacing-0` | 0 | 0px | Zero spacing |
| `--spacing-1` | 0.25rem | 4px | Tight spacing, icon gaps |
| `--spacing-2` | 0.5rem | 8px | Small gaps, compact layouts |
| `--spacing-3` | 0.75rem | 12px | Default small padding |
| `--spacing-4` | 1rem | 16px | Standard padding/margin |
| `--spacing-5` | 1.25rem | 20px | Medium spacing |
| `--spacing-6` | 1.5rem | 24px | Large padding, section gaps |
| `--spacing-8` | 2rem | 32px | Extra large spacing |
| `--spacing-10` | 2.5rem | 40px | Section padding |
| `--spacing-12` | 3rem | 48px | Major sections |
| `--spacing-16` | 4rem | 64px | Large page sections |
| `--spacing-20` | 5rem | 80px | Extra large sections |
| `--spacing-24` | 6rem | 96px | Hero sections, major spacing |

### Usage in Tailwind

Use Tailwind utilities with the spacing scale:

```tsx
// Padding
<div className="p-4">     {/* 16px padding all sides */}
<div className="px-6">    {/* 24px horizontal padding */}
<div className="py-8">    {/* 32px vertical padding */}

// Margin
<div className="m-4">     {/* 16px margin all sides */}
<div className="mb-6">    {/* 24px bottom margin */}
<div className="mt-12">   {/* 48px top margin */}

// Gap (for flexbox/grid)
<div className="gap-4">   {/* 16px gap */}
<div className="gap-6">   {/* 24px gap */}
```

### Usage in CSS

Use CSS variables directly:

```css
.custom-component {
  padding: var(--spacing-4);
  margin-bottom: var(--spacing-6);
  gap: var(--spacing-3);
}
```

### Guidelines

**DO:**
- ✅ Use spacing tokens for all padding, margin, and gap values
- ✅ Prefer smaller spacing (2-6) for component internals
- ✅ Use larger spacing (8-24) for page sections and layout
- ✅ Maintain consistent spacing within similar components
- ✅ Use the same spacing scale for both horizontal and vertical rhythm

**DON'T:**
- ❌ Use arbitrary spacing values (e.g., `p-[13px]`)
- ❌ Mix spacing systems (stick to this scale)
- ❌ Use negative margins excessively
- ❌ Create custom spacing variables outside this scale

## Border Radius

### Available Radius Tokens

| Token | Value | Use Case |
|-------|-------|----------|
| `--radius` | 0.5rem (8px) | Base radius |
| `rounded-lg` | `var(--radius)` | Cards, buttons, large elements |
| `rounded-md` | `calc(var(--radius) - 2px)` | Inputs, medium elements |
| `rounded-sm` | `calc(var(--radius) - 4px)` | Small elements, badges |
| `rounded-full` | `9999px` | Circular elements, avatars |

### Usage

```tsx
<Card className="rounded-lg">      {/* 8px radius */}
<Input className="rounded-md">     {/* 6px radius */}
<Badge className="rounded-sm">     {/* 4px radius */}
<Avatar className="rounded-full">  {/* Circular */}
```

## Color System

### Semantic Colors

Our color system uses HSL values defined as CSS variables for easy theme switching and WCAG AA compliance.

#### Core Colors (Light Mode)
- **Background**: Pure white (`0 0% 100%`)
- **Foreground**: Dark blue-gray (`222.2 84% 4.9%`)
- **Primary**: Blue (`221.2 83.2% 53.3%`)
- **Secondary**: Light blue-gray (`210 40% 96.1%`)
- **Muted**: Light gray (`210 40% 96.1%`)

#### Core Colors (Dark Mode)
- **Background**: Dark blue-gray (`222.2 84% 4.9%`)
- **Foreground**: Near white (`210 40% 98%`)
- **Primary**: Bright blue (`217.2 91.2% 59.8%`)
- **Secondary**: Dark gray (`217.2 32.6% 17.5%`)
- **Muted**: Medium gray (`217.2 32.6% 17.5%`)

#### Semantic Status Colors

Use these for feedback, alerts, and status indicators:

| Color | Purpose | Light Mode | Dark Mode | Usage Example |
|-------|---------|------------|-----------|---------------|
| **Success** | Positive actions, confirmations | Green `142.1 76.2% 36.3%` | Lighter green `142.1 70.6% 45.3%` | Budget on track, successful save |
| **Warning** | Caution, pending states | Amber `38 92% 50%` | Amber `38 92% 50%` | Budget approaching limit |
| **Error** | Errors, destructive actions | Red `0 84.2% 60.2%` | Dark red `0 62.8% 30.6%` | Failed validation, delete confirm |
| **Info** | Informational messages | Cyan `199 89.1% 48.4%` | Cyan `199 89.1% 48.4%` | Tips, help text, notifications |

Note: `destructive` and `error` are aliases for the same red color.

### Usage

```tsx
// Core colors
<div className="bg-background text-foreground">
<Button className="bg-primary text-primary-foreground">

// Semantic status colors
<Alert className="bg-success text-success-foreground">Budget on track!</Alert>
<Alert className="bg-warning text-warning-foreground">Approaching limit</Alert>
<Alert className="bg-error text-error-foreground">Invalid input</Alert>
<Alert className="bg-info text-info-foreground">Helpful tip</Alert>

// Using destructive (alias for error)
<Button variant="destructive">Delete</Button>
```

### Color Guidelines

**DO:**
- ✅ Use semantic colors for their intended purpose (success for positive, error for negative)
- ✅ Always pair color with foreground color for proper contrast
- ✅ Test colors in both light and dark modes
- ✅ Use color variables, never hardcode hex/rgb values
- ✅ Ensure WCAG AA contrast ratio (4.5:1 for text, 3:1 for UI)

**DON'T:**
- ❌ Use hardcoded colors like `text-red-500` - use `text-error` instead
- ❌ Rely solely on color to convey meaning (add icons or text)
- ❌ Use warning/error colors for decorative purposes
- ❌ Skip testing in dark mode

## Typography

### Font Family
```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
  'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
```

### Font Sizes (Tailwind defaults)
- `text-xs`: 0.75rem (12px)
- `text-sm`: 0.875rem (14px)
- `text-base`: 1rem (16px)
- `text-lg`: 1.125rem (18px)
- `text-xl`: 1.25rem (20px)
- `text-2xl`: 1.5rem (24px)
- `text-3xl`: 1.875rem (30px)
- `text-4xl`: 2.25rem (36px)

### Typography Guidelines

**DO:**
- ✅ Use `text-sm` or `text-base` for body text
- ✅ Use `text-lg` or `text-xl` for headings
- ✅ Use `text-2xl` - `text-4xl` for page titles
- ✅ Use `font-mono` for financial numbers and code
- ✅ Maintain proper line height (`leading-normal`, `leading-relaxed`)

**DON'T:**
- ❌ Use too many different font sizes on one screen
- ❌ Use font sizes smaller than `text-xs` for important content
- ❌ Mix different font families arbitrarily

## Component Guidelines

### Cards
```tsx
<Card className="p-6 rounded-lg">
  <CardHeader className="mb-4">
    <CardTitle className="text-xl font-semibold">
  </CardHeader>
  <CardContent className="space-y-4">
    {/* Content with consistent spacing */}
  </CardContent>
</Card>
```

### Buttons
```tsx
<Button className="px-4 py-2 rounded-md">  {/* Standard padding */}
<Button size="sm" className="px-3 py-1">   {/* Small */}
<Button size="lg" className="px-6 py-3">   {/* Large */}
```

### Forms
```tsx
<div className="space-y-4">  {/* Consistent gap between fields */}
  <Label className="mb-2">
  <Input className="px-3 py-2 rounded-md">
</div>
```

## Responsive Breakpoints

Tailwind's default breakpoints (mobile-first):
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

### Usage
```tsx
<div className="p-4 md:p-6 lg:p-8">  {/* Responsive padding */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
```

## Accessibility

### Contrast Ratios
- **Normal text**: Minimum 4.5:1 (WCAG AA)
- **Large text**: Minimum 3:1 (WCAG AA)
- **UI components**: Minimum 3:1

### Focus States
Always provide visible focus indicators:
```tsx
<button className="focus:ring-2 focus:ring-primary focus:outline-none">
```

### Touch Targets
Minimum 44px × 44px for interactive elements on mobile.

## Animation Guidelines

### Duration
- **Fast**: 150ms (micro-interactions)
- **Normal**: 200-300ms (standard transitions)
- **Slow**: 500ms (complex animations)

### Easing
- `ease-in-out`: Default for most transitions
- `ease-out`: Entrances
- `ease-in`: Exits

### Respect User Preferences
Always respect `prefers-reduced-motion`:
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Best Practices

1. **Consistency**: Use design tokens everywhere, avoid magic numbers
2. **Accessibility**: Test with keyboard navigation and screen readers
3. **Performance**: Use CSS transforms for animations (not layout properties)
4. **Responsiveness**: Design mobile-first, enhance for larger screens
5. **Dark Mode**: Test all components in both light and dark modes
6. **Spacing**: Use the spacing scale to create visual rhythm
7. **Typography**: Establish clear hierarchy with font sizes and weights
8. **Colors**: Use semantic color variables, not hardcoded values

---

**Last Updated**: 2026-01-15
**Version**: 1.0
