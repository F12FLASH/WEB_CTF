import express from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { neon } from '@neondatabase/serverless';
import session from 'express-session';
import connectPg from 'connect-pg-simple';
import bcrypt from 'bcrypt';
import rateLimit from 'express-rate-limit';
import pg from 'pg';

const { Pool } = pg;
const PgSession = connectPg(session);

if (!process.env.SESSION_SECRET) {
  throw new Error('SESSION_SECRET environment variable is required');
}

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

const app = express();
app.set('trust proxy', 1);

const isDevelopment = process.env.NODE_ENV === 'development';
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: isDevelopment 
        ? ["'self'", "'unsafe-inline'", "'unsafe-eval'"]
        : ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      frameAncestors: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  frameguard: {
    action: "deny",
  },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: {
    policy: "strict-origin-when-cross-origin",
  },
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

const sql = neon(process.env.DATABASE_URL);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

const sessionMiddleware = session({
  store: new PgSession({
    pool: pool,
    tableName: 'session',
    createTableIfMissing: true
  }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: 'strict'
  }
});

app.use(sessionMiddleware);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Too many authentication attempts, please try again later",
  standardHeaders: true,
  legacyHeaders: false,
});

const submissionLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: "Too many submission attempts, please slow down",
  standardHeaders: true,
  legacyHeaders: false,
});

const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  message: "Too many admin login attempts, please try again later",
  standardHeaders: true,
  legacyHeaders: false,
});

const requireUser = (req, res, next) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ message: "Unauthorized - Please login to continue" });
  }
  next();
};

const requireAdmin = (req, res, next) => {
  if (!req.session || !req.session.adminId) {
    return res.status(401).json({ message: "Unauthorized - Admin access required" });
  }
  next();
};

