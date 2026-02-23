import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate, useLocation } from 'react-router-dom'
import { defaultLeaveRequests, classNames, classTeacherByClass, classStudentNames } from '../components/dashboard/constants'
import { formatDateKey, getAttendanceSummary, seedAttendance } from '../components/dashboard/utils'
import { getAttendance, getAttendanceSyncStatus, getStudentLeaveRequests, markAttendance, updateLeaveRequestStatus } from '../services/attendanceApi'
import { subscribeRealtimeEvent } from '../services/realtime'
import { useAppContext } from '../context/AppContext'

const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const statusOrder = [null, 'present', 'absent', 'sick_leave']
const classLabelMap = {
  '1st': 'First',
  '2nd': 'Second',
  '3rd': 'Third',
  '4th': 'Fourth',
  '5th': 'Fifth',
  '6th': 'Sixth',
  '7th': 'Seventh',
  '8th': 'Eighth',
  '9th': 'Ninth',
  '10th': 'Tenth',
  '11th': 'Eleventh',
  '12th': 'Twelfth',
}
const getClassLabel = (value) => classLabelMap[value] || value
const parseDateKey = (dateKey) => {
  const [year, month, day] = String(dateKey || '').split('-').map((part) => Number.parseInt(part, 10))
  if (!year || !month || !day) return null
  return new Date(year, month - 1, day)
}
const isSundayDateKey = (dateKey) => {
  const date = parseDateKey(dateKey)
  if (!date) return false
  return date.getDay() === 0
}
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
      monthLabel: `${monthNames[monthStart.getMonth()]} ${monthStart.getFullYear()}`,
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

const normalizeStudent = (student, index) => ({
  id: student.id || `STD-${String(index + 1).padStart(3, '0')}`,
  name: student.name || 'Student',
  className: student.className || 'N/A',
  section: student.section || 'A',
  rollNumber: student.rollNumber || String(index + 1).padStart(2, '0'),
  fatherName: student.fatherName || 'Parent',
  fatherContact: student.fatherContact || student.contactNumber || 'N/A',
  classTeacherName: student.classTeacherName || 'N/A',
  photoPreview: student.photoPreview || '',
})

const getInitials = (name) =>
  String(name || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || 'ST'

const buildFallbackStudents = () =>
  classNames.flatMap((className, classIndex) =>
    (classStudentNames[className] || []).map((name, studentIndex) =>
      normalizeStudent(
        {
          id: `${className}-${classIndex}-${studentIndex}`,
          name,
          className,
          section: String.fromCharCode(65 + (studentIndex % 3)),
          rollNumber: String(classIndex * 10 + studentIndex + 1).padStart(3, '0'),
          fatherName: `Mr. ${name.split(' ')[1] || 'Guardian'}`,
          fatherContact: `0000${String(210000 + classIndex * 100 + studentIndex).slice(-6)}`,
          classTeacherName: classTeacherByClass[className] || 'N/A',
        },
        studentIndex,
      ),
    ),
  )

const normalizeAttendanceResponse = (payload) => {
  if (!payload) return {}
  if (payload.records && typeof payload.records === 'object' && !Array.isArray(payload.records)) {
    return Object.fromEntries(
      Object.entries(payload.records).map(([date, value]) => {
        if (typeof value === 'string') return [date, { finalStatus: value, sourceUsed: 'teacher_app' }]
        return [date, value]
      }),
    )
  }
  if (typeof payload === 'object' && !Array.isArray(payload)) {
    return Object.fromEntries(
      Object.entries(payload).map(([date, value]) => {
        if (typeof value === 'string') return [date, { finalStatus: value, sourceUsed: 'teacher_app' }]
        return [date, value]
      }),
    )
  }
  if (Array.isArray(payload?.records)) {
    return Object.fromEntries(
      payload.records.map((item) => [
        item.date || item.dateKey,
        {
          finalStatus: item.finalStatus || item.status || null,
          sourceUsed: item.sourceUsed || item.source || 'teacher_app',
          biometricStatus: item.biometricStatus || null,
          teacherStatus: item.teacherStatus || null,
          updatedAt: item.updatedAt || null,
        },
      ]),
    )
  }
  if (Array.isArray(payload)) {
    return Object.fromEntries(
      payload.map((item) => [
        item.date || item.dateKey,
        {
          finalStatus: item.finalStatus || item.status || null,
          sourceUsed: item.sourceUsed || item.source || 'teacher_app',
          biometricStatus: item.biometricStatus || null,
          teacherStatus: item.teacherStatus || null,
          updatedAt: item.updatedAt || null,
        },
      ]),
    )
  }
  return {}
}

const normalizeLeaveResponse = (payload) => {
  if (!payload) return []
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload.requests)) return payload.requests
  if (Array.isArray(payload.data)) return payload.data
  return []
}

