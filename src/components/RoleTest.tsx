import React from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getRoleDisplayName } from '@/lib/utils'
import { 
  Shield, 
  User, 
  Key, 
  CheckCircle, 
  XCircle,
  Crown,
  Users,
  TestTube,
  Calculator
} from 'lucide-react'

const RoleTest: React.FC = () => {
  const { user } = useAuth()

  if (!user) {
    return (
      <div className="text-center py-8">
        <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <User className="h-8 w-8 text-gray-400" />
        </div>
        <p className="text-gray-500 text-lg font-medium">Không có thông tin người dùng</p>
        <p className="text-gray-400 text-sm">Vui lòng đăng nhập để xem thông tin phân quyền</p>
      </div>
    )
  }

  const roleAccess = {
    admin: user.role === 'admin',
    receptionist: user.role === 'receptionist',
    lab_technician: user.role === 'lab_technician',
    accountant: user.role === 'accountant'
  }

  const getRoleIcon = (roleCode: number) => {
    switch (roleCode) {
      case 1: return <Crown className="h-6 w-6 text-yellow-600" />
      case 2: return <Users className="h-6 w-6 text-blue-600" />
      case 3: return <TestTube className="h-6 w-6 text-purple-600" />
      case 4: return <Calculator className="h-6 w-6 text-green-600" />
      default: return <Shield className="h-6 w-6 text-gray-600" />
    }
  }

  const getRoleColor = (roleCode: number) => {
    switch (roleCode) {
      case 1: return 'from-yellow-500 to-orange-500'
      case 2: return 'from-blue-500 to-blue-600'
      case 3: return 'from-purple-500 to-purple-600'
      case 4: return 'from-green-500 to-green-600'
      default: return 'from-gray-500 to-gray-600'
    }
  }

  return (
    <div className="space-y-6">
      {/* User Header Card */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
        <div className="flex items-center space-x-4">
          <div className={`p-4 bg-gradient-to-r ${getRoleColor(user.roleCode)} rounded-2xl text-white shadow-lg`}>
            {getRoleIcon(user.roleCode)}
          </div>
          <div className="flex-1">
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{user.name}</h3>
            <p className="text-gray-600">@{user.username}</p>
            <div className="flex items-center space-x-2 mt-2">
              <span className={`px-3 py-1 text-xs font-semibold rounded-full bg-gradient-to-r ${getRoleColor(user.roleCode)} text-white`}>
                {user.roleName}
              </span>
              <span className="text-sm text-gray-500">• Mã vai trò: {user.roleCode}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Permission Details Card */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
          <h4 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <Shield className="h-5 w-5 text-gray-600" />
            <span>Thông tin phân quyền chi tiết</span>
          </h4>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <h5 className="font-semibold text-gray-700 text-sm uppercase tracking-wide mb-3">Thông tin cơ bản</h5>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-600">Username:</span>
                  <span className="text-sm font-semibold text-gray-900">{user.username}</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-600">Tên hiển thị:</span>
                  <span className="text-sm font-semibold text-gray-900">{user.name}</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-600">Mã vai trò:</span>
                  <span className="text-sm font-semibold text-gray-900">{user.roleCode}</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-600">Tên vai trò:</span>
                  <span className="text-sm font-semibold text-gray-900">{user.roleName}</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-600">Vai trò được map:</span>
                  <span className="text-sm font-semibold text-gray-900">{user.role}</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-600">Tên hiển thị:</span>
                  <span className="text-sm font-semibold text-gray-900">{getRoleDisplayName(user.roleCode)}</span>
                </div>
              </div>
            </div>

            {/* Access Rights */}
            <div className="space-y-4">
              <h5 className="font-semibold text-gray-700 text-sm uppercase tracking-wide mb-3">Quyền truy cập</h5>
              
              <div className="space-y-3">
                <div className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                  roleAccess.admin 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${
                        roleAccess.admin ? 'bg-green-500' : 'bg-gray-400'
                      }`}>
                        <Crown className="h-4 w-4 text-white" />
                      </div>
                      <span className="font-medium text-gray-900">Quản trị viên</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {roleAccess.admin ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-gray-400" />
                      )}
                      <span className={`text-sm font-semibold ${
                        roleAccess.admin ? 'text-green-600' : 'text-gray-500'
                      }`}>
                        {roleAccess.admin ? 'Có' : 'Không'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                  roleAccess.receptionist 
                    ? 'bg-blue-50 border-blue-200' 
                    : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${
                        roleAccess.receptionist ? 'bg-blue-500' : 'bg-gray-400'
                      }`}>
                        <Users className="h-4 w-4 text-white" />
                      </div>
                      <span className="font-medium text-gray-900">Nhân viên tiếp đón</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {roleAccess.receptionist ? (
                        <CheckCircle className="h-5 w-5 text-blue-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-gray-400" />
                      )}
                      <span className={`text-sm font-semibold ${
                        roleAccess.receptionist ? 'text-blue-600' : 'text-gray-500'
                      }`}>
                        {roleAccess.receptionist ? 'Có' : 'Không'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                  roleAccess.lab_technician 
                    ? 'bg-purple-50 border-purple-200' 
                    : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${
                        roleAccess.lab_technician ? 'bg-purple-500' : 'bg-gray-400'
                      }`}>
                        <TestTube className="h-4 w-4 text-white" />
                      </div>
                      <span className="font-medium text-gray-900">Kỹ thuật viên XN</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {roleAccess.lab_technician ? (
                        <CheckCircle className="h-5 w-5 text-purple-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-gray-400" />
                      )}
                      <span className={`text-sm font-semibold ${
                        roleAccess.lab_technician ? 'text-purple-600' : 'text-gray-500'
                      }`}>
                        {roleAccess.lab_technician ? 'Có' : 'Không'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                  roleAccess.accountant 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${
                        roleAccess.accountant ? 'bg-green-500' : 'bg-gray-400'
                      }`}>
                        <Calculator className="h-4 w-4 text-white" />
                      </div>
                      <span className="font-medium text-gray-900">Kế toán</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {roleAccess.accountant ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-gray-400" />
                      )}
                      <span className={`text-sm font-semibold ${
                        roleAccess.accountant ? 'text-green-600' : 'text-gray-500'
                      }`}>
                        {roleAccess.accountant ? 'Có' : 'Không'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Card */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-200">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl">
            <Key className="h-5 w-5 text-white" />
          </div>
          <h5 className="font-semibold text-gray-900">Tóm tắt quyền hạn</h5>
        </div>
        <p className="text-gray-600 text-sm leading-relaxed">
          Tài khoản <strong>{user.username}</strong> hiện tại có vai trò <strong>{getRoleDisplayName(user.roleCode)}</strong> 
          với mã <strong>{user.roleCode}</strong>. Người dùng có thể truy cập các chức năng tương ứng với vai trò được phân quyền.
        </p>
      </div>
    </div>
  )
}

export default RoleTest
