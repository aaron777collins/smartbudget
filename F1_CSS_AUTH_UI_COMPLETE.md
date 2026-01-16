# SmartBudget Complete Overhaul - CSS, Auth, UI/UX, Security

## Goal
Transform SmartBudget into a SUPER PRETTY, fully functional, secure, production-ready budget management app with username/password authentication.

## Current Issues
1. **CSS Not Working**: Tailwind is installed but not configured - missing @tailwind directives, tailwind.config, postcss.config
2. **Auth System**: Currently email-based, needs username/password with default user aaron7c / KingOfKings12345!
3. **UI/UX**: Needs to be SUPER PRETTY with smooth animations, modern design
4. **Security**: Need secure password storage (bcrypt), rate limiting, audit logging

## Requirements

### 1. Fix CSS Infrastructure (CRITICAL - DO FIRST)
- Create `tailwind.config.ts` with comprehensive theme (colors, animations, dark mode)
- Create `postcss.config.js` with Tailwind and Autoprefixer
- Update `src/app/globals.css` to include:
  - `@tailwind base;`
  - `@tailwind components;`
  - `@tailwind utilities;`
  - CSS variables for light/dark theme
- Verify build works with: `npm run build`
- Test that Tailwind classes actually work in components

### 2. Username/Password Authentication
- **Current**: Email-based auth in Prisma schema
- **Required**: Username-based auth with secure password storage
- Update Prisma schema:
  - Change User model to use `username` instead of email
  - Add `passwordHash` field (bcrypt)
  - Run migration
- Create default user on first run:
  - Username: `aaron7c`
  - Password: `KingOfKings12345!` (store as bcrypt hash)
- Update all auth API routes (`/api/auth/*`)
- Update login UI component to use username field
- Add password validation (min 8 chars, complexity check)

### 3. UI/UX Polish (Make it SUPER PRETTY!)
- **Design System**:
  - Use Tailwind's built-in design tokens
  - Consistent spacing scale (4, 8, 12, 16, 24, 32, 48, 64px)
  - Beautiful color palette with proper dark mode
  - Smooth transitions (duration-200, duration-300)

- **Components**:
  - Add loading states with skeletons
  - Add smooth animations (fade-in, slide-in, scale)
  - Polish buttons (hover states, active states, disabled states)
  - Beautiful form inputs (focus rings, error states)
  - Modern cards with shadows and borders

- **Dashboard**:
  - Beautiful charts with gradients
  - Animated number counters
  - Hover effects on interactive elements
  - Responsive grid layout

- **Mobile First**:
  - Perfect on mobile, tablet, desktop
  - Touch-friendly hit areas (min 44x44px)
  - Responsive navigation
  - Mobile-optimized forms

### 4. Security Hardening
- **Password Security**:
  - Use bcrypt with salt rounds = 12
  - Never store plain text passwords
  - Hash comparison for login

- **Rate Limiting**:
  - Max 5 login attempts per IP per 15 minutes
  - Exponential backoff on failures
  - Store attempt tracking in memory or Redis

- **Session Security**:
  - Secure httpOnly cookies
  - CSRF protection
  - Session timeout after 24 hours

- **Audit Logging**:
  - Log all login attempts (success/failure)
  - Log password changes
  - Log critical actions
  - Store in database with timestamp, IP, user agent

### 5. Testing & Validation
- Test login flow end-to-end
- Test CSS renders properly
- Test responsive design on mobile
- Test dark mode toggle
- Verify password security (bcrypt hashing)
- Test rate limiting
- Build passes: `npm run build`
- Type check passes: `npm run type-check` (if exists)

## Success Criteria
- [ ] CSS works perfectly - all Tailwind classes render
- [ ] Can login with username `aaron7c` and password `KingOfKings12345!`
- [ ] UI is SUPER PRETTY with smooth animations
- [ ] Works perfectly on mobile, tablet, desktop
- [ ] Passwords stored securely (bcrypt)
- [ ] Rate limiting active
- [ ] Build passes without errors
- [ ] App is production-ready

## Implementation Order
1. Fix CSS infrastructure (blocks everything visual)
2. Fix auth system (username/password with bcrypt)
3. Polish UI/UX (make it beautiful)
4. Add security features (rate limiting, audit logging)
5. Test everything thoroughly

## Notes
- Work directory: `/home/ubuntu/repos/smartbudget`
- Database: Prisma with PostgreSQL (connection in .env)
- Framework: Next.js 16 with App Router
- UI Library: shadcn/ui with Tailwind CSS
- Keep all existing features working (budget tracking, CSV import, etc.)
