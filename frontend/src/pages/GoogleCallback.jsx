import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import api from '../services/api'
import toast from 'react-hot-toast'

const GoogleCallback = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [status, setStatus] = useState('processing')
  const [debugInfo, setDebugInfo] = useState({})

  useEffect(() => {
    const fullUrl = window.location.href
    const queryParams = new URLSearchParams(location.search)
    const hashParams = new URLSearchParams(location.hash.replace('#', '?'))

    const allParams = {}
    for (const [k, v] of queryParams.entries()) allParams[k] = v
    for (const [k, v] of hashParams.entries()) allParams[k] = v

    setDebugInfo({ fullUrl, params: allParams, paramCount: Object.keys(allParams).length })

    const refreshToken = allParams.google_refresh_token || allParams.refresh_token || allParams.refreshToken || allParams.token
    const accessToken = allParams.access_token || allParams.accessToken
    const code = allParams.code

    const bestToken = refreshToken || accessToken || code

    if (!bestToken && Object.keys(allParams).length === 0) {
      setStatus('no_params')
      return
    }

    const saveTokens = async () => {
      try {
        await api.post('/google-ads/my-google-connect', {
          refresh_token: bestToken,
        })
        setStatus('success')
        toast.success('Google Ads connected successfully!')
        setTimeout(() => navigate('/settings'), 2000)
      } catch (err) {
        setStatus('error')
        toast.error(err.response?.data?.message || 'Failed to save connection')
      }
    }

    if (bestToken) {
      saveTokens()
    } else {
      setStatus('no_token_in_params')
    }
  }, [location, navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-2xl w-full">
        {status === 'processing' && (
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Connecting Google Ads...</h2>
          </div>
        )}
        {status === 'success' && (
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </div>
            <h2 className="text-lg font-semibold text-green-700 dark:text-green-400">Connected!</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Redirecting to settings...</p>
          </div>
        )}
        {(status === 'no_params' || status === 'no_token_in_params' || status === 'error') && (
          <div>
            <div className="text-center mb-6">
              <h2 className="text-lg font-semibold text-yellow-700 dark:text-yellow-400">
                {status === 'error' ? 'Save Failed' : 'Debug Info'}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Screenshot this page and send it</p>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <p className="font-semibold text-gray-700 dark:text-gray-300 mb-1">Full URL:</p>
                <p className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg break-all text-gray-600 dark:text-gray-400 select-all">{debugInfo.fullUrl}</p>
              </div>
              <div>
                <p className="font-semibold text-gray-700 dark:text-gray-300 mb-1">Params found ({debugInfo.paramCount}):</p>
                <pre className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg break-all text-gray-600 dark:text-gray-400 overflow-x-auto select-all">{JSON.stringify(debugInfo.params, null, 2)}</pre>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => navigate('/settings')} className="btn-primary flex-1">Go to Settings</button>
              <button onClick={() => window.location.reload()} className="btn-secondary flex-1">Retry</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default GoogleCallback
