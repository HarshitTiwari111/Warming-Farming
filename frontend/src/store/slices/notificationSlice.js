import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../services/api'

export const fetchNotifications = createAsyncThunk('notifications/fetchAll', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/notifications/unread')
    return data.data
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch notifications')
  }
})

export const markAsRead = createAsyncThunk('notifications/markRead', async (id, { rejectWithValue }) => {
  try {
    await api.put(`/notifications/${id}/read`)
    return id
  } catch (error) {
    return rejectWithValue(error.response?.data?.message)
  }
})

export const markAllRead = createAsyncThunk('notifications/markAllRead', async (_, { rejectWithValue }) => {
  try {
    await api.put('/notifications/read-all')
    return true
  } catch (error) {
    return rejectWithValue(error.response?.data?.message)
  }
})

const notificationSlice = createSlice({
  name: 'notifications',
  initialState: {
    notifications: [],
    unreadCount: 0,
    loading: false,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.notifications = action.payload
        state.unreadCount = action.payload.length
      })
      .addCase(markAsRead.fulfilled, (state, action) => {
        state.notifications = state.notifications.filter(n => n._id !== action.payload)
        state.unreadCount = Math.max(0, state.unreadCount - 1)
      })
      .addCase(markAllRead.fulfilled, (state) => {
        state.notifications = []
        state.unreadCount = 0
      })
  },
})

export default notificationSlice.reducer
