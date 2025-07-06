import axios, { type AxiosInstance, type AxiosResponse } from 'axios'
import type { 
  AuthResponse, 
  LoginCredentials, 
  RegisterData
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
    return requestConfig
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Interceptor để handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token hết hạn, logout user
      localStorage.removeItem(config.TOKEN_STORAGE_KEY)
      localStorage.removeItem(config.USER_STORAGE_KEY)
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Auth API
export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', credentials)
    return response.data
  },

  register: async (userData: RegisterData): Promise<AuthResponse> => {
    const response = await api.post('/auth/register', userData)
    return response.data
  },

  refresh: async (refreshToken: string): Promise<AuthResponse> => {
    const response = await api.post('/auth/refresh', { refreshToken })
    return response.data
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
      
      const response: AxiosResponse<MethodResult<Material[]>> = await api.post('/material/search', searchParams)
      return transformToPaginatedResponse(response.data, searchParams.pageIndex, searchParams.pageSize)
    } catch (error) {
      // Fallback to GET method if POST search fails
      console.warn('POST /material/search failed, trying GET /material as fallback:', error)
      try {
        const response: AxiosResponse<MethodResult<Material[]>> = await api.get('/material', {
          params: {
            keyword: params?.keyword,
            page: params?.pageIndex || 0,
            size: params?.pageSize || 20,
            materialType: params?.materialType
          }
        })
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
export const inventoryApi = {
  // Lấy logs
  getLogs: async (params?: InventoryLogsSearchDTO): Promise<PaginatedResponse<InventoryLogsDTO>> => {
    const response: AxiosResponse<MethodResult<InventoryLogsDTO[]>> = await api.post('/inventory-logs/search', params)
    return transformToPaginatedResponse(response.data, params?.pageIndex || 0, params?.pageSize || 20)
  },

  getLogById: async (id: number): Promise<InventoryLogsDTO> => {
    const response: AxiosResponse<MethodResult<InventoryLogsDTO>> = await api.get(`/inventory-logs/${id}`)
    return response.data.data
  },

  createLog: async (data: CreateInventoryLogRequest): Promise<InventoryLogsDTO> => {
    const response: AxiosResponse<MethodResult<InventoryLogsDTO>> = await api.post('/inventory-logs', data)
    return response.data.data
  },

  updateLog: async (id: number, data: Partial<CreateInventoryLogRequest>): Promise<InventoryLogsDTO> => {
    const response: AxiosResponse<MethodResult<InventoryLogsDTO>> = await api.put(`/inventory-logs/${id}`, data)
    return response.data.data
  },

  deleteLog: async (id: number): Promise<void> => {
    await api.delete(`/inventory-logs/${id}`)
  },

  // Nhập kho
  importMaterials: async (data: {
    materialId: number
    quantity: number
    expiryDate?: string
    note?: string
  }): Promise<InventoryLogsDTO> => {
    const logData: CreateInventoryLogRequest = {
      logType: 0, // IMPORT
      items: [{
        type: 0,
        materialId: data.materialId,
        quantity: data.quantity,
        expiryDate: data.expiryDate
      }],
      note: data.note
    }
    return inventoryApi.createLog(logData)
  },

  // Xuất kho
  exportMaterials: async (data: {
    materialId: number
    quantity: number
    note?: string
  }): Promise<InventoryLogsDTO> => {
    const logData: CreateInventoryLogRequest = {
      logType: 1, // EXPORT
      items: [{
        type: 1,
        materialId: data.materialId,
        quantity: data.quantity
      }],
      note: data.note
    }
    return inventoryApi.createLog(logData)
  },

  // Điều chỉnh kho
  adjustInventory: async (data: {
    materialId: number
    quantity: number
    note?: string
  }): Promise<InventoryLogsDTO> => {
    const logData: CreateInventoryLogRequest = {
      logType: 2, // ADJUSTMENT
      items: [{
        type: 2,
        materialId: data.materialId,
        quantity: data.quantity
      }],
      note: data.note
    }
    return inventoryApi.createLog(logData)
  },
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

export default api 