import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate, useLocation } from 'react-router-dom'
import { defaultLeaveRequests, classNames } from '../components/dashboard/constants'
import { formatDateKey, seedAttendance } from '../components/dashboard/utils'
import { getTeacherAttendance, getTeacherAttendanceSyncStatus, markTeacherAttendanceManual, updateLeaveRequestStatus } from '../services/attendanceApi'
import { subscribeRealtimeEvent } from '../services/realtime'
import { useAppContext } from '../context/AppContext'

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

function TeacherAttendancePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { teacherRecords: teachers = [] } = useAppContext()
  const intent = location.state || null
  const [selectedClass, setSelectedClass] = useState(intent?.selectedClass || intent?.teacher?.classTeacherName || '')
  const [selectedTeacherId, setSelectedTeacherId] = useState(intent?.selectedTeacherId || intent?.teacher?.id || '')
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


  const statusPillCls = (s) =>
    s === 'approved' ? 'rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-800' :
      s === 'rejected' ? 'rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-800' :
        'rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800'
  const selectCls = 'rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-800 focus:border-blue-400 focus:outline-none'
  const navBtnCls = 'rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition'

  return (
    <motion.section
      key="teacher-attendance-page"
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
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400">Teacher Attendance</p>
              <h1 className="text-xl font-bold text-slate-900">Biometric + Manual Override Monitor</h1>
            </div>
            <button type="button" className={navBtnCls} onClick={() => navigate(-1)}>← Back</button>
          </div>
        </header>

        {/* Workspace */}
        <div className="flex gap-5">
          {/* Left — calendar + stats */}
          <article className="min-w-0 flex-1">
            {selectedTeacher ? (
              <>
                {/* Teacher header */}
                <div className="mb-4 flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                  {selectedTeacher.photoPreview ? (
                    <img src={selectedTeacher.photoPreview} alt={selectedTeacher.name} className="h-12 w-12 rounded-full object-cover border border-slate-200" />
                  ) : (
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-800 text-sm font-bold text-white">{getInitials(selectedTeacher.name)}</span>
                  )}
                  <div>
                    <p className="text-sm font-bold text-slate-900">{selectedTeacher.name}</p>
                    <p className="text-xs text-slate-500">Class {selectedTeacher.classTeacherName}-{selectedTeacher.classTeacherSection} | {selectedTeacher.subject}</p>
                  </div>
                </div>

                {/* Stats */}
                <div className="mb-3 grid grid-cols-3 gap-3">
                  <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm text-center"><p className="text-[11px] text-slate-500">This Month</p><strong className="text-lg text-slate-900">{monthSummary.percent}%</strong></div>
                  <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm text-center"><p className="text-[11px] text-slate-500">Present</p><strong className="text-lg text-slate-900">{monthSummary.present}</strong></div>
                  <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm text-center"><p className="text-[11px] text-slate-500">Absent</p><strong className="text-lg text-slate-900">{monthSummary.absent}</strong></div>
                </div>

                {isLoadingRemote && <p className="mb-2 rounded-lg bg-blue-50 px-3 py-1.5 text-xs text-blue-700">Syncing teacher attendance...</p>}
                {remoteError && <p className="mb-2 rounded-lg bg-amber-50 px-3 py-1.5 text-xs text-amber-700">{remoteError}</p>}

                <div className="mb-3 grid grid-cols-3 gap-3">
                  <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm text-center"><p className="text-[11px] text-slate-500">Biometric</p><strong className="text-slate-900">{sourceSummary.biometric}</strong></div>
                  <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm text-center"><p className="text-[11px] text-slate-500">Manual</p><strong className="text-slate-900">{sourceSummary.manual}</strong></div>
                  <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm text-center"><p className="text-[11px] text-slate-500">Conflicts</p><strong className="text-slate-900">{sourceSummary.conflicts}</strong></div>
                </div>

                {(syncStatus.biometricLastSyncAt || syncStatus.manualLastUpdatedAt) && (
                  <p className="mb-3 rounded-lg bg-slate-50 px-3 py-1.5 text-[11px] text-slate-500">
                    Last Sync | Biometric: {syncStatus.biometricLastSyncAt || 'N/A'} | Manual: {syncStatus.manualLastUpdatedAt || 'N/A'}
                  </p>
                )}

                {/* Calendar */}
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-bold text-slate-800">{monthMeta.label}</p>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <select className={selectCls} value={monthMeta.month} onChange={(e) => { const nm = Number(e.target.value); setMonthCursor((p) => new Date(p.getFullYear(), nm, 1)) }}>
                        {monthNames.map((mn, mi) => <option key={mn} value={mi}>{mn}</option>)}
                      </select>
                      <select className={selectCls} value={monthMeta.year} onChange={(e) => { const ny = Number(e.target.value); setMonthCursor((p) => new Date(ny, p.getMonth(), 1)) }}>
                        {availableYears.map((y) => <option key={y} value={y}>{y}</option>)}
                      </select>
                      <input type="number" className={`${selectCls} w-20`} value={yearInput}
                        onChange={(e) => setYearInput(e.target.value)}
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
                    <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-[11px] font-semibold text-yellow-800">Leave</span>
                    <span className="rounded-full border border-slate-300 bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-600">No Mark</span>
                  </div>

                  {/* Quick mark */}
                  <div className="mb-3 rounded-lg bg-slate-50 p-2.5">
                    <p className="mb-2 text-xs font-semibold text-slate-600">Principal Manual Mark (if biometric failed)</p>
                    <div className="flex gap-2">
                      <button type="button" className="rounded-lg border border-green-300 bg-green-100 px-3 py-1.5 text-xs font-semibold text-green-800 hover:bg-green-200 transition" onClick={() => todayMark('present')}>Present</button>
                      <button type="button" className="rounded-lg border border-red-300 bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-800 hover:bg-red-200 transition" onClick={() => todayMark('absent')}>Absent</button>
                      <button type="button" className="rounded-lg border border-yellow-300 bg-yellow-100 px-3 py-1.5 text-xs font-semibold text-yellow-800 hover:bg-yellow-200 transition" onClick={() => todayMark('leave')}>Leave</button>
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
                      const value = explicitValue || (isSundayDateKey(key) ? 'leave' : null)
                      const source = sourceFromEntry(entry)
                      const isWeeklyOff = !entry && isSundayDateKey(key)
                      const isToday = key === formatDateKey(new Date())
                      const bgCls = value === 'present' ? 'bg-green-100 border-green-400 text-green-800'
                        : value === 'absent' ? 'bg-red-100 border-red-400 text-red-800'
                          : value === 'leave' ? 'bg-yellow-100 border-yellow-400 text-yellow-800'
                            : 'bg-white border-slate-300 text-slate-800'
                      return (
                        <button key={key} type="button"
                          className={`flex flex-col items-center justify-center rounded-lg border p-1 text-[11px] font-semibold transition hover:opacity-80 ${bgCls} ${isToday ? 'ring-2 ring-blue-500 ring-offset-1' : ''}`}
                          style={{ minHeight: 36 }}
                          onClick={() => toggleDayStatus(key)}
                          title={`${key} | Status: ${value || 'none'} | Source: ${source === 'biometric' ? 'Biometric' : source === 'manual' ? 'Manual' : source === 'teacher_app' ? 'Teacher App' : isWeeklyOff ? 'Weekly Off' : 'N/A'}`}
                        >
                          <span>{day}</span>
                          {(source || isWeeklyOff) && (
                            <small className="block text-[9px] leading-none mt-0.5">
                              {source === 'biometric' ? 'B' : source === 'manual' ? 'M' : source === 'teacher_app' ? 'T' : 'W'}
                            </small>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {statusMessage && <p className="mt-3 rounded-lg bg-green-50 px-3 py-1.5 text-xs text-green-700">{statusMessage}</p>}
              </>
            ) : (
              <p className="text-sm text-slate-600">No teacher found for selected class.</p>
            )}
          </article>

          {/* Right — teacher list + leave */}
          <aside className="w-64 shrink-0">
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Teachers ({selectedClass || 'N/A'})</h3>
            <label className="mb-3 flex flex-col gap-1">
              <span className="text-xs font-semibold text-slate-600">Search Teacher</span>
              <input type="text" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs focus:border-blue-400 focus:outline-none" value={searchText} onChange={(e) => setSearchText(e.target.value)} placeholder="Name, ID, subject" />
            </label>

            <label className="mb-3 flex flex-col gap-1">
              <span className="text-xs font-semibold text-slate-600">Class</span>
              <select className={selectCls + ' w-full'} value={selectedClass} onChange={(e) => { setSelectedClass(e.target.value); setSelectedTeacherId(''); setSearchText('') }}>
                {classOptions.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>

            {/* Teacher list */}
            <div className="mb-4 max-h-72 overflow-y-auto rounded-xl border border-slate-200 bg-white">
              {visibleTeachers.map((item) => (
                <button key={item.id} type="button"
                  className={`flex w-full items-center gap-2 border-b border-slate-100 px-3 py-2 text-left transition last:border-0 hover:bg-slate-50 ${selectedTeacher?.id === item.id ? 'bg-blue-50' : ''}`}
                  onClick={() => setSelectedTeacherId(item.id)}>
                  {item.photoPreview
                    ? <img src={item.photoPreview} alt={item.name} className="h-7 w-7 rounded-full object-cover" />
                    : <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-800 text-[9px] font-bold text-white">{getInitials(item.name)}</span>
                  }
                  <div className="min-w-0">
                    <strong className="block text-xs text-slate-900 truncate">{item.name}</strong>
                    <small className="text-[10px] text-slate-500">{item.id} | {item.subject}</small>
                  </div>
                </button>
              ))}
            </div>

            {/* Leave Requests */}
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Teacher Leave Requests</h3>
            {pendingTeacherLeaveRequests.length > 0 && (
              <p className="mb-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs text-amber-800">
                {pendingTeacherLeaveRequests.length} pending leave request(s) for {selectedTeacher?.name}.
              </p>
            )}
            <div className="space-y-2">
              {pendingTeacherLeaveRequests.length ? pendingTeacherLeaveRequests.map((item) => (
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
                      <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">Monthly Leave Details</p>
                      {getLeaveHistoryForRequest(item).map((row) => (
                        <p key={`${item.id}-${row.monthKey}`} className="text-[11px] text-slate-700">{row.monthLabel}: {row.leaveDays} day(s) | {row.requests} request(s)</p>
                      ))}
                    </div>
                  )}
                </article>
              )) : <p className="text-xs text-slate-500">No pending leave requests for this teacher.</p>}
            </div>

            {/* Leave History */}
            <h3 className="mt-4 mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">View Leave History</h3>
            <div className="max-h-[360px] space-y-2 overflow-y-auto">
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
              )) : <p className="text-xs text-slate-500">No leave history for this teacher.</p>}
            </div>
          </aside>
        </div>
      </div>
    </motion.section>
  )
}

export default TeacherAttendancePage
