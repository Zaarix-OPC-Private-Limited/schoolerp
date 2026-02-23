import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate, useLocation } from 'react-router-dom'
import { audienceOptions, classNames, noticeTypeOptions } from '../components/dashboard/constants'
import { buildStudentsByClass } from '../components/dashboard/utils'
import { subscribeRealtimeEvent } from '../services/realtime'
import { useAppContext } from '../context/AppContext'

const teacherNoticeTypeOptions = [
  { value: 'performance', label: 'Performance Notice' },
  { value: 'classroom', label: 'Classroom Management' },
  { value: 'compliance', label: 'Policy / Compliance' },
  { value: 'meeting', label: 'Meeting / Briefing' },
  { value: 'appreciation', label: 'Appreciation Notice' },
  { value: 'warning', label: 'Warning / Show Cause' },
]

const normalizeStudent = (student, index) => ({
  id: student.id || `STD-${String(index + 1).padStart(3, '0')}`,
  name: student.name || 'Student',
  className: student.className || 'N/A',
  section: student.section || 'A',
  rollNumber: student.rollNumber || String(index + 1).padStart(2, '0'),
  fatherName: student.fatherName || 'Parent',
  fatherContact: student.fatherContact || student.contactNumber || 'N/A',
  contactNumber: student.contactNumber || 'N/A',
})

const normalizeTeacher = (teacher, index) => ({
  id: teacher.id || `T-${String(index + 1).padStart(3, '0')}`,
  name: teacher.name || 'Teacher',
  classTeacherName: teacher.classTeacherName || 'N/A',
  classTeacherSection: teacher.classTeacherSection || 'A',
  contactNumber: teacher.contactNumber || 'N/A',
})

const normalizeStaff = (item, index) => ({
  id: item.id || `S-${String(index + 1).padStart(3, '0')}`,
  name: item.name || 'Staff',
  contactNumber: item.contactNumber || 'N/A',
})

function NoticePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { studentRecords: students = [], teacherRecords: teachers = [], staffRecords: staff = [], noticeIntent: intent, setNoticeIntent } = useAppContext()
  const [noticeType, setNoticeType] = useState('general')
  const [audience, setAudience] = useState('all_school')
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [channels, setChannels] = useState({ whatsapp: true, sms: true })
  const [statusMessage, setStatusMessage] = useState('')
  const [history, setHistory] = useState([])
  const [showPreview, setShowPreview] = useState(false)
  const [editingNoticeId, setEditingNoticeId] = useState('')

  const studentRecords = useMemo(() => {
    if (students.length) return students.map(normalizeStudent)
    const seededByClass = buildStudentsByClass([], {})
    return Object.values(seededByClass)
      .flat()
      .map(normalizeStudent)
  }, [students])

  const teacherRecords = useMemo(() => teachers.map(normalizeTeacher), [teachers])
  const staffRecords = useMemo(() => staff.map(normalizeStaff), [staff])

  const isStudentProfileTargeted = Boolean(intent?.source === 'student-profile' && intent?.student)
  const isTeacherProfileTargeted = Boolean(intent?.source === 'teacher-profile' && intent?.teacher)
  const isProfileTargeted = isStudentProfileTargeted || isTeacherProfileTargeted

  const targetedStudent = useMemo(() => {
    if (!isStudentProfileTargeted) return null
    const intentStudentId = intent?.student?.id
    const found = studentRecords.find((item) => item.id === intentStudentId)
    if (found) return found
    return normalizeStudent(intent.student, 0)
  }, [intent, isStudentProfileTargeted, studentRecords])

  const targetedTeacher = useMemo(() => {
    if (!isTeacherProfileTargeted) return null
    const intentTeacherId = intent?.teacher?.id
    const found = teacherRecords.find((item) => item.id === intentTeacherId)
    if (found) return found
    return normalizeTeacher(intent.teacher, 0)
  }, [intent, isTeacherProfileTargeted, teacherRecords])

  useEffect(() => {
    if (isStudentProfileTargeted && intent?.student) {
      setAudience('students')
      setSelectedClass(intent.student.className || '')
      setSelectedStudentId(intent.student.id || '')
      setNoticeType(intent.student.feeStatus === 'Pending' ? 'fee' : 'complaint')
      setSubject(`Notice for ${intent.student.name}`)
      setMessage(`Dear Parent, this is regarding ${intent.student.name} (${intent.student.className}-${intent.student.section}).`)
      setChannels({ whatsapp: true, sms: true })
      setStatusMessage('')
      return
    }

    if (isTeacherProfileTargeted && intent?.teacher) {
      setAudience('teachers')
      setSelectedClass(intent.teacher.classTeacherName || '')
      setSelectedStudentId('')
      setNoticeType('performance')
      setSubject(`Notice for ${intent.teacher.name}`)
      setMessage(`Dear ${intent.teacher.name}, this notice is regarding class ${intent.teacher.classTeacherName || 'N/A'} duties.`)
      setChannels({ whatsapp: true, sms: true })
      setStatusMessage('')
    }
  }, [intent, isStudentProfileTargeted, isTeacherProfileTargeted])

  const activeNoticeTypeOptions = useMemo(() => {
    if (isTeacherProfileTargeted || audience === 'teachers') return teacherNoticeTypeOptions
    return noticeTypeOptions
  }, [audience, isTeacherProfileTargeted])

  useEffect(() => {
    const exists = activeNoticeTypeOptions.some((item) => item.value === noticeType)
    if (exists) return
    setNoticeType(activeNoticeTypeOptions[0]?.value || 'general')
  }, [activeNoticeTypeOptions, noticeType])

  const classWiseStudents = useMemo(() => {
    if (!selectedClass) return studentRecords
    return studentRecords.filter((item) => item.className === selectedClass)
  }, [selectedClass, studentRecords])

  const recipients = useMemo(() => {
    if (isStudentProfileTargeted && targetedStudent) {
      return [
        {
          key: `student-${targetedStudent.id}`,
          name: `${targetedStudent.fatherName} (Father of ${targetedStudent.name})`,
          phone: targetedStudent.fatherContact,
          extra: `${targetedStudent.className}-${targetedStudent.section} | Roll: ${targetedStudent.rollNumber}`,
          channelLabel: 'WhatsApp + SMS to father',
        },
      ]
    }

    if (isTeacherProfileTargeted && targetedTeacher) {
      return [
        {
          key: `teacher-${targetedTeacher.id}`,
          name: targetedTeacher.name,
          phone: targetedTeacher.contactNumber,
          extra: `Class Teacher: ${targetedTeacher.classTeacherName}-${targetedTeacher.classTeacherSection}`,
          channelLabel: 'WhatsApp + SMS',
        },
      ]
    }

    const studentRecipients =
      audience === 'class_wise'
        ? classWiseStudents
        : audience === 'students' || audience === 'all_school'
          ? studentRecords
          : []

    const filteredStudents = selectedStudentId ? studentRecipients.filter((item) => item.id === selectedStudentId) : studentRecipients
    const studentRows = filteredStudents.map((item) => ({
      key: `student-${item.id}`,
      name: `${item.name} (${item.className}-${item.section})`,
      phone: item.fatherContact,
      extra: `Father: ${item.fatherName} | Roll: ${item.rollNumber}`,
      channelLabel: 'WhatsApp + SMS to father',
    }))

    const teacherRows =
      audience === 'teachers' || audience === 'all_school'
        ? teacherRecords.map((item) => ({
          key: `teacher-${item.id}`,
          name: item.name,
          phone: item.contactNumber,
          extra: `Class Teacher: ${item.classTeacherName}-${item.classTeacherSection}`,
          channelLabel: 'WhatsApp + SMS',
        }))
        : []

    const staffRows =
      audience === 'staff' || audience === 'all_school'
        ? staffRecords.map((item) => ({
          key: `staff-${item.id}`,
          name: item.name,
          phone: item.contactNumber,
          extra: 'Staff',
          channelLabel: 'WhatsApp + SMS',
        }))
        : []

    return [...studentRows, ...teacherRows, ...staffRows]
  }, [audience, classWiseStudents, isStudentProfileTargeted, isTeacherProfileTargeted, selectedStudentId, staffRecords, studentRecords, targetedStudent, targetedTeacher, teacherRecords])

  const channelText = useMemo(() => {
    if (channels.whatsapp && channels.sms) return 'WhatsApp + SMS'
    if (channels.whatsapp) return 'WhatsApp'
    if (channels.sms) return 'SMS'
    return 'No channel selected'
  }, [channels])

  const handleSendNotice = () => {
    if (!subject.trim() || !message.trim()) {
      setStatusMessage('Please enter notice subject and message.')
      return
    }
    if (!channels.whatsapp && !channels.sms) {
      setStatusMessage('Please choose at least one channel (WhatsApp or SMS).')
      return
    }
    if (!recipients.length) {
      setStatusMessage('No recipients found for selected audience.')
      return
    }
    const recipientPhones = recipients.map((item) => item.phone).filter(Boolean)
    const recipientLabel = recipients.slice(0, 4).map((item) => item.name).join(', ')
    const timestamp = new Date().toLocaleString('en-IN')
    const payload = {
      id: editingNoticeId || `NTC-${Date.now()}`,
      type: noticeType,
      audience,
      subject: subject.trim(),
      message: message.trim(),
      count: recipients.length,
      recipientLabel,
      channels: channelText,
      timestamp,
      selectedClass,
      selectedStudentId,
      rawChannels: { ...channels },
    }

    if (editingNoticeId) {
      setHistory((previous) => previous.map((item) => (item.id === editingNoticeId ? { ...item, ...payload } : item)))
      setStatusMessage(`Notice updated for ${recipients.length} recipients via ${channelText}.`)
      setEditingNoticeId('')
      return
    }

    setHistory((previous) => [payload, ...previous])
    setStatusMessage(`Notice sent to ${recipients.length} recipients via ${channelText}. Primary contacts: ${recipientPhones.slice(0, 4).join(', ')}${recipientPhones.length > 4 ? '...' : ''}`)
  }

  const handleEditHistory = (item) => {
    setEditingNoticeId(item.id)
    setNoticeType(item.type || 'general')
    setAudience(item.audience || 'all_school')
    setSubject(item.subject || '')
    setMessage(item.message || '')
    setSelectedClass(item.selectedClass || '')
    setSelectedStudentId(item.selectedStudentId || '')
    setChannels(
      item.rawChannels && typeof item.rawChannels === 'object'
        ? { whatsapp: Boolean(item.rawChannels.whatsapp), sms: Boolean(item.rawChannels.sms) }
        : {
          whatsapp: String(item.channels || '').toLowerCase().includes('whatsapp'),
          sms: String(item.channels || '').toLowerCase().includes('sms'),
        },
    )
    setStatusMessage(`Editing notice ${item.id}. Update and click "Update Notice".`)
  }

  const handlePreviewDispatch = () => {
    if (!subject.trim() || !message.trim()) {
      setStatusMessage('Please enter notice subject and message before preview.')
      return
    }
    if (!channels.whatsapp && !channels.sms) {
      setStatusMessage('Please choose at least one channel (WhatsApp or SMS).')
      return
    }
    if (!recipients.length) {
      setStatusMessage('No recipients found for selected audience.')
      return
    }
    setStatusMessage('')
    setShowPreview(true)
  }

  useEffect(() => {
    const unsubscribeNotice = subscribeRealtimeEvent('notice-sent', (payload) => {
      const recipientsPayload = payload?.recipients
      const recipientsList = Array.isArray(recipientsPayload) ? recipientsPayload : []
      const recipientLabel = payload?.recipientLabel || recipientsList.slice(0, 4).map((item) => item.name || item.phone).filter(Boolean).join(', ')
      const timestamp = payload?.timestamp || new Date().toLocaleString('en-IN')

      setHistory((previous) => [
        {
          id: payload?.id || `NTC-RT-${Date.now()}`,
          type: payload?.type || payload?.noticeType || 'general',
          audience: payload?.audience || 'all_school',
          subject: payload?.subject || 'Realtime Notice',
          count: payload?.count || recipientsList.length || 1,
          recipientLabel: recipientLabel || 'N/A',
          channels: payload?.channels || payload?.channel || 'WhatsApp + SMS',
          timestamp,
        },
        ...previous,
      ])
      setStatusMessage('Realtime notice dispatch received.')
    })

    return () => {
      unsubscribeNotice()
    }
  }, [])

  return (
    <motion.section
      key="notice-page"
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
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400">Head Notice Desk</p>
              <h1 className="text-xl font-bold text-slate-900">Send Notice</h1>
            </div>
            <div className="flex flex-wrap gap-2">
              {isStudentProfileTargeted && (
                <button type="button" className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-800 hover:bg-blue-100 transition" onClick={() => navigate('/students', { state: { selectedClass: targetedStudent?.className || intent?.student?.className || '', selectedStudentId: targetedStudent?.id || intent?.student?.id || '' } })}>
                  Back to Class Students
                </button>
              )}
              {isTeacherProfileTargeted && (
                <button type="button" className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-800 hover:bg-blue-100 transition" onClick={() => navigate('/teachers', { state: { selectedClass: targetedTeacher?.classTeacherName || intent?.teacher?.classTeacherName || '', selectedTeacherId: targetedTeacher?.id || intent?.teacher?.id || '' } })}>
                  Back to Class Teachers
                </button>
              )}
              <button type="button" className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition" onClick={() => navigate('/dashboard')}>
                Back to Dashboard
              </button>
            </div>
          </div>
        </header>

        {/* Workspace */}
        <div className="flex flex-col lg:flex-row gap-5">
          {/* Main Form */}
          <article className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-800">Compose Notice</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-slate-600">Notice Type</span>
                <select className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100" value={noticeType} onChange={(e) => setNoticeType(e.target.value)}>
                  {activeNoticeTypeOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-slate-600">Recipients</span>
                <select className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:opacity-50" value={audience} onChange={(e) => { setAudience(e.target.value); setSelectedStudentId('') }} disabled={isProfileTargeted}>
                  {audienceOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
              </label>

              {(audience === 'class_wise' && !isProfileTargeted) && (
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-slate-600">Class</span>
                  <select className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100" value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
                    <option value="">Select class</option>
                    {classNames.map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>
                </label>
              )}

              {((audience === 'students' || audience === 'class_wise') && !isProfileTargeted) && (
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-slate-600">Student (Optional)</span>
                  <select className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100" value={selectedStudentId} onChange={(e) => setSelectedStudentId(e.target.value)}>
                    <option value="">All Selected Students</option>
                    {classWiseStudents.map((item) => <option key={item.id} value={item.id}>{item.name} ({item.className}-{item.section})</option>)}
                  </select>
                </label>
              )}
            </div>

            {(isStudentProfileTargeted && targetedStudent) && (
              <p className="mt-4 rounded-lg bg-blue-50 px-3 py-2 text-xs font-medium text-blue-800 border border-blue-200">
                Targeted Notice Mode: recipient locked to {targetedStudent.fatherName} (Father of {targetedStudent.name}) on {targetedStudent.fatherContact}.
              </p>
            )}

            {(isTeacherProfileTargeted && targetedTeacher) && (
              <p className="mt-4 rounded-lg bg-blue-50 px-3 py-2 text-xs font-medium text-blue-800 border border-blue-200">
                Targeted Notice Mode: recipient locked to {targetedTeacher.name} ({targetedTeacher.contactNumber}).
              </p>
            )}

            <label className="mt-4 flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-slate-600">Subject</span>
              <input type="text" className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Enter notice subject" />
            </label>

            <label className="mt-4 flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-slate-600">Notice Message</span>
              <textarea rows={6} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 resize-y" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Type notice message..." />
            </label>

            <div className="mt-4 flex flex-wrap gap-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <span className="text-xs font-semibold text-slate-600 w-full mb-1">Dispatch Channels</span>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-800 cursor-pointer">
                <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" checked={channels.whatsapp} onChange={(e) => setChannels((p) => ({ ...p, whatsapp: e.target.checked }))} />
                WhatsApp
              </label>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-800 cursor-pointer">
                <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" checked={channels.sms} onChange={(e) => setChannels((p) => ({ ...p, sms: e.target.checked }))} />
                SMS
              </label>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button type="button" className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition" onClick={handleSendNotice}>
                {editingNoticeId ? 'Update Notice' : 'Send Notice'}
              </button>
              {editingNoticeId && (
                <button type="button" className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition" onClick={() => { setEditingNoticeId(''); setStatusMessage('Notice edit cancelled.') }}>
                  Cancel Edit
                </button>
              )}
              <button type="button" className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition" onClick={handlePreviewDispatch}>
                Preview Dispatch
              </button>
            </div>

            {statusMessage && <p className="mt-4 rounded-lg bg-green-50 px-4 py-3 text-sm font-medium text-green-800 border border-green-200">{statusMessage}</p>}
          </article>

          {/* Right Sidebar — Preview & History */}
          <aside className="w-full lg:w-80 shrink-0 flex flex-col gap-4">
            {/* Live Recipient Preview */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-wide text-slate-500 border-b border-slate-100 pb-2">
                Recipient Preview: <span className="text-blue-600">{recipients.length}</span> | {channelText}
              </p>
              <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                {recipients.length > 0 ? recipients.map((item) => (
                  <article key={item.key} className="rounded-lg bg-slate-50 p-2.5 border border-slate-100">
                    <p className="text-xs font-bold text-slate-900 truncate">{item.name}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5 truncate">{item.extra}</p>
                    <p className="text-[10px] font-medium text-slate-700 mt-1">{item.phone} • {item.channelLabel}</p>
                  </article>
                )) : <p className="text-xs text-slate-500 italic">No recipients available.</p>}
              </div>
            </div>

            {/* Notice History */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col flex-1">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-wide text-slate-500 border-b border-slate-100 pb-2">
                Session Notice History
              </p>
              <div className="max-h-80 overflow-y-auto space-y-3 pr-1">
                {history.length > 0 ? history.map((item) => (
                  <article key={item.id} className="rounded-xl border border-slate-200 p-3 bg-white">
                    <p className="text-xs font-bold text-slate-900 mb-1">{item.subject}</p>
                    <div className="space-y-0.5 mb-2">
                      <p className="text-[10px] text-slate-500"><span className="font-semibold">Type:</span> {item.type} | <span className="font-semibold">Audience:</span> {item.audience}</p>
                      <p className="text-[10px] text-slate-500"><span className="font-semibold">To:</span> {item.recipientLabel} ({item.count})</p>
                      <p className="text-[10px] text-slate-500"><span className="font-semibold">Via:</span> {item.channels}</p>
                      <p className="text-[9px] text-slate-400 mt-1">{item.timestamp} • {item.id}</p>
                    </div>
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                      <button type="button" className="rounded-lg bg-slate-100 px-3 py-1.5 text-[10px] font-semibold text-slate-700 hover:bg-slate-200 transition" onClick={() => handleEditHistory(item)}>
                        Edit Content
                      </button>
                      {editingNoticeId === item.id && <span className="text-[10px] font-bold text-blue-600 animate-pulse">Editing...</span>}
                    </div>
                  </article>
                )) : <p className="text-xs text-slate-500 italic">No notices sent in this session.</p>}
              </div>
            </div>
          </aside>
        </div>

        {/* Modal Overlay for Preview */}
        {showPreview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-sm font-bold text-white shadow-inner">
                    NT
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Dispatch Preview</h2>
                    <p className="text-xs text-slate-500">Type: {noticeType} | Audience: {audience} | Channel: {channelText}</p>
                  </div>
                </div>
                <button type="button" className="rounded-full p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition" onClick={() => setShowPreview(false)}>
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <article className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                    <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500 border-b border-slate-200 pb-2">Notice Content</h3>
                    <p className="mb-2 text-sm text-slate-800"><strong className="text-slate-900">Subject:</strong> {subject}</p>
                    <div className="rounded-lg bg-white p-3 border border-slate-200 mt-2">
                      <p className="text-sm text-slate-700 whitespace-pre-wrap">{message}</p>
                    </div>
                  </article>

                  <article className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                    <h3 className="mb-3 flex items-center justify-between text-xs font-bold uppercase tracking-wide text-slate-500 border-b border-slate-200 pb-2">
                      <span>Recipients</span>
                      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-blue-800">{recipients.length}</span>
                    </h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                      {recipients.slice(0, 12).map((item) => (
                        <div key={`preview-${item.key}`} className="rounded bg-white p-2 text-xs border border-slate-200">
                          <strong className="block text-slate-900">{item.name}</strong>
                          <span className="text-slate-500">{item.phone}</span>
                        </div>
                      ))}
                      {recipients.length > 12 && (
                        <p className="text-center text-xs font-medium text-slate-500 pt-2 border-t border-slate-200">
                          +{recipients.length - 12} more recipients
                        </p>
                      )}
                    </div>
                  </article>
                </div>
              </div>
              <div className="border-t border-slate-200 bg-slate-50 px-6 py-4 flex justify-end gap-3">
                <button type="button" className="rounded-lg border border-slate-300 bg-white px-5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 transition" onClick={() => setShowPreview(false)}>Cancel</button>
                <button type="button" className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-bold text-white hover:bg-blue-700 transition" onClick={() => { setShowPreview(false); handleSendNotice() }}>Confirm & Send</button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </motion.section>
  )
}

export default NoticePage
