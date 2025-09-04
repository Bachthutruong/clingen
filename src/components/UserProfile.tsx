import React, { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Shield, 
  Edit, 
  LogOut,
  RefreshCw,
  Loader2
} from 'lucide-react'
import { formatDate } from '@/lib/utils'
import ChangePassword from './ChangePassword'

const UserProfile: React.FC = () => {
  const { user, logout, getUserInfo, isLoading } = useAuth()
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const handleRefreshUserInfo = async () => {
    try {
      setRefreshing(true)
      await getUserInfo()
    } catch (error) {
      console.error('Failed to refresh user info:', error)
    } finally {
      setRefreshing(false)
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const getRoleLabel = (role: string) => {
    const roleLabels: Record<string, string> = {
      admin: 'Quản trị viên',
      receptionist: 'Nhân viên tiếp đón',
      lab_technician: 'Kỹ thuật viên xét nghiệm',
      accountant: 'Kế toán'
    }
    return roleLabels[role] || role
  }

  const getRoleColor = (role: string) => {
    const roleColors: Record<string, string> = {
      admin: 'bg-red-100 text-red-800',
      receptionist: 'bg-blue-100 text-blue-800',
      lab_technician: 'bg-green-100 text-green-800',
      accountant: 'bg-purple-100 text-purple-800'
    }
    return roleColors[role] || 'bg-gray-100 text-gray-800'
  }

  if (isLoading) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-6 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Đang tải thông tin...</p>
        </CardContent>
      </Card>
    )
  }

  if (!user) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-6 text-center">
          <p className="text-gray-600">Không có thông tin người dùng</p>
        </CardContent>
      </Card>
    )
  }

  if (showChangePassword) {
    return (
      <ChangePassword
        onSuccess={() => setShowChangePassword(false)}
        onCancel={() => setShowChangePassword(false)}
      />
    )
  }

  return (
    <div className="space-y-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <User className="w-10 h-10 text-white" />
          </div>
          <div>
            <CardTitle className="text-xl font-bold">{user.name}</CardTitle>
            <CardDescription className="text-base">
              {user.username}
            </CardDescription>
          </div>
          <Badge className={`${getRoleColor(user.role)} text-sm font-medium`}>
            {getRoleLabel(user.role)}
          </Badge>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <Mail className="w-5 h-5 text-gray-500" />
              <div className="flex-1">
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium">{user.email}</p>
              </div>
            </div>

            {user.phone && (
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <Phone className="w-5 h-5 text-gray-500" />
                <div className="flex-1">
                  <p className="text-sm text-gray-600">Số điện thoại</p>
                  <p className="font-medium">{user.phone}</p>
                </div>
              </div>
            )}

            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <Calendar className="w-5 h-5 text-gray-500" />
              <div className="flex-1">
                <p className="text-sm text-gray-600">Ngày tạo</p>
                <p className="font-medium">{formatDate(user.createdAt)}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <Shield className="w-5 h-5 text-gray-500" />
              <div className="flex-1">
                <p className="text-sm text-gray-600">Cập nhật lần cuối</p>
                <p className="font-medium">{formatDate(user.updatedAt)}</p>
              </div>
            </div>
          </div>

          <div className="flex space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={handleRefreshUserInfo}
              disabled={refreshing}
              className="flex-1"
            >
              {refreshing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              <span className="ml-2">Làm mới</span>
            </Button>
            
            <Button
              variant="outline"
              onClick={() => setShowChangePassword(true)}
              className="flex-1"
            >
              <Edit className="w-4 h-4" />
              <span className="ml-2">Đổi mật khẩu</span>
            </Button>
          </div>

          <Button
            variant="destructive"
            onClick={handleLogout}
            className="w-full"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Đăng xuất
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

export default UserProfile



