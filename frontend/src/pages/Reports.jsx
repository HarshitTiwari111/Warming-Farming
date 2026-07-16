import { useState, useEffect } from 'react'
import { HiOutlineDocumentDownload, HiOutlineSearch } from 'react-icons/hi'
import api from '../services/api'
import toast from 'react-hot-toast'
import StatusBadge from '../components/UI/StatusBadge'

const Reports = () => {
  const [filters, setFilters] = useState({ search: '', country: '', status: '' })
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null })

  useEffect(() => {
    loadReport()
  }, [])

  const loadReport = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/reports')
      setCampaigns(data.data?.campaigns || [])
    } catch { toast.error('Failed to load report') }
    setLoading(false)
  }

  const exportPDF = async () => {
    setExporting(true)
    try {
      const response = await api.get('/reports/export/pdf', { params: filters, responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'report.pdf')
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      toast.success('PDF downloaded')
    } catch { toast.error('PDF export failed') }
    setExporting(false)
  }

  const handleSort = (key) => {
    setSortConfig(prev => {
      if (prev.key === key) {
        if (prev.direction === 'asc') return { key, direction: 'desc' }
        if (prev.direction === 'desc') return { key: null, direction: null }
      }
      return { key, direction: 'asc' }
    })
  }

  const filteredCampaigns = campaigns.filter(c => {
    if (filters.search && !c.campaignName?.toLowerCase().includes(filters.search.toLowerCase())) return false
    if (filters.country && !c.country?.toLowerCase().includes(filters.country.toLowerCase())) return false
    if (filters.status && c.status !== filters.status) return false
    return true
  })

  const sortedCampaigns = [...filteredCampaigns].sort((a, b) => {
    if (!sortConfig.key) return 0
    const aVal = a[sortConfig.key] ?? ''
    const bVal = b[sortConfig.key] ?? ''
    const cmp = typeof aVal === 'number' ? aVal - bVal : String(aVal).localeCompare(String(bVal))
    return sortConfig.direction === 'desc' ? -cmp : cmp
  })

  const SortIcon = ({ col }) => (
    <span className="ml-1 text-gray-400">{sortConfig.key === col ? (sortConfig.direction === 'asc' ? '▲' : '▼') : '◇'}</span>
  )

  return (
    <div>
      {/* Filter + PDF in one card, one row */}
      <div className="card mb-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              placeholder="Search campaign..." className="input-field pl-9" />
          </div>
          <div className="relative flex-1">
            <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" value={filters.country} onChange={(e) => setFilters({ ...filters, country: e.target.value })}
              placeholder="Search country..." className="input-field pl-9" />
          </div>
          <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="input-field w-40">
            <option value="">Status: All</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="ended">Ended</option>
            <option value="draft">Draft</option>
          </select>
          <button onClick={exportPDF} disabled={exporting} className="btn-primary flex items-center gap-2 shrink-0">
            <HiOutlineDocumentDownload className="w-4 h-4" /> {exporting ? 'Downloading...' : 'Download PDF'}
          </button>
        </div>
      </div>

      {/* Table in separate card */}
      <div className="card overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : sortedCampaigns.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">No campaigns found</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                {[
                  { key: 'campaignName', label: 'CAMPAIGN' },
                  { key: 'account', label: 'ACCOUNT' },
                  { key: 'country', label: 'COUNTRY' },
                  { key: 'dailyBudget', label: 'BUDGET' },
                  { key: 'status', label: 'STATUS', sortable: false },
                ].map(col => (
                  <th key={col.key}
                    className={`text-left py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase ${col.sortable !== false ? 'cursor-pointer hover:text-gray-700 dark:hover:text-gray-200 select-none' : ''}`}
                    onClick={() => col.sortable !== false && handleSort(col.key)}
                  >
                    {col.label}{col.sortable !== false && <SortIcon col={col.key} />}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedCampaigns.map((row) => (
                <tr key={row._id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">{row.campaignName}</td>
                  <td className="py-3 px-4 text-gray-600 dark:text-gray-300">{row.account?.name || '-'}</td>
                  <td className="py-3 px-4 text-gray-600 dark:text-gray-300">{row.country || '-'}</td>
                  <td className="py-3 px-4 text-gray-900 dark:text-white">${row.dailyBudget ?? 0}</td>
                  <td className="py-3 px-4"><StatusBadge status={row.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

export default Reports
