import { useState, useEffect } from 'react'
import { HiOutlineExternalLink, HiOutlineCheckCircle, HiOutlineExclamation, HiOutlineRefresh } from 'react-icons/hi'
import api from '../services/api'
import toast from 'react-hot-toast'

const Settings = () => {
  const [connected, setConnected] = useState(false)
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)

  const checkConnection = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/settings/google-ads-status')
      setConnected(data.data?.connected || false)
    } catch {
      setConnected(false)
    }
    setLoading(false)
  }

  useEffect(() => { checkConnection() }, [])

  const handleConnect = async () => {
    setConnecting(true)
    try {
      const { data } = await api.get('/settings/google-ads-auth-url')
      if (data.data?.url) {
        window.open(data.data.url, '_blank')
        toast.success('Complete the authorization in the new tab')
      } else {
        toast.error('Auth URL not configured yet')
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to get auth URL')
    }
    setConnecting(false)
  }

  const handleDisconnect = async () => {
    try {
      await api.post('/settings/google-ads-disconnect')
      setConnected(false)
      toast.success('Google Ads disconnected')
    } catch {
      toast.error('Failed to disconnect')
    }
  }

  return (
    <div>
      <div className="card max-w-3xl">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Google Ads Connection</h2>

        {/* How it works */}
        <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-5 mb-6 border border-gray-100 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">How it works</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600 dark:text-gray-300">
            <li>Click "Connect with Google" below.</li>
            <li>Sign in with the Gmail account that has access to your Google Ads manager account.</li>
            <li>Grant permission — you'll be redirected back automatically.</li>
          </ol>
        </div>

        {/* Connection Status */}
        {loading ? (
          <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl mb-6">
            <HiOutlineRefresh className="w-5 h-5 text-gray-400 animate-spin" />
            <span className="text-sm text-gray-500 dark:text-gray-400">Checking connection status...</span>
          </div>
        ) : connected ? (
          <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl mb-6 border border-green-100 dark:border-green-800/30">
            <HiOutlineCheckCircle className="w-6 h-6 text-green-500" />
            <div>
              <p className="font-semibold text-green-700 dark:text-green-400">Connected</p>
              <p className="text-sm text-green-600 dark:text-green-500">Your Google Ads account is linked and active.</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl mb-6 border border-yellow-100 dark:border-yellow-800/30">
            <HiOutlineExclamation className="w-6 h-6 text-yellow-500" />
            <div>
              <p className="font-semibold text-yellow-700 dark:text-yellow-400">Not Connected</p>
              <p className="text-sm text-yellow-600 dark:text-yellow-500">Connect your Google Ads account to get started.</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          {connected ? (
            <>
              <button
                onClick={handleConnect}
                disabled={connecting}
                className="btn-primary flex items-center gap-2"
              >
                <HiOutlineExternalLink className="w-4 h-4" />
                {connecting ? 'Connecting...' : 'Reconnect with Google'}
              </button>
              <button
                onClick={handleDisconnect}
                className="px-4 py-2 rounded-lg border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-sm font-medium"
              >
                Disconnect
              </button>
            </>
          ) : (
            <button
              onClick={handleConnect}
              disabled={connecting}
              className="btn-primary flex items-center gap-2"
            >
              <HiOutlineExternalLink className="w-4 h-4" />
              {connecting ? 'Connecting...' : 'Connect with Google'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default Settings
