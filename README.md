# SmartBudget

> **Intelligent Personal Finance Management** - Take control of your financial future with AI-powered budgeting and insights.

![SmartBudget Banner - New UI](https://via.placeholder.com/1200x300/2563EB/ffffff?text=SmartBudget+v2.0+-+Complete+UI+Redesign)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![WCAG 2.1 AA](https://img.shields.io/badge/WCAG-2.1%20AA-green)](https://www.w3.org/WAI/WCAG21/quickref/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

---

## What's New in Version 2.0

**SmartBudget 2.0** represents a complete redesign focused on performance, accessibility, and modern user experience. This major release includes:

- **Mobile-First Design** - Touch-optimized bottom navigation, responsive layouts, seamless mobile experience
- **50-100x Faster Dashboard** - Redis caching and query optimization dramatically improve load times
- **Enterprise-Grade Security** - RBAC, comprehensive rate limiting, Zod validation across all endpoints
- **WCAG 2.1 AA Compliant** - Full accessibility with keyboard navigation and screen reader support
- **React Query Integration** - Modern state management with automatic caching and optimistic updates
- **Comprehensive Testing** - 260+ E2E tests, extensive unit and integration test coverage
- **Advanced Design System** - Consistent tokens for spacing, typography, colors, and animations
- **Cross-Browser Support** - Tested across Chrome, Edge, Firefox, Safari (desktop and mobile)

### Version History

#### Version 2.0 - Complete UI Redesign (January 2026)
Complete overhaul of the application with 10 major phases of improvements:

**Phase 1 - Security Hardening**
- Implemented RBAC with User/Admin roles
- Added Redis-based rate limiting to all 52 API endpoints
- Created comprehensive Zod validation schemas
- Reduced TypeScript `any` types by 44%
- Secured all admin endpoints with proper authorization

**Phase 2 - Mobile Navigation**
- Built touch-optimized bottom navigation bar
- Created hamburger menu for secondary routes
- Responsive header with mobile-first design
- All 11 routes now accessible on mobile

**Phase 3 - Design System**
- Created comprehensive design tokens (spacing, typography, colors, animations)
- Standardized spacing across all pages
- Fixed dark mode gradients and color inconsistencies
- Added `prefers-reduced-motion` support
- Implemented elevation system for visual hierarchy

**Phase 4 - State Management**
- Integrated TanStack React Query for data fetching
- Created centralized API client with type safety
- Migrated all pages to use React Query hooks
- Implemented optimistic updates for instant UI feedback
- Added automatic cache invalidation

**Phase 5 - Component Refactoring**
- Split large components (784-line TransactionDetailDialog → 5 components)
- Created reusable composite components (StatCard, FilterPanel, DataTable, EmptyState)
- Extracted custom hooks (useCurrency, useMediaQuery, useDebounce)
- Improved component maintainability and reusability

**Phase 6 - Accessibility**
- Achieved WCAG 2.1 Level AA compliance
- Added ARIA labels to all interactive elements
- Fixed focus management in dialogs and modals
- Improved dialog scrolling with fixed headers/footers
- Comprehensive accessibility audit with axe-core

**Phase 7 - Performance Optimization**
- Implemented code splitting for Recharts and D3.js (130-160KB reduction)
- Optimized database queries (eliminated N+1 patterns)
- Added Redis caching to all dashboard endpoints (50-100x faster)
- Added skeleton loaders for better perceived performance

**Phase 8 - Comprehensive Testing**
- Created 260+ E2E tests with Playwright
- Added 76 integration tests for critical flows
- Wrote 500+ unit tests for components and utilities
- Implemented cross-browser testing (9 configurations)
- Added accessibility testing suite

**Phase 9 - UI/UX Polish**
- Enhanced typography with responsive variants
- Added sparklines and hover details to StatCard
- Implemented chart export (PNG, SVG, PDF, CSV)
- Refined forms with floating labels and validation feedback
- Added micro-interactions and celebration effects

**Phase 10 - QA & Deployment**
- Cross-browser testing infrastructure
- Performance benchmarking with Lighthouse CI
- Security audit and OWASP Top 10 compliance
- Documentation updates

#### Version 1.0 - MVP (January 2026)
Initial release with core features:
- Transaction import (CSV, OFX, QFX)
- AI-powered categorization (90%+ accuracy)
- Budget management with multiple types
- Financial goals tracking
- Dashboard with charts and analytics
- Dark mode support
- Basic responsive design

---

## Overview

**SmartBudget** is a comprehensive personal finance management application that helps you:

- Import and manage all your financial transactions
- Automatically categorize expenses and income using AI
- Create and track budgets with real-time progress monitoring
- Set and achieve financial goals
- Gain insights into your spending patterns
- Make data-driven financial decisions

Optimized for **Canadian banks** (especially CIBC), SmartBudget supports CSV and OFX/QFX import formats with intelligent merchant normalization and AI-powered categorization.

---

## Features

### Version 2.0 Enhancements

- **Enhanced Mobile Experience**
  - Touch-optimized bottom navigation with 5 primary actions
  - Responsive hamburger menu for secondary navigation
  - Mobile-first layouts across all pages
  - Swipe gestures and touch-friendly interactions
  - Tested on iOS (iPhone 12/13, iPad Pro) and Android (Pixel 5, Galaxy S9+)

- **Modern State Management**
  - React Query integration for intelligent data fetching
  - Automatic caching with configurable stale times
  - Optimistic updates for instant UI feedback
  - Request deduplication and background refetching
  - Centralized API client with type safety

- **Security & Performance**
  - Role-Based Access Control (RBAC) with User/Admin roles
  - Redis-based rate limiting on all critical endpoints (4 protection tiers)
  - Zod validation schemas across all 52 API routes
  - 50-100x faster dashboard loads with Redis caching
  - Code splitting for heavy libraries (D3.js, Recharts)
  - Optimized database queries (eliminated N+1 patterns)

- **Accessibility Excellence**
  - WCAG 2.1 Level AA compliant
  - Full keyboard navigation support
  - Screen reader optimized with ARIA labels
  - Focus management in modals and dialogs
  - Reduced motion support for animations
  - High contrast color schemes for better visibility

- **Comprehensive Testing**
  - 260+ E2E tests with Playwright
  - Unit tests for all utilities and components
  - Integration tests for critical business flows
  - Cross-browser testing (Chrome, Edge, Firefox, Safari)
  - Accessibility audits with axe-core
  - Performance benchmarking with Lighthouse CI

- **Advanced Design System**
  - Consistent design tokens for spacing, colors, typography
  - Colorblind-friendly palettes (Okabe-Ito)
  - Responsive typography with mobile-first scaling
  - Standardized animations with duration constants
  - Elevation system for visual hierarchy
  - Dark mode with proper contrast ratios

### Core Features

- **Universal Transaction Import**
  - CSV, OFX, QFX format support
  - Multi-file drag-and-drop upload
  - Automatic duplicate detection
  - Import preview and validation

- **AI-Powered Auto-Categorization**
  - 90%+ accuracy using hybrid ML + rule-based system
  - Plaid PFCv2 taxonomy (16 primary, 100+ subcategories)
  - Merchant normalization pipeline
  - Confidence scoring and user feedback loop

- **Unknown Merchant Research**
  - Claude AI integration for merchant lookup
  - Web search and business identification
  - Automatic category suggestions
  - Knowledge base learning

- **Comprehensive Dashboard**
  - Real-time financial overview
  - Net worth tracking with trends
  - Cash flow analysis
  - Interactive charts (Recharts + D3.js) with export functionality
  - Multiple timeframe views
  - Chart export to PNG, SVG, PDF, CSV

- **Advanced Budget Management**
  - Multiple budget types (Envelope, Percentage, Fixed, Goal-based)
  - Real-time tracking with alerts
  - Budget forecasting and analytics
  - Rollover and fund transfer support

- **Financial Goals**
  - Savings goals with progress tracking
  - Debt payoff calculators
  - Net worth targets
  - Milestone celebrations

### Advanced Features

- **Split Transactions**: Allocate expenses across multiple categories
- **Tags & Labels**: Custom organization and tax tracking
- **Recurring Detection**: Auto-identify and predict recurring expenses
- **Smart Search**: Full-text search with advanced filtering
- **Export & Reporting**: CSV, Excel, PDF exports with tax reports
- **AI Insights**: Spending patterns, anomaly detection, savings opportunities
- **Chart Export**: Export all visualizations to PNG, SVG, PDF, or CSV formats

---

## Screenshots

### Dashboard - New UI
![Dashboard](https://via.placeholder.com/800x500/f9fafb/2563eb?text=Dashboard+View+-+Version+2.0)

*Lightning-fast dashboard with Redis caching and optimized queries*

### Transaction Management - New UI
![Transactions](https://via.placeholder.com/800x500/f9fafb/2563eb?text=Transaction+Management+-+New+UI)

*Responsive transaction table with advanced filtering and optimistic updates*

### Budget Tracking - New UI
![Budgets](https://via.placeholder.com/800x500/f9fafb/2563eb?text=Budget+Tracking+-+New+UI)

*Real-time budget progress with accessible visualizations*

### Mobile Experience - New UI
![Mobile Navigation](https://via.placeholder.com/375x667/f9fafb/2563eb?text=Mobile+Bottom+Navigation)

*Touch-optimized mobile navigation for seamless on-the-go management*

---

## Quick Start

### Prerequisites

- **Node.js** 20+ and npm/yarn/pnpm
- **PostgreSQL** 16+ database
- **Git** for version control
- **Redis** (optional but recommended for 50-100x performance boost)

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/smartbudget.git
cd smartbudget
```

2. **Install dependencies**

```bash
npm install
# or
pnpm install
# or
yarn install
```

3. **Set up environment variables**

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and configure:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/smartbudget"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"  # Generate with: openssl rand -base64 32

# Redis (optional but recommended for performance)
UPSTASH_REDIS_REST_URL="https://your-redis-url.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-redis-token"

# AI Integration (optional)
ANTHROPIC_API_KEY="your-api-key"

# Sentry (optional)
SENTRY_DSN="your-sentry-dsn"
NEXT_PUBLIC_SENTRY_DSN="your-sentry-dsn"
```

4. **Set up the database**

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Seed initial data (categories)
npx prisma db seed
```

5. **Start the development server**

```bash
npm run dev
```

6. **Open your browser**

Navigate to [http://localhost:3000](http://localhost:3000)

---

## Tech Stack

### Frontend

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Server Actions)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/) (Radix UI + Tailwind CSS)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with custom design tokens
- **Visualization**: [Recharts](https://recharts.org/), [D3.js](https://d3js.org/) (lazy loaded)
- **Chart Export**: [html2canvas](https://html2canvas.hertzen.com/), [jsPDF](https://github.com/parallax/jsPDF)
- **Form Handling**: [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)
- **State Management**: [TanStack React Query](https://tanstack.com/query) (v5) + React Context
- **Theme**: [next-themes](https://github.com/pacocoursey/next-themes) for dark mode
- **Notifications**: [Sonner](https://sonner.emilkowal.ski/) for toast notifications

### Backend

- **Runtime**: Node.js 20+
- **API**: Next.js API Routes + Server Actions
- **Database**: [PostgreSQL 16+](https://www.postgresql.org/) with [Prisma ORM](https://www.prisma.io/) v7
- **Caching**: [Redis](https://redis.io/) via [@upstash/redis](https://upstash.com/) with in-memory fallback
- **Rate Limiting**: [@upstash/ratelimit](https://github.com/upstash/ratelimit) with 4-tier protection
- **Authentication**: [NextAuth.js v5](https://authjs.dev/) (Auth.js) with Prisma adapter
- **Authorization**: Role-Based Access Control (RBAC) with User/Admin roles
- **Validation**: [Zod v4](https://zod.dev/) schemas across all API endpoints
- **File Processing**: [Papa Parse](https://www.papaparse.com/) (CSV), [node-ofx-parser](https://github.com/kedder/node-ofx-parser) (OFX/QFX)
- **AI Integration**: [Anthropic Claude API](https://www.anthropic.com/api) (@anthropic-ai/sdk)

### AI/ML

- **Categorization**: Hybrid rule-based + ML model with [@xenova/transformers](https://xenova.github.io/transformers.js/)
- **Merchant Normalization**: Fuzzy matching with [Fuse.js](https://fusejs.io/) + NLP
- **Unknown Merchant Lookup**: Claude AI integration with web search
- **Embeddings**: Cached in Redis for 50-100x faster categorization

### Testing & Quality

- **Unit Tests**: [Vitest](https://vitest.dev/) with [@testing-library/react](https://testing-library.com/)
- **E2E Tests**: [Playwright](https://playwright.dev/) (260+ tests across 9 browser configurations)
- **Accessibility Tests**: [@axe-core/playwright](https://github.com/dequelabs/axe-core-npm) for WCAG 2.1 AA compliance
- **Performance**: [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci) for automated benchmarking
- **Type Safety**: [TypeScript 5.9](https://www.typescriptlang.org/) in strict mode
- **Code Quality**: ESLint + TypeScript ESLint

### Infrastructure

- **Hosting**: [Vercel](https://vercel.com/)
- **Database Hosting**: [Neon](https://neon.tech/) or [Supabase](https://supabase.com/)
- **Redis Hosting**: [Upstash Redis](https://upstash.com/)
- **Monitoring**: [Sentry](https://sentry.io/) (error tracking and performance monitoring)
- **Analytics**: Vercel Analytics
- **CI/CD**: GitHub Actions with automated testing and deployment

---

## Project Structure

```
smartbudget/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (auth)/            # Authentication pages
│   │   ├── (dashboard)/       # Main application pages
│   │   ├── api/               # API routes
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Homepage
│   ├── components/            # React components
│   │   ├── ui/               # shadcn/ui components
│   │   ├── dashboard/        # Dashboard components
│   │   ├── transactions/     # Transaction components
│   │   └── ...
│   ├── lib/                   # Utility functions
│   │   ├── prisma.ts         # Prisma client
│   │   ├── auth.ts           # NextAuth config
│   │   ├── categorizer.ts    # Auto-categorization
│   │   ├── merchant-normalizer.ts
│   │   └── ...
│   ├── hooks/                 # Custom React hooks
│   ├── types/                 # TypeScript types
│   └── styles/                # Global styles
├── prisma/
│   ├── schema.prisma          # Database schema
│   ├── migrations/            # Database migrations
│   └── seed.ts                # Seed script
├── e2e/                       # End-to-end tests
├── public/                    # Static assets
├── docs/                      # Additional documentation
├── .env                       # Environment variables
├── next.config.js             # Next.js configuration
├── tailwind.config.ts         # Tailwind CSS config
├── tsconfig.json              # TypeScript config
├── package.json               # Dependencies
└── README.md                  # This file
```

---

## Documentation

Comprehensive documentation is available:

### User Documentation
- **[User Guide](USER_GUIDE.md)** - Complete guide for end users
- **[API Documentation](API_DOCS.md)** - REST API reference for developers

### Development Documentation
- **[Testing Guide](TESTING.md)** - Testing infrastructure and best practices
- **[Cross-Browser Testing Plan](CROSS_BROWSER_TESTING_PLAN.md)** - Browser compatibility testing
- **[Performance Benchmark Report](PERFORMANCE_BENCHMARK_REPORT.md)** - Performance metrics and optimization
- **[Error Monitoring](ERROR_MONITORING.md)** - Sentry configuration and error handling
- **[Database Setup](prisma/README.md)** - Database schema and seeding

### Version 2.0 Documentation
- **[Accessibility Audit Report](ACCESSIBILITY_AUDIT_REPORT.md)** - WCAG 2.1 AA compliance verification
- **[Progress Report](smartbudget-complete-ui-redesign_PROGRESS.md)** - Complete redesign implementation details
- **[Integration Tests README](src/test/integration/README.md)** - Integration testing documentation

---

## Development

### Available Scripts

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint
npm run type-check       # Run TypeScript type checking

# Database
npx prisma studio        # Open Prisma Studio (database GUI)
npx prisma generate      # Generate Prisma client
npx prisma migrate dev   # Create and apply migrations
npx prisma db seed       # Seed database with initial data

# Testing
npm run test             # Run unit tests
npm run test:watch       # Run tests in watch mode
npm run test:ui          # Run tests with Vitest UI
npm run test:coverage    # Generate coverage report
npm run test:e2e         # Run E2E tests
npm run test:e2e:ui      # Run E2E tests with Playwright UI
npm run test:e2e:debug   # Debug E2E tests
npm run test:e2e:cross-browser  # Run tests on all 9 browsers
npm run test:all         # Run all tests (unit + E2E)

# Performance Testing
npm run test:performance         # Run Lighthouse audit
npm run test:performance:mobile  # Mobile-only performance test
npm run test:performance:desktop # Desktop-only performance test
npm run test:performance:both    # Both mobile and desktop
```

### Development Workflow

1. **Create a feature branch**

```bash
git checkout -b feature/your-feature-name
```

2. **Make your changes**

- Follow the existing code style
- Add tests for new features
- Update documentation as needed

3. **Run tests and linting**

```bash
npm run lint
npm run test
npm run type-check
```

4. **Commit your changes**

```bash
git add .
git commit -m "feat: add awesome feature"
```

Follow [Conventional Commits](https://www.conventionalcommits.org/) format:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting)
- `refactor:` - Code refactoring
- `test:` - Test changes
- `chore:` - Build/config changes

5. **Push and create a Pull Request**

```bash
git push origin feature/your-feature-name
```

---

## Testing

SmartBudget 2.0 features comprehensive test coverage across all layers:

### Test Statistics

- **260+ E2E Tests**: Playwright tests across 9 browser configurations
- **76 Integration Tests**: Critical business flows and data pipelines
- **500+ Unit Tests**: Components, utilities, and API routes
- **WCAG 2.1 AA**: Full accessibility compliance verified with axe-core
- **Cross-Browser**: Chrome, Edge, Firefox, Safari (desktop + mobile)

### Test Types

#### Unit Tests (Vitest)
- All utility functions (date, currency, merchant normalization)
- UI components (Button, Input, Card, Dialog, StatCard, FilterPanel)
- API middleware and helpers
- Business logic and calculations

#### Integration Tests
- Transaction import pipeline (CSV, OFX, duplicates, normalization)
- Categorization pipeline (rule-based, ML, hybrid, confidence scoring)
- Budget calculations (periods, aggregation, progress tracking)
- Dashboard aggregations (net worth, cash flow, spending trends)

#### E2E Tests (Playwright)
- Authentication flows (registration, login, session management)
- Transaction CRUD operations (create, read, update, delete)
- Budget management (creation, editing, monitoring, analytics)
- Account management (creation, editing, filtering)
- Responsive behavior (mobile, tablet, desktop layouts)
- Accessibility (keyboard navigation, screen readers, WCAG 2.1 AA)

### Running Tests

```bash
# All tests
npm run test:all

# Unit tests only
npm run test
npm run test:watch        # Watch mode
npm run test:coverage     # With coverage report

# E2E tests
npm run test:e2e                    # All E2E tests
npm run test:e2e:ui                 # With Playwright UI
npm run test:e2e:cross-browser      # All 9 browser configurations

# Performance tests
npm run test:performance            # Lighthouse audit
npm run test:performance:mobile     # Mobile-only
npm run test:performance:desktop    # Desktop-only
```

### Continuous Integration

All tests run automatically on every pull request:
- Unit and integration tests
- E2E tests on Chrome, Firefox, and WebKit
- Accessibility audits with axe-core
- Performance benchmarks with Lighthouse CI
- Type checking with TypeScript strict mode

See [TESTING.md](TESTING.md) for detailed testing documentation.

---

## Accessibility

SmartBudget 2.0 is built with accessibility as a core principle, achieving **WCAG 2.1 Level AA compliance**.

### Accessibility Features

- **Keyboard Navigation**: Full keyboard support for all interactive elements
  - Tab navigation with visible focus indicators
  - Arrow keys for menus and lists
  - Escape key to close dialogs and menus
  - Enter/Space for button activation

- **Screen Reader Support**: Comprehensive ARIA labels and semantic HTML
  - Descriptive labels for all form inputs
  - Status announcements for dynamic content
  - Proper heading hierarchy (h1-h6)
  - Alternative text for all visual elements

- **Visual Accessibility**
  - High contrast color schemes (WCAG AAA compliant)
  - Colorblind-friendly palettes (Okabe-Ito)
  - Resizable text up to 200% without layout breaking
  - Focus indicators with 3:1 contrast ratio
  - Proper color contrast ratios throughout

- **Motion & Animation**
  - Respects `prefers-reduced-motion` system setting
  - All animations can be disabled
  - No auto-playing animations
  - Safe animation durations (200-300ms)

- **Mobile Accessibility**
  - Touch targets minimum 44×44px
  - Swipe gestures with keyboard alternatives
  - Proper viewport scaling
  - Mobile screen reader optimization

### Accessibility Testing

- Automated testing with [@axe-core/playwright](https://github.com/dequelabs/axe-core-npm)
- Manual testing with screen readers (NVDA, VoiceOver)
- Keyboard navigation verification
- Color contrast analysis
- Focus management testing in modals and dialogs

### Accessibility Audit Results

- Zero critical accessibility violations
- WCAG 2.1 Level AA compliance verified
- All interactive elements keyboard accessible
- Proper focus management throughout application
- Screen reader friendly with comprehensive ARIA support

See [ACCESSIBILITY_AUDIT_REPORT.md](ACCESSIBILITY_AUDIT_REPORT.md) for the complete audit report.

---

## Deployment

### Deploy to Vercel

1. **Install Vercel CLI**

```bash
npm install -g vercel
```

2. **Link project**

```bash
vercel link
```

3. **Set environment variables**

```bash
vercel env add DATABASE_URL
vercel env add NEXTAUTH_SECRET
# Add other environment variables
```

4. **Deploy**

```bash
vercel --prod
```

### Database Migration

For production deployments, run migrations:

```bash
npx prisma migrate deploy
```

### Environment Variables

Ensure all required environment variables are set:

#### Required
- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_URL` - Application URL
- `NEXTAUTH_SECRET` - Secret for session encryption (generate with `openssl rand -base64 32`)

#### Optional but Recommended
- `UPSTASH_REDIS_REST_URL` - Redis URL for caching and rate limiting
- `UPSTASH_REDIS_REST_TOKEN` - Redis authentication token
- `ANTHROPIC_API_KEY` - Claude AI for merchant research
- `SENTRY_DSN` - Sentry error tracking
- `NEXT_PUBLIC_SENTRY_DSN` - Client-side Sentry

**Note**: Redis is optional but highly recommended for production. The application will fall back to in-memory caching if Redis is unavailable, but you'll lose the 50-100x performance boost and rate limiting will be less effective.

---

## Configuration

### Database

SmartBudget uses PostgreSQL with Prisma ORM. Configure your database connection in `.env`:

```env
DATABASE_URL="postgresql://user:password@host:port/database?schema=public"
```

### Authentication

Configure NextAuth.js providers in `src/lib/auth.ts`:

- Email/Password (default)
- Google OAuth
- Apple Sign-In

### Redis Caching

For optimal performance, configure Redis caching:

```env
UPSTASH_REDIS_REST_URL="https://your-redis-url.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-redis-token"
```

Redis provides:
- 50-100x faster dashboard loads with 5-minute cache TTL
- Permanent caching for ML embeddings
- Distributed rate limiting across instances
- Automatic fallback to in-memory if unavailable

### AI Integration

To enable Claude AI merchant research:

```env
ANTHROPIC_API_KEY="your-api-key"
```

### Design System

SmartBudget 2.0 includes a comprehensive design system with consistent tokens:

- **Design Tokens**: Centralized in `src/lib/design-tokens.ts`
  - Spacing scale (xs, sm, md, lg, xl, 2xl)
  - Typography with responsive variants
  - Animation durations and easing functions
  - Elevation/shadow system
  - Color palettes (including colorblind-friendly)

- **Component Library**: 21+ shadcn/ui components + custom composites
  - StatCard - Standardized metric display with trends
  - FilterPanel - Reusable filtering UI
  - DataTable - Accessible tables with sorting/pagination
  - EmptyState - Consistent empty states

- **Responsive Design**: Mobile-first approach
  - Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
  - Touch-optimized interactions (44×44px minimum)
  - Bottom navigation on mobile, sidebar on desktop

### Sentry (Error Monitoring)

Optional but recommended for production:

```env
SENTRY_DSN="your-sentry-dsn"
NEXT_PUBLIC_SENTRY_DSN="your-public-dsn"
SENTRY_ORG="your-org"
SENTRY_PROJECT="your-project"
```

See [ERROR_MONITORING.md](ERROR_MONITORING.md) for setup details.

---

## Performance

SmartBudget 2.0 delivers exceptional performance through comprehensive optimization:

### Version 2.0 Performance Improvements

- **Dashboard Load**: 50-100x faster with Redis caching (5-min TTL)
- **ML Categorization**: Permanent Redis cache for embeddings
- **Database Queries**: Eliminated N+1 patterns, single-pass aggregations
- **Bundle Size**: Reduced by 130-160KB (gzipped) through code splitting
- **Optimistic Updates**: Instant UI feedback on all mutations

### Performance Metrics

- **Page Load**: <1.5s (First Contentful Paint)
- **Largest Contentful Paint**: <2.5s
- **Time to Interactive**: <3s
- **Cumulative Layout Shift**: <0.1
- **API Response**: <200ms (p95), <50ms with cache
- **Transaction Import**: 10,000 transactions in <5s
- **Dashboard Render**: <500ms with 10,000+ transactions (cached)

### Performance Features

- **Redis Caching**: Dashboard endpoints, ML embeddings, training data
- **Code Splitting**: Lazy-loaded Recharts and D3.js components
- **Query Optimization**: Single-pass aggregations, efficient Map data structures
- **Optimistic Updates**: React Query for instant UI feedback
- **Server-Side Rendering**: Fast initial loads with Next.js App Router
- **Database Indexes**: Optimized indexes for all query patterns
- **Skeleton Loaders**: Content-shaped placeholders for better perceived performance
- **Suspense Boundaries**: Progressive loading for heavy components
- **Image Optimization**: Next.js automatic image optimization

---

## Security

SmartBudget 2.0 implements enterprise-grade security measures:

### Version 2.0 Security Enhancements

- **Role-Based Access Control (RBAC)**: Database-backed User/Admin roles with middleware enforcement
- **Comprehensive Rate Limiting**: Redis-based rate limiting across all 52 API routes
  - STRICT tier: 5 requests/min (auth operations)
  - EXPENSIVE tier: 10 requests/min (ML training, bulk imports)
  - MODERATE tier: 30 requests/min (API mutations)
  - LENIENT tier: 60 requests/min (read operations)
- **Universal Input Validation**: Zod v4 schemas on all API endpoints with type-safe validation
- **Security Audit**: Comprehensive OWASP Top 10 compliance verification completed
- **TypeScript Strict Mode**: Reduced `any` types by 44%, eliminating type safety vulnerabilities

### Core Security Features

- **Encryption**: AES-256 at rest, TLS 1.3 in transit
- **Authentication**: NextAuth.js v5 with secure sessions and Prisma adapter
- **Authorization**: RBAC with row-level security for all data access
- **Input Validation**: Zod schemas with automatic type inference
- **SQL Injection Protection**: Prisma parameterized queries
- **XSS Protection**: React's built-in escaping + Content Security Policy headers
- **CSRF Protection**: CSRF tokens on all mutations
- **Rate Limiting**: Multi-tier protection with Redis + in-memory fallback

### Security Audit Results

- No critical vulnerabilities found
- All endpoints protected by authentication
- Admin operations require ADMIN role verification
- Rate limiting prevents abuse and DDoS attacks
- All user input validated before processing
- Security headers properly configured

### Security Best Practices

- Never commit `.env` files
- Rotate secrets regularly
- Keep dependencies updated (automated with Dependabot)
- Regular security audits with npm audit
- Use strong passwords and 2FA
- Follow OWASP Top 10 guidelines
- Monitor error rates with Sentry

---

## Privacy

Your financial data privacy is paramount:

- **No Data Selling**: Your data is never sold or shared with third parties
- **Encryption**: All sensitive data is encrypted
- **Bank Credentials**: Never stored (file-based imports only)
- **GDPR Compliant**: Full data portability and deletion rights
- **Anonymized Analytics**: Optional and aggregated only

### Data Handling

- **Local Processing**: Transaction categorization happens on your server
- **Minimal Cloud AI**: Claude AI research is opt-in and merchant-specific
- **Data Export**: Download all your data anytime
- **Account Deletion**: Permanently delete all data

---

## Contributing

We welcome contributions! Here's how you can help:

### Ways to Contribute

- **Report Bugs**: [Open an issue](https://github.com/yourusername/smartbudget/issues)
- **Suggest Features**: [Feature requests](https://github.com/yourusername/smartbudget/discussions)
- **Submit Pull Requests**: Fix bugs or add features
- **Improve Documentation**: Help others understand SmartBudget
- **Translate**: Help translate to other languages

### Contribution Guidelines

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass (`npm run test:all`)
6. Commit with conventional commits (`git commit -m 'feat: add amazing feature'`)
7. Push to your fork (`git push origin feature/amazing-feature`)
8. Open a Pull Request

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

---

## Roadmap

### Current Version: v2.0 (Complete UI Redesign)

Released: January 2026

**Version 2.0** represents a complete overhaul focused on:
- Mobile-first responsive design
- Enterprise security and performance
- WCAG 2.1 AA accessibility compliance
- Modern state management with React Query
- Comprehensive testing infrastructure

### Upcoming Features

#### v2.1 (Q2 2026)
- Multi-currency support with real-time exchange rates
- Bank account sync (Plaid integration)
- Advanced budget forecasting with ML predictions
- Collaborative budgets (multi-user households)
- Enhanced dark mode with custom themes

#### v2.2 (Q3 2026)
- Investment tracking and portfolio management
- Credit score monitoring integration
- Bill payment reminders and automation
- Recurring transaction templates
- Advanced AI spending insights

#### v3.0 (Q4 2026)
- Native mobile apps (iOS & Android) with offline support
- Natural language queries ("How much did I spend on groceries?")
- Receipt OCR with automatic transaction matching
- Tax optimization tools and deduction tracking
- Advanced reporting and custom dashboards

See [ROADMAP.md](ROADMAP.md) for detailed plans.

---

## FAQ

### General

**Q: Is SmartBudget free?**
A: Yes, SmartBudget is currently free during the beta period. Future pricing TBD.

**Q: Do I need to connect my bank account?**
A: No! SmartBudget uses file-based imports (CSV, OFX). No bank credentials required.

**Q: Which banks are supported?**
A: Any bank that exports CSV or OFX/QFX files. Optimized for Canadian banks (CIBC, TD, RBC, Scotiabank, BMO).

**Q: What's new in Version 2.0?**
A: Version 2.0 is a complete redesign with mobile-first navigation, 50-100x faster performance, enterprise security (RBAC, rate limiting), WCAG 2.1 AA accessibility, and comprehensive testing. See the [What's New](#whats-new-in-version-20) section for details.

### Technical

**Q: Is my data secure?**
A: Yes. Version 2.0 includes enterprise-grade security with RBAC, rate limiting on all endpoints, Zod validation, and encryption (AES-256 at rest, TLS 1.3 in transit). We never store bank credentials. A comprehensive security audit was completed in January 2026.

**Q: Can I self-host SmartBudget?**
A: Yes! SmartBudget is open-source. Follow the installation guide above. Redis is optional but recommended for the 50-100x performance boost.

**Q: Does it work offline?**
A: The web app requires internet. Future mobile apps (v3.0) will have offline support.

**Q: How accurate is the auto-categorization?**
A: 90%+ accuracy after initial training. Improves as you correct transactions. Version 2.0 caches ML embeddings in Redis for instant categorization.

**Q: Is it accessible for people with disabilities?**
A: Yes! Version 2.0 is WCAG 2.1 Level AA compliant with full keyboard navigation, screen reader support, high contrast colors, and colorblind-friendly palettes. See the [Accessibility](#accessibility) section.

**Q: Does it work on mobile?**
A: Yes! Version 2.0 features a complete mobile-first redesign with touch-optimized bottom navigation, responsive layouts, and mobile-specific interactions. Tested on iOS and Android devices.

---

## Support

### Get Help

- **Documentation**: [User Guide](USER_GUIDE.md) | [API Docs](API_DOCS.md)
- **Issues**: [GitHub Issues](https://github.com/yourusername/smartbudget/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/smartbudget/discussions)
- **Email**: support@smartbudget.app

### Community

- **Discord**: [Join our Discord](https://discord.gg/smartbudget) (coming soon)
- **Twitter**: [@SmartBudgetApp](https://twitter.com/smartbudgetapp) (coming soon)
- **Blog**: [blog.smartbudget.app](https://blog.smartbudget.app) (coming soon)

---

## License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2026 SmartBudget Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## Acknowledgments

Built with amazing open-source technologies:

- [Next.js](https://nextjs.org/) - React framework
- [TanStack Query](https://tanstack.com/query) - Powerful data synchronization
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS
- [shadcn/ui](https://ui.shadcn.com/) - Beautiful UI components
- [Radix UI](https://www.radix-ui.com/) - Accessible component primitives
- [Prisma](https://www.prisma.io/) - Next-generation database ORM
- [NextAuth.js](https://authjs.dev/) - Authentication for Next.js
- [Recharts](https://recharts.org/) - Composable charting library
- [D3.js](https://d3js.org/) - Data visualization
- [Playwright](https://playwright.dev/) - Reliable end-to-end testing
- [Vitest](https://vitest.dev/) - Blazing fast unit testing
- [Zod](https://zod.dev/) - TypeScript-first schema validation
- [Redis](https://redis.io/) / [Upstash](https://upstash.com/) - High-performance caching
- [Anthropic Claude](https://www.anthropic.com/) - AI-powered merchant research

Special thanks to the open-source community for making projects like this possible.

---

## Star History

If you find SmartBudget useful, please consider starring the repository!

[![Star History Chart](https://api.star-history.com/svg?repos=yourusername/smartbudget&type=Date)](https://star-history.com/#yourusername/smartbudget&Date)

---

<div align="center">

**Made with ❤️ by the SmartBudget Team**

[Website](https://smartbudget.app) • [Documentation](USER_GUIDE.md) • [API](API_DOCS.md) • [Support](mailto:support@smartbudget.app)

</div>
