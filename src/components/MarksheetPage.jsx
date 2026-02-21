import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import CustomSelect from './CustomSelect'

const marksheetClassOrder = ['Nursery', 'LKG', 'UKG', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th']
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

const examTypeOptions = [
  { value: 'annual_exam', label: 'Annual Examination' },
  { value: 'half_yearly', label: 'Half Yearly Examination' },
  { value: 'unit_test_1', label: 'Unit Test 1' },
  { value: 'unit_test_2', label: 'Unit Test 2' },
]

const subjectsByClass = {
  Nursery: ['English', 'Mathematics', 'Rhymes', 'Drawing'],
  LKG: ['English', 'Mathematics', 'EVS', 'Rhymes'],
  UKG: ['English', 'Mathematics', 'Hindi', 'EVS'],
  default: ['English', 'Hindi', 'Mathematics', 'Science', 'Social Science', 'Computer'],
}

const seedStudents = [
  { id: 'STD-001', admissionNumber: 'ADM-1001', name: 'Aarav Sharma', className: '10th', section: 'A', rollNumber: '01', dob: '2010-06-14', classTeacherName: 'Shikha Rawat' },
  { id: 'STD-002', admissionNumber: 'ADM-1002', name: 'Diya Singh', className: '10th', section: 'A', rollNumber: '02', dob: '2010-10-05', classTeacherName: 'Shikha Rawat' },
  { id: 'STD-003', admissionNumber: 'ADM-1003', name: 'Reyansh Patel', className: '10th', section: 'A', rollNumber: '03', dob: '2010-02-11', classTeacherName: 'Shikha Rawat' },
  { id: 'STD-004', admissionNumber: 'ADM-2001', name: 'Anaya Gupta', className: '9th', section: 'B', rollNumber: '04', dob: '2011-03-25', classTeacherName: 'Priya Sharma' },
  { id: 'STD-005', admissionNumber: 'ADM-2002', name: 'Vihaan Mehta', className: '9th', section: 'B', rollNumber: '05', dob: '2011-01-09', classTeacherName: 'Priya Sharma' },
]

const normalizeStudent = (student, index) => ({
  id: student.id || `STD-${String(index + 1).padStart(3, '0')}`,
  admissionNumber: student.admissionNumber || student.admissionNo || 'N/A',
  name: student.name || 'Student',
  fatherName: student.fatherName || 'N/A',
  fatherContact: student.fatherContact || student.contactNumber || '',
  className: student.className || 'N/A',
  section: student.section || 'A',
  rollNumber: student.rollNumber || String(index + 1).padStart(2, '0'),
  dob: student.dob || 'N/A',
  classTeacherName: student.classTeacherName || 'Class Teacher',
})

const formatDateDisplay = (isoDate) => {
  if (!isoDate) return 'N/A'
  const date = new Date(isoDate)
  if (Number.isNaN(date.getTime())) return 'N/A'
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  const yyyy = date.getFullYear()
  return `${mm}/${dd}/${yyyy}`
}

const toNumber = (value) => {
  const parsed = Number.parseFloat(String(value ?? '0'))
  if (Number.isNaN(parsed)) return 0
  return parsed
}

const gradeFromPercent = (percent) => {
  if (percent >= 91) return 'A1'
  if (percent >= 81) return 'A2'
  if (percent >= 71) return 'B1'
  if (percent >= 61) return 'B2'
  if (percent >= 51) return 'C1'
  if (percent >= 41) return 'C2'
  if (percent >= 33) return 'D'
  return 'E'
}

const safeHtml = (text) =>
  String(text ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')

const buildPrintHtml = ({
  schoolName,
  session,
  examLabel,
  student,
  selectedClass,
  fatherName,
  issueDate,
  classTeacherName,
  principalName,
  subjects,
  totalObtained,
  totalMax,
  percentage,
  grade,
  result,
}) => {
  const rows = subjects
    .map(
      (subject) =>
        `<tr>
          <td>${safeHtml(subject.subject)}</td>
          <td>${safeHtml(subject.maxMarks)}</td>
          <td>${safeHtml(subject.obtained)}</td>
        </tr>`,
    )
    .join('')

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Marksheet</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 24px; color: #0f172a; }
    .sheet { border: 1px solid #cbd5e1; border-radius: 10px; padding: 18px; }
    .head { text-align: center; margin-bottom: 12px; }
    .head h2 { margin: 0; font-size: 30px; }
    .head p { margin: 4px 0 0; color: #475569; }
    .line { border-top: 1px solid #cbd5e1; margin: 14px 0; }
    .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px; }
    .meta p { margin: 4px 0; font-size: 14px; }
    table { width: 100%; border-collapse: collapse; margin-top: 6px; }
    th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: left; font-size: 14px; }
    th { background: #f8fafc; }
    .summary { margin-top: 14px; line-height: 1.7; font-size: 18px; }
    .foot { margin-top: 18px; display: flex; justify-content: space-between; font-size: 14px; }
    .signatures { margin-top: 30px; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 18px; }
    .sign-box { text-align: center; }
    .sign-line { border-top: 1px solid #334155; margin-bottom: 8px; height: 16px; }
    .sign-label { font-size: 13px; font-weight: 700; letter-spacing: 0.03em; }
  </style>
</head>
<body>
  <section class="sheet">
    <div class="head">
      <h2>${safeHtml(schoolName)}</h2>
      <h3 style="margin:6px 0 0; font-size: 32px;">Annual Academic Report Card</h3>
      <p>Session: ${safeHtml(session)}</p>
    </div>
    <div class="line"></div>
    <div class="meta">
      <div>
        <p><strong>Student Name:</strong> ${safeHtml(student?.name || 'N/A')}</p>
        <p><strong>Father Name:</strong> ${safeHtml(fatherName || student?.fatherName || 'N/A')}</p>
        <p><strong>Class/Section:</strong> ${safeHtml(student ? `${student.className}-${student.section}` : selectedClass)}</p>
        <p><strong>Roll Number:</strong> ${safeHtml(student?.rollNumber || 'N/A')}</p>
      </div>
      <div>
        <p><strong>Admission No:</strong> ${safeHtml(student?.admissionNumber || 'N/A')}</p>
        <p><strong>Date of Birth:</strong> ${safeHtml(student?.dob || 'N/A')}</p>
        <p><strong>Exam:</strong> ${safeHtml(examLabel)}</p>
      </div>
    </div>
    <table>
      <thead>
        <tr><th>Subject</th><th>Max Marks</th><th>Obtained</th></tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="summary">
      <div><strong>Total Marks:</strong> ${safeHtml(totalObtained)} / ${safeHtml(totalMax)}</div>
      <div><strong>Percentage:</strong> ${safeHtml(percentage)}%</div>
      <div><strong>Grade:</strong> ${safeHtml(grade)}</div>
      <div><strong>Result:</strong> ${safeHtml(result)}</div>
    </div>
    <div class="foot">
      <div><strong>Issue Date:</strong> ${safeHtml(formatDateDisplay(issueDate))}</div>
      <div><strong>Class Teacher:</strong> ${safeHtml(classTeacherName)}</div>
      <div><strong>Principal:</strong> ${safeHtml(principalName)}</div>
    </div>
    <div class="signatures">
      <div class="sign-box">
        <div class="sign-line"></div>
        <div class="sign-label">Class Teacher Signature</div>
      </div>
      <div class="sign-box">
        <div class="sign-line"></div>
        <div class="sign-label">Principal Signature</div>
      </div>
      <div class="sign-box">
        <div class="sign-line"></div>
        <div class="sign-label">Parent Signature</div>
      </div>
    </div>
  </section>
  <script>window.onload = function () { window.print(); };</script>
</body>
</html>`
}

function MarksheetPage({ students = [], onBack, preselectedStudent = null, onOpenStudentsByClass }) {
  const allStudents = useMemo(() => {
    const source = students.length ? students : seedStudents
    const normalized = source.map(normalizeStudent)

    if (preselectedStudent) {
      const normalizedIntent = normalizeStudent(preselectedStudent, 999)
      const alreadyExists = normalized.some((item) => item.id === normalizedIntent.id)
      if (!alreadyExists) normalized.push(normalizedIntent)
    }

    return normalized
  }, [students, preselectedStudent])

  const classList = marksheetClassOrder

  const [schoolName, setSchoolName] = useState('School ERP')
  const [session, setSession] = useState('2025-26')
  const [selectedClass, setSelectedClass] = useState('10th')
  const [selectedExamType, setSelectedExamType] = useState('annual_exam')
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [issueDate, setIssueDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [fatherName, setFatherName] = useState('N/A')
  const [classTeacherName, setClassTeacherName] = useState('Class Teacher')
  const [principalName, setPrincipalName] = useState('Principal')
  const [actionStatus, setActionStatus] = useState('')

  const [subjects, setSubjects] = useState(() =>
    (subjectsByClass['10th'] || subjectsByClass.default).map((subject) => ({
      subject,
      maxMarks: 100,
      obtained: 0,
    })),
  )

  const classStudents = useMemo(
    () => allStudents.filter((item) => item.className === selectedClass),
    [allStudents, selectedClass],
  )

  useEffect(() => {
    if (!classStudents.length) {
      setSelectedStudentId('')
      return
    }

    if (!selectedStudentId || !classStudents.some((item) => item.id === selectedStudentId)) {
      setSelectedStudentId(classStudents[0].id)
    }
  }, [classStudents, selectedStudentId])

  const selectedStudent = useMemo(
    () => classStudents.find((item) => item.id === selectedStudentId) || null,
    [classStudents, selectedStudentId],
  )

  useEffect(() => {
    if (!preselectedStudent) return
    const normalizedIntent = normalizeStudent(preselectedStudent, 999)
    setSelectedClass(normalizedIntent.className || '10th')
    setSelectedStudentId(normalizedIntent.id || '')
  }, [preselectedStudent])

  useEffect(() => {
    const list = subjectsByClass[selectedClass] || subjectsByClass.default
    setSubjects(
      list.map((subject) => ({
        subject,
        maxMarks: 100,
        obtained: 0,
      })),
    )
  }, [selectedClass])

  useEffect(() => {
    if (!selectedStudent) {
      setFatherName('N/A')
      return
    }
    setFatherName(selectedStudent.fatherName || 'N/A')
    if (selectedStudent.classTeacherName) {
      setClassTeacherName(selectedStudent.classTeacherName)
    }
  }, [selectedStudent])

  const classOptions = classList.map((item) => ({ value: item, label: classLabelMap[item] || item }))
  const totalMax = useMemo(
    () => subjects.reduce((sum, item) => sum + toNumber(item.maxMarks), 0),
    [subjects],
  )

  const totalObtained = useMemo(
    () => subjects.reduce((sum, item) => sum + toNumber(item.obtained), 0),
    [subjects],
  )

  const percentage = useMemo(
    () => (totalMax ? Number(((totalObtained / totalMax) * 100).toFixed(2)) : 0),
    [totalMax, totalObtained],
  )

  const grade = useMemo(() => gradeFromPercent(percentage), [percentage])

  const result = useMemo(() => {
    const failedAny = subjects.some((item) => {
      const max = toNumber(item.maxMarks)
      const obtained = toNumber(item.obtained)
      if (!max) return false
      return obtained < max * 0.33
    })

    if (totalMax === 0) return 'Fail'
    if (failedAny) return 'Fail'
    return percentage >= 33 ? 'Pass' : 'Fail'
  }, [subjects, totalMax, percentage])

  const examLabel = examTypeOptions.find((item) => item.value === selectedExamType)?.label || 'Annual Examination'

  const handleObtainedChange = (index, nextValue) => {
    setSubjects((previous) =>
      previous.map((item, itemIndex) => {
        if (itemIndex !== index) return item
        const parsed = Number.parseFloat(nextValue)
        const max = toNumber(item.maxMarks)
        if (Number.isNaN(parsed)) return { ...item, obtained: 0 }
        const bounded = Math.max(0, Math.min(parsed, max))
        return { ...item, obtained: bounded }
      }),
    )
  }

  const handlePrintMarksheet = () => {
    const html = buildPrintHtml({
      schoolName,
      session,
      examLabel,
      student: selectedStudent,
      selectedClass,
      fatherName,
      issueDate,
      classTeacherName,
      principalName,
      subjects,
      totalObtained,
      totalMax,
      percentage,
      grade,
      result,
    })

    const popup = window.open('', '_blank', 'noopener,noreferrer,width=1080,height=760')
    if (!popup) return
    popup.document.open()
    popup.document.write(html)
    popup.document.close()
  }

  const handleSendToParent = () => {
    if (!selectedStudent) {
      setActionStatus('Please select a student before sending the marksheet.')
      return
    }

    const rawPhone = String(selectedStudent.fatherContact || '').replace(/\D/g, '')
    if (!rawPhone) {
      setActionStatus('Parent WhatsApp number is not available for this student.')
      return
    }

    const phone = rawPhone.length === 10 ? `91${rawPhone}` : rawPhone
    const marksheetSummary = [
      `School: ${schoolName}`,
      `Session: ${session}`,
      `Student: ${selectedStudent.name}`,
      `Class/Section: ${selectedStudent.className}-${selectedStudent.section}`,
      `Exam: ${examLabel}`,
      `Total: ${totalObtained}/${totalMax}`,
      `Percentage: ${percentage}%`,
      `Grade: ${grade}`,
      `Result: ${result}`,
    ].join('\n')

    const message = `Dear Parent,\nPlease find your ward's marksheet details below:\n\n${marksheetSummary}\n\nPlease save the PDF from the print dialog and share it as attachment if needed.`
    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer')
    setActionStatus('WhatsApp message opened. Use "Print/Save PDF" to attach the PDF file.')
  }

  return (
    <motion.section
      key="marksheet-template-page"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-slate-100 text-slate-900"
    >
      <header className="border-b border-slate-200 bg-slate-50">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-5 py-5 sm:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-slate-500">School ERP</p>
            <h1 className="mt-1 text-5xl font-black tracking-tight">Marksheet Template and Print</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100" onClick={onBack}>
              Back to Dashboard
            </button>
            <button type="button" className="rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100" onClick={handlePrintMarksheet}>
              Print / Save PDF
            </button>
            <button type="button" className="rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700" onClick={handleSendToParent}>
              Send To Parent (WhatsApp)
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-7xl gap-4 px-5 py-7 lg:grid-cols-[1.05fr_1.95fr] sm:px-8">
        <section className="rounded-2xl border border-slate-300 bg-white p-5 shadow-sm">
          <p className="text-3xl font-semibold text-slate-700">MARK ENTRY PANEL</p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-semibold text-slate-700">
              School Name
              <input className="mt-1 h-10 w-full rounded-xl border border-slate-300 px-3 text-sm" value={schoolName} onChange={(event) => setSchoolName(event.target.value)} />
            </label>
            <label className="text-sm font-semibold text-slate-700">
              Academic Session
              <input className="mt-1 h-10 w-full rounded-xl border border-slate-300 px-3 text-sm" value={session} onChange={(event) => setSession(event.target.value)} />
            </label>

            <label className="text-sm font-semibold text-slate-700">
              Class
              <div className="mt-1">
                <CustomSelect options={classOptions} value={selectedClass} onChange={setSelectedClass} />
              </div>
              {onOpenStudentsByClass ? (
                <button
                  type="button"
                  className="mt-2 inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-cyan-600 to-blue-700 px-4 py-2.5 text-sm font-bold text-white shadow-md transition hover:from-cyan-700 hover:to-blue-800"
                  onClick={() => onOpenStudentsByClass(selectedClass)}
                >
                  View Students In {selectedClass}
                </button>
              ) : null}
            </label>

            <label className="text-sm font-semibold text-slate-700">
              Exam Type
              <div className="mt-1">
                <CustomSelect options={examTypeOptions} value={selectedExamType} onChange={setSelectedExamType} />
              </div>
            </label>

            <label className="text-sm font-semibold text-slate-700 sm:col-span-2">
              Student Name (Auto Filled)
              <input
                className="mt-1 h-10 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 text-sm"
                value={selectedStudent?.name || ''}
                placeholder="Auto-filled after class and profile selection"
                readOnly
              />
              <small className="mt-1 block text-xs font-medium text-slate-500">
                To change the student, click "View Students In {selectedClass}" above.
              </small>
            </label>

            <label className="text-sm font-semibold text-slate-700">
              Issue Date
              <input type="date" className="mt-1 h-10 w-full rounded-xl border border-slate-300 px-3 text-sm" value={issueDate} onChange={(event) => setIssueDate(event.target.value)} />
            </label>
            <label className="text-sm font-semibold text-slate-700">
              Class Teacher Name
              <input className="mt-1 h-10 w-full rounded-xl border border-slate-300 px-3 text-sm" value={classTeacherName} onChange={(event) => setClassTeacherName(event.target.value)} />
            </label>

            <label className="text-sm font-semibold text-slate-700 sm:col-span-2">
              Father's Name
              <input className="mt-1 h-10 w-full rounded-xl border border-slate-300 px-3 text-sm" value={fatherName} onChange={(event) => setFatherName(event.target.value)} />
            </label>

            <label className="text-sm font-semibold text-slate-700 sm:col-span-2">
              Principal Name
              <input className="mt-1 h-10 w-full rounded-xl border border-slate-300 px-3 text-sm" value={principalName} onChange={(event) => setPrincipalName(event.target.value)} />
            </label>
          </div>

          <div className="mt-4 overflow-hidden rounded-xl border border-slate-300">
            <table className="min-w-full border-collapse text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="border border-slate-300 px-3 py-2 text-left">Subject</th>
                  <th className="border border-slate-300 px-3 py-2 text-left">Max Marks</th>
                  <th className="border border-slate-300 px-3 py-2 text-left">Obtained Marks</th>
                </tr>
              </thead>
              <tbody>
                {subjects.map((item, index) => (
                  <tr key={item.subject}>
                    <td className="border border-slate-300 px-3 py-2">{item.subject}</td>
                    <td className="border border-slate-300 px-3 py-2">{item.maxMarks}</td>
                    <td className="border border-slate-300 px-3 py-2">
                      <input
                        type="number"
                        min="0"
                        max={item.maxMarks}
                        value={item.obtained}
                        onChange={(event) => handleObtainedChange(index, event.target.value)}
                        className="h-9 w-full rounded-lg border border-slate-300 px-2"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {actionStatus ? <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{actionStatus}</p> : null}
        </section>

        <section className="rounded-2xl border border-slate-300 bg-white p-5 shadow-sm">
          <div className="text-center">
            <h2 className="text-5xl font-black">{schoolName}</h2>
            <p className="mt-1 text-3xl font-semibold">Annual Academic Report Card</p>
            <p className="mt-1 text-slate-500">Session: {session}</p>
          </div>

          <div className="my-4 border-t border-slate-300" />

          <div className="grid gap-3 text-sm sm:grid-cols-2">
            <div className="space-y-1">
              <p><strong>Student Name:</strong> {selectedStudent?.name || 'N/A'}</p>
              <p><strong>Father Name:</strong> {fatherName || 'N/A'}</p>
              <p><strong>Class/Section:</strong> {selectedStudent ? `${selectedStudent.className}-${selectedStudent.section}` : 'N/A'}</p>
              <p><strong>Roll Number:</strong> {selectedStudent?.rollNumber || 'N/A'}</p>
            </div>
            <div className="space-y-1">
              <p><strong>Admission No:</strong> {selectedStudent?.admissionNumber || 'N/A'}</p>
              <p><strong>Date of Birth:</strong> {selectedStudent?.dob || 'N/A'}</p>
              <p><strong>Exam:</strong> {examLabel}</p>
            </div>
          </div>

          <div className="mt-4 overflow-hidden rounded-xl border border-slate-300">
            <table className="min-w-full border-collapse text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="border border-slate-300 px-3 py-2 text-left">Subject</th>
                  <th className="border border-slate-300 px-3 py-2 text-left">Max Marks</th>
                  <th className="border border-slate-300 px-3 py-2 text-left">Obtained</th>
                </tr>
              </thead>
              <tbody>
                {subjects.map((item) => (
                  <tr key={`preview-${item.subject}`}>
                    <td className="border border-slate-300 px-3 py-2">{item.subject}</td>
                    <td className="border border-slate-300 px-3 py-2">{item.maxMarks}</td>
                    <td className="border border-slate-300 px-3 py-2">{item.obtained}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 rounded-xl border border-slate-300 bg-slate-50 p-4 text-sm">
            <p><strong>Total Marks:</strong> {totalObtained} / {totalMax}</p>
            <p><strong>Percentage:</strong> {percentage}%</p>
            <p><strong>Grade:</strong> {grade}</p>
            <p><strong>Result:</strong> {result}</p>
            <p><strong>Issue Date:</strong> {formatDateDisplay(issueDate)}</p>
          </div>

          <div className="mt-7 grid gap-4 sm:grid-cols-3">
            <article className="rounded-xl border border-slate-300 bg-white p-3 text-center">
              <div className="mb-2 h-8 border-b border-slate-500" />
              <p className="text-xs font-bold tracking-wide text-slate-700">Class Teacher Signature</p>
            </article>
            <article className="rounded-xl border border-slate-300 bg-white p-3 text-center">
              <div className="mb-2 h-8 border-b border-slate-500" />
              <p className="text-xs font-bold tracking-wide text-slate-700">Principal Signature</p>
            </article>
            <article className="rounded-xl border border-slate-300 bg-white p-3 text-center">
              <div className="mb-2 h-8 border-b border-slate-500" />
              <p className="text-xs font-bold tracking-wide text-slate-700">Parent Signature</p>
            </article>
          </div>

        </section>
      </div>
    </motion.section>
  )
}

export default MarksheetPage
