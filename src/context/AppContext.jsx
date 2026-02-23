import { createContext, useContext, useEffect, useState } from 'react'

const APP_SESSION_KEY = 'erp_app_session_v1'

const readStoredSession = () => {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.sessionStorage.getItem(APP_SESSION_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

const defaultTeacherRecords = [
  { id: 'T01', employeeId: 'T01', name: 'Shikha Rawat', subject: 'Mathematics', contactNumber: '0000001101', email: 'shikha.rawat@schoolmail.com', department: 'Mathematics', experienceYears: '8', qualification: 'M.Sc, B.Ed', status: 'active', classTeacherName: '12th', classTeacherSection: 'A', photoPreview: '' },
  { id: 'T02', employeeId: 'T02', name: 'Priya Sharma', subject: 'English', contactNumber: '0000001102', email: 'priya.sharma@schoolmail.com', department: 'Languages', experienceYears: '6', qualification: 'M.A, B.Ed', status: 'active', classTeacherName: '10th', classTeacherSection: 'B', photoPreview: '' },
  { id: 'T03', employeeId: 'T03', name: 'Amit Verma', subject: 'Science', contactNumber: '0000001103', email: 'amit.verma@schoolmail.com', department: 'Science', experienceYears: '10', qualification: 'M.Sc, B.Ed', status: 'active', classTeacherName: '8th', classTeacherSection: 'A', photoPreview: '' },
  { id: 'T04', employeeId: 'T04', name: 'Neha Arora', subject: 'Computer', contactNumber: '0000001104', email: 'neha.arora@schoolmail.com', department: 'Science', experienceYears: '5', qualification: 'MCA', status: 'active', classTeacherName: '11th', classTeacherSection: 'C', photoPreview: '' },
]

const defaultStaffRecords = [
  { id: 'S01', employeeId: 'S01', name: 'Rakesh Kumar', role: 'Canteen Supervisor', department: 'canteen', contactNumber: '0000002101', email: 'rakesh.canteen@schoolmail.com', joiningDate: '2023-04-10', address: 'Sector 3, City Center', emergencyContactName: 'Anita Kumar', emergencyContactNumber: '0000003101', shift: 'morning', assignedArea: 'Main Canteen', busRoute: 'N/A', vehicleNumber: 'N/A', qualification: 'Diploma in Hospitality', status: 'active', documentsStatus: 'Verified' },
  { id: 'S02', employeeId: 'S02', name: 'Pooja Jain', role: 'Librarian', department: 'library', contactNumber: '0000002102', email: 'pooja.library@schoolmail.com', joiningDate: '2022-06-18', address: 'Green Park', emergencyContactName: 'Suresh Jain', emergencyContactNumber: '0000003102', shift: 'day', assignedArea: 'Main Library', busRoute: 'N/A', vehicleNumber: 'N/A', qualification: 'M.Lib', status: 'active', documentsStatus: 'Verified' },
  { id: 'S03', employeeId: 'S03', name: 'Nitin Yadav', role: 'Bus Attendant', department: 'transport', contactNumber: '0000002103', email: 'nitin.transport@schoolmail.com', joiningDate: '2024-01-15', address: 'Old Town', emergencyContactName: 'Meena Yadav', emergencyContactNumber: '0000003103', shift: 'morning', assignedArea: 'Transport Yard', busRoute: 'Route-3', vehicleNumber: 'DL1PC7781', qualification: '12th Pass', status: 'active', documentsStatus: 'Pending Verification' },
  { id: 'S04', employeeId: 'S04', name: 'Renu Singh', role: 'Transport Coordinator', department: 'transport', contactNumber: '0000002104', email: 'renu.transport@schoolmail.com', joiningDate: '2021-09-20', address: 'Metro Colony', emergencyContactName: 'Amit Singh', emergencyContactNumber: '0000003104', shift: 'day', assignedArea: 'Transport Office', busRoute: 'All Routes', vehicleNumber: 'N/A', qualification: 'Graduate', status: 'active', documentsStatus: 'Verified' },
]

const defaultIncomeLedger = [
  { id: 'INC-001', category: 'Fees', source: 'Monthly tuition collection', amount: 900000, expected: 950000, date: '2026-02-05' },
  { id: 'INC-002', category: 'Uniform Sale', source: 'School uniform counter', amount: 125000, expected: 130000, date: '2026-02-08' },
  { id: 'INC-003', category: 'Book Sale', source: 'Book store', amount: 88000, expected: 90000, date: '2026-02-10' },
  { id: 'INC-004', category: 'Rent', source: 'Auditorium rent', amount: 45000, expected: 50000, date: '2026-02-13' },
  { id: 'INC-005', category: 'Donation', source: 'Alumni donation', amount: 78000, expected: 70000, date: '2026-02-18' },
]

const defaultExpenseLedger = [
  { id: 'EXP-001', category: 'Salaries', purpose: 'Teacher & staff payroll', amount: 572136, expected: 560000, date: '2026-02-07' },
  { id: 'EXP-002', category: 'Electricity', purpose: 'Campus electricity bill', amount: 74000, expected: 70000, date: '2026-02-09' },
  { id: 'EXP-003', category: 'Transport', purpose: 'Bus fuel and service', amount: 62000, expected: 65000, date: '2026-02-12' },
  { id: 'EXP-004', category: 'Maintenance', purpose: 'Campus repair work', amount: 43000, expected: 50000, date: '2026-02-14' },
  { id: 'EXP-005', category: 'Stationary', purpose: 'Exam and admin materials', amount: 24000, expected: 28000, date: '2026-02-17' },
]

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(() => Boolean(readStoredSession()?.isLoggedIn))
  const [loggedInDisplayName, setLoggedInDisplayName] = useState(() => String(readStoredSession()?.loggedInDisplayName || ''))
  const [loggedInRole, setLoggedInRole] = useState(() => String(readStoredSession()?.loggedInRole || ''))
  const [loggedInEmail, setLoggedInEmail] = useState(() => String(readStoredSession()?.loggedInEmail || ''))
  const [studentRecords, setStudentRecords] = useState([])
  const [teacherRecords, setTeacherRecords] = useState(defaultTeacherRecords)
  const [staffRecords, setStaffRecords] = useState(defaultStaffRecords)
  const [incomeLedger, setIncomeLedger] = useState(defaultIncomeLedger)
  const [expenseLedger, setExpenseLedger] = useState(defaultExpenseLedger)

  // Intent state for cross-page navigation hints
  const [marksheetIntent, setMarksheetIntent] = useState(null)
  const [noticeIntent, setNoticeIntent] = useState(null)
  const [studentsHubIntent, setStudentsHubIntent] = useState(null)
  const [teacherHubIntent, setTeacherHubIntent] = useState(null)
  const [attendanceIntent, setAttendanceIntent] = useState(null)
  const [teacherAttendanceIntent, setTeacherAttendanceIntent] = useState(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!isLoggedIn) {
      window.sessionStorage.removeItem(APP_SESSION_KEY)
      return
    }
    window.sessionStorage.setItem(
      APP_SESSION_KEY,
      JSON.stringify({ isLoggedIn: true, loggedInDisplayName, loggedInRole, loggedInEmail }),
    )
  }, [isLoggedIn, loggedInDisplayName, loggedInEmail, loggedInRole])

  const formatDisplayName = (rawUsername) => {
    const input = String(rawUsername || '').trim().toLowerCase()
    if (!input) return 'Principal'
    const localPart = input.includes('@') ? input.split('@')[0] : input
    const cleaned = localPart.replace(/[._-]+/g, ' ').replace(/\s+/g, ' ').trim()
    if (!cleaned) return 'Principal'
    return cleaned
      .split(' ')
      .filter(Boolean)
      .map((part) => part[0].toUpperCase() + part.slice(1))
      .join(' ')
  }

  const handleLogin = (loginData) => {
    const username = String(loginData?.username || '').trim()
    setLoggedInDisplayName(formatDisplayName(username))
    setLoggedInRole(String(loginData?.role || ''))
    setLoggedInEmail(username)
    setIsLoggedIn(true)
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
    setLoggedInDisplayName('')
    setLoggedInRole('')
    setLoggedInEmail('')
    setMarksheetIntent(null)
    setNoticeIntent(null)
    setStudentsHubIntent(null)
    setTeacherHubIntent(null)
    setAttendanceIntent(null)
    setTeacherAttendanceIntent(null)
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem(APP_SESSION_KEY)
    }
  }

  const updateStudent = (updatedStudent) => {
    setStudentRecords((prev) => {
      const hasExisting = prev.some((item) => item.id === updatedStudent.id)
      if (!hasExisting) return prev
      return prev.map((item) => (item.id === updatedStudent.id ? { ...item, ...updatedStudent } : item))
    })
  }

  const addStudent = (student) => {
    setStudentRecords((prev) => [student, ...prev])
  }

  const updateTeacher = (updatedTeacher) => {
    setTeacherRecords((prev) => {
      const hasExisting = prev.some((item) => item.id === updatedTeacher.id)
      if (!hasExisting) return prev
      return prev.map((item) => (item.id === updatedTeacher.id ? { ...item, ...updatedTeacher } : item))
    })
  }

  const addTeacher = (teacher) => {
    setTeacherRecords((prev) => [teacher, ...prev])
  }

  const addStaff = (staffMember) => {
    setStaffRecords((prev) => [staffMember, ...prev])
  }

  return (
    <AppContext.Provider
      value={{
        isLoggedIn,
        loggedInDisplayName,
        loggedInRole,
        loggedInEmail,
        studentRecords,
        teacherRecords,
        staffRecords,
        incomeLedger,
        expenseLedger,
        setIncomeLedger,
        setExpenseLedger,
        marksheetIntent,
        setMarksheetIntent,
        noticeIntent,
        setNoticeIntent,
        studentsHubIntent,
        setStudentsHubIntent,
        teacherHubIntent,
        setTeacherHubIntent,
        attendanceIntent,
        setAttendanceIntent,
        teacherAttendanceIntent,
        setTeacherAttendanceIntent,
        handleLogin,
        handleLogout,
        updateStudent,
        addStudent,
        updateTeacher,
        addTeacher,
        addStaff,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useAppContext() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useAppContext must be used within AppProvider')
  return ctx
}
