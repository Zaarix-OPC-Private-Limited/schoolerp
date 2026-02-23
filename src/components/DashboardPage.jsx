import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'

const sidebarItems = [
  { id: 'dashboard', label: 'Dashboard', icon: 'grid' },
  { id: 'students', label: 'Students', icon: 'users' },
  { id: 'teachers', label: 'Teachers', icon: 'book' },
  { id: 'staff', label: 'Staff', icon: 'brief' },
  { id: 'fees', label: 'Fees', icon: 'wallet' },
  { id: 'income_expense', label: 'Income & Expense', icon: 'chart' },
  { id: 'examination', label: 'Examination', icon: 'file' },
  { id: 'attendance', label: 'Attendance', icon: 'check' },
  { id: 'transport', label: 'Transport', icon: 'bus' },
  { id: 'reports', label: 'Reports', icon: 'chart' },
  { id: 'settings', label: 'Settings', icon: 'gear' },
]

const iconMap = {
  grid: 'M4 4h5v5H4zM11 4h5v5h-5zM4 11h5v5H4zM11 11h5v5h-5z',
  users: 'M4 15c0-2.5 2-4 4.5-4S13 12.5 13 15M10 7.5A2.5 2.5 0 1 1 5 7.5a2.5 2.5 0 0 1 5 0M12.5 15c0-1.8 1.4-3 3.2-3 .7 0 1.3.2 1.8.5M16 7.8a2.1 2.1 0 1 1-4.2 0 2.1 2.1 0 0 1 4.2 0',
  book: 'M4 5.5C4 4.7 4.7 4 5.5 4H16v11.5H5.5A1.5 1.5 0 0 1 4 14zM7 7h6M7 10h6',
  brief: 'M3.5 7.5h13v7h-13zM7 7.5V6a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1.5',
  wallet: 'M3.5 6h13a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-13a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1M12.5 10h2',
  file: 'M6 3.5h6l3 3V16a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1zM12 3.5V7h3',
  check: 'M4.5 10.5l3 3 7-7',
  bus: 'M4.5 5.5h11v7h-11zM6.5 12.5v2M13.5 12.5v2M6 9.5h1M13 9.5h1',
  chart: 'M4 14.5V5.5M8 14.5V8.5M12 14.5V6.5M16 14.5V10.5',
  gear: 'M10 6.5A3.5 3.5 0 1 1 10 13.5 3.5 3.5 0 0 1 10 6.5zm0-3l1 .8 1.5-.2.7 1.3 1.3.7-.2 1.5.8 1-.8 1 .2 1.5-1.3.7-.7 1.3-1.5-.2-1 .8-1-.8-1.5.2-.7-1.3-1.3-.7.2-1.5-.8-1 .8-1-.2-1.5 1.3-.7.7-1.3 1.5.2z',
  forum: 'M4 5.5h12v8h-5.2L8 16v-2.5H4z',
}

const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const feeExpenseSeries = [
  { month: 'Jan', fee: 3000, expense: 600 },
  { month: 'Feb', fee: 1800, expense: 1350 },
  { month: 'Mar', fee: 1000, expense: 1200 },
  { month: 'Apr', fee: 2100, expense: 1500 },
  { month: 'May', fee: 2000, expense: 900 },
  { month: 'Jun', fee: 800, expense: 600 },
  { month: 'Jul', fee: 1700, expense: 2200 },
  { month: 'Aug', fee: 1900, expense: 1400 },
  { month: 'Sep', fee: 800, expense: 600 },
  { month: 'Oct', fee: 700, expense: 620 },
  { month: 'Nov', fee: 750, expense: 600 },
  { month: 'Dec', fee: 800, expense: 620 },
]

const noticeBoard = [
  { id: 'NB-001', text: 'Result for Class IX is out now', time: 'Today, 11:00 am' },
  { id: 'NB-002', text: 'Result for Class VIII is out now', time: 'Today, 11:00 am' },
  { id: 'NB-003', text: 'Result for Class VII is out now', time: 'Today, 11:00 am' },
  { id: 'NB-004', text: 'Result for Class VI is out now', time: 'Today, 11:00 am' },
]

const upcomingEvents = [
  { id: 'EV-001', title: 'Webinar on Career Trends for Class-X', date: '23 Jun', time: '11:00 AM' },
  { id: 'EV-002', title: 'Webinar on Career Trends for Class-X', date: '23 Jun', time: '11:00 AM' },
  { id: 'EV-003', title: 'Webinar on Career Trends for Class-X', date: '23 Jun', time: '11:00 AM' },
]

const leaveRequestsSeed = [
  { id: 'LR-DASH-001', requesterType: 'teacher', requesterName: 'Priya Sharma', className: '10th', fromDate: '2026-02-21', toDate: '2026-02-21', reason: 'Medical consultation', status: 'pending' },
  { id: 'LR-DASH-002', requesterType: 'student', requesterName: 'Atharv Bhatt', className: '6th', fromDate: '2026-02-22', toDate: '2026-02-23', reason: 'Family function', status: 'pending' },
  { id: 'LR-DASH-003', requesterType: 'teacher', requesterName: 'Neha Arora', className: '11th', fromDate: '2026-02-24', toDate: '2026-02-24', reason: 'Official duty', status: 'approved' },
  { id: 'LR-DASH-004', requesterType: 'student', requesterName: 'Raghav Bedi', className: '12th', fromDate: '2026-02-20', toDate: '2026-02-20', reason: 'Health issue', status: 'rejected' },
]