app.post('/api/auth/register', authLimiter, async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    if (!username || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await sql`SELECT * FROM players WHERE username = ${username} OR email = ${email} LIMIT 1`;
    if (existingUser.length > 0) {
      return res.status(400).json({ message: "Username or email already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await sql`
      INSERT INTO players (id, username, email, password_hash, score, created_at)
      VALUES (gen_random_uuid(), ${username}, ${email}, ${passwordHash}, 0, NOW())
      RETURNING id, username, email, score
    `;

    const user = result[0];
    req.session.userId = user.id;
    req.session.username = user.username;

    res.status(201).json({
      message: "Registration successful",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        score: user.score,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Failed to register" });
  }
});

app.post('/api/auth/login', authLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required" });
    }

    const users = await sql`SELECT * FROM players WHERE username = ${username} LIMIT 1`;
    if (users.length === 0) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    const user = users[0];
    const isValid = await bcrypt.compare(password, user.password_hash);
    
    if (!isValid) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    req.session.adminId = undefined;
    req.session.adminUsername = undefined;
    req.session.userId = user.id;
    req.session.username = user.username;

    res.json({
      message: "Login successful",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        score: user.score,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Failed to login" });
  }
});

app.get('/api/auth/user', requireUser, async (req, res) => {
  try {
    const users = await sql`SELECT id, username, email, score FROM players WHERE id = ${req.session.userId} LIMIT 1`;
    if (users.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(users[0]);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Failed to fetch user" });
  }
});

app.post('/api/admin/login', adminLoginLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required" });
    }

    const admins = await sql`SELECT * FROM admins WHERE username = ${username} LIMIT 1`;
    if (admins.length === 0) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    const admin = admins[0];
    const isValid = await bcrypt.compare(password, admin.password_hash);
    
    if (!isValid) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    req.session.userId = undefined;
    req.session.username = undefined;
    req.session.adminId = admin.id;
    req.session.adminUsername = admin.username;

    res.json({ 
      message: "Login successful",
      admin: {
        id: admin.id,
        username: admin.username,
      }
    });
  } catch (error) {
    console.error("Admin login error:", error);
    res.status(500).json({ message: "Failed to login" });
  }
});

app.post('/api/admin/logout', async (req, res) => {
  req.session.adminId = undefined;
  req.session.adminUsername = undefined;
  req.session.save((err) => {
    if (err) {
      return res.status(500).json({ message: "Failed to logout" });
    }
    res.json({ message: "Logout successful" });
  });
});

app.get('/api/admin/session', async (req, res) => {
  if (req.session && req.session.adminId) {
    res.json({
      authenticated: true,
      admin: {
        id: req.session.adminId,
        username: req.session.adminUsername,
      }
    });
  } else {
    res.json({ authenticated: false });
  }
});

app.get('/api/challenges', async (req, res) => {
  try {
    const challenges = await sql`SELECT id, title, description, points, category, difficulty, created_at FROM challenges ORDER BY created_at DESC`;
    res.json(challenges);
  } catch (error) {
    console.error("Error fetching challenges:", error);
    res.status(500).json({ message: "Failed to fetch challenges" });
  }
});

app.get('/api/challenges/:id', async (req, res) => {
  try {
    const challenges = await sql`SELECT id, title, description, points, category, difficulty, created_at FROM challenges WHERE id = ${req.params.id} LIMIT 1`;
    if (challenges.length === 0) {
      return res.status(404).json({ message: "Challenge not found" });
    }
    res.json(challenges[0]);
  } catch (error) {
    console.error("Error fetching challenge:", error);
    res.status(500).json({ message: "Failed to fetch challenge" });
  }
});

app.post('/api/challenges/:id/submit', requireUser, submissionLimiter, async (req, res) => {
  try {
    const challengeId = req.params.id;
    const { flag } = req.body;
    const userId = req.session.userId;

    if (!flag) {
      return res.status(400).json({ message: "Flag is required" });
    }

    const challenges = await sql`SELECT * FROM challenges WHERE id = ${challengeId} LIMIT 1`;
    if (challenges.length === 0) {
      return res.status(404).json({ message: "Challenge not found" });
    }

    const challenge = challenges[0];
    const users = await sql`SELECT * FROM players WHERE id = ${userId} LIMIT 1`;
    if (users.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const submissions = await sql`SELECT * FROM submissions WHERE player_id = ${userId} AND challenge_id = ${challengeId} AND is_correct = 1`;
    if (submissions.length > 0) {
      return res.json({
        correct: true,
        message: "You have already solved this challenge!",
        alreadySolved: true,
      });
    }

    const isCorrect = flag.trim() === challenge.flag.trim();

    await sql`
      INSERT INTO submissions (id, player_id, challenge_id, submitted_flag, is_correct, submitted_at)
      VALUES (gen_random_uuid(), ${userId}, ${challengeId}, ${flag}, ${isCorrect ? 1 : 0}, NOW())
    `;

    if (isCorrect) {
      await sql`UPDATE players SET score = score + ${challenge.points} WHERE id = ${userId}`;
      res.json({
        correct: true,
        message: `Correct! You earned ${challenge.points} points!`,
        points: challenge.points,
      });
    } else {
      res.json({
        correct: false,
        message: "Incorrect flag. Try again!",
      });
    }
  } catch (error) {
    console.error("Error submitting flag:", error);
    res.status(500).json({ message: "Failed to submit flag" });
  }
});

app.get('/api/solved', requireUser, async (req, res) => {
  try {
    const userId = req.session.userId;
    const submissions = await sql`SELECT DISTINCT challenge_id FROM submissions WHERE player_id = ${userId} AND is_correct = 1`;
    res.json(submissions.map(s => s.challenge_id));
  } catch (error) {
    console.error("Error fetching solved challenges:", error);
    res.status(500).json({ message: "Failed to fetch solved challenges" });
  }
});

app.get('/api/leaderboard', async (req, res) => {
  try {
    const players = await sql`
      SELECT 
        p.id as player_id,
        p.username,
        p.score,
        COUNT(DISTINCT CASE WHEN s.is_correct = 1 THEN s.challenge_id END) as solved_count
      FROM players p
      LEFT JOIN submissions s ON p.id = s.player_id
      GROUP BY p.id, p.username, p.score
      ORDER BY p.score DESC
    `;
    
    const leaderboard = players.map((player, index) => ({
      ...player,
      rank: index + 1,
      solvedCount: parseInt(player.solved_count) || 0
    }));
    
    res.json(leaderboard);
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    res.status(500).json({ message: "Failed to fetch leaderboard" });
  }
});

app.post('/api/logout', async (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: "Failed to logout" });
    }
    res.json({ message: "Logout successful" });
  });
});

app.get('/api/announcements', async (req, res) => {
  try {
    const announcements = await sql`
      SELECT id, title, content, priority, created_at 
      FROM announcements 
      WHERE is_active = true 
      ORDER BY priority DESC, created_at DESC
    `;
    res.json(announcements);
  } catch (error) {
    console.error("Error fetching announcements:", error);
    res.status(500).json({ message: "Failed to fetch announcements" });
  }
});

app.get('/api/admin/challenges', requireAdmin, async (req, res) => {
  try {
    const challenges = await sql`SELECT * FROM challenges ORDER BY created_at DESC`;
    res.json(challenges);
  } catch (error) {
    console.error("Error fetching challenges:", error);
    res.status(500).json({ message: "Failed to fetch challenges" });
  }
});

app.post('/api/admin/challenges', requireAdmin, async (req, res) => {
  try {
    const { title, description, flag, points, category, difficulty } = req.body;
    
    if (!title || !description || !flag || !points || !category || !difficulty) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const result = await sql`
      INSERT INTO challenges (id, title, description, flag, points, category, difficulty, created_at)
      VALUES (gen_random_uuid(), ${title}, ${description}, ${flag}, ${points}, ${category}, ${difficulty}, NOW())
      RETURNING *
    `;

    res.status(201).json(result[0]);
  } catch (error) {
    console.error("Error creating challenge:", error);
    res.status(500).json({ message: "Failed to create challenge" });
  }
});

app.put('/api/admin/challenges/:id', requireAdmin, async (req, res) => {
  try {
    const { title, description, flag, points, category, difficulty } = req.body;
    
    const result = await sql`
      UPDATE challenges 
      SET title = ${title}, description = ${description}, flag = ${flag}, 
          points = ${points}, category = ${category}, difficulty = ${difficulty}
      WHERE id = ${req.params.id}
      RETURNING *
    `;

    if (result.length === 0) {
      return res.status(404).json({ message: "Challenge not found" });
    }

    res.json(result[0]);
  } catch (error) {
    console.error("Error updating challenge:", error);
    res.status(500).json({ message: "Failed to update challenge" });
  }
});

app.delete('/api/admin/challenges/:id', requireAdmin, async (req, res) => {
  try {
    await sql`DELETE FROM submissions WHERE challenge_id = ${req.params.id}`;
    await sql`DELETE FROM challenges WHERE id = ${req.params.id}`;
    res.json({ message: "Challenge deleted successfully" });
  } catch (error) {
    console.error("Error deleting challenge:", error);
    res.status(500).json({ message: "Failed to delete challenge" });
  }
});

app.get('/api/admin/stats', requireAdmin, async (req, res) => {
  try {
    const totalChallenges = await sql`SELECT COUNT(*) as count FROM challenges`;
    const totalUsers = await sql`SELECT COUNT(*) as count FROM players`;
    const totalSubmissions = await sql`SELECT COUNT(*) as count FROM submissions`;
    const solvedChallenges = await sql`SELECT COUNT(DISTINCT challenge_id) as count FROM submissions WHERE is_correct = 1`;
    
    res.json({
      totalChallenges: parseInt(totalChallenges[0].count),
      totalUsers: parseInt(totalUsers[0].count),
      totalSubmissions: parseInt(totalSubmissions[0].count),
      solvedChallenges: parseInt(solvedChallenges[0].count),
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({ message: "Failed to fetch stats" });
  }
});

app.get('/api/admin/announcements', requireAdmin, async (req, res) => {
  try {
    const announcements = await sql`SELECT * FROM announcements ORDER BY created_at DESC`;
    res.json(announcements);
  } catch (error) {
    console.error("Error fetching announcements:", error);
    res.status(500).json({ message: "Failed to fetch announcements" });
  }
});

app.post('/api/admin/announcements', requireAdmin, async (req, res) => {
  try {
    const { title, content, priority } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({ message: "Title and content are required" });
    }

    const result = await sql`
      INSERT INTO announcements (id, title, content, priority, is_active, created_at)
      VALUES (gen_random_uuid(), ${title}, ${content}, ${priority || 'normal'}, true, NOW())
      RETURNING *
    `;

    res.status(201).json(result[0]);
  } catch (error) {
    console.error("Error creating announcement:", error);
    res.status(500).json({ message: "Failed to create announcement" });
  }
});

app.put('/api/admin/announcements/:id', requireAdmin, async (req, res) => {
  try {
    const { title, content, priority, is_active } = req.body;
    
    const result = await sql`
      UPDATE announcements 
      SET title = ${title}, content = ${content}, priority = ${priority}, is_active = ${is_active}
      WHERE id = ${req.params.id}
      RETURNING *
    `;

    if (result.length === 0) {
      return res.status(404).json({ message: "Announcement not found" });
    }

    res.json(result[0]);
  } catch (error) {
    console.error("Error updating announcement:", error);
    res.status(500).json({ message: "Failed to update announcement" });
  }
});

app.delete('/api/admin/announcements/:id', requireAdmin, async (req, res) => {
  try {
    await sql`DELETE FROM announcements WHERE id = ${req.params.id}`;
    res.json({ message: "Announcement deleted successfully" });
  } catch (error) {
    console.error("Error deleting announcement:", error);
    res.status(500).json({ message: "Failed to delete announcement" });
  }
});

app.use((err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ message });
});

export default app;
