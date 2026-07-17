import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../services/api'

export const fetchCampaigns = createAsyncThunk('campaigns/fetchAll', async (params, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/campaigns', { params })
    return data
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch campaigns')
  }
})

export const updateCampaign = createAsyncThunk('campaigns/update', async ({ id, ...data }, { rejectWithValue }) => {
  try {
    const { data: res } = await api.put(`/campaigns/${id}`, data)
    return res.data
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to update campaign')
  }
})

export const deleteCampaign = createAsyncThunk('campaigns/delete', async (id, { rejectWithValue }) => {
  try {
    await api.delete(`/campaigns/${id}`)
    return id
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to delete campaign')
  }
})

const campaignSlice = createSlice({
  name: 'campaigns',
  initialState: {
    campaigns: [],
    pagination: null,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCampaigns.pending, (state) => { state.loading = true; state.error = null })
      .addCase(fetchCampaigns.fulfilled, (state, action) => {
        state.loading = false
        state.campaigns = action.payload.data
        state.pagination = action.payload.pagination
      })
      .addCase(fetchCampaigns.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(updateCampaign.fulfilled, (state, action) => {
        const index = state.campaigns.findIndex(c => c._id === action.payload._id)
        if (index !== -1) state.campaigns[index] = action.payload
      })
      .addCase(deleteCampaign.fulfilled, (state, action) => {
        state.campaigns = state.campaigns.filter(c => c._id !== action.payload)
      })
  },
})

export default campaignSlice.reducer
