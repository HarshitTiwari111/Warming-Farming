import { useState, useEffect } from 'react'
import DataTable from '../components/UI/DataTable'
import Pagination from '../components/UI/Pagination'
import SearchBar from '../components/UI/SearchBar'
import api from '../services/api'
import toast from 'react-hot-toast'

const ActivityLogs = () => {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState(null)

  useEffect(() => {
    const loadLogs = async () => {
      setLoading(true)
      try {
        const { data } = await api.get('/activity-logs', { params: { page, limit: 15, search } })
        setLogs(data.data || [])
        setPagination(data.pagination)
      } catch { toast.error('Failed to load logs') }
      setLoading(false)
    }
    loadLogs()
  }, [page, search])

  const columns = [
    { key: 'user', label: 'User', render: (row) => <span className="font-medium">{row.user?.name || 'System'}</span> },
    { key: 'action', label: 'Action', render: (row) => <span className="capitalize">{row.action?.replace(/_/g, ' ')}</span> },
    { key: 'entity', label: 'Entity', render: (row) => <span className="capitalize badge-info">{row.entity}</span> },
    { key: 'details', label: 'Details', render: (row) => <span className="text-gray-500 truncate max-w-xs block">{row.details || '-'}</span> },
    { key: 'ipAddress', label: 'IP', render: (row) => <code className="text-xs">{row.ipAddress || '-'}</code> },
    { key: 'createdAt', label: 'Time', render: (row) => new Date(row.createdAt).toLocaleString() },
  ]

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Activity Logs</h1>
        <p className="text-gray-500 text-sm mt-1">Track all system activities</p>
      </div>
      <div className="card">
        <div className="mb-4"><SearchBar value={search} onChange={(val) => { setSearch(val); setPage(1) }} placeholder="Search logs..." /></div>
        <DataTable columns={columns} data={logs} loading={loading} emptyMessage="No activity logs found" />
        {pagination && <Pagination currentPage={pagination.page} totalPages={pagination.pages} onPageChange={setPage} />}
      </div>
    </div>
  )
}

export default ActivityLogs
