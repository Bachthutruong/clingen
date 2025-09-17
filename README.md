# Clinic Management System

Hệ thống quản lý phòng khám được xây dựng với React, TypeScript, Vite và Tailwind CSS.

## 📋 Yêu cầu hệ thống

- **Node.js**: >= 18.0.0 (khuyến nghị 18.17.0 hoặc cao hơn)
- **npm**: >= 8.0.0 (hoặc yarn >= 1.22.0)
- **Git**: >= 2.0.0

## 🚀 Cài đặt và chạy ứng dụng

### 1. Kiểm tra phiên bản Node.js

```bash
node --version
# Kết quả mong muốn: v18.17.0 hoặc cao hơn

npm --version
# Kết quả mong muốn: 8.0.0 hoặc cao hơn
```

### 2. Clone repository

```bash
git clone <repository-url>
cd clinic-management-system
```

### 3. Cài đặt dependencies

```bash
# Sử dụng npm
npm install

# Hoặc sử dụng yarn
yarn install

# Hoặc sử dụng pnpm
pnpm install
```

### 4. Cấu hình môi trường

Tạo file `.env` trong thư mục gốc:

```bash
# API Configuration
VITE_API_BASE_URL=http://localhost:9872/api/pk/v1
VITE_API_TIMEOUT=30000

# Storage Keys
VITE_TOKEN_STORAGE_KEY=clinic_token
VITE_REFRESH_TOKEN_STORAGE_KEY=clinic_refresh_token
VITE_USER_STORAGE_KEY=clinic_user

# WebSocket Configuration
VITE_WS_URL=ws://localhost:9872/api/pk/v1/ws
```

### 5. Chạy ứng dụng

```bash
# Development mode
npm run dev

# Hoặc sử dụng yarn
yarn dev

# Hoặc sử dụng pnpm
pnpm dev
```

Ứng dụng sẽ chạy tại: `http://localhost:5173`

### 6. Build cho production

```bash
# Build ứng dụng
npm run build

# Hoặc sử dụng yarn
yarn build

# Hoặc sử dụng pnpm
pnpm build
```

File build sẽ được tạo trong thư mục `dist/`

### 7. Preview build

```bash
# Xem trước build production
npm run preview

# Hoặc sử dụng yarn
yarn preview

# Hoặc sử dụng pnpm
pnpm preview
```

## 🛠️ Scripts có sẵn

| Script | Mô tả |
|--------|-------|
| `npm run dev` | Chạy ứng dụng ở chế độ development |
| `npm run build` | Build ứng dụng cho production |
| `npm run preview` | Xem trước build production |
| `npm run lint` | Chạy ESLint để kiểm tra code |
| `npm run lint:fix` | Tự động sửa các lỗi ESLint có thể sửa được |

## 📁 Cấu trúc thư mục

```
src/
├── components/          # Các component tái sử dụng
│   ├── ui/             # UI components cơ bản
│   └── ...
├── pages/              # Các trang chính
│   ├── Admin/          # Trang quản trị
│   ├── Finance/        # Trang tài chính
│   ├── Lab/            # Trang phòng xét nghiệm
│   └── Reception/      # Trang tiếp tân
├── services/           # API services
├── contexts/           # React contexts
├── types/              # TypeScript type definitions
├── lib/                # Utility functions
└── assets/             # Static assets
```

## 🔧 Công nghệ sử dụng

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: React Context API
- **HTTP Client**: Axios
- **Icons**: Lucide React
- **Routing**: React Router DOM

## 🌐 API Integration

Ứng dụng tích hợp với backend API thông qua các endpoints:

- **Authentication**: `/auth/*`
- **Patients**: `/patient/*`
- **Test Types**: `/test-type/*`
- **Materials**: `/material/*`
- **Inventory**: `/inventory/*`
- **Revenue**: `/revenue/*`
- **Monthly Costs**: `/monthly-costs/*`
- **System Logs**: `/system-log/*`
- **Notifications**: `/notifications/*`

## 🚨 Xử lý lỗi

Tất cả API calls đều được xử lý lỗi tự động và hiển thị message lỗi từ server:

```typescript
// Ví dụ xử lý lỗi
try {
  await monthlyCostsApi.create(costData)
} catch (error) {
  // Error message sẽ được hiển thị từ API response
  console.error('Lỗi tạo chi phí:', error.message)
}
```

## 📱 Responsive Design

Ứng dụng được thiết kế responsive và hỗ trợ:

- **Desktop**: >= 1024px
- **Tablet**: 768px - 1023px
- **Mobile**: < 768px

## 🔐 Authentication

Hệ thống sử dụng JWT token với refresh token:

- **Access Token**: Hết hạn sau 24 giờ
- **Refresh Token**: Tự động làm mới token
- **Auto Logout**: Khi refresh token hết hạn

## 📊 Features chính

- **Quản lý bệnh nhân**: Đăng ký, cập nhật thông tin
- **Quản lý xét nghiệm**: Loại xét nghiệm, mẫu xét nghiệm
- **Quản lý kho**: Vật tư, hóa chất, nhập xuất kho
- **Quản lý tài chính**: Doanh thu, chi phí hàng tháng
- **Quản lý người dùng**: Phân quyền, quản lý tài khoản
- **Báo cáo thống kê**: Dashboard, báo cáo chi tiết
- **Lịch sử hệ thống**: Theo dõi hoạt động người dùng

## 🤝 Đóng góp

1. Fork repository
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Tạo Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
