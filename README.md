# 🚩 CTF Platform

A modern, full-stack Capture The Flag (CTF) platform built with React, Express, and PostgreSQL. This platform provides a comprehensive environment for hosting cybersecurity challenges with real-time scoring, user management, and an intuitive admin panel.

## ✨ Features

### 🎯 User Features
- **User Authentication** - Secure registration and login system with session management
- **Challenge Browser** - Browse challenges by category (Web, Crypto, Forensics, Binary, Reverse)
- **Difficulty Levels** - Challenges categorized as Easy, Medium, or Hard
- **Flag Submission** - Submit flags and get instant feedback with rate limiting
- **Real-time Scoring** - Track your points and progress
- **Leaderboard** - Compete with other players and view rankings
- **Announcement System** - Stay updated with platform announcements via beautiful animated popups
- **Responsive Design** - Works perfectly on all devices

### 🛡️ Admin Features
- **Modern Admin Dashboard** - Overview of platform statistics and activity
- **Challenge Management** - Create, edit, and delete challenges with a user-friendly interface
- **Announcement Management** - Create and manage platform-wide announcements with priority levels
- **Player Analytics** - View player statistics and submission history
- **Responsive Admin Panel** - Fully responsive with sidebar navigation
- **Stat Cards** - Real-time statistics with beautiful gradient designs

### 🎨 Design & UX
- **Modern UI** - Built with Tailwind CSS and Radix UI components
- **Smooth Animations** - Framer Motion powered animations throughout the app
- **Dark Mode Support** - Seamless dark mode integration
- **Gradient Accents** - Beautiful gradient color schemes for visual appeal
- **Loading States** - Elegant loading animations and skeletons
- **Error Handling** - User-friendly error messages and error boundaries

### 🔒 Security Features
- **CSRF Protection** - Double-submit cookie pattern for CSRF prevention
- **Session Management** - Secure session handling with PostgreSQL storage (serverless-compatible)
- **Password Hashing** - Bcrypt with 10 rounds for secure password storage
- **Security Headers** - Helmet.js for comprehensive security headers (CSP, HSTS, XSS protection)
- **Admin-only Routes** - Protected routes for administrative functions
- **Input Validation** - Zod schema validation for all API endpoints
- **Rate Limiting** - Configurable rate limits on authentication and submissions
- **SQL Injection Prevention** - Parameterized queries via Drizzle ORM and Neon

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern UI library with hooks
- **TypeScript** - Type-safe development
- **Vite** - Lightning-fast build tool
- **TanStack Query** - Powerful data synchronization
- **Wouter** - Lightweight routing (2kb)
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives
- **Framer Motion** - Production-ready animations
- **React Hook Form** - Performant form validation

### Backend
- **Express.js** - Fast, unopinionated web framework
- **TypeScript** - Type-safe server development
- **PostgreSQL** - Reliable relational database (via Neon)
- **Drizzle ORM** - Type-safe SQL toolkit
- **Express Session** - Session management with PostgreSQL store
- **Helmet** - Security middleware
- **Bcrypt** - Password hashing

### Development & Deployment
- **tsx** - TypeScript execution for Node.js
- **Drizzle Kit** - Database migrations
- **ESBuild** - Fast JavaScript bundler
- **Vercel** - Serverless deployment platform
- **Neon** - Serverless PostgreSQL

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v18 or higher)
- **npm** (v9 or higher)
- **PostgreSQL** (v14 or higher) or a Neon account for serverless PostgreSQL

## 🚀 Quick Start

### Local Development

#### 1. Clone the Repository
```bash
git clone <repository-url>
cd ctf-platform
```

#### 2. Install Dependencies
```bash
npm install
```

#### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/ctf_db
SESSION_SECRET=your-super-secret-key-min-32-chars
NODE_ENV=development
```

**Generate a secure SESSION_SECRET:**
```bash
openssl rand -base64 32
```

#### 4. Push Database Schema
```bash
npm run db:push
```

This will create all necessary tables in your database.

#### 5. Create Admin User
```bash
npx tsx server/scripts/quick-init-admin.ts
```

**Default Admin Credentials:**
- Username: `admin`
- Password: `Admin123!@#`

