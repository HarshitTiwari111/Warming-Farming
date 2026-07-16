import { useState, useEffect } from 'react'
import { HiOutlineFire, HiOutlinePlay, HiOutlineFastForward, HiOutlineRefresh } from 'react-icons/hi'
import api from '../services/api'
import toast from 'react-hot-toast'
import StatusBadge from '../components/UI/StatusBadge'
import LoadingSkeleton from '../components/UI/LoadingSkeleton'

const Warming = () => {
  const [warmingAccounts, setWarmingAccounts] = useState([])
  const [pendingAccounts, setPendingAccounts] = useState([])
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    setLoading(true)
    try {
      const [warmingRes, accountsRes] = await Promise.all([api.get('/warming'), api.get('/accounts?status=pending&limit=50')])
      setWarmingAccounts(warmingRes.data.data || [])
      setPendingAccounts(accountsRes.data.data || [])
    } catch { toast.error('Failed to load data') }
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  const startWarming = async (accountId) => { try { await api.post(`/warming/${accountId}/start`); toast.success('Warming started'); loadData() } catch (err) { toast.error(err.response?.data?.message || 'Failed') } }
  const advanceWarming = async (accountId) => { try { const { data } = await api.put(`/warming/${accountId}/advance`); toast.success(data.data.completed ? 'Warming completed!' : 'Advanced to next day'); loadData() } catch (err) { toast.error(err.response?.data?.message || 'Failed') } }
  const resetWarming = async (accountId) => { try { await api.put(`/warming/${accountId}/reset`); toast.success('Warming reset'); loadData() } catch (err) { toast.error(err.response?.data?.message || 'Failed') } }

  if (loading) return <LoadingSkeleton type="cards" rows={4} />

  return (
    <div>
      <div className="mb-6"><h1 className="text-2xl font-bold text-gray-900 dark:text-white">Warming Process</h1><p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Manage account warming stages</p></div>
      {warmingAccounts.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2"><HiOutlineFire className="w-5 h-5 text-orange-500" /> Active Warming ({warmingAccounts.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {warmingAccounts.map((account) => (
              <div key={account.accountId} className="card">
                <div className="flex items-center justify-between mb-3"><h3 className="font-semibold text-gray-900">{account.accountName}</h3><StatusBadge status={account.status} /></div>
                <div className="grid grid-cols-3 gap-3 text-center mb-4">
                  <div className="bg-gray-50 rounded-lg p-2"><p className="text-xs text-gray-500">Day</p><p className="text-lg font-bold text-gray-900">{account.currentDay}/{account.totalDays}</p></div>
                  <div className="bg-gray-50 rounded-lg p-2"><p className="text-xs text-gray-500">Budget</p><p className="text-lg font-bold text-gray-900">₹{account.currentBudget}</p></div>
                  <div className="bg-gray-50 rounded-lg p-2"><p className="text-xs text-gray-500">Progress</p><p className="text-lg font-bold text-gray-900">{account.progress}%</p></div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-4"><div className="bg-orange-500 h-2 rounded-full transition-all duration-500" style={{ width: `${account.progress}%` }} /></div>
                <div className="flex flex-wrap gap-1 mb-4">
                  {account.schedule?.map((s, i) => (
                    <div key={i} className={`text-xs px-2 py-1 rounded ${s.status === 'completed' ? 'bg-green-100 text-green-700' : i + 1 === account.currentDay ? 'bg-orange-100 text-orange-700 font-medium' : 'bg-gray-100 text-gray-500'}`}>D{s.day}: ₹{s.budget}</div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => advanceWarming(account.accountId)} className="btn-primary flex items-center gap-1 text-xs"><HiOutlineFastForward className="w-3 h-3" /> Advance</button>
                  <button onClick={() => resetWarming(account.accountId)} className="btn-secondary flex items-center gap-1 text-xs"><HiOutlineRefresh className="w-3 h-3" /> Reset</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Pending Accounts</h2>
        {pendingAccounts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingAccounts.map((account) => (
              <div key={account._id} className="card">
                <h3 className="font-semibold text-gray-900 mb-1">{account.accountName}</h3>
                <p className="text-xs text-gray-500 mb-3">{account.gmail}</p>
                <button onClick={() => startWarming(account._id)} className="btn-primary flex items-center gap-1 text-xs w-full justify-center"><HiOutlinePlay className="w-3 h-3" /> Start Warming</button>
              </div>
            ))}
          </div>
        ) : <div className="card text-center py-8 text-gray-500">No pending accounts for warming</div>}
      </div>
    </div>
  )
}

export default Warming
