import { useState, useRef, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate, useLocation } from 'react-router-dom'
import { HiOutlineMenu, HiOutlineLogout, HiOutlineSun, HiOutlineMoon, HiOutlineLockClosed } from 'react-icons/hi'
import { logoutAsync } from '../../store/slices/authSlice'
import ConfirmDialog from '../UI/ConfirmDialog'
import Modal from '../UI/Modal'
import api from '../../services/api'
import toast from 'react-hot-toast'

const Header = ({ onMenuClick }) => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useSelector((state) => state.auth)
  const [showDropdown, setShowDropdown] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [changingPassword, setChangingPassword] = useState(false)
  const dropdownRef = useRef(null)

  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode')
    if (saved) return JSON.parse(saved)
    // First visit: follow the OS theme (styling itself only reacts to .dark)
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
  })

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    localStorage.setItem('darkMode', JSON.stringify(darkMode))
  }, [darkMode])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setShowDropdown(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const pageTitles = {
    '/': { title: 'Dashboard', subtitle: 'Overview of your warming & farming operations' },
    '/accounts': { title: 'Accounts', subtitle: 'Manage Google Ads accounts' },
    '/campaigns': { title: 'Campaigns', subtitle: 'Manage advertising campaigns' },
    '/publish': { title: 'Publish', subtitle: 'Publish campaigns to Google Ads' },
    '/reports': { title: 'Reports', subtitle: 'Generate and view reports' },
    '/security': { title: 'Security', subtitle: '2FA, sessions, and login history' },
    '/settings': { title: 'Settings', subtitle: 'Google Ads API connection' },
    '/users': { title: 'Users', subtitle: 'Manage system users and their roles' },
  }

  const getPageInfo = () => {
    if (pageTitles[location.pathname]) return pageTitles[location.pathname]
    if (location.pathname.includes('/keywords')) return { title: 'Ad Copy (Keywords)', subtitle: 'Manage campaign keywords and ad copies' }
    if (location.pathname.includes('/ads')) return { title: 'Ad Copy (Keywords)', subtitle: 'Manage campaign ad copies' }
    return { title: 'WarmFarm', subtitle: '' }
  }
  const currentPage = getPageInfo()

  const handleLogout = async () => { await dispatch(logoutAsync()); navigate('/login') }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }
    setChangingPassword(true)
    try {
      await api.put('/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      })
      toast.success('Password changed successfully')
      setShowChangePassword(false)
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password')
    } finally {
      setChangingPassword(false)
    }
  }

  return (
    <>
    <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <button onClick={onMenuClick} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 lg:hidden"><HiOutlineMenu className="w-6 h-6" /></button>
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">{currentPage.title}</h1>
          {currentPage.subtitle && <p className="text-xs text-gray-500 dark:text-gray-400">{currentPage.subtitle}</p>}
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="relative" ref={dropdownRef}>
          <button onClick={() => setShowDropdown(!showDropdown)} className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg px-3 py-2">
            <div className="w-8 h-8 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-sm font-semibold">{user?.name?.charAt(0)?.toUpperCase()}</div>
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{user?.name}</span>
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${user?.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>{user?.role}</span>
            </div>
          </button>
          {showDropdown && (
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
              <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user?.role}</p>
              </div>
              <button
                onClick={() => { setDarkMode(!darkMode); }}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                {darkMode ? <HiOutlineSun className="w-4 h-4" /> : <HiOutlineMoon className="w-4 h-4" />}
                {darkMode ? 'Light Mode' : 'Dark Mode'}
              </button>
              <button
                onClick={() => { setShowDropdown(false); setShowChangePassword(true) }}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <HiOutlineLockClosed className="w-4 h-4" /> Change Password
              </button>
              <div className="border-t border-gray-100 dark:border-gray-700" />
              <button onClick={() => { setShowDropdown(false); setShowLogoutConfirm(true) }} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                <HiOutlineLogout className="w-4 h-4" /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>

    <Modal isOpen={showChangePassword} onClose={() => setShowChangePassword(false)} title="Change Password">
      <form onSubmit={handleChangePassword} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Current Password</label>
          <input type="password" value={passwordForm.currentPassword} onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} className="input-field" required autoComplete="current-password" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New Password</label>
          <input type="password" value={passwordForm.newPassword} onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} className="input-field" required autoComplete="new-password" minLength={6} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm New Password</label>
          <input type="password" value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} className="input-field" required autoComplete="new-password" minLength={6} />
        </div>
        <div className="flex justify-end gap-3 pt-2 border-t border-gray-100 dark:border-gray-700">
          <button type="button" onClick={() => setShowChangePassword(false)} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={changingPassword} className="btn-primary disabled:opacity-50">
            {changingPassword ? 'Changing...' : 'Change Password'}
          </button>
        </div>
      </form>
    </Modal>

    <ConfirmDialog isOpen={showLogoutConfirm} onClose={() => setShowLogoutConfirm(false)} onConfirm={handleLogout} title="Logout" message="Are you sure you want to logout?" confirmText="Logout" variant="danger" />
    </>
  )
}

export default Header