const statusFromEntry = (entry) => (entry && typeof entry === 'object' ? entry.finalStatus || null : null)
const sourceFromEntry = (entry) => (entry && typeof entry === 'object' ? entry.sourceUsed || '' : '')
const leaveStatusClass = (status) => (status === 'approved' ? 'erp-leave-status-approved' : status === 'rejected' ? 'erp-leave-status-rejected' : 'erp-leave-status-pending')

function StudentAttendancePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { studentRecords: students = [] } = useAppContext()
  const intent = location.state || null
  const [selectedClass, setSelectedClass] = useState(intent?.selectedClass || intent?.student?.className || '')
  const [selectedStudentId, setSelectedStudentId] = useState(intent?.selectedStudentId || intent?.student?.id || '')
  const [searchText, setSearchText] = useState('')
  const [monthCursor, setMonthCursor] = useState(() => new Date())
  const [yearInput, setYearInput] = useState(() => String(new Date().getFullYear()))
  const [recordsByStudent, setRecordsByStudent] = useState({})
  const [statusMessage, setStatusMessage] = useState('')
  const [expandedLeaveHistoryId, setExpandedLeaveHistoryId] = useState('')
  const [isLoadingRemote, setIsLoadingRemote] = useState(false)
  const [remoteError, setRemoteError] = useState('')
  const [syncStatus, setSyncStatus] = useState({ biometricLastSyncAt: '', teacherAppLastSyncAt: '' })
  const [leaveRequests, setLeaveRequests] = useState(() =>
    defaultLeaveRequests
      .filter((item) => item.requesterType === 'student')
      .map((item) => ({ ...item, status: item.status || 'pending' }))
      .concat([
        {
          id: 'LR-6A-ARAV-001',
          requesterName: 'Atharv Bhatt',
          requesterType: 'student',
          className: '6th',
          rollNumber: '081',
          reason: 'Medical leave request from app',
          fromDate: '2026-02-18',
          toDate: '2026-02-19',
          parentContact: '0000000081',
          status: 'pending',
          requestedAt: '2026-02-17 08:40',
        },
      ]),
  )

  const allStudents = useMemo(() => (students.length ? students.map(normalizeStudent) : buildFallbackStudents()), [students])

  const classOptions = useMemo(() => {
    const available = new Set(allStudents.map((item) => item.className))
    return classNames.filter((item) => available.has(item))
  }, [allStudents])

  useEffect(() => {
    if (selectedClass) return
    if (classOptions.length) setSelectedClass(classOptions[0])
  }, [classOptions, selectedClass])

  const classStudents = useMemo(() => allStudents.filter((item) => item.className === selectedClass), [allStudents, selectedClass])

  const visibleStudents = useMemo(() => {
    const q = searchText.trim().toLowerCase()
    if (!q) return classStudents
    return classStudents.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.rollNumber.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q) ||
        `${item.className}-${item.section}`.toLowerCase().includes(q),
    )
  }, [classStudents, searchText])

  const selectedStudent = useMemo(
    () => classStudents.find((item) => item.id === selectedStudentId) || visibleStudents[0] || classStudents[0] || null,
    [classStudents, selectedStudentId, visibleStudents],
  )

  useEffect(() => {
    if (!selectedStudent) return
    setSelectedStudentId(selectedStudent.id)
    setRecordsByStudent((previous) => {
      if (previous[selectedStudent.id]) return previous
      const seeded = seedAttendance(selectedStudent.id)
      const converted = Object.fromEntries(
        Object.entries(seeded).map(([key, value]) => [
          key,
          {
            finalStatus: value === 'leave' ? 'sick_leave' : value,
            sourceUsed: 'teacher_app',
            biometricStatus: null,
            teacherStatus: value === 'leave' ? 'sick_leave' : value,
            updatedAt: null,
          },
        ]),
      )
      return { ...previous, [selectedStudent.id]: converted }
    })
  }, [selectedStudent])

  useEffect(() => {
    if (!selectedStudent) return
    let isCancelled = false

    const loadRemoteData = async () => {
      setIsLoadingRemote(true)
      setRemoteError('')
      try {
        const [attendancePayload, leavePayload, syncPayload] = await Promise.all([
          getAttendance({
            className: selectedStudent.className,
            studentId: selectedStudent.id,
            month: monthCursor.getMonth() + 1,
            year: monthCursor.getFullYear(),
          }),
          getStudentLeaveRequests({ studentId: selectedStudent.id }),
          getAttendanceSyncStatus({ className: selectedStudent.className }),
        ])

        if (isCancelled) return

        const remoteRecord = normalizeAttendanceResponse(attendancePayload)
        if (Object.keys(remoteRecord).length) {
          setRecordsByStudent((previous) => ({
            ...previous,
            [selectedStudent.id]: {
              ...(previous[selectedStudent.id] || {}),
              ...remoteRecord,
            },
          }))
        }

        const remoteLeaves = normalizeLeaveResponse(leavePayload)
        if (remoteLeaves.length) {
          setLeaveRequests((previous) => {
            const map = new Map(previous.map((item) => [item.id, item]))
            remoteLeaves.forEach((item) => {
              const normalized = {
                ...item,
                status: item.status || 'pending',
              }
              map.set(normalized.id, normalized)
            })
            return Array.from(map.values())
          })
        }

        if (syncPayload && typeof syncPayload === 'object') {
          setSyncStatus({
            biometricLastSyncAt: syncPayload.biometricLastSyncAt || syncPayload.biometric_last_sync_at || '',
            teacherAppLastSyncAt: syncPayload.teacherAppLastSyncAt || syncPayload.teacher_app_last_sync_at || '',
          })
        }
      } catch (error) {
        if (isCancelled) return
        setRemoteError('API data unavailable, showing local/mock data.')
      } finally {
        if (!isCancelled) setIsLoadingRemote(false)
      }
    }

    loadRemoteData()
    return () => {
      isCancelled = true
    }
  }, [monthCursor, selectedStudent])

  useEffect(() => {
    const unsubscribeAttendance = subscribeRealtimeEvent('attendance-updated', (payload) => {
      const targetType = payload?.requesterType || payload?.entityType || payload?.targetType
      if (targetType && targetType !== 'student') return
      const studentId = payload?.studentId || payload?.entityId || payload?.targetId
      if (!studentId) return

      setRecordsByStudent((previous) => {
        const current = previous[studentId] || {}
        let patch = {}

        if (payload?.date || payload?.dateKey) {
          const dateKey = payload.date || payload.dateKey
          patch[dateKey] = {
            finalStatus: payload.finalStatus || payload.status || null,
            sourceUsed: payload.sourceUsed || payload.source || 'teacher_app',
            biometricStatus: payload.biometricStatus || null,
            teacherStatus: payload.teacherStatus || null,
            updatedAt: payload.updatedAt || new Date().toISOString(),
          }
        } else if (Array.isArray(payload?.records)) {
          patch = Object.fromEntries(
            payload.records.map((item) => [
              item.date || item.dateKey,
              {
                finalStatus: item.finalStatus || item.status || null,
                sourceUsed: item.sourceUsed || item.source || 'teacher_app',
                biometricStatus: item.biometricStatus || null,
                teacherStatus: item.teacherStatus || null,
                updatedAt: item.updatedAt || new Date().toISOString(),
              },
            ]),
          )
        } else if (payload?.records && typeof payload.records === 'object') {
          patch = Object.fromEntries(
            Object.entries(payload.records).map(([dateKey, value]) => {
              if (typeof value === 'string') {
                return [dateKey, { finalStatus: value, sourceUsed: 'teacher_app', biometricStatus: null, teacherStatus: value, updatedAt: new Date().toISOString() }]
              }
              return [
                dateKey,
                {
                  finalStatus: value?.finalStatus || value?.status || null,
                  sourceUsed: value?.sourceUsed || value?.source || 'teacher_app',
                  biometricStatus: value?.biometricStatus || null,
                  teacherStatus: value?.teacherStatus || null,
                  updatedAt: value?.updatedAt || new Date().toISOString(),
                },
              ]
            }),
          )
        }

        if (!Object.keys(patch).length) return previous
        return { ...previous, [studentId]: { ...current, ...patch } }
      })

      if (selectedStudent?.id === studentId) {
        setStatusMessage(`Realtime update received for ${selectedStudent.name}.`)
      }
    })

    const unsubscribeLeave = subscribeRealtimeEvent('leave-updated', (payload) => {
      const leave = payload?.leave || payload
      const requesterType = leave?.requesterType || payload?.requesterType
      if (requesterType && requesterType !== 'student') return
      if (!leave?.id) return

      const normalized = {
        ...leave,
        requesterType: leave.requesterType || 'student',
        status: leave.status || 'pending',
      }

      setLeaveRequests((previous) => {
        const map = new Map(previous.map((item) => [item.id, item]))
        map.set(normalized.id, { ...(map.get(normalized.id) || {}), ...normalized })
        return Array.from(map.values())
      })
    })

    return () => {
      unsubscribeAttendance()
      unsubscribeLeave()
    }
  }, [selectedStudent])

  const selectedRecord = selectedStudent ? recordsByStudent[selectedStudent.id] || {} : {}
  const attendanceSummary = useMemo(() => {
    const converted = Object.fromEntries(
      Object.entries(selectedRecord).map(([k, v]) => {
        const status = statusFromEntry(v)
        return [k, status === 'sick_leave' ? 'leave' : status]
      }),
    )
    const base = getAttendanceSummary(converted)
    const sickLeave = Object.values(selectedRecord).filter((entry) => statusFromEntry(entry) === 'sick_leave').length
    return { ...base, sickLeave }
  }, [selectedRecord])

  const monthMeta = useMemo(() => {
    const year = monthCursor.getFullYear()
    const month = monthCursor.getMonth()
    const totalDays = new Date(year, month + 1, 0).getDate()
    const firstDayOffset = (new Date(year, month, 1).getDay() + 6) % 7
    return { year, month, totalDays, firstDayOffset, label: `${monthNames[month]} ${year}` }
  }, [monthCursor])

  const availableYears = useMemo(() => {
    const currentYear = new Date().getFullYear()
    const years = []
    for (let year = currentYear - 40; year <= currentYear + 20; year += 1) {
      years.push(year)
    }
    return years
  }, [])

  useEffect(() => {
    setYearInput(String(monthMeta.year))
  }, [monthMeta.year])

  const monthSummary = useMemo(() => {
    const counters = { present: 0, absent: 0, sick_leave: 0 }
    Array.from({ length: monthMeta.totalDays }).forEach((_, index) => {
      const dateKey = formatDateKey(new Date(monthMeta.year, monthMeta.month, index + 1))
      const explicit = statusFromEntry(selectedRecord[dateKey])
      const value = explicit || (isSundayDateKey(dateKey) ? 'sick_leave' : null)
      if (counters[value] === undefined) return
      counters[value] += 1
    })
    const total = counters.present + counters.absent + counters.sick_leave
    return { ...counters, total, percent: total ? Math.round((counters.present / total) * 100) : 0 }
  }, [monthMeta.month, monthMeta.totalDays, monthMeta.year, selectedRecord])

  const monthSourceSummary = useMemo(() => {
    const prefix = `${monthMeta.year}-${String(monthMeta.month + 1).padStart(2, '0')}`
    const counters = { biometric: 0, teacher_app: 0, manual: 0, conflicts: 0 }
    Object.entries(selectedRecord).forEach(([dateKey, entry]) => {
      if (!dateKey.startsWith(prefix) || !entry || typeof entry !== 'object') return
      const source = sourceFromEntry(entry)
      if (source && counters[source] !== undefined) counters[source] += 1
      if (entry.biometricStatus && entry.teacherStatus && entry.biometricStatus !== entry.teacherStatus) {
        counters.conflicts += 1
      }
    })
    return counters
  }, [monthMeta.month, monthMeta.year, selectedRecord])

  const classCards = useMemo(() => {
    const todayKey = formatDateKey(new Date())
    return classOptions.map((className) => {
      const studentsInClass = allStudents.filter((item) => item.className === className)
      const totalStudents = studentsInClass.length
      const presentToday = studentsInClass.reduce((sum, student) => {
        const value = statusFromEntry((recordsByStudent[student.id] || {})[todayKey])
        return sum + (value === 'present' ? 1 : 0)
      }, 0)

      let presentCount = 0
      let trackedCount = 0
      studentsInClass.forEach((student) => {
        const record = recordsByStudent[student.id] || {}
        Array.from({ length: monthMeta.totalDays }).forEach((_, index) => {
          const dateKey = formatDateKey(new Date(monthMeta.year, monthMeta.month, index + 1))
          const status = statusFromEntry(record[dateKey]) || (isSundayDateKey(dateKey) ? 'sick_leave' : null)
          if (!status) return
          trackedCount += 1
          if (status === 'present') presentCount += 1
        })
      })

      const monthPercent = trackedCount ? Math.round((presentCount / trackedCount) * 100) : 0
      return { className, totalStudents, presentToday, monthPercent }
    })
  }, [allStudents, classOptions, monthMeta.month, monthMeta.totalDays, monthMeta.year, recordsByStudent])

  const toggleDayStatus = (dateKey) => {
    if (!selectedStudent) return
    const explicitEntry = selectedRecord[dateKey]
    const current = statusFromEntry(explicitEntry)
    const isSundayDefault = !explicitEntry && isSundayDateKey(dateKey)
    const next = isSundayDefault ? 'present' : statusOrder[(statusOrder.indexOf(current) + 1) % statusOrder.length]
    setRecordsByStudent((previous) => {
      const studentRecord = previous[selectedStudent.id] || {}
      if (next === null) {
        const { [dateKey]: _ignore, ...rest } = studentRecord
        return { ...previous, [selectedStudent.id]: rest }
      }
      return {
        ...previous,
        [selectedStudent.id]: {
          ...studentRecord,
          [dateKey]: {
            finalStatus: next,
            sourceUsed: 'manual',
            biometricStatus: studentRecord[dateKey]?.biometricStatus || null,
            teacherStatus: studentRecord[dateKey]?.teacherStatus || null,
            updatedAt: new Date().toISOString(),
          },
        },
      }
    })
    if (next) {
      markAttendance({
        studentId: selectedStudent.id,
        date: dateKey,
        status: next,
        sourceUsed: 'manual',
      }).catch(() => {
        setStatusMessage(`Saved locally for ${dateKey}. API sync pending.`)
      })
    }
    setStatusMessage(`Updated ${dateKey} to ${next || 'none'}.`)
  }

  const setToday = (status) => {
    if (!selectedStudent) return
    const todayKey = formatDateKey(new Date())
    setRecordsByStudent((previous) => ({
      ...previous,
      [selectedStudent.id]: {
        ...(previous[selectedStudent.id] || {}),
        [todayKey]: {
          finalStatus: status,
          sourceUsed: 'manual',
          biometricStatus: previous[selectedStudent.id]?.[todayKey]?.biometricStatus || null,
          teacherStatus: previous[selectedStudent.id]?.[todayKey]?.teacherStatus || null,
          updatedAt: new Date().toISOString(),
        },
      },
    }))
    markAttendance({
      studentId: selectedStudent.id,
      date: todayKey,
      status,
      sourceUsed: 'manual',
    }).catch(() => {
      setStatusMessage(`Saved locally for today. API sync pending.`)
    })
    setStatusMessage(`Today's status marked ${status} for ${selectedStudent.name}.`)
  }

  const studentLeaveRequests = useMemo(() => {
    if (!selectedStudent) return []
    return leaveRequests.filter(
      (item) =>
        item.requesterName === selectedStudent.name ||
        (item.className === selectedStudent.className && item.rollNumber === selectedStudent.rollNumber),
    )
  }, [leaveRequests, selectedStudent])

  const pendingStudentLeaveRequests = useMemo(
    () => studentLeaveRequests.filter((item) => item.status === 'pending'),
    [studentLeaveRequests],
  )

  const leaveHistory = useMemo(
    () =>
      [...studentLeaveRequests].sort((a, b) =>
        String(b.requestedAt || b.fromDate || '').localeCompare(String(a.requestedAt || a.fromDate || '')),
      ),
    [studentLeaveRequests],
  )

  const pendingByStudent = useMemo(() => {
    const counters = {}
    leaveRequests.forEach((item) => {
      if (item.status !== 'pending') return
      const key = `${item.className}::${item.rollNumber}::${item.requesterName}`
      counters[key] = (counters[key] || 0) + 1
    })
    return counters
  }, [leaveRequests])

  const handleLeaveDecision = (leaveId, nextStatus) => {
    setLeaveRequests((previous) => previous.map((item) => (item.id === leaveId ? { ...item, status: nextStatus } : item)))
    updateLeaveRequestStatus({ leaveId, status: nextStatus }).catch(() => {
      setStatusMessage(`Leave ${leaveId} updated locally. API sync pending.`)
    })
    setStatusMessage(`Leave request ${leaveId} marked ${nextStatus}.`)
  }
  const getLeaveHistoryForRequest = (leaveItem) => {
    const anchor = parseLeaveDate(leaveItem?.fromDate) || new Date()
    return getMonthlyLeaveHistory(
      leaveRequests,
      (item) =>
        item.requesterName === leaveItem.requesterName &&
        item.className === leaveItem.className &&
        item.rollNumber === leaveItem.rollNumber,
      anchor,
    )
  }


  // Tailwind helpers
  const statusPillCls = (s) =>
    s === 'approved' ? 'rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-800' :
      s === 'rejected' ? 'rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-800' :
        'rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800'
  const selectCls = 'rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-800 focus:border-blue-400 focus:outline-none'
  const navBtnCls = 'rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition'

  return (
    <motion.section
      key="student-attendance-page"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-white text-slate-800"
    >
      <div className="mx-auto max-w-7xl px-5 py-6 sm:px-8">
        {/* Header */}
        <header className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400">Student Attendance</p>
              <h1 className="text-xl font-bold text-slate-900">Attendance and Leave Monitor</h1>
            </div>
            <button type="button" className={navBtnCls} onClick={() => navigate(-1)}>← Back</button>
          </div>
        </header>

        {/* Workspace */}
        <div className="flex gap-5">
          {/* Left — calendar + stats */}
          <article className="min-w-0 flex-1">
            {selectedStudent ? (
              <>
                {/* Student header */}
                <div className="mb-4 flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                  {selectedStudent.photoPreview ? (
                    <img src={selectedStudent.photoPreview} alt={selectedStudent.name} className="h-12 w-12 rounded-full object-cover border border-slate-200" />
                  ) : (
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-800 text-sm font-bold text-white">{getInitials(selectedStudent.name)}</span>
                  )}
                  <div>
                    <p className="text-sm font-bold text-slate-900">{selectedStudent.name}</p>
                    <p className="text-xs text-slate-500">{selectedStudent.className}-{selectedStudent.section} | Roll {selectedStudent.rollNumber}</p>
                  </div>
                </div>

                {/* Stats */}
                <div className="mb-3 grid grid-cols-3 gap-3">
                  <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm text-center"><p className="text-[11px] text-slate-500">This Month</p><strong className="text-lg text-slate-900">{monthSummary.percent}%</strong></div>
                  <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm text-center"><p className="text-[11px] text-slate-500">Present</p><strong className="text-lg text-slate-900">{monthSummary.present}</strong></div>
                  <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm text-center"><p className="text-[11px] text-slate-500">Absent</p><strong className="text-lg text-slate-900">{monthSummary.absent}</strong></div>
                </div>

                {isLoadingRemote && <p className="mb-2 rounded-lg bg-blue-50 px-3 py-1.5 text-xs text-blue-700">Syncing attendance from app...</p>}
                {remoteError && <p className="mb-2 rounded-lg bg-amber-50 px-3 py-1.5 text-xs text-amber-700">{remoteError}</p>}

                <div className="mb-3 grid grid-cols-3 gap-3">
                  <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm text-center"><p className="text-[11px] text-slate-500">Biometric</p><strong className="text-slate-900">{monthSourceSummary.biometric}</strong></div>
                  <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm text-center"><p className="text-[11px] text-slate-500">Teacher App</p><strong className="text-slate-900">{monthSourceSummary.teacher_app}</strong></div>
                  <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm text-center"><p className="text-[11px] text-slate-500">Conflicts</p><strong className="text-slate-900">{monthSourceSummary.conflicts}</strong></div>
                </div>

                {(syncStatus.biometricLastSyncAt || syncStatus.teacherAppLastSyncAt) && (
                  <p className="mb-3 rounded-lg bg-slate-50 px-3 py-1.5 text-[11px] text-slate-500">
                    Last Sync | Biometric: {syncStatus.biometricLastSyncAt || 'N/A'} | Teacher App: {syncStatus.teacherAppLastSyncAt || 'N/A'}
                  </p>
                )}

                {/* Calendar */}
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  {/* Calendar header */}
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-bold text-slate-800">{monthMeta.label}</p>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <select className={selectCls} value={monthMeta.month} onChange={(e) => { const nm = Number(e.target.value); setMonthCursor((p) => new Date(p.getFullYear(), nm, 1)) }}>
                        {monthNames.map((mn, mi) => <option key={mn} value={mi}>{mn}</option>)}
                      </select>
                      <select className={selectCls} value={monthMeta.year} onChange={(e) => { const ny = Number(e.target.value); setMonthCursor((p) => new Date(ny, p.getMonth(), 1)) }}>
                        {availableYears.map((y) => <option key={y} value={y}>{y}</option>)}
                      </select>
                      <input type="number" className={selectCls + ' w-20'} value={yearInput} onChange={(e) => setYearInput(e.target.value)}
                        onBlur={() => { const p = Number.parseInt(yearInput, 10); if (Number.isNaN(p)) { setYearInput(String(monthMeta.year)); return }; setMonthCursor((prev) => new Date(p, prev.getMonth(), 1)) }}
                        onKeyDown={(e) => { if (e.key !== 'Enter') return; const p = Number.parseInt(yearInput, 10); if (Number.isNaN(p)) { setYearInput(String(monthMeta.year)); return }; setMonthCursor((prev) => new Date(p, prev.getMonth(), 1)) }}
                        placeholder="Year" aria-label="Type year" />
                      <button type="button" className={navBtnCls} onClick={() => setMonthCursor((p) => new Date(p.getFullYear(), p.getMonth() - 1, 1))}>Prev</button>
                      <button type="button" className={navBtnCls} onClick={() => setMonthCursor((p) => new Date(p.getFullYear(), p.getMonth() + 1, 1))}>Next</button>
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="mb-3 flex flex-wrap gap-2">
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-semibold text-green-800">Present</span>
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-800">Absent</span>
                    <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-[11px] font-semibold text-yellow-800">Sick Leave</span>
                    <span className="rounded-full border border-slate-300 bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-600">No Mark</span>
                  </div>

                  {/* Quick mark */}
                  <div className="mb-3 rounded-lg bg-slate-50 p-2.5">
                    <p className="mb-2 text-xs font-semibold text-slate-600">Mark today quickly</p>
                    <div className="flex gap-2">
                      <button type="button" className="rounded-lg border border-green-300 bg-green-100 px-3 py-1.5 text-xs font-semibold text-green-800 hover:bg-green-200 transition" onClick={() => setToday('present')}>Present</button>
                      <button type="button" className="rounded-lg border border-red-300 bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-800 hover:bg-red-200 transition" onClick={() => setToday('absent')}>Absent</button>
                      <button type="button" className="rounded-lg border border-yellow-300 bg-yellow-100 px-3 py-1.5 text-xs font-semibold text-yellow-800 hover:bg-yellow-200 transition" onClick={() => setToday('sick_leave')}>Sick Leave</button>
                    </div>
                  </div>

                  {/* Day labels */}
                  <div className="mb-1 grid grid-cols-7 gap-1">
                    {dayNames.map((d) => <span key={d} className="text-center text-[10px] font-bold uppercase text-slate-400">{d}</span>)}
                  </div>

                  {/* Day cells */}
                  <div className="grid grid-cols-7 gap-1">
                    {Array.from({ length: monthMeta.firstDayOffset }).map((_, idx) => <div key={`empty-${idx}`} />)}
                    {Array.from({ length: monthMeta.totalDays }).map((_, idx) => {
                      const day = idx + 1
                      const key = formatDateKey(new Date(monthMeta.year, monthMeta.month, day))
                      const entry = selectedRecord[key]
                      const explicitValue = statusFromEntry(entry)
                      const value = explicitValue || (isSundayDateKey(key) ? 'sick_leave' : null)
                      const source = sourceFromEntry(entry)
                      const isWeeklyOff = !entry && isSundayDateKey(key)
                      const isToday = key === formatDateKey(new Date())
                      const bgCls = value === 'present' ? 'bg-green-100 border-green-400 text-green-800'
                        : value === 'absent' ? 'bg-red-100 border-red-400 text-red-800'
                          : value === 'sick_leave' ? 'bg-yellow-100 border-yellow-400 text-yellow-800'
                            : 'bg-white border-slate-300 text-slate-800'
                      return (
                        <button key={key} type="button"
                          className={`flex flex-col items-center justify-center rounded-lg border p-1 text-[11px] font-semibold transition hover:opacity-80 ${bgCls} ${isToday ? 'ring-2 ring-blue-500 ring-offset-1' : ''}`}
                          style={{ minHeight: 36 }}
                          onClick={() => toggleDayStatus(key)}
                          title={`${key} | Status: ${value || 'none'} | Source: ${source === 'biometric' ? 'Biometric' : source === 'teacher_app' ? 'Teacher App' : source === 'manual' ? 'Manual' : isWeeklyOff ? 'Weekly Off' : 'N/A'}`}
                        >
                          <span>{day}</span>
                          {(source || isWeeklyOff) && (
                            <small className="block text-[9px] leading-none mt-0.5">
                              {source === 'biometric' ? 'B' : source === 'teacher_app' ? 'T' : source === 'manual' ? 'M' : 'W'}
                            </small>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Summary cards */}
                <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Previous Attendance Details</p>
                  <div className="grid grid-cols-4 gap-3">
                    <div className="rounded-lg bg-slate-50 p-2 text-center"><p className="text-[11px] text-slate-500">Total Present</p><strong className="text-slate-900">{attendanceSummary.present}</strong></div>
                    <div className="rounded-lg bg-slate-50 p-2 text-center"><p className="text-[11px] text-slate-500">Total Absent</p><strong className="text-slate-900">{attendanceSummary.absent}</strong></div>
                    <div className="rounded-lg bg-slate-50 p-2 text-center"><p className="text-[11px] text-slate-500">Sick Leave</p><strong className="text-slate-900">{attendanceSummary.sickLeave}</strong></div>
                    <div className="rounded-lg bg-slate-50 p-2 text-center"><p className="text-[11px] text-slate-500">Overall %</p><strong className="text-slate-900">{attendanceSummary.percentage}%</strong></div>
                  </div>
                  <p className="mt-2 text-[11px] text-slate-400">Click any date cell to cycle: none → present → absent → sick leave.</p>
                  {statusMessage && <p className="mt-2 rounded-lg bg-green-50 px-3 py-1.5 text-xs text-green-700">{statusMessage}</p>}
                </div>
              </>
            ) : (
              <p className="text-sm text-slate-600">No student found for this class.</p>
            )}
          </article>

          {/* Right — student list + leave */}
          <aside className="w-64 shrink-0">
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Students ({getClassLabel(selectedClass)})</h3>
            <label className="mb-3 flex flex-col gap-1">
              <span className="text-xs font-semibold text-slate-600">Search Student</span>
              <input type="text" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs focus:border-blue-400 focus:outline-none" value={searchText} onChange={(e) => setSearchText(e.target.value)} placeholder="Name, roll, ID" />
            </label>

            {/* Class cards */}
            <div className="mb-3 rounded-xl border border-slate-200 bg-slate-50 p-2">
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Class-wise Live Attendance</p>
              <div className="mt-2 grid gap-1.5">
                {classCards.map((item) => (
                  <button key={`class-card-${item.className}`} type="button"
                    className={`rounded-lg border px-3 py-2 text-left text-xs transition ${selectedClass === item.className ? 'border-blue-400 bg-blue-50 text-blue-900' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
                    onClick={() => { setSelectedClass(item.className); setSelectedStudentId(''); setSearchText('') }}>
                    <p className="font-semibold">{getClassLabel(item.className)}</p>
                    <p className="mt-0.5 text-[11px] text-slate-500">Today: {item.presentToday}/{item.totalStudents} | Month: {item.monthPercent}%</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Student list */}
            <div className="mb-4 max-h-72 overflow-y-auto rounded-xl border border-slate-200 bg-white">
              {visibleStudents.map((item) => (
                <button key={item.id} type="button"
                  className={`flex w-full items-center gap-2 border-b border-slate-100 px-3 py-2 text-left transition last:border-0 hover:bg-slate-50 ${selectedStudent?.id === item.id ? 'bg-blue-50' : ''}`}
                  onClick={() => setSelectedStudentId(item.id)}>
                  {item.photoPreview
                    ? <img src={item.photoPreview} alt={item.name} className="h-7 w-7 rounded-full object-cover" />
                    : <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-800 text-[9px] font-bold text-white">{getInitials(item.name)}</span>
                  }
                  <div className="min-w-0">
                    <strong className="block text-xs text-slate-900 truncate">{item.name}</strong>
                    <small className="text-[10px] text-slate-500">Roll {item.rollNumber} | {item.className}-{item.section}</small>
                    {pendingByStudent[`${item.className}::${item.rollNumber}::${item.name}`] && (
                      <small className="block text-[10px] font-bold text-amber-700">Pending Leave: {pendingByStudent[`${item.className}::${item.rollNumber}::${item.name}`]}</small>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {/* Leave Requests */}
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Leave Requests (App)</h3>
            {pendingStudentLeaveRequests.length > 0 && (
              <p className="mb-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-1.5 text-xs text-amber-800">
                {pendingStudentLeaveRequests.length} pending leave request(s) for {selectedStudent?.name}.
              </p>
            )}
            <div className="space-y-2">
              {pendingStudentLeaveRequests.length ? pendingStudentLeaveRequests.map((item) => (
                <article key={item.id} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <div>
                      <p className="text-xs font-bold text-slate-900">{item.requesterName}</p>
                      <p className="text-[11px] text-slate-500">{item.fromDate} to {item.toDate}</p>
                    </div>
                    <span className={statusPillCls(item.status)}>{item.status}</span>
                  </div>
                  <p className="text-[11px] text-slate-600">{item.reason}</p>
                  <p className="text-[11px] text-slate-500">Contact: {item.parentContact}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <button type="button" className={navBtnCls} onClick={() => setExpandedLeaveHistoryId((p) => p === item.id ? '' : item.id)}>
                      {expandedLeaveHistoryId === item.id ? 'Hide History' : 'Leave History'}
                    </button>
                    {item.status === 'pending' && (
                      <>
                        <button type="button" className="rounded-lg bg-green-600 px-2 py-1 text-[11px] font-semibold text-white hover:bg-green-700 transition" onClick={() => handleLeaveDecision(item.id, 'approved')}>Approve</button>
                        <button type="button" className="rounded-lg bg-red-600 px-2 py-1 text-[11px] font-semibold text-white hover:bg-red-700 transition" onClick={() => handleLeaveDecision(item.id, 'rejected')}>Reject</button>
                      </>
                    )}
                  </div>
                  {expandedLeaveHistoryId === item.id && (
                    <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-2">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-1">Monthly Leave Details</p>
                      {getLeaveHistoryForRequest(item).map((row) => (
                        <p key={`${item.id}-${row.monthKey}`} className="text-[11px] text-slate-700">{row.monthLabel}: {row.leaveDays} day(s) | {row.requests} request(s)</p>
                      ))}
                    </div>
                  )}
                </article>
              )) : <p className="text-xs text-slate-500">No pending leave requests for this student.</p>}
            </div>

            {/* Leave History */}
            <h3 className="mt-4 mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">View Leave History</h3>
            <div className="max-h-[420px] space-y-2 overflow-y-auto">
              {leaveHistory.length ? leaveHistory.map((item) => (
                <article key={`history-${item.id}`} className="rounded-xl border border-slate-200 bg-white p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[11px] text-slate-700">{item.fromDate} to {item.toDate}</p>
                    <span className={statusPillCls(item.status)}>{item.status}</span>
                  </div>
                  <small className="block text-[10px] text-slate-500">ID: {item.id}</small>
                  <small className="block text-[10px] text-slate-500">Reason: {item.reason}</small>
                  <small className="block text-[10px] text-slate-500">Requested: {item.requestedAt || 'N/A'}</small>
                </article>
              )) : <p className="text-xs text-slate-500">No leave history for this student.</p>}
            </div>
          </aside>
        </div>
      </div>
    </motion.section>
  )
}

export default StudentAttendancePage
