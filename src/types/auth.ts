export interface User {
  id: string
  username: string
  email: string
  name: string
  roleCode: number
  roleName: string
  role: UserRole
  avatar?: string
  phone?: string
  createdAt: string
  updatedAt: string
}

export type UserRole = 'admin' | 'receptionist' | 'lab_technician' | 'accountant'

// Role mapping constants
export const ROLE_CODES = {
  ADMIN: 1,
  TIEP_NHAN_HO_SO: 2,
  BAC_SI: 3,
  TAI_CHINH_KE_TOAN: 4
} as const

export const ROLE_NAMES = {
  [ROLE_CODES.ADMIN]: 'ADMIN',
  [ROLE_CODES.TIEP_NHAN_HO_SO]: 'Tiếp nhận hồ sơ',
  [ROLE_CODES.BAC_SI]: 'Bác sĩ',
  [ROLE_CODES.TAI_CHINH_KE_TOAN]: 'Tài chính - Kế toán'
} as const

// Login
export interface LoginCredentials {
  username: string
  password: string
}

export interface LoginResponse {
  user: User
  token: string
  refreshToken: string
}

// Raw API response structure
export interface RawLoginResponse {
  status: boolean
  message: string | null
  data: {
    token: string
    type: string
    username: string
    roleCode: number
    roleName: string
    refreshToken: string
  }
  totalRecord: number | null
}

// Refresh Token
export interface RefreshTokenRequest {
  refreshToken: string
}

export interface RefreshTokenResponse {
  token: string
  refreshToken: string
}

// Logout
export interface LogoutRequest {
  refreshToken: string
}

// Change Password
export interface ChangePasswordRequest {
  oldPassword: string
  newPassword: string
}

export interface ChangePasswordResponse {
  message: string
  success: boolean
}

// Get User Info
export interface GetUserInfoResponse {
  user: User
}

// Auth Context
export interface AuthContextType {
  user: User | null
  token: string | null
  refreshToken: string | null
  login: (credentials: LoginCredentials) => Promise<void>
  logout: () => Promise<void>
  refreshAuthToken: () => Promise<RefreshTokenResponse>
  changePassword: (request: ChangePasswordRequest) => Promise<ChangePasswordResponse>
  getUserInfo: () => Promise<User>
  isLoading: boolean
  isAuthenticated: boolean
}

// Register (if needed)
export interface RegisterData {
  username: string
  email: string
  password: string
  name: string
  phone?: string
  role: UserRole
} 