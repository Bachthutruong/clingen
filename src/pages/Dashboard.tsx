import React, { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Users, 
  TestTube, 
  TrendingUp,
  UserCheck,
  Clock,
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
import { patientsApi, patientSamplesApi, revenueApi, notificationApi, WebSocketService } from '@/services/api'
import RoleTest from '@/components/RoleTest'

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
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState<number>(0)
  const [stats, setStats] = useState<DashboardStats>({
    todayRegistrations: 0,
    todayRevenue: 0,
    pendingTests: 0,
    completedTests: 0,
    totalPatients: 0,
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
        // Load real data from APIs
        console.log('Loading dashboard data...')
        
        console.log('Making API calls...')
        
        let patientsResponse, patientSamplesResponse, revenueResponse
        
        try {
          patientsResponse = await patientsApi.getAll({ pageIndex: 0, pageSize: 1 })
          console.log('Patients API response:', patientsResponse)
        } catch (error) {
          console.error('Error fetching patients:', error)
          patientsResponse = { totalElements: 0, content: [] }
        }
        
        try {
          patientSamplesResponse = await patientSamplesApi.getAll({ pageIndex: 0, pageSize: 100 })
          console.log('Patient samples API response:', patientSamplesResponse)
        } catch (error) {
          console.error('Error fetching patient samples:', error)
          patientSamplesResponse = { content: [] }
        }
        
        try {
          // Set default time parameters for revenue API
          const currentDate = new Date()
          const currentMonth = currentDate.getMonth() + 1
          const currentYear = currentDate.getFullYear()
          
          // Calculate first and last day of the month
          const firstDay = new Date(currentYear, currentMonth - 1, 1)
          const lastDay = new Date(currentYear, currentMonth, 0)
          
          // Format dates as DD/MM/YYYY
          const formatDate = (date: Date) => {
            const day = date.getDate().toString().padStart(2, '0')
            const month = (date.getMonth() + 1).toString().padStart(2, '0')
            const year = date.getFullYear()
            return `${day}/${month}/${year}`
          }
          
          const revenueParams = {
            keyword: "",
            status: 0,
            pageIndex: 0,
            pageSize: 100,
            orderCol: "createdAt",
            isDesc: true,
            filterType: 'MONTH',
            fromDate: formatDate(firstDay),
            toDate: formatDate(lastDay),
            month: currentMonth,
            year: currentYear,
            testTypeId: 0,
            referralSourceId: ""
          }
          
          console.log('Revenue API params:', revenueParams)
          revenueResponse = await revenueApi.search(revenueParams)
          console.log('Revenue API response:', revenueResponse)
        } catch (error) {
          console.error('Error fetching revenue:', error)
          console.log('Revenue API failed, using fallback data')
          revenueResponse = { content: [] }
        }
        
        console.log('API responses loaded:')
        console.log('Patients:', patientsResponse)
        console.log('Patient samples:', patientSamplesResponse)
        console.log('Revenue:', revenueResponse)

        // Calculate today's date
        const today = new Date().toISOString().split('T')[0]
        console.log('Today date:', today)
        console.log('Today date type:', typeof today)
        
        // Calculate stats from real data
        const totalPatients = patientsResponse.totalElements || 0
        const allSamples = patientSamplesResponse.content || patientSamplesResponse || []
        
        let pendingTests = 0
        let completedTests = 0
        try {
          pendingTests = allSamples.filter((sample: any) => sample.status === 0 || sample.status === 1).length
          completedTests = allSamples.filter((sample: any) => sample.status === 3).length
        } catch (error) {
          console.error('Error calculating test stats:', error)
        }
        
        // Calculate today's registrations (patients created today)
        let todayRegistrations = 0
        try {
          todayRegistrations = allSamples.filter((sample: any) => {
            const sampleDate = new Date(sample.createdAt || sample.registrationDate).toISOString().split('T')[0]
            return sampleDate === today
          }).length
        } catch (error) {
          console.error('Error calculating today registrations:', error)
        }

        // Calculate today's revenue
        console.log('Revenue response:', revenueResponse)
        console.log('Revenue response type:', typeof revenueResponse)
        console.log('Revenue response keys:', Object.keys(revenueResponse || {}))
        console.log('Revenue content:', revenueResponse.content)
        console.log('Revenue content type:', typeof revenueResponse.content)
        if (revenueResponse.content) {
          console.log('Revenue content length:', revenueResponse.content.length)
          if (revenueResponse.content.length > 0) {
            console.log('First revenue item:', revenueResponse.content[0])
            console.log('First revenue item keys:', Object.keys(revenueResponse.content[0] || {}))
          }
        } else {
          console.log('No revenue content found')
        }
        
        let todayRevenue = 0
        if (revenueResponse?.content && Array.isArray(revenueResponse.content)) {
          todayRevenue = revenueResponse.content.reduce((total: number, revenue: any) => {
            try {
              console.log('Processing revenue item:', revenue)
              
              // Try different date fields
              let revenueDate = null
              console.log('Revenue item date fields:', {
                registrationDate: revenue.registrationDate,
                createdAt: revenue.createdAt,
                date: revenue.date
              })
              
              if (revenue.registrationDate) {
                revenueDate = new Date(revenue.registrationDate).toISOString().split('T')[0]
              } else if (revenue.createdAt) {
                revenueDate = new Date(revenue.createdAt).toISOString().split('T')[0]
              } else if (revenue.date) {
                revenueDate = new Date(revenue.date).toISOString().split('T')[0]
              }
              
              if (revenueDate) {
                console.log('Revenue date:', revenueDate, 'Today:', today, 'Match:', revenueDate === today)
                const amount = Number(revenue.amount) || 0
                console.log('Revenue amount:', revenue.amount, 'Parsed amount:', amount)
                return revenueDate === today ? total + amount : total
              } else {
                console.log('No valid date found for revenue item:', revenue)
                return total
              }
            } catch (error) {
              console.error('Error processing revenue item:', error, revenue)
              return total
            }
          }, 0)
        }

        // Calculate monthly growth (simplified)
        const monthlyGrowth = 15.2 // This would need more complex calculation

        setStats({
          todayRegistrations,
          todayRevenue,
          pendingTests,
          completedTests,
          totalPatients,
          monthlyGrowth
        })
      } catch (error) {
        console.error('Error loading dashboard stats:', error)
        // Fallback to default values
        setStats({
          todayRegistrations: 0,
          todayRevenue: 0,
          pendingTests: 0,
          completedTests: 0,
          totalPatients: 0,
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
        title: 'Đăng ký hôm nay',
        value: stats.todayRegistrations,
        icon: <UserCheck className="h-8 w-8 text-blue-600" />,
        color: 'from-blue-500 to-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        roles: ['admin', 'receptionist'],
        trend: '+12%',
        trendUp: true
      },
      {
        title: 'Doanh thu hôm nay',
        value: formatCurrency(stats.todayRevenue),
        icon: <DollarSign className="h-8 w-8 text-green-600" />,
        color: 'from-green-500 to-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        roles: ['admin', 'accountant'],
        trend: '+8.5%',
        trendUp: true
      },
      {
        title: 'Xét nghiệm chờ',
        value: stats.pendingTests,
        icon: <Clock className="h-8 w-8 text-orange-600" />,
        color: 'from-orange-500 to-orange-600',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200',
        roles: ['admin', 'lab_technician'],
        trend: '-5%',
        trendUp: false
      },
      {
        title: 'Xét nghiệm hoàn thành',
        value: stats.completedTests,
        icon: <CheckCircle className="h-8 w-8 text-emerald-600" />,
        color: 'from-emerald-500 to-emerald-600',
        bgColor: 'bg-emerald-50',
        borderColor: 'border-emerald-200',
        roles: ['admin', 'lab_technician'],
        trend: '+15%',
        trendUp: true
      },
      {
        title: 'Tổng bệnh nhân',
        value: stats.totalPatients,
        icon: <Users className="h-8 w-8 text-purple-600" />,
        color: 'from-purple-500 to-purple-600',
        bgColor: 'bg-purple-50',
        borderColor: 'border-purple-200',
        roles: ['admin', 'receptionist', 'lab_technician'],
        trend: '+3.2%',
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {[...Array(5)].map((_, i) => (
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
              <p className="text-2xl font-bold">{stats.todayRegistrations}</p>
              <p className="text-blue-100 text-sm">Đăng ký hôm nay</p>
            </div>
            <div className="text-center p-4 bg-white/10 rounded-2xl backdrop-blur-sm">
              <p className="text-2xl font-bold">{formatCurrency(stats.todayRevenue)}</p>
              <p className="text-blue-100 text-sm">Doanh thu</p>
            </div>
            <div className="text-center p-4 bg-white/10 rounded-2xl backdrop-blur-sm">
              <p className="text-2xl font-bold">{stats.pendingTests}</p>
              <p className="text-blue-100 text-sm">Xét nghiệm chờ</p>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
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