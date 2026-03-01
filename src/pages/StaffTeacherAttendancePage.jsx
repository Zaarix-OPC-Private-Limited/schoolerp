import { useEffect, useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAppContext } from '../context/AppContext'
import { bulkMarkAttendance, getAttendanceExceptions } from '../services/api'

// ─── helpers ─────────────────────────────────────────────────────────────────

const toDateString = (d) => {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
}

const STATUS_OPTIONS = ['Present', 'Absent', 'Late', 'Half-Day']

const STATUS_STYLES = {
    Present: {
        pill: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        btn: 'border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100',
    },
    Absent: {
        pill: 'bg-red-100 text-red-800 border-red-200',
        btn: 'border-red-300 bg-red-50 text-red-800 hover:bg-red-100',
    },
    Late: {
        pill: 'bg-amber-100 text-amber-800 border-amber-200',
        btn: 'border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100',
    },
    'Half-Day': {
        pill: 'bg-blue-100 text-blue-800 border-blue-200',
        btn: 'border-blue-300 bg-blue-50 text-blue-800 hover:bg-blue-100',
    },
}

const getInitials = (name) =>
    String(name || '')
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((p) => p[0]?.toUpperCase() ?? '')
        .join('') || '??'

// ─── component ────────────────────────────────────────────────────────────────

