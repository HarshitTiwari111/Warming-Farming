import { NavLink } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { HiOutlineHome, HiOutlineUserGroup, HiOutlineSpeakerphone, HiOutlineFire, HiOutlineChartBar, HiOutlineCog, HiOutlineX, HiOutlineUserAdd, HiOutlineShieldCheck } from 'react-icons/hi'

const allMenuItems = [
  { name: 'Dashboard', path: '/', icon: HiOutlineHome },
  { name: 'Accounts', path: '/accounts', icon: HiOutlineUserGroup },
  { name: 'Campaigns', path: '/campaigns', icon: HiOutlineSpeakerphone },
  { name: 'Reports', path: '/reports', icon: HiOutlineChartBar },
  { name: 'Security', path: '/security', icon: HiOutlineShieldCheck },
  { name: 'Users', path: '/users', icon: HiOutlineUserAdd, adminOnly: true },
  { name: 'Settings', path: '/settings', icon: HiOutlineCog },
]

const Sidebar = ({ isOpen, onToggle }) => {
  const { user } = useSelector((state) => state.auth)
  const isAdmin = user?.role === 'admin'
  const menuItems = allMenuItems.filter(item => !item.adminOnly || isAdmin)

  return (
    <>
      {isOpen && <div className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden" onClick={onToggle} />}
      <aside className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-[#0f172a] transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-0 lg:overflow-hidden'}`}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-slate-700/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <HiOutlineFire className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-white">WarmFarm</span>
          </div>
          <button onClick={onToggle} className="lg:hidden text-slate-400 hover:text-white"><HiOutlineX className="w-5 h-5" /></button>
        </div>
        <nav className="mt-4 px-3 flex-1">
          {menuItems.map((item) => (
            <NavLink key={item.path} to={item.path} end={item.path === '/'} className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 text-sm font-medium transition-colors ${isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}>
              <item.icon className="w-5 h-5" />
              {item.name}
            </NavLink>
          ))}
        </nav>
        <div className="absolute bottom-4 left-3 right-3">
          <div className="bg-slate-800 rounded-lg px-3 py-2 border border-slate-700/50">
            <p className="text-xs font-semibold text-blue-400">{isAdmin ? 'Admin Panel' : 'User'}</p>
            <p className="text-xs text-slate-400">{user?.email}</p>
          </div>
        </div>
      </aside>
    </>
  )
}

export default Sidebar
