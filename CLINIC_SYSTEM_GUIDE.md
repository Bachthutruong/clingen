# 🏥 Hệ thống quản lý phòng khám ClinGen

## 📋 Tổng quan

Hệ thống quản lý phòng khám ClinGen là một ứng dụng web toàn diện được thiết kế để quản lý tất cả các hoạt động của phòng khám xét nghiệm, từ tiếp đón bệnh nhân đến báo cáo tài chính.

## 🎯 Các chức năng chính

### 1. **TIẾP ĐÓN BỆNH NHÂN**
- ✅ **Đăng ký bệnh nhân mới**
  - Nhập thông tin hành chính đầy đủ
  - Tính toán tuổi tự động
  - Quản lý thông tin liên hệ khẩn cấp
  - Chọn nguồn giới thiệu

- ✅ **Chọn dịch vụ xét nghiệm**
  - Danh mục dịch vụ theo chuyên khoa
  - Tìm kiếm và lọc dịch vụ
  - Giỏ hàng với tính năng thêm/xóa
  - Tính toán giá tự động theo nguồn giới thiệu

- ✅ **Quản lý nguồn giới thiệu**
  - CRUD hoàn chỉnh cho nguồn giới thiệu
  - Phân loại: Bệnh viện, Phòng khám, Bác sĩ, Tự đến
  - Thiết lập % chiết khấu theo nguồn
  - Thông tin liên hệ chi tiết

- ✅ **Danh sách bệnh nhân**
  - Tìm kiếm đa điều kiện
  - Lọc theo giới tính, độ tuổi
  - Sắp xếp theo nhiều tiêu chí
  - Thống kê và xuất Excel

### 2. **QUẢN LÝ XÉT NGHIỆM**
- ✅ **Thông tin bệnh nhân**
  - Danh sách đăng ký xét nghiệm
  - Theo dõi tiến độ từng xét nghiệm
  - Cập nhật trạng thái mẫu
  - Nhập kết quả trực tiếp

- ✅ **Trạng thái mẫu**
  - Tracking đầy đủ: Chờ lấy mẫu → Đang lấy mẫu → Đang xử lý → Hoàn thành
  - Quản lý mức độ ưu tiên (Bình thường, Khẩn cấp, CITO)
  - Thông tin chi tiết về mẫu (loại ống, vị trí lưu trữ, số lô)
  - Lý do từ chối mẫu và xử lý

- ✅ **Kết quả xét nghiệm**
  - Nhập kết quả với validation
  - So sánh với giá trị bình thường
  - Workflow phê duyệt: Bản thảo → Đã duyệt → Đã phê duyệt
  - In kết quả và gửi cho bệnh nhân

- ✅ **Quản lý vật tư - hóa chất**
  - Inventory management hoàn chỉnh
  - Tracking hạn sử dụng
  - Cảnh báo hết hàng/sắp hết hạn
  - Lịch sử nhập/xuất kho
  - Quản lý nhà cung cấp

- ✅ **Thống kê Lab**
  - Dashboard hiệu suất theo thời gian
  - Phân tích chất lượng mẫu
  - Top dịch vụ được sử dụng nhiều nhất
  - Metrics về thời gian xử lý
  - Báo cáo tỷ lệ từ chối mẫu

### 3. **TÀI CHÍNH & KẾ TOÁN**
- ✅ **Báo cáo tài chính**
  - Dashboard tài chính tổng quan
  - Phân tích doanh thu, chi phí, lợi nhuận
  - Xu hướng tăng trưởng theo thời gian
  - So sánh hiệu suất các kỳ
  - Xuất báo cáo PDF/Excel

- ✅ **Hóa đơn & Thanh toán**
  - Tạo hóa đơn tự động từ đăng ký
  - Quản lý nhiều phương thức thanh toán
  - Tracking công nợ và hóa đơn quá hạn
  - Lịch sử thanh toán chi tiết
  - In hóa đơn và gửi email

- ✅ **Quản lý nhà cung cấp**
  - Database nhà cung cấp hoàn chỉnh
  - Đánh giá và rating nhà cung cấp
  - Quản lý hợp đồng và điều khoản thanh toán
  - Tracking đơn hàng và giao dịch
  - Phân tích hiệu suất partnership

### 4. **QUẢN LÝ HỆ THỐNG**
- ✅ **Quản lý tài khoản**
  - CRUD users với phân quyền theo vai trò
  - 4 vai trò: Admin, Tiếp đón, Xét nghiệm, Kế toán
  - Quản lý permissions chi tiết
  - Reset password và quản lý session
  - Tracking hoạt động người dùng

- ✅ **Lịch sử hệ thống**
  - System logs toàn diện
  - Phân loại theo mức độ: Info, Warning, Error, Critical
  - Filter theo user, action, thời gian
  - Chi tiết kỹ thuật (IP, User Agent, etc.)
  - Monitoring sức khỏe hệ thống

## 🔐 Phân quyền hệ thống

### **Admin** (admin@clinic.com / 123456)
- Quyền truy cập tất cả modules
- Quản lý tài khoản người dùng
- Xem lịch sử hệ thống
- Cấu hình và settings

