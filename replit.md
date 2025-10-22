# CTF Platform

## Overview

A modern, enterprise-grade Capture The Flag (CTF) platform for hosting cybersecurity challenges. The platform enables players to browse challenges across multiple categories (Web, Crypto, Forensics, Binary, Reverse), submit flags, track progress on a leaderboard, and receive platform-wide announcements. Administrators can manage challenges, announcements, and view player analytics through a dedicated admin dashboard.

**Latest Update (October 2025):** Comprehensive security hardening with enterprise-level protections, installation wizard, and database management tools.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

### Security Enhancements (October 2025)
- **CRITICAL**: Fixed CSRF bypass vulnerability - now enforces strict double-submit cookie pattern in all environments
- **CRITICAL**: Fixed session fixation vulnerability - sessions regenerated on login/logout
- **CRITICAL**: Fixed admin password hashing inconsistency - all admin creation paths now consistently hash passwords at storage layer
- **CRITICAL**: Fixed install page access control - users blocked after setup, admins can still access
- **CRITICAL**: Fixed information disclosure on install page - no sensitive system info exposed to non-admin users
- **NEW**: Strong password validation (8+ chars, uppercase, lowercase, numbers) enforced in registration schema
- **NEW**: Admin login now uses Zod validation schema with strict input sanitization
- **NEW**: Separate admin-system-check endpoint for full system information (admin-only)
- **IMPROVED**: Error handling no longer leaks stack traces in production
- **IMPROVED**: Sample data initialization race condition fixed with proper async/await
- **IMPROVED**: Install page with guided setup for first-time deployment
- **IMPROVED**: Install page now shows only safe, minimal system information

### New Features
- **Installation Wizard**: `/install` route provides guided setup with database checks and admin account creation
- **Database Management**: Backup and export scripts for data portability
  - `npm run db:backup` - Creates JSON backup with metadata
  - `npm run db:export` - Exports SQL dump for migration
- **Enhanced Rate Limiting**: Configurable limits on authentication and flag submission endpoints

## System Architecture

### Frontend Architecture

**Technology Stack:**
- React 18 with TypeScript for type safety
- Vite as the build tool for fast development and optimized production builds
- TanStack Query (React Query) for server state management and caching
- Wouter for lightweight client-side routing (2kb alternative to React Router)
- Radix UI components for accessible, unstyled UI primitives
- Tailwind CSS for utility-first styling with custom design system

**Component Organization:**
- Page components in `client/src/pages/`:
  - Core: ChallengeList, ChallengeDetail, Leaderboard
  - Auth: Login, Register, AdminLogin
  - Admin: Admin (dashboard)
  - Setup: **Install** (new - guided installation)
- Reusable UI components in `client/src/components/`
- Shadcn UI component library in `client/src/components/ui/`
- Custom hooks in `client/src/hooks/` for authentication state

**State Management Strategy:**
- TanStack Query handles all server state with automatic caching
- URL-based query keys for simplicity
- No global client-side state management
- Local component state for UI-specific concerns

**Security on Frontend:**
- **CSRF tokens**: Automatically included in all POST/PUT/DELETE/PATCH requests via custom `apiRequest` helper
- **XSS Protection**: Markdown rendering with DOMPurify sanitization
- **Input Validation**: Client-side validation before submission
- **Separate Auth Flows**: Distinct authentication paths for users and admins

### Backend Architecture

**Technology Stack:**
- Express.js for HTTP server and API routing
- TypeScript with ES modules
- Drizzle ORM for type-safe database queries
- PostgreSQL via node-postgres (pg) driver
- Bcrypt for password hashing (12 salt rounds)
- Helmet for security headers
- Express-session with PostgreSQL storage

**API Structure:**
- Modular route organization in `server/routes/`:
  - `auth.routes.ts` - User registration and login (with session regeneration)
  - `admin.routes.ts` - Admin authentication and protected admin endpoints
  - `challenge.routes.ts` - Challenge CRUD and flag submission
  - `announcement.routes.ts` - Announcement management
  - `public.routes.ts` - Leaderboard, logout, solved challenges
  - **`install.routes.ts`** (new) - Installation and setup endpoints
- Rate limiting:
  - Authentication: 5 attempts/15min (users), 3 attempts/15min (admins)
  - Flag submissions: 10 attempts/minute
  - Install: 10 attempts/15min

**Authentication & Authorization:**
- **Session Regeneration**: Sessions regenerated on login/logout to prevent fixation attacks
- **Dual Authentication**: Separate sessions for users and admins
- **Session Storage**: PostgreSQL-backed via connect-pg-simple
- **Password Hashing**: Bcrypt with 12 salt rounds
- **Password Strength**: Enforced via Zod schema (8+ chars, mixed case, numbers)
- **Session Config**: 1-week TTL, HTTP-only cookies, strict SameSite, secure in production
- **Privilege Separation**: Admin session clears user session and vice versa

**Security Implementation (ENTERPRISE GRADE):**

1. **CSRF Protection (FIXED)**:
   - Double-submit cookie pattern with strict enforcement
   - Requires both cookie AND header token on all state-changing requests
   - No bypass allowed - rejects requests without matching tokens
   - Cookie set on first GET request, validated on POST/PUT/DELETE/PATCH

