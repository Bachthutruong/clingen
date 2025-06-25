import React, { createContext, useContext, useEffect, useState } from 'react'
import type { User, AuthContextType, LoginCredentials } from '@/types/auth'
// import { authApi } from '@/services/api'
import { jwtDecode } from 'jwt-decode'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const initAuth = () => {
      const storedToken = localStorage.getItem('token')
      const storedUser = localStorage.getItem('user')

      if (storedToken && storedUser) {
        try {
          // Kiểm tra token có hết hạn không
          const decoded: any = jwtDecode(storedToken)
          const currentTime = Date.now() / 1000

          if (decoded.exp > currentTime) {
            setToken(storedToken)
            setUser(JSON.parse(storedUser))
          } else {
            // Token hết hạn, xóa khỏi localStorage
            localStorage.removeItem('token')
            localStorage.removeItem('user')
          }
        } catch (error) {
          console.error('Invalid token:', error)
          localStorage.removeItem('token')
          localStorage.removeItem('user')
        }
      }
      setIsLoading(false)
    }

    initAuth()
  }, [])

  const login = async (credentials: LoginCredentials) => {
    try {
      setIsLoading(true)
      
      // Mock authentication for demo purposes
      // Replace this with actual API call: const response = await authApi.login(credentials)
      
      // Demo users
      const demoUsers = {
        'admin@clinic.com': { 
          id: '1', 
          email: 'admin@clinic.com', 
          name: 'Nguyễn Văn Admin', 
          role: 'admin' as const,
          phone: '0123456789',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        'staff@clinic.com': { 
          id: '2', 
          email: 'staff@clinic.com', 
          name: 'Trần Thị Nhân Viên', 
          role: 'receptionist' as const,
          phone: '0123456788',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        'lab@clinic.com': { 
          id: '3', 
          email: 'lab@clinic.com', 
          name: 'Lê Văn Xét Nghiệm', 
          role: 'lab_technician' as const,
          phone: '0123456787',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        'accountant@clinic.com': { 
          id: '4', 
          email: 'accountant@clinic.com', 
          name: 'Phạm Thị Kế Toán', 
          role: 'accountant' as const,
          phone: '0123456786',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      }

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const user = demoUsers[credentials.email as keyof typeof demoUsers]
      
      if (!user || credentials.password !== '123456') {
        throw new Error('Invalid credentials')
      }

      const mockResponse = {
        user,
        token: 'mock-jwt-token-' + user.id,
        refreshToken: 'mock-refresh-token-' + user.id
      }
      
      setUser(mockResponse.user)
      setToken(mockResponse.token)
      
      localStorage.setItem('token', mockResponse.token)
      localStorage.setItem('user', JSON.stringify(mockResponse.user))
    } catch (error) {
      console.error('Login failed:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  const value: AuthContextType = {
    user,
    token,
    login,
    logout,
    isLoading,
    isAuthenticated: !!user && !!token
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
} 