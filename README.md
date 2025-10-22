# CTF Platform

A modern, full-stack Capture The Flag (CTF) platform built with React, Express, and PostgreSQL. This platform provides a comprehensive environment for hosting cybersecurity challenges with real-time scoring, user management, and an intuitive admin panel.

## Features

### User Features
- **User Authentication** - Secure registration and login system with session management
- **Challenge Browser** - Browse challenges by category (Web, Crypto, Forensics, Binary, Reverse)
- **Difficulty Levels** - Challenges categorized as Easy, Medium, or Hard
- **Flag Submission** - Submit flags and get instant feedback
- **Real-time Scoring** - Track your points and progress
- **Leaderboard** - Compete with other players and view rankings
- **Announcement System** - Stay updated with platform announcements via beautiful animated popups

### Admin Features
- **Modern Admin Dashboard** - Overview of platform statistics and activity
- **Challenge Management** - Create, edit, and delete challenges with a user-friendly interface
- **Announcement Management** - Create and manage platform-wide announcements
- **Player Analytics** - View player statistics and submission history
- **Responsive Design** - Fully responsive admin panel with sidebar navigation

### Design & UX
- **Modern UI** - Built with Tailwind CSS and Radix UI components
- **Smooth Animations** - Framer Motion powered animations throughout the app
- **Dark Mode Support** - Seamless dark mode integration
- **Responsive Layout** - Works perfectly on desktop, tablet, and mobile devices
- **Gradient Accents** - Beautiful gradient color schemes for visual appeal

### Security Features
- **CSRF Protection** - Double-submit cookie pattern for CSRF prevention
- **Session Management** - Secure session handling with rolling sessions
- **Password Hashing** - Bcrypt with 12 rounds for secure password storage
- **Security Headers** - Helmet.js for comprehensive security headers (CSP, HSTS, XSS protection)
- **Admin-only Routes** - Protected routes for administrative functions
- **Input Validation** - Zod schema validation for all API endpoints

## Tech Stack

### Frontend
- **React 18** - Modern UI library with hooks
- **TypeScript** - Type-safe development
- **Vite** - Lightning-fast build tool
- **TanStack Query** - Powerful data synchronization
- **Wouter** - Lightweight routing
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives
- **Framer Motion** - Production-ready animations

### Backend
- **Express.js** - Fast, unopinionated web framework
- **TypeScript** - Type-safe server development
- **PostgreSQL** - Reliable relational database
- **Drizzle ORM** - Type-safe SQL toolkit
- **Passport.js** - Authentication middleware
- **Express Session** - Session management

### Development Tools
- **tsx** - TypeScript execution for Node.js
- **Drizzle Kit** - Database migrations
- **ESBuild** - Fast JavaScript bundler

## Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v18 or higher)
- **npm** (v9 or higher)
- **PostgreSQL** (v14 or higher)

## Installation

### 1. Clone the Repository
```bash
git clone <repository-url>
cd ctf-platform
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Database

The platform uses PostgreSQL. If you're running on Replit, the database is automatically configured. For local development:

1. Create a PostgreSQL database
2. Set the `DATABASE_URL` environment variable:
```bash
export DATABASE_URL="postgresql://username:password@localhost:5432/ctf_db"
```

### 4. Push Database Schema
```bash
npm run db:push
```

This will create all necessary tables in your database.

### 5. Create Admin User
```bash
npx tsx server/scripts/quick-init-admin.ts
```

**Default Admin Credentials:**
- Username: `admin`
- Password: `Admin123!@#`

> **Important:** Change the admin password immediately after first login!

## Running the Application

### Development Mode
```bash
npm run dev
```

The application will start on `http://0.0.0.0:5000`

### Production Build
```bash
# Build the application
npm run build

# Start production server
npm start
```

## Project Structure

