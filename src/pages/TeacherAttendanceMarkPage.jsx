import { useEffect, useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAppContext } from '../context/AppContext'
import { bulkMarkAttendance, getAttendanceExceptions } from '../services/api'

const toDateString = (d) => {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
}

const STATUS_OPTIONS = ['Present', 'Absent', 'Late', 'Half-Day']

const STATUS_STYLES = {
    Present: { pill: 'bg-emerald-100 text-emerald-800 border-emerald-200', btn: 'border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100' },
    Absent: { pill: 'bg-red-100 text-red-800 border-red-200', btn: 'border-red-300 bg-red-50 text-red-800 hover:bg-red-100' },
    Late: { pill: 'bg-amber-100 text-amber-800 border-amber-200', btn: 'border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100' },
    'Half-Day': { pill: 'bg-blue-100 text-blue-800 border-blue-200', btn: 'border-blue-300 bg-blue-50 text-blue-800 hover:bg-blue-100' },
}

const getInitials = (name) =>
    String(name || '').split(' ').filter(Boolean).slice(0, 2)
        .map((p) => p[0]?.toUpperCase() ?? '').join('') || '??'

export default function TeacherAttendanceMarkPage() {
    const navigate = useNavigate()
    const { teacherRecords = [] } = useAppContext()

    const [selectedDate, setSelectedDate] = useState(toDateString(new Date()))
    const [statusMap, setStatusMap] = useState({})
    const [isLoading, setIsLoading] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [toast, setToast] = useState(null)
    const [searchText, setSearchText] = useState('')

    const peopleList = useMemo(() => {
        const q = searchText.trim().toLowerCase()
        return teacherRecords
            .map((p, i) => ({
                id: p._id || p.id || `T-${i}`,
                name: p.name || 'Unknown',
                designation: p.subject || p.designation || '',
                dept: p.classTeacherName || p.department || '',
                photo: p.photoPreview || '',
            }))
            .filter((p) => !q || p.name.toLowerCase().includes(q) || p.designation.toLowerCase().includes(q))
    }, [teacherRecords, searchText])

    const showToast = useCallback((type, msg) => {
        setToast({ type, msg })
        setTimeout(() => setToast(null), 4000)
    }, [])

    // Load existing exceptions for the selected date
    useEffect(() => {
        let cancelled = false
        const load = async () => {
            setIsLoading(true)
            setStatusMap({})
            try {
                const res = await getAttendanceExceptions(selectedDate, 'TEACHER')
                if (cancelled) return
                const map = {}
                    ; (res?.data?.attendanceRecords || []).forEach((r) => {
                        const uid = r.userId?._id || r.userId
                        if (uid) map[String(uid)] = r.status
                    })
                setStatusMap(map)
            } catch {
                if (!cancelled) showToast('error', 'Could not load saved attendance. All defaulting to Present.')
            } finally {
                if (!cancelled) setIsLoading(false)
            }
        }
        load()
        return () => { cancelled = true }
    }, [selectedDate, showToast])

    const setStatus = useCallback((id, status) =>
        setStatusMap((prev) => ({ ...prev, [String(id)]: status })), [])

    const markAllPresent = useCallback(() => setStatusMap({}), [])

    const handleSubmit = useCallback(async () => {
        setIsSubmitting(true)
        try {
            const entries = peopleList.map((p) => ({
                userId: p.id,
                userRole: 'TEACHER',
                status: statusMap[String(p.id)] || 'Present',
            }))
            await bulkMarkAttendance(selectedDate, entries)
            const exCount = entries.filter((e) => e.status !== 'Present').length
            showToast('success', exCount === 0
                ? `All ${peopleList.length} teachers marked Present — nothing saved.`
                : `Saved ${exCount} exception(s) for ${selectedDate}.`)
        } catch (err) {
            showToast('error', err.message || 'Failed to save. Try again.')
        } finally {
            setIsSubmitting(false)
        }
    }, [peopleList, selectedDate, statusMap, showToast])

    const summary = useMemo(() => {
        const counts = { Present: 0, Absent: 0, Late: 0, 'Half-Day': 0 }
        peopleList.forEach((p) => { const s = statusMap[String(p.id)] || 'Present'; counts[s] = (counts[s] || 0) + 1 })
        return counts
    }, [peopleList, statusMap])

    return (
        <motion.section key="teacher-att-mark" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
            className="min-h-screen bg-slate-50 text-slate-800">
            <div className="mx-auto max-w-5xl px-4 py-6 sm:px-8">

                {/* Header */}
                <header className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400">Attendance · Teachers</p>
                            <h1 className="text-xl font-bold text-slate-900">Teacher Attendance</h1>
                            <p className="mt-0.5 text-xs text-slate-500">
                                All teachers are <span className="font-semibold text-emerald-600">Present</span> by default.
                                Mark only <strong>Absent / Late / Half-Day</strong> — only exceptions are stored.
                            </p>
                        </div>
                        <button type="button" onClick={() => navigate(-1)}
                            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
                            ← Back
                        </button>
                    </div>
                </header>

                {/* Controls */}
                <div className="mb-4 flex flex-wrap items-center gap-3">
                    <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 shadow-sm">
                        <span className="text-xs font-semibold text-slate-600">📅 Date:</span>
                        <input type="date" value={selectedDate} max={toDateString(new Date())}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="text-xs text-slate-800 focus:outline-none" />
                    </label>
                    <input type="text" placeholder="Search by name, subject…" value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs shadow-sm focus:border-blue-400 focus:outline-none" />
                </div>

                {/* Summary bar */}
                <div className="mb-4 grid grid-cols-4 gap-2">
                    {Object.entries(summary).map(([s, count]) => (
                        <div key={s} className={`rounded-xl border p-3 text-center shadow-sm ${STATUS_STYLES[s]?.pill}`}>
                            <p className="text-xs font-semibold">{s}</p>
                            <p className="mt-0.5 text-xl font-bold">{count}</p>
                        </div>
                    ))}
                </div>

                {/* Toast */}
                <AnimatePresence>
                    {toast && (
                        <motion.div key="toast" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                            className={`mb-4 rounded-lg border px-4 py-2.5 text-sm font-medium ${toast.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-red-200 bg-red-50 text-red-800'}`}>
                            {toast.type === 'success' ? '✅ ' : '❌ '}{toast.msg}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* List */}
                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            {isLoading ? 'Loading…' : `${peopleList.length} Teacher(s)`}
                        </p>
                        <button type="button" onClick={markAllPresent}
                            className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 transition">
                            ✓ Mark All Present
                        </button>
                    </div>

                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
                            <span className="ml-2 text-sm text-slate-500">Loading…</span>
                        </div>
                    ) : peopleList.length === 0 ? (
                        <p className="py-12 text-center text-sm text-slate-500">
                            {searchText ? 'No results found.' : 'No teachers found. Add teachers first.'}
                        </p>
                    ) : (
                        <ul className="divide-y divide-slate-100">
                            {peopleList.map((person) => {
                                const cur = statusMap[String(person.id)] || 'Present'
                                return (
                                    <li key={person.id} className="flex flex-wrap items-center gap-3 px-4 py-3 hover:bg-slate-50 transition">
                                        {person.photo
                                            ? <img src={person.photo} alt={person.name} className="h-9 w-9 rounded-full object-cover border border-slate-200 shrink-0" />
                                            : <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-700 text-xs font-bold text-white">{getInitials(person.name)}</span>
                                        }
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-semibold text-slate-900 truncate">{person.name}</p>
                                            <p className="text-xs text-slate-500 truncate">{[person.designation, person.dept].filter(Boolean).join(' · ')}</p>
                                        </div>
                                        <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${STATUS_STYLES[cur]?.pill}`}>{cur}</span>
                                        <div className="flex gap-1.5 flex-wrap">
                                            {STATUS_OPTIONS.map((s) => (
                                                <button key={s} type="button" onClick={() => setStatus(person.id, s)}
                                                    className={`rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition ${cur === s
                                                        ? `${STATUS_STYLES[s]?.btn} ring-2 ring-offset-1 ring-current`
                                                        : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'}`}>
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

                {/* Submit bar */}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                    <p className="text-xs text-slate-500">
                        <span className="font-semibold text-slate-900">
                            {Object.values(statusMap).filter((s) => s !== 'Present').length}
                        </span> exception(s) will be saved.&nbsp;
                        <span className="text-slate-400">({summary.Present} Present — not stored)</span>
                    </p>
                    <button type="button" disabled={isSubmitting || isLoading} onClick={handleSubmit}
                        className="rounded-lg bg-indigo-700 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-800 disabled:opacity-50 transition">
                        {isSubmitting ? 'Saving…' : `Submit for ${selectedDate}`}
                    </button>
                </div>

            </div>
        </motion.section>
    )
}
