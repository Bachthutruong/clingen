import React, { useState } from 'react'
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { getRoleDisplayName } from '@/lib/utils'
import { NotificationBell } from '@/components/NotificationBell'
import {
  User,
  LogOut,
  Menu,
  X,
  Home,
  Users,
  TestTube,
//   FileText,
//   BarChart3,
  Settings,
  UserCheck,
  Calculator,
  // Bell
} from 'lucide-react'

interface SubMenuItem {
  label: string
  path: string
  roles?: string[]
}

interface MenuItem {
  icon: React.ReactNode
  label: string
  path: string
  roles?: string[]
  subItems?: SubMenuItem[]
}

const menuItems: MenuItem[] = [
  {
    icon: <Home size={20} />,
    label: 'Dashboard',
    path: '/',
    roles: ['admin', 'receptionist', 'lab_technician', 'accountant']
  },
  {
    icon: <UserCheck size={20} />,
    label: 'Tiếp đón bệnh nhân',
    path: '/reception',
    roles: ['admin', 'receptionist'],
    subItems: [
      { label: 'Nhập thông tin hành chính', path: '/reception/patient-registration', roles: ['admin', 'receptionist'] },
      { label: 'Dịch vụ xét nghiệm', path: '/reception/service-selection', roles: ['admin', 'receptionist'] },
      { label: 'Quản lý nguồn gửi', path: '/reception/referral-sources', roles: ['admin', 'receptionist'] }
    ]
  },
  {
    icon: <Users size={20} />,
    label: 'Danh sách bệnh nhân',
    path: '/patients',
    roles: ['admin', 'receptionist', 'lab_technician']
  },
  {
    icon: <TestTube size={20} />,
    label: 'Quản lý xét nghiệm',
    path: '/lab',
    roles: ['admin', 'lab_technician'],
    subItems: [
      { label: 'Thông tin bệnh nhân', path: '/lab/patient-info', roles: ['admin', 'lab_technician'] },
      { label: 'Trạng thái mẫu', path: '/lab/sample-status', roles: ['admin', 'lab_technician'] },
      { label: 'Kết quả xét nghiệm', path: '/lab/test-results', roles: ['admin', 'lab_technician'] },
      { label: 'Quản lý vật tư', path: '/lab/supply-management', roles: ['admin', 'lab_technician'] },
      { label: 'Quản lý quy cách đóng gói', path: '/lab/packaging-management', roles: ['admin', 'lab_technician'] },
      { label: 'Quản lý kho', path: '/lab/inventory-management', roles: ['admin', 'lab_technician'] },
      { label: 'Quản lý mẫu xét nghiệm', path: '/lab/sample-management', roles: ['admin', 'lab_technician'] },
      { label: 'Thống kê', path: '/lab/statistics', roles: ['admin', 'lab_technician'] }
    ]
  },
  {
    icon: <Calculator size={20} />,
    label: 'Tài chính & Kế toán',
    path: '/finance',
    roles: ['admin', 'accountant'],
    subItems: [
      { label: 'Báo cáo tài chính', path: '/finance/financial-reports', roles: ['admin', 'accountant'] },
      { label: 'Hóa đơn & Thanh toán', path: '/finance/invoice-payments', roles: ['admin', 'accountant'] },
      { label: 'Quản lý nhà cung cấp', path: '/finance/supplier-management', roles: ['admin', 'accountant'] },
      { label: 'Chi phí hàng tháng', path: '/finance/monthly-costs', roles: ['admin', 'accountant'] }
    ]
  },
  {
    icon: <Settings size={20} />,
    label: 'Quản lý hệ thống',
    path: '/admin',
    roles: ['admin'],
    subItems: [
      { label: 'Quản lý tài khoản', path: '/admin/user-management', roles: ['admin'] },
      { label: 'Quản lý thông báo', path: '/admin/notification-management', roles: ['admin'] },
      { label: 'Lịch sử hệ thống', path: '/admin/system-history', roles: ['admin'] }
    ]
  }
]

const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  // Helper function to check if user has access to a role
  const hasRoleAccess = (requiredRoles: string[]) => {
    if (!user?.role) return false
    return requiredRoles.includes(user.role)
  }

  const filteredMenuItems = menuItems.filter(item => 
    !item.roles || hasRoleAccess(item.roles)
  )



  return (
    <div className="h-screen flex overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center p-1">
              <img src="/logo_svg_clinic.svg" alt="ClinGen Logo" className="w-full h-full object-contain" />
            </div>
            <div className="text-white">
              <h1 className="text-xl font-bold leading-tight">ClinGen</h1>
              <p className="text-xs opacity-80">Khám phá Gen</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-white hover:bg-white/10"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={20} />
          </Button>
        </div>

        <nav className="mt-6 flex-1">
          <ul className="space-y-1 px-3">
            {filteredMenuItems.map((item) => {
              const isMainActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/')
              
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                      isMainActive
                        ? 'bg-blue-50 text-blue-700 border-r-4 border-blue-600 shadow-sm'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <div className={`${
                      isMainActive ? 'text-blue-600' : 'text-gray-500'
                    }`}>
                      {item.icon}
                    </div>
                    <span className="font-medium">{item.label}</span>
                  </Link>
                  
                  {/* Submenu items */}
                  {item.subItems && isMainActive && (
                    <ul className="mt-2 space-y-1 ml-4">
                      {item.subItems
                        .filter(subItem => !subItem.roles || hasRoleAccess(subItem.roles || []))
                        .map((subItem) => (
                        <li key={subItem.path}>
                          <Link
                            to={subItem.path}
                            className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm transition-all duration-200 ${
                              location.pathname === subItem.path
                                ? 'bg-blue-100 text-blue-700 font-medium'
                                : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'
                            }`}
                            onClick={() => setSidebarOpen(false)}
                          >
                            <div className="w-2 h-2 rounded-full bg-current opacity-50"></div>
                            <span>{subItem.label}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              )
            })}
          </ul>
        </nav>

        {/* User info */}
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
              <User size={18} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {user?.name}
              </p>
              <p className="text-xs text-blue-600 font-medium">
                {user?.roleCode && getRoleDisplayName(user.roleCode)}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
            onClick={handleLogout}
          >
            <LogOut size={16} className="mr-2" />
            Đăng xuất
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 h-16 flex items-center justify-between px-6">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-gray-600 hover:bg-gray-100"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={20} />
            </Button>
            <div className="hidden lg:block">
              <h2 className="text-lg font-semibold text-gray-800">
                {filteredMenuItems.find(item => item.path === location.pathname)?.label || 'Dashboard'}
              </h2>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <NotificationBell />
            <div className="text-sm text-gray-600">
              Chào mừng, <span className="font-semibold text-blue-600">{user?.name}</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto bg-gray-50">
          <div className="max-w-7xl mx-auto p-6">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  )
}

export default Layout