> ⚠️ **Important:** Change the admin password immediately after first login!

#### 6. Start Development Server
```bash
npm run dev
```

The application will start on `http://localhost:5000`

## ☁️ Deploy to Vercel

This application is optimized for serverless deployment on Vercel. See **[VERCEL_DEPLOY.md](./VERCEL_DEPLOY.md)** for detailed Vietnamese deployment instructions.

### Quick Deployment Steps

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/ctf-platform.git
   git push -u origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository

3. **Configure Environment Variables**
   Add these in Vercel project settings:
   ```
   DATABASE_URL=your_neon_or_vercel_postgres_url
   SESSION_SECRET=your_strong_random_secret
   NODE_ENV=production
   ```

4. **Deploy**
   - Click "Deploy"
   - Wait 2-5 minutes for build completion
   - Your app will be live at `https://your-app.vercel.app`

5. **Initialize Database**
   ```bash
   vercel env pull .env.local
   npm run db:push
   npx tsx server/scripts/quick-init-admin.ts
   ```

## 📁 Project Structure

```
ctf-platform/
├── api/                       # Serverless functions for Vercel
│   └── index.mjs             # Express app as serverless function (ES modules)
├── client/                    # Frontend application
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   │   ├── ui/          # Radix UI components
│   │   │   ├── ChallengeCard.tsx
│   │   │   ├── AnnouncementPopup.tsx
│   │   │   ├── Layout.tsx
│   │   │   └── PageLoader.tsx
│   │   ├── pages/           # Page components
│   │   │   ├── Admin.tsx
│   │   │   ├── AdminLogin.tsx
│   │   │   ├── ChallengeList.tsx
│   │   │   ├── ChallengeDetail.tsx
│   │   │   ├── Leaderboard.tsx
│   │   │   ├── Login.tsx
│   │   │   └── Register.tsx
│   │   ├── hooks/           # Custom React hooks
│   │   │   ├── useAuth.ts
│   │   │   ├── useAdminAuth.ts
│   │   │   └── use-toast.ts
│   │   ├── services/        # API service layer
│   │   │   └── api.service.ts
│   │   ├── lib/             # Utility functions
│   │   └── index.css        # Global styles and animations
│   ├── public/              # Static assets
│   └── index.html
├── server/                   # Backend application (for local dev)
│   ├── routes/              # API route handlers
│   │   ├── auth.routes.ts
│   │   ├── admin.routes.ts
│   │   ├── challenge.routes.ts
│   │   ├── announcement.routes.ts
│   │   └── public.routes.ts
│   ├── middleware/          # Express middleware
│   │   └── csrf.ts
│   ├── services/            # Business logic
│   ├── scripts/             # Utility scripts
│   │   ├── init-admin.ts
│   │   └── quick-init-admin.ts
│   ├── auth.ts             # Authentication configuration
│   ├── storage.ts          # Database operations
│   ├── db.ts               # Database connection
│   └── index.ts            # Server entry point
├── shared/                  # Shared code between client/server
│   ├── schema.ts           # Database schema (Drizzle)
│   └── utils/
├── dist/                    # Build output
│   └── public/             # Frontend production build
├── vercel.json             # Vercel deployment configuration
├── .vercelignore           # Files to exclude from deployment
├── VERCEL_DEPLOY.md        # Detailed deployment guide (Vietnamese)
├── package.json
└── README.md
```

## 🌐 Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `SESSION_SECRET` | Secret key for session encryption (min 32 chars) | Generate with `openssl rand -base64 32` |
| `NODE_ENV` | Environment mode | `development` or `production` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `FRONTEND_URL` | Frontend URL for CORS | `*` |

