// Application Configuration
export const config = {
  // API Configuration
  API_BASE_URL: import.meta.env.VITE_API_URL || 'https://pk.caduceus.vn/api/pk/v1',
  API_TIMEOUT: 30000,
  
  // App Information
  APP_NAME: import.meta.env.VITE_APP_NAME || 'Clinic Management System',
  APP_VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0',
  
  // Development Settings
  IS_DEV: import.meta.env.DEV,
  LOG_LEVEL: import.meta.env.VITE_LOG_LEVEL || 'info',
  
  // Pagination Defaults
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  
  // Authentication
  TOKEN_STORAGE_KEY: 'token',
  USER_STORAGE_KEY: 'user',
  REFRESH_TOKEN_STORAGE_KEY: 'refreshToken',
  
  // API Endpoints
  endpoints: {
    auth: {
      login: '/auth/login',
      register: '/auth/register',
      refresh: '/auth/refresh',
      forgotPassword: '/auth/forgot-password',
      resetPassword: '/auth/reset-password',
    },
    packaging: '/packaging',
    testTypes: '/test-types',
    testSamples: '/test-samples',
    referralSources: '/referral-sources',
    patients: '/patient', // Updated to match actual API
    registrations: '/registrations',
    testServices: '/test-services',
    testCategories: '/test-categories',
    reports: '/reports',
    materials: '/materials',
    inventoryLogs: '/inventory-logs',
    patientTests: '/patient-tests',
    patientSamples: '/patient-samples',
  },
}

export default config 