### **Nhân viên tiếp đón** (staff@clinic.com / 123456)
- Đăng ký bệnh nhân
- Chọn dịch vụ xét nghiệm
- Quản lý nguồn giới thiệu
- Xem danh sách bệnh nhân

### **Kỹ thuật viên Lab** (lab@clinic.com / 123456)
- Xem thông tin bệnh nhân đã đăng ký
- Quản lý trạng thái mẫu
- Nhập kết quả xét nghiệm
- Quản lý vật tư hóa chất
- Xem thống kê Lab

### **Kế toán** (accountant@clinic.com / 123456)
- Xem báo cáo tài chính
- Quản lý hóa đơn và thanh toán
- Quản lý nhà cung cấp
- Phân tích doanh thu

## 🚀 Khởi chạy hệ thống

### Yêu cầu hệ thống
- Node.js 18+ 
- NPM hoặc Yarn
- Browser hiện đại (Chrome, Firefox, Safari, Edge)

### Cài đặt và chạy
```bash
# Clone repository
git clone [repository-url]
cd clinic-management

# Cài đặt dependencies
npm install

# Khởi chạy development server
npm run dev

# Truy cập: http://localhost:5173
```

### Tài khoản demo
- **Admin**: admin@clinic.com / 123456
- **Tiếp đón**: staff@clinic.com / 123456  
- **Lab**: lab@clinic.com / 123456
- **Kế toán**: accountant@clinic.com / 123456

## 💻 Công nghệ sử dụng

### Frontend
- ⚛️ **React 19** + TypeScript - Framework chính
- 🎨 **Tailwind CSS** - Styling
- 🧩 **Shadcn/UI** - Component library
- 🛣️ **React Router v7** - Routing
- 📋 **React Hook Form** - Form management
- ✅ **Zod** - Validation
- 🔗 **Axios** - HTTP client
- 📅 **date-fns** - Date utilities
- 🎯 **Lucide React** - Icons

### Architecture
- 🏗️ **Component-based architecture**
- 🔐 **JWT Authentication**
- 🛡️ **Role-based access control**
- 📱 **Responsive design**
- ♿ **Accessibility compliant**

## 📊 Tính năng nổi bật

### UX/UI Design
- 🎨 Modern gradient design với màu sắc phân biệt theo module
- 📱 Responsive hoàn toàn cho mọi thiết bị
- 🔍 Tìm kiếm thông minh với multiple filters
- 📈 Dashboard với charts và statistics
- 🎯 Workflow-based navigation

### Performance
- ⚡ Lazy loading và code splitting
- 🔄 Optimistic UI updates
- 💾 Local state management
- 🗄️ Efficient data structures
- 🎛️ Configurable pagination

### Security
- 🔐 JWT-based authentication
- 🛡️ Role-based authorization
- 📋 Input validation và sanitization
- 🔍 Audit trails và system logs
- 🚨 Error handling và monitoring

## 🗂️ Cấu trúc dự án

```
src/
├── components/          # Shared components
│   ├── ui/             # Base UI components (Button, Input, etc.)
│   ├── Layout.tsx      # Main layout with navigation
│   └── ProtectedRoute.tsx
├── contexts/           # React contexts
│   └── AuthContext.tsx
├── pages/             # Page components
│   ├── Reception/     # Reception module
│   ├── Lab/           # Lab management module  
│   ├── Finance/       # Finance & accounting module
│   ├── Admin/         # Admin & system management
│   ├── Dashboard.tsx
│   └── Login.tsx
├── types/             # TypeScript type definitions
├── services/          # API services
├── lib/              # Utility functions
└── styles/           # Global styles
```

## 🔄 Workflow tiêu biểu

### Quy trình xét nghiệm từ A-Z
1. **Tiếp đón**: Đăng ký bệnh nhân → Chọn dịch vụ → Tạo đăng ký
2. **Lab**: Nhận mẫu → Xử lý → Nhập kết quả → Phê duyệt
3. **Kế toán**: Tạo hóa đơn → Xử lý thanh toán → Báo cáo doanh thu
4. **Admin**: Monitoring → User management → System health

### Data Flow
```
Patient Registration → Service Selection → Sample Collection → 
Testing → Results → Invoicing → Payment → Reporting
```

## 🎯 Roadmap tương lai

### Phase 2 - Advanced Features
- [ ] API Backend integration (Node.js/Python)
- [ ] Real-time notifications
- [ ] Advanced reporting với charts
- [ ] Mobile app companion
- [ ] Integration với thiết bị xét nghiệm

### Phase 3 - Enterprise Features  
- [ ] Multi-clinic support
- [ ] Advanced analytics và ML
- [ ] API for third-party integrations
- [ ] Advanced workflow automation
- [ ] Compliance và certification tools

## 🤝 Đóng góp

Hệ thống được thiết kế modular và extensible. Để đóng góp:

1. Fork repository
2. Tạo feature branch
3. Implement và test thoroughly
4. Submit pull request với documentation

## 📞 Hỗ trợ

Để được hỗ trợ sử dụng hệ thống:
- 📧 Email: support@clinegen.com
- 📱 Hotline: 1900-xxxx
- 💬 Live chat trong ứng dụng

---

**ClinGen** - Giải pháp quản lý phòng khám hiện đại và toàn diện 🏥✨ 