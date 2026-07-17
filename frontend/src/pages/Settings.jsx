import { useState, useEffect } from 'react'
import { HiOutlineCheckCircle, HiOutlineExclamation, HiOutlineRefresh } from 'react-icons/hi'
import api from '../services/api'
import toast from 'react-hot-toast'

const GOOGLE_AUTH_URL = 'https://secure.dataram.workers.dev/auth/login'

const Settings = () => {
  const [connected, setConnected] = useState(false)
  const [tokenInfo, setTokenInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [mccIds, setMccIds] = useState([])
  const [newMccId, setNewMccId] = useState('')
  const [savingMcc, setSavingMcc] = useState(false)

  const checkConnection = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/settings/google-ads-status')
      setConnected(data.data?.connected || false)
      setTokenInfo(data.data)
      if (data.data?.mccIds?.length) setMccIds(data.data.mccIds)
    } catch {
      setConnected(false)
    }
    setLoading(false)
  }

  useEffect(() => { checkConnection() }, [])

  const handleAddMcc = async () => {
    const id = newMccId.trim()
    if (!id || id.length !== 10) return toast.error('MCC ID must be 10 digits')
    if (mccIds.includes(id)) return toast.error('MCC ID already added')
    const updated = [...mccIds, id]
    setSavingMcc(true)
    try {
      await api.post('/settings/google-ads-mcc-ids', { mccIds: updated })
      setMccIds(updated)
      setNewMccId('')
      toast.success('MCC ID added')
    } catch {
      toast.error('Failed to save MCC ID')
    }
    setSavingMcc(false)
  }

  const handleRemoveMcc = async (id) => {
    const updated = mccIds.filter(m => m !== id)
    setSavingMcc(true)
    try {
      await api.post('/settings/google-ads-mcc-ids', { mccIds: updated })
      setMccIds(updated)
      toast.success('MCC ID removed')
    } catch {
      toast.error('Failed to remove MCC ID')
    }
    setSavingMcc(false)
  }

  const handleConnect = () => {
    const returnUrl = `${window.location.origin}/google-callback`
    window.location.href = `${GOOGLE_AUTH_URL}?return_url=${encodeURIComponent(returnUrl)}`
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

        <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-5 mb-6 border border-gray-100 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">How it works</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600 dark:text-gray-300">
            <li>Click "Connect with Google" below.</li>
            <li>Sign in with the Gmail account that has access to your Google Ads manager account.</li>
            <li>Grant permission — you'll be redirected back automatically.</li>
          </ol>
        </div>

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

        {connected && tokenInfo && (
          <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4 mb-6 border border-gray-100 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm">Token Details</h3>
            {tokenInfo.refreshToken && (
              <div className="mb-2">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Refresh Token: </span>
                <code className="text-xs bg-gray-200 dark:bg-gray-600 px-2 py-0.5 rounded text-gray-700 dark:text-gray-300">{tokenInfo.refreshToken}</code>
              </div>
            )}
            {tokenInfo.rawParams && Object.keys(tokenInfo.rawParams).length > 0 && (
              <div>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">OAuth Params Received:</span>
                <pre className="text-xs bg-gray-200 dark:bg-gray-600 p-2 rounded mt-1 overflow-x-auto text-gray-700 dark:text-gray-300">{JSON.stringify(tokenInfo.rawParams, null, 2)}</pre>
              </div>
            )}
          </div>
        )}

        <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4 mb-6 border border-gray-100 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm">MCC (Manager Account) IDs</h3>
          {mccIds.length > 0 && (
            <div className="space-y-2 mb-3">
              {mccIds.map((id) => (
                <div key={id} className="flex items-center justify-between p-2.5 bg-white dark:bg-gray-600/30 rounded-lg border border-gray-200 dark:border-gray-600">
                  <span className="font-mono text-sm text-gray-800 dark:text-gray-200">{id}</span>
                  <button
                    onClick={() => handleRemoveMcc(id)}
                    disabled={savingMcc}
                    className="text-red-500 hover:text-red-700 text-xs font-medium disabled:opacity-50"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={newMccId}
              onChange={(e) => setNewMccId(e.target.value.replace(/\D/g, ''))}
              placeholder="e.g. 8331500921"
              className="input-field flex-1 font-mono"
              maxLength={10}
            />
            <button
              onClick={handleAddMcc}
              disabled={savingMcc || newMccId.length !== 10}
              className="btn-primary whitespace-nowrap disabled:opacity-50"
            >
              {savingMcc ? 'Saving...' : 'Add MCC ID'}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2">Add your Google Ads Manager Account IDs (10 digits each). All MCC accounts will be synced.</p>
        </div>

        <div className="flex flex-wrap gap-3">
          {connected ? (
            <>
              <button onClick={handleConnect} className="btn-primary flex items-center gap-2">
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Reconnect with Google
              </button>
              <button
                onClick={handleDisconnect}
                className="px-4 py-2 rounded-lg border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-sm font-medium"
              >
                Disconnect
              </button>
            </>
          ) : (
            <button onClick={handleConnect} className="btn-primary flex items-center gap-2">
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Connect with Google
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default Settings
