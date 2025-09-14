// API Response types
export interface MethodResult<T = any> {
  status: boolean
  message: string
  data: T
  totalRecord: number
}

// Search DTOs
export interface SearchDTO {
  keyword?: string
  status?: number
  pageIndex?: number
  pageSize?: number
  orderCol?: string
  isDesc?: boolean
}

// Department DTOs
export interface DepartmentDTO {
  id?: number
  name: string
  description?: string
}

export interface PatientTestSearchDTO extends SearchDTO {
  testSampleId?: number
  testTypeId?: number
}

export interface InventorySearchDTO extends SearchDTO {
  materialId?: number
  fromImportDate?: string
  toImportDate?: string
  fromExpiryDate?: string
  toExpiryDate?: string
  materialType?: number // 1 - hóa chất, 2 - vật tư
}

export interface InventoryLogsSearchDTO extends SearchDTO {
  logType?: number // 1 - nhập kho, 2 - xuất kho
  fromDate?: string
  toDate?: string
}

// Test Price Config DTO
export interface TestPriceConfigDTO {
  quantityRangeId?: number // Id của khung số lượng nếu select từ dropdown/nếu sửa số lượng min hoặc max thì trường này null
  minQuantity: number
  maxQuantity: number
  price: number // Giá theo cái khung này
}

// Test Sample in Test Type DTO
export interface TestTypeTestSampleDTO {
  id: number
  sampleName: string
}

// Test Type DTO
export interface TestTypeDTO {
  id?: number
  name: string // Tên xét nghiệm
  code: string // Mã xét nghiệm
  description?: string // Mô tả chi tiết xét nghiệm
  price: number // Giá xét nghiệm (VNĐ)
  status: number // Trạng thái: 0 không hoạt động, 1 hoạt động
  testSampleIds: number[] // array<integer> Items integer int64
  testSamples?: TestTypeTestSampleDTO[] // Danh sách mẫu xét nghiệm kèm theo
  classPathTemplate?: string // Mẫu class path (tùy chọn)
}

// Test Sample DTO
export interface TestSampleDTO {
  id?: number
  name: string
}

// Test Sample DTO từ GET /test-sample endpoint 
export interface TestSampleSimpleDTO {
  id: number
  sampleName: string
}

// Referral Source DTO
export interface ReferralSourceDTO {
  id?: number
  name: string // Tên nguồn gửi
  code: string // Mã nguồn gửi
  priceConfigs: Array<{
    testTypeId: number // int64
    testPriceConfigs: TestPriceConfigDTO[]
  }> // List loại xét nghiệm
  status: number // Trạng thái: 0 không hoạt động, 1 hoạt động
}

export interface ReferralSourceTestTypeDTO {
  testTypeId: number // int64
  testPriceConfigs: TestPriceConfigDTO[]
}

// Patient Service Detail DTO
export interface PatientServiceDetailDTO {
  id: number
  testTypeName: string // Tên dịch vụ kiểm tra
  testSampleName: string // Tên mẫu xét nghiệm
  price: number // Giá dịch vụ
  status: number // Trạng thái dịch vụ
  barcode: string // Mã vạch
}

// Patient DTO
export interface PatientInfoDTO {
  id?: number
  fullName: string // Họ tên bệnh nhân
  birthYear: string // Năm sinh - date format
  gender: number // Giới tính: 0 nữ, 1 nam, 2 khác
  address?: string // Địa chỉ nơi cư trú
  phoneNumber?: string // Số điện thoại liên hệ
  reasonForVisit?: string // Lý do đến khám
  referralSourceId?: number // Nguồn đến (ví dụ: tự đến, giới thiệu, chuyển viện) - int64
  referralSourceName?: string // Tên nguồn gửi
  referralSourceCode?: string // Mã nguồn gửi
  email?: string // Địa chỉ email
  guardianName?: string // Tên người bảo lãnh
  guardianRelationship?: string // Quan hệ với người bệnh (ví dụ: cha, mẹ, anh chị em)
  guardianPhoneNumber?: string // Số điện thoại của người bảo lãnh
  typeTests: PatientTestDTO[] // Danh sách dịch vụ xét nghiệm
  details?: PatientServiceDetailDTO[] // Chi tiết các dịch vụ đã thực hiện
}

export interface PatientTestDTO {
  testId: number // int64
  testSampleId: number // int64
  testSampleName?: string
}

