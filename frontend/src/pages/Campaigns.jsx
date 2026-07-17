import { useState, useEffect, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchCampaigns, updateCampaign, deleteCampaign } from '../store/slices/campaignSlice'
import DataTable from '../components/UI/DataTable'
import ConfirmDialog from '../components/UI/ConfirmDialog'
import Modal from '../components/UI/Modal'
import Pagination from '../components/UI/Pagination'
import StatusBadge from '../components/UI/StatusBadge'
import { HiOutlineTrash, HiOutlineDocumentText, HiOutlineDeviceMobile, HiOutlineGlobe, HiOutlinePlus, HiOutlinePencil, HiOutlineSearch, HiOutlineSpeakerphone, HiOutlineKey, HiOutlineEye, HiOutlineChartBar, HiOutlineRefresh } from 'react-icons/hi'
import api from '../services/api'
import toast from 'react-hot-toast'

const DEVICE_OPTIONS = [
  { value: 'all', label: 'All Devices' },
  { value: 'mobile', label: 'Mobile' },
  { value: 'desktop', label: 'Desktop' },
  { value: 'tablet', label: 'Tablet' },
]

const COUNTRY_OPTIONS = [
  'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Antigua and Barbuda', 'Argentina', 'Armenia', 'Australia', 'Austria',
  'Azerbaijan', 'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados', 'Belarus', 'Belgium', 'Belize', 'Benin', 'Bhutan',
  'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei', 'Bulgaria', 'Burkina Faso', 'Burundi', 'Cambodia', 'Cameroon',
  'Canada', 'Cape Verde', 'Central African Republic', 'Chad', 'Chile', 'China', 'Colombia', 'Comoros', 'Congo', 'Costa Rica',
  'Croatia', 'Cuba', 'Cyprus', 'Czech Republic', 'Denmark', 'Djibouti', 'Dominica', 'Dominican Republic', 'East Timor', 'Ecuador',
  'Egypt', 'El Salvador', 'Equatorial Guinea', 'Eritrea', 'Estonia', 'Eswatini', 'Ethiopia', 'Fiji', 'Finland', 'France',
  'Gabon', 'Gambia', 'Georgia', 'Germany', 'Ghana', 'Greece', 'Grenada', 'Guatemala', 'Guinea', 'Guinea-Bissau',
  'Guyana', 'Haiti', 'Honduras', 'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland',
  'Israel', 'Italy', 'Ivory Coast', 'Jamaica', 'Japan', 'Jordan', 'Kazakhstan', 'Kenya', 'Kiribati', 'Kosovo',
  'Kuwait', 'Kyrgyzstan', 'Laos', 'Latvia', 'Lebanon', 'Lesotho', 'Liberia', 'Libya', 'Liechtenstein', 'Lithuania',
  'Luxembourg', 'Madagascar', 'Malawi', 'Malaysia', 'Maldives', 'Mali', 'Malta', 'Marshall Islands', 'Mauritania', 'Mauritius',
  'Mexico', 'Micronesia', 'Moldova', 'Monaco', 'Mongolia', 'Montenegro', 'Morocco', 'Mozambique', 'Myanmar', 'Namibia',
  'Nauru', 'Nepal', 'Netherlands', 'New Zealand', 'Nicaragua', 'Niger', 'Nigeria', 'North Korea', 'North Macedonia', 'Norway',
  'Oman', 'Pakistan', 'Palau', 'Palestine', 'Panama', 'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines', 'Poland',
  'Portugal', 'Qatar', 'Romania', 'Russia', 'Rwanda', 'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Vincent and the Grenadines', 'Samoa', 'San Marino',
  'Sao Tome and Principe', 'Saudi Arabia', 'Senegal', 'Serbia', 'Seychelles', 'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia', 'Solomon Islands',
  'Somalia', 'South Africa', 'South Korea', 'South Sudan', 'Spain', 'Sri Lanka', 'Sudan', 'Suriname', 'Sweden', 'Switzerland',
  'Syria', 'Taiwan', 'Tajikistan', 'Tanzania', 'Thailand', 'Togo', 'Tonga', 'Trinidad and Tobago', 'Tunisia', 'Turkey',
  'Turkmenistan', 'Tuvalu', 'UAE', 'Uganda', 'Ukraine', 'United Kingdom', 'United States', 'Uruguay', 'Uzbekistan', 'Vanuatu',
  'Vatican City', 'Venezuela', 'Vietnam', 'Yemen', 'Zambia', 'Zimbabwe',
]

