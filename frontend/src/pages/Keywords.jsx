import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import DataTable from '../components/UI/DataTable'
import Modal from '../components/UI/Modal'
import ConfirmDialog from '../components/UI/ConfirmDialog'
import StatusBadge from '../components/UI/StatusBadge'
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineArrowLeft } from 'react-icons/hi'
import api from '../services/api'
import toast from 'react-hot-toast'

const Keywords = () => {
  const { campaignId } = useParams()
  const navigate = useNavigate()
  const [keywords, setKeywords] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState({ keyword: '', matchType: 'broad', isNegative: false })
  const [campaign, setCampaign] = useState(null)

  const loadKeywords = async () => {
    setLoading(true)
    try {
      const { data } = await api.get(`/campaigns/${campaignId}/keywords`)
      setKeywords(data.data || [])
    } catch { toast.error('Failed to load keywords') }
    setLoading(false)
  }

  useEffect(() => {
    loadKeywords()
    api.get(`/campaigns/${campaignId}`).then(res => setCampaign(res.data.data))
  }, [campaignId])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (selected) {
        await api.put(`/keywords/${selected._id}`, form)
        toast.success('Keyword updated')
      } else {
        await api.post(`/campaigns/${campaignId}/keywords`, form)
        toast.success('Keyword added')
      }
      setShowModal(false)
      setForm({ keyword: '', matchType: 'broad', isNegative: false })
      setSelected(null)
      loadKeywords()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed')
    }
  }

  const handleDelete = async () => {
    try {
      await api.delete(`/keywords/${selected._id}`)
      toast.success('Keyword deleted')
      setShowDelete(false)
      setSelected(null)
      loadKeywords()
    } catch { toast.error('Delete failed') }
  }

  const columns = [
    { key: 'keyword', label: 'Keyword', sortable: true, filterable: true, render: (row) => <span className="font-medium">{row.keyword}</span> },
    { key: 'matchType', label: 'Match Type', filterable: true, filterType: 'select', filterOptions: [{value:'broad',label:'Broad'},{value:'phrase',label:'Phrase'},{value:'exact',label:'Exact'}], render: (row) => <span className="capitalize badge-info">{row.matchType}</span> },
    { key: 'isNegative', label: 'Type', filterable: true, filterType: 'select', filterOptions: [{value:'true',label:'Negative'},{value:'false',label:'Positive'}], render: (row) => row.isNegative ? <span className="badge-danger">Negative</span> : <span className="badge-success">Positive</span> },
    { key: 'status', label: 'Status', filterable: true, render: (row) => <StatusBadge status={row.status} /> },
    {
      key: 'actions', label: 'Actions', render: (row) => (
        <div className="flex items-center gap-2">
          <button onClick={() => { setSelected(row); setForm({ keyword: row.keyword, matchType: row.matchType, isNegative: row.isNegative }); setShowModal(true) }} className="text-gray-500 hover:text-primary-600"><HiOutlinePencil className="w-4 h-4" /></button>
          <button onClick={() => { setSelected(row); setShowDelete(true) }} className="text-gray-500 hover:text-red-600"><HiOutlineTrash className="w-4 h-4" /></button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => navigate('/campaigns')} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
          <HiOutlineArrowLeft className="w-5 h-5" />
        </button>
        <button onClick={() => { setSelected(null); setForm({ keyword: '', matchType: 'broad', isNegative: false }); setShowModal(true) }} className="btn-primary flex items-center gap-2">
          <HiOutlinePlus className="w-4 h-4" /> Add Keyword
        </button>
      </div>

      <div className="card">
        <DataTable columns={columns} data={keywords} loading={loading} emptyMessage="No keywords found" />
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={selected ? 'Edit Keyword' : 'Add Keyword'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Keyword</label>
            <input type="text" value={form.keyword} onChange={(e) => setForm({ ...form, keyword: e.target.value })} className="input-field" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Match Type</label>
            <select value={form.matchType} onChange={(e) => setForm({ ...form, matchType: e.target.value })} className="input-field">
              <option value="broad">Broad</option>
              <option value="phrase">Phrase</option>
              <option value="exact">Exact</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="isNegative" checked={form.isNegative} onChange={(e) => setForm({ ...form, isNegative: e.target.checked })} className="rounded" />
            <label htmlFor="isNegative" className="text-sm text-gray-700">Negative Keyword</label>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">{selected ? 'Update' : 'Add'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={showDelete} onClose={() => setShowDelete(false)} onConfirm={handleDelete} title="Delete Keyword" message={`Delete "${selected?.keyword}"?`} confirmText="Delete" />
    </div>
  )
}

export default Keywords
