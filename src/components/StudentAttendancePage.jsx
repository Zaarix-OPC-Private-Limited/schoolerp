import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { defaultLeaveRequests, classNames, classTeacherByClass, classStudentNames } from './dashboard/constants'
import { formatDateKey, getAttendanceSummary, seedAttendance } from './dashboard/utils'
import { getAttendance, getAttendanceSyncStatus, getStudentLeaveRequests, markAttendance, updateLeaveRequestStatus } from '../services/attendanceApi'
import { subscribeRealtimeEvent } from '../services/realtime'

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

function StudentAttendancePage({ students = [], intent = null, onBack }) {
  const [selectedClass, setSelectedClass] = useState(intent?.selectedClass || '')
  const [selectedStudentId, setSelectedStudentId] = useState(intent?.selectedStudentId || '')
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

  return (
    <motion.section
      key="student-attendance-page"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-slate-100 text-slate-800"
    >
      <div className="mx-auto max-w-7xl px-5 py-6 sm:px-8">
        <header className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700">Student Attendance</p>
              <h1 className="text-2xl font-semibold text-slate-900">Attendance and Leave Monitor</h1>
            </div>
            <button type="button" className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50" onClick={onBack}>
              Back to Students
            </button>
          </div>
        </header>

        <section className="erp-attendance-workspace">
          <article className="erp-attendance-left">
            {selectedStudent ? (
              <>
                <div className="erp-attendance-person-header">
                  {selectedStudent.photoPreview ? (
                    <img src={selectedStudent.photoPreview} alt={selectedStudent.name} className="erp-student-avatar-image" />
                  ) : (
                    <span className="erp-student-avatar">{getInitials(selectedStudent.name)}</span>
                  )}
                  <div>
                    <p className="erp-student-name">{selectedStudent.name}</p>
                    <p className="erp-student-meta">
                      {selectedStudent.className}-{selectedStudent.section} | Roll {selectedStudent.rollNumber}
                    </p>
                  </div>
                </div>

                <div className="erp-attendance-top-grid">
                  <article className="erp-attendance-top-card"><p>This Month</p><strong>{monthSummary.percent}%</strong></article>
                  <article className="erp-attendance-top-card"><p>Present</p><strong>{monthSummary.present}</strong></article>
                  <article className="erp-attendance-top-card"><p>Absent</p><strong>{monthSummary.absent}</strong></article>
                </div>
                {isLoadingRemote ? <p className="erp-notice-status">Syncing attendance from app...</p> : null}
                {remoteError ? <p className="erp-notice-status">{remoteError}</p> : null}
                <div className="erp-attendance-top-grid mt-2">
                  <article className="erp-attendance-top-card"><p>Biometric Entries</p><strong>{monthSourceSummary.biometric}</strong></article>
                  <article className="erp-attendance-top-card"><p>Teacher App Entries</p><strong>{monthSourceSummary.teacher_app}</strong></article>
                  <article className="erp-attendance-top-card"><p>Conflicts</p><strong>{monthSourceSummary.conflicts}</strong></article>
                </div>
                {(syncStatus.biometricLastSyncAt || syncStatus.teacherAppLastSyncAt) ? (
                  <p className="erp-notice-status">
                    Last Sync | Biometric: {syncStatus.biometricLastSyncAt || 'N/A'} | Teacher App: {syncStatus.teacherAppLastSyncAt || 'N/A'}
                  </p>
                ) : null}

                <div className="erp-attendance-calendar-shell mt-3">
                  <div className="erp-attendance-calendar-top">
                    <p className="erp-attendance-month-label">{monthMeta.label}</p>
                    <div className="erp-attendance-month-controls">
                      <select
                        className="erp-attendance-month-select"
                        value={monthMeta.month}
                        onChange={(event) => {
                          const nextMonth = Number(event.target.value)
                          setMonthCursor((prev) => new Date(prev.getFullYear(), nextMonth, 1))
                        }}
                      >
                        {monthNames.map((monthName, monthIndex) => (
                          <option key={monthName} value={monthIndex}>
                            {monthName}
                          </option>
                        ))}
                      </select>
                      <select
                        className="erp-attendance-month-select"
                        value={monthMeta.year}
                        onChange={(event) => {
                          const nextYear = Number(event.target.value)
                          setMonthCursor((prev) => new Date(nextYear, prev.getMonth(), 1))
                        }}
                      >
                        {availableYears.map((year) => (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        className="erp-attendance-month-select"
                        value={yearInput}
                        onChange={(event) => setYearInput(event.target.value)}
                        onBlur={() => {
                          const parsed = Number.parseInt(yearInput, 10)
                          if (Number.isNaN(parsed)) {
                            setYearInput(String(monthMeta.year))
                            return
                          }
                          setMonthCursor((prev) => new Date(parsed, prev.getMonth(), 1))
                        }}
                        onKeyDown={(event) => {
                          if (event.key !== 'Enter') return
                          const parsed = Number.parseInt(yearInput, 10)
                          if (Number.isNaN(parsed)) {
                            setYearInput(String(monthMeta.year))
                            return
                          }
                          setMonthCursor((prev) => new Date(parsed, prev.getMonth(), 1))
                        }}
                        placeholder="Type year"
                        aria-label="Type year"
                      />
                      <button type="button" className="erp-nav-button" onClick={() => setMonthCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}>Prev</button>
                      <button type="button" className="erp-nav-button" onClick={() => setMonthCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}>Next</button>
                    </div>
                  </div>

                  <div className="erp-attendance-legend">
                    <span className="erp-legend-item erp-legend-present">Present</span>
                    <span className="erp-legend-item" style={{ background: '#fee2e2', color: '#991b1b' }}>Absent</span>
                    <span className="erp-legend-item" style={{ background: '#fef9c3', color: '#854d0e' }}>Sick Leave</span>
                    <span className="erp-legend-item" style={{ background: '#ffffff', color: '#334155', border: '1px solid #cbd5e1' }}>No Mark</span>
                  </div>

                  <div className="erp-attendance-quick-actions">
                    <p>Mark today quickly</p>
                    <div className="erp-attendance-quick-buttons">
                      <button type="button" className="erp-attendance-quick-btn erp-attendance-quick-present" onClick={() => setToday('present')}>Present</button>
                      <button type="button" className="erp-attendance-quick-btn" style={{ background: '#fee2e2', color: '#991b1b', borderColor: '#fca5a5' }} onClick={() => setToday('absent')}>Absent</button>
                      <button type="button" className="erp-attendance-quick-btn" style={{ background: '#fef9c3', color: '#854d0e', borderColor: '#fde047' }} onClick={() => setToday('sick_leave')}>Sick Leave</button>
                    </div>
                  </div>

                  <div className="erp-attendance-week-grid">
                    {dayNames.map((d) => (
                      <span key={d} className="erp-attendance-week-label">
                        {d}
                      </span>
                    ))}
                  </div>

                  <div className="erp-attendance-days-grid mt-2">
                    {Array.from({ length: monthMeta.firstDayOffset }).map((_, idx) => (
                      <div key={`empty-${idx}`} className="erp-attendance-day-empty" />
                    ))}
                    {Array.from({ length: monthMeta.totalDays }).map((_, idx) => {
                      const day = idx + 1
                      const key = formatDateKey(new Date(monthMeta.year, monthMeta.month, day))
                      const entry = selectedRecord[key]
                      const explicitValue = statusFromEntry(entry)
                      const value = explicitValue || (isSundayDateKey(key) ? 'sick_leave' : null)
                      const source = sourceFromEntry(entry)
                      const isWeeklyOff = !entry && isSundayDateKey(key)
                      const isToday = key === formatDateKey(new Date())
                      const classes = ['erp-attendance-day']
                      if (isToday) classes.push('erp-attendance-today')
                      const style =
                        value === 'present'
                          ? { background: '#dcfce7', borderColor: '#4ade80', color: '#166534' }
                          : value === 'absent'
                            ? { background: '#fee2e2', borderColor: '#f87171', color: '#991b1b' }
                            : value === 'sick_leave'
                              ? { background: '#fef9c3', borderColor: '#fde047', color: '#854d0e' }
                              : { background: '#ffffff', borderColor: '#cbd5e1', color: '#1e293b' }
                      return (
                        <button
                          key={key}
                          type="button"
                          className={classes.join(' ')}
                          style={style}
                          onClick={() => toggleDayStatus(key)}
                          title={`${key} | Status: ${value || 'none'} | Source: ${
                            source === 'biometric' ? 'Biometric' : source === 'teacher_app' ? 'Teacher App' : source === 'manual' ? 'Manual' : isWeeklyOff ? 'Weekly Off (Sunday)' : 'N/A'
                          }`}
                        >
                          <span>{day}</span>
                          {source || isWeeklyOff ? (
                            <small style={{ display: 'block', fontSize: '0.62rem', lineHeight: 1, marginTop: '2px' }}>
                              {source === 'biometric' ? 'B' : source === 'teacher_app' ? 'T' : source === 'manual' ? 'M' : 'W'}
                            </small>
                          ) : null}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="erp-attendance-report">
                  <p className="erp-attendance-report-title">Previous Attendance Details</p>
                  <div className="erp-attendance-report-grid">
                    <article className="erp-attendance-report-card"><p>Total Present</p><strong>{attendanceSummary.present}</strong></article>
                    <article className="erp-attendance-report-card"><p>Total Absent</p><strong>{attendanceSummary.absent}</strong></article>
                    <article className="erp-attendance-report-card"><p>Total Sick Leave</p><strong>{attendanceSummary.sickLeave}</strong></article>
                    <article className="erp-attendance-report-card"><p>Overall %</p><strong>{attendanceSummary.percentage}%</strong></article>
                  </div>
                  <p className="erp-attendance-report-line">Click any date cell to cycle: none -&gt; present -&gt; absent -&gt; sick leave.</p>
                  {statusMessage ? <p className="erp-notice-status">{statusMessage}</p> : null}
                </div>
              </>
            ) : (
              <p className="text-sm text-slate-600">No student found for this class.</p>
            )}
          </article>

          <aside className="erp-attendance-right">
            <h3 className="erp-attendance-right-title">Students ({getClassLabel(selectedClass)})</h3>
            <label className="erp-attendance-search">
              <span>Search Student</span>
              <input type="text" value={searchText} onChange={(event) => setSearchText(event.target.value)} placeholder="Name, roll, ID" />
            </label>

            <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Class-wise Live Attendance</p>
              <div className="mt-2 grid gap-2">
                {classCards.map((item) => (
                  <button
                    key={`class-card-${item.className}`}
                    type="button"
                    className={`rounded-lg border px-3 py-2 text-left text-xs transition ${
                      selectedClass === item.className ? 'border-cyan-400 bg-cyan-100 text-cyan-900' : 'border-slate-200 bg-white text-slate-700 hover:border-cyan-300 hover:bg-cyan-50'
                    }`}
                    onClick={() => {
                      setSelectedClass(item.className)
                      setSelectedStudentId('')
                      setSearchText('')
                    }}
                  >
                    <p className="font-semibold">{getClassLabel(item.className)}</p>
                    <p className="mt-1 text-[11px] text-slate-600">Present Today: {item.presentToday}/{item.totalStudents}</p>
                    <p className="text-[11px] text-slate-600">Month Avg: {item.monthPercent}%</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="erp-attendance-side-list mt-3">
              {visibleStudents.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`erp-attendance-side-item ${selectedStudent?.id === item.id ? 'border border-cyan-300 bg-cyan-50' : ''}`}
                  onClick={() => setSelectedStudentId(item.id)}
                >
                  {item.photoPreview ? (
                    <img src={item.photoPreview} alt={item.name} className="erp-student-compact-image rounded-full object-cover" />
                  ) : (
                    <span className="erp-student-avatar">{getInitials(item.name)}</span>
                  )}
                  <div>
                    <strong>{item.name}</strong>
                    <small>
                      Roll {item.rollNumber} | {item.className}-{item.section}
                    </small>
                    {pendingByStudent[`${item.className}::${item.rollNumber}::${item.name}`] ? (
                      <small style={{ display: 'block', color: '#92400e', fontWeight: 700 }}>
                        Pending Leave: {pendingByStudent[`${item.className}::${item.rollNumber}::${item.name}`]}
                      </small>
                    ) : null}
                  </div>
                </button>
              ))}
            </div>

            <h3 className="erp-attendance-right-title mt-4">Leave Requests (App)</h3>
            {pendingStudentLeaveRequests.length ? (
              <p className="erp-notice-status" style={{ background: '#fef3c7', borderColor: '#fcd34d', color: '#92400e' }}>
                Highlight: {pendingStudentLeaveRequests.length} pending leave request(s) from app for {selectedStudent?.name}.
              </p>
            ) : null}
            <div className="erp-leave-list">
              {pendingStudentLeaveRequests.length ? (
                pendingStudentLeaveRequests.map((item) => (
                  <article key={item.id} className="erp-leave-item">
                    <div className="erp-leave-item-head">
                      <div>
                        <p className="erp-student-name">{item.requesterName}</p>
                        <p className="erp-student-meta">
                          {item.fromDate} to {item.toDate}
                        </p>
                      </div>
                      <span className={`erp-leave-status-pill ${leaveStatusClass(item.status)}`}>{item.status}</span>
                    </div>
                    <p className="erp-student-meta mt-2">{item.reason}</p>
                    <p className="erp-student-meta mt-1">Parent Contact: {item.parentContact}</p>
                    <div className="erp-leave-actions">
                      <button
                        type="button"
                        className="erp-nav-button"
                        onClick={() => setExpandedLeaveHistoryId((prev) => (prev === item.id ? '' : item.id))}
                      >
                        {expandedLeaveHistoryId === item.id ? 'Hide Leave History' : 'Leave History'}
                      </button>
                    </div>
                    {expandedLeaveHistoryId === item.id ? (
                      <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-2">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-600">Monthly Leave Details</p>
                        <div className="mt-2 grid gap-1">
                          {getLeaveHistoryForRequest(item).map((row) => (
                            <p key={`${item.id}-${row.monthKey}`} className="text-xs text-slate-700">
                              {row.monthLabel}: {row.leaveDays} day(s) | {row.requests} request(s)
                            </p>
                          ))}
                        </div>
                      </div>
                    ) : null}
                    {item.status === 'pending' ? (
                      <div className="erp-leave-actions">
                        <button type="button" className="erp-nav-button" onClick={() => handleLeaveDecision(item.id, 'approved')}>
                          Approve
                        </button>
                        <button type="button" className="erp-nav-button" onClick={() => handleLeaveDecision(item.id, 'rejected')}>
                          Reject
                        </button>
                      </div>
                    ) : null}
                  </article>
                ))
              ) : (
                <p className="erp-student-meta">No pending leave requests for this student.</p>
              )}
            </div>

            <h3 className="erp-attendance-right-title mt-4">View Leave History</h3>
            <div className="erp-notice-history-list" style={{ maxHeight: '420px' }}>
              {leaveHistory.length ? (
                leaveHistory.map((item) => (
                  <article key={`history-${item.id}`} className="erp-notice-history-item" style={{ display: 'grid', gap: '0.35rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', alignItems: 'center' }}>
                      <p>{item.fromDate} to {item.toDate}</p>
                      <span className={`erp-leave-status-pill ${leaveStatusClass(item.status)}`}>{item.status}</span>
                    </div>
                    <small>ID: {item.id}</small>
                    <small>Reason: {item.reason}</small>
                    <small>Requested: {item.requestedAt || 'N/A'}</small>
                  </article>
                ))
              ) : (
                <p className="erp-student-meta">No leave history for this student.</p>
              )}
            </div>
          </aside>
        </section>
      </div>
    </motion.section>
  )
}

export default StudentAttendancePage
