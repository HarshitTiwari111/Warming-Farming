import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Modal from '../components/UI/Modal'
import ConfirmDialog from '../components/UI/ConfirmDialog'
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineArrowLeft, HiOutlineEye } from 'react-icons/hi'
import api from '../services/api'
import toast from 'react-hot-toast'

const initialForm = { headline1: '', headline2: '', headline3: '', description1: '', description2: '', finalUrl: '' }

const AdCopies = () => {
  const { campaignId } = useParams()
  const navigate = useNavigate()
  const [ads, setAds] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState(initialForm)
  const [campaign, setCampaign] = useState(null)

  const loadAds = async () => {
    setLoading(true)
    try {
      const { data } = await api.get(`/campaigns/${campaignId}/ads`)
      setAds(data.data || [])
    } catch { toast.error('Failed to load ads') }
    setLoading(false)
  }

  useEffect(() => {
    loadAds()
    api.get(`/campaigns/${campaignId}`).then(res => setCampaign(res.data.data))
  }, [campaignId])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (selected && !showPreview) {
        await api.put(`/ads/${selected._id}`, form)
        toast.success('Ad updated')
      } else {
        await api.post(`/campaigns/${campaignId}/ads`, form)
        toast.success('Ad created')
      }
      setShowModal(false)
      setForm(initialForm)
      setSelected(null)
      loadAds()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed')
    }
  }

  const handleDelete = async () => {
    try {
      await api.delete(`/ads/${selected._id}`)
      toast.success('Ad deleted')
      setShowDelete(false)
      setSelected(null)
      loadAds()
    } catch { toast.error('Delete failed') }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => navigate('/campaigns')} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
          <HiOutlineArrowLeft className="w-5 h-5" />
        </button>
        <button onClick={() => { setSelected(null); setForm(initialForm); setShowModal(true) }} className="btn-primary flex items-center gap-2">
          <HiOutlinePlus className="w-4 h-4" /> Add Ad Copy
        </button>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-32 bg-gray-100 rounded-xl" />)}</div>
      ) : ads.length === 0 ? (
        <div className="card text-center py-12 text-gray-500">No ad copies found</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ads.map((ad) => (
            <div key={ad._id} className="card">
              <div className="flex justify-between items-start mb-3">
                <div className="text-xs text-gray-400">Ad Copy</div>
                <div className="flex items-center gap-1">
                  <button onClick={() => { setSelected(ad); setShowPreview(true) }} className="text-gray-400 hover:text-blue-600"><HiOutlineEye className="w-4 h-4" /></button>
                  <button onClick={() => { setSelected(ad); setForm({ headline1: ad.headline1, headline2: ad.headline2, headline3: ad.headline3 || '', description1: ad.description1, description2: ad.description2 || '', finalUrl: ad.finalUrl }); setShowModal(true) }} className="text-gray-400 hover:text-primary-600"><HiOutlinePencil className="w-4 h-4" /></button>
                  <button onClick={() => { setSelected(ad); setShowDelete(true) }} className="text-gray-400 hover:text-red-600"><HiOutlineTrash className="w-4 h-4" /></button>
                </div>
              </div>
              <h4 className="text-primary-700 font-medium text-sm">{ad.headline1} | {ad.headline2}{ad.headline3 ? ` | ${ad.headline3}` : ''}</h4>
              <p className="text-xs text-green-700 mt-1 truncate">{ad.finalUrl}</p>
              <p className="text-xs text-gray-600 mt-2">{ad.description1}</p>
              {ad.description2 && <p className="text-xs text-gray-500 mt-1">{ad.description2}</p>}
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={selected ? 'Edit Ad Copy' : 'Add Ad Copy'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Headline 1 <span className="text-xs text-gray-400">(max 30)</span></label>
              <input type="text" value={form.headline1} onChange={(e) => setForm({ ...form, headline1: e.target.value })} className="input-field" required maxLength={30} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Headline 2 <span className="text-xs text-gray-400">(max 30)</span></label>
              <input type="text" value={form.headline2} onChange={(e) => setForm({ ...form, headline2: e.target.value })} className="input-field" required maxLength={30} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Headline 3 <span className="text-xs text-gray-400">(optional)</span></label>
              <input type="text" value={form.headline3} onChange={(e) => setForm({ ...form, headline3: e.target.value })} className="input-field" maxLength={30} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description 1 <span className="text-xs text-gray-400">(max 90)</span></label>
            <textarea value={form.description1} onChange={(e) => setForm({ ...form, description1: e.target.value })} className="input-field" required maxLength={90} rows={2} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description 2 <span className="text-xs text-gray-400">(optional, max 90)</span></label>
            <textarea value={form.description2} onChange={(e) => setForm({ ...form, description2: e.target.value })} className="input-field" maxLength={90} rows={2} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Final URL</label>
            <input type="url" value={form.finalUrl} onChange={(e) => setForm({ ...form, finalUrl: e.target.value })} className="input-field" required />
          </div>
          <div className="border rounded-lg p-4 bg-gray-50">
            <p className="text-xs text-gray-500 mb-2 font-medium">Preview</p>
            <p className="text-sm text-primary-700 font-medium">{form.headline1 || 'Headline 1'} | {form.headline2 || 'Headline 2'}{form.headline3 ? ` | ${form.headline3}` : ''}</p>
            <p className="text-xs text-green-700 mt-1">{form.finalUrl || 'https://example.com'}</p>
            <p className="text-xs text-gray-600 mt-1">{form.description1 || 'Description 1'}</p>
            {form.description2 && <p className="text-xs text-gray-500">{form.description2}</p>}
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">{selected ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showPreview} onClose={() => setShowPreview(false)} title="Ad Preview" size="md">
        {selected && (
          <div className="border rounded-lg p-6 bg-white">
            <p className="text-xs text-gray-400 mb-1">Ad</p>
            <p className="text-lg text-primary-700 font-medium">{selected.headline1} | {selected.headline2}{selected.headline3 ? ` | ${selected.headline3}` : ''}</p>
            <p className="text-sm text-green-700 mt-1">{selected.finalUrl}</p>
            <p className="text-sm text-gray-700 mt-3">{selected.description1}</p>
            {selected.description2 && <p className="text-sm text-gray-600 mt-1">{selected.description2}</p>}
          </div>
        )}
      </Modal>

      <ConfirmDialog isOpen={showDelete} onClose={() => setShowDelete(false)} onConfirm={handleDelete} title="Delete Ad Copy" message="Are you sure?" confirmText="Delete" />
    </div>
  )
}

export default AdCopies
