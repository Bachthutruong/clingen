import axios, { type AxiosInstance, type AxiosResponse } from 'axios'
import type { 
  LoginResponse, 
  LoginCredentials, 
  RegisterData,
  RefreshTokenRequest,
  RefreshTokenResponse,
  LogoutRequest,
  ChangePasswordRequest,
  ChangePasswordResponse,
  GetUserInfoResponse,
  User
} from '@/types/auth'
// import type { 
//   Patient, 
//   Registration, 
//   ReferralSource, 
//   TestService, 
//   TestCategory,
//   TestResult 
// } from '@/types/patient'
import type {
  TestType,
  TestSample,
  ReferralSourceAPI,
  PatientAPI,
  Packaging,
  Material,
  InventoryLogsDTO,
  MethodResult,
  PaginatedResponse,
  SearchDTO,
  PatientTestSearchDTO,
  InventorySearchDTO,
  InventoryLogsSearchDTO,
  CreateTestTypeRequest,
  CreateTestSampleRequest,
  CreateReferralSourceRequest,
  CreatePatientRequest,
  CreatePackagingRequest,
  CreateMaterialRequest,
  CreateInventoryLogRequest,
  PackagingSearchParams,
  TestTypeSearchParams,
  ReferralSourceSearchParams,
  PatientSearchParams
} from '@/types/api'
import {
  transformToPaginatedResponse
} from '@/types/api'
import { config } from '@/config'
import { mapRoleCodeToRole } from '@/lib/utils'

// Tạo axios instance với base configuration
const api: AxiosInstance = axios.create({
  baseURL: config.API_BASE_URL,
  timeout: config.API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Interceptor để tự động thêm token vào headers
api.interceptors.request.use(
  (requestConfig) => {
    const token = localStorage.getItem(config.TOKEN_STORAGE_KEY)
    if (token) {
      requestConfig.headers.Authorization = `Bearer ${token}`
    }
    
    // Debug logging for revenue API calls
    if (requestConfig.url?.includes('/revenue')) {
      console.log('Revenue API request:', {
        method: requestConfig.method,
        url: requestConfig.url,
        baseURL: requestConfig.baseURL,
        params: requestConfig.params,
        headers: requestConfig.headers
      })
    }
    
    return requestConfig
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Interceptor để handle response errors
api.interceptors.response.use(
  (response) => {
    // Debug logging for revenue API responses
    if (response.config.url?.includes('/revenue')) {
      console.log('Revenue API response interceptor:', {
        status: response.status,
        statusText: response.statusText,
        data: response.data,
        headers: response.headers
      })
    }
    return response
  },
  async (error) => {
    const originalRequest = error.config

    // Debug logging for revenue API errors
    if (error.config?.url?.includes('/revenue')) {
      console.log('Revenue API error interceptor:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        config: error.config
      })
    }
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        // Try to refresh token
        const refreshToken = localStorage.getItem(config.REFRESH_TOKEN_STORAGE_KEY)
        if (refreshToken) {
          const response = await authApi.refresh({ refreshToken })
          
          // Update tokens in localStorage
          localStorage.setItem(config.TOKEN_STORAGE_KEY, response.token)
          localStorage.setItem(config.REFRESH_TOKEN_STORAGE_KEY, response.refreshToken)
          
          // Update Authorization header for future requests and the current retry
          try {
            // Set axios default header
            (api.defaults.headers as any).common = (api.defaults.headers as any).common || {}
            ;(api.defaults.headers as any).common['Authorization'] = `Bearer ${response.token}`
          } catch (_) {}

          // Ensure header exists on the original request regardless of axios version
          originalRequest.headers = originalRequest.headers || {}
          originalRequest.headers['Authorization'] = `Bearer ${response.token}`
          
          // Retry the original request
          return api(originalRequest)
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError)
        // Clear all auth data and redirect to login
        localStorage.removeItem(config.TOKEN_STORAGE_KEY)
        localStorage.removeItem(config.REFRESH_TOKEN_STORAGE_KEY)
        localStorage.removeItem(config.USER_STORAGE_KEY)
        window.location.href = '/login'
      }
    }
    
    return Promise.reject(error)
  }
)

// Helper: map backend roleCode to app role
const mapRole = (roleCode: number): User['role'] => {
  return mapRoleCodeToRole(roleCode) as User['role']
}

// Auth API
export const authApi = {
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    const response = await api.post('/auth/login', credentials)
    const payload = response?.data?.data ?? response.data

    const user: User = {
      id: payload?.username ?? 'unknown',
      username: payload?.username ?? '',
      email: payload?.email ?? '',
      name: payload?.username ?? '',
      roleCode: payload?.roleCode ?? 1,
      roleName: payload?.roleName ?? 'ADMIN',
      role: mapRole(payload?.roleCode ?? 1),
      avatar: undefined,
      phone: undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    return {
      user,
      token: payload?.token,
      refreshToken: payload?.refreshToken
    }
  },

  register: async (userData: RegisterData): Promise<LoginResponse> => {
    const response = await api.post('/auth/register', userData)
    const payload = response?.data?.data ?? response.data

    const user: User = {
      id: payload?.username ?? 'unknown',
      username: payload?.username ?? '',
      email: payload?.email ?? '',
      name: payload?.username ?? '',
      roleCode: payload?.roleCode ?? 1,
      roleName: payload?.roleName ?? 'ADMIN',
      role: mapRole(payload?.roleCode ?? 1),
      avatar: undefined,
      phone: undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    return {
      user,
      token: payload?.token,
      refreshToken: payload?.refreshToken
    }
  },

  refresh: async (request: RefreshTokenRequest): Promise<RefreshTokenResponse> => {
    const response = await api.post('/auth/refresh', request)
    const payload = response?.data?.data ?? response.data
    return {
      token: payload?.token,
      refreshToken: payload?.refreshToken
    }
  },

  logout: async (request: LogoutRequest): Promise<void> => {
    try {
      await api.post('/auth/logout', request)
    } catch (_) {
      // ignore
    }
  },

  changePassword: async (request: ChangePasswordRequest): Promise<ChangePasswordResponse> => {
    const response = await api.post('/auth/change-password', request)
    const payload = response?.data?.data ?? response.data
    return payload ?? { success: true, message: 'OK' }
  },

  getUserInfo: async (): Promise<GetUserInfoResponse> => {
    const response = await api.get('/auth/me')
    const payload = response?.data?.data ?? response.data

    const user: User = {
      id: payload?.id?.toString?.() ?? payload?.username ?? 'unknown',
      username: payload?.username ?? '',
      email: payload?.email ?? '',
      name: payload?.name ?? payload?.username ?? '',
      roleCode: payload?.roleCode ?? 1,
      roleName: payload?.roleName ?? 'ADMIN',
      role: mapRole(payload?.roleCode ?? 1),
      avatar: payload?.avatar,
      phone: payload?.phone,
      createdAt: payload?.createdAt ?? new Date().toISOString(),
      updatedAt: payload?.updatedAt ?? new Date().toISOString()
    }

    return { user }
  },

  forgotPassword: async (email: string): Promise<void> => {
    await api.post('/auth/forgot-password', { email })
  },
}

// Packaging API
export const packagingApi = {
  getAll: async (params?: PackagingSearchParams): Promise<PaginatedResponse<Packaging>> => {
    try {
      const searchParams: SearchDTO = {
        keyword: params?.keyword,
        status: params?.status,
        pageIndex: params?.pageIndex || 0,
        pageSize: params?.pageSize || 20,
        orderCol: params?.orderCol,
        isDesc: params?.isDesc
      }
      
      const response: AxiosResponse<MethodResult<any>> = await api.post('/packing/search', searchParams)
      
      // API trả về dữ liệu pagination trong response.data.data
      const paginationData = response.data.data
      
      return {
        content: paginationData.content || [],
        totalElements: paginationData.totalElements || 0,
        totalPages: paginationData.totalPages || 0,
        size: paginationData.size || searchParams.pageSize,
        number: paginationData.number || searchParams.pageIndex,
        first: paginationData.first || false,
        last: paginationData.last || false,
        numberOfElements: paginationData.numberOfElements || 0
      }
    } catch (error) {
      // Fallback to GET method if POST search fails
      console.warn('POST /packing/search failed, trying GET /packing as fallback:', error)
      try {
        const response: AxiosResponse<MethodResult<Packaging[]>> = await api.get('/packing', {
          params: {
            keyword: params?.keyword,
            page: params?.pageIndex || 0,
            size: params?.pageSize || 20,
            status: params?.status
          }
        })
        return transformToPaginatedResponse(response.data, params?.pageIndex || 0, params?.pageSize || 20)
      } catch (fallbackError) {
        console.error('Both POST and GET packing endpoints failed:', fallbackError)
        // Return empty result instead of throwing
        return {
          content: [],
          totalElements: 0,
          totalPages: 0,
          size: params?.pageSize || 20,
          number: params?.pageIndex || 0,
          first: true,
          last: true,
          numberOfElements: 0
        }
      }
    }
  },

  getById: async (id: number): Promise<Packaging> => {
    const response: AxiosResponse<MethodResult<Packaging>> = await api.get(`/packing/${id}`)
    return response.data.data
  },

  create: async (data: CreatePackagingRequest): Promise<Packaging> => {
    const response: AxiosResponse<MethodResult<Packaging>> = await api.post('/packing', data)
    return response.data.data
  },

  update: async (id: number, data: Partial<CreatePackagingRequest>): Promise<Packaging> => {
    const response: AxiosResponse<MethodResult<Packaging>> = await api.put(`/packing/${id}`, data)
    return response.data.data
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/packing/${id}`)
  },
}

// Test Types API
export const testTypesApi = {
  getAll: async (params?: TestTypeSearchParams): Promise<PaginatedResponse<TestType>> => {
    const searchParams: SearchDTO = {
      keyword: params?.keyword,
      status: params?.status,
      pageIndex: params?.pageIndex || 0,
      pageSize: params?.pageSize || 20,
      orderCol: params?.orderCol,
      isDesc: params?.isDesc
    }
    
    const response: AxiosResponse<MethodResult<TestType[]>> = await api.post('/test-type/search', searchParams)
    return transformToPaginatedResponse(response.data, searchParams.pageIndex, searchParams.pageSize)
  },

  // GET /test-type - Lấy tất cả test types đơn giản (không phân trang)
  getAllSimple: async (): Promise<TestType[]> => {
    const response: AxiosResponse<MethodResult<TestType[]>> = await api.get('/test-type')
    return response.data.data || []
  },

  getById: async (id: number): Promise<TestType> => {
    const response: AxiosResponse<MethodResult<TestType>> = await api.get(`/test-type/${id}`)
    return response.data.data
  },

  create: async (data: CreateTestTypeRequest): Promise<TestType> => {
    const response: AxiosResponse<MethodResult<TestType>> = await api.post('/test-type', data)
    return response.data.data
  },

  update: async (id: number, data: Partial<CreateTestTypeRequest>): Promise<TestType> => {
    const response: AxiosResponse<MethodResult<TestType>> = await api.put(`/test-type/${id}`, data)
    return response.data.data
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/test-type/${id}`)
  },

  // Quản lý mẫu xét nghiệm cho loại xét nghiệm
  addSampleToTestType: async (testTypeId: number, sampleId: number): Promise<void> => {
    await api.post(`/test-type/${testTypeId}/samples/${sampleId}`)
  },

  removeSampleFromTestType: async (testTypeId: number, sampleId: number): Promise<void> => {
    await api.delete(`/test-type/${testTypeId}/samples/${sampleId}`)
  },
}

// Test Samples API
export const testSamplesApi = {
  getAll: async (params?: SearchDTO): Promise<PaginatedResponse<TestSample>> => {
    const searchParams: SearchDTO = {
      keyword: params?.keyword,
      status: params?.status,
      pageIndex: params?.pageIndex || 0,
      pageSize: params?.pageSize || 20,
      orderCol: params?.orderCol,
      isDesc: params?.isDesc
    }
    
    const response: AxiosResponse<MethodResult<TestSample[]>> = await api.post('/test-sample/search', searchParams)
    return transformToPaginatedResponse(response.data, searchParams.pageIndex, searchParams.pageSize)
  },

  // GET /test-sample - Lấy tất cả test samples đơn giản
  getAllSimple: async (): Promise<TestSample[]> => {
    const response: AxiosResponse<MethodResult<any[]>> = await api.get('/test-sample')
    // Transform response từ { id, sampleName } sang { id, name } để tương thích
    const transformedData = response.data.data.map((item: any) => ({
      id: item.id,
      name: item.sampleName
    }))
    return transformedData
  },

  getById: async (id: number): Promise<TestSample> => {
    const response: AxiosResponse<MethodResult<TestSample>> = await api.get(`/test-sample/${id}`)
    return response.data.data
  },

  create: async (data: CreateTestSampleRequest): Promise<TestSample> => {
    const response: AxiosResponse<MethodResult<TestSample>> = await api.post('/test-sample', data)
    return response.data.data
  },

  update: async (id: number, data: Partial<CreateTestSampleRequest>): Promise<TestSample> => {
    const response: AxiosResponse<MethodResult<TestSample>> = await api.put(`/test-sample/${id}`, data)
    return response.data.data
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/test-sample/${id}`)
  },
}

// Referral Sources API
export const referralSourcesApi = {
  getAll: async (params?: ReferralSourceSearchParams): Promise<PaginatedResponse<ReferralSourceAPI>> => {
    const searchParams: SearchDTO = {
      keyword: params?.keyword,
      status: params?.status,
      pageIndex: params?.pageIndex || 0,
      pageSize: params?.pageSize || 20,
      orderCol: params?.orderCol,
      isDesc: params?.isDesc
    }
    
    const response: AxiosResponse<MethodResult<ReferralSourceAPI[]>> = await api.post('/referral-source/search', searchParams)
    return transformToPaginatedResponse(response.data, searchParams.pageIndex, searchParams.pageSize)
  },

  getById: async (id: number): Promise<ReferralSourceAPI> => {
    const response: AxiosResponse<MethodResult<ReferralSourceAPI>> = await api.get(`/referral-source/${id}`)
    return response.data.data
  },

  create: async (data: CreateReferralSourceRequest): Promise<ReferralSourceAPI> => {
    const response: AxiosResponse<MethodResult<ReferralSourceAPI>> = await api.post('/referral-source', data)
    return response.data.data
  },

  update: async (id: number, data: Partial<CreateReferralSourceRequest>): Promise<ReferralSourceAPI> => {
    const response: AxiosResponse<MethodResult<ReferralSourceAPI>> = await api.put(`/referral-source/${id}`, data)
    return response.data.data
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/referral-source/${id}`)
  },
}

