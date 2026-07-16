import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { login, clearError, clearTwoFactor } from '../store/slices/authSlice'
import { HiOutlineFire, HiOutlineMail, HiOutlineLockClosed, HiOutlineEye, HiOutlineEyeOff, HiOutlineShieldCheck } from 'react-icons/hi'
import toast from 'react-hot-toast'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [twoFactorCode, setTwoFactorCode] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { isAuthenticated, loading, error, requiresTwoFactor } = useSelector((state) => state.auth)

  useEffect(() => {
    if (isAuthenticated) navigate('/')
  }, [isAuthenticated, navigate])

  useEffect(() => {
    if (error) {
      toast.error(error)
      dispatch(clearError())
    }
  }, [error, dispatch])

  useEffect(() => {
    return () => { dispatch(clearTwoFactor()) }
  }, [dispatch])

  const handleSubmit = async (e) => {
    e.preventDefault()
    const credentials = { email, password }
    if (requiresTwoFactor) credentials.twoFactorCode = twoFactorCode

    const result = await dispatch(login(credentials))
    if (login.fulfilled.match(result) && !result.payload.requiresTwoFactor) {
      navigate('/', { replace: true })
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-950 px-4 py-8">
      <div className="flex w-full max-w-[900px] min-h-[520px] rounded-2xl overflow-hidden shadow-2xl shadow-gray-300/50 dark:shadow-black/40 ring-1 ring-gray-200 dark:ring-gray-800">
      {/* Left branded panel */}
      <div className="hidden lg:flex lg:w-[400px] shrink-0 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)' }}>
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white/5" />
        <div className="absolute -bottom-32 -right-32 w-[28rem] h-[28rem] rounded-full bg-white/5" />
        <div className="absolute top-1/3 right-16 w-64 h-64 rounded-full bg-white/[0.03]" />

        <div className="relative z-10 flex flex-col justify-center items-center w-full px-12 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl mb-8 ring-1 ring-white/20">
            <HiOutlineFire className="w-10 h-10 text-orange-400" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4 tracking-tight">WarmFarm</h1>
          <p className="text-lg text-blue-200/80 max-w-sm leading-relaxed">
            Intelligent warming management for modern agriculture
          </p>
          <div className="mt-12 flex items-center gap-3 text-sm text-blue-300/60">
            <div className="w-8 h-px bg-blue-300/30" />
            <span>Enterprise Dashboard</span>
            <div className="w-8 h-px bg-blue-300/30" />
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center bg-white dark:bg-gray-900 px-6 py-10">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-600 rounded-xl mb-4 lg:hidden">
              <HiOutlineFire className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {requiresTwoFactor ? 'Two-Factor Authentication' : 'Welcome back'}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              {requiresTwoFactor ? 'Enter the code from your authenticator app' : 'Sign in to your WarmFarm account'}
            </p>
          </div>

          <div className="p-2">
            <form onSubmit={handleSubmit} className="space-y-5">
              {!requiresTwoFactor ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email address</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <HiOutlineMail className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                      </div>
                      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com"
                        className="block w-full pl-11 pr-4 py-2.5 text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                        required />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Password</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <HiOutlineLockClosed className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                      </div>
                      <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password"
                        className="block w-full pl-11 pr-11 py-2.5 text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                        required />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                        {showPassword ? <HiOutlineEyeOff className="w-5 h-5" /> : <HiOutlineEye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Authentication Code</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <HiOutlineShieldCheck className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                    </div>
                    <input type="text" value={twoFactorCode} onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="000000" maxLength={6} autoFocus
                      className="block w-full pl-11 pr-4 py-2.5 text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors tracking-[0.3em] text-center font-mono text-lg"
                      required />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Enter the 6-digit code from your authenticator app or a backup code</p>
                </div>
              )}

              <button type="submit" disabled={loading}
                className="btn-primary w-full py-2.5 rounded-lg font-medium text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    {requiresTwoFactor ? 'Verifying...' : 'Signing in...'}
                  </span>
                ) : requiresTwoFactor ? 'Verify' : 'Sign In'}
              </button>

              {requiresTwoFactor && (
                <button type="button" onClick={() => { dispatch(clearTwoFactor()); setTwoFactorCode('') }}
                  className="w-full text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors">
                  Back to login
                </button>
              )}
            </form>

            <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-6">
              Contact your administrator for account access
            </p>
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}

export default Login