export default function StaffTeacherAttendancePage() {
    const navigate = useNavigate()
    const { teacherRecords = [], staffRecords = [] } = useAppContext()

    const [activeTab, setActiveTab] = useState('TEACHER')   // 'TEACHER' | 'STAFF'
    const [selectedDate, setSelectedDate] = useState(toDateString(new Date()))

    // Map of userId → status ('Present' | 'Absent' | 'Late' | 'Half-Day')
    const [statusMap, setStatusMap] = useState({})

    const [isLoading, setIsLoading] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [toast, setToast] = useState(null)   // { type: 'success'|'error', msg }
    const [searchText, setSearchText] = useState('')

    // Derive the list for the active tab
    const peopleList = useMemo(() => {
        const raw = activeTab === 'TEACHER' ? teacherRecords : staffRecords
        const q = searchText.trim().toLowerCase()
        return raw
            .map((p, i) => ({
                id: p._id || p.id || `${activeTab[0]}-${i}`,
                name: p.name || 'Unknown',
                designation: p.designation || p.subject || p.role || '',
                dept: p.department || p.classTeacherName || '',
                photo: p.photoPreview || '',
            }))
            .filter((p) =>
                !q ||
                p.name.toLowerCase().includes(q) ||
                p.designation.toLowerCase().includes(q) ||
                p.dept.toLowerCase().includes(q)
            )
    }, [activeTab, teacherRecords, staffRecords, searchText])

    const showToast = useCallback((type, msg) => {
        setToast({ type, msg })
        setTimeout(() => setToast(null), 4000)
    }, [])

    // ── fetch existing exceptions when tab or date changes ───────────────────
    useEffect(() => {
        let cancelled = false
        const load = async () => {
            setIsLoading(true)
            setStatusMap({}) // reset to all-Present while loading
            try {
                const res = await getAttendanceExceptions(selectedDate, activeTab)
                if (cancelled) return
                const records = res?.data?.attendanceRecords || []
                const map = {}
                records.forEach((r) => {
                    const uid = r.userId?._id || r.userId
                    if (uid) map[String(uid)] = r.status
                })
                setStatusMap(map)
            } catch {
                if (!cancelled) showToast('error', 'Could not load existing attendance. Showing all as Present.')
            } finally {
                if (!cancelled) setIsLoading(false)
            }
        }
        load()
        return () => { cancelled = true }
    }, [activeTab, selectedDate, showToast])

    // ── status change for one person ─────────────────────────────────────────
    const setStatus = useCallback((userId, status) => {
        setStatusMap((prev) => ({ ...prev, [String(userId)]: status }))
    }, [])

    // ── mark all present ─────────────────────────────────────────────────────
    const markAllPresent = useCallback(() => {
        setStatusMap({})
    }, [])

    // ── submit ───────────────────────────────────────────────────────────────
    const handleSubmit = useCallback(async () => {
        setIsSubmitting(true)
        try {
            // Build the full entries array for everyone in the list
            const entries = peopleList.map((p) => ({
                userId: p.id,
                userRole: activeTab,
                status: statusMap[String(p.id)] || 'Present',
            }))

            await bulkMarkAttendance(selectedDate, entries)

            const exceptionCount = entries.filter((e) => e.status !== 'Present').length
            showToast(
                'success',
                exceptionCount === 0
                    ? `All ${peopleList.length} marked Present. No exceptions saved.`
                    : `Saved: ${exceptionCount} exception(s) out of ${peopleList.length} total.`
            )
        } catch (err) {
            showToast('error', err.message || 'Failed to save attendance. Please try again.')
        } finally {
            setIsSubmitting(false)
        }
    }, [activeTab, peopleList, selectedDate, statusMap, showToast])

    // ── summary counts ───────────────────────────────────────────────────────
    const summary = useMemo(() => {
        const counts = { Present: 0, Absent: 0, Late: 0, 'Half-Day': 0 }
        peopleList.forEach((p) => {
            const s = statusMap[String(p.id)] || 'Present'
            counts[s] = (counts[s] || 0) + 1
        })
        return counts
    }, [peopleList, statusMap])

    // ─── render ───────────────────────────────────────────────────────────────
    return (
        <motion.section
            key="staff-teacher-attendance"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="min-h-screen bg-slate-50 text-slate-800"
        >
            <div className="mx-auto max-w-5xl px-4 py-6 sm:px-8">

                {/* ── Header ─────────────────────────────────────────── */}
                <header className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400">
                                School ERP · Attendance
                            </p>
                            <h1 className="text-xl font-bold text-slate-900">
                                Staff & Teacher Attendance
                            </h1>
                            <p className="mt-0.5 text-xs text-slate-500">
                                Everyone is <span className="font-semibold text-emerald-600">Present</span> by default.
                                Mark only exceptions — only Absent / Late / Half-Day are saved to database.
                            </p>
                        </div>
                        <button
                            type="button"
                            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                            onClick={() => navigate(-1)}
                        >
                            ← Back
                        </button>
                    </div>
                </header>

                {/* ── Controls ───────────────────────────────────────── */}
                <div className="mb-4 flex flex-wrap items-center gap-3">
                    {/* Tab */}
                    <div className="flex rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
                        {['TEACHER', 'STAFF'].map((tab) => (
                            <button
                                key={tab}
                                type="button"
                                onClick={() => { setActiveTab(tab); setSearchText('') }}
                                className={`rounded-md px-4 py-1.5 text-xs font-semibold transition ${activeTab === tab
                                    ? 'bg-slate-900 text-white shadow'
                                    : 'text-slate-600 hover:bg-slate-100'
                                    }`}
                            >
                                {tab === 'TEACHER' ? '👨‍🏫 Teachers' : '🧑‍💼 Staff'}
                                <span className="ml-1.5 rounded-full bg-white/20 px-1.5 py-0.5 text-[10px]">
                                    {tab === 'TEACHER' ? teacherRecords.length : staffRecords.length}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* Date picker */}
                    <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 shadow-sm">
                        <span className="text-xs font-semibold text-slate-600">Date:</span>
                        <input
                            type="date"
                            value={selectedDate}
                            max={toDateString(new Date())}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="text-xs text-slate-800 focus:outline-none"
                        />
                    </label>

                    {/* Search */}
                    <input
                        type="text"
                        placeholder="Search by name, role…"
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs shadow-sm focus:border-blue-400 focus:outline-none"
                    />
                </div>

                {/* ── Summary bar ────────────────────────────────────── */}
                <div className="mb-4 grid grid-cols-4 gap-2">
                    {Object.entries(summary).map(([status, count]) => (
                        <div
                            key={status}
                            className={`rounded-xl border p-3 text-center shadow-sm ${STATUS_STYLES[status]?.pill || 'border-slate-200 bg-white text-slate-800'}`}
                        >
                            <p className="text-xs font-semibold">{status}</p>
                            <p className="mt-0.5 text-xl font-bold">{count}</p>
                        </div>
                    ))}
                </div>

                {/* ── Toast ──────────────────────────────────────────── */}
                <AnimatePresence>
                    {toast && (
                        <motion.div
                            key="toast"
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            className={`mb-4 rounded-lg px-4 py-2.5 text-sm font-medium ${toast.type === 'success'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-red-50 text-red-800 border border-red-200'
                                }`}
                        >
                            {toast.type === 'success' ? '✅ ' : '❌ '}{toast.msg}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ── People list ─────────────────────────────────────── */}
                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">

                    {/* list header */}
                    <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            {isLoading ? 'Loading…' : `${peopleList.length} ${activeTab === 'TEACHER' ? 'Teacher(s)' : 'Staff Member(s)'}`}
                        </p>
                        <button
                            type="button"
                            onClick={markAllPresent}
                            className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 transition"
                        >
                            ✓ Mark All Present
                        </button>
                    </div>

                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
                            <span className="ml-2 text-sm text-slate-500">Loading attendance…</span>
                        </div>
                    ) : peopleList.length === 0 ? (
                        <p className="py-12 text-center text-sm text-slate-500">
                            {searchText ? 'No results match your search.' : `No ${activeTab === 'TEACHER' ? 'teachers' : 'staff'} found.`}
                        </p>
                    ) : (
                        <ul className="divide-y divide-slate-100">
                            {peopleList.map((person) => {
                                const currentStatus = statusMap[String(person.id)] || 'Present'
                                return (
                                    <li key={person.id} className="flex flex-wrap items-center gap-3 px-4 py-3 hover:bg-slate-50 transition">
                                        {/* Avatar */}
                                        {person.photo ? (
                                            <img src={person.photo} alt={person.name} className="h-9 w-9 rounded-full object-cover border border-slate-200 shrink-0" />
                                        ) : (
                                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-800 text-xs font-bold text-white">
                                                {getInitials(person.name)}
                                            </span>
                                        )}

                                        {/* Name + role */}
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-semibold text-slate-900 truncate">{person.name}</p>
                                            <p className="text-xs text-slate-500 truncate">
                                                {[person.designation, person.dept].filter(Boolean).join(' · ')}
                                            </p>
                                        </div>

                                        {/* Current status pill */}
                                        <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${STATUS_STYLES[currentStatus]?.pill}`}>
                                            {currentStatus}
                                        </span>

                                        {/* Status buttons */}
                                        <div className="flex gap-1.5 flex-wrap">
                                            {STATUS_OPTIONS.map((s) => (
                                                <button
                                                    key={s}
                                                    type="button"
                                                    onClick={() => setStatus(person.id, s)}
                                                    className={`rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition ${currentStatus === s
                                                        ? `${STATUS_STYLES[s]?.btn} ring-2 ring-offset-1 ring-current opacity-100`
                                                        : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                                                        }`}
                                                >
                                                    {s}
                                                </button>
                                            ))}
                                        </div>
                                    </li>
                                )
                            })}
                        </ul>
                    )}
                </div>

                {/* ── Submit bar ──────────────────────────────────────── */}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                    <div className="text-xs text-slate-500">
                        <span className="font-semibold text-slate-900">
                            {Object.values(statusMap).filter((s) => s !== 'Present').length}
                        </span> exception(s) will be saved to database.&nbsp;
                        <span className="text-slate-400">
                            ({summary.Present} Present — not stored)
                        </span>
                    </div>
                    <button
                        type="button"
                        disabled={isSubmitting || isLoading}
                        onClick={handleSubmit}
                        className="rounded-lg bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50 transition"
                    >
                        {isSubmitting ? 'Saving…' : `Submit Attendance for ${selectedDate}`}
                    </button>
                </div>

            </div>
        </motion.section>
    )
}
