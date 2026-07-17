import { Routes, Route, Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import Layout from './components/Layout/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Accounts from './pages/Accounts'
import Campaigns from './pages/Campaigns'
import Keywords from './pages/Keywords'
import AdCopies from './pages/AdCopies'
import Publish from './pages/Publish'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import Security from './pages/Security'
import Users from './pages/Users'
import GoogleCallback from './pages/GoogleCallback'

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useSelector((state) => state.auth)
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return children
}

const AdminRoute = ({ children }) => {
  const { user } = useSelector((state) => state.auth)
  if (!['admin', 'super_admin'].includes(user?.role)) return <Navigate to="/" replace />
  return children
}

const App = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/google-callback" element={<ProtectedRoute><GoogleCallback /></ProtectedRoute>} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="accounts" element={<Accounts />} />
        <Route path="campaigns" element={<Campaigns />} />
        <Route path="campaigns/:campaignId/keywords" element={<Keywords />} />
        <Route path="campaigns/:campaignId/ads" element={<AdCopies />} />
        <Route path="publish" element={<Publish />} />
        <Route path="reports" element={<Reports />} />
        <Route path="security" element={<Security />} />
        <Route path="settings" element={<Settings />} />
        <Route path="users" element={<Users />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
