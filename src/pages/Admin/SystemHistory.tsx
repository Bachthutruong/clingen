import React, { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  History, 
  Search, 
  Download,
  RefreshCw,
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
  Eye,
  Trash2,
  ChevronLeft,
  ChevronRight,
  X,
  Loader2
} from 'lucide-react'
import { formatDateTime } from '@/lib/utils'
import { systemLogApi } from '@/services/api'
import { useAuth } from '@/contexts/AuthContext'

interface SystemLog {
  id: number
  action: string
  actionDescription?: string
  module?: string
  targetId?: string
  targetName?: string
  requestData?: string
  result?: string
  errorMessage?: string
  username?: string
  fullName?: string
  role?: number
  createdAt: string
  updatedAt?: string
  ipAddress?: string
  userAgent?: string
}

interface SystemStats {
  totalLogs: number
  todayLogs: number
  errorRate: number
  topUsers: { username: string; fullName: string; count: number }[]
  topActions: { action: string; count: number }[]
  systemHealth: 'good' | 'warning' | 'critical'
}

const SystemHistory: React.FC = () => {
  const { } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [levelFilter, setLevelFilter] = useState<string>('')
  const [categoryFilter, setCategoryFilter] = useState<string>('')
  const [dateFrom, setDateFrom] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0])
  const [selectedLog, setSelectedLog] = useState<SystemLog | null>(null)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [currentPage, setCurrentPage] = useState(0)
  const [pageSize] = useState(20)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // API state
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([])
  const [systemStats, setSystemStats] = useState<SystemStats>({
    totalLogs: 0,
    todayLogs: 0,
    errorRate: 0,
    topUsers: [],
    topActions: [],
    systemHealth: 'good'
  })
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)

  // Fetch system logs
  const fetchSystemLogs = async () => {
    try {
      setLoading(true)
      
      const searchParams = {
        keyword: searchQuery || undefined,
        pageIndex: currentPage,
        pageSize: pageSize,
        orderCol: 'createdAt',
        isDesc: true,
        startDate: dateFrom ? `${dateFrom}T00:00:00` : undefined,
        endDate: dateTo ? `${dateTo}T23:59:59` : undefined,
        action: levelFilter || undefined,
        module: categoryFilter || undefined
      }

      console.log('Fetching system logs with params:', searchParams)
      
      const response = await systemLogApi.search(searchParams)
      console.log('System logs response:', response)
      
      if (response && Array.isArray(response.content)) {
        setSystemLogs(response.content)
        setTotalPages(response.totalPages || 0)
        setTotalElements(response.totalElements || 0)
      } else {
        setSystemLogs([])
        setTotalPages(0)
        setTotalElements(0)
      }
    } catch (error) {
      console.error('Error fetching system logs:', error)
      toast.error('Không thể tải lịch sử hệ thống')
      setSystemLogs([])
    } finally {
      setLoading(false)
    }
  }

  // Fetch system statistics
  const fetchSystemStats = async () => {
    try {
      const startDate = `${dateFrom}T00:00:00`
      const endDate = `${dateTo}T23:59:59`
      
      const [overallStats, userStats, actionStats] = await Promise.all([
        systemLogApi.getStatsOverall(startDate, endDate),
        systemLogApi.getStatsUsers(startDate, endDate),
        systemLogApi.getStatsActions(startDate, endDate)
      ])

      console.log('Stats responses:', { overallStats, userStats, actionStats })
      console.log('Overall stats structure:', overallStats)
      console.log('User stats structure:', userStats)
      console.log('Action stats structure:', actionStats)

      // Calculate error rate from overall stats
      const errorRate = overallStats?.totalLogs > 0 
        ? ((overallStats?.errorLogs || 0) / overallStats?.totalLogs) * 100 
        : 0

      // Determine system health based on error rate
      let systemHealth: 'good' | 'warning' | 'critical' = 'good'
      if (errorRate > 50) {
        systemHealth = 'critical'
      } else if (errorRate > 20) {
        systemHealth = 'warning'
      }

      const newStats = {
        totalLogs: overallStats?.totalLogs || 0,
        todayLogs: overallStats?.successLogs || 0, // Using successLogs as today's activity
        errorRate: errorRate,
        topUsers: userStats?.userStats || userStats || [],
        topActions: actionStats?.actionStats || actionStats || [],
        systemHealth: systemHealth
      }

      console.log('Setting system stats to:', newStats)
      setSystemStats(newStats)
    } catch (error) {
      console.error('Error fetching system stats:', error)
      // Don't show error toast for stats, just use defaults
    }
  }

  // Load data on component mount and when filters change
  useEffect(() => {
    fetchSystemLogs()
    fetchSystemStats()
  }, [currentPage, searchQuery, levelFilter, categoryFilter, dateFrom, dateTo])

  const getResultColor = (result: string) => {
    switch (result?.toLowerCase()) {
      case 'success': return 'bg-green-100 text-green-800'
      case 'error': 
      case 'failed': return 'bg-red-100 text-red-800'
      case 'warning': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getResultIcon = (result: string) => {
    switch (result?.toLowerCase()) {
      case 'success': return <CheckCircle size={14} />
      case 'error': 
      case 'failed': return <XCircle size={14} />
      case 'warning': return <AlertTriangle size={14} />
      default: return <Info size={14} />
    }
  }

  const getModuleIcon = (module: string) => {
    switch (module?.toLowerCase()) {
      case 'auth': 
      case 'user': return <User size={16} />
      case 'patient': 
      case 'data': return <Database size={16} />
      case 'system': return <Settings size={16} />
      case 'security': return <Shield size={16} />
      case 'api': return <Activity size={16} />
      case 'backup': return <FileText size={16} />
      default: return <Activity size={16} />
    }
  }

  const getModuleLabel = (module: string) => {
    switch (module?.toLowerCase()) {
      case 'auth': return 'Xác thực'
      case 'user': return 'Người dùng'
      case 'patient': return 'Bệnh nhân'
      case 'data': return 'Dữ liệu'
      case 'system': return 'Hệ thống'
      case 'security': return 'Bảo mật'
      case 'api': return 'API'
      case 'backup': return 'Sao lưu'
      default: return module || 'Khác'
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

  const handleViewLog = async (log: SystemLog) => {
    try {
      const logDetails = await systemLogApi.getById(log.id)
      setSelectedLog(logDetails || log)
      setShowDetailDialog(true)
    } catch (error) {
      console.error('Error fetching log details:', error)
    setSelectedLog(log)
    setShowDetailDialog(true)
    }
  }

  const handleExportLogs = () => {
    toast.success('Xuất logs thành công!')
  }

  const handleClearLogs = async () => {
    if (confirm('Bạn có chắc chắn muốn xóa các logs cũ (giữ lại 90 ngày gần nhất)?')) {
      try {
        setSubmitting(true)
        await systemLogApi.cleanup(90)
      toast.success('Xóa logs cũ thành công!')
        await fetchSystemLogs()
        await fetchSystemStats()
      } catch (error) {
        console.error('Error cleaning up logs:', error)
        toast.error('Có lỗi xảy ra khi xóa logs cũ')
      } finally {
        setSubmitting(false)
      }
    }
  }

  const handleRefresh = () => {
    fetchSystemLogs()
    fetchSystemStats()
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
              disabled={submitting}
            >
              <Download size={16} className="mr-2" />
              Xuất logs
            </Button>
            <Button 
              onClick={handleRefresh}
              className="bg-white text-amber-600 hover:bg-gray-100"
              disabled={loading}
            >
              {loading ? <Loader2 size={16} className="mr-2 animate-spin" /> : <RefreshCw size={16} className="mr-2" />}
              Làm mới
            </Button>
          </div>
        </div>
      </div>

      {/* System Health and Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <Card className="shadow-lg border-0">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Tổng logs</p>
                <p className="text-lg font-bold text-blue-600">{systemStats.totalLogs}</p>
                <p className="text-xs text-gray-500">Thành công: {systemStats.todayLogs}</p>
              </div>
              <Database className="h-5 w-5 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Tỷ lệ lỗi</p>
                <p className="text-lg font-bold text-red-600">{Math.round(systemStats.errorRate)}%</p>
                <p className="text-xs text-gray-500">24h qua</p>
              </div>
              <XCircle className="h-5 w-5 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Sức khỏe HT</p>
                <p className={`text-lg font-bold ${getHealthColor(systemStats.systemHealth)}`}>
                  {getHealthLabel(systemStats.systemHealth)}
                </p>
                <p className="text-xs text-gray-500">Hiện tại</p>
              </div>
              <Activity className={`h-5 w-5 ${getHealthColor(systemStats.systemHealth)}`} />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0 md:col-span-2">
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-sm">Người dùng hoạt động nhiều</h4>
              <TrendingUp className="h-4 w-4 text-gray-400" />
            </div>
            <div className="space-y-1">
              {Array.isArray(systemStats.topUsers) && systemStats.topUsers.slice(0, 3).map((user, index) => (
                <div key={user.username} className="flex justify-between items-center text-xs">
                  <span className="flex items-center">
                    <span className="w-3 h-3 bg-blue-100 text-blue-600 rounded-full text-xs flex items-center justify-center mr-1">
                      {index + 1}
                    </span>
                    {user.fullName || user.username}
                  </span>
                  <span className="font-medium">{user.count}</span>
                </div>
              ))}
              {(!Array.isArray(systemStats.topUsers) || systemStats.topUsers.length === 0) && (
                <div className="text-xs text-gray-500">Không có dữ liệu</div>
              )}
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
              <option value="">Tất cả hành động</option>
              <option value="CREATE">Tạo mới</option>
              <option value="UPDATE">Cập nhật</option>
              <option value="DELETE">Xóa</option>
              <option value="LOGIN">Đăng nhập</option>
              <option value="LOGOUT">Đăng xuất</option>
              <option value="VIEW">Xem</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Tất cả module</option>
              <option value="AUTH">Xác thực</option>
              <option value="USER">Người dùng</option>
              <option value="PATIENT">Bệnh nhân</option>
              <option value="SYSTEM">Hệ thống</option>
              <option value="SECURITY">Bảo mật</option>
              <option value="API">API</option>
              <option value="BACKUP">Sao lưu</option>
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

      {/* Logs List - Table */}
      <Card className="shadow-lg border-0">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>System Logs ({totalElements})</span>
            <div className="flex space-x-2">
              <Button size="sm" variant="outline" onClick={handleClearLogs} disabled={submitting}>
                {submitting ? <Loader2 size={14} className="mr-1 animate-spin" /> : <Trash2 size={14} className="mr-1" />}
                Xóa cũ
              </Button>
              <Button size="sm" onClick={handleRefresh} disabled={loading}>
                {loading ? <Loader2 size={14} className="mr-1 animate-spin" /> : <RefreshCw size={14} className="mr-1" />}
                Làm mới
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <Loader2 size={48} className="mx-auto animate-spin text-gray-400" />
              <p className="mt-4 text-gray-500">Đang tải dữ liệu...</p>
            </div>
          ) : systemLogs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Không tìm thấy log phù hợp
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-900">Thời gian</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-900">Kết quả</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-900">Module</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-900">Hành động</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-900">Mô tả</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-900">Người dùng</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-900">Đối tượng</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-900">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {systemLogs.map(log => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <div className="text-sm text-gray-900">{formatDateTime(log.createdAt)}</div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center px-2 py-1 text-xs rounded-full ${getResultColor(log.result || '')}`}>
                          {getResultIcon(log.result || '')}
                          <span className="ml-1">{log.result || 'Unknown'}</span>
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center">
                          {getModuleIcon(log.module || '')}
                          <span className="ml-1 text-sm">{getModuleLabel(log.module || '')}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-medium text-gray-900">{log.action}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-gray-600 max-w-xs truncate" title={log.actionDescription}>
                          {log.actionDescription || 'Không có mô tả'}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        {log.fullName ? (
                          <div>
                            <div className="font-medium text-sm">{log.fullName}</div>
                            <div className="text-xs text-gray-500">{log.username}</div>
                          </div>
                        ) : (
                          <div className="text-xs text-gray-500">{log.username || 'System'}</div>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-gray-600">
                          {log.targetName ? (
                            <div>
                              <div className="font-medium">{log.targetName}</div>
                              <div className="text-xs text-gray-500">ID: {log.targetId}</div>
                            </div>
                          ) : (
                            <div className="text-xs text-gray-500">{log.targetId || '-'}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewLog(log)}
                          className="text-xs"
                        >
                          <Eye size={12} className="mr-1" />
                          Chi tiết
                        </Button>
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
            Trang {currentPage + 1} / {totalPages} ({totalElements} logs)
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
      {showDetailDialog && selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Chi tiết Log</h2>
                <Button size="sm" variant="outline" onClick={() => setShowDetailDialog(false)}>
                  <X size={14} />
                </Button>
              </div>
              
              <div className="space-y-4">
                {/* Basic Info */}
                <div className="border-b pb-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className={`inline-flex items-center px-2 py-1 text-xs rounded-full ${getResultColor(selectedLog.result || '')}`}>
                      {getResultIcon(selectedLog.result || '')}
                      <span className="ml-1">{selectedLog.result || 'Unknown'}</span>
                    </span>
                    <div className="flex items-center text-sm text-gray-600">
                      {getModuleIcon(selectedLog.module || '')}
                      <span className="ml-1">{getModuleLabel(selectedLog.module || '')}</span>
                    </div>
                  </div>
                  <h3 className="font-semibold text-lg">{selectedLog.action}</h3>
                  <p className="text-gray-600">{selectedLog.actionDescription || 'Không có mô tả'}</p>
                </div>

                {/* Timestamp */}
                <div className="border-b pb-4">
                  <h4 className="font-semibold mb-2">Thời gian</h4>
                  <div className="flex items-center text-sm">
                    <Clock size={16} className="text-gray-400 mr-2" />
                    <span>{formatDateTime(selectedLog.createdAt)}</span>
                  </div>
                </div>

                {/* User Info */}
                {selectedLog.fullName && (
                  <div className="border-b pb-4">
                    <h4 className="font-semibold mb-2">Người dùng</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center">
                        <User size={16} className="text-gray-400 mr-2" />
                        <span>{selectedLog.fullName}</span>
                      </div>
                      {selectedLog.username && (
                        <div className="text-gray-600">
                          Username: {selectedLog.username}
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

                {/* Target Info */}
                {selectedLog.targetName && (
                  <div className="border-b pb-4">
                    <h4 className="font-semibold mb-2">Đối tượng thao tác</h4>
                    <div className="text-sm">
                      <div><strong>Tên:</strong> {selectedLog.targetName}</div>
                      {selectedLog.targetId && (
                        <div><strong>ID:</strong> {selectedLog.targetId}</div>
                      )}
                    </div>
                  </div>
                )}

                {/* Request Data */}
                {selectedLog.requestData && (
                  <div className="border-b pb-4">
                    <h4 className="font-semibold mb-2">Dữ liệu request</h4>
                    <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto">
                      {selectedLog.requestData}
                    </pre>
                  </div>
                )}

                {/* Error Message */}
                {selectedLog.errorMessage && (
                  <div className="border-b pb-4">
                    <h4 className="font-semibold mb-2 text-red-600">Thông báo lỗi</h4>
                    <p className="text-sm text-red-600 bg-red-50 p-2 rounded">
                      {selectedLog.errorMessage}
                    </p>
                  </div>
                )}

                {/* Result */}
                <div>
                  <h4 className="font-semibold mb-2">Kết quả</h4>
                  <div className={`flex items-center ${selectedLog.result === 'SUCCESS' ? 'text-green-600' : 'text-red-600'}`}>
                    {selectedLog.result === 'SUCCESS' ? <CheckCircle size={16} /> : <XCircle size={16} />}
                    <span className="ml-2 font-medium">
                      {selectedLog.result === 'SUCCESS' ? 'Thành công' : selectedLog.result || 'Không xác định'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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
            {Array.isArray(systemStats.topActions) && systemStats.topActions.map((action, index) => {
              const percentage = systemStats.totalLogs > 0 ? (action.count / systemStats.totalLogs) * 100 : 0
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
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold">{action.count}</span>
                    <span className="text-xs text-gray-500 ml-1">({Math.round(percentage)}%)</span>
                  </div>
                </div>
              )
            })}
            {(!Array.isArray(systemStats.topActions) || systemStats.topActions.length === 0) && (
              <div className="text-center py-4 text-gray-500">Không có dữ liệu</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default SystemHistory 