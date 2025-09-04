import React, { useState, useEffect } from 'react'
import { 
  Bell, 
  Search, 
//   Filter, 
  Trash2, 
  Settings, 
  RefreshCw,
  Calendar,
  User,
  AlertTriangle,
  CheckCircle,
  Clock,
//   X
} from 'lucide-react'
import { notificationApi } from '@/services'
import type { Notification, NotificationConfig } from '@/types/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'

export const NotificationManagement: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [configs, setConfigs] = useState<NotificationConfig[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<number | null>(null)
  const [filterPriority, setFilterPriority] = useState<number | null>(null)
  const [filterRead, setFilterRead] = useState<boolean | null>(null)
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
//   const [totalElements, setTotalElements] = useState(0)
  const [selectedNotifications, setSelectedNotifications] = useState<number[]>([])
  const [showConfig, setShowConfig] = useState(false)

  const pageSize = 20

  // Load notifications
  const loadNotifications = async (page: number = 0) => {
    setLoading(true)
    try {
      const response = await notificationApi.getAllAdmin({ 
        page, 
        size: pageSize 
      })
      setNotifications(response)
      setTotalPages(Math.ceil(response.length / pageSize))
    //   setTotalElements(response.length)
    } catch (error) {
      console.error('Error loading notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  // Load notification configs
  const loadConfigs = async () => {
    try {
      const configs = await notificationApi.getConfigs()
      setConfigs(configs)
    } catch (error) {
      console.error('Error loading notification configs:', error)
    }
  }

  useEffect(() => {
    loadNotifications(currentPage)
    loadConfigs()
  }, [currentPage])

  // Mark notification as read
  const markAsRead = async (id: number) => {
    try {
      await notificationApi.markAsRead(id)
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === id ? { ...notif, isRead: true, readAt: new Date().toISOString() } : notif
        )
      )
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead()
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, isRead: true, readAt: new Date().toISOString() }))
      )
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }

  // Delete notification
  const deleteNotification = async (id: number) => {
    try {
      await notificationApi.delete(id)
      setNotifications(prev => prev.filter(notif => notif.id !== id))
      setSelectedNotifications(prev => prev.filter(selectedId => selectedId !== id))
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }

  // Delete selected notifications
  const deleteSelected = async () => {
    if (selectedNotifications.length === 0) return
    
    if (window.confirm(`Bạn có chắc chắn muốn xóa ${selectedNotifications.length} thông báo đã chọn?`)) {
      try {
        await Promise.all(selectedNotifications.map(id => notificationApi.delete(id)))
        setNotifications(prev => prev.filter(notif => !selectedNotifications.includes(notif.id)))
        setSelectedNotifications([])
      } catch (error) {
        console.error('Error deleting selected notifications:', error)
      }
    }
  }

  // Delete all notifications
  const deleteAll = async () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa tất cả thông báo?')) {
      try {
        await notificationApi.deleteAll()
        setNotifications([])
        setSelectedNotifications([])
      } catch (error) {
        console.error('Error deleting all notifications:', error)
      }
    }
  }

  // Cleanup old notifications
  const cleanupOld = async (daysOld: number) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa tất cả thông báo cũ hơn ${daysOld} ngày?`)) {
      try {
        await notificationApi.cleanupOld(daysOld)
        loadNotifications(currentPage)
      } catch (error) {
        console.error('Error cleaning up old notifications:', error)
      }
    }
  }

  // Cleanup expired notifications
  const cleanupExpired = async () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa tất cả thông báo đã hết hạn?')) {
      try {
        await notificationApi.cleanupExpired()
        loadNotifications(currentPage)
      } catch (error) {
        console.error('Error cleaning up expired notifications:', error)
      }
    }
  }

  // Update notification config
  const updateConfig = async (config: NotificationConfig) => {
    try {
      await notificationApi.createConfig({
        notificationType: config.notificationType,
        enabled: config.enabled,
        realTimeEnabled: config.realTimeEnabled,
        emailEnabled: config.emailEnabled,
        soundEnabled: config.soundEnabled
      })
      loadConfigs()
    } catch (error) {
      console.error('Error updating notification config:', error)
    }
  }

  // Filter notifications
  const filteredNotifications = notifications.filter(notif => {
    const matchesSearch = !searchTerm || 
      notif.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notif.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notif.recipientUsername.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesType = filterType === null || notif.type === filterType
    const matchesPriority = filterPriority === null || notif.priority === filterPriority
    const matchesRead = filterRead === null || notif.isRead === filterRead
    
    return matchesSearch && matchesType && matchesPriority && matchesRead
  })

  // Get priority color
  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 1: return 'text-gray-500 bg-gray-100'
      case 2: return 'text-blue-500 bg-blue-100'
      case 3: return 'text-orange-500 bg-orange-100'
      case 4: return 'text-red-500 bg-red-100'
      default: return 'text-gray-500 bg-gray-100'
    }
  }

  // Get priority text
  const getPriorityText = (priority: number) => {
    switch (priority) {
      case 1: return 'Thấp'
      case 2: return 'Trung bình'
      case 3: return 'Cao'
      case 4: return 'Khẩn cấp'
      default: return 'Không xác định'
    }
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN')
  }

  // Toggle selection
  const toggleSelection = (id: number) => {
    setSelectedNotifications(prev => 
      prev.includes(id) 
        ? prev.filter(selectedId => selectedId !== id)
        : [...prev, id]
    )
  }

  // Select all
  const selectAll = () => {
    if (selectedNotifications.length === filteredNotifications.length) {
      setSelectedNotifications([])
    } else {
      setSelectedNotifications(filteredNotifications.map(notif => notif.id))
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Bell className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Quản lý thông báo</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowConfig(!showConfig)}
          >
            <Settings className="h-4 w-4 mr-2" />
            Cài đặt
          </Button>
          <Button
            variant="outline"
            onClick={() => loadNotifications(currentPage)}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>
        </div>
      </div>

      {showConfig ? (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Cài đặt thông báo</h2>
          <div className="grid gap-4">
            {configs.map((config) => (
              <Card key={config.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{config.notificationTypeName}</h3>
                    <p className="text-sm text-gray-500">Loại: {config.notificationType}</p>
                  </div>
                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={config.enabled}
                        onChange={(e) => updateConfig({ ...config, enabled: e.target.checked })}
                      />
                      <span className="text-sm">Bật</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={config.realTimeEnabled}
                        onChange={(e) => updateConfig({ ...config, realTimeEnabled: e.target.checked })}
                      />
                      <span className="text-sm">Thời gian thực</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={config.emailEnabled}
                        onChange={(e) => updateConfig({ ...config, emailEnabled: e.target.checked })}
                      />
                      <span className="text-sm">Email</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={config.soundEnabled}
                        onChange={(e) => updateConfig({ ...config, soundEnabled: e.target.checked })}
                      />
                      <span className="text-sm">Âm thanh</span>
                    </label>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Filters */}
          <Card className="p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Tìm kiếm..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <select
                value={filterType || ''}
                onChange={(e) => setFilterType(e.target.value ? Number(e.target.value) : null)}
                className="px-3 py-2 border rounded-md"
              >
                <option value="">Tất cả loại</option>
                <option value="1">Hệ thống</option>
                <option value="2">Bệnh nhân</option>
                <option value="3">Xét nghiệm</option>
                <option value="4">Kho</option>
                <option value="5">Tài chính</option>
              </select>
              
              <select
                value={filterPriority || ''}
                onChange={(e) => setFilterPriority(e.target.value ? Number(e.target.value) : null)}
                className="px-3 py-2 border rounded-md"
              >
                <option value="">Tất cả mức độ</option>
                <option value="1">Thấp</option>
                <option value="2">Trung bình</option>
                <option value="3">Cao</option>
                <option value="4">Khẩn cấp</option>
              </select>
              
              <select
                value={filterRead === null ? '' : filterRead.toString()}
                onChange={(e) => setFilterRead(e.target.value === '' ? null : e.target.value === 'true')}
                className="px-3 py-2 border rounded-md"
              >
                <option value="">Tất cả trạng thái</option>
                <option value="false">Chưa đọc</option>
                <option value="true">Đã đọc</option>
              </select>
            </div>
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedNotifications.length === filteredNotifications.length && filteredNotifications.length > 0}
                onChange={selectAll}
                className="rounded"
              />
              <span className="text-sm text-gray-600">
                {selectedNotifications.length > 0 
                  ? `${selectedNotifications.length} đã chọn`
                  : 'Chọn tất cả'
                }
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={markAllAsRead}
                disabled={filteredNotifications.filter(n => !n.isRead).length === 0}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Đánh dấu tất cả đã đọc
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={deleteSelected}
                disabled={selectedNotifications.length === 0}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Xóa đã chọn
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={deleteAll}
                disabled={notifications.length === 0}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Xóa tất cả
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => cleanupOld(30)}
              >
                <Clock className="h-4 w-4 mr-1" />
                Dọn dẹp cũ
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={cleanupExpired}
              >
                <AlertTriangle className="h-4 w-4 mr-1" />
                Dọn dẹp hết hạn
              </Button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="space-y-2">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <Card className="p-8 text-center">
                <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Không có thông báo nào</p>
              </Card>
            ) : (
              filteredNotifications.map((notification) => (
                <Card
                  key={notification.id}
                  className={`p-4 transition-colors ${
                    !notification.isRead ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selectedNotifications.includes(notification.id)}
                      onChange={() => toggleSelection(notification.id)}
                      className="mt-1 rounded"
                    />
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className={`font-medium ${!notification.isRead ? 'font-semibold' : ''}`}>
                          {notification.title}
                        </h4>
                        <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(notification.priority)}`}>
                          {getPriorityText(notification.priority)}
                        </span>
                        {!notification.isRead && (
                          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                      
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {notification.recipientUsername}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(notification.createdAt)}
                        </span>
                        <span>Loại: {notification.typeName}</span>
                        {notification.sentBy && <span>Gửi bởi: {notification.sentBy}</span>}
                        {notification.expiresAt && (
                          <span className={notification.isExpired ? 'text-red-500' : ''}>
                            Hết hạn: {formatDate(notification.expiresAt)}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      {!notification.isRead && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => markAsRead(notification.id)}
                        >
                          <CheckCircle className="h-3 w-3" />
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteNotification(notification.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                disabled={currentPage === 0}
              >
                Trước
              </Button>
              
              <span className="text-sm text-gray-600">
                Trang {currentPage + 1} / {totalPages}
              </span>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                disabled={currentPage === totalPages - 1}
              >
                Sau
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
