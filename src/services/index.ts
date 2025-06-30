// Export all API services
export {
  authApi,
  packagingApi,
  testTypesApi,
  referralSourcesApi,
  patientsApi,
  registrationsApi,
  testServicesApi,
  testCategoriesApi,
  reportsApi,
  default as api
} from './api'

// Re-export types for convenience
export type {
  Packaging,
  TestType,
  ReferralSourceAPI,
  PatientAPI,
  PaginatedResponse,
  PackagingSearchParams,
  TestTypeSearchParams,
  ReferralSourceSearchParams,
  PatientSearchParams
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