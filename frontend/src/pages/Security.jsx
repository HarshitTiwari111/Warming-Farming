import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { HiOutlineShieldCheck, HiOutlineShieldExclamation, HiOutlineDesktopComputer, HiOutlineClock, HiOutlineTrash, HiOutlineCheckCircle, HiOutlineXCircle } from 'react-icons/hi'
import Modal from '../components/UI/Modal'
import api from '../services/api'
import toast from 'react-hot-toast'

const Security = () => {
  const { user } = useSelector((state) => state.auth)
  const [twoFAEnabled, setTwoFAEnabled] = useState(user?.twoFactorEnabled || false)
  const [showSetup2FA, setShowSetup2FA] = useState(false)
  const [qrCode, setQrCode] = useState('')
  const [secret, setSecret] = useState('')
  const [verifyCode, setVerifyCode] = useState('')
  const [backupCodes, setBackupCodes] = useState([])
  const [showBackupCodes, setShowBackupCodes] = useState(false)
  const [disablePassword, setDisablePassword] = useState('')
  const [showDisable2FA, setShowDisable2FA] = useState(false)

  const [sessions, setSessions] = useState([])
  const [loginHistory, setLoginHistory] = useState([])
  const [loadingSessions, setLoadingSessions] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(false)

  useEffect(() => {
    loadSessions()
    loadHistory()
  }, [])

  const loadSessions = async () => {
    setLoadingSessions(true)
    try {
      const { data } = await api.get('/auth/sessions')
      setSessions(data.data || [])
    } catch { /* ignore */ }
    setLoadingSessions(false)
  }

  const loadHistory = async () => {
    setLoadingHistory(true)
    try {
      const { data } = await api.get('/auth/login-history')
      setLoginHistory(data.data || [])
    } catch { /* ignore */ }
    setLoadingHistory(false)
  }

  const handleSetup2FA = async () => {
    try {
      const { data } = await api.post('/auth/2fa/setup')
      setQrCode(data.data.qrCode)
      setSecret(data.data.secret)
      setShowSetup2FA(true)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to setup 2FA')
    }
  }

  const handleVerify2FA = async () => {
    try {
      const { data } = await api.post('/auth/2fa/verify', { code: verifyCode })
      setBackupCodes(data.data.backupCodes)
      setTwoFAEnabled(true)
      setShowSetup2FA(false)
      setShowBackupCodes(true)
      setVerifyCode('')
      toast.success('2FA enabled successfully')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid code')
    }
  }

  const handleDisable2FA = async () => {
    try {
      await api.post('/auth/2fa/disable', { password: disablePassword })
      setTwoFAEnabled(false)
      setShowDisable2FA(false)
      setDisablePassword('')
      toast.success('2FA disabled')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to disable 2FA')
    }
  }

  const handleRevokeSession = async (index) => {
    try {
      await api.delete(`/auth/sessions/${index}`)
      toast.success('Session revoked')
      loadSessions()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to revoke session')
    }
  }

  const handleLogoutAll = async () => {
    try {
      await api.post('/auth/logout-all')
      toast.success('All sessions revoked. You will be logged out.')
      setTimeout(() => {
        localStorage.removeItem('token')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('user')
        window.location.href = '/login'
      }, 1500)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed')
    }
  }

  const formatDate = (d) => d ? new Date(d).toLocaleString() : '-'

  return (
    <div className="space-y-6 max-w-4xl">
      {/* 2FA Section */}
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          {twoFAEnabled ? <HiOutlineShieldCheck className="w-6 h-6 text-green-500" /> : <HiOutlineShieldExclamation className="w-6 h-6 text-yellow-500" />}
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Two-Factor Authentication (2FA)</h2>
        </div>

        {twoFAEnabled ? (
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-100 dark:border-green-800/30">
            <div className="min-w-0">
              <p className="font-semibold text-green-700 dark:text-green-400">2FA is enabled</p>
              <p className="text-sm text-green-600 dark:text-green-500">Your account is protected with two-factor authentication.</p>
            </div>
            <button onClick={() => setShowDisable2FA(true)} className="px-4 py-2 text-sm font-medium text-red-600 border border-red-300 dark:border-red-700 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors w-full sm:w-auto text-center">
              Disable 2FA
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-100 dark:border-yellow-800/30">
            <div className="min-w-0">
              <p className="font-semibold text-yellow-700 dark:text-yellow-400">2FA is not enabled</p>
              <p className="text-sm text-yellow-600 dark:text-yellow-500">Add an extra layer of security to your account.</p>
            </div>
            <button onClick={handleSetup2FA} className="btn-primary text-sm w-full sm:w-auto text-center">Enable 2FA</button>
          </div>
        )}
      </div>

      {/* Active Sessions */}
      <div className="card">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-3">
            <HiOutlineDesktopComputer className="w-6 h-6 text-blue-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Active Sessions</h2>
          </div>
          {sessions.length > 1 && (
            <button onClick={handleLogoutAll} className="px-3 py-1.5 text-sm font-medium text-red-600 border border-red-300 dark:border-red-700 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
              Revoke All
            </button>
          )}
        </div>

        {loadingSessions ? (
          <div className="flex justify-center py-6"><div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : sessions.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 py-4">No active sessions</p>
        ) : (
          <div className="space-y-3">
            {sessions.map((session, i) => (
              <div key={i} className="flex items-center justify-between gap-2 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-gray-100 dark:border-gray-700">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{session.device || 'Unknown Device'}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Active since {formatDate(session.createdAt)} &middot; Expires {formatDate(session.expiresAt)}
                  </p>
                </div>
                <button onClick={() => handleRevokeSession(i)} className="text-gray-400 hover:text-red-600 transition-colors shrink-0" title="Revoke">
                  <HiOutlineTrash className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Login History */}
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <HiOutlineClock className="w-6 h-6 text-purple-500" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Login History</h2>
        </div>

        {loadingHistory ? (
          <div className="flex justify-center py-6"><div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : loginHistory.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 py-4">No login history available</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-600">
                  <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Status</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Device</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Browser</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">OS</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">IP</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Time</th>
                </tr>
              </thead>
              <tbody>
                {loginHistory.map((entry, i) => (
                  <tr key={i} className="border-b border-gray-100 dark:border-gray-700">
                    <td className="py-2 px-3">
                      {entry.success
                        ? <HiOutlineCheckCircle className="w-5 h-5 text-green-500" />
                        : <HiOutlineXCircle className="w-5 h-5 text-red-500" />
                      }
                    </td>
                    <td className="py-2 px-3 text-gray-900 dark:text-white">{entry.device || '-'}</td>
                    <td className="py-2 px-3 text-gray-600 dark:text-gray-300">{entry.browser || '-'}</td>
                    <td className="py-2 px-3 text-gray-600 dark:text-gray-300">{entry.os || '-'}</td>
                    <td className="py-2 px-3 text-gray-500 dark:text-gray-400 font-mono text-xs">{entry.ip || '-'}</td>
                    <td className="py-2 px-3 text-gray-500 dark:text-gray-400 text-xs">{formatDate(entry.loginAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 2FA Setup Modal */}
      <Modal isOpen={showSetup2FA} onClose={() => setShowSetup2FA(false)} title="Setup Two-Factor Authentication">
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
          </p>
          {qrCode && (
            <div className="flex justify-center p-4 bg-white rounded-lg">
              <img src={qrCode} alt="2FA QR Code" className="w-48 h-48" />
            </div>
          )}
          <div className="p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Manual entry key:</p>
            <p className="font-mono text-sm text-gray-900 dark:text-white break-all select-all">{secret}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Verification Code</label>
            <input type="text" value={verifyCode} onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="Enter 6-digit code" maxLength={6}
              className="input-field text-center font-mono text-lg tracking-[0.3em]" />
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100 dark:border-gray-700">
            <button onClick={() => setShowSetup2FA(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleVerify2FA} disabled={verifyCode.length !== 6} className="btn-primary disabled:opacity-50">Verify & Enable</button>
          </div>
        </div>
      </Modal>

      {/* Backup Codes Modal */}
      <Modal isOpen={showBackupCodes} onClose={() => setShowBackupCodes(false)} title="Backup Codes" size="sm">
        <div className="space-y-4">
          <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800/30">
            <p className="text-sm text-yellow-700 dark:text-yellow-400 font-medium">Save these codes in a safe place!</p>
            <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-1">Each code can only be used once. If you lose access to your authenticator app, use these codes to sign in.</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {backupCodes.map((code, i) => (
              <div key={i} className="p-2 bg-gray-50 dark:bg-gray-700/30 rounded font-mono text-sm text-center text-gray-900 dark:text-white select-all">
                {code}
              </div>
            ))}
          </div>
          <div className="flex justify-end pt-2 border-t border-gray-100 dark:border-gray-700">
            <button onClick={() => setShowBackupCodes(false)} className="btn-primary">I've saved these codes</button>
          </div>
        </div>
      </Modal>

      {/* Disable 2FA Modal */}
      <Modal isOpen={showDisable2FA} onClose={() => setShowDisable2FA(false)} title="Disable 2FA" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">Enter your password to confirm disabling two-factor authentication.</p>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
            <input type="password" value={disablePassword} onChange={(e) => setDisablePassword(e.target.value)}
              className="input-field" required autoComplete="current-password" />
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100 dark:border-gray-700">
            <button onClick={() => setShowDisable2FA(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleDisable2FA} disabled={!disablePassword} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors">Disable 2FA</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default Security
