# Hướng Dẫn Deploy CTF Platform

Tài liệu này hướng dẫn chi tiết cách deploy CTF Platform lên các nền tảng khác nhau.

## Mục Lục
- [Yêu Cầu Hệ Thống](#yêu-cầu-hệ-thống)
- [Cài Đặt Database](#cài-đặt-database)
- [Environment Variables](#environment-variables)
- [Deploy trên Replit](#deploy-trên-replit)
- [Deploy trên VPS/Server](#deploy-trên-vpsserver)
- [Deploy trên Railway](#deploy-trên-railway)
- [Deploy trên Render](#deploy-trên-render)
- [Lưu Ý về Vercel](#lưu-ý-về-vercel)
- [Bảo Mật](#bảo-mật)
- [Troubleshooting](#troubleshooting)

---

## Yêu Cầu Hệ Thống

### Phần Mềm Cần Thiết
- **Node.js**: >= 20.x
- **PostgreSQL**: >= 14.x
- **npm**: >= 9.x

### Thông Số Khuyến Nghị
- **RAM**: Tối thiểu 512MB, khuyến nghị 1GB+
- **Storage**: Tối thiểu 1GB
- **CPU**: 1 vCPU trở lên

---

## Cài Đặt Database

### Option 1: Neon PostgreSQL (Khuyến Nghị - Miễn Phí)

1. Truy cập [Neon.tech](https://neon.tech)
2. Đăng ký tài khoản miễn phí
3. Tạo project mới:
   - Chọn region gần người dùng nhất
   - PostgreSQL version: 16
4. Copy **Connection String**:
   ```
   postgresql://username:password@ep-xxx.region.aws.neon.tech/database?sslmode=require
   ```

**Ưu điểm:**
- ✅ Miễn phí tier generous (500MB storage)
- ✅ Serverless, tự động scale
- ✅ Branching database cho development
- ✅ Point-in-time recovery
- ✅ Không cần quản lý server

### Option 2: Railway PostgreSQL

1. Truy cập [Railway.app](https://railway.app)
2. Tạo project mới
3. Add PostgreSQL service
4. Copy `DATABASE_URL` từ Variables tab

**Ưu điểm:**
- ✅ Deploy cả app và database cùng lúc
- ✅ Free tier: $5 credit/month
- ✅ Automatic backups
- ✅ Easy monitoring

### Option 3: Render PostgreSQL

1. Truy cập [Render.com](https://render.com)
2. Tạo PostgreSQL database
3. Copy **Internal Database URL**

**Ưu điểm:**
- ✅ Free tier available
- ✅ Automatic backups
- ✅ Good performance

### Option 4: Self-Hosted PostgreSQL

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# Tạo database và user
sudo -u postgres psql
CREATE DATABASE ctf_platform;
CREATE USER ctf_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE ctf_platform TO ctf_user;
\q

# Connection string
DATABASE_URL="postgresql://ctf_user:your_secure_password@localhost:5432/ctf_platform"
```

---

## Environment Variables

Tạo file `.env` với các biến sau:

```env
# === DATABASE ===
DATABASE_URL="postgresql://user:pass@host:5432/dbname?sslmode=require"

# === SESSION SECRET ===
# Tạo random secret key mạnh
# Generate bằng: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
SESSION_SECRET="your-super-secret-session-key-minimum-32-characters-long"

# === ENVIRONMENT ===
NODE_ENV="production"

# === PORT (Optional) ===
# Chỉ cần nếu không dùng port 5000
PORT=5000
```

### Tạo SESSION_SECRET An Toàn

```bash
# Method 1: Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Method 2: OpenSSL
openssl rand -hex 64

# Method 3: Online generator
# Truy cập: https://randomkeygen.com/
```

**⚠️ QUAN TRỌNG:**
- SESSION_SECRET phải dài tối thiểu 32 ký tự
- Không được share hoặc commit vào git
- Mỗi environment (dev/prod) nên dùng secret khác nhau

---

## Deploy trên Replit

### Bước 1: Import Project

1. Fork hoặc import project vào Replit
2. Replit sẽ tự động detect và install dependencies

### Bước 2: Setup Database

1. Click **Database** tab bên trái
2. Replit tự động tạo PostgreSQL database
3. DATABASE_URL sẽ được tự động inject

Hoặc dùng external database (Neon, Railway):
1. Click **Secrets** (khóa 🔒 icon)
2. Add `DATABASE_URL` với connection string của bạn

### Bước 3: Setup Secrets

Click **Secrets** và thêm:

```
SESSION_SECRET = "your-generated-secret-key-here"
```

### Bước 4: Run Migration

```bash
npm run db:push
```

### Bước 5: Deploy

1. Click **Run** button hoặc type `npm run dev`
2. Server sẽ start trên port 5000
3. Truy cập install page để setup admin account: `/install`

### Bước 6: Production Setup

1. Click **Deployments** tab
2. Click **Deploy** để tạo production deployment
3. Copy production URL
4. Configure custom domain (nếu cần)

**Lưu Ý Replit:**
- ✅ Database tự động backup
- ✅ Auto-sleep khi inactive (Always On cần Cycles)
- ✅ HTTPS tự động
- ✅ Không cần config nginx/reverse proxy

---

## Deploy trên VPS/Server

### Bước 1: Setup Server

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL (nếu chưa có)
sudo apt install -y postgresql postgresql-contrib

# Install PM2 (process manager)
sudo npm install -g pm2

# Install nginx (reverse proxy)
sudo apt install -y nginx certbot python3-certbot-nginx
```

### Bước 2: Clone Project

```bash
# Clone repository
git clone https://github.com/your-username/ctf-platform.git
cd ctf-platform

# Install dependencies
npm install

# Build project
npm run build
```

### Bước 3: Setup Environment

```bash
# Tạo .env file
nano .env

# Paste environment variables (xem phần Environment Variables)
# Save: Ctrl+X, Y, Enter
```

### Bước 4: Database Migration

```bash
# Push database schema
npm run db:push
```

### Bước 5: Start với PM2

```bash
# Start application
pm2 start dist/index.js --name "ctf-platform"

# Save PM2 configuration
pm2 save

# Setup auto-start on reboot
pm2 startup
# Copy và chạy command được suggest
```

### Bước 6: Setup Nginx Reverse Proxy

```bash
# Tạo nginx config
sudo nano /etc/nginx/sites-available/ctf-platform

# Paste config sau:
```

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/ctf-platform /etc/nginx/sites-enabled/

# Test nginx config
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

### Bước 7: Setup HTTPS với Let's Encrypt

```bash
# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Certificate sẽ tự động renew
# Test renewal:
sudo certbot renew --dry-run
```

### Bước 8: Firewall Setup

```bash
# Enable UFW firewall
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
sudo ufw enable
```

### Bước 9: Initial Setup

1. Truy cập `https://your-domain.com/install`
2. Setup admin account
3. Configure settings
4. Create categories và difficulties
5. Add challenges

---

## Deploy trên Railway

### Bước 1: Tạo Project

1. Truy cập [Railway.app](https://railway.app)
2. Sign in with GitHub
3. Click **New Project**
4. Select **Deploy from GitHub repo**

### Bước 2: Add Database

1. Click **+ New**
2. Select **Database > PostgreSQL**
3. Database URL sẽ tự động inject vào `DATABASE_URL`

### Bước 3: Configure Environment

1. Click vào service (app) của bạn
2. Go to **Variables** tab
3. Add:
   ```
   SESSION_SECRET = "your-generated-secret"
   NODE_ENV = "production"
   ```

### Bước 4: Configure Build

Railway thường tự động detect, nhưng bạn có thể custom:

1. **Variables** tab:
   ```
   BUILD_COMMAND = "npm run build"
   START_COMMAND = "npm start"
   ```

### Bước 5: Deploy

1. Railway tự động deploy khi push code
2. Xem logs để track deployment
3. Click **Generate Domain** để có public URL

### Bước 6: Run Migration

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link to project
railway link

# Run migration
railway run npm run db:push
```

**Railway Pricing:**
- Free: $5 credit/month (đủ cho small apps)
- Pro: $20/month unlimited

---

## Deploy trên Render

### Bước 1: Create Web Service

1. Truy cập [Render.com](https://render.com)
2. Click **New +** → **Web Service**
3. Connect GitHub repository

### Bước 2: Configure Service

```yaml
Name: ctf-platform
Environment: Node
Build Command: npm run build
Start Command: npm start
```

### Bước 3: Add Database

1. Click **New +** → **PostgreSQL**
2. Create database
3. Copy **Internal Database URL**

### Bước 4: Environment Variables

Go to **Environment** tab và add:

```
DATABASE_URL = <paste-database-url>
SESSION_SECRET = <your-secret>
NODE_ENV = production
```

### Bước 5: Deploy

1. Click **Manual Deploy** hoặc
2. Auto-deploy on git push (recommended)

### Bước 6: Custom Domain

1. Go to **Settings**
2. Add custom domain
3. Update DNS records as instructed

**Render Pricing:**
- Free tier available (with limitations)
- Starter: $7/month
- Pro: $25/month

---

## Lưu Ý về Vercel

**⚠️ KHÔNG KHUYẾN NGHỊ DEPLOY FULL APP LÊN VERCEL**

### Tại Sao?

Vercel được thiết kế cho **serverless functions** với các giới hạn:

1. **Timeout**: 60 giây maximum (Hobby), 300s (Pro)
2. **No Long-Running Processes**: Không support WebSockets, background jobs
3. **Cold Starts**: Mỗi request có thể tạo cold start
4. **Database Connections**: Connection pooling phức tạp với serverless
5. **Session Management**: Cần external session store (Redis, database)

### CTF Platform Có:
- ❌ Express app dạng traditional (not serverless-first)
- ❌ PostgreSQL session store (cần connection pool)
- ❌ Rate limiting middleware (cần shared state)
- ❌ Database import/export (long-running operations)
- ❌ Complex routing structure

### Nếu Vẫn Muốn Deploy Lên Vercel

**Cần refactor đáng kể:**

1. **Tách Frontend và Backend**:
   - Frontend: Deploy trên Vercel
   - Backend: Deploy trên Railway/Render/VPS

2. **Hoặc Refactor Toàn Bộ:**
   - Convert sang Next.js App Router
   - Use Vercel KV cho sessions
   - Use Vercel Edge Functions
   - Redesign database operations
   - Reimplement rate limiting

**Thời gian ước tính:** 40-80 giờ refactoring

### Alternative Approach

**Frontend trên Vercel + Backend trên Railway:**

```bash
# Tách project thành 2 repos:
frontend/  # Next.js hoặc Static SPA
backend/   # Express API server

# Deploy:
frontend → Vercel
backend → Railway/Render
```

**Pros:**
- ✅ Vercel CDN cho frontend (fast)
- ✅ Backend chạy traditional server (no limitations)
- ✅ Easy CORS setup

**Cons:**
- ❌ Maintain 2 deployments
- ❌ More complex setup
- ❌ Cross-origin session management

---

## Bảo Mật

### 1. Environment Variables

```bash
# KHÔNG BAO GIỜ:
✗ Commit .env vào git
✗ Share SESSION_SECRET
✗ Hardcode passwords

# LUÔN LUÔN:
✓ Dùng strong random secrets
✓ Different secrets per environment
✓ Use .env.example template
```

### 2. Database Security

```env
# Luôn dùng SSL cho database connection
DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require"
```

```sql
-- Tạo database user với limited permissions
CREATE USER ctf_app WITH PASSWORD 'strong_password';
GRANT CONNECT ON DATABASE ctf_platform TO ctf_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ctf_app;
```

### 3. HTTPS

**⚠️ BẮT BUỘC** cho production:
- Dùng Let's Encrypt (free)
- Hoặc Cloudflare (free tier)
- Hoặc platform tự động (Replit, Railway, Render)

### 4. Rate Limiting

Application đã có rate limiting built-in:
- Auth endpoints: 5 attempts / 15 min
- Admin login: 3 attempts / 15 min
- Submissions: 10 per minute
- Export: 5 per hour

### 5. Security Headers

Application dùng Helmet.js với:
- CSP (Content Security Policy)
- HSTS (HTTP Strict Transport Security)
- X-Frame-Options
- X-Content-Type-Options

### 6. Session Security

- ✅ HTTP-Only cookies
- ✅ Secure flag in production
- ✅ SameSite: strict
- ✅ 7-day session expiry
- ✅ PostgreSQL session store (persistent)

### 7. Password Hashing

- ✅ Bcrypt với 10 rounds
- ✅ Password requirements enforced:
  - Minimum 8 characters
  - At least 1 uppercase
  - At least 1 lowercase
  - At least 1 number

### 8. Input Validation

- ✅ Zod schema validation
- ✅ DOMPurify sanitization
- ✅ SQL injection prevention (Drizzle ORM)

---

## Troubleshooting

### Database Connection Issues

**Error:** `Connection refused` hoặc `timeout`

```bash
# 1. Check database is running
pg_isready -h hostname -U username

# 2. Verify connection string
echo $DATABASE_URL

# 3. Test connection
psql $DATABASE_URL

# 4. Check firewall
sudo ufw status
```

**Error:** `SSL required`

```env
# Add sslmode to connection string
DATABASE_URL="postgresql://...?sslmode=require"
```

### Port Already in Use

```bash
# Find process using port 5000
lsof -i :5000

# Kill process
kill -9 <PID>

# Or use different port
PORT=3000 npm start
```

### Session Issues

**Users logged out randomly:**

```bash
# 1. Verify SESSION_SECRET is set
echo $SESSION_SECRET

# 2. Check session table exists
psql $DATABASE_URL -c "\dt"
# Should see 'session' table

# 3. Check session store connection
# Look for errors in logs
```

### Memory Issues

```bash
# Increase Node.js memory limit
NODE_OPTIONS="--max-old-space-size=2048" npm start

# Or in PM2
pm2 start dist/index.js --name ctf --node-args="--max-old-space-size=2048"
```

### Build Failures

```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Run build with verbose logging
npm run build --verbose
```

### Database Migration Errors

```bash
# Reset migrations (⚠️ CAUTION: drops all data)
npm run db:push

# Or manually
psql $DATABASE_URL
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
\q

# Then push again
npm run db:push
```

---

## Monitoring & Logs

### PM2 Logs (VPS)

```bash
# View logs
pm2 logs ctf-platform

# Monitor
pm2 monit

# Restart
pm2 restart ctf-platform

# Reload (zero-downtime)
pm2 reload ctf-platform
```

### Railway Logs

```bash
# Install CLI
npm install -g @railway/cli

# View logs
railway logs

# Follow logs
railway logs -f
```

### Render Logs

- Go to service dashboard
- Click **Logs** tab
- Real-time streaming

---

## Backup & Restore

### Database Backup

```bash
# Backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Compressed backup
pg_dump $DATABASE_URL | gzip > backup_$(date +%Y%m%d).sql.gz
```

### Restore from Backup

```bash
# Restore
psql $DATABASE_URL < backup.sql

# From compressed
gunzip -c backup.sql.gz | psql $DATABASE_URL
```

### Automated Backups

```bash
# Crontab entry (daily backup)
0 2 * * * pg_dump $DATABASE_URL | gzip > /backups/ctf_$(date +\%Y\%m\%d).sql.gz
```

### Using Built-in Export Feature

1. Login as admin
2. Go to **System Management**
3. Click **Export JSON** or **Export SQL**
4. Save file securely

**Import:**
1. Go to **System Management**
2. Click **Import Backup**
3. Select file
4. Review conflicts
5. Resolve và import

---

## Performance Optimization

### 1. Database Indexing

```sql
-- Add indexes for commonly queried fields
CREATE INDEX idx_challenges_category ON challenges(category_id);
CREATE INDEX idx_challenges_difficulty ON challenges(difficulty_id);
CREATE INDEX idx_submissions_player ON submissions(player_id);
CREATE INDEX idx_submissions_challenge ON submissions(challenge_id);
CREATE INDEX idx_submissions_correct ON submissions(is_correct);
```

### 2. Connection Pooling

Already configured in `server/db.ts`:
```typescript
max: 20, // Maximum connections
idleTimeoutMillis: 30000,
connectionTimeoutMillis: 2000,
```

### 3. Caching (Future Enhancement)

Consider adding Redis for:
- Session store (faster than PostgreSQL)
- Leaderboard caching
- Challenge list caching

### 4. CDN (Optional)

For static assets:
- Cloudflare (free)
- BunnyCDN
- AWS CloudFront

---

## Scaling

### Vertical Scaling (Single Server)

- Increase RAM: 2GB → 4GB → 8GB
- Upgrade CPU: 1 vCPU → 2 vCPU → 4 vCPU
- SSD storage for faster I/O

### Horizontal Scaling (Multiple Servers)

**Requirements:**
1. **Load Balancer**: Nginx, HAProxy, AWS ALB
2. **Shared Session Store**: PostgreSQL (current) or Redis
3. **Database**: Managed PostgreSQL (Neon, AWS RDS)

**Setup:**

```nginx
# Nginx load balancer
upstream ctf_backend {
    server 10.0.1.10:5000;
    server 10.0.1.11:5000;
    server 10.0.1.12:5000;
}

server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://ctf_backend;
    }
}
```

---

## Support & Resources

### Documentation
- [Drizzle ORM](https://orm.drizzle.team/)
- [Express.js](https://expressjs.com/)
- [React Query](https://tanstack.com/query/latest)
- [PostgreSQL](https://www.postgresql.org/docs/)

### Database Providers
- [Neon](https://neon.tech/docs)
- [Railway](https://docs.railway.app/)
- [Render](https://render.com/docs)

### Deployment Platforms
- [Replit](https://docs.replit.com/)
- [Railway](https://docs.railway.app/)
- [Render](https://render.com/docs)

---

## License

MIT License - See LICENSE file for details

---

**Chúc bạn deploy thành công! 🚀**

Nếu gặp vấn đề, hãy check phần Troubleshooting hoặc tạo issue trên GitHub repository.
