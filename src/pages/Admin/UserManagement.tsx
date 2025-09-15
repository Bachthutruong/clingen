import React, { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { usersApi } from '@/services'
import { 
  Users, 
  Search, 
  Plus,
  Edit,
  Trash2,
  Eye,
  UserCheck,
  Shield,
  Key,
  CheckCircle,
  Activity,
  Settings,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react'
import { formatDateTime } from '@/lib/utils'

interface User {
  username: string
  fullName: string
  roleCode: number
  roleName: string
  createdAt: string
  id?: number
  email?: string
  status?: number
  lastLoginAt?: string
}

interface CreateUserRequest {
  username: string
  password: string
  fullName: string
  roleCode: number
}

interface UpdateUserRequest {
  fullName: string
  roleCode: number
}

interface ChangePasswordRequest {
  oldPassword: string
  newPassword: string
}

const UserManagement: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [currentPage, setCurrentPage] = useState(0)
  const [pageSize] = useState(10)
  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)

  // Form states for adding/editing users
  const [formData, setFormData] = useState<CreateUserRequest>({
    username: '',
    password: '',
    fullName: '',
    roleCode: 1
  })

  const [passwordData, setPasswordData] = useState<ChangePasswordRequest>({
    oldPassword: '',
    newPassword: ''
  })

  // Role mapping
  const roleOptions = [
    { code: 1, name: 'Quản trị viên', label: 'admin' },
    { code: 2, name: 'Nhân viên tiếp đón', label: 'receptionist' },
    { code: 3, name: 'Kỹ thuật viên XN', label: 'lab_technician' },
    { code: 4, name: 'Kế toán', label: 'accountant' }
  ]

  // Fetch users from API
  const fetchUsers = async () => {
    try {
      setLoading(true)
      
      const response = await usersApi.getAll({
        keyword: searchQuery || undefined,
        pageIndex: currentPage,
        pageSize: pageSize,
        orderCol: 'createdAt',
        isDesc: true
      })
      
      setUsers(response.content || [])
      setTotalPages(response.totalPages || 0)
      setTotalElements(response.totalElements || 0)
    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error('Có lỗi xảy ra khi tải danh sách người dùng!')
      // Fallback to empty array on error
      setUsers([])
      setTotalPages(0)
      setTotalElements(0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [currentPage, searchQuery])

  // Debounce search query
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      setCurrentPage(0) // Reset to first page when search changes
      fetchUsers()
    }, 300) // Debounce search

    return () => clearTimeout(debounceTimer)
  }, [searchQuery])

  // Apply client-side role filter only (search is handled by API)
  const filteredUsers = users.filter(user => {
    const matchesRole = !roleFilter || user.roleCode.toString() === roleFilter
    return matchesRole
  })

  const getRoleLabel = (roleCode: number) => {
    const role = roleOptions.find(r => r.code === roleCode)
    return role ? role.name : 'Unknown'
  }

  const getRoleColor = (roleCode: number) => {
    switch (roleCode) {
      case 1: return 'bg-red-100 text-red-800'
      case 2: return 'bg-blue-100 text-blue-800'
      case 3: return 'bg-purple-100 text-purple-800'
      case 4: return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handleViewUser = async (user: User) => {
    try {
      // Try to fetch fresh data from API
      const freshUser = await usersApi.getByUsername(user.username)
      setSelectedUser(freshUser)
    } catch (error) {
      // If API fails, use local data
      console.warn('Failed to fetch user details from API, using local data:', error)
      setSelectedUser(user)
    }
    setIsEditing(false)
    setShowDetailDialog(true)
  }

  const handleEditUser = () => {
    setIsEditing(true)
    setFormData({
      username: selectedUser?.username || '',
      password: '',
      fullName: selectedUser?.fullName || '',
      roleCode: selectedUser?.roleCode || 1
    })
  }

  const handleAddUser = () => {
    setIsAddingNew(true)
    setFormData({
      username: '',
      password: '',
      fullName: '',
      roleCode: 1
    })
    setShowDetailDialog(true)
  }

  const handleSaveUser = async () => {
    try {
      if (isAddingNew) {
        // Validate form data
        if (!formData.username || !formData.password || !formData.fullName) {
          toast.error('Vui lòng điền đầy đủ thông tin!')
          return
        }
        
        // Create new user via API
        await usersApi.create(formData)
        
        // Refresh the user list
        await fetchUsers()
        toast.success('Tạo tài khoản thành công!')
        setIsAddingNew(false)
      } else {
        // Update existing user via API
        if (selectedUser) {
          const updateData: UpdateUserRequest = {
            fullName: formData.fullName,
            roleCode: formData.roleCode
          }
          await usersApi.updateByUsername(selectedUser.username, updateData)
          
          // Refresh the user list
          await fetchUsers()
          toast.success('Cập nhật tài khoản thành công!')
    setIsEditing(false)
        }
      }
      setShowDetailDialog(false)
    } catch (error) {
      console.error('Error saving user:', error)
      toast.error('Có lỗi xảy ra khi lưu tài khoản!')
    }
  }

  const handleDeleteUser = (user: User) => {
    setUserToDelete(user)
    setShowDeleteDialog(true)
  }

  const confirmDeleteUser = async () => {
    if (!userToDelete) return
    
    try {
      await usersApi.deleteByUsername(userToDelete.username)
      
      // Refresh the user list
      await fetchUsers()
      toast.success(`Xóa tài khoản ${userToDelete.fullName} thành công!`)
    } catch (error) {
      console.error('Error deleting user:', error)
      toast.error('Có lỗi xảy ra khi xóa tài khoản!')
    } finally {
      setShowDeleteDialog(false)
      setUserToDelete(null)
    }
  }

  const cancelDeleteUser = () => {
    setShowDeleteDialog(false)
    setUserToDelete(null)
  }

  const handleChangePassword = async () => {
    if (!selectedUser) return
    
    try {
      await usersApi.changePassword(selectedUser.username, passwordData)
      toast.success('Đổi mật khẩu thành công!')
      setPasswordData({ oldPassword: '', newPassword: '' })
    } catch (error) {
      console.error('Error changing password:', error)
      toast.error('Có lỗi xảy ra khi đổi mật khẩu!')
    }
  }

  const handleFormChange = (field: keyof CreateUserRequest, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handlePasswordChange = (field: keyof ChangePasswordRequest, value: string) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const stats = {
    total: users.length,
    admins: users.filter(u => u.roleCode === 1).length,
    receptionists: users.filter(u => u.roleCode === 2).length,
    labTechnicians: users.filter(u => u.roleCode === 3).length,
    accountants: users.filter(u => u.roleCode === 4).length
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-violet-600 to-violet-700 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-white/20 rounded-xl">
              <Users size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Quản lý tài khoản</h1>
              <p className="text-violet-100">Quản lý người dùng và phân quyền hệ thống</p>
            </div>
          </div>
          <Button 
            onClick={handleAddUser}
            className="bg-white text-violet-600 hover:bg-gray-100"
          >
            <Plus size={16} className="mr-2" />
            Thêm tài khoản
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <Card className="shadow-lg border-0">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Tổng TK</p>
                <p className="text-lg font-bold text-blue-600">{stats.total}</p>
              </div>
              <Users className="h-5 w-5 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">QTV</p>
                <p className="text-lg font-bold text-red-600">{stats.admins}</p>
              </div>
              <Shield className="h-5 w-5 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Tiếp đón</p>
                <p className="text-lg font-bold text-blue-600">{stats.receptionists}</p>
              </div>
              <UserCheck className="h-5 w-5 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">XN</p>
                <p className="text-lg font-bold text-purple-600">{stats.labTechnicians}</p>
              </div>
              <Activity className="h-5 w-5 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Kế toán</p>
                <p className="text-lg font-bold text-green-600">{stats.accountants}</p>
              </div>
              <Settings className="h-5 w-5 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card className="shadow-lg border-0">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Tìm theo tên, username..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Tất cả vai trò</option>
              {roleOptions.map(role => (
                <option key={role.code} value={role.code.toString()}>
                  {role.name}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* User List - Table */}
      <Card className="shadow-lg border-0">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Danh sách tài khoản ({filteredUsers.length})</span>
            <Button size="sm" onClick={fetchUsers} disabled={loading}>
              <RefreshCw size={14} className={`mr-1 ${loading ? 'animate-spin' : ''}`} />
              Làm mới
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">
              Đang tải...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Không tìm thấy tài khoản phù hợp
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-900">Tài khoản</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-900">Họ tên</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-900">Vai trò</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-900">Ngày tạo</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-900">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredUsers.map(user => (
                    <tr key={user.username} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <div className="font-medium text-gray-900">@{user.username}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-medium text-gray-900">{user.fullName}</div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center px-2 py-1 text-xs rounded-full ${getRoleColor(user.roleCode)}`}>
                          {getRoleLabel(user.roleCode)}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-gray-900">
                          {formatDateTime(user.createdAt)}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex space-x-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewUser(user)}
                            className="text-xs"
                          >
                            <Eye size={12} className="mr-1" />
                            Chi tiết
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteUser(user)}
                            className="text-xs text-red-600 hover:text-red-700"
                          >
                            <Trash2 size={12} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
            disabled={currentPage === 0 || loading}
          >
            <ChevronLeft size={16} />
            Trước
          </Button>
          <span className="text-sm text-gray-600">
            Trang {currentPage + 1} / {totalPages} ({totalElements} tài khoản)
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
            disabled={currentPage >= totalPages - 1 || loading}
          >
            Sau
            <ChevronRight size={16} />
          </Button>
        </div>
      )}

      {/* Detail Dialog */}
      {showDetailDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">
                  {isAddingNew ? 'Thêm tài khoản mới' : 'Chi tiết tài khoản'}
                </h2>
                <div className="flex items-center space-x-2">
                  {!isAddingNew ? (
                    <>
                      {!isEditing ? (
                        <>
                          <Button size="sm" variant="outline" onClick={handleEditUser}>
                            <Edit size={14} className="mr-1" />
                            Sửa
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => selectedUser && handleDeleteUser(selectedUser)}>
                            <Trash2 size={14} className="mr-1" />
                            Xóa
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button size="sm" onClick={handleSaveUser}>
                            <CheckCircle size={14} className="mr-1" />
                            Lưu
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                            Hủy
                          </Button>
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      <Button size="sm" onClick={handleSaveUser}>
                        <CheckCircle size={14} className="mr-1" />
                        Tạo
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => {
                        setIsAddingNew(false)
                        setShowDetailDialog(false)
                      }}>
                        Hủy
                    </Button>
                    </>
                  )}
                  <Button size="sm" variant="outline" onClick={() => {
                    setShowDetailDialog(false)
                    setIsAddingNew(false)
                    setIsEditing(false)
                  }}>
                    <X size={14} />
                  </Button>
                </div>
              </div>

                <div className="space-y-4">
                  {/* Basic Info */}
                  <div className="border-b pb-4">
                  <h3 className="font-semibold text-lg">
                    {isAddingNew ? 'Thông tin tài khoản mới' : selectedUser?.fullName}
                  </h3>
                    <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                      <div>
                        <span className="text-gray-600">Username:</span>
                      {isEditing || isAddingNew ? (
                        <Input 
                          className="mt-1" 
                          value={formData.username}
                          onChange={(e) => handleFormChange('username', e.target.value)}
                          disabled={!isAddingNew}
                        />
                      ) : (
                        <p className="font-medium">@{selectedUser?.username}</p>
                        )}
                      </div>
                      <div>
                        <span className="text-gray-600">Họ tên:</span>
                      {isEditing || isAddingNew ? (
                        <Input 
                          className="mt-1" 
                          value={formData.fullName}
                          onChange={(e) => handleFormChange('fullName', e.target.value)}
                        />
                      ) : (
                        <p className="font-medium">{selectedUser?.fullName}</p>
                        )}
                      </div>
                    </div>
                  </div>

                {/* Role */}
                  <div className="border-b pb-4">
                  <h4 className="font-semibold mb-3">Vai trò</h4>
                  <div className="text-sm">
                    {isEditing || isAddingNew ? (
                      <select 
                        className="w-full px-3 py-2 border border-gray-300 rounded-md" 
                        value={formData.roleCode}
                        onChange={(e) => handleFormChange('roleCode', parseInt(e.target.value))}
                      >
                        {roleOptions.map(role => (
                          <option key={role.code} value={role.code}>
                            {role.name}
                          </option>
                        ))}
                          </select>
                        ) : (
                      <p className="font-medium">{selectedUser && getRoleLabel(selectedUser.roleCode)}</p>
                    )}
                    </div>
                  </div>

                {/* Password for new users */}
                {isAddingNew && (
                  <div className="border-b pb-4">
                    <h4 className="font-semibold mb-3">Mật khẩu</h4>
                    <div className="text-sm">
                      <Input 
                        type="password"
                        className="mt-1" 
                        placeholder="Nhập mật khẩu"
                        value={formData.password}
                        onChange={(e) => handleFormChange('password', e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {/* Change Password for existing users */}
                {!isAddingNew && selectedUser && (
                  <div className="border-b pb-4">
                    <h4 className="font-semibold mb-3">Đổi mật khẩu</h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-600">Mật khẩu cũ:</span>
                        <Input 
                          type="password"
                          className="mt-1" 
                          value={passwordData.oldPassword}
                          onChange={(e) => handlePasswordChange('oldPassword', e.target.value)}
                        />
                      </div>
                      <div>
                        <span className="text-gray-600">Mật khẩu mới:</span>
                        <Input 
                          type="password"
                          className="mt-1" 
                          value={passwordData.newPassword}
                          onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                        />
                      </div>
                      <Button size="sm" onClick={handleChangePassword}>
                        <Key size={14} className="mr-1" />
                        Đổi mật khẩu
                      </Button>
                    </div>
                    </div>
                  )}

                {/* Created Info */}
                {!isAddingNew && selectedUser && (
                  <div className="text-sm text-gray-500">
                    <p>Tạo: {formatDateTime(selectedUser.createdAt)}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && userToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="p-3 bg-red-100 rounded-full mr-4">
                  <Trash2 className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Xác nhận xóa tài khoản</h3>
                  <p className="text-sm text-gray-500">Hành động này không thể hoàn tác</p>
                </div>
              </div>
              
              <div className="mb-6">
                <p className="text-gray-700 mb-2">
                  Bạn có chắc chắn muốn xóa tài khoản này không?
                </p>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-violet-100 rounded-full flex items-center justify-center">
                      <Users className="h-5 w-5 text-violet-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{userToDelete.fullName}</p>
                      <p className="text-sm text-gray-500">@{userToDelete.username}</p>
                      <span className={`inline-flex items-center px-2 py-1 text-xs rounded-full mt-1 ${getRoleColor(userToDelete.roleCode)}`}>
                        {getRoleLabel(userToDelete.roleCode)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={cancelDeleteUser}
                  disabled={loading}
                >
                  Hủy
                </Button>
                <Button
                  variant="destructive"
                  onClick={confirmDeleteUser}
                  disabled={loading}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Đang xóa...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Xóa tài khoản
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default UserManagement 