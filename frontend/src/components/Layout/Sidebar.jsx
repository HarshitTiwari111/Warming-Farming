import { NavLink } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { HiOutlineHome, HiOutlineUserGroup, HiOutlineSpeakerphone, HiOutlineFire, HiOutlineChartBar, HiOutlineCog, HiOutlineX, HiOutlineUserAdd, HiOutlineShieldCheck, HiOutlineMenu } from 'react-icons/hi'

const allMenuItems = [
  { name: 'Dashboard', path: '/', icon: HiOutlineHome },
  { name: 'Accounts', path: '/accounts', icon: HiOutlineUserGroup },
  { name: 'Campaigns', path: '/campaigns', icon: HiOutlineSpeakerphone },
  { name: 'Reports', path: '/reports', icon: HiOutlineChartBar },
  { name: 'Security', path: '/security', icon: HiOutlineShieldCheck },
  { name: 'Users', path: '/users', icon: HiOutlineUserAdd, adminOnly: true },
  { name: 'Settings', path: '/settings', icon: HiOutlineCog },
]

const Sidebar = ({ isOpen, onToggle, collapsed, onCollapse }) => {
  const { user } = useSelector((state) => state.auth)
  const isAdmin = user?.role === 'admin'
  const menuItems = allMenuItems.filter(item => !item.adminOnly || isAdmin)

  return (
    <>
      {isOpen && <div className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden" onClick={onToggle} />}
      <aside className={`fixed lg:static inset-y-0 left-0 z-30 bg-[#0f172a] transform transition-all duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} ${collapsed ? 'lg:w-[70px] w-64' : 'w-64'}`}>
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-700/50">
          <div className={`flex items-center gap-2 ${collapsed ? 'lg:hidden' : ''}`}>
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center shrink-0">
              <HiOutlineFire className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-white">WarmFarm</span>
          </div>
          {/* Collapsed: show only logo icon on desktop */}
          {collapsed && (
            <div className="hidden lg:flex items-center">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <HiOutlineFire className="w-5 h-5 text-white" />
              </div>
            </div>
          )}
          {/* Desktop collapse toggle - right side of header */}
          <button
            onClick={onCollapse}
            className="hidden lg:flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <HiOutlineMenu className="w-5 h-5" />
          </button>
          {/* Mobile close button */}
          <button onClick={onToggle} className="lg:hidden text-slate-400 hover:text-white">
            <HiOutlineX className="w-5 h-5" />
          </button>
        </div>

        <nav className="mt-2 px-2 flex-1">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              onClick={() => { if (isOpen) onToggle() }}
              title={collapsed ? item.name : undefined}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 text-sm font-medium transition-colors ${collapsed ? 'lg:justify-center lg:px-0' : ''} ${isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`
              }
            >
              <item.icon className="w-5 h-5 shrink-0" />
              <span className={collapsed ? 'lg:hidden' : ''}>{item.name}</span>
            </NavLink>
          ))}
        </nav>

        <div className={`absolute bottom-4 left-2 right-2 ${collapsed ? 'lg:left-1 lg:right-1' : ''}`}>
          <div className={`bg-slate-800 rounded-lg px-3 py-2 border border-slate-700/50 ${collapsed ? 'lg:px-1.5 lg:py-1.5 lg:flex lg:justify-center' : ''}`}>
            {collapsed ? (
              <>
                <div className="hidden lg:flex w-8 h-8 bg-blue-500/20 text-blue-400 rounded-full items-center justify-center text-xs font-bold" title={`${user?.name} (${user?.role})`}>
                  {user?.name?.charAt(0)?.toUpperCase()}
                </div>
                <div className="lg:hidden">
                  <p className="text-xs font-semibold text-blue-400">{isAdmin ? 'Admin Panel' : 'User'}</p>
                  <p className="text-xs text-slate-400">{user?.email}</p>
                </div>
              </>
            ) : (
              <>
                <p className="text-xs font-semibold text-blue-400">{isAdmin ? 'Admin Panel' : 'User'}</p>
                <p className="text-xs text-slate-400">{user?.email}</p>
              </>
            )}
          </div>
        </div>
      </aside>
    </>
  )
}

export default Sidebar
