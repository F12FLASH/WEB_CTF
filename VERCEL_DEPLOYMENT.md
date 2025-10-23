# Hướng Dẫn Deploy CTF Platform lên Vercel

## Bước 1: Chuẩn Bị Database Neon

### 1. Tạo Database Neon

1. Truy cập https://neon.tech và tạo database mới
2. Copy connection string của bạn
3. Connection string sẽ có dạng:
```
postgresql://[user]:[password]@[host]/[database]?sslmode=require
```

### 2. Chạy Migration Database

Trước khi deploy, cần push database schema lên Neon:

1. Tạo file `.env` trong project với nội dung:
```env
DATABASE_URL=your_neon_connection_string_here
SESSION_SECRET=your-generated-secret-key-here
NODE_ENV=development
```

**⚠️ QUAN TRỌNG**: 
- Thay `your_neon_connection_string_here` bằng connection string thật từ Neon
- Thay `your-generated-secret-key-here` bằng secret key ngẫu nhiên
- **KHÔNG BAO GIỜ** commit file `.env` lên Git!

2. Push schema lên database:
```bash
npm run db:push
```

## Bước 2: Chuẩn Bị Project

### 1. Tạo Repository trên GitHub

1. Đi đến https://github.com/new
2. Tạo repository mới (ví dụ: `ctf-platform`)
3. **KHÔNG** chọn "Initialize with README"

### 2. Push Code lên GitHub

```bash
# Khởi tạo git repository (nếu chưa có)
git init

# Add tất cả files
git add .

# Commit
git commit -m "Initial commit: CTF Platform ready for deployment"

# Add remote repository
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# Push lên GitHub
git branch -M main
git push -u origin main
```

## Bước 3: Deploy lên Vercel

### 1. Import Project vào Vercel

1. Đi đến https://vercel.com
2. Click "Add New" → "Project"
3. Import repository GitHub của bạn

### 2. Cấu Hình Environment Variables

Trong trang cấu hình Vercel, thêm các Environment Variables sau:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Connection string từ Neon database của bạn |
| `SESSION_SECRET` | String ngẫu nhiên 32+ ký tự (dùng `openssl rand -base64 32`) |
| `NODE_ENV` | `production` |

**Lấy DATABASE_URL từ Neon:**
1. Đăng nhập vào Neon dashboard
2. Chọn database project của bạn
3. Vào "Connection Details"
4. Copy "Connection string" (pooled connection recommended)
5. Paste vào Vercel Environment Variables

### 3. Cấu Hình Build Settings

Vercel sẽ tự động detect, nhưng đảm bảo:

- **Framework Preset**: Other
- **Build Command**: `npm run build` (mặc định)
- **Output Directory**: `dist/public` (mặc định)
- **Install Command**: `npm install` (mặc định)

### 4. Deploy

Click "Deploy" và đợi Vercel build project.

## Bước 4: Sau Khi Deploy

### 1. Truy cập Application

Sau khi deploy thành công, bạn sẽ có URL dạng: `https://your-app.vercel.app`

### 2. Chạy Installation Wizard

1. Truy cập `https://your-app.vercel.app/install`
2. Thiết lập tên website và thông tin cơ bản
3. Tạo tài khoản admin đầu tiên
4. Hoàn tất cài đặt

### 3. Đăng Nhập Admin

1. Truy cập `https://your-app.vercel.app/admin/login`
2. Sử dụng credentials vừa tạo
3. Bắt đầu quản lý challenges

## Troubleshooting

### Lỗi Database Connection

Nếu gặp lỗi kết nối database:

1. Kiểm tra `DATABASE_URL` trong Vercel Environment Variables
2. Đảm bảo Neon database đang hoạt động
3. Kiểm tra firewall/IP whitelist trên Neon (Neon thường allow tất cả IPs)

### Lỗi Session

Nếu session không work:

1. Đảm bảo `SESSION_SECRET` đã được set
2. Xóa cookies trong browser và thử lại

### Lỗi Build

Nếu build fail:

1. Check build logs trong Vercel dashboard
2. Đảm bảo tất cả dependencies đã được install
3. Test local bằng `npm run build`

## Cập Nhật Project

Để cập nhật project sau này:

```bash
# Thực hiện thay đổi trong code

# Commit changes
git add .
git commit -m "Your commit message"

# Push lên GitHub
git push origin main
```

Vercel sẽ tự động detect changes và re-deploy.

## Bảo Mật

### Quan Trọng

1. **Không commit** `.env` file lên GitHub
2. **Session Secret**: Sử dụng string ngẫu nhiên, dài và phức tạp
3. **Database**: Backup thường xuyên qua Admin Panel → System → Export
4. **Admin Password**: Sử dụng mật khẩu mạnh

### Backup Database

Trước khi update hoặc thay đổi lớn:

1. Đăng nhập Admin Panel
2. Vào System → Export Database
3. Download backup file (JSON hoặc SQL)

## Custom Domain (Tùy Chọn)

Để sử dụng domain riêng:

1. Vào Vercel Dashboard → Settings → Domains
2. Add domain của bạn
3. Cấu hình DNS theo hướng dẫn Vercel
4. Chờ DNS propagate (thường < 24h)

## Giám Sát

### Logs

Xem logs trong Vercel Dashboard → Deployment → Runtime Logs

### Analytics

Vercel cung cấp analytics miễn phí:
- Vào project → Analytics tab
- Xem traffic, performance, errors

## Hỗ Trợ

Nếu gặp vấn đề:

1. Check Vercel build logs
2. Check browser console (F12)
3. Check Network tab để xem API calls
4. Xem server logs trong Vercel Runtime Logs

---

## Quick Reference

**Production URL Structure:**
- Homepage: `https://your-app.vercel.app`
- Install: `https://your-app.vercel.app/install`
- Admin Login: `https://your-app.vercel.app/admin/login`
- User Login: `https://your-app.vercel.app/login`

**Important Commands:**
```bash
npm run db:push          # Push schema to database
npm run build            # Build for production
npm run dev              # Local development
npm run db:backup        # Backup database (JSON)
npm run db:export        # Export database (SQL)
```
