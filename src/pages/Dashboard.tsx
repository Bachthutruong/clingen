import React, { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Users, 
  TestTube, 
//   Calendar, 
  TrendingUp,
  UserCheck,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

interface DashboardStats {
  todayRegistrations: number
  todayRevenue: number
  pendingTests: number
  completedTests: number
  totalPatients: number
  monthlyGrowth: number
}

const Dashboard: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState<DashboardStats>({
    todayRegistrations: 0,
    todayRevenue: 0,
    pendingTests: 0,
    completedTests: 0,
    totalPatients: 0,
    monthlyGrowth: 0
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate API call for demo
    const loadStats = async () => {
      setIsLoading(true)
      // Mock data - replace with actual API call
      setTimeout(() => {
        setStats({
          todayRegistrations: 12,
          todayRevenue: 3500000,
          pendingTests: 8,
          completedTests: 25,
          totalPatients: 1247,
          monthlyGrowth: 15.2
        })
        setIsLoading(false)
      }, 1000)
    }

    loadStats()
  }, [])

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Chào buổi sáng'
    if (hour < 18) return 'Chào buổi chiều'
    return 'Chào buổi tối'
  }

  const getStatsForRole = () => {
    const baseStats = [
      {
        title: 'Đăng ký hôm nay',
        value: stats.todayRegistrations,
        icon: <UserCheck className="h-6 w-6 text-blue-600" />,
        color: 'bg-blue-50 border-blue-200',
        roles: ['admin', 'receptionist']
      },
      {
        title: 'Doanh thu hôm nay',
        value: formatCurrency(stats.todayRevenue),
        icon: <TrendingUp className="h-6 w-6 text-green-600" />,
        color: 'bg-green-50 border-green-200',
        roles: ['admin', 'accountant']
      },
      {
        title: 'Xét nghiệm chờ',
        value: stats.pendingTests,
        icon: <Clock className="h-6 w-6 text-orange-600" />,
        color: 'bg-orange-50 border-orange-200',
        roles: ['admin', 'lab_technician']
      },
      {
        title: 'Xét nghiệm hoàn thành',
        value: stats.completedTests,
        icon: <CheckCircle className="h-6 w-6 text-emerald-600" />,
        color: 'bg-emerald-50 border-emerald-200',
        roles: ['admin', 'lab_technician']
      },
      {
        title: 'Tổng bệnh nhân',
        value: stats.totalPatients,
        icon: <Users className="h-6 w-6 text-purple-600" />,
        color: 'bg-purple-50 border-purple-200',
        roles: ['admin', 'receptionist', 'lab_technician']
      }
    ]

    return baseStats.filter(stat => 
      !stat.roles || stat.roles.includes(user?.role || '')
    )
  }

  const getQuickActions = () => {
    const actions = [
      {
        title: 'Tiếp đón bệnh nhân mới',
        description: 'Đăng ký thông tin và dịch vụ xét nghiệm',
        href: '/reception',
        icon: <UserCheck className="h-6 w-6" />,
        roles: ['admin', 'receptionist']
      },
      {
        title: 'Quản lý xét nghiệm',
        description: 'Cập nhật kết quả và trạng thái xét nghiệm',
        href: '/lab',
        icon: <TestTube className="h-6 w-6" />,
        roles: ['admin', 'lab_technician']
      },
      {
        title: 'Báo cáo doanh thu',
        description: 'Xem báo cáo và thống kê tài chính',
        href: '/reports',
        icon: <TrendingUp className="h-6 w-6" />,
        roles: ['admin', 'accountant']
      },
      {
        title: 'Danh sách bệnh nhân',
        description: 'Tìm kiếm và quản lý thông tin bệnh nhân',
        href: '/patients',
        icon: <Users className="h-6 w-6" />,
        roles: ['admin', 'receptionist', 'lab_technician']
      }
    ]

    return actions.filter(action => 
      !action.roles || action.roles.includes(user?.role || '')
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-32 bg-gray-200 rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">
          {getGreeting()}, {user?.name}! 👋
        </h1>
        <p className="text-blue-100 text-lg">
          Hôm nay là {formatDate(new Date())}. Chúc bạn một ngày làm việc hiệu quả!
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {getStatsForRole().map((stat, index) => (
          <Card key={index} className="bg-white shadow-lg hover:shadow-xl transition-all duration-300 border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-500 mb-1">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {typeof stat.value === 'number' && stat.title !== 'Doanh thu hôm nay' 
                      ? stat.value.toLocaleString() 
                      : stat.value
                    }
                  </p>
                </div>
                <div className="ml-4 p-3 rounded-full bg-gradient-to-r from-blue-50 to-blue-100">
                  {stat.icon}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Thao tác nhanh</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {getQuickActions().map((action, index) => (
            <Card 
              key={index} 
              className="bg-white shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group border-0"
              onClick={() => navigate(action.href)}
            >
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl text-white group-hover:shadow-lg transition-shadow">
                    {action.icon}
                  </div>
                  <CardTitle className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {action.title}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 leading-relaxed">
                  {action.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent Activity or Notifications */}
      <Card className="bg-white shadow-lg border-0">
        <CardHeader className="border-b border-gray-100">
          <CardTitle className="flex items-center space-x-3 text-lg font-semibold text-gray-900">
            <div className="p-2 bg-gradient-to-r from-orange-400 to-orange-500 rounded-lg">
              <AlertCircle className="h-5 w-5 text-white" />
            </div>
            <span>Thông báo hệ thống</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-start space-x-4 p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border-l-4 border-blue-500">
              <div className="w-3 h-3 bg-blue-500 rounded-full mt-1 flex-shrink-0"></div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-blue-900 mb-1">
                  Hệ thống sẽ được bảo trì vào 2:00 AM ngày mai
                </p>
                <p className="text-xs text-blue-600">1 giờ trước</p>
              </div>
            </div>
            <div className="flex items-start space-x-4 p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-xl border-l-4 border-green-500">
              <div className="w-3 h-3 bg-green-500 rounded-full mt-1 flex-shrink-0"></div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-green-900 mb-1">
                  Đã cập nhật thành công 5 kết quả xét nghiệm
                </p>
                <p className="text-xs text-green-600">2 giờ trước</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Dashboard 