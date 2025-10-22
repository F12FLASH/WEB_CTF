# CTF Platform

## Overview

A modern, full-stack Capture The Flag (CTF) platform for hosting cybersecurity challenges. The platform enables players to browse challenges across multiple categories (Web, Crypto, Forensics, Binary, Reverse), submit flags, track progress on a leaderboard, and receive platform-wide announcements. Administrators can manage challenges, announcements, and view player analytics through a dedicated admin dashboard.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- React 18 with TypeScript for type safety
- Vite as the build tool for fast development and optimized production builds
- TanStack Query (React Query) for server state management and caching
- Wouter for lightweight client-side routing (2kb alternative to React Router)
- Radix UI components for accessible, unstyled UI primitives
- Tailwind CSS for utility-first styling with custom design system
- Framer Motion for animations (mentioned in README but not visible in code)

**Component Organization:**
- Page components in `client/src/pages/` (ChallengeList, ChallengeDetail, Leaderboard, Admin, Login, Register)
- Reusable UI components in `client/src/components/` (Layout, ChallengeCard, AnnouncementPopup, PageLoader, ErrorBoundary)
- Shadcn UI component library in `client/src/components/ui/` for consistent, customizable design primitives
- Custom hooks in `client/src/hooks/` for authentication state (useAuth, useAdminAuth)

**State Management Strategy:**
- TanStack Query handles all server state with automatic caching, refetching, and background updates
- Query keys are URL-based for simplicity (e.g., `["/api/challenges"]`)
- No global client-side state management needed - server state is source of truth
- Local component state (useState) for UI-specific concerns like forms and modals

**Security on Frontend:**
- CSRF tokens automatically included in all state-changing requests via custom `apiRequest` helper
- Markdown rendering with DOMPurify sanitization to prevent XSS attacks
- Input validation before submission
- Separate authentication flows for regular users and admins

### Backend Architecture

**Technology Stack:**
- Express.js for HTTP server and API routing
- TypeScript with ES modules (type: "module" in package.json)
- Drizzle ORM for type-safe database queries
- PostgreSQL via node-postgres (pg) driver
- Bcrypt for password hashing with 12 salt rounds
- Helmet for security headers (CSP, HSTS, XSS protection)
- Express-session with connect-pg-simple for PostgreSQL-backed session storage

**API Structure:**
- Modular route organization in `server/routes/`:
  - `auth.routes.ts` - User registration and login
  - `admin.routes.ts` - Admin authentication and protected admin endpoints
  - `challenge.routes.ts` - Challenge CRUD and flag submission
  - `announcement.routes.ts` - Announcement management
  - `public.routes.ts` - Leaderboard, logout, solved challenges
- Rate limiting on authentication endpoints (5 attempts per 15 minutes for users, 3 for admins)
- Stricter rate limiting on flag submissions (10 per minute) to prevent brute force
- All routes protected by CSRF verification middleware except in development mode

**Authentication & Authorization:**
- Dual authentication system: separate sessions for regular users and admins
- Session-based authentication with PostgreSQL storage for serverless compatibility
- Password hashing with bcrypt (12 rounds) via AuthService
- Middleware guards: `requireUser` and `requireAdmin` for route protection
- Session configuration: 1-week TTL, HTTP-only cookies, strict SameSite, secure in production
- Admin session clears user session and vice versa to prevent privilege confusion

**Security Implementation:**
- Double-submit cookie pattern for CSRF protection (cookie + header verification)
- Helmet.js for comprehensive security headers
- Content Security Policy (CSP) with stricter rules in production
- HSTS with 1-year max-age and preload
- XSS filter and MIME sniffing prevention
- Frame protection to prevent clickjacking
- Input validation using Zod schemas
- SQL injection prevention via parameterized queries (Drizzle ORM)

**Serverless Deployment Support:**
- Configured for Vercel deployment with serverless functions
- `vercel.json` routes API requests to `api/index.mjs`
- Database connection pooling configured for serverless environments
- Session storage uses PostgreSQL instead of in-memory to support multiple serverless instances

### Data Storage

**Database Technology:**
- PostgreSQL as primary database (supports Neon for serverless or standard Postgres)
- Drizzle ORM for schema definition and type-safe queries
- Schema defined in `shared/schema.ts` for sharing types between frontend and backend

**Database Schema:**
- `challenges` - CTF challenge definitions with title, description, category, difficulty, points, and flag
- `players` - User accounts with username, email, password hash, score, and creation timestamp
- `submissions` - Flag submission history linking players to challenges with correctness flag
- `admin_users` - Separate admin accounts with username and password hash
- `sessions` - PostgreSQL-backed session storage (sid, sess JSON, expire timestamp) for serverless compatibility
- `announcements` - Platform announcements with title, content, priority, active status, and creation metadata

**Data Access Pattern:**
- Repository pattern via `IStorage` interface in `server/storage.ts`
- All database operations abstracted through storage methods
- Drizzle ORM provides type safety from schema to queries
- UUID primary keys generated via PostgreSQL `gen_random_uuid()`

### External Dependencies

**Database:**
- PostgreSQL database (Neon for serverless or traditional Postgres)
- Connection via environment variable `DATABASE_URL`
- Drizzle ORM for migrations and queries

**Session Storage:**
- PostgreSQL-backed session storage via connect-pg-simple
- Enables stateless serverless functions while maintaining sessions
- Requires `SESSION_SECRET` environment variable

**Third-party Services:**
- Vercel for serverless deployment (optional)
- Neon Database for serverless PostgreSQL (optional, can use any Postgres provider)

**Security Dependencies:**
- Helmet.js for HTTP security headers
- Bcrypt for password hashing
- DOMPurify for HTML sanitization
- Zod for schema validation

**UI Libraries:**
- Radix UI primitives for accessible components
- Tailwind CSS for styling
- Google Fonts (Inter, JetBrains Mono, Space Grotesk)
- Lucide React for icons

**Development Tools:**
- Vite for frontend build
- esbuild for backend bundling
- TypeScript for type checking
- Replit-specific plugins for development environment integration