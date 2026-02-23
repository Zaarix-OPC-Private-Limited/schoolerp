import { useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAppContext } from '../context/AppContext'

const navItems = [
    { id: 'dashboard', label: 'Dashboard', route: '/dashboard', icon: 'M4 4h5v5H4zM11 4h5v5h-5zM4 11h5v5H4zM11 11h5v5h-5z' },
    { id: 'students', label: 'Students', route: '/students', icon: 'M4 15c0-2.5 2-4 4.5-4S13 12.5 13 15M10 7.5A2.5 2.5 0 1 1 5 7.5a2.5 2.5 0 0 1 5 0M12.5 15c0-1.8 1.4-3 3.2-3 .7 0 1.3.2 1.8.5M16 7.8a2.1 2.1 0 1 1-4.2 0 2.1 2.1 0 0 1 4.2 0' },
    { id: 'teachers', label: 'Teachers', route: '/teachers', icon: 'M4 5.5C4 4.7 4.7 4 5.5 4H16v11.5H5.5A1.5 1.5 0 0 1 4 14zM7 7h6M7 10h6' },
    { id: 'staff', label: 'Staff', route: '/staff', icon: 'M3.5 7.5h13v7h-13zM7 7.5V6a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1.5' },
    { id: 'fees', label: 'Fees', route: '/fees', icon: 'M3.5 6h13a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-13a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1M12.5 10h2' },
    { id: 'finance', label: 'Income & Expense', route: '/finance', icon: 'M4 14.5V5.5M8 14.5V8.5M12 14.5V6.5M16 14.5V10.5' },
    { id: 'examination', label: 'Examination', route: '/marksheet', icon: 'M6 3.5h6l3 3V16a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1zM12 3.5V7h3' },
    {
        id: 'attendance', label: 'Attendance', route: null, icon: 'M4.5 10.5l3 3 7-7',
        submenu: [
            { id: 'attendance_students', label: 'Student Attendance', route: '/attendance/students' },
            { id: 'attendance_teachers', label: 'Teacher Attendance', route: '/attendance/teachers' },
        ],
    },
    { id: 'notices', label: 'Notice Board', route: '/notices', icon: 'M4 5.5h12v8h-5.2L8 16v-2.5H4z' },
    { id: 'guide', label: 'Guide', route: '/guide', icon: 'M10 3.5a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7zM10 12v5M8 14h4' },
]

