import { useState, useEffect, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchAccounts, createAccount, bulkCreateAccounts, updateAccount, deleteAccount } from '../store/slices/accountSlice'
import DataTable from '../components/UI/DataTable'
import Modal from '../components/UI/Modal'
import ConfirmDialog from '../components/UI/ConfirmDialog'
import Pagination from '../components/UI/Pagination'
import StatusBadge from '../components/UI/StatusBadge'
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineExternalLink } from 'react-icons/hi'
import toast from 'react-hot-toast'

const GOOGLE_AUTH_URL = 'https://secure.dataram.workers.dev/auth/login'

const initialForm = { name: '', timezone: 'Asia/Kolkata', currency: 'USD', billingBudget: 2, inviteEmail: '', autoTagging: false, audienceUnknown: false, count: 1 }

const Accounts = () => {
  const dispatch = useDispatch()
  const { accounts, pagination, loading } = useSelector((state) => state.accounts)
  const [page, setPage] = useState(1)
  const [showModal, setShowModal] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState(null)
  const [form, setForm] = useState(initialForm)
  const [submitting, setSubmitting] = useState(false)

  const loadAccounts = useCallback(() => {
    const params = { page, limit: 10 }
    dispatch(fetchAccounts(params))
  }, [dispatch, page])

  useEffect(() => { loadAccounts() }, [loadAccounts])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      if (selectedAccount) {
        const { count, ...updateData } = form
        await dispatch(updateAccount({ id: selectedAccount._id, ...updateData })).unwrap()
        toast.success('Account updated')
      } else {
        const count = Math.max(1, parseInt(form.count) || 1)
        if (count > 1) {
          const result = await dispatch(bulkCreateAccounts(form)).unwrap()
          toast.success(`${result.count} accounts created with campaigns`)
        } else {
          const { count: _, ...createData } = form
          await dispatch(createAccount(createData)).unwrap()
          toast.success('Account created with campaign')
        }
      }
      setShowModal(false)
      setForm(initialForm)
      setSelectedAccount(null)
      loadAccounts()
    } catch (err) {
      toast.error(typeof err === 'string' ? err : err?.message || 'Operation failed')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (account) => {
    setSelectedAccount(account)
    setForm({
      name: account.name,
      timezone: account.timezone || 'Asia/Kolkata',
      currency: account.currency || 'USD',
      billingBudget: account.billingBudget ?? 2,
      inviteEmail: account.inviteEmail || '',
      autoTagging: account.autoTagging || false,
      audienceUnknown: account.audienceUnknown || false,
      count: 1,
    })
    setShowModal(true)
  }

  const handleDelete = async () => {
    try {
      await dispatch(deleteAccount(selectedAccount._id)).unwrap()
      toast.success('Account deleted')
      setShowDelete(false)
      setSelectedAccount(null)
      loadAccounts()
    } catch (err) {
      toast.error(typeof err === 'string' ? err : err?.message || 'Operation failed')
    }
  }

  const columns = [
    { key: 'name', label: 'Name', sortable: true, filterable: true, render: (row) => <span className="font-medium">{row.name}</span> },
    { key: 'inviteEmail', label: 'Invite Email', sortable: true, filterable: true },
    { key: 'currency', label: 'Currency', sortable: true, filterable: true, filterType: 'select', filterOptions: [{value:'USD',label:'USD'},{value:'INR',label:'INR'},{value:'EUR',label:'EUR'},{value:'GBP',label:'GBP'},{value:'AED',label:'AED'},{value:'AUD',label:'AUD'},{value:'SGD',label:'SGD'}] },
    { key: 'billingBudget', label: 'Billing Budget', sortable: true, render: (row) => `$${row.billingBudget ?? 0}` },
    { key: 'timezone', label: 'Timezone', sortable: true, filterable: true },
    { key: 'status', label: 'Status', filterable: true, filterType: 'select', filterOptions: [{value:'active',label:'Active'},{value:'pending',label:'Pending'},{value:'suspended',label:'Suspended'},{value:'paused',label:'Paused'}], render: (row) => <StatusBadge status={row.status} /> },
    {
      key: 'actions', label: 'Actions', render: (row) => (
        <div className="flex items-center gap-2">
          <button onClick={() => handleEdit(row)} className="text-gray-500 hover:text-primary-600"><HiOutlinePencil className="w-4 h-4" /></button>
          <button onClick={() => { setSelectedAccount(row); setShowDelete(true) }} className="text-gray-500 hover:text-red-600"><HiOutlineTrash className="w-4 h-4" /></button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <div className="flex justify-end gap-3 mb-6">
        <a
          href={`${GOOGLE_AUTH_URL}?return_url=${window.location.origin}`}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 transition-colors"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Connect with Google
          <HiOutlineExternalLink className="w-3.5 h-3.5" />
        </a>
        <button onClick={() => { setSelectedAccount(null); setForm(initialForm); setShowModal(true) }} className="btn-primary flex items-center gap-2">
          <HiOutlinePlus className="w-4 h-4" /> Add Accounts
        </button>
      </div>

      <DataTable columns={columns} data={accounts} loading={loading} emptyMessage="No accounts found" />
      {pagination && <div className="mt-4"><Pagination currentPage={pagination.page} totalPages={pagination.pages} onPageChange={setPage} /></div>}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={selectedAccount ? 'Edit Account' : 'Add Accounts'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!selectedAccount && (
            <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-3">
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-primary-700 dark:text-primary-300 mb-1">Number of accounts</label>
                  <input type="number" value={form.count} onChange={(e) => setForm({ ...form, count: Math.max(1, parseInt(e.target.value) || 1) })} className="input-field" min="1" max="100" />
                </div>
                <p className="flex-1 text-xs text-primary-600 dark:text-primary-400 mt-4">Each account auto-creates 1 campaign ($20-40 budget)</p>
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Invite Email</label>
              <input type="email" value={form.inviteEmail} onChange={(e) => setForm({ ...form, inviteEmail: e.target.value })} className="input-field" required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Timezone</label>
              <select value={form.timezone} onChange={(e) => setForm({ ...form, timezone: e.target.value })} className="input-field">
                <option value="Asia/Kolkata">Asia/Kolkata</option>
                <option value="US/Eastern">US/Eastern</option>
                <option value="US/Pacific">US/Pacific</option>
                <option value="US/Central">US/Central</option>
                <option value="Europe/London">Europe/London</option>
                <option value="Europe/Berlin">Europe/Berlin</option>
                <option value="Asia/Dubai">Asia/Dubai</option>
                <option value="Asia/Singapore">Asia/Singapore</option>
                <option value="Australia/Sydney">Australia/Sydney</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Currency</label>
              <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} className="input-field">
                <option value="USD">USD</option>
                <option value="INR">INR</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="AED">AED</option>
                <option value="AUD">AUD</option>
                <option value="SGD">SGD</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Billing Budget ($)</label>
            <input type="number" value={form.billingBudget} onChange={(e) => setForm({ ...form, billingBudget: Number(e.target.value) })} className="input-field" min="0" />
          </div>
          <div className="flex items-center gap-6 pt-1">
            <div className="flex items-center gap-2.5">
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={form.autoTagging} onChange={(e) => setForm({ ...form, autoTagging: e.target.checked })} className="sr-only peer" />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:after:border-gray-500 peer-checked:bg-primary-600"></div>
              </label>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Auto Tagging</span>
            </div>
            <div className="flex items-center gap-2.5">
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={form.audienceUnknown} onChange={(e) => setForm({ ...form, audienceUnknown: e.target.checked })} className="sr-only peer" />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:after:border-gray-500 peer-checked:bg-primary-600"></div>
              </label>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Audience Unknown</span>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-700">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary disabled:opacity-50">
              {submitting ? (
                <span className="inline-flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Creating...
                </span>
              ) : selectedAccount ? 'Update' : form.count > 1 ? `Create ${form.count} Accounts` : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={showDelete} onClose={() => setShowDelete(false)} onConfirm={handleDelete} title="Delete Account" message={`Are you sure you want to delete "${selectedAccount?.name}"?`} confirmText="Delete" />
    </div>
  )
}

export default Accounts
