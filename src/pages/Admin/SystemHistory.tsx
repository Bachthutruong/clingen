import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  History, 
  Search, 
  Download,
//   Filter,
  RefreshCw,
  // Calendar,
  User,
  Activity,
  AlertTriangle,
  CheckCircle,
  Info,
  XCircle,
  Shield,
  Database,
  Settings,
  FileText,
  Clock,
  TrendingUp,
  BarChart3,
  // Eye,
  Trash2
} from 'lucide-react'
import { formatDateTime } from '@/lib/utils'

interface SystemLog {
  id: string
  timestamp: string
  level: 'info' | 'warning' | 'error' | 'critical'
  category: 'auth' | 'data' | 'system' | 'security' | 'api' | 'backup'
  action: string
  description: string
  userId?: string
  userName?: string
  ipAddress?: string
  userAgent?: string
  affectedResource?: string
  details?: any
  success: boolean
}

interface SystemStats {
  totalLogs: number
  todayLogs: number
  errorRate: number
  topUsers: { userId: string; userName: string; count: number }[]
  topActions: { action: string; count: number }[]
  systemHealth: 'good' | 'warning' | 'critical'
}

const SystemHistory: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [levelFilter, setLevelFilter] = useState<string>('')
  const [categoryFilter, setCategoryFilter] = useState<string>('')
  const [dateFrom, setDateFrom] = useState('2024-01-01')
  const [dateTo, setDateTo] = useState('2024-01-31')
  const [selectedLog, setSelectedLog] = useState<SystemLog | null>(null)

  // Mock data cho system logs
  const [systemLogs] = useState<SystemLog[]>([
    {
      id: 'LOG001',
      timestamp: '2024-01-25T10:30:15',
      level: 'info',
      category: 'auth',
      action: 'login',
      description: 'User logged in successfully',
      userId: 'USER001',
      userName: 'Nguyễn Văn Admin',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      success: true
    },
    {
      id: 'LOG002',
      timestamp: '2024-01-25T10:25:30',
      level: 'warning',
      category: 'security',
      action: 'failed_login',
      description: 'Multiple failed login attempts detected',
      ipAddress: '192.168.1.105',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      details: { attempts: 5, username: 'admin123' },
      success: false
    },
    {
      id: 'LOG003',
      timestamp: '2024-01-25T10:20:45',
      level: 'info',
      category: 'data',
      action: 'patient_create',
      description: 'New patient record created',
      userId: 'USER002',
      userName: 'Nguyễn Thu Thảo',
      ipAddress: '192.168.1.101',
      affectedResource: 'Patient ID: BN001',
      details: { patientName: 'Nguyễn Văn A', patientCode: 'BN001' },
      success: true
    },
    {
      id: 'LOG004',
      timestamp: '2024-01-25T10:15:20',
      level: 'error',
      category: 'system',
      action: 'database_error',
      description: 'Database connection timeout',
      details: { 
        error: 'Connection timeout after 30 seconds',
        database: 'clinic_db',
        query: 'SELECT * FROM test_results WHERE...'
      },
      success: false
    },
    {
      id: 'LOG005',
      timestamp: '2024-01-25T10:10:00',
      level: 'info',
      category: 'backup',
      action: 'backup_complete',
      description: 'Daily backup completed successfully',
      details: { 
        fileSize: '1.2GB',
        duration: '15 minutes',
        location: '/backups/2024-01-25/'
      },
      success: true
    },
    {
      id: 'LOG006',
      timestamp: '2024-01-25T09:45:30',
      level: 'critical',
      category: 'security',
      action: 'unauthorized_access',
      description: 'Unauthorized access attempt to admin panel',
      ipAddress: '203.162.10.5',
      userAgent: 'Python-requests/2.25.1',
      details: { 
        endpoint: '/admin/users',
        blocked: true,
        threat_level: 'high'
      },
      success: false
    },
    {
      id: 'LOG007',
      timestamp: '2024-01-25T09:30:15',
      level: 'info',
      category: 'api',
      action: 'api_request',
      description: 'Test result API request processed',
      userId: 'USER003',
      userName: 'Lê Văn Hùng',
      ipAddress: '192.168.1.102',
      affectedResource: 'Test Result ID: TR001',
      success: true
    },
    {
      id: 'LOG008',
      timestamp: '2024-01-25T08:15:45',
      level: 'warning',
      category: 'system',
      action: 'high_memory_usage',
      description: 'System memory usage above 85%',
      details: { 
        currentUsage: '7.2GB',
        totalMemory: '8GB',
        percentage: 90
      },
      success: false
    },
    {
      id: 'LOG009',
      timestamp: '2024-01-25T08:00:00',
      level: 'info',
      category: 'system',
      action: 'system_startup',
      description: 'System started successfully',
      details: { 
        uptime: '0 minutes',
        version: '1.0.0',
        environment: 'production'
      },
      success: true
    }
  ])

  const [systemStats] = useState<SystemStats>({
    totalLogs: 245,
    todayLogs: 35,
    errorRate: 12.5,
    topUsers: [
      { userId: 'USER002', userName: 'Nguyễn Thu Thảo', count: 45 },
      { userId: 'USER003', userName: 'Lê Văn Hùng', count: 32 },
      { userId: 'USER001', userName: 'Nguyễn Văn Admin', count: 28 },
      { userId: 'USER004', userName: 'Phạm Thị Mai', count: 18 }
    ],
    topActions: [
      { action: 'login', count: 89 },
      { action: 'patient_create', count: 34 },
      { action: 'test_result', count: 28 },
      { action: 'invoice_create', count: 22 }
    ],
    systemHealth: 'warning'
  })

  const filteredLogs = systemLogs.filter(log => {
    const matchesSearch = 
      log.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.userName && log.userName.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesLevel = !levelFilter || log.level === levelFilter
    const matchesCategory = !categoryFilter || log.category === categoryFilter
    
    let matchesDate = true
    if (dateFrom && dateTo) {
      const logDate = new Date(log.timestamp)
      const fromDate = new Date(dateFrom)
      const toDate = new Date(dateTo)
      matchesDate = logDate >= fromDate && logDate <= toDate
    }

    return matchesSearch && matchesLevel && matchesCategory && matchesDate
  })

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'info': return 'bg-blue-100 text-blue-800'
      case 'warning': return 'bg-yellow-100 text-yellow-800'
      case 'error': return 'bg-red-100 text-red-800'
      case 'critical': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'info': return <Info size={14} />
      case 'warning': return <AlertTriangle size={14} />
      case 'error': return <XCircle size={14} />
      case 'critical': return <Shield size={14} />
      default: return <Info size={14} />
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'auth': return <User size={16} />
      case 'data': return <Database size={16} />
      case 'system': return <Settings size={16} />
      case 'security': return <Shield size={16} />
      case 'api': return <Activity size={16} />
      case 'backup': return <FileText size={16} />
      default: return <Activity size={16} />
    }
  }

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'auth': return 'Xác thực'
      case 'data': return 'Dữ liệu'
      case 'system': return 'Hệ thống'
      case 'security': return 'Bảo mật'
      case 'api': return 'API'
      case 'backup': return 'Sao lưu'
      default: return category
    }
  }

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'good': return 'text-green-600'
      case 'warning': return 'text-yellow-600'
      case 'critical': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getHealthLabel = (health: string) => {
    switch (health) {
      case 'good': return 'Tốt'
      case 'warning': return 'Cảnh báo'
      case 'critical': return 'Nghiêm trọng'
      default: return health
    }
  }

  const handleViewLog = (log: SystemLog) => {
    setSelectedLog(log)
  }

  const handleExportLogs = () => {
    alert('Xuất logs thành công!')
  }

  const handleClearLogs = () => {
    if (confirm('Bạn có chắc chắn muốn xóa các logs cũ?')) {
      alert('Xóa logs cũ thành công!')
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-amber-600 to-amber-700 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-white/20 rounded-xl">
              <History size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Lịch sử hệ thống</h1>
              <p className="text-amber-100">Theo dõi hoạt động và sự kiện hệ thống</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button 
              onClick={handleExportLogs}
              className="bg-white text-amber-600 hover:bg-gray-100"
            >
              <Download size={16} className="mr-2" />
              Xuất logs
            </Button>
            <Button 
              onClick={() => window.location.reload()}
              className="bg-white text-amber-600 hover:bg-gray-100"
            >
              <RefreshCw size={16} className="mr-2" />
              Làm mới
            </Button>
          </div>
        </div>
      </div>

      {/* System Health and Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card className="shadow-lg border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tổng logs</p>
                <p className="text-2xl font-bold text-blue-600">{systemStats.totalLogs}</p>
                <p className="text-xs text-gray-500">Hôm nay: {systemStats.todayLogs}</p>
              </div>
              <Database className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tỷ lệ lỗi</p>
                <p className="text-2xl font-bold text-red-600">{systemStats.errorRate}%</p>
                <p className="text-xs text-gray-500">24h qua</p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Sức khỏe HT</p>
                <p className={`text-2xl font-bold ${getHealthColor(systemStats.systemHealth)}`}>
                  {getHealthLabel(systemStats.systemHealth)}
                </p>
                <p className="text-xs text-gray-500">Hiện tại</p>
              </div>
              <Activity className={`h-8 w-8 ${getHealthColor(systemStats.systemHealth)}`} />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0 md:col-span-2">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Người dùng hoạt động nhiều nhất</h3>
              <TrendingUp className="h-5 w-5 text-gray-400" />
            </div>
            <div className="space-y-2">
              {systemStats.topUsers.slice(0, 3).map((user, index) => (
                <div key={user.userId} className="flex justify-between items-center text-sm">
                  <span className="flex items-center">
                    <span className="w-4 h-4 bg-blue-100 text-blue-600 rounded-full text-xs flex items-center justify-center mr-2">
                      {index + 1}
                    </span>
                    {user.userName}
                  </span>
                  <span className="font-medium">{user.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Controls */}
      <Card className="shadow-lg border-0">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Tìm theo mô tả, hành động, người dùng..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Tất cả mức độ</option>
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="error">Error</option>
              <option value="critical">Critical</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Tất cả danh mục</option>
              <option value="auth">Xác thực</option>
              <option value="data">Dữ liệu</option>
              <option value="system">Hệ thống</option>
              <option value="security">Bảo mật</option>
              <option value="api">API</option>
              <option value="backup">Sao lưu</option>
            </select>

            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              placeholder="Từ ngày"
            />

            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              placeholder="Đến ngày"
            />
          </div>
        </CardContent>
      </Card>

      {/* Logs List and Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Logs List */}
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>System Logs ({filteredLogs.length})</span>
              <Button size="sm" variant="outline" onClick={handleClearLogs}>
                <Trash2 size={14} className="mr-1" />
                Xóa cũ
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredLogs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Không tìm thấy log phù hợp
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredLogs.map(log => (
                  <Card key={log.id} className="border hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => handleViewLog(log)}>
                    <CardContent className="p-3">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex items-center px-2 py-1 text-xs rounded-full ${getLevelColor(log.level)}`}>
                            {getLevelIcon(log.level)}
                            <span className="ml-1 uppercase">{log.level}</span>
                          </span>
                          <div className="flex items-center text-xs text-gray-500">
                            {getCategoryIcon(log.category)}
                            <span className="ml-1">{getCategoryLabel(log.category)}</span>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatDateTime(log.timestamp)}
                        </div>
                      </div>
                      
                      <div className="mb-2">
                        <p className="font-medium text-sm">{log.action}</p>
                        <p className="text-sm text-gray-600 line-clamp-2">{log.description}</p>
                      </div>

                      <div className="flex justify-between items-center text-xs text-gray-500">
                        <div className="flex items-center space-x-3">
                          {log.userName && (
                            <span className="flex items-center">
                              <User size={12} className="mr-1" />
                              {log.userName}
                            </span>
                          )}
                          {log.ipAddress && (
                            <span>{log.ipAddress}</span>
                          )}
                        </div>
                        <div className={`flex items-center ${log.success ? 'text-green-600' : 'text-red-600'}`}>
                          {log.success ? <CheckCircle size={12} /> : <XCircle size={12} />}
                          <span className="ml-1">{log.success ? 'Success' : 'Failed'}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Log Details */}
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Chi tiết Log</span>
              {selectedLog && (
                <Button size="sm" variant="outline" onClick={() => setSelectedLog(null)}>
                  Đóng
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedLog ? (
              <div className="space-y-4">
                {/* Basic Info */}
                <div className="border-b pb-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className={`inline-flex items-center px-2 py-1 text-xs rounded-full ${getLevelColor(selectedLog.level)}`}>
                      {getLevelIcon(selectedLog.level)}
                      <span className="ml-1 uppercase">{selectedLog.level}</span>
                    </span>
                    <div className="flex items-center text-sm text-gray-600">
                      {getCategoryIcon(selectedLog.category)}
                      <span className="ml-1">{getCategoryLabel(selectedLog.category)}</span>
                    </div>
                  </div>
                  <h3 className="font-semibold text-lg">{selectedLog.action}</h3>
                  <p className="text-gray-600">{selectedLog.description}</p>
                </div>

                {/* Timestamp */}
                <div className="border-b pb-4">
                  <h4 className="font-semibold mb-2">Thời gian</h4>
                  <div className="flex items-center text-sm">
                    <Clock size={16} className="text-gray-400 mr-2" />
                    <span>{formatDateTime(selectedLog.timestamp)}</span>
                  </div>
                </div>

                {/* User Info */}
                {selectedLog.userName && (
                  <div className="border-b pb-4">
                    <h4 className="font-semibold mb-2">Người dùng</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center">
                        <User size={16} className="text-gray-400 mr-2" />
                        <span>{selectedLog.userName}</span>
                      </div>
                      {selectedLog.userId && (
                        <div className="text-gray-600">
                          User ID: {selectedLog.userId}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Network Info */}
                {selectedLog.ipAddress && (
                  <div className="border-b pb-4">
                    <h4 className="font-semibold mb-2">Thông tin mạng</h4>
                    <div className="space-y-1 text-sm">
                      <div>
                        <span className="text-gray-600">IP Address:</span>
                        <span className="ml-2 font-mono">{selectedLog.ipAddress}</span>
                      </div>
                      {selectedLog.userAgent && (
                        <div>
                          <span className="text-gray-600">User Agent:</span>
                          <p className="text-xs font-mono bg-gray-100 p-2 rounded mt-1 break-all">
                            {selectedLog.userAgent}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Affected Resource */}
                {selectedLog.affectedResource && (
                  <div className="border-b pb-4">
                    <h4 className="font-semibold mb-2">Tài nguyên liên quan</h4>
                    <p className="text-sm">{selectedLog.affectedResource}</p>
                  </div>
                )}

                {/* Details */}
                {selectedLog.details && (
                  <div className="border-b pb-4">
                    <h4 className="font-semibold mb-2">Chi tiết kỹ thuật</h4>
                    <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto">
                      {JSON.stringify(selectedLog.details, null, 2)}
                    </pre>
                  </div>
                )}

                {/* Status */}
                <div>
                  <h4 className="font-semibold mb-2">Trạng thái</h4>
                  <div className={`flex items-center ${selectedLog.success ? 'text-green-600' : 'text-red-600'}`}>
                    {selectedLog.success ? <CheckCircle size={16} /> : <XCircle size={16} />}
                    <span className="ml-2 font-medium">
                      {selectedLog.success ? 'Thành công' : 'Thất bại'}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <History size={48} className="mx-auto mb-4 text-gray-300" />
                <p>Chọn một log để xem chi tiết</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Actions Chart */}
      <Card className="shadow-lg border-0">
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="mr-2" size={20} />
            Hành động phổ biến
          </CardTitle>
          <CardDescription>Top 10 hành động được thực hiện nhiều nhất</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {systemStats.topActions.map((action, index) => {
              const percentage = (action.count / systemStats.totalLogs) * 100
              return (
                <div key={action.action} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1">
                    <span className="w-6 h-6 bg-amber-100 text-amber-600 rounded-full text-xs flex items-center justify-center font-bold">
                      {index + 1}
                    </span>
                    <span className="font-medium">{action.action}</span>
                    <div className="flex-1 mx-4">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-amber-500 h-2 rounded-full" 
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold">{action.count}</span>
                    <span className="text-xs text-gray-500 ml-1">({percentage.toFixed(1)}%)</span>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default SystemHistory 