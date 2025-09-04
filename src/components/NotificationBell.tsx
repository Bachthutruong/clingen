import React, { useState, useEffect } from 'react'
import { Bell } from 'lucide-react'
import { notificationApi } from '@/services'
import { NotificationCenter } from './NotificationCenter'

export const NotificationBell: React.FC = () => {
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  // Load unread count
  const loadUnreadCount = async () => {
    try {
      const count = await notificationApi.getUnreadCount()
      setUnreadCount(count)
    } catch (error) {
      console.error('Error loading unread count:', error)
    }
  }

  // Load unread notifications
  const loadUnreadNotifications = async () => {
    setLoading(true)
    try {
      const notifications = await notificationApi.getUnread()
      setUnreadCount(notifications.length)
    } catch (error) {
      console.error('Error loading unread notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUnreadCount()
    
    // Poll for updates every 30 seconds
    const interval = setInterval(loadUnreadCount, 30000)
    
    return () => clearInterval(interval)
  }, [])

  const handleBellClick = () => {
    setIsOpen(true)
    loadUnreadNotifications()
  }

  const handleClose = () => {
    setIsOpen(false)
    // Refresh count when closing
    loadUnreadCount()
  }

  return (
    <>
      <button
        onClick={handleBellClick}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
        disabled={loading}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-500"></div>
          </div>
        )}
      </button>

      <NotificationCenter isOpen={isOpen} onClose={handleClose} />
    </>
  )
}