// Packaging DTO
export interface PackagingDTO {
  id?: number
  name: string // ≥ 1 characters
  code: string // ≥ 1 characters
  quantity: number // int64
  status: number // int32
}

// Material DTO (Vật tư / hoá chất)
export interface MaterialDTO {
  id?: number
  name: string // Tên vật tư / hoá chất - ≥ 1 characters
  code: string // Mã vật tư / hoá chất - ≥ 1 characters
  quantity: number // Số lượng - int64
  packagingId: number // Id quy cách đóng gói - int64
  importTime: string // Thời gian nhập kho - date-time
  expiryTime?: string // Hạn sử dụng - date-time
  type: number // Loại: 1 - hóa chất, 2 - vật tư - int32
}

// Material API Response for dropdown selection
export interface MaterialAPIResponse {
  id: number
  name: string
  code: string
  type: number
  status?: number
  description?: string
}

// Inventory Log DTO - Updated to match new API spec
export interface InventoryLogItemDTO {
  type: number // Loại hàng hóa - int32
  materialId: number // ID của vật tư hoặc hóa chất - int64
  quantity: number // Số lượng xuất / nhập - int64
  expiryDate: string // Hạn sử dụng - date format (e.g. "2026-06-19")
  unitPrice: number // Đơn giá
  amount: number // Thành tiền
  note: string // Ghi chú
}

export interface InventoryLogsDTO {
  id?: number
  logType: number // Loại log: 1 - nhập kho, 2 - xuất kho - int32
  exportType: number // Loại xuất
  exportId: number // ID liên quan đến xuất
  items: InventoryLogItemDTO[]
  note: string // Ghi chú
  isPay?: boolean // Đã thanh toán (chỉ áp dụng khi nhập kho)
}

// Create/Update Request types
export interface CreateTestTypeRequest {
  name: string
  code: string
  description?: string
  price: number
  status: number
  testSampleIds: number[]
  classPathTemplate?: string
}

export interface CreateTestSampleRequest {
  name: string
}

export interface CreateReferralSourceRequest {
  name: string
  code: string
  priceConfigs: Array<{
    testTypeId: number
    testPriceConfigs: TestPriceConfigDTO[]
  }>
  status: number
}

export interface CreatePatientRequest {
  fullName: string
  birthYear: string
  gender: number
  address?: string
  phoneNumber: string
  reasonForVisit?: string
  referralSourceId?: number
  email?: string
  guardianName?: string
  guardianRelationship?: string
  guardianPhoneNumber?: string
  typeTests: PatientTestDTO[]
}

export interface CreatePackagingRequest {
  name: string
  code: string
  quantity: number
  status: number
}

export interface CreateMaterialRequest {
  name: string
  code: string
  quantity: number
  packagingId: number
  importTime: string
  expiryTime?: string
  type: number
}

export interface CreateInventoryLogRequest {
  logType: number // Loại log: 1 - nhập kho, 2 - xuất kho
  exportType: number // Loại xuất
  exportId: number // ID liên quan đến xuất
  items: InventoryLogItemDTO[]
  note: string // Ghi chú
  isPay?: boolean // Đã thanh toán (chỉ cho nhập kho)
}

// Utility types for compatibility with existing code
export interface PaginatedResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number
  first: boolean
  last: boolean
  numberOfElements: number
}

// Transform MethodResult to PaginatedResponse for compatibility
export function transformToPaginatedResponse<T>(
  methodResult: MethodResult<T[]>,
  pageIndex: number = 0,
  pageSize: number = 20
): PaginatedResponse<T> {
  const totalElements = methodResult.totalRecord || 0
  const totalPages = Math.ceil(totalElements / pageSize)
  
  return {
    content: methodResult.data || [],
    totalElements,
    totalPages,
    size: pageSize,
    number: pageIndex,
    first: pageIndex === 0,
    last: pageIndex >= totalPages - 1,
    numberOfElements: (methodResult.data || []).length
  }
}

// Legacy types for compatibility
export interface PackagingSearchParams extends SearchDTO {}
export interface TestTypeSearchParams extends SearchDTO {}
export interface ReferralSourceSearchParams extends SearchDTO {}
export interface PatientSearchParams extends SearchDTO {}

// Backward compatibility aliases
export type TestType = TestTypeDTO
export type TestSample = TestSampleDTO
export type ReferralSourceAPI = ReferralSourceDTO
export type PatientAPI = PatientInfoDTO
export type Packaging = PackagingDTO
export type Material = MaterialDTO
export type InventorySearchRequest = InventorySearchDTO
export type InventoryLogSearchRequest = InventoryLogsSearchDTO