export default function AppLayout({ children }) {
    const navigate = useNavigate()
    const location = useLocation()
    const { loggedInDisplayName, loggedInRole, loggedInEmail, handleLogout } = useAppContext()
    const [collapsed, setCollapsed] = useState(false)
    const [attendanceOpen, setAttendanceOpen] = useState(false)
    const [profileOpen, setProfileOpen] = useState(false)
    const profileRef = useRef(null)

    const currentRoute = location.pathname

    const isActive = (item) => {
        if (item.route) return currentRoute === item.route || currentRoute.startsWith(item.route + '/')
        if (item.submenu) return item.submenu.some((sub) => currentRoute === sub.route)
        return false
    }

    const initials = loggedInDisplayName
        .split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]).join('') || 'AD'

    const handleNav = (route) => {
        setAttendanceOpen(false)
        navigate(route)
    }

    const onLogout = () => {
        setProfileOpen(false)
        handleLogout()
        navigate('/login', { replace: true })
    }

    return (
        <div className="flex min-h-screen bg-white">
            {/* ── Sidebar ── */}
            <aside
                className={`shrink-0 bg-white border-r border-slate-200 shadow-sm transition-all duration-200 ${collapsed ? 'w-[64px]' : 'w-60'} flex flex-col`}
                style={{ minHeight: '100vh', position: 'sticky', top: 0, height: '100vh', overflowY: 'auto' }}
            >
                {/* Brand */}
                <div className={`flex items-center justify-between border-b border-slate-200 ${collapsed ? 'p-3' : 'px-4 py-4'}`}>
                    {!collapsed && (
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400">School ERP</p>
                            <h2 className="text-sm font-semibold text-slate-800 leading-tight">Control Panel</h2>
                        </div>
                    )}
                    <button
                        type="button"
                        className="rounded-lg bg-slate-100 p-2 text-slate-600 hover:bg-slate-200 transition shrink-0"
                        onClick={() => setCollapsed((p) => !p)}
                        aria-label="Toggle sidebar"
                    >
                        <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                            <path d="M4 6h12M4 10h12M4 14h12" />
                        </svg>
                    </button>
                </div>

                {/* Nav */}
                <nav className="flex-1 space-y-0.5 px-2 py-3">
                    {navItems.map((item) => {
                        const active = isActive(item)
                        const baseClass = `flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm transition cursor-pointer border-0 text-left`
                        const colorClass = active
                            ? 'bg-slate-800 text-white font-semibold'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'

                        if (item.submenu) {
                            return (
                                <div key={item.id}>
                                    <button
                                        type="button"
                                        className={`${baseClass} ${colorClass}`}
                                        onClick={() => setAttendanceOpen((p) => !p)}
                                    >
                                        <span className="flex items-center gap-3 min-w-0">
                                            <svg viewBox="0 0 20 20" className="h-[18px] w-[18px] shrink-0 opacity-80" fill="none" stroke="currentColor" strokeWidth="1.5">
                                                <path d={item.icon} strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                            {!collapsed && <span className="truncate">{item.label}</span>}
                                        </span>
                                        {!collapsed && (
                                            <svg viewBox="0 0 20 20" className={`h-3.5 w-3.5 shrink-0 opacity-60 transition-transform ${attendanceOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M5 7.5L10 12.5L15 7.5" strokeLinecap="round" />
                                            </svg>
                                        )}
                                    </button>
                                    {attendanceOpen && !collapsed && (
                                        <div className="ml-3 mt-0.5 space-y-0.5 border-l-2 border-slate-200 pl-3">
                                            {item.submenu.map((sub) => (
                                                <button
                                                    key={sub.id}
                                                    type="button"
                                                    className={`block w-full text-left rounded-lg px-3 py-2 text-xs font-medium transition ${currentRoute === sub.route
                                                        ? 'bg-slate-800 text-white'
                                                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                                        }`}
                                                    onClick={() => handleNav(sub.route)}
                                                >
                                                    {sub.label}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )
                        }

                        return (
                            <button
                                key={item.id}
                                type="button"
                                className={`${baseClass} ${colorClass}`}
                                onClick={() => handleNav(item.route)}
                                title={collapsed ? item.label : undefined}
                            >
                                <span className="flex items-center gap-3 min-w-0">
                                    <svg viewBox="0 0 20 20" className="h-[18px] w-[18px] shrink-0 opacity-80" fill="none" stroke="currentColor" strokeWidth="1.5">
                                        <path d={item.icon} strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                    {!collapsed && <span className="truncate">{item.label}</span>}
                                </span>
                            </button>
                        )
                    })}
                </nav>

                {/* Profile / Logout */}
                <div
                    className={`border-t border-slate-200 ${collapsed ? 'p-2' : 'p-3'}`}
                    ref={profileRef}
                    style={{ position: 'relative' }}
                >
                    <button
                        type="button"
                        className="flex w-full items-center gap-3 rounded-lg p-2 hover:bg-slate-100 transition"
                        onClick={() => setProfileOpen((p) => !p)}
                    >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-800 text-[11px] font-bold text-white">
                            {initials}
                        </span>
                        {!collapsed && (
                            <div className="min-w-0 text-left">
                                <p className="truncate text-xs font-semibold text-slate-800">{loggedInDisplayName || 'User'}</p>
                                <p className="truncate text-[10px] text-slate-500">{loggedInRole || 'Admin'}</p>
                            </div>
                        )}
                    </button>

                    {profileOpen && (
                        <div className="absolute bottom-full left-3 right-3 mb-2 rounded-xl border border-slate-200 bg-white p-3 shadow-xl z-50">
                            <p className="text-xs font-semibold text-slate-800">{loggedInDisplayName}</p>
                            <p className="mt-0.5 text-[11px] text-slate-500 truncate">{loggedInEmail}</p>
                            <p className="text-[11px] text-slate-500">{loggedInRole}</p>
                            <button
                                type="button"
                                className="mt-2 w-full rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 transition"
                                onClick={onLogout}
                            >
                                Logout
                            </button>
                        </div>
                    )}
                </div>
            </aside>

            {/* Page content */}
            <main className="min-w-0 flex-1 bg-white">
                {children}
            </main>
        </div>
    )
}
