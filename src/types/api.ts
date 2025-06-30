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
  materialType?: number
}

export interface InventoryLogsSearchDTO extends SearchDTO {
  logType?: number
  fromDate?: string
  toDate?: string
}

// Test Price Config DTO
export interface TestPriceConfigDTO {
  quantityRangeId?: number
  minQuantity: number
  maxQuantity: number
  price: number
}

// Test Type DTO
export interface TestType {
  id?: number
  name: string
  code: string
  description?: string
  price: number
  status: number // 0: inactive, 1: active
  testSampleIds: number[]
}

export interface CreateTestTypeRequest {
  name: string
  code: string
  description?: string
  price: number
  status: number
  testSampleIds: number[]
}

// Test Sample DTO
export interface TestSample {
  id?: number
  name: string
}

export interface CreateTestSampleRequest {
  name: string
}

// Referral Source DTO
export interface ReferralSourceAPI {
  id?: number
  name: string
  code: string
  priceConfigs: TestPriceConfigDTO[]
  status: number
}

export interface ReferralSourceTestTypeDTO {
  testTypeId: number
  testPriceConfigs: TestPriceConfigDTO[]
}

export interface CreateReferralSourceRequest {
  name: string
  code: string
  priceConfigs: TestPriceConfigDTO[]
  status: number
}

// Patient DTO
export interface PatientAPI {
  id?: number
  fullName: string
  birthYear: string // date format
  gender: number // 0: male, 1: female, 2: other
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

export interface PatientTestDTO {
  testId: number
  testSampleId: number
  testSampleName?: string
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

// Packaging DTO
export interface Packaging {
  id?: number
  name: string
  code: string
  quantity: number
  status: number
}

export interface CreatePackagingRequest {
  name: string
  code: string
  quantity: number
  status: number
}

// Material DTO (Vật tư / hoá chất)
export interface Material {
  id?: number
  name: string
  code: string
  quantity: number
  packagingId: number
  importTime: string // date-time
  expiryTime?: string // date-time
  type: number // material type
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

// Inventory Log DTO
export interface InventoryLogItemDTO {
  type: number
  materialId: number
  quantity: number
  expiryDate?: string
}

export interface InventoryLogsDTO {
  logType: number
  items: InventoryLogItemDTO[]
  note?: string
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

// Enums for status values
export enum Status {
  INACTIVE = 0,
  ACTIVE = 1
}

export enum Gender {
  MALE = 0,
  FEMALE = 1,
  OTHER = 2
}

export enum MaterialType {
  REAGENT = 0,
  EQUIPMENT = 1,
  CONSUMABLE = 2,
  CHEMICAL = 3,
  OTHER = 4
}

export enum InventoryLogType {
  IMPORT = 0,
  EXPORT = 1,
  ADJUSTMENT = 2,
  EXPIRED = 3
}

// Helper functions
export function getStatusLabel(status: number): string {
  return status === 1 ? 'Hoạt động' : 'Không hoạt động'
}

export function getGenderLabel(gender: number): string {
  switch (gender) {
    case 0: return 'Nam'
    case 1: return 'Nữ'
    case 2: return 'Khác'
    default: return 'Không xác định'
  }
}

export function getMaterialTypeLabel(type: number): string {
  switch (type) {
    case 0: return 'Thuốc thử'
    case 1: return 'Thiết bị'
    case 2: return 'Vật tư tiêu hao'
    case 3: return 'Hóa chất'
    case 4: return 'Khác'
    default: return 'Không xác định'
  }
}

export function getInventoryLogTypeLabel(logType: number): string {
  switch (logType) {
    case 0: return 'Nhập kho'
    case 1: return 'Xuất kho'
    case 2: return 'Điều chỉnh'
    case 3: return 'Hết hạn'
    default: return 'Không xác định'
  }
} 