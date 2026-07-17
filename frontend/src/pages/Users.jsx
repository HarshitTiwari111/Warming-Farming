import { useState, useEffect, useCallback } from 'react'
import { useSelector } from 'react-redux'
import DataTable from '../components/UI/DataTable'
import Modal from '../components/UI/Modal'
import ConfirmDialog from '../components/UI/ConfirmDialog'
import Pagination from '../components/UI/Pagination'
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineBadgeCheck } from 'react-icons/hi'
import api from '../services/api'
import toast from 'react-hot-toast'

const initialForm = { name: '', email: '', password: '', role: 'user' }

const roleBadgeStyles = {
  admin: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  user: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
}

const Users = () => {
  const { user: currentUser } = useSelector((state) => state.auth)

  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [form, setForm] = useState(initialForm)

  const loadUsers = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/users', { params: { page, limit: 10 } })
      setUsers(data.data || [])
      setPagination(data.pagination)
    } catch {
      toast.error('Failed to load users')
    }
    setLoading(false)
  }, [page])

  useEffect(() => { loadUsers() }, [loadUsers])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (selectedUser) {
        const updateData = { name: form.name, email: form.email, role: form.role }
        await api.put(`/users/${selectedUser._id}`, updateData)
        toast.success('User updated')
      } else {
        if (!form.password || form.password.length < 8) {
          toast.error('Password must be at least 8 characters with uppercase, lowercase, number & special character')
          return
        }
        await api.post('/users', form)
        toast.success('User created')
      }
      setShowModal(false)
      setForm(initialForm)
      setSelectedUser(null)
      loadUsers()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed')
    }
  }

  const handleEdit = (user) => {
    setSelectedUser(user)
    setForm({ name: user.name, email: user.email, password: '', role: user.role })
    setShowModal(true)
  }

  const handleDelete = async () => {
    try {
      await api.delete(`/users/${selectedUser._id}`)
      toast.success('User deleted')
      setShowDelete(false)
      setSelectedUser(null)
      loadUsers()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed')
    }
  }

  const columns = [
    { key: 'name', label: 'Name', sortable: true, filterable: true, render: (row) => (
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-sm font-semibold">
          {row.name?.charAt(0)?.toUpperCase()}
        </div>
        <span className="font-medium">{row.name}</span>
      </div>
    )},
    { key: 'email', label: 'Email', sortable: true, filterable: true },
    { key: 'role', label: 'Role', filterable: true, filterType: 'select', filterOptions: [{value:'admin',label:'Admin'},{value:'user',label:'User'}], render: (row) => (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${roleBadgeStyles[row.role] || roleBadgeStyles.user}`}>
        {row.role === 'admin' && <HiOutlineBadgeCheck className="w-3 h-3" />}
        {row.role}
      </span>
    )},
    { key: 'isActive', label: 'Status', render: (row) => (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${row.isActive !== false ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}`}>
        {row.isActive !== false ? 'Active' : 'Inactive'}
      </span>
    )},
    { key: 'twoFactorEnabled', label: '2FA', render: (row) => (
      <span className={`text-xs font-medium ${row.twoFactorEnabled ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`}>
        {row.twoFactorEnabled ? 'Enabled' : 'Off'}
      </span>
    )},
    { key: 'createdAt', label: 'Joined', sortable: true, render: (row) => new Date(row.createdAt).toLocaleDateString() },
    {
      key: 'actions', label: 'Actions', render: (row) => (
        <div className="flex items-center gap-2">
          <button onClick={() => handleEdit(row)} className="text-gray-500 hover:text-primary-600"><HiOutlinePencil className="w-4 h-4" /></button>
          {row._id !== currentUser?._id && (
            <button onClick={() => { setSelectedUser(row); setShowDelete(true) }} className="text-gray-500 hover:text-red-600"><HiOutlineTrash className="w-4 h-4" /></button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div>
      <div className="flex justify-end mb-6">
        <button onClick={() => { setSelectedUser(null); setForm(initialForm); setShowModal(true) }} className="btn-primary flex items-center gap-2">
          <HiOutlinePlus className="w-4 h-4" /> Add User
        </button>
      </div>

      <DataTable columns={columns} data={users} loading={loading} emptyMessage="No users found" />
      {pagination && <div className="mt-4"><Pagination currentPage={pagination.page} totalPages={pagination.pages} onPageChange={setPage} /></div>}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={selectedUser ? 'Edit User' : 'Add New User'}>
        <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" required autoComplete="off" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input-field" required autoComplete="new-email" />
          </div>
          {!selectedUser && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
              <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="input-field" required minLength={8} placeholder="Min 8 chars (A-z, 0-9, !@#)" autoComplete="new-password" />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="input-field">
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {form.role === 'admin' ? 'Full access — can manage all users, see all data, and configure settings' :
               'Can connect own Google Ads, manage own accounts/campaigns, and view own reports'}
            </p>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">{selectedUser ? 'Update' : 'Create User'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={handleDelete}
        title="Delete User"
        message={`Are you sure you want to delete "${selectedUser?.name}"? This action cannot be undone.`}
        confirmText="Delete"
      />
    </div>
  )
}

export default Users
