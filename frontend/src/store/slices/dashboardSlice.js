import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../services/api'

export const fetchDashboardStats = createAsyncThunk('dashboard/fetchStats', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/dashboard/stats')
    return data.data
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch dashboard data')
  }
})

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState: {
    stats: null,
    charts: null,
    recentActivity: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardStats.pending, (state) => { state.loading = true })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.loading = false
        state.stats = action.payload?.stats || null
        state.charts = action.payload?.charts || null
        state.recentActivity = action.payload?.recentActivity || []
      })
      .addCase(fetchDashboardStats.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  },
})

export default dashboardSlice.reducer
