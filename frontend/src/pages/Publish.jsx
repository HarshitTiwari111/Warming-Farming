import { useState, useEffect } from 'react'
import { HiOutlineCloudUpload, HiOutlineCheckCircle, HiOutlineExclamationCircle } from 'react-icons/hi'
import api from '../services/api'
import toast from 'react-hot-toast'
import StatusBadge from '../components/UI/StatusBadge'
import ConfirmDialog from '../components/UI/ConfirmDialog'

const Publish = () => {
  const [campaigns, setCampaigns] = useState([])
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [publishing, setPublishing] = useState(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [selectedCampaign, setSelectedCampaign] = useState(null)

  const loadData = async () => {
    setLoading(true)
    try { const [c, h] = await Promise.all([api.get('/campaigns?limit=50'), api.get('/publish/history')]); setCampaigns(c.data.data || []); setHistory(h.data.data || []) }
    catch { toast.error('Failed to load data') }
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  const handlePublish = async () => {
    setShowConfirm(false); setPublishing(selectedCampaign._id)
    try { await api.post(`/publish/${selectedCampaign._id}`); toast.success('Campaign published!'); loadData() }
    catch (err) { toast.error(err.response?.data?.message || 'Publish failed') }
    setPublishing(null)
  }

  const readyCampaigns = campaigns.filter(c => ['draft', 'pending', 'running'].includes(c.status))

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Ready to Publish</h2>
        {readyCampaigns.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {readyCampaigns.map((campaign) => (
              <div key={campaign._id} className="card">
                <div className="flex justify-between items-start mb-3"><h3 className="font-semibold text-gray-900 text-sm">{campaign.campaignName}</h3><StatusBadge status={campaign.status} /></div>
                <p className="text-xs text-gray-500 mb-1">{campaign.account?.accountName}</p>
                <p className="text-xs text-gray-500 mb-3">Budget: ₹{campaign.dailyBudget}/day</p>
                <button onClick={() => { setSelectedCampaign(campaign); setShowConfirm(true) }} disabled={publishing === campaign._id} className="btn-success w-full flex items-center justify-center gap-2 text-xs">
                  <HiOutlineCloudUpload className="w-4 h-4" /> {publishing === campaign._id ? 'Publishing...' : 'Publish Now'}
                </button>
              </div>
            ))}
          </div>
        ) : <div className="card text-center py-8 text-gray-500">No campaigns ready to publish</div>}
      </div>
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Publish History</h2>
        <div className="card">
          {history.length > 0 ? (
            <div className="space-y-3">
              {history.map((h) => (
                <div key={h._id} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
                  {h.status === 'published' ? <HiOutlineCheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" /> : h.status === 'failed' ? <HiOutlineExclamationCircle className="w-5 h-5 text-red-500 flex-shrink-0" /> : <HiOutlineCloudUpload className="w-5 h-5 text-blue-500 flex-shrink-0" />}
                  <div className="flex-1 min-w-0"><p className="text-sm text-gray-900">{h.campaign?.campaignName}</p><p className="text-xs text-gray-500">{h.account?.accountName} - by {h.publishedBy?.name}</p></div>
                  <StatusBadge status={h.status} />
                  <span className="text-xs text-gray-400">{new Date(h.createdAt).toLocaleString()}</span>
                </div>
              ))}
            </div>
          ) : <p className="text-center py-8 text-gray-500">No publish history</p>}
        </div>
      </div>
      <ConfirmDialog isOpen={showConfirm} onClose={() => setShowConfirm(false)} onConfirm={handlePublish} title="Publish Campaign" message={`Publish "${selectedCampaign?.campaignName}"?`} confirmText="Publish" variant="success" />
    </div>
  )
}

export default Publish
