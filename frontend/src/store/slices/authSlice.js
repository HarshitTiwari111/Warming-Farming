import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../services/api'

const token = localStorage.getItem('token')
const user = localStorage.getItem('user')

export const login = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/login', credentials)
    if (data.requiresTwoFactor) {
      return { requiresTwoFactor: true }
    }
    localStorage.setItem('token', data.data.token)
    if (data.data.refreshToken) localStorage.setItem('refreshToken', data.data.refreshToken)
    localStorage.setItem('user', JSON.stringify(data.data.user))
    return data.data
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Login failed')
  }
})

export const register = createAsyncThunk('auth/register', async (userData, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/register', userData)
    localStorage.setItem('token', data.data.token)
    if (data.data.refreshToken) localStorage.setItem('refreshToken', data.data.refreshToken)
    localStorage.setItem('user', JSON.stringify(data.data.user))
    return data.data
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Registration failed')
  }
})

export const logoutAsync = createAsyncThunk('auth/logout', async (_, { rejectWithValue }) => {
  try {
    const refreshToken = localStorage.getItem('refreshToken')
    await api.post('/auth/logout', { refreshToken })
  } catch (error) {
    // Ignore logout API errors
  } finally {
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
  }
})

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: user ? JSON.parse(user) : null,
    token: token || null,
    isAuthenticated: !!token,
    loading: false,
    error: null,
    requiresTwoFactor: false,
  },
  reducers: {
    logout: (state) => {
      state.user = null
      state.token = null
      state.isAuthenticated = false
      state.requiresTwoFactor = false
    },
    clearError: (state) => {
      state.error = null
    },
    clearTwoFactor: (state) => {
      state.requiresTwoFactor = false
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => { state.loading = true; state.error = null })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false
        if (action.payload.requiresTwoFactor) {
          state.requiresTwoFactor = true
        } else {
          state.isAuthenticated = true
          state.user = action.payload.user
          state.token = action.payload.token
          state.requiresTwoFactor = false
        }
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(register.pending, (state) => { state.loading = true; state.error = null })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false
        state.isAuthenticated = true
        state.user = action.payload.user
        state.token = action.payload.token
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(logoutAsync.fulfilled, (state) => {
        state.user = null
        state.token = null
        state.isAuthenticated = false
        state.requiresTwoFactor = false
      })
  },
})

export const { logout, clearError, clearTwoFactor } = authSlice.actions
export { logoutAsync }
export default authSlice.reducer
