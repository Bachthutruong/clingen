import React, { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Users, 
  TestTube, 
  TrendingUp,
  UserCheck,
  CheckCircle,
  AlertCircle,
  Calendar,
  DollarSign,
  Activity,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { dashboardApi, notificationApi, WebSocketService } from '@/services/api'
import RoleTest from '@/components/RoleTest'

interface DashboardStats {
  date: string
  totalPatients: number
  totalRevenue: number
  completedTests: number
  totalTests: number
  completionRate: number
  avgRevenuePerPatient: number
  avgRevenuePerTest: number
  pendingTests: number
  monthlyGrowth: number
}

const Dashboard: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState<number>(0)
  const [stats, setStats] = useState<DashboardStats>({
    date: new Date().toISOString().split('T')[0],
    totalPatients: 0,
    totalRevenue: 0,
    completedTests: 0,
    totalTests: 0,
    completionRate: 0,
    avgRevenuePerPatient: 0,
    avgRevenuePerTest: 0,
    pendingTests: 0,
    monthlyGrowth: 0
  })
  const [isLoading, setIsLoading] = useState(true)

  // Load notifications (REST) and subscribe (WS)
  useEffect(() => {
    let ws: WebSocketService | null = null
    const loadInitial = async () => {
      try {
        const list = await notificationApi.getAll({ page: 0, size: 5, sortBy: 'createdAt', sortDir: 'desc' })
        const content = Array.isArray(list?.content) ? list.content : []
        setNotifications(content)
        const count = await notificationApi.getUnreadCount()
        setUnreadCount(typeof count === 'number' ? count : 0)
      } catch (e) {
        // ignore
      }
    }
    const connectWs = async () => {
      try {
        ws = new WebSocketService()
        await ws.connect()
        ws.subscribeToNotifications((n: any) => {
          setNotifications(prev => [n, ...prev].slice(0, 5))
        })
        ws.subscribeToUnreadCount((c: any) => {
          const num = typeof c === 'number' ? c : (c?.count ?? 0)
          setUnreadCount(num)
        })
        ws.sendSubscribeToNotifications()
        ws.getUnreadCount()
      } catch (_) {
        // ws optional
      }
    }
    loadInitial()
    connectWs()
    return () => { ws?.disconnect() }
  }, [])

  useEffect(() => {
    const loadStats = async () => {
      setIsLoading(true)
      try {
        console.log('Loading dashboard data from /dashboard/today API...')
        
        // Load today's stats from the new API
        const todayStats = await dashboardApi.getTodayStats()
        console.log('Today stats from API:', todayStats)
        console.log('API Response structure:', {
          totalPatients: todayStats.totalPatients,
          totalRevenue: todayStats.totalRevenue,
          completedTests: todayStats.completedTests,
          totalTests: todayStats.totalTests
        })
        
        // Set stats from API response
        const newStats = {
          date: todayStats.date,
          totalPatients: todayStats.totalPatients,
          totalRevenue: todayStats.totalRevenue,
          completedTests: todayStats.completedTests,
          totalTests: todayStats.totalTests,
          completionRate: todayStats.completionRate,
          avgRevenuePerPatient: todayStats.avgRevenuePerPatient,
          avgRevenuePerTest: todayStats.avgRevenuePerTest,
          pendingTests: todayStats.totalTests - todayStats.completedTests, // Calculate pending tests
          monthlyGrowth: 15.2 // This would need more complex calculation
        }
        
        console.log('Setting stats to:', newStats)
        setStats(newStats)
      } catch (error) {
        console.error('Error loading dashboard stats:', error)
        // Fallback to default values
        setStats({
          date: new Date().toISOString().split('T')[0],
          totalPatients: 0,
          totalRevenue: 0,
          completedTests: 0,
          totalTests: 0,
          completionRate: 0,
          avgRevenuePerPatient: 0,
          avgRevenuePerTest: 0,
          pendingTests: 0,
          monthlyGrowth: 0
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadStats()
  }, [])

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Chào buổi sáng'
    if (hour < 18) return 'Chào buổi chiều'
    return 'Chào buổi tối'
  }

  // Helper function to check if user has access to a role
  const hasRoleAccess = (requiredRoles: string[]) => {
    if (!user?.role) return false
    return requiredRoles.includes(user.role)
  }

  const getStatsForRole = () => {
    const baseStats = [
      {
        title: 'Số lượng bệnh nhân hôm nay',
        value: stats.totalPatients,
        icon: <Users className="h-8 w-8 text-blue-600" />,
        color: 'from-blue-500 to-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        roles: ['admin', 'receptionist'],
        trend: '+12%',
        trendUp: true
      },
      {
        title: 'Tổng doanh thu hôm nay',
        value: formatCurrency(stats.totalRevenue),
        icon: <DollarSign className="h-8 w-8 text-green-600" />,
        color: 'from-green-500 to-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        roles: ['admin', 'accountant'],
        trend: '+8.5%',
        trendUp: true
      },
      {
        title: 'Xét nghiệm hoàn thành hôm nay',
        value: stats.completedTests,
        icon: <CheckCircle className="h-8 w-8 text-emerald-600" />,
        color: 'from-emerald-500 to-emerald-600',
        bgColor: 'bg-emerald-50',
        borderColor: 'border-emerald-200',
        roles: ['admin', 'lab_technician'],
        trend: '+15%',
        trendUp: true
      }
    ]

    return baseStats.filter(stat => 
      !stat.roles || hasRoleAccess(stat.roles)
    )
  }

  const getQuickActions = () => {
    const actions = [
      {
        title: 'Tiếp đón bệnh nhân mới',
        description: 'Đăng ký thông tin và dịch vụ xét nghiệm',
        href: '/reception',
        icon: <UserCheck className="h-8 w-8" />,
        color: 'from-blue-500 to-blue-600',
        roles: ['admin', 'receptionist']
      },
      {
        title: 'Quản lý xét nghiệm',
        description: 'Cập nhật kết quả và trạng thái xét nghiệm',
        href: '/lab',
        icon: <TestTube className="h-8 w-8" />,
        color: 'from-purple-500 to-purple-600',
        roles: ['admin', 'lab_technician']
      },
      {
        title: 'Báo cáo doanh thu',
        description: 'Xem báo cáo và thống kê tài chính',
        href: '/reports',
        icon: <TrendingUp className="h-8 w-8" />,
        color: 'from-green-500 to-green-600',
        roles: ['admin', 'accountant']
      },
      {
        title: 'Danh sách bệnh nhân',
        description: 'Tìm kiếm và quản lý thông tin bệnh nhân',
        href: '/patients',
        icon: <Users className="h-8 w-8" />,
        color: 'from-indigo-500 to-indigo-600',
        roles: ['admin', 'receptionist', 'lab_technician']
      }
    ]

    return actions.filter(action => 
      !action.roles || hasRoleAccess(action.roles)
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="animate-pulse">
          <div className="h-12 bg-gradient-to-r from-blue-400 to-blue-600 rounded-2xl w-1/3 mb-4"></div>
          <div className="h-6 bg-gradient-to-r from-blue-300 to-blue-500 rounded-xl w-1/2"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-40 bg-gradient-to-r from-gray-200 to-gray-300 rounded-2xl"></div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-48 bg-gradient-to-r from-gray-200 to-gray-300 rounded-2xl"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 p-2">
      {/* Welcome Section with enhanced design */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 rounded-3xl p-8 text-white shadow-2xl">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>
        
        <div className="relative z-10">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
              <Sparkles className="h-8 w-8 text-yellow-300" />
            </div>
            <div>
              <h1 className="text-4xl font-bold mb-2">
                {getGreeting()}, {user?.name}! 👋
              </h1>
              <p className="text-blue-100 text-xl font-medium">
                Hôm nay là {formatDate(new Date())}. Chúc bạn một ngày làm việc hiệu quả!
              </p>
            </div>
          </div>
          
          {/* Quick stats in welcome section */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="text-center p-4 bg-white/10 rounded-2xl backdrop-blur-sm">
              <p className="text-2xl font-bold">{stats.totalPatients}</p>
              <p className="text-blue-100 text-sm">Bệnh nhân hôm nay</p>
            </div>
            <div className="text-center p-4 bg-white/10 rounded-2xl backdrop-blur-sm">
              <p className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</p>
              <p className="text-blue-100 text-sm">Doanh thu hôm nay</p>
            </div>
            <div className="text-center p-4 bg-white/10 rounded-2xl backdrop-blur-sm">
              <p className="text-2xl font-bold">{stats.completedTests}</p>
              <p className="text-blue-100 text-sm">Xét nghiệm hoàn thành</p>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {getStatsForRole().map((stat, index) => (
          <Card key={index} className="group bg-white shadow-lg hover:shadow-2xl transition-all duration-500 border-0 overflow-hidden transform hover:-translate-y-2">
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.color}`}></div>
            <CardContent className="p-6 pt-8">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-2xl bg-gradient-to-r ${stat.color} shadow-lg`}>
                  {stat.icon}
                </div>
                <div className="flex items-center space-x-1 text-sm">
                  {stat.trendUp ? (
                    <ArrowUpRight className="h-4 w-4 text-green-600" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 text-red-600" />
                  )}
                  <span className={`font-semibold ${stat.trendUp ? 'text-green-600' : 'text-red-600'}`}>
                    {stat.trend}
                  </span>
                </div>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-3xl font-bold text-gray-900">
                  {typeof stat.value === 'number' && stat.title !== 'Doanh thu hôm nay' 
                    ? stat.value.toLocaleString() 
                    : stat.value
                  }
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Enhanced Quick Actions */}
      <div>
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl">
            <Activity className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Thao tác nhanh</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {getQuickActions().map((action, index) => (
            <Card 
              key={index} 
              className="group bg-white shadow-lg hover:shadow-2xl transition-all duration-500 cursor-pointer border-0 overflow-hidden transform hover:-translate-y-2 hover:scale-105"
              onClick={() => navigate(action.href)}
            >
              <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${action.color}`}></div>
              <CardContent className="p-6 pt-8">
                <div className="text-center space-y-4">
                  <div className={`mx-auto p-4 bg-gradient-to-r ${action.color} rounded-2xl shadow-lg transform group-hover:scale-110 transition-transform duration-300`}>
                    {action.icon}
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {action.title}
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {action.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Role Test Component with enhanced styling */}
      <Card className="bg-gradient-to-r from-gray-50 to-gray-100 shadow-lg border-0">
        <CardHeader className="border-b border-gray-200">
          <CardTitle className="flex items-center space-x-3 text-xl font-semibold text-gray-900">
            <div className="p-2 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
            <span>Kiểm tra phân quyền người dùng</span>
          </CardTitle>
          <CardDescription className="text-gray-600">
            Xem thông tin chi tiết về vai trò và quyền hạn của tài khoản hiện tại
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <RoleTest />
        </CardContent>
      </Card>

      {/* Enhanced Notifications Section */}
      <Card className="bg-white shadow-lg border-0 overflow-hidden">
        <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-orange-50 to-red-50">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl">
                <AlertCircle className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-semibold text-gray-900">
                Thông báo hệ thống
              </span>
            </div>
            {unreadCount > 0 && (
              <div className="flex items-center space-x-2">
                <div className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">
                  {unreadCount} chưa đọc
                </div>
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {notifications.length === 0 ? (
              <div className="text-center py-12">
                <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <AlertCircle className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-gray-500 text-lg font-medium">Chưa có thông báo nào</p>
                <p className="text-gray-400 text-sm">Hệ thống sẽ hiển thị thông báo quan trọng tại đây</p>
              </div>
            ) : (
              notifications.map((n, idx) => (
                <div 
                  key={n.id ?? idx} 
                  className={`group p-4 rounded-2xl border-l-4 transition-all duration-300 hover:shadow-md ${
                    n.read 
                      ? 'bg-gray-50 border-gray-300 hover:bg-gray-100' 
                      : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-500 hover:from-blue-100 hover:to-indigo-100'
                  }`}
                >
                  <div className="flex items-start space-x-4">
                    <div className={`w-3 h-3 rounded-full mt-2 flex-shrink-0 transition-all duration-300 ${
                      n.read ? 'bg-gray-400' : 'bg-blue-500 group-hover:scale-125'
                    }`}></div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-gray-900 text-sm">
                          {n.title || n.type || 'Thông báo hệ thống'}
                        </h4>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          n.read 
                            ? 'bg-gray-200 text-gray-600' 
                            : 'bg-blue-200 text-blue-700'
                        }`}>
                          {n.read ? 'Đã đọc' : 'Mới'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {n.message || n.content || 'Không có nội dung chi tiết'}
                      </p>
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <Calendar className="h-3 w-3" />
                        <span>{n.createdAt ? formatDate(new Date(n.createdAt)) : 'Vừa xong'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Dashboard 