# Hướng Dẫn Deploy CTF Platform Lên Vercel

## Tổng Quan

Ứng dụng CTF Platform của bạn đã được cấu hình để deploy lên Vercel với kiến trúc serverless. Hướng dẫn này sẽ giúp bạn triển khai ứng dụng full-stack (Frontend React + Backend Express + Database PostgreSQL) lên Vercel.

## Chuẩn Bị

### 1. Tài Khoản Cần Thiết
- Tài khoản GitHub (để lưu code)
- Tài khoản Vercel (miễn phí tại https://vercel.com)
- Tài khoản Neon hoặc sử dụng Vercel Postgres (miễn phí)

### 2. Kiến Trúc Ứng Dụng
Code đã được cấu trúc lại để phù hợp với Vercel:

```
project/
├── api/                    # Backend serverless functions
│   └── index.mjs          # Express app (serverless-ready, ES modules)
├── client/                # React frontend
│   └── src/
├── dist/public/           # Build output của frontend
├── vercel.json           # Cấu hình Vercel
└── .vercelignore         # File bỏ qua khi deploy
```

## Các Bước Deploy

### Bước 1: Đẩy Code Lên GitHub

1. Tạo repository mới trên GitHub
2. Kết nối và đẩy code:

```bash
git init
git add .
git commit -m "Initial commit for Vercel deployment"
git remote add origin https://github.com/USERNAME/REPO_NAME.git
git push -u origin main
```

### Bước 2: Thiết Lập Database

#### Lựa Chọn A: Sử Dụng Vercel Postgres (Khuyến Nghị)

1. Đăng nhập vào Vercel Dashboard
2. Vào tab **Storage**
3. Click **Create Database** → Chọn **Postgres**
4. Chọn region gần bạn nhất
5. Click **Create**
6. Vercel sẽ tự động tạo biến môi trường `DATABASE_URL`

#### Lựa Chọn B: Sử Dụng Neon (Hiện Tại)

Nếu bạn đã có database Neon, chỉ cần copy `DATABASE_URL` để sử dụng trong bước 4.

### Bước 3: Import Project Vào Vercel

1. Đăng nhập vào https://vercel.com
2. Click **Add New** → **Project**
3. Chọn repository GitHub của bạn
4. Vercel sẽ tự động phát hiện cấu hình

### Bước 4: Cấu Hình Environment Variables

Trong phần **Environment Variables**, thêm các biến sau:

#### Bắt Buộc:
```
DATABASE_URL=postgresql://user:password@host:5432/dbname
SESSION_SECRET=your-random-secret-key-here
NODE_ENV=production
```

#### Tùy Chọn:
```
FRONTEND_URL=https://your-app.vercel.app
```

**Lưu ý:** 
- `DATABASE_URL`: Copy từ Neon hoặc Vercel Postgres
- `SESSION_SECRET`: **BẮT BUỘC** - Tạo chuỗi ngẫu nhiên dài (ít nhất 32 ký tự). Ứng dụng sẽ không chạy nếu thiếu biến này.
- Có thể tạo secret key bằng lệnh: `openssl rand -base64 32`
- **QUAN TRỌNG**: Không bao giờ bỏ qua SESSION_SECRET - đây là yêu cầu bảo mật bắt buộc

### Bước 5: Cấu Hình Build Settings

Vercel sẽ tự động phát hiện nhờ `vercel.json`, nhưng kiểm tra lại:

- **Framework Preset**: Other
- **Build Command**: `npm run build` (hoặc để trống, Vercel sẽ dùng từ vercel.json)
- **Output Directory**: `dist/public`
- **Install Command**: `npm install`

### Bước 6: Deploy

1. Click **Deploy**
2. Đợi Vercel build và deploy (2-5 phút)
3. Sau khi hoàn tất, bạn sẽ nhận được URL: `https://your-app.vercel.app`

### Bước 7: Khởi Tạo Database

Sau khi deploy thành công, bạn cần tạo bảng và dữ liệu mẫu:

#### Lựa Chọn A: Từ Vercel CLI (Khuyến Nghị)

```bash
# Cài Vercel CLI
npm i -g vercel

# Đăng nhập
vercel login

# Link project
vercel link

# Chạy migration
vercel env pull .env.local
npm run db:push

# Tạo admin user
npx tsx server/scripts/quick-init-admin.ts
```

#### Lựa Chọn B: Từ Neon/Vercel Postgres Dashboard

1. Truy cập dashboard của database
2. Mở SQL Editor
3. Copy nội dung từ file `shared/schema.ts` và tạo bảng thủ công
4. Insert admin user:

```sql
INSERT INTO admins (id, username, password_hash, created_at)
VALUES (
  gen_random_uuid(),
  'admin',
  '$2b$10$encrypted_password_hash_here',
  NOW()
);
```

**Lưu ý:** Bạn cần hash password trước. Có thể dùng tool online hoặc:

```javascript
const bcrypt = require('bcrypt');
bcrypt.hash('Admin123!@#', 10).then(console.log);
```

### Bước 8: Kiểm Tra

1. Truy cập URL của bạn: `https://your-app.vercel.app`
2. Kiểm tra trang chủ load được
3. Đăng ký tài khoản mới
4. Thử submit flag cho challenges
5. Đăng nhập admin tại `/admin/login`

## Cấu Hình Nâng Cao

### Custom Domain

1. Vào **Settings** → **Domains**
2. Thêm domain của bạn
3. Cấu hình DNS theo hướng dẫn của Vercel

### Environment Variables Cho Nhiều Môi Trường

Vercel hỗ trợ 3 môi trường:
- **Production**: Deploy từ branch `main`
- **Preview**: Deploy từ pull requests
- **Development**: Dùng cho local development

Bạn có thể set biến riêng cho từng môi trường.

### Logs và Monitoring

- Xem logs tại: **Deployments** → Click deployment → **Function Logs**
- Vercel Analytics (miễn phí): **Analytics** tab
- Error tracking: **Deployments** → **Runtime Logs**

### Quản Lý Sessions Trên Serverless

**Lưu ý quan trọng:** Ứng dụng đã được cấu hình để lưu sessions trong PostgreSQL (sử dụng `connect-pg-simple`) thay vì bộ nhớ. Điều này đảm bảo:

- Sessions được bảo toàn qua các serverless function invocations
- Người dùng không bị logout sau mỗi request
- Hỗ trợ horizontal scaling tốt hơn

Vercel sẽ tự động tạo bảng `session` trong database khi cần thiết.

## Troubleshooting

### Lỗi "Too many connections"

**Nguyên nhân:** PostgreSQL giới hạn số kết nối, serverless functions tạo nhiều kết nối.

**Giải pháp:**
- Sử dụng Vercel Postgres hoặc Neon (có connection pooling sẵn)
- Hoặc sử dụng PgBouncer

### Lỗi "Module not found"

**Nguyên nhân:** Dependencies không được cài đầy đủ.

**Giải pháp:**
```bash
# Đảm bảo tất cả dependencies trong package.json
npm install
git add package-lock.json
git commit -m "Update dependencies"
git push
```

### API không hoạt động

**Kiểm tra:**
1. Environment variables đã set chưa
2. Xem Function Logs có lỗi gì không
3. Database URL có đúng không
4. Routes trong `vercel.json` có đúng không

### Frontend hiển thị nhưng API lỗi

**Nguyên nhân:** CORS hoặc API routes không đúng.

**Giải pháp:**
- Kiểm tra `api/index.mjs` có export default app
- Kiểm tra routes trong `vercel.json` đang trỏ đến `/api/index.mjs`
- Kiểm tra SESSION_SECRET đã được set chưa
- Xem Function Logs để biết chi tiết lỗi

## Cập Nhật Ứng Dụng

Mỗi khi bạn push code mới lên GitHub:

```bash
git add .
git commit -m "Update feature XYZ"
git push
```

Vercel sẽ tự động:
1. Phát hiện thay đổi
2. Build lại ứng dụng
3. Deploy phiên bản mới
4. Cung cấp preview URL cho từng deployment

## Chi Phí

### Vercel Free Tier Bao Gồm:
- 100GB bandwidth/tháng
- Unlimited deployments
- Automatic HTTPS
- Serverless Functions (100GB-hours)

### Vercel Postgres Free Tier:
- 256MB storage
- 60 giờ compute time/tháng
- Đủ cho dự án nhỏ và demo

### Neon Free Tier:
- 0.5GB storage
- 1 project
- Unlimited compute time
- Connection pooling

## Liên Hệ & Hỗ Trợ

- Vercel Docs: https://vercel.com/docs
- Vercel Support: https://vercel.com/support
- Neon Docs: https://neon.tech/docs

## Ghi Chú Bảo Mật

⚠️ **QUAN TRỌNG:**

1. **Đổi mật khẩu admin mặc định** ngay sau khi deploy
2. **SESSION_SECRET phải là chuỗi ngẫu nhiên mạnh**
3. **Không commit .env files** lên GitHub
4. **Kích hoạt 2FA** cho tài khoản Vercel và GitHub
5. **Xem logs thường xuyên** để phát hiện truy cập bất thường

## Kết Luận

Sau khi hoàn thành các bước trên, ứng dụng CTF Platform của bạn sẽ chạy trên Vercel với:
- ✅ Frontend React được serve static
- ✅ Backend Express chạy serverless
- ✅ Database PostgreSQL (Vercel Postgres hoặc Neon)
- ✅ HTTPS tự động
- ✅ Auto-deployment từ GitHub
- ✅ Monitoring và logs

Chúc bạn deploy thành công! 🚀