const sessionOptions = ['Session: 2024-25', 'Session: 2025-26', 'Session: 2026-27']
const monthFilterOptions = ['All Months', ...monthLabels]
const searchShortcuts = [
  { id: 'students', label: 'Students', keywords: ['student', 'students', 'admission'] },
  { id: 'teachers', label: 'Teachers', keywords: ['teacher', 'teachers', 'faculty'] },
  { id: 'staff', label: 'Staff', keywords: ['staff', 'employee'] },
  { id: 'fees', label: 'Fees', keywords: ['fee', 'fees', 'payment', 'finance'] },
  { id: 'income_expense', label: 'Income & Expense', keywords: ['income', 'expense', 'expenses', 'financial'] },
  { id: 'examination', label: 'Examination', keywords: ['exam', 'examination', 'marksheet', 'result'] },
  { id: 'attendance', label: 'Attendance', keywords: ['attendance'] },
  { id: 'leave_requests', label: 'Leave Requests', keywords: ['leave', 'leave request', 'leave requests'] },
  { id: 'transport', label: 'Transport', keywords: ['transport', 'bus', 'route'] },
  { id: 'reports', label: 'Reports', keywords: ['report', 'reports', 'analytics'] },
  { id: 'settings', label: 'Settings', keywords: ['setting', 'settings'] },
  { id: 'notice', label: 'Notice Board', keywords: ['notice', 'notification', 'announcement'] },
  { id: 'guide', label: 'Guide', keywords: ['guide', 'help', 'manual'] },
]

const incomeSegments = [
  { label: 'Donation', value: 14, color: '#22c55e' },
  { label: 'Rent', value: 9, color: '#eab308' },
  { label: 'Miscellaneous', value: 19, color: '#14b8a6' },
  { label: 'Book Sale', value: 16, color: '#c084fc' },
  { label: 'Uniform Sale', value: 42, color: '#a08f84' },
]

const expenseSegments = [
  { label: 'Telephone Bill', value: 17, color: '#8b5cf6' },
  { label: 'Flower', value: 8, color: '#fdba74' },
  { label: 'Electricity Bill', value: 31, color: '#f87171' },
  { label: 'Stationary', value: 14, color: '#22c55e' },
  { label: 'Miscellaneous', value: 30, color: '#9ca3af' },
]

const defaultIncomeLedger = [
  { id: 'INC-001', category: 'Fees', source: 'Monthly tuition collection', amount: 900000, date: '2026-02-05' },
  { id: 'INC-002', category: 'Uniform Sale', source: 'School uniform counter', amount: 125000, date: '2026-02-08' },
  { id: 'INC-003', category: 'Book Sale', source: 'Book store', amount: 88000, date: '2026-02-10' },
  { id: 'INC-004', category: 'Rent', source: 'Auditorium rent', amount: 45000, date: '2026-02-13' },
  { id: 'INC-005', category: 'Donation', source: 'Alumni donation', amount: 78000, date: '2026-02-18' },
]

const defaultExpenseLedger = [
  { id: 'EXP-001', category: 'Salaries', purpose: 'Teacher & staff payroll', amount: 572136, date: '2026-02-07' },
  { id: 'EXP-002', category: 'Electricity', purpose: 'Campus electricity bill', amount: 74000, date: '2026-02-09' },
  { id: 'EXP-003', category: 'Transport', purpose: 'Bus fuel and service', amount: 62000, date: '2026-02-12' },
  { id: 'EXP-004', category: 'Maintenance', purpose: 'Campus repair work', amount: 43000, date: '2026-02-14' },
  { id: 'EXP-005', category: 'Stationary', purpose: 'Exam and admin materials', amount: 24000, date: '2026-02-17' },
]

const recentNotifications = [
  { id: 'NTF-001', title: 'Annual Day Event Reminder', message: 'Annual Day is scheduled for 2026-03-02. Final rehearsal starts tomorrow at 9:00 AM.', time: '5 min ago', type: 'school', importance: 'high', unread: true },
  { id: 'NTF-002', title: 'School Bus Route Change', message: 'Route-3 timing updated for Sports Meet week. Please inform class coordinators.', time: '14 min ago', type: 'school', importance: 'medium', unread: true },
  { id: 'NTF-003', title: 'Teacher Leave Approved', message: 'Priya Sharma leave request approved for 2026-02-21.', time: '18 min ago', type: 'leave', importance: 'medium', unread: true },
  { id: 'NTF-004', title: 'Student Leave Request Pending', message: 'Atharv Bhatt leave request is awaiting review.', time: '42 min ago', type: 'leave', importance: 'high', unread: false },
  { id: 'NTF-005', title: 'Exam Timetable Updated', message: 'Half-yearly timetable shared with all class teachers.', time: '1 hr ago', type: 'school', importance: 'medium', unread: false },
]

const getDonutGradient = (segments) => {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0) || 1
  let current = 0
  return `conic-gradient(${segments
    .map((segment) => {
      const start = (current / total) * 100
      current += segment.value
      const end = (current / total) * 100
      return `${segment.color} ${start}% ${end}%`
    })
    .join(',')})`
}

