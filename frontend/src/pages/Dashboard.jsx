import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchDashboardStats } from '../store/slices/dashboardSlice'
import StatsCard from '../components/UI/StatsCard'
import LoadingSkeleton from '../components/UI/LoadingSkeleton'
import { HiOutlineUserGroup, HiOutlineCheckCircle, HiOutlineClock, HiOutlineSpeakerphone, HiOutlinePause, HiOutlinePlay, HiOutlineCurrencyDollar, HiOutlineLink, HiOutlineUsers, HiOutlineCollection } from 'react-icons/hi'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

const Dashboard = () => {
  const dispatch = useDispatch()
  const { stats, charts, userBreakdown, loading } = useSelector((state) => state.dashboard)
  const { user } = useSelector((state) => state.auth)
  const isAdmin = user?.role === 'admin'

  useEffect(() => { dispatch(fetchDashboardStats()) }, [dispatch])

  if (loading) return <LoadingSkeleton type="cards" rows={8} />

  const statusChartData = charts?.campaignsByStatus?.map(s => ({ name: s._id, value: s.count })) || []
  const typeChartData = charts?.campaignsByType?.map(t => ({ name: t._id, value: t.count })) || []

  return (
    <div>
      {isAdmin && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <StatsCard title="Connected Users" value={`${stats?.connectedUsers || 0} / ${stats?.totalUsers || 0}`} icon={HiOutlineLink} color="green" />
          <StatsCard title="Total Users" value={stats?.totalUsers || 0} icon={HiOutlineUsers} color="blue" />
          <StatsCard title="Total MCC IDs" value={stats?.totalMccIds || 0} icon={HiOutlineCollection} color="purple" />
        </div>
      )}
      <div className={`grid grid-cols-1 sm:grid-cols-2 ${isAdmin ? 'lg:grid-cols-5' : 'lg:grid-cols-4'} gap-4 mb-6`}>
        <StatsCard title="Total Accounts" value={stats?.totalAccounts || 0} icon={HiOutlineUserGroup} color="primary" />
        <StatsCard title="Active Accounts" value={stats?.activeAccounts || 0} icon={HiOutlineCheckCircle} color="green" />
        <StatsCard title="Paused Accounts" value={stats?.pausedAccounts || 0} icon={HiOutlinePause} color="orange" />
        {!isAdmin && <StatsCard title="Pending" value={stats?.pendingAccounts || 0} icon={HiOutlineClock} color="yellow" />}
        <StatsCard title="Daily Budget" value={`₹${stats?.totalDailyBudget || 0}`} icon={HiOutlineCurrencyDollar} color="purple" />
      </div>
      <div className={`grid grid-cols-1 sm:grid-cols-2 ${isAdmin ? 'lg:grid-cols-5' : 'lg:grid-cols-4'} gap-4 mb-6`}>
        <StatsCard title="Total Campaigns" value={stats?.totalCampaigns || 0} icon={HiOutlineSpeakerphone} color="blue" />
        <StatsCard title="Active Campaigns" value={stats?.activeCampaigns || 0} icon={HiOutlinePlay} color="green" />
        <StatsCard title="Paused Campaigns" value={stats?.pausedCampaigns || 0} icon={HiOutlinePause} color="orange" />
        {!isAdmin && <StatsCard title="Daily Budget" value={`₹${stats?.totalDailyBudget || 0}`} icon={HiOutlineCurrencyDollar} color="purple" />}
        {isAdmin && <StatsCard title="Total Spend" value={`₹${stats?.totalSpend || 0}`} icon={HiOutlineCurrencyDollar} color="red" />}
        {isAdmin && <StatsCard title="Draft Campaigns" value={stats?.draftCampaigns || 0} icon={HiOutlineClock} color="yellow" />}
      </div>

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Campaigns by Status</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart><Pie data={statusChartData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>{statusChartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip /><Legend /></PieChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Campaigns by Type</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={typeChartData}><CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" /><XAxis dataKey="name" tick={{ fontSize: 12 }} /><YAxis tick={{ fontSize: 12 }} /><Tooltip /><Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} /></BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
