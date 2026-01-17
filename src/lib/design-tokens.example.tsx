/**
 * Design Tokens Usage Examples
 *
 * This file demonstrates how to use the design tokens in your components.
 * These are just examples - delete or move this file as needed.
 */

import {
  statusColors,
  ELEVATION,
  ANIMATION,
  COLORS,
  chartColors,
  getChartColors,
  getCurrentTheme
} from './design-tokens';

// Example 1: Using status colors
function ExampleCard1() {
  return (
    <div
      className={`
        p-4
        ${ELEVATION.medium}
        rounded-lg
        bg-card
      `}
    >
      <h2 className="text-2xl font-bold">Card Title</h2>
      <p className="text-base">
        Card content goes here
      </p>
    </div>
  );
}

// Example 2: Using status colors for badges
function ExampleCard2() {
  return (
    <div
      className={`
        p-4
        ${ELEVATION.medium}
        rounded-lg
        bg-card
      `}
    >
      <h2 className="text-2xl font-bold">Card Title</h2>
      <p className="text-base">Card content goes here</p>
      <span className={`${statusColors.success.bg} ${statusColors.success.text} px-2 py-1 rounded`}>
        Success
      </span>
    </div>
  );
}

// Example 3: Status indicators with semantic colors
function StatusBadge({ type }: { type: 'success' | 'warning' | 'error' | 'info' }) {
  const status = statusColors[type];

  return (
    <span
      className={`
        ${status.bg}
        ${status.text}
        ${status.border}
        inline-flex items-center px-3 py-1 border rounded text-sm font-medium
      `}
    >
      {type.charAt(0).toUpperCase() + type.slice(1)}
    </span>
  );
}

// Example 4: Responsive layout with consistent spacing
function ExampleDashboard() {
  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="container mx-auto">
        <div className="grid grid-cols-3 gap-4">
          {/* Grid items */}
          <div className="p-4 bg-card">Item 1</div>
          <div className="p-4 bg-card">Item 2</div>
          <div className="p-4 bg-card">Item 3</div>
        </div>
      </div>
    </div>
  );
}

// Example 5: Interactive button with hover effects
function ExampleButton() {
  return (
    <button
      className="
        px-4 py-2 rounded
        transition-all duration-200
        hover:shadow-lg hover:scale-105
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
        disabled:opacity-50 disabled:pointer-events-none
        bg-primary text-primary-foreground
        text-sm font-medium
      "
    >
      Click Me
    </button>
  );
}

// Example 6: Typography hierarchy
function ExampleTypography() {
  return (
    <div className="space-y-4">
      <h1 className="text-4xl font-bold">Display Text</h1>
      <h2 className="text-3xl font-bold">Heading 1</h2>
      <h3 className="text-2xl font-bold">Heading 2</h3>
      <h4 className="text-xl font-bold">Heading 3</h4>
      <p className="text-base">Body text</p>
      <p className="text-sm">Small body text</p>
      <p className="text-xs text-muted-foreground">Caption text</p>
      <span className="text-sm font-medium">Label</span>
    </div>
  );
}

// Example 7: Elevation levels
function ExampleElevation() {
  return (
    <div className="space-y-4">
      <div className={`${ELEVATION.low} p-4 rounded`}>
        Low elevation
      </div>
      <div className={`${ELEVATION.medium} p-4 rounded`}>
        Medium elevation
      </div>
      <div className={`${ELEVATION.high} p-4 rounded`}>
        High elevation
      </div>
    </div>
  );
}

// Example 8: Using animation presets
function ExampleAnimation() {
  return (
    <div className="animate-in fade-in duration-300">
      <div className="animate-in slide-in-from-left duration-500">
        <p>This content animates in</p>
      </div>
    </div>
  );
}

// Export examples for documentation
export {
  ExampleCard1,
  ExampleCard2,
  StatusBadge,
  ExampleDashboard,
  ExampleButton,
  ExampleTypography,
  ExampleElevation,
  ExampleAnimation,
};