// Patients API
export const patientsApi = {
  // POST /patient/search - Tìm kiếm bệnh nhân với phân trang
  getAll: async (params?: PatientSearchParams): Promise<PaginatedResponse<PatientAPI>> => {
    const searchParams: SearchDTO = {
      keyword: params?.keyword,
      status: params?.status,
      pageIndex: params?.pageIndex || 0,
      pageSize: params?.pageSize || 20,
      orderCol: params?.orderCol,
      isDesc: params?.isDesc
    }
    
    const response: AxiosResponse<MethodResult<any>> = await api.post('/patient/search', searchParams)
    
    // API trả về dữ liệu pagination trong response.data.data
    const paginationData = response.data.data
    
    return {
      content: paginationData.content || [],
      totalElements: paginationData.totalElements || 0,
      totalPages: paginationData.totalPages || 0,
      size: paginationData.size || searchParams.pageSize,
      number: paginationData.number || searchParams.pageIndex,
      first: paginationData.first || false,
      last: paginationData.last || false,
      numberOfElements: paginationData.numberOfElements || 0
    }
  },

  // GET /patient - Lấy tất cả bệnh nhân (không phân trang)
  getAllWithoutPaging: async (): Promise<PatientAPI[]> => {
    const response: AxiosResponse<MethodResult<PatientAPI[]>> = await api.get('/patient')
    return response.data.data || []
  },

  // GET /patient/{id} - Lấy thông tin bệnh nhân theo ID
  getById: async (id: number): Promise<PatientAPI> => {
    const response: AxiosResponse<MethodResult<PatientAPI>> = await api.get(`/patient/${id}`)
    return response.data.data
  },

  // POST /patient - Tạo bệnh nhân mới
  create: async (patientData: CreatePatientRequest): Promise<PatientAPI> => {
    const response: AxiosResponse<MethodResult<PatientAPI>> = await api.post('/patient', patientData)
    return response.data.data
  },

  // PUT /patient/{id} - Cập nhật thông tin bệnh nhân
  update: async (id: number, patientData: Partial<CreatePatientRequest>): Promise<PatientAPI> => {
    const response: AxiosResponse<MethodResult<PatientAPI>> = await api.put(`/patient/${id}`, patientData)
    return response.data.data
  },

  // DELETE /patient/{id} - Xóa bệnh nhân
  delete: async (id: number): Promise<void> => {
    await api.delete(`/patient/${id}`)
  },

  // GET /patient/{id}/history - Lấy lịch sử xét nghiệm của bệnh nhân
  getHistory: async (id: number): Promise<any[]> => {
    const response: AxiosResponse<MethodResult<any[]>> = await api.get(`/patient/${id}/history`)
    return response.data.data
  },

  // GET /patient/{id}/tests - Lấy danh sách xét nghiệm của bệnh nhân
  getTests: async (id: number): Promise<any[]> => {
    const response: AxiosResponse<MethodResult<any[]>> = await api.get(`/patient/${id}/tests`)
    return response.data.data
  },

  // GET /patient/{id}/registrations - Lấy danh sách đăng ký xét nghiệm
  getRegistrations: async (id: number): Promise<any[]> => {
    const response: AxiosResponse<MethodResult<any[]>> = await api.get(`/patient/${id}/registrations`)
    return response.data.data
  },
}

