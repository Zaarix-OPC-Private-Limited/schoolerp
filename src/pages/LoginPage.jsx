import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAppContext } from '../context/AppContext'

const roles = ['Director', 'Principal', 'Vice Principal', 'Controller']
const roleIcons = {
  Director: (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
      <path d="M10 2L12.4 6.9L17.8 7.7L13.9 11.5L14.9 16.9L10 14.3L5.1 16.9L6.1 11.5L2.2 7.7L7.6 6.9L10 2Z" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  ),
  Principal: (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
      <path d="M10 3L17 6.5V13.5L10 17L3 13.5V6.5L10 3Z" stroke="currentColor" strokeWidth="1.4" />
      <path d="M7.5 10.2L9.2 11.9L12.8 8.3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  'Vice Principal': (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
      <rect x="3" y="4" width="14" height="12" rx="2.2" stroke="currentColor" strokeWidth="1.4" />
      <path d="M6 8.5H14M6 11.5H11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  ),
  Controller: (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
      <circle cx="10" cy="10" r="6.8" stroke="currentColor" strokeWidth="1.4" />
      <path d="M10 6.8V10L12.4 11.4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  ),
}

function LoginPage() {
  const navigate = useNavigate()
  const { handleLogin } = useAppContext()
  const [isRoleOpen, setIsRoleOpen] = useState(false)
  const [selectedRole, setSelectedRole] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [formError, setFormError] = useState('')
  const roleMenuRef = useRef(null)

  useEffect(() => {
    function handleOutsideClick(event) {
      if (roleMenuRef.current && !roleMenuRef.current.contains(event.target)) {
        setIsRoleOpen(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  const handleLoginSubmit = (event) => {
    event.preventDefault()
    const trimmedEmail = email.trim()
    const trimmedPassword = password.trim()

    if (!selectedRole) {
      setFormError('Please select a role before login.')
      return
    }
    if (!/^[a-zA-Z0-9._%+-]+@gmail\.com$/i.test(trimmedEmail)) {
      setFormError('Please enter a valid Gmail address (example@gmail.com).')
      return
    }
    if (trimmedPassword.length < 6) {
      setFormError('Password must be at least 6 characters.')
      return
    }

    setFormError('')
    handleLogin({
      username: trimmedEmail,
      role: selectedRole,
    })
    navigate('/dashboard', { replace: true })
  }

  return (
    <motion.section
      key="login"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="grid min-h-screen grid-cols-1 lg:grid-cols-2"
    >
      <motion.aside
        initial={{ x: -40, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="relative hidden overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-cyan-900 px-14 py-16 text-white lg:flex lg:flex-col lg:justify-between"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(255,255,255,0.14),transparent_35%),radial-gradient(circle_at_90%_85%,rgba(255,255,255,0.1),transparent_35%)]" />
        <div className="relative">
          <p className="text-sm font-semibold uppercase tracking-[0.26em] text-cyan-100">School ERP</p>
          <h2 className="mt-6 max-w-md text-5xl font-black leading-tight">Leadership Control Center</h2>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-cyan-50/90">
            Manage academics, operations and institutional decisions with one enterprise-grade platform.
          </p>
        </div>
        <div className="relative text-sm text-cyan-100/90">Trusted by school leadership teams.</div>
      </motion.aside>

      <motion.section
        initial={{ x: 40, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="flex items-center justify-center bg-slate-50 px-6 py-10 sm:px-10"
      >
        <div className="w-full max-w-md">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-700 lg:hidden">School ERP</p>
          <h3 className="mt-2 text-4xl font-bold tracking-tight text-slate-900">Sign In</h3>
          <p className="mt-2 text-sm text-slate-600">Access your authorized dashboard.</p>

          <form
            className="mt-8 space-y-5"
            onSubmit={handleLoginSubmit}
          >
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-800">Select Role</span>
              <div ref={roleMenuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setIsRoleOpen((prev) => !prev)}
                  className="flex w-full items-center justify-between rounded-xl border border-cyan-200 bg-cyan-50/70 px-4 py-3 text-sm font-medium text-slate-900 outline-none transition hover:border-cyan-300 focus:border-cyan-600 focus:bg-white focus:ring-2 focus:ring-cyan-200"
                >
                  <span className={`flex items-center gap-2 ${selectedRole ? 'text-slate-900' : 'text-slate-500'}`}>
                    {selectedRole ? <span className="text-cyan-700">{roleIcons[selectedRole]}</span> : null}
                    <span>{selectedRole || 'Choose your role'}</span>
                  </span>
                  <svg
                    viewBox="0 0 20 20"
                    fill="none"
                    className={`h-5 w-5 text-cyan-700 transition-transform ${isRoleOpen ? 'rotate-180' : ''}`}
                    aria-hidden="true"
                  >
                    <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                </button>
                <input type="hidden" name="role" value={selectedRole} />
                <AnimatePresence>
                  {isRoleOpen ? (
                    <motion.ul
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.16 }}
                      className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-cyan-200 bg-white shadow-[0_16px_36px_-20px_rgba(8,47,73,0.55)]"
                    >
                      {roles.map((role) => (
                        <li key={role}>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedRole(role)
                              setIsRoleOpen(false)
                              setFormError('')
                            }}
                            className={`flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium transition ${selectedRole === role
                              ? 'bg-cyan-700 text-white'
                              : 'text-slate-800 hover:bg-cyan-50 hover:text-slate-900'
                              }`}
                          >
                            <span>{roleIcons[role]}</span>
                            <span>{role}</span>
                          </button>
                        </li>
                      ))}
                    </motion.ul>
                  ) : null}
                </AnimatePresence>
              </div>
            </label>

            {formError ? <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800">{formError}</p> : null}

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-800">Email</span>
              <input
                type="email"
                placeholder="Enter Gmail address"
                className="w-full rounded-xl border border-cyan-200 bg-cyan-50/70 px-4 py-3 text-sm font-medium text-slate-900 outline-none transition hover:border-cyan-300 focus:border-cyan-600 focus:bg-white focus:ring-2 focus:ring-cyan-200 placeholder:text-slate-500/70"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value)
                  if (formError) setFormError('')
                }}
                autoComplete="email"
                required
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-800">Password</span>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter password"
                  className="w-full rounded-xl border border-cyan-200 bg-cyan-50/70 px-4 py-3 pr-11 text-sm font-medium text-slate-900 outline-none transition hover:border-cyan-300 focus:border-cyan-600 focus:bg-white focus:ring-2 focus:ring-cyan-200 placeholder:text-slate-500/70"
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value)
                    if (formError) setFormError('')
                  }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-cyan-700"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
                      <path d="M12 5C7.9 5 4.7 8.7 3.2 11.1C2.9 11.5 2.9 12.1 3.2 12.5C4.7 14.9 7.9 18.6 12 18.6C16.1 18.6 19.3 14.9 20.8 12.5C21.1 12.1 21.1 11.5 20.8 11.1C19.3 8.7 16.1 5 12 5Z" stroke="currentColor" strokeWidth="1.7" />
                      <circle cx="12" cy="12" r="2.7" stroke="currentColor" strokeWidth="1.7" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
                      <path d="M3 3L21 21" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                      <path d="M10.5 10.7C10.2 11.1 10 11.5 10 12C10 13.1 10.9 14 12 14C12.5 14 12.9 13.8 13.3 13.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                      <path d="M6.7 6.8C5 8 3.8 9.6 3.2 10.5C2.9 10.9 2.9 11.5 3.2 11.9C4.7 14.3 7.9 18 12 18C13.7 18 15.3 17.4 16.7 16.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                      <path d="M9.1 4.6C10 4.2 11 4 12 4C16.1 4 19.3 7.7 20.8 10.1C21.1 10.5 21.1 11.1 20.8 11.5C20.4 12.1 19.7 13.2 18.8 14.2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                    </svg>
                  )}
                </button>
              </div>
            </label>

            <div className="mt-6">
              <button
                type="submit"
                className="group relative flex w-full items-center justify-center overflow-hidden rounded-xl bg-cyan-700 px-4 py-3 text-sm font-semibold text-white shadow-md transition-all duration-300 hover:bg-cyan-600 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-cyan-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
                aria-label="Login"
              >
                <span className="relative z-10 flex items-center gap-2">
                  <span>Login</span>
                  <svg className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
                  </svg>
                </span>
                <span className="absolute inset-0 z-0 h-full w-full -translate-x-full bg-linear-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              </button>
            </div>

            <button type="button" className="w-full text-center text-sm font-medium text-cyan-700 transition hover:text-cyan-900">
              Forgot Password?
            </button>
          </form>
        </div>
      </motion.section>
    </motion.section>
  )
}

export default LoginPage
