/**
 * Design Tokens Usage Examples
 *
 * This file demonstrates how to use the design tokens in your components.
 * These are just examples - delete or move this file as needed.
 */

import { DESIGN_TOKENS } from './design-tokens';

// Example 1: Using individual token categories
function ExampleCard1() {
  return (
    <div
      className={`
        ${DESIGN_TOKENS.spacing.card.default}
        ${DESIGN_TOKENS.elevation.medium}
        ${DESIGN_TOKENS.radius.lg}
        ${DESIGN_TOKENS.colors.surface.card}
      `}
    >
      <h2 className={DESIGN_TOKENS.typography.h2}>Card Title</h2>
      <p className={DESIGN_TOKENS.typography.body.default}>
        Card content goes here
      </p>
    </div>
  );
}

// Example 2: Using destructured tokens for cleaner code
function ExampleCard2() {
  const { spacing, elevation, radius, colors, typography } = DESIGN_TOKENS;

  return (
    <div
      className={`
        ${spacing.card.default}
        ${elevation.medium}
        ${radius.lg}
        ${colors.surface.card}
      `}
    >
      <h2 className={typography.h2}>Card Title</h2>
      <p className={typography.body.default}>Card content goes here</p>
    </div>
  );
}

// Example 3: Status indicators with semantic colors
function StatusBadge({ type }: { type: 'success' | 'warning' | 'error' | 'info' }) {
  const { colors, spacing, radius, typography } = DESIGN_TOKENS;
  const status = colors.status[type];

  return (
    <span
      className={`
        ${status.bg}
        ${status.text}
        ${status.border}
        ${spacing.inline.default}
        ${radius.default}
        ${typography.label}
        inline-flex items-center px-3 py-1 border
      `}
    >
      {type.charAt(0).toUpperCase() + type.slice(1)}
    </span>
  );
}

// Example 4: Responsive layout with consistent spacing
function ExampleDashboard() {
  const { layout, spacing, colors } = DESIGN_TOKENS;

  return (
    <div className={`${spacing.page.mobile} md:${spacing.page.tablet} lg:${spacing.page.desktop}`}>
      <div className={`${layout.container.app} mx-auto`}>
        <div className={`${layout.grid.cols3} ${spacing.gap.default}`}>
          {/* Grid items */}
          <div className={`${spacing.card.default} ${colors.surface.card}`}>Item 1</div>
          <div className={`${spacing.card.default} ${colors.surface.card}`}>Item 2</div>
          <div className={`${spacing.card.default} ${colors.surface.card}`}>Item 3</div>
        </div>
      </div>
    </div>
  );
}

// Example 5: Interactive button with hover effects
function ExampleButton() {
  const { spacing, radius, animation, interaction, typography } = DESIGN_TOKENS;

  return (
    <button
      className={`
        ${spacing.inline.default}
        ${radius.default}
        ${animation.transition.all}
        ${animation.hover.lift}
        ${interaction.touch.minimum}
        ${interaction.focus.visible}
        ${interaction.disabled}
        ${typography.label}
        bg-primary text-primary-foreground
        px-4 py-2
      `}
    >
      Click Me
    </button>
  );
}

// Example 6: Typography hierarchy
function ExampleTypography() {
  const { typography, spacing } = DESIGN_TOKENS;

  return (
    <div className={spacing.section.default}>
      <h1 className={typography.display.default}>Display Text</h1>
      <h2 className={typography.h1}>Heading 1</h2>
      <h3 className={typography.h2}>Heading 2</h3>
      <h4 className={typography.h3}>Heading 3</h4>
      <p className={typography.body.default}>Body text</p>
      <p className={typography.body.small}>Small body text</p>
      <p className={typography.caption}>Caption text</p>
      <span className={typography.label}>Label</span>
    </div>
  );
}

// Example 7: Elevation levels
function ExampleElevation() {
  const { elevation, spacing, radius } = DESIGN_TOKENS;

  return (
    <div className={spacing.gap.default}>
      <div className={`${elevation.low} ${spacing.card.default} ${radius.default}`}>
        Low elevation
      </div>
      <div className={`${elevation.medium} ${spacing.card.default} ${radius.default}`}>
        Medium elevation
      </div>
      <div className={`${elevation.high} ${spacing.card.default} ${radius.default}`}>
        High elevation
      </div>
    </div>
  );
}

// Example 8: Using animation presets
function ExampleAnimation() {
  const { animation } = DESIGN_TOKENS;

  return (
    <div className={animation.presets.fadeIn}>
      <div className={animation.presets.slideInFromLeft}>
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
