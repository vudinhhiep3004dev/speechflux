# SpeechFlux Migration to Next.js 15 with React Server Components

## Tổng quan

Dự án này đã được nâng cấp để sử dụng Next.js 15 và React Server Components. Tài liệu này cung cấp thông tin về các thay đổi chính, các vấn đề đã được giải quyết, và hướng dẫn cho việc phát triển tiếp theo.

## Các vấn đề đã được giải quyết

1. **Xung đột Server Component và Client Component**
   - Chuyển đổi Root Layout thành Client Component
   - Tách biệt rõ ràng giữa phần server-side và client-side
   - Tập trung các hành vi phụ thuộc browser vào client components

2. **Vấn đề với Lexical Editor**
   - Tạo lexical-shim.ts để tương thích với các import paths
   - Chuẩn hóa các hàm tiện ích và loại dữ liệu

3. **Vấn đề xác thực**
   - Sử dụng middleware-based authentication
   - Tách biệt logic xác thực khỏi các Server Components

4. **Cấu hình Build**
   - Cập nhật next.config.js để phù hợp với Next.js 15
   - Tối ưu hóa các tùy chọn build

5. **Giao diện người dùng**
   - Tạo layout Dashboard mới với Sidebar và responsive design
   - Thêm chức năng chuyển đổi theme sáng/tối
   - Cải thiện trải nghiệm người dùng trên các thiết bị di động

6. **Hiệu suất và khả năng mở rộng**
   - Tích hợp Redis cho caching và job queue
   - Cập nhật các API route để sử dụng hệ thống queue
   - Tích hợp Supabase Edge Functions cho xử lý bất đồng bộ
   - Tạo webhook endpoint cho thông báo khi xử lý hoàn tất

## Các file đã được thay đổi

- **Cấu trúc cốt lõi**:
  - `src/app/layout.tsx` - Chuyển sang Client Component
  - `src/app/metadata.ts` - Tách metadata cho server components
  - `src/middleware.ts` - Cập nhật xác thực và bảo vệ routes

- **Lexical Editor**:
  - `src/components/editor/lexical-shim.ts` - Shim cho các Lexical imports
  - `src/components/editor/plugins/ToolbarPlugin.tsx` - Sử dụng lexical-shim

- **Dashboard Components**:
  - `src/components/dashboard/nav.tsx` - Client Component cho điều hướng 
  - `src/components/dashboard/sidebar.tsx` - Client Component cho thanh bên dashboard
  - `src/app/dashboard/layout.tsx` - Client Component cho layout dashboard
  - `src/app/dashboard/page.tsx` - Client Component cho trang chính
  - `src/app/dashboard/settings/page.tsx` - Trang cài đặt người dùng

- **UI Components**:
  - `src/components/ui/header.tsx` - Header mới với responsive design
  - `src/components/ui/theme-toggle.tsx` - Component chuyển đổi theme
  - `src/components/ui/separator.tsx` - Component phân cách UI
  - `src/components/ui/switch.tsx` - Component công tắc cho cài đặt

- **Redis Integration**:
  - `src/lib/redis/client.ts` - Redis client utility và các hàm cơ bản
  - `src/lib/redis/types.ts` - TypeScript interfaces cho Redis functions
  - `src/lib/redis/cache-utils.ts` - Utility functions cho caching
  - `src/lib/redis/index.ts` - Export các Redis utilities

- **Queue Processing**:
  - `src/app/api/queues/process/route.ts` - API endpoint xử lý queue jobs
  - `src/app/api/webhooks/edge-function-complete/route.ts` - Webhook cho Edge Functions
  - `src/lib/storage/upload.ts` - Cập nhật upload logic để sử dụng queue

- **Cấu hình**:
  - `next.config.js` - Cập nhật cấu hình build
  - `package.json` - Thêm scripts build mới
  - `.env.example` - Cập nhật với Redis environment variables

## Hướng dẫn phát triển

### Quy tắc Server vs Client Components

1. **Server Components (mặc định)** nên được sử dụng cho:
   - Fetch dữ liệu
   - Truy cập backends trực tiếp
   - Giữ thông tin nhạy cảm (API keys, tokens)
   - Các thành phần không tương tác không cần hooks

2. **Client Components** (thêm `'use client'`) nên được sử dụng cho:
   - Thành phần tương tác người dùng
   - Sử dụng React hooks (useState, useEffect)
   - Sử dụng trình xử lý sự kiện
   - Truy cập browser APIs
   - Sử dụng các thư viện effect, state hoặc class components

### Quy tắc xác thực

- Kiểm tra xác thực trong middleware
- Chỉ sử dụng AuthProvider trong Client Components
- Sử dụng server actions cho các hành động yêu cầu xác thực ở phía server

### Làm việc với Redis & Caching

- Sử dụng `getFileWithCache` thay vì truy vấn database trực tiếp
- Đặt TTL (thời gian sống) phù hợp với loại dữ liệu
- Luôn invalidate cache khi dữ liệu thay đổi
- Sử dụng job queue cho các tác vụ nặng

### Edge Functions & Webhooks

- Edge Functions chạy trên Supabase và được gọi qua API
- Webhook endpoint nhận thông báo khi Edge Function hoàn tất
- Mọi xử lý AI nên được thực hiện qua Edge Functions
- Thêm rate limiting và retry logic cho API calls

### Build và Deployment

Sử dụng các lệnh sau để build:

```bash
# Build thường
npm run build

# Build cho production (include các tối ưu)
npm run build:prod 

# Build với bộ nhớ tăng cường
npm run build:full

# Build nhanh (bỏ qua mangling)
npm run build:fast
```

## Roadmap Phát triển tiếp theo

1. **Hoàn thiện chuyển đổi Server Components**
   - Tách biệt hoàn toàn data fetching và UI logic
   - Sử dụng React Server Components cho các trang không tương tác

2. **Cải thiện Performance**
   - Optimistic UI updates
   - Streaming SSR
   - Edge API routes

3. **Tích hợp Redis và Edge Functions**
   - ✅ Cài đặt hệ thống caching với Redis
   - ✅ Xây dựng queues cho xử lý bất đồng bộ
   - ✅ Phát triển Edge Functions cho backend serverless
   - ✅ Thêm monitoring và alerting
   - ✅ Tự động hóa triển khai Edge Functions

4. **Tính năng nâng cao**
   - Subscription và thanh toán tự động
   - Analytic dashboard cho người dùng
   - Tích hợp APIs bên ngoài (Zoom, Meet, etc.)

## Tài liệu tham khảo

- [Next.js App Router Documentation](https://nextjs.org/docs/app)
- [React Server Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)
- [Authentication with Next.js](https://nextjs.org/docs/authentication)
- [Migration từ Pages Router sang App Router](https://nextjs.org/docs/app/building-your-application/upgrading/app-router-migration)
- [Upstash Redis Documentation](https://docs.upstash.com/redis)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions) 