const barHeightPercent = (value, max) => Math.round((value / max) * 100)
const rs = (value) => `Rs ${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Math.max(Number(value) || 0, 0))}`
const parseLeaveDate = (value) => {
  const raw = String(value || '').split('T')[0]
  const [year, month, day] = raw.split('-').map((part) => Number.parseInt(part, 10))
  if (!year || !month || !day) return null
  return new Date(year, month - 1, day)
}
const getMonthlyLeaveHistory = (allRequests, matcher, anchorDate = new Date()) => {
  const months = Array.from({ length: 4 }).map((_, idx) => new Date(anchorDate.getFullYear(), anchorDate.getMonth() - idx, 1))
  return months.map((monthDate) => {
    const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1)
    const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0)
    const stats = {
      monthKey: `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, '0')}`,
      monthLabel: `${monthLabels[monthStart.getMonth()]} ${monthStart.getFullYear()}`,
      leaveDays: 0,
      requests: 0,
    }

    allRequests.forEach((item) => {
      if (!matcher(item)) return
      const start = parseLeaveDate(item.fromDate)
      const end = parseLeaveDate(item.toDate || item.fromDate)
      if (!start || !end) return
      const actualStart = start <= end ? start : end
      const actualEnd = start <= end ? end : start
      const overlapStart = actualStart > monthStart ? actualStart : monthStart
      const overlapEnd = actualEnd < monthEnd ? actualEnd : monthEnd
      if (overlapStart > overlapEnd) return
      const days = Math.floor((overlapEnd.getTime() - overlapStart.getTime()) / 86400000) + 1
      stats.leaveDays += Math.max(days, 0)
      stats.requests += 1
    })

    return stats
  })
}