2. **Session Security (FIXED)**:
   - Session ID regeneration on privilege changes (login/logout)
   - Prevents session fixation attacks
   - Automatic session cleanup on logout
   - Cookie clearing on session destroy

3. **Input Validation**:
   - Zod schemas for all user inputs
   - Admin login uses `loginAdminSchema` with strict bounds
   - User registration uses `registerUserSchema` with password strength validation
   - All validation errors return user-friendly messages via `fromZodError`

4. **Error Handling**:
   - Stack traces hidden in production
   - Generic error messages for clients
   - Detailed logging for developers (console only)
   - No information disclosure via error responses

5. **Security Headers (Helmet.js)**:
   - Content Security Policy (stricter in production)
   - HSTS with 1-year max-age and preload
   - XSS filter enabled
   - MIME sniffing prevention
   - Clickjacking protection (frameAncestors: none)
   - Referrer policy: strict-origin-when-cross-origin

6. **SQL Injection Prevention**:
   - Parameterized queries via Drizzle ORM
   - No raw SQL concatenation
   - Type-safe query builders

7. **Rate Limiting**:
   - Express-rate-limit on sensitive endpoints
   - Per-IP tracking with proxy trust
   - Configurable windows and thresholds

**Database Management:**
- **Initialization**: Automatic sample data seeding with race condition protection
- **Backup System**: JSON backup with statistics (`npm run db:backup`)
- **Export System**: SQL dump for migrations (`npm run db:export`)
- **Schema Management**: Drizzle Kit for schema synchronization

### Data Storage

**Database Technology:**
- PostgreSQL as primary database
- Drizzle ORM for schema definition and type-safe queries
- Schema defined in `shared/schema.ts` for type sharing

**Database Schema:**
- `challenges` - CTF challenges with flags
- `players` - User accounts with scores
- `submissions` - Flag submission history
- `admin_users` - Admin accounts (separate from players)
- `sessions` - Session storage
- `announcements` - Platform announcements

**Data Access Pattern:**
- Repository pattern via `IStorage` interface
- All database operations abstracted through storage methods
- UUID primary keys via PostgreSQL `gen_random_uuid()`
- Sample data initialization with existence check

### External Dependencies

**Required Environment Variables:**
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Session encryption secret
- `NODE_ENV` - Environment (development/production)

**Security Dependencies:**
- Helmet.js - HTTP security headers
- Bcrypt - Password hashing
- DOMPurify - HTML sanitization
- Zod - Schema validation
- Express-rate-limit - Rate limiting

**UI Libraries:**
- Radix UI - Accessible component primitives
- Tailwind CSS - Utility-first styling
- Lucide React - Icons

## Installation & Setup

### First-Time Setup

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment**:
   - Ensure `DATABASE_URL` is set (automatically provided by Replit)
   - Ensure `SESSION_SECRET` is set (automatically provided by Replit)

3. **Initialize Database**:
   ```bash
   npm run db:push
   ```

4. **Run Application**:
   ```bash
   npm run dev
   ```

5. **Complete Setup**:
   - Navigate to `/install` in your browser
   - Follow the guided installation wizard
   - Create your first admin account
   - System is ready to use!

### Database Management

**Backup Database** (JSON format with metadata):
```bash
npm run db:backup
```
Creates: `backups/ctf-backup-TIMESTAMP.json`

**Export Database** (SQL dump for migration):
```bash
npm run db:export
```
Creates: `exports/ctf-export-TIMESTAMP.sql`

**Push Schema Changes**:
```bash
npm run db:push
```

### Development vs Production

**Development Mode**:
- Runs on port 5000
- Hot module replacement via Vite
- Detailed error messages
- Relaxed CSP for dev tools

**Production Mode**:
1. Build application:
   ```bash
   npm run build
   ```

2. Start production server:
   ```bash
   npm start
   ```

Production features:
- Static file serving from `dist/public/`
- Strict CSP
- Generic error messages
- HTTPS enforcement (secure cookies)
- Stack trace hiding

## Security Best Practices

1. **Always use HTTPS in production** - Replit provides this automatically
2. **Rotate SESSION_SECRET regularly** - Change via environment variables
3. **Backup database before major changes** - Use `npm run db:backup`
4. **Monitor rate limit logs** - Check for unusual authentication attempts
5. **Review admin accounts periodically** - Ensure only authorized users have access
6. **Keep dependencies updated** - Run `npm audit` regularly

## Deployment

Configured for Replit deployment with:
- Automatic workflow setup
- Environment variable management
- PostgreSQL database provisioning
- Port 5000 binding with 0.0.0.0 host

For manual deployment or other platforms:
- Set `DATABASE_URL` and `SESSION_SECRET`
- Run `npm run build` and `npm start`
- Ensure PostgreSQL database is accessible
- Configure reverse proxy for HTTPS

## Troubleshooting

**Database Connection Issues**:
- Check `DATABASE_URL` environment variable
- Verify PostgreSQL is running
- Test connection with `npm run db:push`

**Session Problems**:
- Ensure `SESSION_SECRET` is set
- Check PostgreSQL session table exists
- Verify cookies are enabled in browser

**Installation Wizard Not Working**:
- Check `/api/install/check` endpoint
- Verify database connectivity
- Check server logs for errors

**CSRF Token Errors** (in production):
- Clear browser cookies
- Ensure JavaScript is enabled
- Check network requests include `x-csrf-token` header
