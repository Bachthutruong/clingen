import React, { useState } from 'react'
import { toast } from 'react-hot-toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
// import { usersApi } from '@/services/api'
import { 
  Users, 
  Search, 
  Plus,
  Edit,
  Trash2,
  Eye,
  UserCheck,
  UserX,
  Shield,
  Key,
  Clock,
  CheckCircle,
  AlertTriangle,
  Mail,
  Phone,
//   Calendar,
  Activity,
  Settings,
//   Filter,
  RefreshCw,
  Lock,
  Unlock,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react'
import { formatDateTime } from '@/lib/utils'

interface User {
  id: string
  username: string
  fullName: string
  email: string
  phone: string
  role: 'admin' | 'receptionist' | 'lab_technician' | 'accountant'
  department: string
  status: 'active' | 'inactive' | 'suspended'
  lastLogin?: string
  createdAt: string
  updatedAt: string
  permissions: string[]
  notes?: string
  profileImage?: string
}

interface UserActivity {
  id: string
  userId: string
  action: string
  description: string
  ipAddress: string
  userAgent: string
  timestamp: string
  success: boolean
}

const UserManagement: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [showActivities, setShowActivities] = useState(false)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [currentPage, setCurrentPage] = useState(0)
  const [pageSize] = useState(10)
  console.log(isAddingNew)

  // Mock data cho người dùng
  const [users] = useState<User[]>([
    {
      id: 'USER001',
      username: 'admin',
      fullName: 'Nguyễn Văn Admin',
      email: 'admin@clinic.com',
      phone: '0123456789',
      role: 'admin',
      department: 'Quản lý',
      status: 'active',
      lastLogin: '2024-01-25T10:30:00',
      createdAt: '2023-01-01T00:00:00',
      updatedAt: '2024-01-25T10:30:00',
      permissions: ['all'],
      notes: 'Tài khoản quản trị viên chính'
    },
    {
      id: 'USER002',
      username: 'ntt.reception',
      fullName: 'Nguyễn Thu Thảo',
      email: 'reception@clinic.com',
      phone: '0987654321',
      role: 'receptionist',
      department: 'Tiếp đón',
      status: 'active',
      lastLogin: '2024-01-25T08:15:00',
      createdAt: '2023-02-15T09:00:00',
      updatedAt: '2024-01-25T08:15:00',
      permissions: ['reception.register', 'reception.service', 'reception.patient'],
      notes: 'Nhân viên tiếp đón chính'
    },
    {
      id: 'USER003',
      username: 'lvh.lab',
      fullName: 'Lê Văn Hùng',
      email: 'lab@clinic.com',
      phone: '0912345678',
      role: 'lab_technician',
      department: 'Xét nghiệm',
      status: 'active',
      lastLogin: '2024-01-25T07:45:00',
      createdAt: '2023-03-01T08:30:00',
      updatedAt: '2024-01-25T07:45:00',
      permissions: ['lab.sample', 'lab.test', 'lab.result'],
      notes: 'Kỹ thuật viên xét nghiệm trưởng'
    },
    {
      id: 'USER004',
      username: 'ptm.accounting',
      fullName: 'Phạm Thị Mai',
      email: 'accounting@clinic.com',
      phone: '0976543210',
      role: 'accountant',
      department: 'Kế toán',
      status: 'active',
      lastLogin: '2024-01-24T16:30:00',
      createdAt: '2023-04-10T10:15:00',
      updatedAt: '2024-01-24T16:30:00',
      permissions: ['finance.report', 'finance.invoice', 'finance.supplier'],
      notes: 'Kế toán trưởng'
    },
    {
      id: 'USER005',
      username: 'tvd.reception',
      fullName: 'Trần Văn Đức',
      email: 'duc.tran@clinic.com',
      phone: '0934567890',
      role: 'receptionist',
      department: 'Tiếp đón',
      status: 'inactive',
      lastLogin: '2024-01-20T17:00:00',
      createdAt: '2023-06-20T11:30:00',
      updatedAt: '2024-01-20T17:00:00',
      permissions: ['reception.register', 'reception.service'],
      notes: 'Tạm thời không làm việc'
    }
  ])

  // Mock data cho hoạt động người dùng
  const [userActivities] = useState<UserActivity[]>([
    {
      id: 'ACT001',
      userId: 'USER001',
      action: 'login',
      description: 'Đăng nhập thành công',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      timestamp: '2024-01-25T10:30:00',
      success: true
    },
    {
      id: 'ACT002',
      userId: 'USER002',
      action: 'patient.register',
      description: 'Đăng ký bệnh nhân mới: Nguyễn Văn A',
      ipAddress: '192.168.1.101',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      timestamp: '2024-01-25T08:30:00',
      success: true
    },
    {
      id: 'ACT003',
      userId: 'USER003',
      action: 'test.result',
      description: 'Nhập kết quả xét nghiệm cho mẫu SM240125001',
      ipAddress: '192.168.1.102',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      timestamp: '2024-01-25T10:15:00',
      success: true
    },
    {
      id: 'ACT004',
      userId: 'USER004',
      action: 'invoice.create',
      description: 'Tạo hóa đơn HD-2024-0005',
      ipAddress: '192.168.1.103',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      timestamp: '2024-01-24T16:45:00',
      success: true
    },
    {
      id: 'ACT005',
      userId: 'USER002',
      action: 'login.failed',
      description: 'Đăng nhập thất bại - Sai mật khẩu',
      ipAddress: '192.168.1.104',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      timestamp: '2024-01-24T07:20:00',
      success: false
    }
  ])

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.phone.includes(searchQuery)

    const matchesRole = !roleFilter || user.role === roleFilter
    const matchesStatus = !statusFilter || user.status === statusFilter

    return matchesSearch && matchesRole && matchesStatus
  })

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Quản trị viên'
      case 'receptionist': return 'Nhân viên tiếp đón'
      case 'lab_technician': return 'Kỹ thuật viên XN'
      case 'accountant': return 'Kế toán'
      default: return role
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800'
      case 'receptionist': return 'bg-blue-100 text-blue-800'
      case 'lab_technician': return 'bg-purple-100 text-purple-800'
      case 'accountant': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'inactive': return 'bg-gray-100 text-gray-800'
      case 'suspended': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <UserCheck size={14} />
      case 'inactive': return <UserX size={14} />
      case 'suspended': return <Lock size={14} />
      default: return <AlertTriangle size={14} />
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Hoạt động'
      case 'inactive': return 'Không hoạt động'
      case 'suspended': return 'Tạm khóa'
      default: return status
    }
  }

  const handleViewUser = (user: User) => {
    setSelectedUser(user)
    setIsEditing(false)
    setShowActivities(false)
    setShowDetailDialog(true)
  }

  const handleEditUser = () => {
    setIsEditing(true)
  }

  const handleSaveUser = () => {
    toast.success('Lưu thông tin người dùng thành công!')
    setIsEditing(false)
  }

  // const handleDeleteUser = (user: User) => {
  //   if (confirm(`Bạn có chắc chắn muốn xóa tài khoản ${user.fullName}?`)) {
  //     alert(`Xóa tài khoản ${user.fullName} thành công!`)
  //   }
  // }

  const handleToggleStatus = (user: User) => {
    const newStatus = user.status === 'active' ? 'inactive' : 'active'
    toast.success(`${newStatus === 'active' ? 'Kích hoạt' : 'Vô hiệu hóa'} tài khoản ${user.fullName} thành công!`)
  }

  const handleResetPassword = (user: User) => {
    if (confirm(`Bạn có chắc chắn muốn reset mật khẩu cho ${user.fullName}?`)) {
      toast.success(`Reset mật khẩu cho ${user.fullName} thành công! Mật khẩu mới đã được gửi qua email.`)
    }
  }

  const handleViewActivities = (user: User) => {
    setSelectedUser(user)
    setShowActivities(true)
    setShowDetailDialog(true)
  }

  const stats = {
    total: users.length,
    active: users.filter(u => u.status === 'active').length,
    inactive: users.filter(u => u.status === 'inactive').length,
    suspended: users.filter(u => u.status === 'suspended').length,
    admins: users.filter(u => u.role === 'admin').length,
    recentLogin: users.filter(u => u.lastLogin && new Date(u.lastLogin) > new Date(Date.now() - 24*60*60*1000)).length
  }

  const getUserActivities = (userId: string) => {
    return userActivities.filter(activity => activity.userId === userId)
  }

  const getActivityIcon = (action: string) => {
    if (action.includes('login')) return <Key size={14} />
    if (action.includes('patient')) return <Users size={14} />
    if (action.includes('test') || action.includes('sample')) return <Activity size={14} />
    if (action.includes('invoice') || action.includes('finance')) return <Clock size={14} />
    return <Settings size={14} />
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
            onClick={() => setIsAddingNew(true)}
            className="bg-white text-violet-600 hover:bg-gray-100"
          >
            <Plus size={16} className="mr-2" />
            Thêm tài khoản
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
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
                <p className="text-xs text-gray-600">Hoạt động</p>
                <p className="text-lg font-bold text-green-600">{stats.active}</p>
              </div>
              <UserCheck className="h-5 w-5 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Không HĐ</p>
                <p className="text-lg font-bold text-gray-600">{stats.inactive}</p>
              </div>
              <UserX className="h-5 w-5 text-gray-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Tạm khóa</p>
                <p className="text-lg font-bold text-red-600">{stats.suspended}</p>
              </div>
              <Lock className="h-5 w-5 text-red-600" />
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
                <p className="text-xs text-gray-600">Online 24h</p>
                <p className="text-lg font-bold text-green-600">{stats.recentLogin}</p>
              </div>
              <Activity className="h-5 w-5 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card className="shadow-lg border-0">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Tìm theo tên, username, email, SĐT..."
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
              <option value="admin">Quản trị viên</option>
              <option value="receptionist">Nhân viên tiếp đón</option>
              <option value="lab_technician">Kỹ thuật viên XN</option>
              <option value="accountant">Kế toán</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="active">Hoạt động</option>
              <option value="inactive">Không hoạt động</option>
              <option value="suspended">Tạm khóa</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* User List - Table */}
      <Card className="shadow-lg border-0">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Danh sách tài khoản ({filteredUsers.length})</span>
            <Button size="sm" onClick={() => window.location.reload()}>
              <RefreshCw size={14} className="mr-1" />
              Làm mới
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredUsers.length === 0 ? (
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
                    <th className="px-4 py-3 text-left font-medium text-gray-900">Phòng ban</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-900">Liên hệ</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-900">Đăng nhập cuối</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-900">Trạng thái</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-900">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredUsers.slice(currentPage * pageSize, (currentPage + 1) * pageSize).map(user => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <div className="font-medium text-gray-900">@{user.username}</div>
                        <div className="text-xs text-gray-500">ID: {user.id}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-medium text-gray-900">{user.fullName}</div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center px-2 py-1 text-xs rounded-full ${getRoleColor(user.role)}`}>
                          {getRoleLabel(user.role)}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-gray-900">{user.department}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-gray-900">{user.email}</div>
                        <div className="text-xs text-gray-500">{user.phone}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-gray-900">
                          {user.lastLogin ? formatDateTime(user.lastLogin) : 'Chưa đăng nhập'}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center px-2 py-1 text-xs rounded-full ${getStatusColor(user.status)}`}>
                          {getStatusIcon(user.status)}
                          <span className="ml-1">{getStatusLabel(user.status)}</span>
                        </span>
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
                            onClick={() => handleViewActivities(user)}
                            className="text-xs"
                          >
                            <Activity size={12} />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleToggleStatus(user)}
                            className="text-xs"
                          >
                            {user.status === 'active' ? <Lock size={12} /> : <Unlock size={12} />}
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
      {filteredUsers.length > pageSize && (
        <div className="flex justify-center items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
            disabled={currentPage === 0}
          >
            <ChevronLeft size={16} />
            Trước
          </Button>
          <span className="text-sm text-gray-600">
            Trang {currentPage + 1} / {Math.ceil(filteredUsers.length / pageSize)}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.min(Math.ceil(filteredUsers.length / pageSize) - 1, currentPage + 1))}
            disabled={currentPage >= Math.ceil(filteredUsers.length / pageSize) - 1}
          >
            Sau
            <ChevronRight size={16} />
          </Button>
        </div>
      )}

      {/* Detail Dialog */}
      {showDetailDialog && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">
                  {showActivities ? 'Hoạt động người dùng' : 'Chi tiết tài khoản'}
                </h2>
                <div className="flex items-center space-x-2">
                  {!showActivities ? (
                    <>
                      {!isEditing ? (
                        <>
                          <Button size="sm" variant="outline" onClick={handleEditUser}>
                            <Edit size={14} className="mr-1" />
                            Sửa
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleResetPassword(selectedUser)}>
                            <Key size={14} className="mr-1" />
                            Reset MK
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleViewActivities(selectedUser)}>
                            <Activity size={14} className="mr-1" />
                            Hoạt động
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
                    <Button size="sm" variant="outline" onClick={() => setShowActivities(false)}>
                      <Eye size={14} className="mr-1" />
                      Chi tiết TK
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => setShowDetailDialog(false)}>
                    <X size={14} />
                  </Button>
                </div>
              </div>

              {showActivities ? (
                <div className="space-y-4">
                  <div className="border-b pb-2">
                    <h3 className="font-semibold">{selectedUser.fullName}</h3>
                    <p className="text-sm text-gray-600">Hoạt động gần đây</p>
                  </div>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {getUserActivities(selectedUser.id).length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        Chưa có hoạt động nào
                      </div>
                    ) : (
                      getUserActivities(selectedUser.id).map(activity => (
                        <div key={activity.id} className="p-3 border rounded-lg">
                          <div className="flex items-start space-x-3">
                            <div className={`p-2 rounded-full ${activity.success ? 'bg-green-100' : 'bg-red-100'}`}>
                              {getActivityIcon(activity.action)}
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between items-start mb-1">
                                <p className="font-medium text-sm">{activity.description}</p>
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                  activity.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>
                                  {activity.success ? 'Thành công' : 'Thất bại'}
                                </span>
                              </div>
                              <p className="text-xs text-gray-600">{formatDateTime(activity.timestamp)}</p>
                              <p className="text-xs text-gray-500">IP: {activity.ipAddress}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Basic Info */}
                  <div className="border-b pb-4">
                    <h3 className="font-semibold text-lg">{selectedUser.fullName}</h3>
                    <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                      <div>
                        <span className="text-gray-600">Username:</span>
                        {isEditing ? (
                          <Input className="mt-1" defaultValue={selectedUser.username} />
                        ) : (
                          <p className="font-medium">@{selectedUser.username}</p>
                        )}
                      </div>
                      <div>
                        <span className="text-gray-600">Họ tên:</span>
                        {isEditing ? (
                          <Input className="mt-1" defaultValue={selectedUser.fullName} />
                        ) : (
                          <p className="font-medium">{selectedUser.fullName}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="border-b pb-4">
                    <h4 className="font-semibold mb-3">Thông tin liên hệ</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center space-x-2">
                        <Mail size={16} className="text-gray-400" />
                        <span className="text-gray-600">Email:</span>
                        {isEditing ? (
                          <Input className="flex-1" defaultValue={selectedUser.email} />
                        ) : (
                          <span className="font-medium">{selectedUser.email}</span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Phone size={16} className="text-gray-400" />
                        <span className="text-gray-600">Điện thoại:</span>
                        {isEditing ? (
                          <Input className="flex-1" defaultValue={selectedUser.phone} />
                        ) : (
                          <span className="font-medium">{selectedUser.phone}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Role and Department */}
                  <div className="border-b pb-4">
                    <h4 className="font-semibold mb-3">Vai trò & Phòng ban</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Vai trò:</span>
                        {isEditing ? (
                          <select className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md" defaultValue={selectedUser.role}>
                            <option value="admin">Quản trị viên</option>
                            <option value="receptionist">Nhân viên tiếp đón</option>
                            <option value="lab_technician">Kỹ thuật viên XN</option>
                            <option value="accountant">Kế toán</option>
                          </select>
                        ) : (
                          <p className="font-medium">{getRoleLabel(selectedUser.role)}</p>
                        )}
                      </div>
                      <div>
                        <span className="text-gray-600">Phòng ban:</span>
                        {isEditing ? (
                          <Input className="mt-1" defaultValue={selectedUser.department} />
                        ) : (
                          <p className="font-medium">{selectedUser.department}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Permissions */}
                  <div className="border-b pb-4">
                    <h4 className="font-semibold mb-3">Quyền hạn</h4>
                    <div className="space-y-2">
                      {selectedUser.permissions.map(permission => (
                        <div key={permission} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span className="text-sm">{permission}</span>
                          {isEditing && (
                            <Button size="sm" variant="outline">
                              <Trash2 size={12} />
                            </Button>
                          )}
                        </div>
                      ))}
                      {isEditing && (
                        <Button size="sm" variant="outline" className="w-full">
                          <Plus size={14} className="mr-1" />
                          Thêm quyền
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Status and Activity */}
                  <div className="border-b pb-4">
                    <h4 className="font-semibold mb-3">Trạng thái</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Trạng thái:</span>
                        <div className="mt-1">
                          <span className={`inline-flex items-center px-2 py-1 text-xs rounded-full ${getStatusColor(selectedUser.status)}`}>
                            {getStatusIcon(selectedUser.status)}
                            <span className="ml-1">{getStatusLabel(selectedUser.status)}</span>
                          </span>
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-600">Đăng nhập cuối:</span>
                        <p className="font-medium">
                          {selectedUser.lastLogin ? formatDateTime(selectedUser.lastLogin) : 'Chưa đăng nhập'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  {selectedUser.notes && (
                    <div className="border-b pb-4">
                      <h4 className="font-semibold mb-2">Ghi chú</h4>
                      {isEditing ? (
                        <textarea
                          className="w-full p-2 border rounded"
                          rows={3}
                          defaultValue={selectedUser.notes}
                        />
                      ) : (
                        <p className="text-sm">{selectedUser.notes}</p>
                      )}
                    </div>
                  )}

                  {/* Created/Updated Info */}
                  <div className="text-sm text-gray-500">
                    <p>Tạo: {formatDateTime(selectedUser.createdAt)}</p>
                    <p>Cập nhật: {formatDateTime(selectedUser.updatedAt)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default UserManagement 