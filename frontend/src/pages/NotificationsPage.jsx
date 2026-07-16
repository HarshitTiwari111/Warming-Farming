import { useState, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { markAllRead } from '../store/slices/notificationSlice'
import { HiOutlineBell, HiOutlineCheckCircle, HiOutlineExclamation, HiOutlineX, HiOutlineInformationCircle } from 'react-icons/hi'
import api from '../services/api'
import toast from 'react-hot-toast'

const typeIcons = {
  success: HiOutlineCheckCircle,
  warning: HiOutlineExclamation,
  error: HiOutlineX,
  info: HiOutlineInformationCircle,
}

const typeColors = {
  success: 'text-green-500 bg-green-50',
  warning: 'text-yellow-500 bg-yellow-50',
  error: 'text-red-500 bg-red-50',
  info: 'text-blue-500 bg-blue-50',
}

const NotificationsPage = () => {
  const dispatch = useDispatch()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get('/notifications')
        setNotifications(data.data?.notifications || [])
      } catch { toast.error('Failed to load notifications') }
      setLoading(false)
    }
    load()
  }, [])

  const handleMarkAllRead = async () => {
    await dispatch(markAllRead())
    setNotifications(notifications.map(n => ({ ...n, isRead: true })))
    toast.success('All marked as read')
  }

  const markRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`)
      setNotifications(notifications.map(n => n._id === id ? { ...n, isRead: true } : n))
    } catch {}
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-500 text-sm mt-1">Stay updated on system events</p>
        </div>
        <button onClick={handleMarkAllRead} className="btn-secondary text-xs">Mark All Read</button>
      </div>
      <div className="card">
        {loading ? (
          <div className="animate-pulse space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded" />)}</div>
        ) : notifications.length > 0 ? (
          <div className="space-y-2">
            {notifications.map((n) => {
              const Icon = typeIcons[n.type] || HiOutlineBell
              const color = typeColors[n.type] || typeColors.info
              return (
                <div
                  key={n._id}
                  onClick={() => !n.isRead && markRead(n._id)}
                  className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors ${n.isRead ? 'opacity-60' : 'bg-gray-50 hover:bg-gray-100'}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{n.title}</p>
                    <p className="text-xs text-gray-500">{n.message}</p>
                  </div>
                  <span className="text-xs text-gray-400 whitespace-nowrap">{new Date(n.createdAt).toLocaleString()}</span>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-center py-12 text-gray-500">No notifications</p>
        )}
      </div>
    </div>
  )
}

export default NotificationsPage
