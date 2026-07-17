import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../services/api'

export const fetchAccounts = createAsyncThunk('accounts/fetchAll', async (params, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/accounts', { params })
    return data
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch accounts')
  }
})

export const createAccount = createAsyncThunk('accounts/create', async (accountData, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/accounts', accountData)
    return data
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to create account')
  }
})

export const bulkCreateAccounts = createAsyncThunk('accounts/bulkCreate', async (accountData, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/accounts/bulk', accountData)
    return data
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to create accounts')
  }
})

export const updateAccount = createAsyncThunk('accounts/update', async ({ id, ...accountData }, { rejectWithValue }) => {
  try {
    const { data } = await api.put(`/accounts/${id}`, accountData)
    return data.data
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to update account')
  }
})

export const deleteAccount = createAsyncThunk('accounts/delete', async (id, { rejectWithValue }) => {
  try {
    await api.delete(`/accounts/${id}`)
    return id
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to delete account')
  }
})

const accountSlice = createSlice({
  name: 'accounts',
  initialState: {
    accounts: [],
    pagination: null,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAccounts.pending, (state) => { state.loading = true; state.error = null })
      .addCase(fetchAccounts.fulfilled, (state, action) => {
        state.loading = false
        state.accounts = action.payload.data
        state.pagination = action.payload.pagination
      })
      .addCase(fetchAccounts.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(createAccount.fulfilled, (state, action) => {
        state.accounts.unshift(action.payload.data)
      })
      .addCase(updateAccount.fulfilled, (state, action) => {
        const index = state.accounts.findIndex(a => a._id === action.payload._id)
        if (index !== -1) state.accounts[index] = action.payload
      })
      .addCase(deleteAccount.fulfilled, (state, action) => {
        state.accounts = state.accounts.filter(a => a._id !== action.payload)
      })
  },
})

export default accountSlice.reducer
