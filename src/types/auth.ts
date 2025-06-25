export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  avatar?: string
  phone?: string
  createdAt: string
  updatedAt: string
}

export type UserRole = 'admin' | 'receptionist' | 'lab_technician' | 'accountant'

export interface LoginCredentials {
  email: string
  password: string
}

export interface AuthResponse {
  user: User
  token: string
  refreshToken: string
}

export interface AuthContextType {
  user: User | null
  token: string | null
  login: (credentials: LoginCredentials) => Promise<void>
  logout: () => void
  isLoading: boolean
  isAuthenticated: boolean
}

export interface RegisterData {
  email: string
  password: string
  name: string
  phone?: string
  role: UserRole
} 