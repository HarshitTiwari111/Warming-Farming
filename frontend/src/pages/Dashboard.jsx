import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { fetchDashboardStats } from '../store/slices/dashboardSlice'
import StatsCard from '../components/UI/StatsCard'
import LoadingSkeleton from '../components/UI/LoadingSkeleton'
import { HiOutlineUserGroup, HiOutlineCheckCircle, HiOutlineClock, HiOutlineSpeakerphone, HiOutlinePause, HiOutlinePlay, HiOutlineCurrencyDollar, HiOutlineLink, HiOutlineUsers, HiOutlineCollection, HiOutlineRefresh, HiOutlineExclamation, HiOutlineCog } from 'react-icons/hi'
import api from '../services/api'
import toast from 'react-hot-toast'

const Dashboard = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { stats, userBreakdown, loading } = useSelector((state) => state.dashboard)
  const { user } = useSelector((state) => state.auth)
  const isAdmin = user?.role === 'admin'
  const [googleStatus, setGoogleStatus] = useState(null)
  const [syncing, setSyncing] = useState(false)

  useEffect(() => { dispatch(fetchDashboardStats()) }, [dispatch])

  useEffect(() => {
    if (!isAdmin) {
      api.get('/google-ads/my-google-status').then(res => setGoogleStatus(res.data.data)).catch(() => {})
    }
  }, [isAdmin])

  const handleQuickSync = async () => {
    setSyncing(true)
    try {
      const { data } = await api.post('/google-ads/my-google-sync')
      toast.success(data.message || 'Sync complete')
      dispatch(fetchDashboardStats())
      const res = await api.get('/google-ads/my-google-status')
      setGoogleStatus(res.data.data)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Sync failed')
    }
    setSyncing(false)
  }

  if (loading) return <LoadingSkeleton type="cards" rows={8} />

  return (
    <div>
      {isAdmin ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <StatsCard title="Connected Users" value={`${stats?.connectedUsers || 0} / ${stats?.totalUsers || 0}`} icon={HiOutlineLink} color="green" />
            <StatsCard title="Total Users" value={stats?.totalUsers || 0} icon={HiOutlineUsers} color="blue" />
            <StatsCard title="Total MCC IDs" value={stats?.totalMccIds || 0} icon={HiOutlineCollection} color="purple" />
            <StatsCard title="Total Accounts" value={stats?.totalAccounts || 0} icon={HiOutlineUserGroup} color="primary" />
            <StatsCard title="Active Accounts" value={stats?.activeAccounts || 0} icon={HiOutlineCheckCircle} color="green" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <StatsCard title="Paused Accounts" value={stats?.pausedAccounts || 0} icon={HiOutlinePause} color="orange" />
            <StatsCard title="Daily Budget" value={`₹${stats?.totalDailyBudget || 0}`} icon={HiOutlineCurrencyDollar} color="purple" />
            <StatsCard title="Total Campaigns" value={stats?.totalCampaigns || 0} icon={HiOutlineSpeakerphone} color="blue" />
            <StatsCard title="Active Campaigns" value={stats?.activeCampaigns || 0} icon={HiOutlinePlay} color="green" />
            <StatsCard title="Paused Campaigns" value={stats?.pausedCampaigns || 0} icon={HiOutlinePause} color="orange" />
          </div>
        </>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatsCard title="Total Accounts" value={stats?.totalAccounts || 0} icon={HiOutlineUserGroup} color="primary" />
            <StatsCard title="Active Accounts" value={stats?.activeAccounts || 0} icon={HiOutlineCheckCircle} color="green" />
            <StatsCard title="Paused Accounts" value={stats?.pausedAccounts || 0} icon={HiOutlinePause} color="orange" />
            <StatsCard title="Pending" value={stats?.pendingAccounts || 0} icon={HiOutlineClock} color="yellow" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatsCard title="Total Campaigns" value={stats?.totalCampaigns || 0} icon={HiOutlineSpeakerphone} color="blue" />
            <StatsCard title="Active Campaigns" value={stats?.activeCampaigns || 0} icon={HiOutlinePlay} color="green" />
            <StatsCard title="Paused Campaigns" value={stats?.pausedCampaigns || 0} icon={HiOutlinePause} color="orange" />
            <StatsCard title="Daily Budget" value={`₹${stats?.totalDailyBudget || 0}`} icon={HiOutlineCurrencyDollar} color="purple" />
          </div>

          {googleStatus && (
            <div className="card mb-6">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">My Google Ads</h3>
                <div className="flex items-center gap-2">
                  {googleStatus.connected && (
                    <button
                      onClick={handleQuickSync}
                      disabled={syncing}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
                    >
                      <HiOutlineRefresh className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                      {syncing ? 'Syncing...' : 'Sync Now'}
                    </button>
                  )}
                  <button
                    onClick={() => navigate('/settings')}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-200 dark:border-gray-600 rounded-lg transition-colors"
                  >
                    <HiOutlineCog className="w-3.5 h-3.5" />
                    Settings
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/30">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${googleStatus.connected ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                    {googleStatus.connected ? (
                      <HiOutlineCheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                    ) : (
                      <HiOutlineExclamation className="w-5 h-5 text-red-500 dark:text-red-400" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Connection</p>
                    <p className={`text-sm font-semibold ${googleStatus.connected ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                      {googleStatus.connected ? 'Connected' : 'Not Connected'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/30">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-blue-100 dark:bg-blue-900/30">
                    <HiOutlineCollection className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">MCC IDs</p>
                    {googleStatus.mccIds?.length > 0 ? (
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        {googleStatus.mccIds.map(id => (
                          <span key={id} className="font-mono text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 px-1.5 py-0.5 rounded">{id}</span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm font-semibold text-gray-400">None</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/30">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-purple-100 dark:bg-purple-900/30">
                    <HiOutlineClock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Last Sync</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {googleStatus.lastSync ? new Date(googleStatus.lastSync).toLocaleString() : 'Never'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {isAdmin && userBreakdown?.length > 0 && (
        <div className="card mb-6">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">User-wise Breakdown</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">User</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Role</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Google Ads</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">MCC IDs</th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Accounts</th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Campaigns</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Last Sync</th>
                </tr>
              </thead>
              <tbody>
                {userBreakdown.map((u) => (
                  <tr key={u._id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{u.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{u.email}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.role === 'admin' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {u.connected ? (
                        <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400 text-xs font-medium">
                          <HiOutlineCheckCircle className="w-4 h-4" /> Connected
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">Not connected</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {u.mccIds?.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {u.mccIds.map(id => (
                            <span key={id} className="font-mono text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 px-1.5 py-0.5 rounded">{id}</span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">{u.accounts.total}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {u.accounts.active > 0 && <span className="text-green-600 dark:text-green-400">{u.accounts.active} active</span>}
                        {u.accounts.active > 0 && u.accounts.paused > 0 && ' · '}
                        {u.accounts.paused > 0 && <span className="text-orange-500">{u.accounts.paused} paused</span>}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">{u.campaigns.total}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {u.campaigns.active > 0 && <span className="text-green-600 dark:text-green-400">{u.campaigns.active} active</span>}
                        {u.campaigns.active > 0 && u.campaigns.paused > 0 && ' · '}
                        {u.campaigns.paused > 0 && <span className="text-orange-500">{u.campaigns.paused} paused</span>}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-500 dark:text-gray-400">
                      {u.lastSync ? new Date(u.lastSync).toLocaleString() : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  )
}

export default Dashboard
