import React, { createContext, useContext, useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'
import type { 
  User, 
  AuthContextType, 
  LoginCredentials, 
  // RefreshTokenRequest,
  ChangePasswordRequest 
} from '@/types/auth'
import { authApi } from '@/services/api'
import { config } from '@/config'

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
  const [refreshToken, setRefreshToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem(config.TOKEN_STORAGE_KEY)
      const storedRefreshToken = localStorage.getItem(config.REFRESH_TOKEN_STORAGE_KEY)
      const storedUser = localStorage.getItem(config.USER_STORAGE_KEY)

      if (storedToken && storedRefreshToken && storedUser) {
        try {
          setToken(storedToken)
          setRefreshToken(storedRefreshToken)
          setUser(JSON.parse(storedUser))
          
          // Verify token is still valid by getting user info
          await getUserInfo()
        } catch (error) {
          console.error('Invalid stored auth data or token expired:', error)
          // Try to refresh token
          try {
            await refreshAuthToken()
          } catch (refreshError) {
            console.error('Token refresh failed:', refreshError)
            // Clear invalid data
            localStorage.removeItem(config.TOKEN_STORAGE_KEY)
            localStorage.removeItem(config.REFRESH_TOKEN_STORAGE_KEY)
            localStorage.removeItem(config.USER_STORAGE_KEY)
            setToken(null)
            setRefreshToken(null)
            setUser(null)
          }
        }
      }
      setIsLoading(false)
    }

    initAuth()
  }, [])

  const login = async (credentials: LoginCredentials) => {
    try {
      setIsLoading(true)
      
      const response = await authApi.login(credentials)
      
      setUser(response.user)
      setToken(response.token)
      setRefreshToken(response.refreshToken)
      
      localStorage.setItem(config.TOKEN_STORAGE_KEY, response.token)
      localStorage.setItem(config.REFRESH_TOKEN_STORAGE_KEY, response.refreshToken)
      localStorage.setItem(config.USER_STORAGE_KEY, JSON.stringify(response.user))

      toast.success('Đăng nhập thành công!')
    } catch (error) {
      console.error('Login failed:', error)
      toast.error('Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.')
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    try {
      if (refreshToken) {
        await authApi.logout({ refreshToken })
      }
    } catch (error) {
      console.error('Logout API call failed:', error)
    } finally {
      // Always clear local data
      setUser(null)
      setToken(null)
      setRefreshToken(null)
      localStorage.removeItem(config.TOKEN_STORAGE_KEY)
      localStorage.removeItem(config.REFRESH_TOKEN_STORAGE_KEY)
      localStorage.removeItem(config.USER_STORAGE_KEY)
      
      toast.success('Đăng xuất thành công!')
    }
  }

  const refreshAuthToken = async () => {
    if (!refreshToken) {
      throw new Error('No refresh token available')
    }

    try {
      const response = await authApi.refresh({ refreshToken })
      
      setToken(response.token)
      setRefreshToken(response.refreshToken)
      
      localStorage.setItem(config.TOKEN_STORAGE_KEY, response.token)
      localStorage.setItem(config.REFRESH_TOKEN_STORAGE_KEY, response.refreshToken)
      
      return response
    } catch (error) {
      console.error('Token refresh failed:', error)
      // Clear invalid tokens
      setToken(null)
      setRefreshToken(null)
      setUser(null)
      localStorage.removeItem(config.TOKEN_STORAGE_KEY)
      localStorage.removeItem(config.REFRESH_TOKEN_STORAGE_KEY)
      localStorage.removeItem(config.USER_STORAGE_KEY)
      throw error
    }
  }

  const changePassword = async (request: ChangePasswordRequest) => {
    try {
      const response = await authApi.changePassword(request)
      
      if (response.success) {
        toast.success('Đổi mật khẩu thành công!')
      } else {
        toast.error(response.message || 'Đổi mật khẩu thất bại')
      }
      
      return response
    } catch (error) {
      console.error('Change password failed:', error)
      toast.error('Đổi mật khẩu thất bại. Vui lòng thử lại.')
      throw error
    }
  }

  const getUserInfo = async (): Promise<User> => {
    try {
      const response = await authApi.getUserInfo()
      
      setUser(response.user)
      localStorage.setItem(config.USER_STORAGE_KEY, JSON.stringify(response.user))
      
      return response.user
    } catch (error) {
      console.error('Get user info failed:', error)
      throw error
    }
  }

  const value: AuthContextType = {
    user,
    token,
    refreshToken,
    login,
    logout,
    refreshAuthToken,
    changePassword,
    getUserInfo,
    isLoading,
    isAuthenticated: !!user && !!token
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
} 