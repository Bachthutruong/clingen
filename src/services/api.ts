import axios, { type AxiosInstance, type AxiosResponse } from 'axios'
import type { 
  AuthResponse, 
  LoginCredentials, 
  RegisterData, 
//   User 
} from '@/types/auth'
import type { 
  Patient, 
  Registration, 
  ReferralSource, 
  TestService, 
  TestCategory,
  TestResult 
} from '@/types/patient'

// Tạo axios instance với base configuration
const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Interceptor để tự động thêm token vào headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
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
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Authentication API
export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response: AxiosResponse<AuthResponse> = await api.post('/auth/login', credentials)
    return response.data
  },

  register: async (userData: RegisterData): Promise<AuthResponse> => {
    const response: AxiosResponse<AuthResponse> = await api.post('/auth/register', userData)
    return response.data
  },

  forgotPassword: async (email: string): Promise<{ message: string }> => {
    const response = await api.post('/auth/forgot-password', { email })
    return response.data
  },

  resetPassword: async (token: string, password: string): Promise<{ message: string }> => {
    const response = await api.post('/auth/reset-password', { token, password })
    return response.data
  },

  refreshToken: async (): Promise<AuthResponse> => {
    const response: AxiosResponse<AuthResponse> = await api.post('/auth/refresh')
    return response.data
  },
}

// Patients API
export const patientsApi = {
  getAll: async (params?: { page?: number; limit?: number; search?: string }): Promise<{
    patients: Patient[]
    total: number
    page: number
    totalPages: number
  }> => {
    const response = await api.get('/patients', { params })
    return response.data
  },

  getById: async (id: string): Promise<Patient> => {
    const response = await api.get(`/patients/${id}`)
    return response.data
  },

  create: async (patientData: Omit<Patient, 'id' | 'patientCode' | 'createdAt' | 'updatedAt'>): Promise<Patient> => {
    const response = await api.post('/patients', patientData)
    return response.data
  },

  update: async (id: string, patientData: Partial<Patient>): Promise<Patient> => {
    const response = await api.put(`/patients/${id}`, patientData)
    return response.data
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/patients/${id}`)
  },

  getHistory: async (id: string): Promise<Registration[]> => {
    const response = await api.get(`/patients/${id}/history`)
    return response.data
  },
}

// Registrations API
export const registrationsApi = {
  getAll: async (params?: { 
    page?: number; 
    limit?: number; 
    search?: string; 
    status?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<{
    registrations: Registration[]
    total: number
    page: number
    totalPages: number
  }> => {
    const response = await api.get('/registrations', { params })
    return response.data
  },

  getById: async (id: string): Promise<Registration> => {
    const response = await api.get(`/registrations/${id}`)
    return response.data
  },

  create: async (registrationData: Omit<Registration, 'id' | 'createdAt' | 'updatedAt'>): Promise<Registration> => {
    const response = await api.post('/registrations', registrationData)
    return response.data
  },

  update: async (id: string, registrationData: Partial<Registration>): Promise<Registration> => {
    const response = await api.put(`/registrations/${id}`, registrationData)
    return response.data
  },

  updateServiceStatus: async (registrationId: string, serviceId: string, status: string): Promise<void> => {
    await api.patch(`/registrations/${registrationId}/services/${serviceId}/status`, { status })
  },

  addTestResult: async (serviceId: string, result: Omit<TestResult, 'id' | 'testedAt'>): Promise<TestResult> => {
    const response = await api.post(`/registration-services/${serviceId}/result`, result)
    return response.data
  },

  printReceipt: async (id: string): Promise<Blob> => {
    const response = await api.get(`/registrations/${id}/receipt`, { responseType: 'blob' })
    return response.data
  },
}

// Referral Sources API
export const referralSourcesApi = {
  getAll: async (): Promise<ReferralSource[]> => {
    const response = await api.get('/referral-sources')
    return response.data
  },

  create: async (data: Omit<ReferralSource, 'id' | 'createdAt'>): Promise<ReferralSource> => {
    const response = await api.post('/referral-sources', data)
    return response.data
  },

  update: async (id: string, data: Partial<ReferralSource>): Promise<ReferralSource> => {
    const response = await api.put(`/referral-sources/${id}`, data)
    return response.data
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/referral-sources/${id}`)
  },
}

// Test Services API
export const testServicesApi = {
  getAll: async (): Promise<TestService[]> => {
    const response = await api.get('/test-services')
    return response.data
  },

  getByCategory: async (categoryId: string): Promise<TestService[]> => {
    const response = await api.get(`/test-services?categoryId=${categoryId}`)
    return response.data
  },

  create: async (data: Omit<TestService, 'id' | 'createdAt'>): Promise<TestService> => {
    const response = await api.post('/test-services', data)
    return response.data
  },

  update: async (id: string, data: Partial<TestService>): Promise<TestService> => {
    const response = await api.put(`/test-services/${id}`, data)
    return response.data
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/test-services/${id}`)
  },
}

// Test Categories API
export const testCategoriesApi = {
  getAll: async (): Promise<TestCategory[]> => {
    const response = await api.get('/test-categories')
    return response.data
  },

  create: async (data: Omit<TestCategory, 'id'>): Promise<TestCategory> => {
    const response = await api.post('/test-categories', data)
    return response.data
  },

  update: async (id: string, data: Partial<TestCategory>): Promise<TestCategory> => {
    const response = await api.put(`/test-categories/${id}`, data)
    return response.data
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/test-categories/${id}`)
  },
}

// Reports API
export const reportsApi = {
  getRegistrationStats: async (params: {
    dateFrom: string
    dateTo: string
    groupBy?: 'day' | 'week' | 'month'
  }): Promise<any> => {
    const response = await api.get('/reports/registrations', { params })
    return response.data
  },

  getRevenueStats: async (params: {
    dateFrom: string
    dateTo: string
    groupBy?: 'day' | 'week' | 'month'
  }): Promise<any> => {
    const response = await api.get('/reports/revenue', { params })
    return response.data
  },

  getServiceStats: async (params: {
    dateFrom: string
    dateTo: string
  }): Promise<any> => {
    const response = await api.get('/reports/services', { params })
    return response.data
  },

  exportReport: async (type: string, params: any): Promise<Blob> => {
    const response = await api.get(`/reports/export/${type}`, { 
      params, 
      responseType: 'blob' 
    })
    return response.data
  },
}

export default api 