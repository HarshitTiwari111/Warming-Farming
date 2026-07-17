import { useState, useMemo } from 'react'
import { HiOutlineChevronUp, HiOutlineChevronDown, HiOutlineSearch } from 'react-icons/hi'

const DataTable = ({ columns, data, loading, emptyMessage = 'No data found', actionButtons }) => {
  const [filters, setFilters] = useState({})
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null })

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
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

  const filteredAndSortedData = useMemo(() => {
    let result = [...(data || [])]

    Object.entries(filters).forEach(([key, value]) => {
      if (!value) return
      const col = columns.find(c => c.key === key)
      result = result.filter(row => {
        const cellValue = String(row[key] ?? '').toLowerCase()
        if (col?.filterType === 'select') {
          return cellValue === value.toLowerCase()
        }
        return cellValue.includes(value.toLowerCase())
      })
    })

    if (sortConfig.key && sortConfig.direction) {
      result.sort((a, b) => {
        let aVal = a[sortConfig.key]
        let bVal = b[sortConfig.key]

        if (aVal === undefined || aVal === null) aVal = ''
        if (bVal === undefined || bVal === null) bVal = ''

        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal
        }

        aVal = String(aVal).toLowerCase()
        bVal = String(bVal).toLowerCase()
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1
        return 0
      })
    }

    return result
  }, [data, filters, sortConfig])

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-14 bg-gray-100 dark:bg-gray-800 rounded mb-2" />
        ))}
      </div>
    )
  }

  const hasFilters = columns.some(col => col.filterable)

  return (
    <div className="card">
      {(hasFilters || actionButtons) && (
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {hasFilters && columns.filter(col => col.filterable).map((col) => (
            col.filterType === 'select' ? (
              <select
                key={`filter-${col.key}`}
                value={filters[col.key] || ''}
                onChange={(e) => handleFilterChange(col.key, e.target.value)}
                className="h-10 px-3 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors shrink-0"
              >
                <option value="">{col.label}: All</option>
                {(col.filterOptions || []).map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            ) : (
              <div key={`filter-${col.key}`} className="relative min-w-0 flex-1 basis-32 max-w-[180px]">
                <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  value={filters[col.key] || ''}
                  onChange={(e) => handleFilterChange(col.key, e.target.value)}
                  placeholder={`Search ${col.label.toLowerCase()}...`}
                  className="w-full h-10 pl-9 pr-3 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors"
                />
              </div>
            )
          ))}
          {Object.values(filters).some(v => v) && (
            <button
              onClick={() => setFilters({})}
              className="h-10 px-4 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 border border-gray-200 dark:border-gray-600 rounded-lg hover:border-red-300 dark:hover:border-red-700 transition-colors shrink-0"
            >
              Clear
            </button>
          )}
          {actionButtons && <div className="sm:ml-auto flex items-center gap-2 shrink-0">{actionButtons}</div>}
        </div>
      )}
      <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            {columns.map((col) => (
              <th key={col.key} className="text-left py-3 px-3 whitespace-nowrap">
                <div
                  className={`flex items-center gap-1 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider ${col.sortable ? 'cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-200' : ''}`}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  {col.label}
                  {col.sortable && (
                    <span className="flex flex-col ml-1">
                      <HiOutlineChevronUp className={`w-3 h-3 -mb-1 ${sortConfig.key === col.key && sortConfig.direction === 'asc' ? 'text-primary-600' : 'text-gray-300 dark:text-gray-600'}`} />
                      <HiOutlineChevronDown className={`w-3 h-3 ${sortConfig.key === col.key && sortConfig.direction === 'desc' ? 'text-primary-600' : 'text-gray-300 dark:text-gray-600'}`} />
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filteredAndSortedData.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="text-center py-12 text-gray-500 dark:text-gray-400">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            filteredAndSortedData.map((row, rowIndex) => (
              <tr key={row._id || rowIndex} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                {columns.map((col) => (
                  <td key={col.key} className="py-3 px-3 text-sm text-gray-700 dark:text-gray-300">
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
      </div>
    </div>
  )
}

export default DataTable
