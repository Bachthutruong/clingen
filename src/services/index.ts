// Export all API services
export {
  authApi,
  packagingApi,
  testTypesApi,
  testSamplesApi,
  referralSourcesApi,
  patientsApi,
  patientSamplesApi,
  registrationsApi,
  testServicesApi,
  testCategoriesApi,
  reportsApi,
  default as api
} from './api'

import api from './api'
import type { 
  InventoryItem,
  InventoryLog,
  InventorySearchRequest,
  InventoryLogSearchRequest,
  InventoryCreateRequest,
  InventoryLogCreateRequest,
  PaginatedResponse
} from '@/types/api'

// Re-export types for convenience
export type {
  Packaging,
  TestType,
  TestSample,
  ReferralSourceAPI,
  PatientAPI,
  PaginatedResponse,
  PackagingSearchParams,
  TestTypeSearchParams,
  ReferralSourceSearchParams,
  PatientSearchParams,
  InventoryItem,
  InventoryLog,
  InventorySearchRequest,
  InventoryLogSearchRequest,
  InventoryCreateRequest,
  InventoryLogCreateRequest
} from '@/types/api'

export type {
  Patient,
  Registration,
  ReferralSource,
  TestService,
  TestCategory,
  TestResult
} from '@/types/patient'

export type {
  User,
  AuthResponse,
  LoginCredentials,
  RegisterData,
  UserRole
} from '@/types/auth'

// Inventory API
export const inventoryApi = {
  // Get all inventory items
  getAll: (params?: InventorySearchRequest): Promise<PaginatedResponse<InventoryItem>> =>
    api.get('/inventory', { params }),

  // Get inventory item by ID
  getById: (id: number): Promise<InventoryItem> =>
    api.get(`/inventory/${id}`),

  // Search inventory items
  search: (searchRequest: InventorySearchRequest): Promise<PaginatedResponse<InventoryItem>> =>
    api.post('/inventory/search', searchRequest),

  // Create new inventory item
  create: (data: InventoryCreateRequest): Promise<InventoryItem> =>
    api.post('/inventory', data),

  // Update inventory item
  update: (id: number, data: Partial<InventoryCreateRequest>): Promise<InventoryItem> =>
    api.put(`/inventory/${id}`, data),

  // Delete inventory item
  delete: (id: number): Promise<void> =>
    api.delete(`/inventory/${id}`)
}

// Inventory Logs API
export const inventoryLogsApi = {
  // Get all inventory logs
  getAll: (params?: InventoryLogSearchRequest): Promise<PaginatedResponse<InventoryLog>> =>
    api.get('/inventory/logs', { params }),

  // Get inventory log by ID
  getById: (id: number): Promise<InventoryLog> =>
    api.get(`/inventory/logs/${id}`),

  // Search inventory logs
  search: (searchRequest: InventoryLogSearchRequest): Promise<PaginatedResponse<InventoryLog>> =>
    api.post('/inventory/logs/search', searchRequest),

  // Create new inventory log (nhập/xuất kho)
  create: (data: InventoryLogCreateRequest): Promise<InventoryLog> =>
    api.post('/inventory/logs', data),

  // Update inventory log
  update: (id: number, data: Partial<InventoryLogCreateRequest>): Promise<InventoryLog> =>
    api.put(`/inventory/logs/${id}`, data),

  // Delete inventory log
  delete: (id: number): Promise<void> =>
    api.delete(`/inventory/logs/${id}`)
} 