```
ctf-platform/
├── client/                    # Frontend application
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   │   ├── ui/          # Radix UI components
│   │   │   ├── ChallengeCard.tsx
│   │   │   ├── AnnouncementPopup.tsx
│   │   │   └── Layout.tsx
│   │   ├── pages/           # Page components
│   │   │   ├── Admin.tsx
│   │   │   ├── ChallengeList.tsx
│   │   │   ├── ChallengeDetail.tsx
│   │   │   ├── Leaderboard.tsx
│   │   │   └── Login.tsx
│   │   ├── hooks/           # Custom React hooks
│   │   ├── lib/             # Utility functions
│   │   └── index.css        # Global styles
│   └── public/              # Static assets
├── server/                   # Backend application
│   ├── routes/              # API route handlers
│   │   ├── auth.routes.ts
│   │   ├── admin.routes.ts
│   │   ├── challenge.routes.ts
│   │   └── announcement.routes.ts
│   ├── middleware/          # Express middleware
│   ├── services/            # Business logic
│   ├── scripts/             # Utility scripts
│   ├── auth.ts             # Authentication configuration
│   ├── storage.ts          # Database operations
│   └── index.ts            # Server entry point
├── shared/                  # Shared code between client/server
│   └── schema.ts           # Zod schemas and types
└── package.json
```

## Usage Guide

### For Players

1. **Register an Account**
   - Navigate to `/register`
   - Create your account with username, email, and password

2. **Browse Challenges**
   - View all available challenges on the homepage
   - Filter by category or difficulty
   - Track your progress with the stats dashboard

3. **Solve Challenges**
   - Click on a challenge to view its description
   - Submit flags in the format provided
   - Earn points for correct submissions

4. **Check the Leaderboard**
   - View your ranking among other players
   - See top performers and their scores

### For Administrators

1. **Login to Admin Panel**
   - Navigate to `/admin/login`
   - Use your admin credentials

2. **Manage Challenges**
   - Create new challenges with title, description, category, difficulty, points, and flag
   - Edit existing challenges
   - Delete challenges no longer needed

3. **Create Announcements**
   - Navigate to the Announcements section
   - Create announcements with title, message, and type (info/warning/success/error)
   - Set announcements as active or inactive
   - Delete old announcements

4. **Monitor Platform**
   - View statistics on the dashboard
   - Track player activity and submissions
   - Monitor challenge completion rates

## Database Schema

### Tables

- **challenges** - CTF challenges
- **players** - User accounts for participants
- **submissions** - Flag submission records
- **admin_users** - Admin accounts with elevated privileges
- **sessions** - User session data
- **announcements** - Platform announcements

## Security Considerations

- All passwords are hashed using bcrypt with 12 rounds
- CSRF tokens are required for state-changing requests
- Admin routes are protected with authentication middleware
- SQL injection prevention via parameterized queries (Drizzle ORM)
- XSS protection through content security policies
- Session cookies have secure, httpOnly, and sameSite flags

## Customization

### Branding
- Update colors in `client/src/index.css` (CSS variables)
- Modify logo and favicon in `client/public/`
- Adjust theme settings for light/dark modes

### Challenges
- Add sample challenges by modifying `server/storage.ts`
- Customize categories and difficulty levels in schemas

### UI Components
- All UI components are in `client/src/components/ui/`
- Built with Radix UI for accessibility

## Troubleshooting

### Database Connection Issues
```bash
# Check database URL is set correctly
echo $DATABASE_URL

# Verify PostgreSQL is running
pg_isready
```

### Port Already in Use
The application runs on port 5000 by default. If this port is in use, modify `server/index.ts`:
```typescript
const PORT = 5000; // Change to desired port
```

### Admin User Not Created
Run the admin creation script manually:
```bash
npx tsx server/scripts/quick-init-admin.ts
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Run production server
- `npm run check` - TypeScript type checking
- `npm run db:push` - Push database schema changes

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Acknowledgments

- Built with modern web technologies
- UI components from Radix UI
- Icons from Lucide React
- Inspired by popular CTF platforms

---

Built with care for the cybersecurity community
