import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchDashboardStats } from '../store/slices/dashboardSlice'
import StatsCard from '../components/UI/StatsCard'
import LoadingSkeleton from '../components/UI/LoadingSkeleton'
import { HiOutlineUserGroup, HiOutlineCheckCircle, HiOutlineClock, HiOutlineSpeakerphone, HiOutlineCloudUpload, HiOutlineExclamationCircle, HiOutlineCurrencyDollar, HiOutlineFire, HiOutlineTrendingUp } from 'react-icons/hi'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

const Dashboard = () => {
  const dispatch = useDispatch()
  const { stats, charts, loading } = useSelector((state) => state.dashboard)

  useEffect(() => { dispatch(fetchDashboardStats()) }, [dispatch])

  if (loading) return <LoadingSkeleton type="cards" rows={8} />

  const statusChartData = charts?.campaignsByStatus?.map(s => ({ name: s._id, value: s.count })) || []
  const typeChartData = charts?.campaignsByType?.map(t => ({ name: t._id, value: t.count })) || []

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
        <StatsCard title="Total Accounts" value={stats?.totalAccounts || 0} icon={HiOutlineUserGroup} color="primary" />
        <StatsCard title="Active Accounts" value={stats?.activeAccounts || 0} icon={HiOutlineCheckCircle} color="green" />
        <StatsCard title="Pending" value={stats?.pendingAccounts || 0} icon={HiOutlineClock} color="yellow" />
        <StatsCard title="In Warming" value={stats?.warmingAccounts || 0} icon={HiOutlineFire} color="orange" />
        <StatsCard title="Success Rate" value={`${stats?.successRate || 0}%`} icon={HiOutlineTrendingUp} color="green" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard title="Total Campaigns" value={stats?.totalCampaigns || 0} icon={HiOutlineSpeakerphone} color="blue" />
        <StatsCard title="Published" value={stats?.publishedCampaigns || 0} icon={HiOutlineCloudUpload} color="green" />
        <StatsCard title="Failed" value={stats?.failedCampaigns || 0} icon={HiOutlineExclamationCircle} color="red" />
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
