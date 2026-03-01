import { useEffect, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { AppProvider, useAppContext } from './context/AppContext'
import AppLayout from './components/AppLayout'
import SplashScreen from './pages/SplashScreen'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import StudentsHubPage from './pages/StudentsHubPage'
import AddStudentPage from './pages/AddStudentPage'
import AddTeacherPage from './pages/AddTeacherPage'
import MarksheetPage from './pages/MarksheetPage'
import FeeManagementPage from './pages/FeeManagementPage'
import TeacherHubPage from './pages/TeacherHubPage'
import StaffHubPage from './pages/StaffHubPage'
import GuidePage from './pages/GuidePage'
import NoticePage from './pages/NoticePage'
import StudentAttendancePage from './pages/StudentAttendancePage'
import TeacherAttendancePage from './pages/TeacherAttendancePage'
import IncomeExpenseDetailsPage from './pages/IncomeExpenseDetailsPage'
import StaffTeacherAttendancePage from './pages/StaffTeacherAttendancePage'
import TeacherAttendanceMarkPage from './pages/TeacherAttendanceMarkPage'
import StaffAttendanceMarkPage from './pages/StaffAttendanceMarkPage'

const SPLASH_SEEN_KEY = 'erp_splash_seen_v1'

function ProtectedRoute({ children }) {
  const { isLoggedIn } = useAppContext()
  if (!isLoggedIn) return <Navigate to="/login" replace />
  return <AppLayout>{children}</AppLayout>
}

function AppContent() {
  const [showSplash, setShowSplash] = useState(() => {
    if (typeof window === 'undefined') return true
    return window.sessionStorage.getItem(SPLASH_SEEN_KEY) !== '1'
  })
  const { isLoggedIn, isAuthLoading } = useAppContext()

  useEffect(() => {
    if (!showSplash) return
    const timer = setTimeout(() => {
      window.sessionStorage.setItem(SPLASH_SEEN_KEY, '1')
      setShowSplash(false)
    }, 2200)
    return () => clearTimeout(timer)
  }, [showSplash])

  if (showSplash || isAuthLoading) return <SplashScreen />

  return (
    <AnimatePresence mode="wait">
      <Routes>
        <Route path="/login" element={isLoggedIn ? <Navigate to="/dashboard" replace /> : <LoginPage />} />

        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/students" element={<ProtectedRoute><StudentsHubPage /></ProtectedRoute>} />
        <Route path="/students/add" element={<ProtectedRoute><AddStudentPage /></ProtectedRoute>} />
        <Route path="/teachers" element={<ProtectedRoute><TeacherHubPage /></ProtectedRoute>} />
        <Route path="/teachers/add" element={<ProtectedRoute><AddTeacherPage /></ProtectedRoute>} />
        <Route path="/staff" element={<ProtectedRoute><StaffHubPage /></ProtectedRoute>} />
        <Route path="/fees" element={<ProtectedRoute><FeeManagementPage /></ProtectedRoute>} />
        <Route path="/notices" element={<ProtectedRoute><NoticePage /></ProtectedRoute>} />
        <Route path="/attendance/students" element={<ProtectedRoute><StudentAttendancePage /></ProtectedRoute>} />
        <Route path="/attendance/teachers" element={<ProtectedRoute><TeacherAttendanceMarkPage /></ProtectedRoute>} />
        <Route path="/attendance/staff" element={<ProtectedRoute><StaffAttendanceMarkPage /></ProtectedRoute>} />
        <Route path="/attendance/staff-teacher" element={<ProtectedRoute><StaffTeacherAttendancePage /></ProtectedRoute>} />
        <Route path="/marksheet" element={<ProtectedRoute><MarksheetPage /></ProtectedRoute>} />
        <Route path="/finance" element={<ProtectedRoute><IncomeExpenseDetailsPage /></ProtectedRoute>} />
        <Route path="/guide" element={<ProtectedRoute><GuidePage /></ProtectedRoute>} />

        <Route path="*" element={<Navigate to={isLoggedIn ? '/dashboard' : '/login'} replace />} />
      </Routes>
    </AnimatePresence>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </BrowserRouter>
  )
}

export default App