// Enums for status values
export enum Status {
  INACTIVE = 0,
  ACTIVE = 1
}

export enum Gender {
  FEMALE = 0, // Nữ
  MALE = 1,   // Nam  
  OTHER = 2   // Khác
}

export enum MaterialType {
  CHEMICAL = 1, // Hóa chất
  SUPPLY = 2    // Vật tư
}

export enum InventoryLogType {
  IMPORT = 1, // Nhập kho
  EXPORT = 2  // Xuất kho
}

// Helper functions
export function getStatusLabel(status: number): string {
  return status === 1 ? 'Hoạt động' : 'Không hoạt động'
}

export function getGenderLabel(gender: number): string {
  switch (gender) {
    case 0: return 'Nữ'
    case 1: return 'Nam'
    case 2: return 'Khác'
    default: return 'Không xác định'
  }
}

export function getMaterialTypeLabel(type: number): string {
  switch (type) {
    case 1: return 'Hóa chất'
    case 2: return 'Vật tư'
    default: return 'Không xác định'
  }
}

export function getInventoryLogTypeLabel(logType: number): string {
  switch (logType) {
    case 1: return 'Nhập kho'
    case 2: return 'Xuất kho'
    default: return 'Không xác định'
  }
}

// Additional helper for currency formatting
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

// Additional helper for date formatting
export function formatDateTime(dateString?: string): string {
  if (!dateString) return 'Chưa có'
  return new Date(dateString).toLocaleString('vi-VN')
}

export function formatDate(dateString?: string): string {
  if (!dateString) return 'Chưa có'
  return new Date(dateString).toLocaleDateString('vi-VN')
}

// Additional types for Inventory Management (for compatibility with existing code)
export interface InventoryItem {
  id?: number
  name: string
  code: string
  description?: string
  unit: string
  currentStock: number
  minStock: number
  maxStock: number
  unitPrice: number
  location?: string
  materialType: number // 1 - hóa chất, 2 - vật tư
  status: number
  importDate?: string
  expiryDate?: string
  createdAt?: string
  updatedAt?: string
}

export interface InventoryLog {
  id?: number
  inventoryId: number
  logType: number // 1: Nhập, 2: Xuất
  quantity: number
  remainingQuantity?: number
  reason?: string
  note?: string
  createdBy?: string
  createdAt?: string
  inventoryItem?: InventoryItem
}

export interface InventoryCreateRequest {
  name: string
  code: string
  description?: string
  unit: string
  currentStock: number
  minStock: number
  maxStock: number
  unitPrice: number
  location?: string
  materialType: number // 1 - hóa chất, 2 - vật tư
  status: number
  importDate?: string
  expiryDate?: string
}

export interface InventoryLogCreateRequest {
  inventoryId: number
  logType: number // 1 - nhập kho, 2 - xuất kho
  quantity: number
  reason?: string
  note?: string
}

// ===== NEW TYPES FOR COMPLETE API INTEGRATION =====

// Notification Types - Updated to match API spec
export interface Notification {
  id: number
  title: string
  message: string
  type: number
  typeName: string
  typeClass: string
  targetType: number
  targetTypeName: string
  targetValue: string
  recipientUsername: string
  isRead: boolean
  readAt?: string
  sentBy: string
  priority: number
  priorityText: string
  expiresAt?: string
  actionUrl?: string
  createdAt: string
  updatedAt: string
  isExpired: boolean
}

