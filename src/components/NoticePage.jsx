import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { audienceOptions, classNames, noticeTypeOptions } from './dashboard/constants'
import { buildStudentsByClass } from './dashboard/utils'
import { subscribeRealtimeEvent } from '../services/realtime'

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

function NoticePage({ students = [], teachers = [], staff = [], intent = null, onBack, onBackToStudents, onBackToTeachers }) {
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
      className="min-h-screen bg-slate-100 text-slate-800"
    >
      <div className="mx-auto max-w-7xl px-5 py-6 sm:px-8">
        <header className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700">Head Notice Desk</p>
              <h1 className="text-2xl font-semibold text-slate-900">Send Notice</h1>
            </div>
            <div className="flex flex-wrap gap-2">
              {isStudentProfileTargeted ? (
                <button
                  type="button"
                  className="rounded-lg border border-cyan-300 bg-cyan-50 px-3 py-2 text-sm font-medium text-cyan-800 hover:bg-cyan-100"
                  onClick={() =>
                    onBackToStudents?.({
                      selectedClass: targetedStudent?.className || intent?.student?.className || '',
                      selectedStudentId: targetedStudent?.id || intent?.student?.id || '',
                    })
                  }
                >
                  Back to Class Students
                </button>
              ) : null}

              {isTeacherProfileTargeted ? (
                <button
                  type="button"
                  className="rounded-lg border border-cyan-300 bg-cyan-50 px-3 py-2 text-sm font-medium text-cyan-800 hover:bg-cyan-100"
                  onClick={() =>
                    onBackToTeachers?.({
                      selectedClass: targetedTeacher?.classTeacherName || intent?.teacher?.classTeacherName || '',
                      selectedTeacherId: targetedTeacher?.id || intent?.teacher?.id || '',
                    })
                  }
                >
                  Back to Class Teachers
                </button>
              ) : null}

              <button type="button" className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50" onClick={onBack}>
                Back to Dashboard
              </button>
            </div>
          </div>
        </header>

        <section className="erp-notice-shell">
          <article className="erp-notice-form-card">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm font-semibold text-slate-700">
                Notice Type
                <select className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm" value={noticeType} onChange={(event) => setNoticeType(event.target.value)}>
                  {activeNoticeTypeOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-sm font-semibold text-slate-700">
                Recipients
                <select
                  className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
                  value={audience}
                  onChange={(event) => {
                    setAudience(event.target.value)
                    setSelectedStudentId('')
                  }}
                  disabled={isProfileTargeted}
                >
                  {audienceOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>

              {audience === 'class_wise' && !isProfileTargeted ? (
                <label className="text-sm font-semibold text-slate-700">
                  Class
                  <select className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm" value={selectedClass} onChange={(event) => setSelectedClass(event.target.value)}>
                    <option value="">Select class</option>
                    {classNames.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}

              {(audience === 'students' || audience === 'class_wise') && !isProfileTargeted ? (
                <label className="text-sm font-semibold text-slate-700">
                  Student (Optional)
                  <select className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm" value={selectedStudentId} onChange={(event) => setSelectedStudentId(event.target.value)}>
                    <option value="">All Selected Students</option>
                    {classWiseStudents.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} ({item.className}-{item.section})
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
            </div>

            {isStudentProfileTargeted && targetedStudent ? (
              <p className="erp-notice-status">
                Targeted Notice Mode: recipient locked to {targetedStudent.fatherName} (Father of {targetedStudent.name}) on {targetedStudent.fatherContact}.
              </p>
            ) : null}

            {isTeacherProfileTargeted && targetedTeacher ? (
              <p className="erp-notice-status">
                Targeted Notice Mode: recipient locked to {targetedTeacher.name} ({targetedTeacher.contactNumber}).
              </p>
            ) : null}

            <label className="mt-3 block text-sm font-semibold text-slate-700">
              Subject
              <input className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm" value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="Enter notice subject" />
            </label>

            <label className="mt-3 block text-sm font-semibold text-slate-700">
              Notice Message
              <textarea
                rows={6}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Type notice message..."
              />
            </label>

            <div className="erp-notice-channels">
              <label>
                <input
                  type="checkbox"
                  checked={channels.whatsapp}
                  onChange={(event) => setChannels((previous) => ({ ...previous, whatsapp: event.target.checked }))}
                />
                WhatsApp
              </label>
              <label>
                <input type="checkbox" checked={channels.sms} onChange={(event) => setChannels((previous) => ({ ...previous, sms: event.target.checked }))} />
                SMS
              </label>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" className="erp-form-primary-button" onClick={handleSendNotice}>
                {editingNoticeId ? 'Update Notice' : 'Send Notice'}
              </button>
              {editingNoticeId ? (
                <button
                  type="button"
                  className="erp-nav-button"
                  onClick={() => {
                    setEditingNoticeId('')
                    setStatusMessage('Notice edit cancelled.')
                  }}
                >
                  Cancel Edit
                </button>
              ) : null}
              <button type="button" className="erp-nav-button" onClick={handlePreviewDispatch}>
                Preview Dispatch
              </button>
            </div>

            {statusMessage ? <p className="erp-notice-status">{statusMessage}</p> : null}
          </article>

          <article className="erp-notice-preview-card">
            <p className="erp-notice-preview-count">
              Recipient Preview: {recipients.length} | Channel: {channelText}
            </p>
            <div className="erp-notice-recipient-list">
              {recipients.length ? (
                recipients.map((item) => (
                  <article key={item.key} className="erp-notice-recipient-item">
                    <p>{item.name}</p>
                    <small>
                      {item.extra} | {item.phone} | {item.channelLabel}
                    </small>
                  </article>
                ))
              ) : (
                <p className="erp-student-meta">No recipients available for current selection.</p>
              )}
            </div>

            <p className="erp-notice-preview-count">Notice History</p>
            <div className="erp-notice-history-list">
              {history.length ? (
                history.map((item) => (
                  <article key={item.id} className="erp-notice-history-item">
                    <p>{item.subject}</p>
                    <small>
                      {item.id} | Type: {item.type} | To: {item.recipientLabel} | Audience: {item.audience} | Sent: {item.count} | {item.channels} | {item.timestamp}
                    </small>
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        type="button"
                        className="rounded-lg border border-cyan-300 bg-cyan-50 px-3 py-1.5 text-xs font-semibold text-cyan-800 hover:bg-cyan-100"
                        onClick={() => handleEditHistory(item)}
                      >
                        Edit Notice
                      </button>
                      {editingNoticeId === item.id ? <span className="text-xs font-semibold text-amber-700">Editing now</span> : null}
                    </div>
                  </article>
                ))
              ) : (
                <p className="erp-student-meta">No notices sent in this session. Send one notice first, then the Edit Notice button will appear here.</p>
              )}
            </div>
          </article>
        </section>

        {showPreview ? (
          <div className="erp-student-modal-overlay" role="dialog" aria-modal="true">
            <article className="erp-student-modal">
              <button type="button" className="erp-modal-close" onClick={() => setShowPreview(false)}>
                Close
              </button>
              <div className="erp-modal-header">
                <div className="erp-modal-photo">NT</div>
                <div>
                  <h2 className="erp-modal-name">Dispatch Preview</h2>
                  <p className="erp-modal-subtitle">
                    Type: {noticeType} | Audience: {audience} | Channel: {channelText}
                  </p>
                </div>
              </div>

              <div className="erp-modal-grid">
                <article className="erp-modal-card">
                  <h3 className="erp-modal-card-title">Notice Content</h3>
                  <p>
                    <strong>Subject:</strong> {subject}
                  </p>
                  <p>
                    <strong>Message:</strong> {message}
                  </p>
                </article>

                <article className="erp-modal-card">
                  <h3 className="erp-modal-card-title">Recipients ({recipients.length})</h3>
                  {recipients.slice(0, 12).map((item) => (
                    <p key={`preview-${item.key}`}>
                      <strong>{item.name}</strong> | {item.phone}
                    </p>
                  ))}
                  {recipients.length > 12 ? <p>+{recipients.length - 12} more recipients</p> : null}
                </article>
              </div>
            </article>
          </div>
        ) : null}
      </div>
    </motion.section>
  )
}

export default NoticePage
