import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { HiOutlineDocumentDownload, HiOutlineSearch, HiOutlineChevronLeft, HiOutlineChevronRight } from 'react-icons/hi'
import api from '../services/api'
import toast from 'react-hot-toast'
import StatusBadge from '../components/UI/StatusBadge'

const PAGE_SIZE = 10

const Reports = () => {
  const { user } = useSelector((state) => state.auth)
  const isAdmin = user?.role === 'admin'
  const [filters, setFilters] = useState({ search: '', country: '', status: '' })
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null })
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    loadReport()
  }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [filters])

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

  const totalPages = Math.max(1, Math.ceil(sortedCampaigns.length / PAGE_SIZE))
  const paginatedCampaigns = sortedCampaigns.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const SortIcon = ({ col }) => (
    <span className="ml-1 text-gray-400">{sortConfig.key === col ? (sortConfig.direction === 'asc' ? '▲' : '▼') : '◇'}</span>
  )

  return (
    <div>
      {/* Filter + PDF in one card, one row */}
      <div className="card mb-4">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="relative flex-1 basis-40 min-w-0">
            <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              placeholder="Search campaign..." className="input-field pl-9" />
          </div>
          <div className="relative flex-1 basis-40 min-w-0">
            <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" value={filters.country} onChange={(e) => setFilters({ ...filters, country: e.target.value })}
              placeholder="Search country..." className="input-field pl-9" />
          </div>
          <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="input-field w-full sm:w-40">
            <option value="">Status: All</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="ended">Ended</option>
            <option value="draft">Draft</option>
          </select>
          <button onClick={exportPDF} disabled={exporting} className="btn-primary flex items-center gap-2 w-full sm:w-auto justify-center shrink-0">
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
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  {[
                    { key: 'campaignName', label: 'CAMPAIGN' },
                    { key: 'account', label: 'ACCOUNT' },
                    { key: 'country', label: 'COUNTRY' },
                    { key: 'dailyBudget', label: 'BUDGET' },
                    { key: 'status', label: 'STATUS', sortable: false },
                    ...(isAdmin ? [{ key: 'owner', label: 'OWNER', sortable: false }] : []),
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
                {paginatedCampaigns.map((row) => (
                  <tr key={row._id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">{row.campaignName}</td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-300">{row.account?.name || '-'}</td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-300">{row.country || '-'}</td>
                    <td className="py-3 px-4 text-gray-900 dark:text-white">${row.dailyBudget ?? 0}</td>
                    <td className="py-3 px-4"><StatusBadge status={row.status} /></td>
                    {isAdmin && <td className="py-3 px-4 text-xs text-gray-600 dark:text-gray-300">{row.owner?.name || '-'}</td>}
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-t border-gray-200 dark:border-gray-700">
              <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                Showing {(currentPage - 1) * PAGE_SIZE + 1}-{Math.min(currentPage * PAGE_SIZE, sortedCampaigns.length)} of {sortedCampaigns.length}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <HiOutlineChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium ${page === currentPage ? 'bg-primary-500 text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <HiOutlineChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default Reports