const Campaigns = () => {
  const dispatch = useDispatch()
  const { campaigns, pagination, loading } = useSelector((state) => state.campaigns)
  const { user } = useSelector((state) => state.auth)
  const isAdmin = user?.role === 'admin'
  const [page, setPage] = useState(1)
  const [showDelete, setShowDelete] = useState(false)
  const [selectedCampaign, setSelectedCampaign] = useState(null)

  const [showDeviceModal, setShowDeviceModal] = useState(false)
  const [showCountryModal, setShowCountryModal] = useState(false)
  const [showKeywordsModal, setShowKeywordsModal] = useState(false)
  const [modalCampaign, setModalCampaign] = useState(null)
  const [selectedDevices, setSelectedDevices] = useState([])
  const [selectedCountries, setSelectedCountries] = useState([])

  const [countrySearch, setCountrySearch] = useState('')

  const [showAdsModal, setShowAdsModal] = useState(false)
  const [ads, setAds] = useState([])
  const [adsLoading, setAdsLoading] = useState(false)
  const [showAdForm, setShowAdForm] = useState(false)
  const [editingAd, setEditingAd] = useState(null)
  const [adForm, setAdForm] = useState({ headline1: '', headline2: '', headline3: '', description1: '', description2: '', finalUrl: '' })
  const [showDeleteAd, setShowDeleteAd] = useState(false)
  const [selectedAd, setSelectedAd] = useState(null)

  const [keywords, setKeywords] = useState([])
  const [keywordsLoading, setKeywordsLoading] = useState(false)
  const [showKeywordForm, setShowKeywordForm] = useState(false)
  const [editingKeyword, setEditingKeyword] = useState(null)
  const [keywordForm, setKeywordForm] = useState({ keyword: '', matchType: 'broad', isNegative: false })
  const [showDeleteKeyword, setShowDeleteKeyword] = useState(false)
  const [selectedKeyword, setSelectedKeyword] = useState(null)
  const [syncing, setSyncing] = useState(false)

  const handleSync = async () => {
    setSyncing(true)
    try {
      const { data } = await api.post('/google-ads/my-google-sync')
      toast.success(data.message || 'Sync complete')
      loadCampaigns()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Sync failed')
    }
    setSyncing(false)
  }

  const loadCampaigns = useCallback(() => {
    dispatch(fetchCampaigns({ page, limit: 10 }))
  }, [dispatch, page])

  useEffect(() => { loadCampaigns() }, [loadCampaigns])

  const openDeviceModal = (campaign) => {
    setModalCampaign(campaign)
    const devices = campaign.device ? (Array.isArray(campaign.device) ? campaign.device : [campaign.device]) : ['all']
    setSelectedDevices(devices)
    setShowDeviceModal(true)
  }

  const openCountryModal = (campaign) => {
    setModalCampaign(campaign)
    const countries = campaign.country ? (Array.isArray(campaign.country) ? campaign.country : [campaign.country]) : []
    setSelectedCountries(countries)
    setCountrySearch('')
    setShowCountryModal(true)
  }

  const openAdsModal = async (campaign) => {
    setModalCampaign(campaign)
    setShowAdsModal(true)
    setAdsLoading(true)
    try {
      const { data } = await api.get(`/campaigns/${campaign._id}/ads`)
      setAds(data.data || [])
    } catch {
      toast.error('Failed to load ads')
      setAds([])
    }
    setAdsLoading(false)
  }

  const openKeywordsModal = async (campaign) => {
    setModalCampaign(campaign)
    setShowKeywordsModal(true)
    setKeywordsLoading(true)
    try {
      const { data } = await api.get(`/campaigns/${campaign._id}/keywords`)
      setKeywords(data.data || [])
    } catch {
      toast.error('Failed to load keywords')
      setKeywords([])
    }
    setKeywordsLoading(false)
  }

  const toggleDevice = (value) => {
    setSelectedDevices(prev => {
      if (value === 'all') return ['all']
      const without = prev.filter(d => d !== 'all')
      if (without.includes(value)) {
        const result = without.filter(d => d !== value)
        return result.length === 0 ? ['all'] : result
      }
      return [...without, value]
    })
  }

  const toggleCountry = (country) => {
    setSelectedCountries(prev =>
      prev.includes(country) ? prev.filter(c => c !== country) : [...prev, country]
    )
  }

  const handleDeviceSave = async () => {
    try {
      await dispatch(updateCampaign({ id: modalCampaign._id, device: selectedDevices })).unwrap()
      toast.success('Device updated')
      setShowDeviceModal(false)
    } catch (err) {
      toast.error(typeof err === 'string' ? err : err?.message || 'Operation failed')
    }
  }

  const handleCountrySave = async () => {
    try {
      await dispatch(updateCampaign({ id: modalCampaign._id, country: selectedCountries })).unwrap()
      toast.success('Country updated')
      setShowCountryModal(false)
    } catch (err) {
      toast.error(typeof err === 'string' ? err : err?.message || 'Operation failed')
    }
  }

  const handleKeywordSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingKeyword) {
        await api.put(`/keywords/${editingKeyword._id}`, keywordForm)
        toast.success('Keyword updated')
      } else {
        await api.post(`/campaigns/${modalCampaign._id}/keywords`, keywordForm)
        toast.success('Keyword added')
      }
      setShowKeywordForm(false)
      setEditingKeyword(null)
      setKeywordForm({ keyword: '', matchType: 'broad', isNegative: false })
      const { data } = await api.get(`/campaigns/${modalCampaign._id}/keywords`)
      setKeywords(data.data || [])
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed')
    }
  }

  const handleDeleteKeyword = async () => {
    try {
      await api.delete(`/keywords/${selectedKeyword._id}`)
      toast.success('Keyword deleted')
      setShowDeleteKeyword(false)
      setSelectedKeyword(null)
      const { data } = await api.get(`/campaigns/${modalCampaign._id}/keywords`)
      setKeywords(data.data || [])
    } catch {
      toast.error('Delete failed')
    }
  }

  const handleAdSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingAd) {
        await api.put(`/ads/${editingAd._id}`, adForm)
        toast.success('Ad updated')
      } else {
        await api.post(`/campaigns/${modalCampaign._id}/ads`, adForm)
        toast.success('Ad created')
      }
      setShowAdForm(false)
      setEditingAd(null)
      setAdForm({ headline1: '', headline2: '', headline3: '', description1: '', description2: '', finalUrl: '' })
      const { data } = await api.get(`/campaigns/${modalCampaign._id}/ads`)
      setAds(data.data || [])
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed')
    }
  }

  const handleDeleteAd = async () => {
    try {
      await api.delete(`/ads/${selectedAd._id}`)
      toast.success('Ad deleted')
      setShowDeleteAd(false)
      setSelectedAd(null)
      const { data } = await api.get(`/campaigns/${modalCampaign._id}/ads`)
      setAds(data.data || [])
    } catch {
      toast.error('Delete failed')
    }
  }

  const handleDelete = async () => {
    try {
      await dispatch(deleteCampaign(selectedCampaign._id)).unwrap()
      toast.success('Campaign deleted')
      setShowDelete(false)
      setSelectedCampaign(null)
      loadCampaigns()
    } catch (err) {
      toast.error(typeof err === 'string' ? err : err?.message || 'Operation failed')
    }
  }

  const formatDevices = (device) => {
    if (!device) return 'all'
    if (Array.isArray(device)) return device.length > 1 ? `${device.length} selected` : device[0] || 'all'
    return device
  }

  const formatCountries = (country) => {
    if (!country) return '-'
    if (Array.isArray(country)) return country.length > 1 ? `${country.length} selected` : country[0] || '-'
    return country
  }

  const columns = [
    { key: 'campaignName', label: 'Campaign Name', sortable: true, filterable: true, render: (row) => <span className="font-medium">{row.campaignName}</span> },
    { key: 'googleAdsCampaignId', label: 'Google Ads ID', sortable: true, render: (row) => row.googleAdsCampaignId ? <span className="font-mono text-xs text-blue-600 dark:text-blue-400">{row.googleAdsCampaignId}</span> : <span className="text-gray-400 text-xs">-</span> },
    { key: 'status', label: 'Status', filterable: true, filterType: 'select', filterOptions: [{value:'active',label:'Active'},{value:'paused',label:'Paused'},{value:'ended',label:'Ended'},{value:'draft',label:'Draft'}], render: (row) => <StatusBadge status={row.status} /> },
    { key: 'clicks', label: 'Clicks', sortable: true, render: (row) => row.clicks ?? 0 },
    { key: 'impressions', label: 'Impressions', sortable: true, render: (row) => row.impressions ?? 0 },
    { key: 'ctr', label: 'CTR', sortable: true, render: (row) => `${(row.ctr ?? 0).toFixed(1)}%` },
    { key: 'spend', label: 'Spend', sortable: true, render: (row) => `$${(row.spend ?? 0).toFixed(2)}` },
    { key: 'cpc', label: 'CPC', sortable: true, render: (row) => `$${(row.cpc ?? 0).toFixed(2)}` },
    { key: 'conversions', label: 'Conversions', sortable: true, render: (row) => row.conversions ?? 0 },
    {
      key: 'device', label: 'Device', filterable: true, filterType: 'select',
      filterOptions: DEVICE_OPTIONS.map(d => ({ value: d.value, label: d.label })),
      render: (row) => (
        <button
          onClick={() => openDeviceModal(row)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-sm border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
        >
          <HiOutlineDeviceMobile className="w-3.5 h-3.5 text-gray-400" />
          <span className="capitalize">{formatDevices(row.device)}</span>
        </button>
      ),
    },
    {
      key: 'country', label: 'Country', sortable: true, filterable: true,
      render: (row) => (
        <button
          onClick={() => openCountryModal(row)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-sm border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
        >
          <HiOutlineGlobe className="w-3.5 h-3.5 text-gray-400" />
          {formatCountries(row.country)}
        </button>
      ),
    },
    { key: 'dailyBudget', label: 'Daily Budget', sortable: true, render: (row) => `$${row.dailyBudget ?? 0}` },
    {
      key: 'ads', label: 'Ad Copy', render: (row) => (
        <button
          onClick={() => openAdsModal(row)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-sm border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 hover:border-green-300 dark:hover:border-green-700 transition-colors text-green-600 dark:text-green-400"
        >
          <HiOutlineSpeakerphone className="w-3.5 h-3.5" />
          Ads
        </button>
      ),
    },
    {
      key: 'keywords', label: 'Keywords', render: (row) => (
        <button
          onClick={() => openKeywordsModal(row)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-sm border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:border-amber-300 dark:hover:border-amber-700 transition-colors text-amber-600 dark:text-amber-400"
        >
          <HiOutlineKey className="w-3.5 h-3.5" />
          Keywords
        </button>
      ),
    },
    ...(isAdmin ? [{ key: 'owner', label: 'Owner', render: (row) => row.owner ? <span className="text-xs text-gray-600 dark:text-gray-300">{row.owner.name}</span> : <span className="text-gray-400 text-xs">-</span> }] : []),
    {
      key: 'actions', label: 'Actions', render: (row) => (
        <button onClick={() => { setSelectedCampaign(row); setShowDelete(true) }} className="text-gray-500 hover:text-red-600">
          <HiOutlineTrash className="w-4 h-4" />
        </button>
      ),
    },
  ]

  return (
    <div>
      {!isAdmin && (
        <div className="flex justify-end gap-3 mb-6">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm text-sm font-medium transition-colors disabled:opacity-50"
          >
            <HiOutlineRefresh className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync from Google Ads'}
          </button>
        </div>
      )}
      <DataTable columns={columns} data={campaigns} loading={loading} emptyMessage="No campaigns found" />
      {pagination && <div className="mt-4"><Pagination currentPage={pagination.page} totalPages={pagination.pages} onPageChange={setPage} /></div>}

      {/* Device Modal - Multi Select */}
      <Modal isOpen={showDeviceModal} onClose={() => setShowDeviceModal(false)} title="Select Device" size="sm">
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Choose device targeting for <span className="font-medium text-gray-700 dark:text-gray-300">{modalCampaign?.campaignName}</span>
        </p>
        <div className="space-y-2 mb-6">
          {DEVICE_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${selectedDevices.includes(opt.value) ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
            >
              <input
                type="checkbox"
                checked={selectedDevices.includes(opt.value)}
                onChange={() => toggleDevice(opt.value)}
                className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{opt.label}</span>
            </label>
          ))}
        </div>
        <div className="flex justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-700">
          <button onClick={() => setShowDeviceModal(false)} className="btn-secondary">Cancel</button>
          <button onClick={handleDeviceSave} className="btn-primary">Save</button>
        </div>
      </Modal>

      {/* Country Modal - Multi Select with Search */}
      <Modal isOpen={showCountryModal} onClose={() => setShowCountryModal(false)} title="Select Country" size="sm">
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
          Choose country targeting for <span className="font-medium text-gray-700 dark:text-gray-300">{modalCampaign?.campaignName}</span>
        </p>
        <div className="relative mb-3">
          <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={countrySearch}
            onChange={(e) => setCountrySearch(e.target.value)}
            placeholder="Search country..."
            className="input-field pl-9"
          />
        </div>
        {selectedCountries.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {selectedCountries.map(c => (
              <span key={c} className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 rounded-full text-xs font-medium">
                {c}
                <button onClick={() => toggleCountry(c)} className="hover:text-primary-900 dark:hover:text-primary-200">&times;</button>
              </span>
            ))}
          </div>
        )}
        <div className="space-y-1.5 mb-6 max-h-64 overflow-y-auto">
          {COUNTRY_OPTIONS.filter(c => c.toLowerCase().includes(countrySearch.toLowerCase())).map((country) => (
            <label
              key={country}
              className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors ${selectedCountries.includes(country) ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
            >
              <input
                type="checkbox"
                checked={selectedCountries.includes(country)}
                onChange={() => toggleCountry(country)}
                className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{country}</span>
            </label>
          ))}
          {COUNTRY_OPTIONS.filter(c => c.toLowerCase().includes(countrySearch.toLowerCase())).length === 0 && (
            <p className="text-center py-4 text-sm text-gray-500 dark:text-gray-400">No countries found</p>
          )}
        </div>
        <div className="flex justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-700">
          <button onClick={() => setShowCountryModal(false)} className="btn-secondary">Cancel</button>
          <button onClick={handleCountrySave} className="btn-primary">Save</button>
        </div>
      </Modal>

      {/* Ads Modal */}
      <Modal isOpen={showAdsModal} onClose={() => { setShowAdsModal(false); setShowAdForm(false); setEditingAd(null) }} title={`Ads (${ads.length})`} size="lg">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
            <HiOutlineSpeakerphone className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{modalCampaign?.campaignName}</span>
        </div>

        <div className="flex justify-end mb-4">
          <button
            onClick={() => { setEditingAd(null); setAdForm({ headline1: '', headline2: '', headline3: '', description1: '', description2: '', finalUrl: '' }); setShowAdForm(true) }}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            <HiOutlinePlus className="w-4 h-4" /> Add Ad
          </button>
        </div>

        {showAdForm && (
          <form onSubmit={handleAdSubmit} className="mb-4 p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-gray-200 dark:border-gray-600">
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Headline 1 <span className="text-gray-400">(30)</span></label>
                <input type="text" value={adForm.headline1} onChange={(e) => setAdForm({ ...adForm, headline1: e.target.value })} className="input-field text-sm" required maxLength={30} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Headline 2 <span className="text-gray-400">(30)</span></label>
                <input type="text" value={adForm.headline2} onChange={(e) => setAdForm({ ...adForm, headline2: e.target.value })} className="input-field text-sm" required maxLength={30} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Headline 3 <span className="text-gray-400">(opt)</span></label>
                <input type="text" value={adForm.headline3} onChange={(e) => setAdForm({ ...adForm, headline3: e.target.value })} className="input-field text-sm" maxLength={30} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Description 1</label>
                <textarea value={adForm.description1} onChange={(e) => setAdForm({ ...adForm, description1: e.target.value })} className="input-field text-sm" required maxLength={90} rows={2} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Description 2 <span className="text-gray-400">(opt)</span></label>
                <textarea value={adForm.description2} onChange={(e) => setAdForm({ ...adForm, description2: e.target.value })} className="input-field text-sm" maxLength={90} rows={2} />
              </div>
            </div>
            <div className="mb-3">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Final URL</label>
              <input type="url" value={adForm.finalUrl} onChange={(e) => setAdForm({ ...adForm, finalUrl: e.target.value })} className="input-field text-sm" required />
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => { setShowAdForm(false); setEditingAd(null) }} className="btn-secondary text-sm">Cancel</button>
              <button type="submit" className="btn-primary text-sm">{editingAd ? 'Update' : 'Add'}</button>
            </div>
          </form>
        )}

        {adsLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : ads.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">No ads found. Click "Add Ad" to get started.</div>
        ) : (
          <div className="space-y-3">
            {ads.map((ad) => (
              <div key={ad._id} className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-200 dark:border-gray-600">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded text-xs font-semibold">
                      {ad.status === 'active' ? 'Active' : ad.status === 'paused' ? 'Paused' : (ad.status || 'Active').charAt(0).toUpperCase() + (ad.status || 'active').slice(1)}
                    </span>
                    <span className="text-xs font-medium text-primary-600 dark:text-primary-400">{ad.clicks ?? 0} clicks</span>
                    <span className="text-xs text-gray-400">{ad.impressions ?? 0} imp</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => { setEditingAd(ad); setAdForm({ headline1: ad.headline1, headline2: ad.headline2, headline3: ad.headline3 || '', description1: ad.description1, description2: ad.description2 || '', finalUrl: ad.finalUrl }); setShowAdForm(true) }} className="p-1 text-gray-400 hover:text-primary-600 rounded"><HiOutlinePencil className="w-4 h-4" /></button>
                    <button onClick={() => { setSelectedAd(ad); setShowDeleteAd(true) }} className="p-1 text-gray-400 hover:text-red-600 rounded"><HiOutlineTrash className="w-4 h-4" /></button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {[ad.headline1, ad.headline2, ad.headline3].filter(Boolean).map((h, i) => (
                    <span key={i} className="px-2.5 py-1 bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500 rounded-full text-xs font-medium text-gray-700 dark:text-gray-300">{h}</span>
                  ))}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">{ad.description1}</p>
                {ad.description2 && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{ad.description2}</p>}
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* Delete Ad Confirm */}
      <ConfirmDialog isOpen={showDeleteAd} onClose={() => setShowDeleteAd(false)} onConfirm={handleDeleteAd} title="Delete Ad" message={`Delete this ad copy?`} confirmText="Delete" />

      {/* Keywords Modal */}
      <Modal isOpen={showKeywordsModal} onClose={() => { setShowKeywordsModal(false); setShowKeywordForm(false); setEditingKeyword(null) }} title={`Keywords (${keywords.length})`} size="lg">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center">
            <HiOutlineKey className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{modalCampaign?.campaignName}</span>
        </div>

        <div className="flex justify-end mb-4">
          <button
            onClick={() => { setEditingKeyword(null); setKeywordForm({ keyword: '', matchType: 'broad', isNegative: false }); setShowKeywordForm(true) }}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            <HiOutlinePlus className="w-4 h-4" /> Add Keyword
          </button>
        </div>

        {/* Keyword Form */}
        {showKeywordForm && (
          <form onSubmit={handleKeywordSubmit} className="mb-4 p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-gray-200 dark:border-gray-600">
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Keyword</label>
                <input type="text" value={keywordForm.keyword} onChange={(e) => setKeywordForm({ ...keywordForm, keyword: e.target.value })} className="input-field" required placeholder="Enter keyword..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Match Type</label>
                <select value={keywordForm.matchType} onChange={(e) => setKeywordForm({ ...keywordForm, matchType: e.target.value })} className="input-field">
                  <option value="broad">Broad</option>
                  <option value="phrase">Phrase</option>
                  <option value="exact">Exact</option>
                </select>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={keywordForm.isNegative} onChange={(e) => setKeywordForm({ ...keywordForm, isNegative: e.target.checked })} className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Negative Keyword</span>
              </label>
              <div className="flex gap-2">
                <button type="button" onClick={() => { setShowKeywordForm(false); setEditingKeyword(null) }} className="btn-secondary text-sm">Cancel</button>
                <button type="submit" className="btn-primary text-sm">{editingKeyword ? 'Update' : 'Add'}</button>
              </div>
            </div>
          </form>
        )}

        {/* Keywords List */}
        {keywordsLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : keywords.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">No keywords found. Click "Add Keyword" to get started.</div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-600">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700/50">
                  <th className="text-left py-2.5 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Keyword</th>
                  <th className="text-left py-2.5 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Match</th>
                  <th className="text-left py-2.5 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Ad Group</th>
                  <th className="text-left py-2.5 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Status</th>
                  <th className="text-center py-2.5 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Clicks</th>
                  <th className="text-center py-2.5 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Impr.</th>
                  <th className="text-right py-2.5 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Cost</th>
                  <th className="text-right py-2.5 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {keywords.map((kw) => (
                  <tr key={kw._id} className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="py-2.5 px-3 font-medium text-gray-900 dark:text-white">{kw.keyword}</td>
                    <td className="py-2.5 px-3"><span className="uppercase px-2 py-0.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded text-xs font-semibold">{kw.matchType}</span></td>
                    <td className="py-2.5 px-3 text-gray-500 dark:text-gray-400">{kw.adGroup || 'Ad group 1'}</td>
                    <td className="py-2.5 px-3"><StatusBadge status={kw.status} /></td>
                    <td className="py-2.5 px-3 text-center text-gray-700 dark:text-gray-300">{kw.clicks ?? 0}</td>
                    <td className="py-2.5 px-3 text-center text-gray-700 dark:text-gray-300">{kw.impressions ?? 0}</td>
                    <td className="py-2.5 px-3 text-right text-gray-700 dark:text-gray-300">${(kw.cost ?? 0).toFixed(2)}</td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => { setEditingKeyword(kw); setKeywordForm({ keyword: kw.keyword, matchType: kw.matchType, isNegative: kw.isNegative }); setShowKeywordForm(true) }}
                          className="p-1 text-gray-400 hover:text-primary-600 rounded"
                        >
                          <HiOutlinePencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => { setSelectedKeyword(kw); setShowDeleteKeyword(true) }}
                          className="p-1 text-gray-400 hover:text-red-600 rounded"
                        >
                          <HiOutlineTrash className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Modal>

      {/* Delete Keyword Confirm */}
      <ConfirmDialog isOpen={showDeleteKeyword} onClose={() => setShowDeleteKeyword(false)} onConfirm={handleDeleteKeyword} title="Delete Keyword" message={`Delete "${selectedKeyword?.keyword}"?`} confirmText="Delete" />

      <ConfirmDialog isOpen={showDelete} onClose={() => setShowDelete(false)} onConfirm={handleDelete} title="Delete Campaign" message={`Are you sure you want to delete "${selectedCampaign?.campaignName}"?`} confirmText="Delete" />
    </div>
  )
}

export default Campaigns