> ⚠️ **Security Warning:** `SESSION_SECRET` is **mandatory**. The application will throw an error if not set. Never use a default or weak value in production.

## 📖 Usage Guide

### For Players

1. **Register an Account**
   - Navigate to `/register`
   - Create your account with username, email, and password
   - Passwords must be at least 8 characters

2. **Browse Challenges**
   - View all available challenges on the homepage
   - Filter by category or difficulty
   - See your solved challenges with checkmarks
   - Track your progress with the stats dashboard

3. **Solve Challenges**
   - Click on a challenge to view its description (supports Markdown)
   - Read the challenge details and hints
   - Submit flags in the correct format
   - Earn points for correct submissions
   - Cannot submit if already solved (displayed with info message)

4. **Check the Leaderboard**
   - View your ranking among other players
   - See top performers and their scores
   - Track solved challenge count

### For Administrators

1. **Login to Admin Panel**
   - Navigate to `/admin/login`
   - Use your admin credentials
   - Admin sessions are separate from user sessions

2. **Dashboard Overview**
   - View total challenges, users, submissions
   - See platform statistics with gradient cards
   - Monitor recent activity

3. **Manage Challenges**
   - Create new challenges with:
     - Title and description (Markdown supported)
     - Category (Web, Crypto, Forensics, Binary, Reverse)
     - Difficulty (Easy, Medium, Hard)
     - Points (10-1000)
     - Flag (correct answer)
   - Edit existing challenges
   - Delete challenges (also deletes associated submissions)
   - View all challenges in a filterable table

4. **Manage Announcements**
   - Create announcements with:
     - Title and content
     - Priority (low, normal, high, urgent)
     - Active/Inactive status
   - Edit or delete announcements
   - Active announcements appear to all users as popups

5. **Monitor Platform**
   - View statistics on the dashboard
   - Track player activity and submissions
   - Monitor challenge completion rates

> 🔒 **Note:** Admins cannot submit flags. The admin role is for platform management only.

## 🗄️ Database Schema

### Tables

- **players** - User accounts for participants
  - `id`, `username`, `email`, `password_hash`, `score`, `created_at`

- **challenges** - CTF challenges
  - `id`, `title`, `description`, `flag`, `points`, `category`, `difficulty`, `created_at`

- **submissions** - Flag submission records
  - `id`, `player_id`, `challenge_id`, `submitted_flag`, `is_correct`, `submitted_at`

- **admins** - Admin accounts with elevated privileges
  - `id`, `username`, `password_hash`, `created_at`

- **announcements** - Platform announcements
  - `id`, `title`, `content`, `priority`, `is_active`, `created_at`

- **session** - User session data (auto-created by connect-pg-simple)
  - `sid`, `sess`, `expire`

## 🔐 Security Considerations

### Authentication & Sessions
- Passwords hashed with bcrypt (10 rounds)
- Sessions stored in PostgreSQL for serverless compatibility
- Session cookies: `secure`, `httpOnly`, `sameSite: strict`
- Rolling sessions (24-hour expiration, renewed on activity)
- Separate admin and user session management

### API Security
- CSRF protection with double-submit cookie pattern
- Rate limiting on:
  - Auth endpoints (5 requests per 15 min)
  - Admin login (3 requests per 15 min)
  - Flag submission (10 requests per minute)
- Input validation with Zod schemas
- SQL injection prevention via parameterized queries

### Headers & Policies
- Content Security Policy (CSP)
- HTTP Strict Transport Security (HSTS)
- X-Frame-Options (clickjacking protection)
- X-Content-Type-Options (MIME sniffing prevention)
- XSS Filter enabled
- Referrer Policy: strict-origin-when-cross-origin

## 🎨 Customization

### Branding
```css
/* Update colors in client/src/index.css */
:root {
  --primary: 222.2 47.4% 11.2%;
  --primary-foreground: 210 40% 98%;
  /* ... other CSS variables */
}
```