function DashboardPage({
  onAddStudent,
  onAddTeacher,
  onOpenStudents,
  onOpenMarksheet,
  onOpenFees,
  onOpenTeacherHub,
  onOpenStaffHub,
  onOpenAttendance,
  onOpenTeacherAttendance,
  onOpenTransport,
  onOpenReports,
  onOpenIncomeExpenseDetails,
  onOpenSettings,
  onOpenGuide,
  onOpenNotice,
  onLogout,
  students = [],
  teachers = [],
  incomeLedger = defaultIncomeLedger,
  expenseLedger = defaultExpenseLedger,
  navigationIntent,
  onNavigationHandled,
  welcomeName = 'Principal',
  userRole = '',
  userEmail = '',
}) {
  const [activeMenu, setActiveMenu] = useState('dashboard')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isNotificationOpen, setIsNotificationOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [activeNotificationFilter, setActiveNotificationFilter] = useState('all')
  const [searchText, setSearchText] = useState('')
  const [selectedSession, setSelectedSession] = useState(sessionOptions[0])
  const [selectedMonthFilter, setSelectedMonthFilter] = useState(monthFilterOptions[0])
  const [leaveAudienceFilter, setLeaveAudienceFilter] = useState('teacher')
  const [leaveRequests, setLeaveRequests] = useState(leaveRequestsSeed)
  const [expandedLeaveHistoryId, setExpandedLeaveHistoryId] = useState('')
  const [isAttendanceMenuOpen, setIsAttendanceMenuOpen] = useState(false)
  const notificationRef = useRef(null)
  const profileRef = useRef(null)
  const searchRef = useRef(null)
  const leaveRequestsRef = useRef(null)
  const attendanceMenuRef = useRef(null)

  useEffect(() => {
    if (!navigationIntent) return
    if (navigationIntent.view === 'students') setActiveMenu('students')
    onNavigationHandled?.()
  }, [navigationIntent, onNavigationHandled])

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setIsNotificationOpen(false)
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false)
      }
      if (attendanceMenuRef.current && !attendanceMenuRef.current.contains(event.target)) {
        setIsAttendanceMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  const totalStudents = students.length || 4396
  const totalTeachers = teachers.length || 72
  const visibleSidebarItems = sidebarItems
  const visibleSearchShortcuts = searchShortcuts

  const summaryCards = useMemo(
    () => [
      { id: 'awaiting', label: 'Fee Awaiting Payment', value: '2450/5000', tone: 'text-rose-700', icon: 'wallet' },
      { id: 'collection', label: 'Monthly Fee Collection', value: 'Rs 9,00,000', tone: 'text-slate-900', icon: 'chart' },
      { id: 'expense', label: 'Expenses this Month', value: 'Rs 5,72,136', tone: 'text-slate-900', icon: 'brief' },
      { id: 'profit', label: 'Profits this Month', value: 'Rs 3,27,864', tone: 'text-emerald-700', icon: 'check' },
      { id: 'teacherPresent', label: 'Teachers Present Today', value: `${totalTeachers}/80`, tone: 'text-slate-900', icon: 'teachers' },
      { id: 'studentPresent', label: 'Students Present Today', value: `${totalStudents}/5000`, tone: 'text-slate-900', icon: 'students' },
      { id: 'staffPresent', label: 'Staff Present Today', value: '40/40', tone: 'text-slate-900', icon: 'staff' },
      { id: 'leads', label: 'Converted Leads this Month', value: '2/10', tone: 'text-slate-900', icon: 'leads' },
    ],
    [totalStudents, totalTeachers],
  )

  const activeMenuLabel = useMemo(() => {
    const label = sidebarItems.find((item) => item.id === activeMenu)?.label
    return label || 'Dashboard'
  }, [activeMenu])

  const unreadCount = useMemo(() => recentNotifications.filter((item) => item.unread).length, [])
  const schoolCount = useMemo(() => recentNotifications.filter((item) => item.type === 'school').length, [])
  const leaveCount = useMemo(() => recentNotifications.filter((item) => item.type === 'leave').length, [])
  const highPriorityCount = useMemo(() => recentNotifications.filter((item) => item.importance === 'high').length, [])

  const filteredNotifications = useMemo(() => {
    if (activeNotificationFilter === 'school') return recentNotifications.filter((item) => item.type === 'school')
    if (activeNotificationFilter === 'leave') return recentNotifications.filter((item) => item.type === 'leave')
    if (activeNotificationFilter === 'important') return recentNotifications.filter((item) => item.importance === 'high')
    if (activeNotificationFilter === 'unread') return recentNotifications.filter((item) => item.unread)
    return recentNotifications
  }, [activeNotificationFilter])

  const filteredBars = useMemo(() => {
    if (selectedMonthFilter === 'All Months') return feeExpenseSeries
    return feeExpenseSeries.filter((item) => item.month === selectedMonthFilter)
  }, [selectedMonthFilter])

  const maxBar = useMemo(
    () => Math.max(...feeExpenseSeries.map((item) => Math.max(item.fee, item.expense)), 1),
    [],
  )

  const incomeDonut = useMemo(() => getDonutGradient(incomeSegments), [])
  const expenseDonut = useMemo(() => getDonutGradient(expenseSegments), [])
  const totalIncomeValue = useMemo(() => incomeLedger.reduce((sum, row) => sum + row.amount, 0), [])
  const totalExpenseValue = useMemo(() => expenseLedger.reduce((sum, row) => sum + row.amount, 0), [])
  const netBalanceValue = useMemo(() => totalIncomeValue - totalExpenseValue, [totalExpenseValue, totalIncomeValue])
  const query = searchText.trim().toLowerCase()
  const searchMatches = useMemo(() => {
    if (!query) return []
    return visibleSearchShortcuts.filter((item) => item.label.toLowerCase().includes(query) || item.keywords.some((word) => word.includes(query))).slice(0, 6)
  }, [query, visibleSearchShortcuts])
  const filteredNoticeBoard = useMemo(() => {
    if (!query) return noticeBoard
    return noticeBoard.filter((item) => item.text.toLowerCase().includes(query) || item.time.toLowerCase().includes(query))
  }, [query])
  const filteredUpcomingEvents = useMemo(() => {
    if (!query) return upcomingEvents
    return upcomingEvents.filter((item) => item.title.toLowerCase().includes(query) || item.date.toLowerCase().includes(query) || item.time.toLowerCase().includes(query))
  }, [query])
  const visibleLeaveRequests = useMemo(
    () =>
      leaveRequests
        .filter((item) => item.requesterType === leaveAudienceFilter)
        .filter((item) => {
          if (!query) return true
          return (
            item.requesterName.toLowerCase().includes(query) ||
            item.reason.toLowerCase().includes(query) ||
            item.className.toLowerCase().includes(query) ||
            item.status.toLowerCase().includes(query)
          )
        }),
    [leaveAudienceFilter, leaveRequests, query],
  )

  const menuAction = (id) => {
    if (id !== 'attendance') setIsAttendanceMenuOpen(false)
    setActiveMenu(id)
    if (id === 'students') onOpenStudents?.()
    if (id === 'fees') onOpenFees?.()
    if (id === 'income_expense') onOpenIncomeExpenseDetails?.()
    if (id === 'teachers') onOpenTeacherHub?.()
    if (id === 'staff') onOpenStaffHub?.()
    if (id === 'examination') onOpenMarksheet?.()
    if (id === 'transport') onOpenTransport?.()
    if (id === 'reports') onOpenReports?.()
    if (id === 'settings') onOpenSettings?.()
    if (id === 'communication') onOpenNotice?.()
  }

  const handleSearchAction = (targetId) => {
    if (targetId === 'notice') {
      onOpenNotice?.()
      return
    }
    if (targetId === 'guide') {
      onOpenGuide?.()
      return
    }
    if (targetId === 'leave_requests') {
      setActiveMenu('dashboard')
      setLeaveAudienceFilter('teacher')
      window.setTimeout(() => {
        leaveRequestsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 50)
      return
    }
    menuAction(targetId)
  }

  const handleSearchSubmit = () => {
    if (!query) return
    const match = visibleSearchShortcuts.find((item) => item.label.toLowerCase().includes(query) || item.keywords.some((word) => word.includes(query)))
    if (!match) return
    handleSearchAction(match.id)
    setSearchText('')
  }

  const updateLeaveRequestStatus = (leaveId, nextStatus) => {
    setLeaveRequests((previous) => previous.map((item) => (item.id === leaveId ? { ...item, status: nextStatus } : item)))
  }
  const getLeaveHistoryForRequest = (leaveItem) => {
    const anchor = parseLeaveDate(leaveItem?.fromDate) || new Date()
    return getMonthlyLeaveHistory(
      leaveRequests,
      (item) =>
        item.requesterName === leaveItem.requesterName &&
        item.requesterType === leaveItem.requesterType &&
        item.className === leaveItem.className,
      anchor,
    )
  }

  return (
    <motion.section
      key="dashboard-modern"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="min-h-screen bg-slate-100 text-slate-800"
    >
      <div className="mx-auto flex min-h-screen max-w-[1560px] gap-4 p-4">
        <aside className={`rounded-2xl bg-white text-slate-800 shadow-2xl transition-all ${sidebarCollapsed ? 'w-20 p-3' : 'w-72 p-4'} hidden md:block`}>
          <div className="mb-5 flex items-center justify-between">
            {!sidebarCollapsed ? (
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-blue-600">School ERP</p>
                <h2 className="text-lg font-semibold">Control Panel</h2>
              </div>
            ) : null}
            <button
              type="button"
              className="rounded-lg bg-slate-100 p-2 text-blue-600 hover:bg-slate-200"
              onClick={() => setSidebarCollapsed((prev) => !prev)}
              aria-label="Toggle sidebar"
            >
              <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M4 6h12M4 10h12M4 14h12" />
              </svg>
            </button>
          </div>

          <nav className="space-y-2">
            {visibleSidebarItems.map((item) => (
              item.id === 'attendance' ? (
                <div key={item.id} className="relative" ref={attendanceMenuRef}>
                  <button
                    type="button"
                    className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                      activeMenu === item.id ? 'bg-cyan-500 text-slate-950 font-semibold' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                    onClick={() => {
                      setActiveMenu(item.id)
                      setIsAttendanceMenuOpen((prev) => !prev)
                    }}
                  >
                    <span className="flex items-center gap-3">
                      <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
                        <path d={iconMap[item.icon]} strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {!sidebarCollapsed ? <span>{item.label}</span> : null}
                    </span>
                    {!sidebarCollapsed ? (
                      <svg viewBox="0 0 20 20" className={`h-4 w-4 transition-transform ${isAttendanceMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M5 7.5L10 12.5L15 7.5" strokeLinecap="round" />
                      </svg>
                    ) : null}
                  </button>
                  {isAttendanceMenuOpen && !sidebarCollapsed ? (
                    <div className="mt-1 rounded-lg border border-slate-200 bg-slate-100 p-1">
                      <div className="space-y-2 rounded-md border border-slate-200 bg-white/70 p-2">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-cyan-200">Attendance Type</p>
                        <button
                          type="button"
                          className="block w-full rounded-md bg-cyan-600 px-2 py-1.5 text-left text-xs font-semibold text-white hover:bg-cyan-700"
                          onClick={() => {
                            setIsAttendanceMenuOpen(false)
                            onOpenAttendance?.()
                          }}
                        >
                          Student Attendance
                        </button>
                        <button
                          type="button"
                          className="block w-full rounded-md bg-slate-700 px-2 py-1.5 text-left text-xs font-semibold text-slate-800 hover:bg-slate-600"
                          onClick={() => {
                            setIsAttendanceMenuOpen(false)
                            onOpenTeacherAttendance?.()
                          }}
                        >
                          Teacher Attendance
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : (
                <button
                  key={item.id}
                  type="button"
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                    activeMenu === item.id ? 'bg-cyan-500 text-slate-950 font-semibold' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                  onClick={() => menuAction(item.id)}
                >
                  <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <path d={iconMap[item.icon]} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {!sidebarCollapsed ? <span>{item.label}</span> : null}
                </button>
              )
            ))}
          </nav>
        </aside>

        <main className="min-w-0 flex-1 space-y-4">
          <header className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Admin Dashboard</p>
                <h1 className="text-2xl font-semibold text-slate-900">
                  {activeMenu === 'dashboard' ? `Welcome, ${welcomeName}` : activeMenuLabel}
                </h1>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative w-[260px]">
                  <input
                    type="text"
                    value={searchText}
                    onChange={(event) => setSearchText(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key !== 'Enter') return
                      handleSearchSubmit()
                    }}
                    placeholder="Search"
                    className="h-10 w-full rounded-lg border border-slate-300 bg-slate-50 pl-9 pr-3 text-sm"
                    ref={searchRef}
                  />
                  <svg viewBox="0 0 20 20" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <circle cx="9" cy="9" r="5.5" />
                    <path d="M13.5 13.5L17 17" strokeLinecap="round" />
                  </svg>
                  {searchMatches.length ? (
                    <div className="absolute left-0 right-0 z-10 mt-1 rounded-lg border border-slate-200 bg-white p-1 shadow-lg">
                      {searchMatches.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          className="block w-full rounded-md px-2 py-1.5 text-left text-xs font-semibold text-slate-700 hover:bg-slate-100"
                          onClick={() => {
                            handleSearchAction(item.id)
                            setSearchText('')
                          }}
                        >
                          Go to {item.label}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div className="relative" ref={notificationRef}>
                  <button
                    type="button"
                    className="relative rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    onClick={() => setIsNotificationOpen((prev) => !prev)}
                    aria-label="Open notifications"
                  >
                    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7">
                      <path d="M10 3.5a3.5 3.5 0 0 0-3.5 3.5v2.1c0 .9-.3 1.8-.8 2.6L4.8 13h10.4l-.9-1.3a4.9 4.9 0 0 1-.8-2.6V7A3.5 3.5 0 0 0 10 3.5Z" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M8.4 15.2a1.8 1.8 0 0 0 3.2 0" strokeLinecap="round" />
                    </svg>
                    {unreadCount ? (
                      <span className="absolute -right-2 -top-2 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white">
                        {unreadCount}
                      </span>
                    ) : null}
                  </button>

                  {isNotificationOpen ? (
                    <article className="absolute right-0 z-20 mt-2 w-[350px] rounded-xl border border-slate-200 bg-white p-3 shadow-xl">
                      <div className="mb-2 flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-slate-900">Recent Notifications</h3>
                        <span className="text-xs text-slate-500">{filteredNotifications.length} items</span>
                      </div>
                      <div className="mb-2 grid grid-cols-2 gap-2 text-[11px]">
                        <button type="button" className={`rounded-md border px-2 py-1 text-left ${activeNotificationFilter === 'school' ? 'border-cyan-400 bg-cyan-100 text-cyan-900' : 'border-cyan-200 bg-cyan-50 text-cyan-800'}`} onClick={() => setActiveNotificationFilter('school')}>School: <strong>{schoolCount}</strong></button>
                        <button type="button" className={`rounded-md border px-2 py-1 text-left ${activeNotificationFilter === 'leave' ? 'border-amber-400 bg-amber-100 text-amber-900' : 'border-amber-200 bg-amber-50 text-amber-800'}`} onClick={() => setActiveNotificationFilter('leave')}>Leave: <strong>{leaveCount}</strong></button>
                        <button type="button" className={`rounded-md border px-2 py-1 text-left ${activeNotificationFilter === 'important' ? 'border-rose-400 bg-rose-100 text-rose-900' : 'border-rose-200 bg-rose-50 text-rose-800'}`} onClick={() => setActiveNotificationFilter('important')}>Important: <strong>{highPriorityCount}</strong></button>
                        <button type="button" className={`rounded-md border px-2 py-1 text-left ${activeNotificationFilter === 'unread' ? 'border-slate-400 bg-slate-200 text-slate-900' : 'border-slate-200 bg-slate-50 text-slate-700'}`} onClick={() => setActiveNotificationFilter('unread')}>Unread: <strong>{unreadCount}</strong></button>
                      </div>
                      <button type="button" className="mb-2 text-[11px] font-semibold text-cyan-700 hover:text-cyan-900" onClick={() => setActiveNotificationFilter('all')}>Show All Notifications</button>
                      <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                        {filteredNotifications.map((item) => (
                          <div key={item.id} className={`rounded-lg border px-3 py-2 ${item.importance === 'high' ? 'border-rose-200 bg-rose-50' : 'border-slate-200 bg-slate-50'}`}>
                            <div className="mb-1 flex items-center justify-between gap-2">
                              <p className="text-sm font-semibold text-slate-800">{item.title}</p>
                              <div className="flex items-center gap-1">
                                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${item.type === 'leave' ? 'bg-amber-100 text-amber-800' : 'bg-cyan-100 text-cyan-800'}`}>{item.type}</span>
                                {item.importance === 'high' ? <span className="rounded-full bg-rose-600 px-2 py-0.5 text-[10px] font-semibold uppercase text-white">Important</span> : null}
                              </div>
                            </div>
                            <p className="text-xs text-slate-600">{item.message}</p>
                            <p className="mt-1 text-[11px] text-slate-500">{item.time}</p>
                          </div>
                        ))}
                      </div>
                    </article>
                  ) : null}
                </div>

                <div className="relative" ref={profileRef}>
                  <button
                    type="button"
                    className="h-10 w-10 rounded-full bg-gradient-to-r from-amber-400 to-cyan-500 text-xs font-bold text-white"
                    onClick={() => setIsProfileOpen((prev) => !prev)}
                    aria-label="Open profile menu"
                  >
                    {welcomeName
                      .split(' ')
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((item) => item[0])
                      .join('') || 'AD'}
                  </button>

                  {isProfileOpen ? (
                    <article className="absolute right-0 z-20 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-3 shadow-xl">
                      <p className="text-sm font-semibold text-slate-900">{welcomeName || 'User'}</p>
                      <p className="mt-1 text-xs text-slate-600">
                        <span className="font-semibold text-slate-700">Role:</span> {userRole || 'N/A'}
                      </p>
                      <p className="mt-1 truncate text-xs text-slate-600">
                        <span className="font-semibold text-slate-700">Email:</span> {userEmail || 'N/A'}
                      </p>
                      <button
                        type="button"
                        className="mt-3 w-full rounded-lg bg-rose-600 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-700"
                        onClick={() => {
                          setIsProfileOpen(false)
                          onLogout?.()
                        }}
                      >
                        Logout
                      </button>
                    </article>
                  ) : null}
                </div>
              </div>
            </div>
          </header>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="text-base font-semibold text-slate-900">Quick Actions</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              <>
                <button type="button" className="rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm font-medium text-cyan-800 hover:bg-cyan-100" onClick={onAddStudent}>Add Student</button>
                <button type="button" className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800 hover:bg-emerald-100" onClick={onAddTeacher}>Add Teacher</button>
                <button type="button" className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800 hover:bg-amber-100" onClick={onOpenNotice}>Send Notice</button>
                <button type="button" className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50" onClick={onOpenGuide}>Open Guide</button>
              </>
            </div>
          </section>

          <div className="grid gap-4 xl:grid-cols-[1.6fr_0.8fr]">
            <section className="space-y-4">
              <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {summaryCards.map((card) => (
                  <article key={card.id} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{card.label}</p>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">{card.id}</span>
                    </div>
                    <p className={`text-2xl font-bold ${card.tone}`}>{card.value}</p>
                  </article>
                ))}
              </section>

              <section ref={leaveRequestsRef} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-base font-semibold text-slate-900">Fee Collection and Expenses</h3>
                  <div className="flex gap-2">
                    <select className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-xs" value={selectedSession} onChange={(event) => setSelectedSession(event.target.value)}>
                      {sessionOptions.map((item) => (
                        <option key={item} value={item}>{item}</option>
                      ))}
                    </select>
                    <select className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-xs" value={selectedMonthFilter} onChange={(event) => setSelectedMonthFilter(event.target.value)}>
                      {monthFilterOptions.map((item) => (
                        <option key={item} value={item}>{item}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mb-2 flex items-center gap-4 text-xs text-slate-600">
                  <p className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Fee Collection</p>
                  <p className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-rose-500" /> Expenses</p>
                </div>

                <div className="mt-2 flex h-64 items-end gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
                  {filteredBars.map((item) => (
                    <div key={item.month} className="flex flex-1 flex-col items-center justify-end gap-1">
                      <div className="flex h-52 w-full items-end justify-center gap-1">
                        <div className="w-2 rounded-sm bg-emerald-500" style={{ height: `${barHeightPercent(item.fee, maxBar)}%` }} />
                        <div className="w-2 rounded-sm bg-rose-500" style={{ height: `${barHeightPercent(item.expense, maxBar)}%` }} />
                      </div>
                      <p className="text-[10px] font-semibold text-slate-600">{item.month}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-base font-semibold text-slate-900">Income and Expenses Details</h3>
                  <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-800">Income: {rs(totalIncomeValue)}</span>
                    <span className="rounded-full bg-rose-100 px-3 py-1 text-rose-800">Expense: {rs(totalExpenseValue)}</span>
                    <span className={`rounded-full px-3 py-1 ${netBalanceValue >= 0 ? 'bg-cyan-100 text-cyan-800' : 'bg-amber-100 text-amber-800'}`}>
                      Net: {rs(Math.abs(netBalanceValue))} {netBalanceValue >= 0 ? 'Surplus' : 'Deficit'}
                    </span>
                    <button type="button" className="rounded-full border border-cyan-300 bg-cyan-50 px-3 py-1 text-cyan-800 hover:bg-cyan-100" onClick={onOpenIncomeExpenseDetails}>
                      View Full Details
                    </button>
                  </div>
                </div>

                <div className="grid gap-3 lg:grid-cols-2">
                  <article className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-3">
                    <h4 className="mb-2 text-sm font-semibold text-emerald-900">Income Ledger</h4>
                    <div className="overflow-x-auto rounded-lg border border-emerald-200 bg-white">
                      <table className="min-w-full text-left text-xs">
                        <thead className="bg-emerald-50 text-emerald-800">
                          <tr>
                            <th className="px-2 py-2">ID</th>
                            <th className="px-2 py-2">Category</th>
                            <th className="px-2 py-2">Source</th>
                            <th className="px-2 py-2">Date</th>
                            <th className="px-2 py-2">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {incomeLedger.map((item) => (
                            <tr key={item.id} className="border-t border-emerald-100">
                              <td className="px-2 py-2">{item.id}</td>
                              <td className="px-2 py-2">{item.category}</td>
                              <td className="px-2 py-2">{item.source}</td>
                              <td className="px-2 py-2">{item.date}</td>
                              <td className="px-2 py-2 font-semibold text-emerald-800">{rs(item.amount)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </article>

                  <article className="rounded-xl border border-rose-200 bg-rose-50/40 p-3">
                    <h4 className="mb-2 text-sm font-semibold text-rose-900">Expense Ledger</h4>
                    <div className="overflow-x-auto rounded-lg border border-rose-200 bg-white">
                      <table className="min-w-full text-left text-xs">
                        <thead className="bg-rose-50 text-rose-800">
                          <tr>
                            <th className="px-2 py-2">ID</th>
                            <th className="px-2 py-2">Category</th>
                            <th className="px-2 py-2">Purpose</th>
                            <th className="px-2 py-2">Date</th>
                            <th className="px-2 py-2">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {expenseLedger.map((item) => (
                            <tr key={item.id} className="border-t border-rose-100">
                              <td className="px-2 py-2">{item.id}</td>
                              <td className="px-2 py-2">{item.category}</td>
                              <td className="px-2 py-2">{item.purpose}</td>
                              <td className="px-2 py-2">{item.date}</td>
                              <td className="px-2 py-2 font-semibold text-rose-800">{rs(item.amount)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </article>
                </div>
              </section>

              <section className="grid gap-4 md:grid-cols-2">
                <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <h3 className="text-base font-semibold text-slate-900">Income June 2024</h3>
                  <div className="mt-3 flex items-center gap-4">
                    <div className="h-36 w-36 rounded-full border-8 border-white shadow" style={{ background: incomeDonut }} />
                    <div className="space-y-1 text-xs text-slate-600">
                      {incomeSegments.map((segment) => (
                        <p key={segment.label} className="flex items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ background: segment.color }} />
                          {segment.label}
                        </p>
                      ))}
                    </div>
                  </div>
                </article>

                <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <h3 className="text-base font-semibold text-slate-900">Expense June 2024</h3>
                  <div className="mt-3 flex items-center gap-4">
                    <div className="h-36 w-36 rounded-full border-8 border-white shadow" style={{ background: expenseDonut }} />
                    <div className="space-y-1 text-xs text-slate-600">
                      {expenseSegments.map((segment) => (
                        <p key={segment.label} className="flex items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ background: segment.color }} />
                          {segment.label}
                        </p>
                      ))}
                    </div>
                  </div>
                </article>
              </section>
            </section>

            <aside className="space-y-4">
              <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-base font-semibold text-slate-900">Notice Board</h3>
                  <button type="button" className="text-xs font-semibold text-cyan-700 hover:text-cyan-900" onClick={onOpenNotice}>Open</button>
                </div>
                <div className="space-y-2">
                  {filteredNoticeBoard.map((item) => (
                    <article key={item.id} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                      <p className="text-xs font-semibold text-rose-600">{item.text}</p>
                      <p className="mt-1 text-[11px] text-slate-500">{item.time}</p>
                    </article>
                  ))}
                  {!filteredNoticeBoard.length ? <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">No notices match your search.</p> : null}
                </div>
                <button type="button" className="mt-3 w-full rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs font-semibold text-cyan-800 hover:bg-cyan-100" onClick={onOpenNotice}>
                  + Add New Notice
                </button>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <h3 className="mb-2 text-base font-semibold text-slate-900">Upcoming Events</h3>
                <div className="space-y-2">
                  {filteredUpcomingEvents.map((item) => (
                    <article key={item.id} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                      <p className="text-xs font-semibold text-slate-700">{item.title}</p>
                      <p className="mt-1 text-[11px] text-slate-500">{item.date} | {item.time}</p>
                    </article>
                  ))}
                  {!filteredUpcomingEvents.length ? <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">No events match your search.</p> : null}
                </div>
                <button type="button" className="mt-3 w-full rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs font-semibold text-cyan-800 hover:bg-cyan-100">
                  + Add New Event
                </button>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <h3 className="text-base font-semibold text-slate-900">Leave Requests</h3>
                  <select
                    className="h-8 rounded-lg border border-slate-300 bg-white px-2 text-xs font-semibold text-slate-700"
                    value={leaveAudienceFilter}
                    onChange={(event) => setLeaveAudienceFilter(event.target.value)}
                  >
                    <option value="teacher">Teacher</option>
                    <option value="student">Student</option>
                  </select>
                </div>
                <div className="space-y-2">
                  {visibleLeaveRequests.map((item) => (
                    <article key={item.id} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <p className="truncate text-xs font-semibold text-slate-800">{item.requesterName}</p>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                          item.status === 'approved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.status === 'rejected'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                        }`}>
                          {item.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600">{item.requesterType} | Class {item.className}</p>
                      <p className="text-[11px] text-slate-600">{item.fromDate} to {item.toDate}</p>
                      <p className="text-[11px] text-slate-500">{item.reason}</p>
                      {item.status === 'pending' ? (
                        <div className="mt-2 flex gap-2">
                          <button
                            type="button"
                            className="rounded-md border border-slate-300 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100"
                            onClick={() => setExpandedLeaveHistoryId((prev) => (prev === item.id ? '' : item.id))}
                          >
                            {expandedLeaveHistoryId === item.id ? 'Hide History' : 'Leave History'}
                          </button>
                          <button
                            type="button"
                            className="rounded-md bg-emerald-600 px-2 py-1 text-[11px] font-semibold text-white hover:bg-emerald-700"
                            onClick={() => updateLeaveRequestStatus(item.id, 'approved')}
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            className="rounded-md bg-rose-600 px-2 py-1 text-[11px] font-semibold text-white hover:bg-rose-700"
                            onClick={() => updateLeaveRequestStatus(item.id, 'rejected')}
                          >
                            Reject
                          </button>
                        </div>
                      ) : null}
                      {expandedLeaveHistoryId === item.id ? (
                        <div className="mt-2 rounded-md border border-slate-200 bg-white px-2 py-1.5">
                          {getLeaveHistoryForRequest(item).map((row) => (
                            <p key={`${item.id}-${row.monthKey}`} className="text-[11px] text-slate-600">
                              {row.monthLabel}: {row.leaveDays} day(s) | {row.requests} request(s)
                            </p>
                          ))}
                        </div>
                      ) : null}
                    </article>
                  ))}
                  {!visibleLeaveRequests.length ? (
                    <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                      No leave requests for selected type.
                    </p>
                  ) : null}
                </div>
              </section>
            </aside>
          </div>

        </main>
      </div>
    </motion.section>
  )
}

export default DashboardPage