export interface NotificationConfig {
  id: number
  username: string
  notificationType: number
  notificationTypeName: string
  enabled: boolean
  realTimeEnabled: boolean
  emailEnabled: boolean
  soundEnabled: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateNotificationRequest {
  title: string
  message: string
  type: number
  targetType: number
  targetValue: string
  priority: number
  expiresAt?: string
  actionUrl?: string
  notificationType: string
  validTarget: boolean
  notificationTarget: string
}

export interface CreateNotificationConfigRequest {
  notificationType: number
  enabled: boolean
  realTimeEnabled: boolean
  emailEnabled: boolean
  soundEnabled: boolean
}

export interface NotificationSearchParams {
  page?: number
  size?: number
  sortBy?: string
  sortDir?: string
  type?: number
  priority?: number
  isRead?: boolean
  startTime?: string
  endTime?: string
  minPriority?: number
}

// Legacy types for backward compatibility
export enum NotificationType {
  PATIENT_TEST_COMPLETED = 'PATIENT_TEST_COMPLETED',
  SAMPLE_STATUS_UPDATED = 'SAMPLE_STATUS_UPDATED',
  INVENTORY_LOW_STOCK = 'INVENTORY_LOW_STOCK',
  EXPENSE_DUE = 'EXPENSE_DUE',
  REVENUE_TARGET = 'REVENUE_TARGET',
  SYSTEM_ALERT = 'SYSTEM_ALERT'
}

export enum NotificationPriority {
  LOW = 1,
  MEDIUM = 2,
  HIGH = 3,
  URGENT = 4
}

// Patient Test Types
export interface PatientTest {
  id: number
  patientId: number
  patientName: string
  patientCode: string
  testTypeId: number
  testTypeName: string
  testSampleId: number
  testSampleName: string
  status: PatientTestStatus
  registrationDate: string
  collectionDate?: string
  processingDate?: string
  completedDate?: string
  resultHtml?: string
  notes?: string
  referralSourceId?: number
  referralSourceName?: string
  price: number
  createdAt: string
  updatedAt: string
}

export enum PatientTestStatus {
  REGISTERED = 0,      // Đã đăng ký
  COLLECTING = 1,      // Đang thu thập mẫu
  COLLECTED = 2,       // Đã thu thập mẫu
  PROCESSING = 3,      // Đang xử lý
  COMPLETED = 4,       // Hoàn thành
  REJECTED = 5,        // Từ chối
  CANCELLED = 6        // Hủy bỏ
}

export interface PatientTestSearchDTO extends SearchDTO {
  testSampleId?: number
  testTypeId?: number
  referralSourceId?: number
  status?: PatientTestStatus
  fromDate?: string
  toDate?: string
}

export interface CreatePatientTestRequest {
  patientId: number
  typeTests: Array<{
    testId: number
    testSampleId: number
    priority?: string
  }>
  referralSourceId?: number
  notes?: string
}

export interface PatientTestResult {
  id: number
  patientTestId: number
  resultHtml: string
  resultData: any
  testedBy: string
  testedAt: string
  verifiedBy?: string
  verifiedAt?: string
}

// Revenue Types
export interface Revenue {
  id: number
  patientTestId: number
  patientName: string
  testTypeName: string
  amount: number
  referralSourceId?: number
  referralSourceName?: string
  registrationDate: string
  status: RevenueStatus
  createdAt: string
  updatedAt: string
}

export enum RevenueStatus {
  PENDING = 0,         // Chờ thanh toán
  PAID = 1,            // Đã thanh toán
  CANCELLED = 2,       // Đã hủy
  REFUNDED = 3         // Đã hoàn tiền
}

export interface RevenueSearchParams {
  keyword?: string
  fromDate?: string
  toDate?: string
  referralSourceId?: number
  status?: RevenueStatus
  pageIndex?: number
  pageSize?: number
  orderCol?: string
  isDesc?: boolean
}

// Expense Category Types
export interface ExpenseCategory {
  id: number
  short: number
  name: string
  englishName: string
  description?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export enum ExpenseCategoryEnum {
  RENT = 1,            // Chi phí thuê phòng
  CHEMICAL = 2,        // Chi phí hóa chất
  CONSUMABLE = 3,      // Chi phí vật tư tiêu hao
  STAFF_SALARY = 4,    // Lương nhân viên
  ADMIN = 5,           // Chi phí quản lý
  EQUIPMENT = 6,       // Chi phí thiết bị
  MAINTENANCE = 7,     // Chi phí bảo trì
  UTILITY = 8,         // Chi phí tiện ích (điện, nước, internet)
  MARKETING = 9,       // Chi phí marketing
  INSURANCE = 10,      // Chi phí bảo hiểm
  TRAINING = 11,       // Chi phí đào tạo
  OTHER = 12           // Chi phí khác
}

// Monthly Costs Types - Updated to match new API spec
export interface MonthlyCost {
  id: number
  month: number
  year: number
  monthYearDisplay: string
  category: number
  categoryName: string
  categoryCssClass: string
  costName: string
  description?: string
  amount: number
  formattedAmount: string
  isRecurring: boolean
  isActive: boolean
  vendorName?: string
  invoiceNumber?: string
  paymentDate?: string
  dueDate: string
  notes?: string
  createdBy: string
  updatedBy?: string
  revenueId?: number
  createdAt: string
  updatedAt: string
  isPaid: boolean
  isOverdue: boolean
  paymentStatus: string
  recurringText: string
}

export interface CreateMonthlyCostRequest {
  month: number
  year: number
  category: number
  costName: string
  description?: string
  amount: number
  isRecurring: boolean
  vendorName?: string
  invoiceNumber?: string
  paymentDate?: string
  dueDate: string
  notes?: string
  validMonthYear: boolean
  dueDateValid: boolean
}

export interface UpdateMonthlyCostRequest {
  month?: number
  year?: number
  category?: number
  costName?: string
  description?: string
  amount?: number
  isRecurring?: boolean
  vendorName?: string
  invoiceNumber?: string
  paymentDate?: string
  dueDate?: string
  notes?: string
  validMonthYear?: boolean
  dueDateValid?: boolean
}

export interface MonthlyCostSearchParams {
  month?: number
  year?: number
  category?: number
  costName?: string
  vendorName?: string
  isRecurring?: boolean
  isPaid?: boolean
  page?: number
  size?: number
  sortBy?: string
  sortDirection?: string
}

export interface MonthlyCostSummary {
  month: number
  year: number
  monthYearDisplay: string
  totalCost: number
  formattedTotalCost: string
  costByCategory: Record<string, number>
  formattedCostByCategory: Record<string, string>
  totalCostItems: number
  paidItems: number
  unpaidItems: number
  overdueItems: number
  totalPaidAmount: number
  totalUnpaidAmount: number
  topCategories: Array<{
    categoryCode: number
    categoryName: string
    amount: number
    formattedAmount: string
    percentage: number
    itemCount: number
  }>
  monthlyTrend: Array<{
    month: number
    monthName: string
    amount: number
    formattedAmount: string
  }>
}

export interface MonthlyCostTrend {
  month: number
  monthName: string
  amount: number
  formattedAmount: string
}

export interface MonthlyCostBreakdown {
  categoryCode: number
  categoryName: string
  amount: number
  formattedAmount: string
  percentage: number
  itemCount: number
}

// Legacy types for backward compatibility
export interface MonthlyCostLegacy {
  id: number
  categoryId: number
  categoryName: string
  categoryShort: number
  name: string
  description?: string
  amount: number
  month: number
  year: number
  dueDate: string
  isRecurring: boolean
  isPaid: boolean
  paidDate?: string
  paymentMethod?: string
  notes?: string
  createdBy: string
  createdAt: string
  updatedAt: string
}

// Financial Report Types
export interface FinancialReport {
  period: string
  revenue: number
  expenses: number
  profit: number
  testCount: number
  patientCount: number
  averageOrderValue: number
  revenueByService: RevenueByService[]
  expenseBreakdown: ExpenseBreakdown[]
}

export interface RevenueByService {
  serviceName: string
  serviceCode: string
  revenue: number
  testCount: number
  percentage: number
}

export interface ExpenseBreakdown {
  category: string
  amount: number
  percentage: number
  description: string
}

// WebSocket Types
export interface WebSocketMessage {
  type: string
  data: any
  timestamp: string
}

export interface WebSocketNotification {
  id: number
  title: string
  message: string
  type: NotificationType
  priority: NotificationPriority
  isRead: boolean
  createdAt: string
}

export interface WebSocketUnreadCount {
  count: number
  timestamp: string
}

export interface WebSocketError {
  code: string
  message: string
  timestamp: string
} 

// ===== Simple Master Data Types =====
export interface Department {
  id: number
  name: string
}

export interface Supplier {
  id: number
  name: string
}

// ===== Financial Report Types =====
export interface FinancialReportData {
  month: number
  year: number
  monthYearDisplay: string
  totalRevenue: number
  totalExpense: number
  netProfit: number
  profitMargin: number
  revenueDetails: RevenueDetail[]
  expenseDetails: ExpenseDetail[]
  totalPatients: number
  totalTests: number
  avgRevenuePerPatient: number
  avgCostPerTest: number
  period?: string
}

export interface RevenueDetail {
  revenueType: string
  description: string
  amount: number
  quantity: number
  averageValue: number
}

export interface ExpenseDetail {
  revenueType: string
  description: string
  amount: number
  quantity: number
  averageValue: number
}

export interface MonthlyFinancialReport extends FinancialReportData {
  month: number
  year: number
  dailyRevenue: number[]
  dailyExpenses: number[]
  revenueByService: RevenueByService[]
  expenseBreakdown: ExpenseBreakdown[]
}

export interface YearlyFinancialReport extends FinancialReportData {
  year: number
  monthlyData: MonthlyFinancialReport[]
  quarterlyData: {
    Q1: FinancialReportData
    Q2: FinancialReportData
    Q3: FinancialReportData
    Q4: FinancialReportData
  }
}

export interface RangeFinancialReport extends FinancialReportData {
  fromMonth: number
  fromYear: number
  toMonth: number
  toYear: number
  monthlyData: MonthlyFinancialReport[]
  trendData: {
    period: string
    revenue: number
    expenses: number
    profit: number
  }[]
}

export interface RevenueByService {
  serviceId: number
  serviceCode: string
  serviceName: string
  revenue: number
  testCount: number
  percentage: number
  averagePrice: number
}

export interface ExpenseBreakdown {
  categoryId: number
  category: string
  amount: number
  percentage: number
  description: string
  subCategories?: {
    name: string
    amount: number
    percentage: number
  }[]
}

// Supplier Management Types
export interface SupplierDTO {
  id: number
  name: string
  description?: string
  status: number // 0: inactive, 1: active
  stringStatus?: string // "Hoạt động" or "Không hoạt động"
  createdAt?: string
  createdBy?: string
  updatedAt?: string
  updatedBy?: string
}

export interface SupplierSearchDTO {
  keyword?: string
  status?: number
  pageIndex: number
  pageSize: number
  orderCol?: string
  isDesc?: boolean
  name?: string
}

export interface SupplierResponse {
  status: boolean
  message: string | null
  data: {
    content: SupplierDTO[]
    pageable: {
      pageNumber: number
      pageSize: number
      sort: {
        empty: boolean
        unsorted: boolean
        sorted: boolean
      }
      offset: number
      paged: boolean
      unpaged: boolean
    }
    totalElements: number
    totalPages: number
    last: boolean
    size: number
    number: number
    sort: {
      empty: boolean
      unsorted: boolean
      sorted: boolean
    }
    numberOfElements: number
    first: boolean
    empty: boolean
  }
  totalRecord: number | null
}

// MonthlyCost interface is defined above (line 621) - removing duplicate

export interface MonthlyCostRequest {
  month: number
  year: number
  category: number
  costName: string
  description: string
  amount: number
  isRecurring: boolean
  vendorName: string
  invoiceNumber: string
  paymentDate: string
  dueDate: string
  notes: string
  validMonthYear: boolean
  dueDateValid: boolean
}

export interface MonthlyCostSearchRequest {
  month?: number
  year?: number
  category?: number
  costName?: string
  vendorName?: string
  isRecurring?: boolean
  isPaid?: boolean
  page?: number
  size?: number
  sortBy?: string
  sortDirection?: string
}

export interface MonthlyCostSearchResponse {
  totalElements: number
  totalPages: number
  size: number
  content: MonthlyCost[]
  number: number
  sort: {
    empty: boolean
    sorted: boolean
    unsorted: boolean
  }
  numberOfElements: number
  pageable: {
    offset: number
    sort: {
      empty: boolean
      sorted: boolean
      unsorted: boolean
    }
    paged: boolean
    pageNumber: number
    pageSize: number
    unpaged: boolean
  }
  first: boolean
  last: boolean
  empty: boolean
}

export interface MonthlyCostSummary {
  month: number
  year: number
  monthYearDisplay: string
  totalCost: number
  formattedTotalCost: string
  costByCategory: Record<string, number>
  formattedCostByCategory: Record<string, string>
  totalCostItems: number
  paidItems: number
  unpaidItems: number
  overdueItems: number
  totalPaidAmount: number
  totalUnpaidAmount: number
  topCategories: {
    categoryCode: number
    categoryName: string
    amount: number
    formattedAmount: string
    percentage: number
    itemCount: number
  }[]
  monthlyTrend: {
    month: number
    monthName: string
    amount: number
    formattedAmount: string
  }[]
}

export interface MonthlyCostTrend {
  month: number
  monthName: string
  amount: number
  formattedAmount: string
}

export interface MonthlyCostBreakdown {
  categoryCode: number
  categoryName: string
  amount: number
  formattedAmount: string
  percentage: number
  itemCount: number
}