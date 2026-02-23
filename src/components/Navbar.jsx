import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAppContext } from '../context/AppContext'

const navLinks = [
    {
        to: '/dashboard',
        label: 'Dashboard',
        icon: 'M4 4h5v5H4zM11 4h5v5h-5zM4 11h5v5H4zM11 11h5v5h-5z',
    },
    {
        to: '/students',
        label: 'Students',
        icon: 'M4 15c0-2.5 2-4 4.5-4S13 12.5 13 15M10 7.5A2.5 2.5 0 1 1 5 7.5a2.5 2.5 0 0 1 5 0M12.5 15c0-1.8 1.4-3 3.2-3 .7 0 1.3.2 1.8.5M16 7.8a2.1 2.1 0 1 1-4.2 0 2.1 2.1 0 0 1 4.2 0',
    },
    {
        to: '/teachers',
        label: 'Teachers',
        icon: 'M4 5.5C4 4.7 4.7 4 5.5 4H16v11.5H5.5A1.5 1.5 0 0 1 4 14zM7 7h6M7 10h6',
    },
    {
        to: '/staff',
        label: 'Staff',
        icon: 'M3.5 7.5h13v7h-13zM7 7.5V6a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1.5',
    },
    {
        to: '/fees',
        label: 'Fees',
        icon: 'M3.5 6h13a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-13a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1M12.5 10h2',
    },
    {
        to: '/finance',
        label: 'Finance',
        icon: 'M4 14.5V5.5M8 14.5V8.5M12 14.5V6.5M16 14.5V10.5',
    },
    {
        to: '/attendance/students',
        label: 'Attendance',
        icon: 'M4.5 10.5l3 3 7-7',
    },
    {
        to: '/notice',
        label: 'Notice',
        icon: 'M4 5.5h12v8h-5.2L8 16v-2.5H4z',
    },
    {
        to: '/guide',
        label: 'Guide',
        icon: 'M10 6.5A3.5 3.5 0 1 1 10 13.5 3.5 3.5 0 0 1 10 6.5zm0-3V5M10 15v1.5M6.5 8l-1-1M14.5 8l1-1',
    },
]

export default function Navbar() {
    const { loggedInDisplayName, loggedInRole, loggedInEmail, handleLogout } = useAppContext()
    const navigate = useNavigate()
    const [mobileOpen, setMobileOpen] = useState(false)
    const [profileOpen, setProfileOpen] = useState(false)

    const onLogout = () => {
        setProfileOpen(false)
        setMobileOpen(false)
        handleLogout()
        navigate('/login', { replace: true })
    }

    const initials =
        loggedInDisplayName
            .split(' ')
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0])
            .join('') || 'AD'

    return (
        <nav className="erp-navbar">
            {/* Brand */}
            <div className="erp-navbar-brand">
                <span className="erp-navbar-logo-icon">
                    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className="erp-navbar-logo-svg">
                        <rect x="3" y="3" width="6" height="6" rx="1.2" />
                        <rect x="11" y="3" width="6" height="6" rx="1.2" />
                        <rect x="3" y="11" width="6" height="6" rx="1.2" />
                        <rect x="11" y="11" width="6" height="6" rx="1.2" />
                    </svg>
                </span>
                <span className="erp-navbar-brand-text">School ERP</span>
            </div>

            {/* Desktop Links */}
            <div className="erp-navbar-links">
                {navLinks.map((link) => (
                    <NavLink
                        key={link.to}
                        to={link.to}
                        className={({ isActive }) =>
                            `erp-navbar-link${isActive ? ' erp-navbar-link-active' : ''}`
                        }
                    >
                        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" className="erp-navbar-link-icon">
                            <path d={link.icon} strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span>{link.label}</span>
                    </NavLink>
                ))}
            </div>

            {/* Profile */}
            <div className="erp-navbar-profile-wrap">
                <button
                    type="button"
                    className="erp-navbar-avatar"
                    onClick={() => setProfileOpen((prev) => !prev)}
                    aria-label="Profile menu"
                >
                    {initials}
                </button>

                {profileOpen && (
                    <div className="erp-navbar-profile-dropdown">
                        <p className="erp-navbar-profile-name">{loggedInDisplayName || 'User'}</p>
                        <p className="erp-navbar-profile-meta">
                            <span className="font-semibold text-gray-700">Role:</span> {loggedInRole || 'N/A'}
                        </p>
                        <p className="erp-navbar-profile-meta erp-navbar-profile-email">
                            <span className="font-semibold text-gray-700">Email:</span> {loggedInEmail || 'N/A'}
                        </p>
                        <button
                            type="button"
                            className="erp-navbar-logout-btn"
                            onClick={onLogout}
                        >
                            Logout
                        </button>
                    </div>
                )}
            </div>

            {/* Mobile Hamburger */}
            <button
                type="button"
                className="erp-navbar-hamburger"
                onClick={() => setMobileOpen((prev) => !prev)}
                aria-label="Open navigation"
            >
                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
                    <path d="M3 6h14M3 10h14M3 14h14" strokeLinecap="round" />
                </svg>
            </button>

            {/* Mobile Menu */}
            {mobileOpen && (
                <div className="erp-navbar-mobile-menu">
                    {navLinks.map((link) => (
                        <NavLink
                            key={link.to}
                            to={link.to}
                            className={({ isActive }) =>
                                `erp-navbar-mobile-link${isActive ? ' erp-navbar-mobile-link-active' : ''}`
                            }
                            onClick={() => setMobileOpen(false)}
                        >
                            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" className="erp-navbar-link-icon">
                                <path d={link.icon} strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            {link.label}
                        </NavLink>
                    ))}
                    <button
                        type="button"
                        className="erp-navbar-mobile-logout"
                        onClick={onLogout}
                    >
                        Logout
                    </button>
                </div>
            )}
        </nav>
    )
}
