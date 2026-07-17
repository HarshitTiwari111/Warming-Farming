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
  const { stats, charts, loading } = useSelector((state) => state.dashboard)
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
