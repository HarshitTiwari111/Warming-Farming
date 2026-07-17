import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { HiOutlineCheckCircle, HiOutlineExclamation, HiOutlineRefresh } from 'react-icons/hi'
import api from '../services/api'
import toast from 'react-hot-toast'

const GOOGLE_AUTH_URL = 'https://secure.dataram.workers.dev/auth/login'

const Settings = () => {
  const { user } = useSelector((state) => state.auth)
  const isAdmin = user?.role === 'admin'

  const [connected, setConnected] = useState(false)
  const [loading, setLoading] = useState(true)
  const [mccIds, setMccIds] = useState([])
  const [newMccId, setNewMccId] = useState('')
  const [savingMcc, setSavingMcc] = useState(false)
  const [lastSync, setLastSync] = useState(null)
  const [allUsers, setAllUsers] = useState([])
  const [loadingUsers, setLoadingUsers] = useState(false)

  const checkConnection = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/google-ads/my-google-status')
      setConnected(data.data?.connected || false)
      setMccIds(data.data?.mccIds || [])
      setLastSync(data.data?.lastSync)
    } catch {
      setConnected(false)
    }
    setLoading(false)
  }

  const loadAllUsers = async () => {
    if (!isAdmin) return
    setLoadingUsers(true)
    try {
      const { data } = await api.get('/google-ads/admin/users-google-status')
      setAllUsers(data.data || [])
    } catch { /* ignore */ }
    setLoadingUsers(false)
  }

  useEffect(() => {
    checkConnection()
    loadAllUsers()
  }, [])

  const handleAddMcc = async () => {
    const id = newMccId.trim()
    if (!id || id.length !== 10) return toast.error('MCC ID must be 10 digits')
    if (mccIds.includes(id)) return toast.error('MCC ID already added')
    const updated = [...mccIds, id]
    setSavingMcc(true)
    try {
      await api.post('/google-ads/my-mcc-ids', { mccIds: updated })
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
      await api.post('/google-ads/my-mcc-ids', { mccIds: updated })
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
      await api.post('/google-ads/my-google-disconnect')
      setConnected(false)
      toast.success('Google Ads disconnected')
    } catch {
      toast.error('Failed to disconnect')
    }
  }

  return (
    <div className="space-y-6">
      {/* Per-user Google Ads Connection */}
      <div className="card max-w-3xl mx-auto sm:mx-0">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Google Ads Connection</h2>

        <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-5 mb-6 border border-gray-100 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">How it works</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600 dark:text-gray-300">
            <li>Click "Connect with Google" below.</li>
            <li>Sign in with the Gmail account that has access to your Google Ads manager account.</li>
            <li>Grant permission — you'll be redirected back automatically.</li>
            <li>Add your MCC ID(s) and click "Sync from Google Ads" on Accounts page.</li>
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
              <p className="text-sm text-green-600 dark:text-green-500">
                Your Google Ads account is linked.
                {lastSync && <span className="ml-2 text-xs">Last sync: {new Date(lastSync).toLocaleString()}</span>}
              </p>
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
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
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
          <p className="text-xs text-gray-400 mt-2">Add your Google Ads Manager Account IDs (10 digits each).</p>
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

      {/* Admin: All Users Google Status */}
      {isAdmin && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">All Users - Google Ads Status</h2>
            <button onClick={loadAllUsers} disabled={loadingUsers} className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1">
              <HiOutlineRefresh className={`w-4 h-4 ${loadingUsers ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>
          {loadingUsers ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">User</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Email</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Role</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Google Ads</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">MCC IDs</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Last Sync</th>
                  </tr>
                </thead>
                <tbody>
                  {allUsers.map((u) => (
                    <tr key={u._id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                      <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">{u.name}</td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-300">{u.email}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.role === 'admin' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {u.googleAdsConnected ? (
                          <span className="flex items-center gap-1 text-green-600 dark:text-green-400 text-xs font-medium">
                            <HiOutlineCheckCircle className="w-4 h-4" /> Connected
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">Not connected</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {u.googleAdsMccIds?.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {u.googleAdsMccIds.map(id => (
                              <span key={id} className="font-mono text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 px-1.5 py-0.5 rounded">{id}</span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-xs text-gray-500 dark:text-gray-400">
                        {u.googleAdsLastSync ? new Date(u.googleAdsLastSync).toLocaleString() : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default Settings
