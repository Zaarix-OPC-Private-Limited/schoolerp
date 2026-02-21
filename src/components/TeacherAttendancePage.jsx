import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { defaultLeaveRequests, classNames } from './dashboard/constants'
import { formatDateKey, seedAttendance } from './dashboard/utils'
import { getTeacherAttendance, getTeacherAttendanceSyncStatus, markTeacherAttendanceManual, updateLeaveRequestStatus } from '../services/attendanceApi'
import { subscribeRealtimeEvent } from '../services/realtime'

const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const statusOrder = [null, 'present', 'absent', 'leave']
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

const normalizeTeacher = (teacher, index) => ({
  id: teacher.id || `T-${String(index + 1).padStart(3, '0')}`,
  name: teacher.name || 'Teacher',
  contactNumber: teacher.contactNumber || 'N/A',
  classTeacherName: teacher.classTeacherName || 'N/A',
  classTeacherSection: teacher.classTeacherSection || 'A',
  subject: teacher.subject || 'N/A',
  photoPreview: teacher.photoPreview || '',
})

const getInitials = (name) =>
  String(name || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || 'TR'

const normalizeTeacherAttendanceResponse = (payload) => {
  if (!payload) return {}
  if (Array.isArray(payload.records)) {
    return Object.fromEntries(
      payload.records.map((item) => [
        item.date || item.dateKey,
        {
          finalStatus: item.finalStatus || item.status || null,
          sourceUsed: item.sourceUsed || item.source || 'biometric',
          biometricStatus: item.biometricStatus || null,
          manualStatus: item.manualStatus || null,
          updatedAt: item.updatedAt || null,
        },
      ]),
    )
  }
  if (payload.records && typeof payload.records === 'object') {
    return Object.fromEntries(
      Object.entries(payload.records).map(([date, value]) => {
        if (typeof value === 'string') return [date, { finalStatus: value, sourceUsed: 'biometric' }]
        return [date, value]
      }),
    )
  }
  if (typeof payload === 'object' && !Array.isArray(payload)) {
    return Object.fromEntries(
      Object.entries(payload).map(([date, value]) => {
        if (typeof value === 'string') return [date, { finalStatus: value, sourceUsed: 'biometric' }]
        return [date, value]
      }),
    )
  }
  return {}
}

const statusFromEntry = (entry) => (entry && typeof entry === 'object' ? entry.finalStatus || null : null)
const sourceFromEntry = (entry) => (entry && typeof entry === 'object' ? entry.sourceUsed || '' : '')

function TeacherAttendancePage({ teachers = [], intent = null, onBack }) {
  const [selectedClass, setSelectedClass] = useState(intent?.selectedClass || '')
  const [selectedTeacherId, setSelectedTeacherId] = useState(intent?.selectedTeacherId || '')
  const [searchText, setSearchText] = useState('')
  const [monthCursor, setMonthCursor] = useState(() => new Date())
  const [yearInput, setYearInput] = useState(() => String(new Date().getFullYear()))
  const [recordsByTeacher, setRecordsByTeacher] = useState({})
  const [statusMessage, setStatusMessage] = useState('')
  const [expandedLeaveHistoryId, setExpandedLeaveHistoryId] = useState('')
  const [remoteError, setRemoteError] = useState('')
  const [isLoadingRemote, setIsLoadingRemote] = useState(false)
  const [syncStatus, setSyncStatus] = useState({ biometricLastSyncAt: '', manualLastUpdatedAt: '' })
  const [leaveRequests, setLeaveRequests] = useState(() =>
    defaultLeaveRequests.filter((item) => item.requesterType === 'teacher').map((item) => ({ ...item, status: item.status || 'pending' })),
  )

  const teacherRecords = useMemo(() => teachers.map(normalizeTeacher), [teachers])

  const classOptions = useMemo(() => {
    const available = new Set(teacherRecords.map((item) => item.classTeacherName).filter(Boolean))
    return classNames.filter((item) => available.has(item))
  }, [teacherRecords])

  useEffect(() => {
    if (selectedClass) return
    if (classOptions.length) setSelectedClass(classOptions[0])
  }, [classOptions, selectedClass])

  const classTeachers = useMemo(() => teacherRecords.filter((item) => item.classTeacherName === selectedClass), [selectedClass, teacherRecords])

  const visibleTeachers = useMemo(() => {
    const q = searchText.trim().toLowerCase()
    if (!q) return classTeachers
    return classTeachers.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q) ||
        item.subject.toLowerCase().includes(q) ||
        item.contactNumber.toLowerCase().includes(q),
    )
  }, [classTeachers, searchText])

  const selectedTeacher = useMemo(
    () => classTeachers.find((item) => item.id === selectedTeacherId) || visibleTeachers[0] || classTeachers[0] || null,
    [classTeachers, selectedTeacherId, visibleTeachers],
  )

  useEffect(() => {
    if (!selectedTeacher) return
    setSelectedTeacherId(selectedTeacher.id)
    setRecordsByTeacher((previous) => {
      if (previous[selectedTeacher.id]) return previous
      const seeded = seedAttendance(selectedTeacher.id)
      const converted = Object.fromEntries(
        Object.entries(seeded).map(([key, value]) => [
          key,
          {
            finalStatus: value,
            sourceUsed: 'biometric',
            biometricStatus: value,
            manualStatus: null,
            updatedAt: null,
          },
        ]),
      )
      return { ...previous, [selectedTeacher.id]: converted }
    })
  }, [selectedTeacher])

  useEffect(() => {
    if (!selectedTeacher) return
    let cancelled = false

    const loadRemote = async () => {
      setIsLoadingRemote(true)
      setRemoteError('')
      try {
        const [attendancePayload, syncPayload] = await Promise.all([
          getTeacherAttendance({
            teacherId: selectedTeacher.id,
            month: monthCursor.getMonth() + 1,
            year: monthCursor.getFullYear(),
          }),
          getTeacherAttendanceSyncStatus({ teacherId: selectedTeacher.id }),
        ])

        if (cancelled) return

        const normalized = normalizeTeacherAttendanceResponse(attendancePayload)
        if (Object.keys(normalized).length) {
          setRecordsByTeacher((previous) => ({
            ...previous,
            [selectedTeacher.id]: {
              ...(previous[selectedTeacher.id] || {}),
              ...normalized,
            },
          }))
        }

        if (syncPayload && typeof syncPayload === 'object') {
          setSyncStatus({
            biometricLastSyncAt: syncPayload.biometricLastSyncAt || syncPayload.biometric_last_sync_at || '',
            manualLastUpdatedAt: syncPayload.manualLastUpdatedAt || syncPayload.manual_last_updated_at || '',
          })
        }
      } catch (error) {
        if (!cancelled) setRemoteError('Teacher attendance API unavailable. Showing local/mock data.')
      } finally {
        if (!cancelled) setIsLoadingRemote(false)
      }
    }

    loadRemote()

    return () => {
      cancelled = true
    }
  }, [monthCursor, selectedTeacher])

  useEffect(() => {
    const unsubscribeAttendance = subscribeRealtimeEvent('attendance-updated', (payload) => {
      const targetType = payload?.requesterType || payload?.entityType || payload?.targetType
      if (targetType && targetType !== 'teacher') return
      const teacherId = payload?.teacherId || payload?.entityId || payload?.targetId
      if (!teacherId) return

      setRecordsByTeacher((previous) => {
        const current = previous[teacherId] || {}
        let patch = {}

        if (payload?.date || payload?.dateKey) {
          const dateKey = payload.date || payload.dateKey
          patch[dateKey] = {
            finalStatus: payload.finalStatus || payload.status || null,
            sourceUsed: payload.sourceUsed || payload.source || 'biometric',
            biometricStatus: payload.biometricStatus || null,
            manualStatus: payload.manualStatus || null,
            updatedAt: payload.updatedAt || new Date().toISOString(),
          }
        } else if (Array.isArray(payload?.records)) {
          patch = Object.fromEntries(
            payload.records.map((item) => [
              item.date || item.dateKey,
              {
                finalStatus: item.finalStatus || item.status || null,
                sourceUsed: item.sourceUsed || item.source || 'biometric',
                biometricStatus: item.biometricStatus || null,
                manualStatus: item.manualStatus || null,
                updatedAt: item.updatedAt || new Date().toISOString(),
              },
            ]),
          )
        } else if (payload?.records && typeof payload.records === 'object') {
          patch = Object.fromEntries(
            Object.entries(payload.records).map(([dateKey, value]) => {
              if (typeof value === 'string') {
                return [dateKey, { finalStatus: value, sourceUsed: 'biometric', biometricStatus: value, manualStatus: null, updatedAt: new Date().toISOString() }]
              }
              return [
                dateKey,
                {
                  finalStatus: value?.finalStatus || value?.status || null,
                  sourceUsed: value?.sourceUsed || value?.source || 'biometric',
                  biometricStatus: value?.biometricStatus || null,
                  manualStatus: value?.manualStatus || null,
                  updatedAt: value?.updatedAt || new Date().toISOString(),
                },
              ]
            }),
          )
        }

        if (!Object.keys(patch).length) return previous
        return { ...previous, [teacherId]: { ...current, ...patch } }
      })

      if (selectedTeacher?.id === teacherId) {
        setStatusMessage(`Realtime update received for ${selectedTeacher.name}.`)
      }
    })

    const unsubscribeLeave = subscribeRealtimeEvent('leave-updated', (payload) => {
      const leave = payload?.leave || payload
      const requesterType = leave?.requesterType || payload?.requesterType
      if (requesterType && requesterType !== 'teacher') return
      if (!leave?.id) return

      const normalized = {
        ...leave,
        requesterType: leave.requesterType || 'teacher',
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
  }, [selectedTeacher])

  const selectedRecord = selectedTeacher ? recordsByTeacher[selectedTeacher.id] || {} : {}

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
    for (let year = currentYear - 40; year <= currentYear + 20; year += 1) years.push(year)
    return years
  }, [])

  useEffect(() => {
    setYearInput(String(monthMeta.year))
  }, [monthMeta.year])

  const monthSummary = useMemo(() => {
    const counters = { present: 0, absent: 0, leave: 0 }
    Array.from({ length: monthMeta.totalDays }).forEach((_, index) => {
      const dateKey = formatDateKey(new Date(monthMeta.year, monthMeta.month, index + 1))
      const explicit = statusFromEntry(selectedRecord[dateKey])
      const status = explicit || (isSundayDateKey(dateKey) ? 'leave' : null)
      if (counters[status] === undefined) return
      counters[status] += 1
    })
    const total = counters.present + counters.absent + counters.leave
    return { ...counters, total, percent: total ? Math.round((counters.present / total) * 100) : 0 }
  }, [monthMeta.month, monthMeta.totalDays, monthMeta.year, selectedRecord])

  const sourceSummary = useMemo(() => {
    const prefix = `${monthMeta.year}-${String(monthMeta.month + 1).padStart(2, '0')}`
    const counters = { biometric: 0, manual: 0, teacher_app: 0, conflicts: 0 }
    Object.entries(selectedRecord).forEach(([dateKey, entry]) => {
      if (!dateKey.startsWith(prefix) || !entry || typeof entry !== 'object') return
      const source = sourceFromEntry(entry)
      if (source && counters[source] !== undefined) counters[source] += 1
      if (entry.biometricStatus && entry.manualStatus && entry.biometricStatus !== entry.manualStatus) counters.conflicts += 1
    })
    return counters
  }, [monthMeta.month, monthMeta.year, selectedRecord])

  const toggleDayStatus = (dateKey) => {
    if (!selectedTeacher) return
    const explicitEntry = selectedRecord[dateKey]
    const current = statusFromEntry(explicitEntry)
    const isSundayDefault = !explicitEntry && isSundayDateKey(dateKey)
    const next = isSundayDefault ? 'present' : statusOrder[(statusOrder.indexOf(current) + 1) % statusOrder.length]

    setRecordsByTeacher((previous) => {
      const teacherRecord = previous[selectedTeacher.id] || {}
      if (next === null) {
        const { [dateKey]: _ignore, ...rest } = teacherRecord
        return { ...previous, [selectedTeacher.id]: rest }
      }
      return {
        ...previous,
        [selectedTeacher.id]: {
          ...teacherRecord,
          [dateKey]: {
            finalStatus: next,
            sourceUsed: 'manual',
            biometricStatus: teacherRecord[dateKey]?.biometricStatus || null,
            manualStatus: next,
            updatedAt: new Date().toISOString(),
          },
        },
      }
    })

    if (next) {
      markTeacherAttendanceManual({
        teacherId: selectedTeacher.id,
        date: dateKey,
        status: next,
        reason: 'Principal manual override',
      }).catch(() => {
        setStatusMessage(`Saved locally for ${dateKey}. API sync pending.`)
      })
    }

    setStatusMessage(`Updated ${dateKey} to ${next || 'none'} for ${selectedTeacher.name}.`)
  }

  const todayMark = (status) => {
    if (!selectedTeacher) return
    const todayKey = formatDateKey(new Date())
    setRecordsByTeacher((previous) => ({
      ...previous,
      [selectedTeacher.id]: {
        ...(previous[selectedTeacher.id] || {}),
        [todayKey]: {
          finalStatus: status,
          sourceUsed: 'manual',
          biometricStatus: previous[selectedTeacher.id]?.[todayKey]?.biometricStatus || null,
          manualStatus: status,
          updatedAt: new Date().toISOString(),
        },
      },
    }))
    markTeacherAttendanceManual({
      teacherId: selectedTeacher.id,
      date: todayKey,
      status,
      reason: 'Principal manual override',
    }).catch(() => {
      setStatusMessage('Saved locally for today. API sync pending.')
    })
    setStatusMessage(`Today's status marked ${status} for ${selectedTeacher.name}.`)
  }

  const teacherLeaveRequests = useMemo(() => {
    if (!selectedTeacher) return []
    return leaveRequests.filter((item) => item.requesterName === selectedTeacher.name)
  }, [leaveRequests, selectedTeacher])

  const pendingTeacherLeaveRequests = useMemo(
    () => teacherLeaveRequests.filter((item) => item.status === 'pending'),
    [teacherLeaveRequests],
  )

  const leaveHistory = useMemo(
    () =>
      [...teacherLeaveRequests].sort((a, b) =>
        String(b.requestedAt || b.fromDate || '').localeCompare(String(a.requestedAt || a.fromDate || '')),
      ),
    [teacherLeaveRequests],
  )

  const leaveStatusClass = (status) => (status === 'approved' ? 'erp-leave-status-approved' : status === 'rejected' ? 'erp-leave-status-rejected' : 'erp-leave-status-pending')

  const handleLeaveDecision = (leaveId, nextStatus) => {
    setLeaveRequests((previous) => previous.map((item) => (item.id === leaveId ? { ...item, status: nextStatus } : item)))
    updateLeaveRequestStatus({ leaveId, status: nextStatus }).catch(() => {
      setStatusMessage(`Leave ${leaveId} updated locally. API sync pending.`)
    })
    setStatusMessage(`Leave request ${leaveId} marked ${nextStatus}.`)
  }
  const getLeaveHistoryForRequest = (leaveItem) => {
    const anchor = parseLeaveDate(leaveItem?.fromDate) || new Date()
    return getMonthlyLeaveHistory(leaveRequests, (item) => item.requesterName === leaveItem.requesterName, anchor)
  }

  return (
    <motion.section
      key="teacher-attendance-page"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-slate-100 text-slate-800"
    >
      <div className="mx-auto max-w-7xl px-5 py-6 sm:px-8">
        <header className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700">Teacher Attendance</p>
              <h1 className="text-2xl font-semibold text-slate-900">Biometric + Manual Override Monitor</h1>
            </div>
            <button type="button" className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50" onClick={onBack}>
              Back to Teachers
            </button>
          </div>
        </header>

        <section className="erp-attendance-workspace">
          <article className="erp-attendance-left">
            {selectedTeacher ? (
              <>
                <div className="erp-attendance-person-header">
                  {selectedTeacher.photoPreview ? (
                    <img src={selectedTeacher.photoPreview} alt={selectedTeacher.name} className="erp-student-avatar-image" />
                  ) : (
                    <span className="erp-student-avatar">{getInitials(selectedTeacher.name)}</span>
                  )}
                  <div>
                    <p className="erp-student-name">{selectedTeacher.name}</p>
                    <p className="erp-student-meta">
                      Class {selectedTeacher.classTeacherName}-{selectedTeacher.classTeacherSection} | {selectedTeacher.subject}
                    </p>
                  </div>
                </div>

                <div className="erp-attendance-top-grid">
                  <article className="erp-attendance-top-card"><p>This Month</p><strong>{monthSummary.percent}%</strong></article>
                  <article className="erp-attendance-top-card"><p>Present</p><strong>{monthSummary.present}</strong></article>
                  <article className="erp-attendance-top-card"><p>Absent</p><strong>{monthSummary.absent}</strong></article>
                </div>
                {isLoadingRemote ? <p className="erp-notice-status">Syncing teacher attendance...</p> : null}
                {remoteError ? <p className="erp-notice-status">{remoteError}</p> : null}

                <div className="erp-attendance-top-grid mt-2">
                  <article className="erp-attendance-top-card"><p>Biometric Entries</p><strong>{sourceSummary.biometric}</strong></article>
                  <article className="erp-attendance-top-card"><p>Manual Entries</p><strong>{sourceSummary.manual}</strong></article>
                  <article className="erp-attendance-top-card"><p>Conflicts</p><strong>{sourceSummary.conflicts}</strong></article>
                </div>
                {(syncStatus.biometricLastSyncAt || syncStatus.manualLastUpdatedAt) ? (
                  <p className="erp-notice-status">
                    Last Sync | Biometric: {syncStatus.biometricLastSyncAt || 'N/A'} | Manual: {syncStatus.manualLastUpdatedAt || 'N/A'}
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
                    <span className="erp-legend-item" style={{ background: '#fef9c3', color: '#854d0e' }}>Leave</span>
                    <span className="erp-legend-item" style={{ background: '#ffffff', color: '#334155', border: '1px solid #cbd5e1' }}>No Mark</span>
                  </div>

                  <div className="erp-attendance-quick-actions">
                    <p>Principal Manual Mark (if biometric failed)</p>
                    <div className="erp-attendance-quick-buttons">
                      <button type="button" className="erp-attendance-quick-btn erp-attendance-quick-present" onClick={() => todayMark('present')}>Present</button>
                      <button type="button" className="erp-attendance-quick-btn" style={{ background: '#fee2e2', color: '#991b1b', borderColor: '#fca5a5' }} onClick={() => todayMark('absent')}>Absent</button>
                      <button type="button" className="erp-attendance-quick-btn" style={{ background: '#fef9c3', color: '#854d0e', borderColor: '#fde047' }} onClick={() => todayMark('leave')}>Leave</button>
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
                      const value = explicitValue || (isSundayDateKey(key) ? 'leave' : null)
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
                            : value === 'leave'
                              ? { background: '#fef9c3', borderColor: '#fde047', color: '#854d0e' }
                              : { background: '#ffffff', borderColor: '#cbd5e1', color: '#1e293b' }
                      return (
                        <button
                          key={key}
                          type="button"
                          className={classes.join(' ')}
                          style={style}
                          onClick={() => toggleDayStatus(key)}
                          title={`${key} | Status: ${value || 'none'} | Source: ${source === 'biometric' ? 'Biometric' : source === 'manual' ? 'Manual' : source === 'teacher_app' ? 'Teacher App' : isWeeklyOff ? 'Weekly Off (Sunday)' : 'N/A'}`}
                        >
                          <span>{day}</span>
                          {source || isWeeklyOff ? (
                            <small style={{ display: 'block', fontSize: '0.62rem', lineHeight: 1, marginTop: '2px' }}>
                              {source === 'biometric' ? 'B' : source === 'manual' ? 'M' : source === 'teacher_app' ? 'T' : 'W'}
                            </small>
                          ) : null}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {statusMessage ? <p className="erp-notice-status mt-3">{statusMessage}</p> : null}
              </>
            ) : (
              <p className="text-sm text-slate-600">No teacher found for selected class.</p>
            )}
          </article>

          <aside className="erp-attendance-right">
            <h3 className="erp-attendance-right-title">Teachers ({selectedClass || 'N/A'})</h3>
            <label className="erp-attendance-search">
              <span>Search Teacher</span>
              <input type="text" value={searchText} onChange={(event) => setSearchText(event.target.value)} placeholder="Name, ID, subject" />
            </label>

            <label className="erp-attendance-search mt-3">
              <span>Class</span>
              <select
                className="erp-fees-native-select"
                value={selectedClass}
                onChange={(event) => {
                  setSelectedClass(event.target.value)
                  setSelectedTeacherId('')
                  setSearchText('')
                }}
              >
                {classOptions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <div className="erp-attendance-side-list mt-3">
              {visibleTeachers.map((item) => (
                <button key={item.id} type="button" className="erp-attendance-side-item" onClick={() => setSelectedTeacherId(item.id)}>
                  {item.photoPreview ? (
                    <img src={item.photoPreview} alt={item.name} className="erp-student-compact-image rounded-full object-cover" />
                  ) : (
                    <span className="erp-student-avatar">{getInitials(item.name)}</span>
                  )}
                  <div>
                    <strong>{item.name}</strong>
                    <small>
                      {item.id} | {item.subject}
                    </small>
                  </div>
                </button>
              ))}
            </div>

            <h3 className="erp-attendance-right-title mt-4">Teacher Leave Requests</h3>
            {pendingTeacherLeaveRequests.length ? (
              <p className="erp-notice-status" style={{ background: '#fef3c7', borderColor: '#fcd34d', color: '#92400e' }}>
                {pendingTeacherLeaveRequests.length} pending leave request(s) for {selectedTeacher?.name}.
              </p>
            ) : null}

            <div className="erp-leave-list">
              {pendingTeacherLeaveRequests.length ? (
                pendingTeacherLeaveRequests.map((item) => (
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
                    <p className="erp-student-meta mt-1">Contact: {item.parentContact}</p>
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
                <p className="erp-student-meta">No pending leave requests for this teacher.</p>
              )}
            </div>

            <h3 className="erp-attendance-right-title mt-4">View Leave History</h3>
            <div className="erp-notice-history-list" style={{ maxHeight: '360px' }}>
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
                <p className="erp-student-meta">No leave history for this teacher.</p>
              )}
            </div>
          </aside>
        </section>
      </div>
    </motion.section>
  )
}

export default TeacherAttendancePage
