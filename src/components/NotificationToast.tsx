import React, { useState, useEffect } from 'react'
import { X, Bell, AlertCircle, Info, CheckCircle, AlertTriangle } from 'lucide-react'
import { notificationApi } from '@/services'
import type { Notification } from '@/types/api'

interface NotificationToastProps {
  notification: Notification
  onClose: () => void
  onMarkAsRead: (id: number) => void
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  notification,
  onClose,
  onMarkAsRead
}) => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Show toast after a short delay
    const timer = setTimeout(() => setIsVisible(true), 100)
    return () => clearTimeout(timer)
  }, [])

  // Auto close after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose()
    }, 5000)
    return () => clearTimeout(timer)
  }, [])

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(onClose, 300) // Wait for animation to complete
  }

  const handleMarkAsRead = () => {
    onMarkAsRead(notification.id)
    handleClose()
  }

  // Get icon based on notification type
  const getIcon = () => {
    switch (notification.type) {
      case 1: // System
        return <AlertCircle className="h-5 w-5 text-blue-500" />
      case 2: // Patient
        return <Info className="h-5 w-5 text-green-500" />
      case 3: // Test
        return <CheckCircle className="h-5 w-5 text-purple-500" />
      case 4: // Inventory
        return <AlertTriangle className="h-5 w-5 text-orange-500" />
      case 5: // Financial
        return <Bell className="h-5 w-5 text-yellow-500" />
      default:
        return <Bell className="h-5 w-5 text-gray-500" />
    }
  }

  // Get priority color
  const getPriorityColor = () => {
    switch (notification.priority) {
      case 1: return 'border-l-gray-400'
      case 2: return 'border-l-blue-400'
      case 3: return 'border-l-orange-400'
      case 4: return 'border-l-red-400'
      default: return 'border-l-gray-400'
    }
  }

  // Format time
  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    
    if (diff < 60000) return 'Vừa xong'
    if (diff < 3600000) return `${Math.floor(diff / 60000)} phút trước`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} giờ trước`
    return date.toLocaleDateString('vi-VN')
  }

  return (
    <div
      className={`fixed top-4 right-4 z-50 max-w-sm w-full bg-white rounded-lg shadow-lg border-l-4 ${getPriorityColor()} transform transition-all duration-300 ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            {getIcon()}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h4 className="text-sm font-medium text-gray-900 truncate">
                {notification.title}
              </h4>
              <button
                onClick={handleClose}
                className="flex-shrink-0 ml-2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <p className="text-sm text-gray-600 mb-2 line-clamp-2">
              {notification.message}
            </p>
            
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">
                {formatTime(notification.createdAt)}
              </span>
              
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-1 rounded-full ${
                  notification.priority === 1 ? 'bg-gray-100 text-gray-600' :
                  notification.priority === 2 ? 'bg-blue-100 text-blue-600' :
                  notification.priority === 3 ? 'bg-orange-100 text-orange-600' :
                  'bg-red-100 text-red-600'
                }`}>
                  {notification.priorityText}
                </span>
                
                {!notification.isRead && (
                  <button
                    onClick={handleMarkAsRead}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Đánh dấu đã đọc
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Notification Manager Component
interface NotificationManagerProps {
  onNotificationReceived?: (notification: Notification) => void
}

export const NotificationManager: React.FC<NotificationManagerProps> = ({
  onNotificationReceived
}) => {
  const [toasts, setToasts] = useState<Notification[]>([])

  // Check for new notifications periodically
  useEffect(() => {
    const checkForNewNotifications = async () => {
      try {
        const unreadNotifications = await notificationApi.getUnread()
        
        // Filter out notifications that are already shown as toasts
        const newNotifications = unreadNotifications.filter(
          notif => !toasts.some(toast => toast.id === notif.id)
        )
        
        // Show new notifications as toasts
        newNotifications.forEach(notification => {
          setToasts(prev => [...prev, notification])
          onNotificationReceived?.(notification)
        })
      } catch (error) {
        console.error('Error checking for new notifications:', error)
      }
    }

    // Check immediately
    checkForNewNotifications()
    
    // Check every 10 seconds
    const interval = setInterval(checkForNewNotifications, 10000)
    
    return () => clearInterval(interval)
  }, [toasts, onNotificationReceived])

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  const markAsRead = async (id: number) => {
    try {
      await notificationApi.markAsRead(id)
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map(notification => (
        <NotificationToast
          key={notification.id}
          notification={notification}
          onClose={() => removeToast(notification.id)}
          onMarkAsRead={markAsRead}
        />
      ))}
    </div>
  )
}
