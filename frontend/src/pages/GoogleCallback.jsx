import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import api from '../services/api'
import toast from 'react-hot-toast'

const GoogleCallback = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [status, setStatus] = useState('processing')

  useEffect(() => {
    const saveTokens = async () => {
      const queryParams = new URLSearchParams(location.search)
      const hashParams = new URLSearchParams(location.hash.replace('#', '?'))

      const allParams = {}
      for (const [k, v] of queryParams.entries()) allParams[k] = v
      for (const [k, v] of hashParams.entries()) allParams[k] = v

      console.log('Google OAuth callback - Full URL:', window.location.href)
      console.log('Google OAuth callback - Query params:', Object.fromEntries(queryParams.entries()))
      console.log('Google OAuth callback - Hash params:', Object.fromEntries(hashParams.entries()))
      console.log('Google OAuth callback - All params:', allParams)

      const refreshToken = allParams.refresh_token || allParams.refreshToken || allParams.token
      const accessToken = allParams.access_token || allParams.accessToken
      const code = allParams.code

      if (!refreshToken && !accessToken && !code && Object.keys(allParams).length === 0) {
        setStatus('no_params')
        toast.error('No token received from Google. Check console for details.')
        setTimeout(() => navigate('/settings'), 3000)
        return
      }

      try {
        await api.post('/settings/google-ads-save-token', {
          refresh_token: refreshToken || code,
          access_token: accessToken,
          raw_params: allParams
        })
        setStatus('success')
        toast.success('Google Ads connected successfully!')
        setTimeout(() => navigate('/settings'), 1500)
      } catch (err) {
        console.error('Save token error:', err)
        setStatus('error')
        toast.error(err.response?.data?.message || 'Failed to save connection')
        setTimeout(() => navigate('/settings'), 2000)
      }
    }

    saveTokens()
  }, [location, navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        {status === 'processing' && (
          <>
            <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Connecting Google Ads...</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Please wait while we save your connection.</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </div>
            <h2 className="text-lg font-semibold text-green-700 dark:text-green-400">Connected!</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Redirecting to settings...</p>
          </>
        )}
        {status === 'no_params' && (
          <>
            <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 3a9 9 0 100 18 9 9 0 000-18z" /></svg>
            </div>
            <h2 className="text-lg font-semibold text-yellow-700 dark:text-yellow-400">No Token Received</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Open browser console (F12) to see the full callback URL. Redirecting to settings...</p>
            <p className="text-xs text-gray-400 mt-3 break-all">{window.location.href}</p>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </div>
            <h2 className="text-lg font-semibold text-red-700 dark:text-red-400">Connection Failed</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Redirecting to settings...</p>
          </>
        )}
      </div>
    </div>
  )
}

export default GoogleCallback
