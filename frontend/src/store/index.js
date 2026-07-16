import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import accountReducer from './slices/accountSlice'
import campaignReducer from './slices/campaignSlice'
import dashboardReducer from './slices/dashboardSlice'
import notificationReducer from './slices/notificationSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    accounts: accountReducer,
    campaigns: campaignReducer,
    dashboard: dashboardReducer,
    notifications: notificationReducer,
  },
})