// Materials API (Vật tư / hoá chất)
export const materialsApi = {
  getAll: async (params?: InventorySearchDTO): Promise<PaginatedResponse<Material>> => {
    try {
      // Prepare search parameters with defaults
      const searchParams: InventorySearchDTO = {
        keyword: params?.keyword || '',
        pageIndex: params?.pageIndex || 0,
        pageSize: params?.pageSize || 20,
        materialType: params?.materialType,
        orderCol: params?.orderCol,
        isDesc: params?.isDesc
      }
      
      const response: AxiosResponse<any> = await api.post('/material/search', searchParams)
      
      console.log('📥 Raw API response:', response.data)
      console.log('📥 Response.data properties:', {
        hasStatus: 'status' in response.data,
        statusValue: response.data.status,
        statusType: typeof response.data.status,
        hasData: 'data' in response.data,
        dataIsArray: Array.isArray(response.data.data),
        dataLength: response.data.data?.length,
        dataType: typeof response.data.data,
        dataKeys: response.data.data ? Object.keys(response.data.data) : null
      })
      
      // Handle new API response structure: { status, message, data, totalRecord }
      if (response.data && response.data.status === true) {
        console.log('✅ NEW API STRUCTURE DETECTED!')
        
        // Case 1: data is array (GET /material)
        if (Array.isArray(response.data.data)) {
          console.log('✅ Processing array data structure')
          const materials = response.data.data
          const totalRecord = response.data.totalRecord || materials.length
          const pageSize = searchParams.pageSize || 20
          const currentPage = searchParams.pageIndex || 0
          
          const result = {
            content: materials,
            totalElements: totalRecord,
            totalPages: Math.ceil(totalRecord / pageSize),
            size: pageSize,
            number: currentPage,
            first: currentPage === 0,
            last: currentPage >= Math.ceil(totalRecord / pageSize) - 1,
            numberOfElements: materials.length
          }
          
          console.log('✅ Returning array result:', result)
          return result
        }
        
        // Case 2: data is object with pagination (POST /material/search)
        if (response.data.data && typeof response.data.data === 'object' && response.data.data.content) {
          console.log('✅ Processing paginated object data structure')
          const paginationData = response.data.data
          
          console.log('📋 Pagination data details:', {
            content: paginationData.content,
            totalElements: paginationData.totalElements,
            totalPages: paginationData.totalPages,
            size: paginationData.size,
            number: paginationData.number
          })
          
          const result = {
            content: paginationData.content || [],
            totalElements: paginationData.totalElements || 0,
            totalPages: paginationData.totalPages || 0,
            size: paginationData.size || searchParams.pageSize || 20,
            number: paginationData.number || searchParams.pageIndex || 0,
            first: paginationData.first || false,
            last: paginationData.last || false,
            numberOfElements: paginationData.numberOfElements || (paginationData.content ? paginationData.content.length : 0)
          }
          
          console.log('✅ Returning paginated result:', result)
          return result
        }
        
        // Case 3: data is object but not paginated - force to array
        if (response.data.data && typeof response.data.data === 'object') {
          console.log('✅ Processing single object data structure')
          const materials = [response.data.data] // Convert single object to array
          const totalRecord = response.data.totalRecord || 1
          const pageSize = searchParams.pageSize || 20
          const currentPage = searchParams.pageIndex || 0
          
          const result = {
            content: materials,
            totalElements: totalRecord,
            totalPages: Math.ceil(totalRecord / pageSize),
            size: pageSize,
            number: currentPage,
            first: currentPage === 0,
            last: currentPage >= Math.ceil(totalRecord / pageSize) - 1,
            numberOfElements: materials.length
          }
          
          console.log('✅ Returning single object result:', result)
          return result
        }
      }
      
      // Fallback to old structure if new structure not found
      console.log('⚠️ Fallback to old structure transformation')
      console.log('⚠️ Input to transformToPaginatedResponse:', response.data)
      return transformToPaginatedResponse(response.data, searchParams.pageIndex, searchParams.pageSize)
    } catch (error) {
      // Fallback to GET method if POST search fails
      console.warn('POST /material/search failed, trying GET /material as fallback:', error)
      try {
        const response: AxiosResponse<any> = await api.get('/material', {
          params: {
            keyword: params?.keyword,
            page: params?.pageIndex || 0,
            size: params?.pageSize || 20,
            materialType: params?.materialType
          }
        })
        
        console.log('📥 GET fallback response:', response.data)
        
        // Handle new API response structure for GET as well
        if (response.data && 
            (response.data.status === true || response.data.status === 'true') && 
            Array.isArray(response.data.data)) {
          const materials = response.data.data
          const totalRecord = response.data.totalRecord || materials.length
          const pageSize = params?.pageSize || 20
          const currentPage = params?.pageIndex || 0
          
          return {
            content: materials,
            totalElements: totalRecord,
            totalPages: Math.ceil(totalRecord / pageSize),
            size: pageSize,
            number: currentPage,
            first: currentPage === 0,
            last: currentPage >= Math.ceil(totalRecord / pageSize) - 1,
            numberOfElements: materials.length
          }
        }
        
        return transformToPaginatedResponse(response.data, params?.pageIndex || 0, params?.pageSize || 20)
      } catch (fallbackError) {
        console.error('Both POST and GET material endpoints failed:', fallbackError)
        // Return empty result instead of throwing
        return {
          content: [],
          totalElements: 0,
          totalPages: 0,
          size: params?.pageSize || 20,
          number: params?.pageIndex || 0,
          first: true,
          last: true,
          numberOfElements: 0
        }
      }
    }
  },

  getById: async (id: number): Promise<Material> => {
    const response: AxiosResponse<MethodResult<Material>> = await api.get(`/material/${id}`)
    return response.data.data
  },

  create: async (data: CreateMaterialRequest): Promise<Material> => {
    const response: AxiosResponse<MethodResult<Material>> = await api.post('/material', data)
    return response.data.data
  },

  update: async (id: number, data: Partial<CreateMaterialRequest>): Promise<Material> => {
    const response: AxiosResponse<MethodResult<Material>> = await api.put(`/material/${id}`, data)
    return response.data.data
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/material/${id}`)
  },

  // Lấy vật tư theo type
  getByType: async (type: number, params?: InventorySearchDTO): Promise<PaginatedResponse<Material>> => {
    const searchParams = { ...params, materialType: type }
    const response: AxiosResponse<MethodResult<Material[]>> = await api.post('/material/search', searchParams)
    return transformToPaginatedResponse(response.data, searchParams.pageIndex, searchParams.pageSize)
  },
}

// Inventory Logs API (Quản lý kho)
// Inventory API - Updated to match new API spec
export const inventoryApi = {
  // GET /inventory/{id} - Get inventory by ID
  getById: async (id: number): Promise<any> => {
    const response: AxiosResponse<any> = await api.get(`/inventory/${id}`)
    return response.data.data || response.data
  },

  // GET /inventory - Get all inventory
  getAll: async (): Promise<any[]> => {
    const response: AxiosResponse<any> = await api.get('/inventory')
    return response.data.data || response.data
  },

  // POST /inventory/search - Search inventory with pagination
  search: async (params?: InventorySearchDTO): Promise<PaginatedResponse<any>> => {
    const searchParams: InventorySearchDTO = {
      keyword: params?.keyword,
      status: params?.status,
      pageIndex: params?.pageIndex || 0,
      pageSize: params?.pageSize || 20,
      orderCol: params?.orderCol,
      isDesc: params?.isDesc,
      materialId: params?.materialId,
      fromImportDate: params?.fromImportDate,
      toImportDate: params?.toImportDate,
      fromExpiryDate: params?.fromExpiryDate,
      toExpiryDate: params?.toExpiryDate,
      materialType: params?.materialType
    }
    
    const response: AxiosResponse<any> = await api.post('/inventory/search', searchParams)
    return transformToPaginatedResponse(response.data, searchParams.pageIndex, searchParams.pageSize)
  }
}

// Inventory Logs API - Updated to match new API spec
export const inventoryLogsApi = {
  // GET /inventory/logs/{id} - Get log by ID
  getById: async (id: number): Promise<InventoryLogsDTO> => {
    const response: AxiosResponse<any> = await api.get(`/inventory/logs/${id}`)
    return response.data.data || response.data
  },

  // PUT /inventory/logs/{id} - Update log
  update: async (id: number, data: any): Promise<InventoryLogsDTO> => {
    const response: AxiosResponse<any> = await api.put(`/inventory/logs/${id}`, data)
    return response.data.data || response.data
  },

  // DELETE /inventory/logs/{id} - Delete log
  delete: async (id: number): Promise<void> => {
    await api.delete(`/inventory/logs/${id}`)
  },

  // GET /inventory/logs - Get all logs
  getAll: async (): Promise<InventoryLogsDTO[]> => {
    const response: AxiosResponse<any> = await api.get('/inventory/logs')
    return response.data.data || response.data
  },

  // POST /inventory/logs - Create new log (logType 1 - nhập kho, 2 - xuất kho)
  create: async (data: CreateInventoryLogRequest): Promise<InventoryLogsDTO> => {
    const response: AxiosResponse<any> = await api.post('/inventory/logs', data)
    return response.data.data || response.data
  },

  // POST /inventory/logs/search - Search logs with pagination
  search: async (params?: InventoryLogsSearchDTO): Promise<PaginatedResponse<InventoryLogsDTO>> => {
    const searchParams: InventoryLogsSearchDTO = {
      keyword: params?.keyword,
      status: params?.status,
      pageIndex: params?.pageIndex || 0,
      pageSize: params?.pageSize || 20,
      orderCol: params?.orderCol,
      isDesc: params?.isDesc,
      logType: params?.logType,
      fromDate: params?.fromDate,
      toDate: params?.toDate
    }
    
    const response: AxiosResponse<any> = await api.post('/inventory/logs/search', searchParams)
    return transformToPaginatedResponse(response.data, searchParams.pageIndex, searchParams.pageSize)
  },

  // Helper methods for common operations
  // Nhập kho
  importMaterials: async (data: {
    materialId: number
    quantity: number
    expiryDate?: string
    unitPrice?: number
    amount?: number
    note?: string
  }): Promise<InventoryLogsDTO> => {
    const logData: CreateInventoryLogRequest = {
      logType: 1, // Nhập kho
      exportType: 0,
      exportId: 0,
      items: [{
        type: 0,
        materialId: data.materialId,
        quantity: data.quantity,
        expiryDate: data.expiryDate || '',
        unitPrice: data.unitPrice || 0,
        amount: data.amount || 0,
        note: data.note || ''
      }],
      note: data.note || ''
    }
    return inventoryLogsApi.create(logData)
  },

  // Xuất kho
  exportMaterials: async (data: {
    materialId: number
    quantity: number
    exportType?: number
    exportId?: number
    note?: string
  }): Promise<InventoryLogsDTO> => {
    const logData: CreateInventoryLogRequest = {
      logType: 2, // Xuất kho
      exportType: data.exportType || 0,
      exportId: data.exportId || 0,
      items: [{
        type: 0,
        materialId: data.materialId,
        quantity: data.quantity,
        expiryDate: '',
        unitPrice: 0,
        amount: 0,
        note: data.note || ''
      }],
      note: data.note || ''
    }
    return inventoryLogsApi.create(logData)
  }
}

// Patient Test Management API (Quản lý mẫu bệnh nhân)
export const patientSamplesApi = {
  getAll: async (params?: PatientTestSearchDTO): Promise<any> => {
    try {
      const searchParams: PatientTestSearchDTO = {
        keyword: params?.keyword,
        status: params?.status,
        pageIndex: params?.pageIndex || 0,
        pageSize: params?.pageSize || 20,
        orderCol: params?.orderCol,
        isDesc: params?.isDesc,
        testSampleId: params?.testSampleId,
        testTypeId: params?.testTypeId
      }
      
      console.log('API call to /patient-test/search with params:', searchParams)
      
      // Try POST /patient-test/search first
      try {
        const response: AxiosResponse<any> = await api.post('/patient-test/search', searchParams)
        console.log('POST /patient-test/search response:', response.data)
        
        // Check if response has the custom structure {status: true, data: [...]}
        if (response.data && response.data.status && Array.isArray(response.data.data)) {
          console.log('Found custom API structure with data array')
          return response.data // Return the custom structure directly
        }
        
        // Check if response has pagination structure
        if (response.data && response.data.data) {
          const paginationData = response.data.data
          return {
            content: paginationData.content || [],
            totalElements: paginationData.totalElements || 0,
            totalPages: paginationData.totalPages || 0,
            size: paginationData.size || searchParams.pageSize,
            number: paginationData.number || searchParams.pageIndex,
            first: paginationData.first || false,
            last: paginationData.last || false,
            numberOfElements: paginationData.numberOfElements || 0
          }
        }
        
        return response.data
      } catch (postError) {
        console.warn('POST /patient-test/search failed, trying GET /patient-test:', postError)
        
        // Fallback to GET /patient-test
        const getResponse: AxiosResponse<any> = await api.get('/patient-test', {
          params: {
            keyword: searchParams.keyword,
            status: searchParams.status,
            page: searchParams.pageIndex,
            size: searchParams.pageSize,
            testSampleId: searchParams.testSampleId,
            testTypeId: searchParams.testTypeId
          }
        })
        
        console.log('GET /patient-test response:', getResponse.data)
        return getResponse.data
      }
    } catch (error) {
      console.error('Error in patientSamplesApi.getAll:', error)
      // Return empty result in custom format
      return {
        status: false,
        message: 'Failed to fetch data',
        data: [],
        totalRecord: 0
      }
    }
  },

  getById: async (id: number): Promise<PatientAPI> => {
    const response: AxiosResponse<MethodResult<PatientAPI>> = await api.get(`/patient-test/${id}`)
    return response.data.data
  },

  // Cập nhật trạng thái mẫu
  updateStatus: async (id: number, status: number): Promise<PatientAPI> => {
    const response: AxiosResponse<MethodResult<PatientAPI>> = await api.put(`/patient-test/${id}/status`, { status })
    return response.data.data
  },

  // Lấy mẫu theo bệnh nhân
  getByPatient: async (patientId: number, params?: PatientTestSearchDTO): Promise<PaginatedResponse<PatientAPI>> => {
    const searchParams = { ...(params || {}), keyword: patientId.toString() }
    return patientSamplesApi.getAll(searchParams)
  },

  // Lấy mẫu theo loại xét nghiệm
  getByTestType: async (testTypeId: number, params?: PatientTestSearchDTO): Promise<PaginatedResponse<PatientAPI>> => {
    const searchParams = { ...(params || {}), testTypeId }
    return patientSamplesApi.getAll(searchParams)
  },

  // Tạo mẫu cho bệnh nhân khi đăng ký xét nghiệm
  createSamplesForPatient: async (data: {
    patientId: number
    testTypes: { testTypeId: number; selectedSampleId: number; priority?: string }[]
  }): Promise<PatientAPI> => {
    // Transform to patient test format
    const typeTests = data.testTypes.map(tt => ({
      testId: tt.testTypeId,
      testSampleId: tt.selectedSampleId
    }))

    const response: AxiosResponse<MethodResult<PatientAPI>> = await api.post('/patient-test', {
      patientId: data.patientId,
      typeTests
    })
    return response.data.data
  },

  // Dashboard - thống kê mẫu
  getDashboardStats: async (): Promise<{
    totalSamples: number
    pendingSamples: number
    collectedSamples: number
    processingSamples: number
    completedSamples: number
    rejectedSamples: number
  }> => {
    const response: AxiosResponse<MethodResult<any>> = await api.get('/patient-test/dashboard/stats')
    return response.data.data
  },
}

// Legacy APIs for compatibility
export const registrationsApi = {
  getAll: async (params?: any): Promise<any> => {
    // This would be implemented based on your registration requirements
    const response = await api.get('/registrations', { params })
    return response.data
  },
}

export const testServicesApi = {
  getAll: async (params?: any): Promise<any> => {
    const response = await api.get('/test-services', { params })
    return response.data
  },
}

export const testCategoriesApi = {
  getAll: async (params?: any): Promise<any> => {
    const response = await api.get('/test-categories', { params })
    return response.data
  },
}

export const reportsApi = {
  getAll: async (params?: any): Promise<any> => {
    const response = await api.get('/reports', { params })
    return response.data
  },
}

// Compatibility aliases
export const suppliesApi = materialsApi // Alias for backward compatibility

// Notification API - Updated to match new API spec
export const notificationApi = {
  // GET /notifications - Get user notifications with pagination
  getAll: async (params?: {
    page?: number
    size?: number
    sortBy?: string
    sortDir?: string
  }): Promise<PaginatedResponse<any>> => {
    const searchParams = {
      page: params?.page || 0,
      size: params?.size || 20,
      sortBy: params?.sortBy || 'createdAt',
      sortDir: params?.sortDir || 'desc'
    }
    
    const response: AxiosResponse<any> = await api.get('/notifications', { params: searchParams })
    
    // Handle direct pagination response
    if (response.data && response.data.content) {
      return response.data
    }
    
    // Handle MethodResult structure
    const paginationData = response.data.data || response.data
    return {
      content: paginationData.content || [],
      totalElements: paginationData.totalElements || 0,
      totalPages: paginationData.totalPages || 0,
      size: paginationData.size || searchParams.size,
      number: paginationData.number || searchParams.page,
      first: paginationData.first || false,
      last: paginationData.last || false,
      numberOfElements: paginationData.numberOfElements || 0
    }
  },

  // POST /notifications - Create and send notification
  create: async (data: any): Promise<any> => {
    const response: AxiosResponse<any> = await api.post('/notifications', data)
    return response.data.data || response.data
  },

  // GET /notifications/config - Get user notification configs
  getConfigs: async (): Promise<any[]> => {
    const response: AxiosResponse<any> = await api.get('/notifications/config')
    return response.data.data || response.data
  },

  // POST /notifications/config - Create or update notification config
  createConfig: async (config: any): Promise<any> => {
    const response: AxiosResponse<any> = await api.post('/notifications/config', config)
    return response.data.data || response.data
  },

  // POST /notifications/admin/cleanup/old/{daysOld} - Cleanup old notifications
  cleanupOld: async (daysOld: number): Promise<void> => {
    await api.post(`/notifications/admin/cleanup/old/${daysOld}`)
  },

  // POST /notifications/admin/cleanup/expired - Cleanup expired notifications
  cleanupExpired: async (): Promise<void> => {
    await api.post('/notifications/admin/cleanup/expired')
  },

  // PATCH /notifications/{id}/mark-read - Mark notification as read
  markAsRead: async (id: number): Promise<void> => {
    await api.patch(`/notifications/${id}/mark-read`)
  },

  // PATCH /notifications/mark-all-read - Mark all as read
  markAllAsRead: async (): Promise<void> => {
    await api.patch('/notifications/mark-all-read')
  },

  // GET /notifications/{id} - Get notification by ID
  getById: async (id: number): Promise<any> => {
    const response: AxiosResponse<any> = await api.get(`/notifications/${id}`)
    return response.data.data || response.data
  },

  // DELETE /notifications/{id} - Delete notification
  delete: async (id: number): Promise<void> => {
    await api.delete(`/notifications/${id}`)
  },

  // GET /notifications/unread - Get unread notifications
  getUnread: async (): Promise<any[]> => {
    const response: AxiosResponse<any> = await api.get('/notifications/unread')
    return response.data.data || response.data
  },

  // GET /notifications/unread/count - Get unread count
  getUnreadCount: async (): Promise<number> => {
    const response: AxiosResponse<any> = await api.get('/notifications/unread/count')
    return response.data.data || response.data
  },

  // GET /notifications/search/type/{type} - Search notifications by type
  searchByType: async (type: number, params?: {
    page?: number
    size?: number
  }): Promise<PaginatedResponse<any>> => {
    const searchParams = {
      page: params?.page || 0,
      size: params?.size || 20
    }
    
    const response: AxiosResponse<any> = await api.get(`/notifications/search/type/${type}`, { params: searchParams })
    
    if (response.data && response.data.content) {
      return response.data
    }
    
    const paginationData = response.data.data || response.data
    return {
      content: paginationData.content || [],
      totalElements: paginationData.totalElements || 0,
      totalPages: paginationData.totalPages || 0,
      size: paginationData.size || searchParams.size,
      number: paginationData.number || searchParams.page,
      first: paginationData.first || false,
      last: paginationData.last || false,
      numberOfElements: paginationData.numberOfElements || 0
    }
  },

  // GET /notifications/search/time-range - Search notifications by time range
  searchByTimeRange: async (startTime: string, endTime: string, params?: {
    page?: number
    size?: number
  }): Promise<PaginatedResponse<any>> => {
    const searchParams = {
      startTime,
      endTime,
      page: params?.page || 0,
      size: params?.size || 20
    }
    
    const response: AxiosResponse<any> = await api.get('/notifications/search/time-range', { params: searchParams })
    
    if (response.data && response.data.content) {
      return response.data
    }
    
    const paginationData = response.data.data || response.data
    return {
      content: paginationData.content || [],
      totalElements: paginationData.totalElements || 0,
      totalPages: paginationData.totalPages || 0,
      size: paginationData.size || searchParams.size,
      number: paginationData.number || searchParams.page,
      first: paginationData.first || false,
      last: paginationData.last || false,
      numberOfElements: paginationData.numberOfElements || 0
    }
  },

  // GET /notifications/search/priority/{minPriority} - Search notifications by priority
  searchByPriority: async (minPriority: number, params?: {
    page?: number
    size?: number
  }): Promise<PaginatedResponse<any>> => {
    const searchParams = {
      page: params?.page || 0,
      size: params?.size || 20
    }
    
    const response: AxiosResponse<any> = await api.get(`/notifications/search/priority/${minPriority}`, { params: searchParams })
    
    if (response.data && response.data.content) {
      return response.data
    }
    
    const paginationData = response.data.data || response.data
    return {
      content: paginationData.content || [],
      totalElements: paginationData.totalElements || 0,
      totalPages: paginationData.totalPages || 0,
      size: paginationData.size || searchParams.size,
      number: paginationData.number || searchParams.page,
      first: paginationData.first || false,
      last: paginationData.last || false,
      numberOfElements: paginationData.numberOfElements || 0
    }
  },

  // GET /notifications/config/type/{notificationType} - Get config by type
  getConfigByType: async (notificationType: number): Promise<any> => {
    const response: AxiosResponse<any> = await api.get(`/notifications/config/type/${notificationType}`)
    return response.data.data || response.data
  },

  // DELETE /notifications/config/type/{notificationType} - Delete config by type
  deleteConfig: async (notificationType: number): Promise<void> => {
    await api.delete(`/notifications/config/type/${notificationType}`)
  },

  // GET /notifications/admin/all - Get all notifications (Admin)
  getAllAdmin: async (params?: {
    page?: number
    size?: number
  }): Promise<any[]> => {
    const searchParams = {
      page: params?.page || 0,
      size: params?.size || 50
    }
    
    const response: AxiosResponse<any> = await api.get('/notifications/admin/all', { params: searchParams })
    return response.data.data || response.data
  },

  // DELETE /notifications/all - Delete all notifications
  deleteAll: async (): Promise<void> => {
    await api.delete('/notifications/all')
  }
}

// Enhanced Patient Test Management API
export const patientTestApi = {
  // GET /patient-test - Get all patient tests
  getAll: async (params?: any): Promise<PaginatedResponse<any>> => {
    const searchParams = {
      keyword: params?.keyword,
      status: params?.status,
      testTypeId: params?.testTypeId,
      testSampleId: params?.testSampleId,
      pageIndex: params?.pageIndex || 0,
      pageSize: params?.pageSize || 20,
      orderCol: params?.orderCol,
      isDesc: params?.isDesc
    }
    
    const response: AxiosResponse<MethodResult<any>> = await api.get('/patient-test', { params: searchParams })
    const paginationData = response.data.data
    
    return {
      content: paginationData.content || [],
      totalElements: paginationData.totalElements || 0,
      totalPages: paginationData.totalPages || 0,
      size: paginationData.size || searchParams.pageSize,
      number: paginationData.number || searchParams.pageIndex,
      first: paginationData.first || false,
      last: paginationData.last || false,
      numberOfElements: paginationData.numberOfElements || 0
    }
  },

  // POST /patient-test/search - Search patient tests
  search: async (params: any): Promise<PaginatedResponse<any>> => {
    const searchParams = {
      keyword: params.keyword,
      status: params.status,
      testTypeId: params.testTypeId,
      testSampleId: params.testSampleId,
      pageIndex: params.pageIndex || 0,
      pageSize: params.pageSize || 20,
      orderCol: params.orderCol,
      isDesc: params.isDesc
    }
    
    const response: AxiosResponse<MethodResult<any>> = await api.post('/patient-test/search', searchParams)
    const paginationData = response.data.data
    
    return {
      content: paginationData.content || [],
      totalElements: paginationData.totalElements || 0,
      totalPages: paginationData.totalPages || 0,
      size: paginationData.size || searchParams.pageSize,
      number: paginationData.number || searchParams.pageIndex,
      first: paginationData.first || false,
      last: paginationData.last || false,
      numberOfElements: paginationData.numberOfElements || 0
    }
  },

  // POST /patient-test/result/{id} - Get HTML template for test result
  getResultTemplate: async (id: number): Promise<any> => {
    const response: AxiosResponse<MethodResult<any>> = await api.post(`/patient-test/result/${id}`)
    return response.data.data
  },

  // POST /patient-test - Save new patient test
  create: async (data: any): Promise<any> => {
    const response: AxiosResponse<MethodResult<any>> = await api.post('/patient-test', data)
    return response.data.data
  },

  // PUT /patient-test/{id} - Update patient test
  update: async (id: number, data: any): Promise<any> => {
    const response: AxiosResponse<MethodResult<any>> = await api.put(`/patient-test/${id}`, data)
    return response.data.data
  },

  // PATCH /patient-test/{id}/status - Update test status
  updateStatus: async (id: number, status: any): Promise<any> => {
    const response: AxiosResponse<MethodResult<any>> = await api.patch(`/patient-test/${id}/status`, { status })
    return response.data.data
  },

  // DELETE /patient-test/{id} - Delete patient test
  delete: async (id: number): Promise<void> => {
    await api.delete(`/patient-test/${id}`)
  },

  // Get patient tests by patient ID
  getByPatient: async (patientId: number, params?: any): Promise<PaginatedResponse<any>> => {
    const searchParams = { ...(params || {}), patientId }
    return patientTestApi.search(searchParams)
  },

  // Get patient tests by test type
  getByTestType: async (testTypeId: number, params?: any): Promise<PaginatedResponse<any>> => {
    const searchParams = { ...(params || {}), testTypeId }
    return patientTestApi.search(searchParams)
  }
}

// Revenue API
export const revenueApi = {
  // POST /revenue/search - Search revenue
  search: async (params: any): Promise<PaginatedResponse<any>> => {
    const searchParams = {
      keyword: params?.keyword || undefined,
      status: params?.status || undefined,
      pageIndex: params?.pageIndex ?? 0,
      pageSize: params?.pageSize ?? 20,
      orderCol: params?.orderCol || undefined,
      isDesc: params?.isDesc ?? true,
      filterType: params?.filterType || undefined, // "MONTH", "YEAR", "RANGE"
      fromDate: params?.fromDate || undefined,
      toDate: params?.toDate || undefined,
      month: params?.month || undefined,
      year: params?.year || undefined,
      testTypeId: params?.testTypeId || undefined,
      referralSourceId: params?.referralSourceId || undefined
    }

    try {
      const response: AxiosResponse<any> = await api.post('/revenue/search', searchParams)

      // Handle structure: { status: true, data: [...] | {content, totalElements, ...}, totalRecord }
      if (response?.data?.status === true) {
        const data = response.data.data
        const totalRecord = response.data.totalRecord

        // Case A: data is array
        if (Array.isArray(data)) {
          const content = data
          const totalElements = typeof totalRecord === 'number' ? totalRecord : content.length
          const pageSize = searchParams.pageSize
          const pageIndex = searchParams.pageIndex
          return {
            content,
            totalElements,
            totalPages: Math.ceil(totalElements / pageSize),
            size: pageSize,
            number: pageIndex,
            first: pageIndex === 0,
            last: pageIndex >= Math.ceil(totalElements / pageSize) - 1,
            numberOfElements: content.length
          }
        }

        // Case B: data is object with pagination fields
        if (data && typeof data === 'object') {
          const paginationData = data
          return {
            content: paginationData.content || [],
            totalElements: paginationData.totalElements ?? response.data.totalRecord ?? 0,
            totalPages: paginationData.totalPages ?? 0,
            size: paginationData.size ?? searchParams.pageSize,
            number: paginationData.number ?? searchParams.pageIndex,
            first: paginationData.first ?? (paginationData.number === 0),
            last: paginationData.last ?? false,
            numberOfElements: paginationData.numberOfElements ?? (Array.isArray(paginationData.content) ? paginationData.content.length : 0)
          }
        }
      }

      // Legacy structure fallback: pass to transformer expecting {status,message,data}
      return transformToPaginatedResponse(response.data, searchParams.pageIndex, searchParams.pageSize)
    } catch (error) {
      console.error('Error calling POST /revenue/search:', error)
      // Return empty response on error since GET /revenue doesn't exist
        return {
          content: [],
          totalElements: 0,
          totalPages: 0,
          size: searchParams.pageSize,
          number: searchParams.pageIndex,
          first: true,
          last: true,
          numberOfElements: 0
      }
    }
  },

  // PUT /revenue/{id} - Update revenue
  update: async (id: number, data: any): Promise<any> => {
    const response: AxiosResponse<MethodResult<any>> = await api.put(`/revenue/${id}`, data)
    return response.data.data
  },

  // GET /revenue/{id} - Get revenue by ID
  getById: async (id: number): Promise<any> => {
    const response: AxiosResponse<MethodResult<any>> = await api.get(`/revenue/${id}`)
    return response.data.data
  },

  // GET /revenue - Get all revenue (redirects to search with default params)
  getAll: async (params?: any): Promise<PaginatedResponse<any>> => {
    // Since GET /revenue doesn't exist in the API spec, redirect to search with default params
    console.log('Revenue API getAll called, redirecting to search with params:', params)
    return revenueApi.search(params || {})
  }
}

// Monthly Costs API - Updated to match new API spec
export const monthlyCostsApi = {
  // GET /monthly-costs/{id} - Get cost by ID
  getById: async (id: number): Promise<any> => {
    const response: AxiosResponse<any> = await api.get(`/monthly-costs/${id}`)
    return response.data.data || response.data
  },

  // PUT /monthly-costs/{id} - Update cost
  update: async (id: number, data: any): Promise<any> => {
    const response: AxiosResponse<any> = await api.put(`/monthly-costs/${id}`, data)
    return response.data.data || response.data
  },

  // DELETE /monthly-costs/{id} - Delete cost (soft delete)
  delete: async (id: number): Promise<void> => {
    await api.delete(`/monthly-costs/${id}`)
  },

  // POST /monthly-costs - Create new cost
  create: async (data: any): Promise<any> => {
    const response: AxiosResponse<any> = await api.post('/monthly-costs', data)
    return response.data.data || response.data
  },

  // POST /monthly-costs/search - Search costs
  search: async (params: any): Promise<PaginatedResponse<any>> => {
    const searchParams = {
      month: params.month,
      year: params.year,
      category: params.category,
      costName: params.costName,
      vendorName: params.vendorName,
      isRecurring: params.isRecurring,
      isPaid: params.isPaid,
      page: params.page || 0,
      size: params.size || 20,
      sortBy: params.sortBy || 'createdAt',
      sortDirection: params.sortDirection || 'desc'
    }
    
    const response: AxiosResponse<any> = await api.post('/monthly-costs/search', searchParams)
    
    // Handle direct pagination response
    if (response.data && response.data.content) {
      return response.data
    }
    
    // Handle MethodResult structure
    const paginationData = response.data.data || response.data
    return {
      content: paginationData.content || [],
      totalElements: paginationData.totalElements || 0,
      totalPages: paginationData.totalPages || 0,
      size: paginationData.size || searchParams.size,
      number: paginationData.number || searchParams.page,
      first: paginationData.first || false,
      last: paginationData.last || false,
      numberOfElements: paginationData.numberOfElements || 0
    }
  },

  // POST /monthly-costs/recurring/generate/month/{month}/year/{year} - Generate recurring costs
  generateRecurring: async (month: number, year: number): Promise<void> => {
    await api.post(`/monthly-costs/recurring/generate/month/${month}/year/${year}`)
  },

  // POST /monthly-costs/bulk - Create multiple costs
  createBulk: async (costs: any[]): Promise<any[]> => {
    const response: AxiosResponse<any> = await api.post('/monthly-costs/bulk', costs)
    return response.data.data || response.data
  },

  // DELETE /monthly-costs/bulk - Delete multiple costs
  deleteBulk: async (ids: number[]): Promise<void> => {
    await api.delete('/monthly-costs/bulk', { data: ids })
  },

  // PATCH /monthly-costs/{id}/mark-unpaid - Mark as unpaid
  markUnpaid: async (id: number): Promise<any> => {
    const response: AxiosResponse<any> = await api.patch(`/monthly-costs/${id}/mark-unpaid`)
    return response.data.data || response.data
  },

  // PATCH /monthly-costs/{id}/mark-paid - Mark as paid
  markPaid: async (id: number): Promise<any> => {
    const response: AxiosResponse<any> = await api.patch(`/monthly-costs/${id}/mark-paid`)
    return response.data.data || response.data
  },

  // PATCH /monthly-costs/{id}/activate - Activate cost
  activate: async (id: number): Promise<void> => {
    await api.patch(`/monthly-costs/${id}/activate`)
  },

  // PATCH /monthly-costs/unlink-from-revenue - Unlink costs from revenue
  unlinkFromRevenue: async (ids: number[]): Promise<void> => {
    await api.patch('/monthly-costs/unlink-from-revenue', ids)
  },

  // PATCH /monthly-costs/mark-multiple-paid - Mark multiple as paid
  markMultiplePaid: async (ids: number[]): Promise<any[]> => {
    const response: AxiosResponse<any> = await api.patch('/monthly-costs/mark-multiple-paid', ids)
    return response.data.data || response.data
  },

  // PATCH /monthly-costs/link-to-revenue/{revenueId} - Link costs to revenue
  linkToRevenue: async (revenueId: number, ids: number[]): Promise<void> => {
    await api.patch(`/monthly-costs/link-to-revenue/${revenueId}`, ids)
  },

  // GET /monthly-costs/validate/invoice-number - Validate invoice number
  validateInvoiceNumber: async (invoiceNumber: string): Promise<boolean> => {
    const response: AxiosResponse<any> = await api.get('/monthly-costs/validate/invoice-number', {
      params: { invoiceNumber }
    })
    return response.data.data || response.data
  },

  // GET /monthly-costs/validate/cost-name - Validate cost name
  validateCostName: async (month: number, year: number, category: number, costName: string): Promise<boolean> => {
    const response: AxiosResponse<any> = await api.get('/monthly-costs/validate/cost-name', {
      params: { month, year, category, costName }
    })
    return response.data.data || response.data
  },

  // GET /monthly-costs/unpaid - Get unpaid costs
  getUnpaid: async (): Promise<any[]> => {
    const response: AxiosResponse<any> = await api.get('/monthly-costs/unpaid')
    return response.data.data || response.data
  },

  // GET /monthly-costs/unlinked - Get unlinked costs
  getUnlinked: async (): Promise<any[]> => {
    const response: AxiosResponse<any> = await api.get('/monthly-costs/unlinked')
    return response.data.data || response.data
  },

  // GET /monthly-costs/trend/year/{year} - Get cost trend by year
  getTrendByYear: async (year: number): Promise<any[]> => {
    const response: AxiosResponse<any> = await api.get(`/monthly-costs/trend/year/${year}`)
    return response.data.data || response.data
  },

  // GET /monthly-costs/total/year/{year} - Get total cost by year
  getTotalByYear: async (year: number): Promise<number> => {
    const response: AxiosResponse<any> = await api.get(`/monthly-costs/total/year/${year}`)
    return response.data.data || response.data
  },

  // GET /monthly-costs/total/month/{month}/year/{year} - Get total cost by month
  getTotalByMonth: async (month: number, year: number): Promise<number> => {
    const response: AxiosResponse<any> = await api.get(`/monthly-costs/total/month/${month}/year/${year}`)
    return response.data.data || response.data
  },

  // GET /monthly-costs/total/month/{month}/year/{year}/category/{category} - Get total by category
  getTotalByMonthCategory: async (month: number, year: number, category: number): Promise<number> => {
    const response: AxiosResponse<any> = await api.get(`/monthly-costs/total/month/${month}/year/${year}/category/${category}`)
    return response.data.data || response.data
  },

  // GET /monthly-costs/summary/year/{year} - Get summary by year
  getSummaryByYear: async (year: number): Promise<any> => {
    const response: AxiosResponse<any> = await api.get(`/monthly-costs/summary/year/${year}`)
    return response.data.data || response.data
  },

  // GET /monthly-costs/summary/month/{month}/year/{year} - Get summary by month
  getSummaryByMonth: async (month: number, year: number): Promise<any> => {
    const response: AxiosResponse<any> = await api.get(`/monthly-costs/summary/month/${month}/year/${year}`)
    return response.data.data || response.data
  },

  // GET /monthly-costs/revenue/{revenueId} - Get costs by revenue ID
  getByRevenue: async (revenueId: number): Promise<any[]> => {
    const response: AxiosResponse<any> = await api.get(`/monthly-costs/revenue/${revenueId}`)
    return response.data.data || response.data
  },

  // GET /monthly-costs/recurring - Get recurring costs
  getRecurring: async (): Promise<any[]> => {
    const response: AxiosResponse<any> = await api.get('/monthly-costs/recurring')
    return response.data.data || response.data
  },

  // GET /monthly-costs/recurring/preview/month/{month}/year/{year} - Preview recurring costs
  previewRecurring: async (month: number, year: number): Promise<any[]> => {
    const response: AxiosResponse<any> = await api.get(`/monthly-costs/recurring/preview/month/${month}/year/${year}`)
    return response.data.data || response.data
  },

  // GET /monthly-costs/overdue - Get overdue costs
  getOverdue: async (): Promise<any[]> => {
    const response: AxiosResponse<any> = await api.get('/monthly-costs/overdue')
    return response.data.data || response.data
  },

  // GET /monthly-costs/month/{month}/year/{year} - Get costs by month/year
  getByMonthYear: async (month: number, year: number): Promise<any[]> => {
    const response: AxiosResponse<any> = await api.get(`/monthly-costs/month/${month}/year/${year}`)
    return response.data.data || response.data
  },

  // GET /monthly-costs/export/excel/summary/year/{year} - Export summary to Excel
  exportSummaryToExcel: async (year: number): Promise<string> => {
    const response: AxiosResponse<any> = await api.get(`/monthly-costs/export/excel/summary/year/${year}`)
    return response.data.data || response.data
  },

  // GET /monthly-costs/export/excel/month/{month}/year/{year} - Export month to Excel
  exportMonthToExcel: async (month: number, year: number): Promise<string> => {
    const response: AxiosResponse<any> = await api.get(`/monthly-costs/export/excel/month/${month}/year/${year}`)
    return response.data.data || response.data
  },

  // GET /monthly-costs/category/{category} - Get costs by category
  getByCategory: async (category: number): Promise<any[]> => {
    const response: AxiosResponse<any> = await api.get(`/monthly-costs/category/${category}`)
    return response.data.data || response.data
  },

  // GET /monthly-costs/breakdown/month/{month}/year/{year} - Get breakdown by month
  getBreakdownByMonth: async (month: number, year: number): Promise<any[]> => {
    const response: AxiosResponse<any> = await api.get(`/monthly-costs/breakdown/month/${month}/year/${year}`)
    return response.data.data || response.data
  }
}

// Users Management API
// User System API - Updated to match new API spec
export const usersApi = {
  // GET /api/users/{username} - Get user by username
  getByUsername: async (username: string): Promise<any> => {
    try {
      const response: AxiosResponse<any> = await api.get(`/api/users/${username}`)
      return response.data.data || response.data
    } catch (error: any) {
      console.error(`Error calling getByUsername API with username ${username}:`, error)
      throw error
    }
  },

  // PUT /api/users/{username} - Update user
  updateByUsername: async (username: string, userData: {
    fullName: string
    roleCode: number
  }): Promise<any> => {
    try {
      const response: AxiosResponse<any> = await api.put(`/api/users/${username}`, userData)
      return response.data.data || response.data
    } catch (error: any) {
      console.error(`Error calling updateByUsername API with username ${username}:`, error)
      throw error
    }
  },

  // DELETE /api/users/{username} - Delete user
  deleteByUsername: async (username: string): Promise<void> => {
    try {
      await api.delete(`/api/users/${username}`)
    } catch (error: any) {
      console.error(`Error calling deleteByUsername API with username ${username}:`, error)
      throw error
    }
  },

  // POST /api/users - Create new user
  create: async (userData: {
    username: string
    password: string
    fullName: string
    roleCode: number
  }): Promise<any> => {
    try {
      const response: AxiosResponse<any> = await api.post('/api/users', userData)
      return response.data.data || response.data
    } catch (error: any) {
      console.error('Error calling create API:', error)
      throw error
    }
  },

  // PATCH /api/users/{username}/password - Change user password
  changePassword: async (username: string, passwordData: {
    oldPassword: string
    newPassword: string
  }): Promise<void> => {
    try {
      await api.patch(`/api/users/${username}/password`, passwordData)
    } catch (error: any) {
      console.error(`Error calling changePassword API with username ${username}:`, error)
      throw error
    }
  },

  // Legacy methods for backward compatibility
  // GET /users - Get all users with pagination and filters
  getUsers: async (params?: {
    page?: number
    size?: number
    search?: string
    role?: string
    status?: string
  }): Promise<PaginatedResponse<any>> => {
    try {
      const response: AxiosResponse<MethodResult<PaginatedResponse<any>>> = await api.get('/users', { params })
      return response.data.data
    } catch (error: any) {
      console.error('Error calling getUsers API:', error)
      throw error
    }
  },

  // GET /users/{id} - Get user by ID
  getUserById: async (id: string): Promise<any> => {
    try {
      const response: AxiosResponse<MethodResult<any>> = await api.get(`/users/${id}`)
      return response.data.data
    } catch (error: any) {
      console.error(`Error calling getUserById API with id ${id}:`, error)
      throw error
    }
  },

  // POST /users - Create new user
  createUser: async (userData: any): Promise<any> => {
    try {
      const response: AxiosResponse<MethodResult<any>> = await api.post('/users', userData)
      return response.data.data
    } catch (error: any) {
      console.error('Error calling createUser API:', error)
      throw error
    }
  },

  // PUT /users/{id} - Update user
  updateUser: async (id: string, userData: any): Promise<any> => {
    try {
      const response: AxiosResponse<MethodResult<any>> = await api.put(`/users/${id}`, userData)
      return response.data.data
    } catch (error: any) {
      console.error(`Error calling updateUser API with id ${id}:`, error)
      throw error
    }
  },

  // DELETE /users/{id} - Delete user
  deleteUser: async (id: string): Promise<any> => {
    try {
      const response: AxiosResponse<MethodResult<any>> = await api.delete(`/users/${id}`)
      return response.data.data
    } catch (error: any) {
      console.error(`Error calling deleteUser API with id ${id}:`, error)
      throw error
    }
  },

  // PUT /users/{id}/status - Update user status
  updateUserStatus: async (id: string, status: string): Promise<any> => {
    try {
      const response: AxiosResponse<MethodResult<any>> = await api.put(`/users/${id}/status`, { status })
      return response.data.data
    } catch (error: any) {
      console.error(`Error calling updateUserStatus API with id ${id}:`, error)
      throw error
    }
  },

  // POST /users/{id}/reset-password - Reset user password
  resetPassword: async (id: string): Promise<any> => {
    try {
      const response: AxiosResponse<MethodResult<any>> = await api.post(`/users/${id}/reset-password`)
      return response.data.data
    } catch (error: any) {
      console.error(`Error calling resetPassword API with id ${id}:`, error)
      throw error
    }
  },

  // GET /users/{id}/activities - Get user activities
  getUserActivities: async (id: string, params?: {
    page?: number
    size?: number
    startDate?: string
    endDate?: string
  }): Promise<PaginatedResponse<any>> => {
    try {
      const response: AxiosResponse<MethodResult<PaginatedResponse<any>>> = await api.get(`/users/${id}/activities`, { params })
      return response.data.data
    } catch (error: any) {
      console.error(`Error calling getUserActivities API with id ${id}:`, error)
      throw error
    }
  }
}

// Quantity Range API - New API for quantity ranges
export const quantityRangeApi = {
  // GET /quantity-range - Get all quantity ranges
  getAll: async (): Promise<any[]> => {
    try {
      const response: AxiosResponse<any> = await api.get('/quantity-range')
      return response.data.data || response.data
    } catch (error: any) {
      console.error('Error calling quantityRangeApi.getAll:', error)
      throw error
    }
  }
}

// Financial Reports API
export const financialReportsApi = {
  // GET /financial-reports/{period} - Get financial report for specific period
  getReport: async (period: string): Promise<any> => {
    try {
      console.log(`Calling financial-reports API with period: ${period}`)
      const response: AxiosResponse<MethodResult<any>> = await api.get(`/financial-reports/${period}`)
      console.log('Financial reports API response:', response)
      return response.data.data
    } catch (error: any) {
      console.error(`Error calling financial-reports API with period ${period}:`, error)
      console.error('Error response:', error.response?.data)
      console.error('Error status:', error.response?.status)
      throw error
    }
  },

  // GET /financial-reports/revenue-by-service/{period} - Get revenue breakdown by service
  getRevenueByService: async (period: string): Promise<any[]> => {
    try {
      console.log(`Calling revenue-by-service API with period: ${period}`)
      const response: AxiosResponse<MethodResult<any[]>> = await api.get(`/financial-reports/revenue-by-service/${period}`)
      console.log('Revenue by service API response:', response)
      return response.data.data
    } catch (error: any) {
      console.error(`Error calling revenue-by-service API with period ${period}:`, error)
      throw error
    }
  },

  // GET /financial-reports/expense-breakdown/{period} - Get expense breakdown
  getExpenseBreakdown: async (period: string): Promise<any[]> => {
    const response: AxiosResponse<MethodResult<any[]>> = await api.get(`/financial-reports/expense-breakdown/${period}`)
    return response.data.data
  },

  // GET /financial-reports/summary/{period} - Get financial summary
  getSummary: async (period: string): Promise<any> => {
    const response: AxiosResponse<MethodResult<any>> = await api.get(`/financial-reports/summary/${period}`)
    return response.data.data
  },

  // GET /financial-reports/trend/{period} - Get financial trend data
  getTrend: async (period: string): Promise<any[]> => {
    const response: AxiosResponse<MethodResult<any[]>> = await api.get(`/financial-reports/trend/${period}`)
    return response.data.data
  }
}

// WebSocket Service for real-time notifications
// Note: Requires @stomp/stompjs package to be installed (dynamic import used)
export class WebSocketService {
  private stompClient: any = null
  private isConnected: boolean = false
  // private reconnectAttempts: number = 0
  // private maxReconnectAttempts: number = 5
  // private reconnectInterval: number = 3000

  constructor(private baseUrl: string = 'ws://localhost:9872/api/pk/v1/ws') {}

  async connect(): Promise<void> {
    // Import StompJS dynamically to avoid SSR and to work even without type declarations
    const module: any = await import('@stomp/stompjs').catch((err) => {
      console.warn('WebSocket library missing. Install: npm install @stomp/stompjs')
      throw err
    })
    const Client = module.Client

    const token = localStorage.getItem(config.TOKEN_STORAGE_KEY)
    this.stompClient = new Client({
      brokerURL: this.baseUrl,
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      connectHeaders: token ? { Authorization: `Bearer ${token}` } : {}
    })

    this.stompClient.onConnect = () => {
      this.isConnected = true
      // this.reconnectAttempts = 0
    }

    this.stompClient.onDisconnect = () => {
      this.isConnected = false
    }

    this.stompClient.onStompError = () => {
      this.isConnected = false
    }

    await this.stompClient.activate()
  }

  disconnect(): void {
    if (this.stompClient) {
      this.stompClient.deactivate()
      this.isConnected = false
    }
  }

  isConnectedToWebSocket(): boolean {
    return this.isConnected
  }

  // Subscribe to notifications
  subscribeToNotifications(callback: (notification: any) => void): void {
    if (!this.stompClient || !this.isConnected) return
    this.stompClient.subscribe('/user/queue/notifications', (message: any) => {
      try { callback(JSON.parse(message.body)) } catch {}
    })
  }

  // Subscribe to unread count updates
  subscribeToUnreadCount(callback: (count: any) => void): void {
    if (!this.stompClient || !this.isConnected) return
    this.stompClient.subscribe('/user/queue/unread-count', (message: any) => {
      try { callback(JSON.parse(message.body)) } catch {}
    })
  }

  // Subscribe to error messages
  subscribeToErrors(callback: (error: any) => void): void {
    if (!this.stompClient || !this.isConnected) return
    this.stompClient.subscribe('/user/queue/errors', (message: any) => {
      try { callback(JSON.parse(message.body)) } catch {}
    })
  }

  // Client messages
  sendSubscribeToNotifications(): void {
    if (!this.stompClient || !this.isConnected) return
    this.stompClient.send('/app/notifications/subscribe')
  }

  markNotificationAsRead(notificationId: number): void {
    if (!this.stompClient || !this.isConnected) return
    this.stompClient.send('/app/notifications/mark-read', {}, notificationId.toString())
  }

  markAllNotificationsAsRead(): void {
    if (!this.stompClient || !this.isConnected) return
    this.stompClient.send('/app/notifications/mark-all-read')
  }

  getUnreadCount(): void {
    if (!this.stompClient || !this.isConnected) return
    this.stompClient.send('/app/notifications/unread-count')
  }
}

export default api 