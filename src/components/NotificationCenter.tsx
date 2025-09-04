import React, { useState, useEffect } from 'react'
import { Bell, X, Check, Trash2, Settings, Search } from 'lucide-react'
import { notificationApi } from '@/services'
import type { Notification, NotificationConfig } from '@/types/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'

interface NotificationCenterProps {
  isOpen: boolean
  onClose: () => void
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<number | null>(null)
  const [showConfig, setShowConfig] = useState(false)
  const [configs, setConfigs] = useState<NotificationConfig[]>([])

  // Load notifications
  const loadNotifications = async () => {
    setLoading(true)
    try {
      const response = await notificationApi.getAll({ page: 0, size: 50 })
      setNotifications(response.content || [])
    } catch (error) {
      console.error('Error loading notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  // Load unread count
  const loadUnreadCount = async () => {
    try {
      const count = await notificationApi.getUnreadCount()
      setUnreadCount(count)
    } catch (error) {
      console.error('Error loading unread count:', error)
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
    if (isOpen) {
      loadNotifications()
      loadUnreadCount()
      loadConfigs()
    }
  }, [isOpen])

  // Mark notification as read
  const markAsRead = async (id: number) => {
    try {
      await notificationApi.markAsRead(id)
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === id ? { ...notif, isRead: true, readAt: new Date().toISOString() } : notif
        )
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
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
      setUnreadCount(0)
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }

  // Delete notification
  const deleteNotification = async (id: number) => {
    try {
      await notificationApi.delete(id)
      setNotifications(prev => prev.filter(notif => notif.id !== id))
      // Update unread count if the deleted notification was unread
      const deletedNotif = notifications.find(notif => notif.id === id)
      if (deletedNotif && !deletedNotif.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }

  // Delete all notifications
  const deleteAllNotifications = async () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa tất cả thông báo?')) {
      try {
        await notificationApi.deleteAll()
        setNotifications([])
        setUnreadCount(0)
      } catch (error) {
        console.error('Error deleting all notifications:', error)
      }
    }
  }

  // Filter notifications
  const filteredNotifications = notifications.filter(notif => {
    const matchesSearch = !searchTerm || 
      notif.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notif.message.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesType = filterType === null || notif.type === filterType
    
    return matchesSearch && matchesType
  })

  // Get priority color
  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 1: return 'text-gray-500'
      case 2: return 'text-blue-500'
      case 3: return 'text-orange-500'
      case 4: return 'text-red-500'
      default: return 'text-gray-500'
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

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Trung tâm thông báo</h2>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowConfig(!showConfig)}
            >
              <Settings className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Controls */}
        <div className="p-4 border-b space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Tìm kiếm thông báo..."
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
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
            >
              <Check className="h-4 w-4 mr-1" />
              Đánh dấu tất cả đã đọc
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={deleteAllNotifications}
              disabled={notifications.length === 0}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Xóa tất cả
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {showConfig ? (
            <div className="p-4">
              <h3 className="text-lg font-medium mb-4">Cài đặt thông báo</h3>
              <div className="space-y-4">
                {configs.map((config) => (
                  <Card key={config.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{config.notificationTypeName}</h4>
                        <p className="text-sm text-gray-500">Loại: {config.notificationType}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={config.enabled}
                            onChange={() => {
                              // TODO: Update config
                            }}
                          />
                          <span className="text-sm">Bật</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={config.realTimeEnabled}
                            onChange={() => {
                              // TODO: Update config
                            }}
                          />
                          <span className="text-sm">Thời gian thực</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={config.emailEnabled}
                            onChange={() => {
                              // TODO: Update config
                            }}
                          />
                          <span className="text-sm">Email</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={config.soundEnabled}
                            onChange={() => {
                              // TODO: Update config
                            }}
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
            <div className="h-full overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="flex items-center justify-center h-32 text-gray-500">
                  Không có thông báo nào
                </div>
              ) : (
                <div className="space-y-2 p-4">
                  {filteredNotifications.map((notification) => (
                    <Card
                      key={notification.id}
                      className={`p-4 cursor-pointer transition-colors ${
                        !notification.isRead ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => !notification.isRead && markAsRead(notification.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className={`font-medium ${!notification.isRead ? 'font-semibold' : ''}`}>
                              {notification.title}
                            </h4>
                            <span className={`text-xs ${getPriorityColor(notification.priority)}`}>
                              {getPriorityText(notification.priority)}
                            </span>
                            {!notification.isRead && (
                              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>{formatDate(notification.createdAt)}</span>
                            <span>Loại: {notification.typeName}</span>
                            {notification.sentBy && <span>Gửi bởi: {notification.sentBy}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 ml-4">
                          {!notification.isRead && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                markAsRead(notification.id)
                              }}
                            >
                              <Check className="h-3 w-3" />
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteNotification(notification.id)
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