### Challenges
Add sample challenges in `server/storage.ts`:
```typescript
await storage.createChallenge({
  title: "Your Challenge",
  description: "Challenge description with **markdown**",
  flag: "CTF{your_flag_here}",
  points: 100,
  category: "Web",
  difficulty: "Easy"
});
```

### UI Components
- All UI components are in `client/src/components/ui/`
- Built with Radix UI for accessibility
- Customizable via className prop with Tailwind

## 🧪 API Endpoints

### Public Endpoints
- `GET /api/challenges` - List all challenges (without flags)
- `GET /api/challenges/:id` - Get challenge details
- `GET /api/leaderboard` - Get leaderboard
- `GET /api/announcements` - Get active announcements

### Authenticated Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/user` - Get current user
- `POST /api/logout` - Logout (destroys session)
- `POST /api/challenges/:id/submit` - Submit flag
- `GET /api/solved` - Get solved challenges for current user

### Admin Endpoints
- `POST /api/admin/login` - Admin login
- `POST /api/admin/logout` - Admin logout
- `GET /api/admin/session` - Check admin session
- `GET /api/admin/stats` - Get platform statistics
- `GET /api/admin/challenges` - Get all challenges (with flags)
- `POST /api/admin/challenges` - Create challenge
- `PUT /api/admin/challenges/:id` - Update challenge
- `DELETE /api/admin/challenges/:id` - Delete challenge
- `GET /api/admin/announcements` - Get all announcements
- `POST /api/admin/announcements` - Create announcement
- `PUT /api/admin/announcements/:id` - Update announcement
- `DELETE /api/admin/announcements/:id` - Delete announcement

## 🐛 Troubleshooting

### Database Connection Issues
```bash
# Check database URL is set correctly
echo $DATABASE_URL

# Test database connection
npx drizzle-kit studio
```

### Port Already in Use
The application runs on port 5000 by default. Change in `server/index.ts`:
```typescript
const PORT = 5000; // Change to desired port
```

### Admin User Not Created
Run the admin creation script manually:
```bash
npx tsx server/scripts/quick-init-admin.ts
```

### Session Issues on Vercel
Sessions are stored in PostgreSQL using `connect-pg-simple`. Ensure:
- `DATABASE_URL` is set correctly
- Database is accessible from Vercel
- `SESSION_SECRET` is set

### Build Failures
```bash
# Clear cache and reinstall
rm -rf node_modules dist
npm install
npm run build
```

## 📝 Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build frontend and backend for production |
| `npm start` | Run production server (local) |
| `npm run check` | TypeScript type checking |
| `npm run db:push` | Push database schema changes to DB |

## 🚢 Deployment Options

### Option 1: Vercel (Recommended)
- Serverless deployment
- Auto-scaling
- Global CDN
- Free tier available
- See [VERCEL_DEPLOY.md](./VERCEL_DEPLOY.md) for detailed guide

### Option 2: Traditional Hosting
- VPS or dedicated server
- Requires PostgreSQL installation
- Use `npm run build && npm start`
- Configure reverse proxy (nginx/apache)

### Option 3: Docker
- Create Dockerfile (not included)
- Use docker-compose with PostgreSQL
- Good for self-hosting

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Use provided ESLint and Prettier configs (if available)
- Write meaningful commit messages
- Test your changes thoroughly
- Update documentation as needed

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **UI Components** - [Radix UI](https://www.radix-ui.com/)
- **Icons** - [Lucide React](https://lucide.dev/)
- **Animations** - [Framer Motion](https://www.framer.com/motion/)
- **Database** - [Neon](https://neon.tech/) (Serverless PostgreSQL)
- **Deployment** - [Vercel](https://vercel.com/)
- Inspired by popular CTF platforms like CTFd and PicoCTF

## 📞 Support

For issues and questions:
- Open an issue on GitHub
- Check existing documentation
- Review troubleshooting section

---

**Built with ❤️ for the cybersecurity community**

> 🔒 Remember: Always change default admin credentials and keep your SESSION_SECRET secure!
