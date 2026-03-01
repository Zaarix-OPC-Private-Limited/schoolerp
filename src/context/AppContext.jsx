import { createContext, useContext, useEffect, useState } from 'react'
import { getMe, logout as apiLogout } from '../services/authApi'
import { createStudent, createTeacher, getClasses, createClass, getStudents, createStaff, getStaff, getTeachers } from '../services/api'

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

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [isAuthLoading, setIsAuthLoading] = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [loggedInDisplayName, setLoggedInDisplayName] = useState('')
  const [loggedInRole, setLoggedInRole] = useState('')
  const [loggedInEmail, setLoggedInEmail] = useState('')
  const [studentRecords, setStudentRecords] = useState([])
  const [teacherRecords, setTeacherRecords] = useState([])
  const [staffRecords, setStaffRecords] = useState([])
  const [incomeLedger, setIncomeLedger] = useState([])
  const [expenseLedger, setExpenseLedger] = useState([])
  const [classRecords, setClassRecords] = useState([])

  const fetchClasses = async () => {
    try {
      const response = await getClasses()
      if (response?.data?.classes) {
        setClassRecords(response.data.classes)
      }
    } catch (error) {
      console.error('Failed to fetch classes:', error)
    }
  }

  const fetchStudents = async () => {
    try {
      const response = await getStudents()
      if (response?.data?.students) {
        setStudentRecords(response.data.students)
      }
    } catch (error) {
      console.error('Failed to fetch students:', error)
    }
  }

  const fetchTeachers = async () => {
    try {
      const response = await getTeachers()
      if (response?.data?.teachers) {
        setTeacherRecords(response.data.teachers)
      }
    } catch (error) {
      console.error('Failed to fetch teachers:', error)
    }
  }

  const fetchStaff = async () => {
    try {
      const response = await getStaff()
      if (response?.data?.staff) {
        setStaffRecords(response.data.staff)
      }
    } catch (error) {
      console.error('Failed to fetch staff:', error)
    }
  }

  // Intent state for cross-page navigation hints
  const [marksheetIntent, setMarksheetIntent] = useState(null)
  const [noticeIntent, setNoticeIntent] = useState(null)
  const [studentsHubIntent, setStudentsHubIntent] = useState(null)
  const [teacherHubIntent, setTeacherHubIntent] = useState(null)
  const [attendanceIntent, setAttendanceIntent] = useState(null)
  const [teacherAttendanceIntent, setTeacherAttendanceIntent] = useState(null)

  useEffect(() => {
    let isMounted = true

    const verifySession = async () => {
      try {
        const response = await getMe()
        if (isMounted && response?.data?.user) {
          const user = response.data.user
          const displayName = user?.name || formatDisplayName(user?.email || '')
          setLoggedInDisplayName(displayName)
          setLoggedInRole(String(user?.role || ''))
          setLoggedInEmail(String(user?.email || ''))
          setIsLoggedIn(true)
          if (isMounted) {
            await Promise.all([fetchClasses(), fetchStudents(), fetchTeachers(), fetchStaff()])
          }
        }
      } catch (error) {
        if (isMounted) {
          setIsLoggedIn(false)
        }
      } finally {
        if (isMounted) {
          setIsAuthLoading(false)
        }
      }
    }

    verifySession()

    return () => {
      isMounted = false
    }
  }, [])

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

  const handleLogin = (user) => {
    const displayName = user?.name || formatDisplayName(user?.email || '')
    setLoggedInDisplayName(displayName)
    setLoggedInRole(String(user?.role || ''))
    setLoggedInEmail(String(user?.email || ''))
    setIsLoggedIn(true)
    fetchClasses()
    fetchStudents()
    fetchTeachers()
    fetchStaff()
  }

  const handleLogout = async () => {
    try {
      await apiLogout()
    } catch (error) {
      // Ignore API errors on logout
    } finally {
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
      setClassRecords([])
      setStudentRecords([])
      setTeacherRecords([])
      setStaffRecords([])
    }
  }

  const updateStudent = (updatedStudent) => {
    const matchId = updatedStudent._id || updatedStudent.id
    setStudentRecords((prev) => {
      const hasExisting = prev.some((item) => String(item._id || item.id) === String(matchId))
      if (!hasExisting) return prev
      return prev.map((item) =>
        String(item._id || item.id) === String(matchId) ? { ...item, ...updatedStudent } : item
      )
    })
  }

  const addStudent = async (student) => {
    try {
      const response = await createStudent(student)
      if (response && response.data && response.data.student) {
        setStudentRecords((prev) => [response.data.student, ...prev])
      } else {
        setStudentRecords((prev) => [student, ...prev])
      }
    } catch (error) {
      console.error('Failed to create student:', error)
      throw error
    }
  }

  const updateTeacher = (updatedTeacher) => {
    const matchId = updatedTeacher._id || updatedTeacher.id
    setTeacherRecords((prev) => {
      const hasExisting = prev.some((item) => String(item._id || item.id) === String(matchId))
      if (!hasExisting) return prev
      return prev.map((item) =>
        String(item._id || item.id) === String(matchId) ? { ...item, ...updatedTeacher } : item
      )
    })
  }

  const addTeacher = async (teacher) => {
    try {
      const response = await createTeacher(teacher)
      if (response && response.data && response.data.teacher) {
        setTeacherRecords((prev) => [response.data.teacher, ...prev])
      } else {
        setTeacherRecords((prev) => [teacher, ...prev])
      }
    } catch (error) {
      console.error('Failed to create teacher:', error)
      throw error
    }
  }

  const addClass = async (classData) => {
    try {
      const response = await createClass(classData)
      if (response?.data?.class) {
        setClassRecords((prev) => [...prev, response.data.class])
        return response.data.class
      }
      return null
    } catch (error) {
      console.error('Failed to create class:', error)
      throw error
    }
  }

  const addStaff = async (staffMember) => {
    try {
      const response = await createStaff(staffMember)
      if (response && response.data && response.data.staff) {
        setStaffRecords((prev) => [response.data.staff, ...prev])
      } else {
        setStaffRecords((prev) => [staffMember, ...prev])
      }
    } catch (error) {
      console.error('Failed to create staff:', error)
      throw error
    }
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
        classRecords,
        fetchClasses,
        fetchTeachers,
        fetchStaff,
        addClass,
        isAuthLoading,
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
