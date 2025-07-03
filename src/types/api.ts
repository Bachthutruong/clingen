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

// Patient DTO
export interface PatientInfoDTO {
  id?: number
  fullName: string // Họ tên bệnh nhân
  birthYear: string // Năm sinh - date format
  gender: number // Giới tính: 0 nữ, 1 nam, 2 khác
  address?: string // Địa chỉ nơi cư trú
  phoneNumber: string // Số điện thoại liên hệ
  reasonForVisit?: string // Lý do đến khám
  referralSourceId?: number // Nguồn đến (ví dụ: tự đến, giới thiệu, chuyển viện) - int64
  email?: string // Địa chỉ email
  guardianName?: string // Tên người bảo lãnh
  guardianRelationship?: string // Quan hệ với người bệnh (ví dụ: cha, mẹ, anh chị em)
  guardianPhoneNumber?: string // Số điện thoại của người bảo lãnh
  typeTests: PatientTestDTO[] // Danh sách dịch vụ xét nghiệm
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

// Inventory Log DTO
export interface InventoryLogItemDTO {
  type: number // Loại hàng hóa: 1 - hóa chất, 2 - vật tư - int32
  materialId: number // ID của vật tư hoặc hóa chất - int64
  quantity: number // Số lượng xuất / nhập - int64
  expiryDate?: string // Hạn sử dụng - date format
}

export interface InventoryLogsDTO {
  logType: number // Loại log: 1 - nhập kho, 2 - xuất kho - int32
  items: InventoryLogItemDTO[]
  note?: string // Ghi chú
}

// Create/Update Request types
export interface CreateTestTypeRequest {
  name: string
  code: string
  description?: string
  price: number
  status: number
  testSampleIds: number[]
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
  logType: number
  items: InventoryLogItemDTO[]
  note?: string
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