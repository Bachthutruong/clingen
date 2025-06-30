import React, { createContext, useContext, useEffect, useState } from 'react'
import type { User, AuthContextType, LoginCredentials } from '@/types/auth'
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
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const initAuth = () => {
      const storedToken = localStorage.getItem(config.TOKEN_STORAGE_KEY)
      const storedUser = localStorage.getItem(config.USER_STORAGE_KEY)

      if (storedToken && storedUser) {
        try {
          setToken(storedToken)
          setUser(JSON.parse(storedUser))
        } catch (error) {
          console.error('Invalid stored auth data:', error)
          localStorage.removeItem(config.TOKEN_STORAGE_KEY)
          localStorage.removeItem(config.USER_STORAGE_KEY)
        }
      }
      setIsLoading(false)
    }

    initAuth()
  }, [])

  const login = async (credentials: LoginCredentials) => {
    try {
      setIsLoading(true)
      
      // Mock authentication - check for demo accounts
      const mockUsers = [
        {
          id: '1',
          email: 'admin@clinic.com',
          password: 'admin123',
          name: 'Admin User',
          role: 'admin' as const
        },
        {
          id: '2', 
          email: 'receptionist@clinic.com',
          password: 'receptionist123', 
          name: 'Receptionist User',
          role: 'receptionist' as const
        },
        {
          id: '3',
          email: 'lab@clinic.com',
          password: 'lab123',
          name: 'Lab Technician',
          role: 'lab_technician' as const
        },
        {
          id: '4',
          email: 'accountant@clinic.com',
          password: 'accountant123',
          name: 'Accountant User',
          role: 'accountant' as const
        }
      ]

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000))

      const mockUser = mockUsers.find(
        u => u.email === credentials.email && u.password === credentials.password
      )

      if (!mockUser) {
        throw new Error('Email hoặc mật khẩu không đúng')
      }

      // Create mock user and token
      const user: User = {
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        role: mockUser.role,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      const mockToken = `mock_token_${mockUser.id}_${Date.now()}`
      
      setUser(user)
      setToken(mockToken)
      
      localStorage.setItem(config.TOKEN_STORAGE_KEY, mockToken)
      localStorage.setItem(config.USER_STORAGE_KEY, JSON.stringify(user))

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
    localStorage.removeItem(config.TOKEN_STORAGE_KEY)
    localStorage.removeItem(config.USER_STORAGE_KEY)
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