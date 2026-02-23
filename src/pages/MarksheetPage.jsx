import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate, useLocation } from 'react-router-dom'
import CustomSelect from '../components/CustomSelect'
import { useAppContext } from '../context/AppContext'

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

function MarksheetPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { studentRecords: students = [] } = useAppContext()
  const preselectedStudent = location.state?.preselectedStudent || null
  const onOpenStudentsByClass = (cls) => navigate('/students', { state: { selectedClass: cls } })
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
      className="min-h-screen bg-slate-50 text-slate-900 pb-12"
    >
      <header className="mb-6 bg-white px-5 py-5 shadow-sm border-b border-slate-200 sm:px-8">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400">School ERP</p>
            <h1 className="text-xl font-bold text-slate-900">Marksheet Template & Print</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition" onClick={() => navigate(-1)}>
              ← Back
            </button>
            <button type="button" className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-sm" onClick={handlePrintMarksheet}>
              Print / Save PDF
            </button>
            <button type="button" className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-green-700 transition shadow-sm flex items-center gap-1.5" onClick={handleSendToParent}>
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" /></svg>
              WhatsApp
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-7xl gap-6 px-5 lg:grid-cols-12 sm:px-8">
        {/* Left Column: Mark Entry */}
        <section className="lg:col-span-5 flex flex-col gap-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-5 text-sm font-bold uppercase tracking-wide text-slate-800 border-b border-slate-100 pb-2">Mark Entry Panel</h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5 sm:col-span-2">
                <span className="text-xs font-semibold text-slate-600">School Name</span>
                <input className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 transition" value={schoolName} onChange={(e) => setSchoolName(e.target.value)} />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-slate-600">Session</span>
                <input className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-blue-400 focus:outline-none transition" value={session} onChange={(e) => setSession(e.target.value)} />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-slate-600">Issue Date</span>
                <input type="date" className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-blue-400 focus:outline-none transition" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
              </label>
w

              <label className="flex flex-col gap-1.5 sm:col-span-2">
                <span className="text-xs font-semibold text-slate-600">Student Name (Auto Filled)</span>
                <input className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-600 cursor-not-allowed" value={selectedStudent?.name || ''} placeholder="Auto-filled after class selection" readOnly />
                <span className="text-[10px] text-slate-500">To change student, click "View Students" above.</span>
              </label>

              <label className="flex flex-col gap-1.5 sm:col-span-2">
                <span className="text-xs font-semibold text-slate-600">Father's Name</span>
                <input className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-blue-400 focus:outline-none transition" value={fatherName} onChange={(e) => setFatherName(e.target.value)} />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-slate-600">Class Teacher</span>
                <input className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-blue-400 focus:outline-none transition" value={classTeacherName} onChange={(e) => setClassTeacherName(e.target.value)} />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-slate-600">Principal Name</span>
                <input className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-blue-400 focus:outline-none transition" value={principalName} onChange={(e) => setPrincipalName(e.target.value)} />
              </label>
            </div>

            <div className="mt-6">
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-600">Enter Marks</h3>
              <div className="overflow-hidden rounded-xl border border-slate-200">
                <table className="w-full border-collapse text-left text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="border-b border-slate-200 px-4 py-2.5 font-semibold text-slate-700 text-xs">Subject</th>
                      <th className="border-b border-slate-200 px-4 py-2.5 font-semibold text-slate-700 text-xs w-24">Max</th>
                      <th className="border-b border-slate-200 px-4 py-2.5 font-semibold text-slate-700 text-xs w-32">Obtained</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {subjects.map((item, index) => (
                      <tr key={item.subject} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-2 font-medium text-slate-800">{item.subject}</td>
                        <td className="px-4 py-2 text-slate-600">{item.maxMarks}</td>
                        <td className="px-4 py-2">
                          <input type="number" min="0" max={item.maxMarks} value={item.obtained} onChange={(e) => handleObtainedChange(index, e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-blue-400 focus:outline-none transition" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            {actionStatus && <p className="mt-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 border border-emerald-200">{actionStatus}</p>}
          </div>
        </section>

        {/* Right Column: Preview */}
        <section className="lg:col-span-7">
          <div className="sticky top-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-md">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">{schoolName}</h2>
              <p className="mt-1 text-lg font-bold text-slate-700 uppercase tracking-widest">Annual Academic Report Card</p>
              <p className="mt-1 text-sm font-medium text-slate-500">Academic Session: {session}</p>
            </div>

            <div className="mb-6 rounded-xl bg-slate-50 p-5 border border-slate-100">
              <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
                <div>
                  <p className="flex justify-between border-b border-slate-200/50 pb-1 mb-1"><span className="font-semibold text-slate-600">Student Name:</span> <span className="font-bold text-slate-900">{selectedStudent?.name || '---'}</span></p>
                  <p className="flex justify-between border-b border-slate-200/50 pb-1 mb-1"><span className="font-semibold text-slate-600">Father's Name:</span> <span className="text-slate-800">{fatherName || '---'}</span></p>
                  <p className="flex justify-between border-b border-slate-200/50 pb-1 mb-1"><span className="font-semibold text-slate-600">Class/Section:</span> <span className="text-slate-800">{selectedStudent ? `${selectedStudent.className}-${selectedStudent.section}` : '---'}</span></p>
                  <p className="flex justify-between"><span className="font-semibold text-slate-600">Roll Number:</span> <span className="text-slate-800">{selectedStudent?.rollNumber || '---'}</span></p>
                </div>
                <div>
                  <p className="flex justify-between border-b border-slate-200/50 pb-1 mb-1"><span className="font-semibold text-slate-600">Admission No:</span> <span className="text-slate-800">{selectedStudent?.admissionNumber || '---'}</span></p>
                  <p className="flex justify-between border-b border-slate-200/50 pb-1 mb-1"><span className="font-semibold text-slate-600">Date of Birth:</span> <span className="text-slate-800">{selectedStudent?.dob || '---'}</span></p>
                  <p className="flex justify-between border-b border-slate-200/50 pb-1 mb-1"><span className="font-semibold text-slate-600">Examination:</span> <span className="font-bold text-blue-700">{examLabel}</span></p>
                </div>
              </div>
            </div>

            <div className="mb-6 overflow-hidden rounded-xl border border-slate-200">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="bg-slate-100/80">
                  <tr>
                    <th className="border-b border-slate-200 px-5 py-3 font-bold text-slate-800 uppercase tracking-wide text-xs">Subject</th>
                    <th className="border-b border-slate-200 px-5 py-3 font-bold text-slate-800 uppercase tracking-wide text-xs">Max Marks</th>
                    <th className="border-b border-slate-200 px-5 py-3 font-bold text-slate-800 uppercase tracking-wide text-xs">Obtained</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {subjects.map((item) => (
                    <tr key={`preview-${item.subject}`}>
                      <td className="px-5 py-2.5 font-medium text-slate-800">{item.subject}</td>
                      <td className="px-5 py-2.5 text-slate-600">{item.maxMarks}</td>
                      <td className="px-5 py-2.5 font-bold text-slate-900">{item.obtained}</td>
                    </tr>
                  ))}
                  <tr className="bg-slate-50">
                    <td className="px-5 py-3 font-bold text-slate-900 border-t border-slate-200 text-right uppercase text-xs" colSpan={2}>Grand Total</td>
                    <td className="px-5 py-3 font-black text-blue-700 border-t border-slate-200 text-base">{totalObtained} <span className="text-xs text-slate-500 font-medium">/ {totalMax}</span></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mb-10 flex flex-wrap justify-between gap-4 rounded-xl border border-blue-100 bg-blue-50/50 p-5 items-center">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-1">Percentage</p>
                <p className="text-2xl font-black text-slate-900">{percentage}%</p>
              </div>
              <div className="h-10 w-px bg-slate-200 hidden sm:block"></div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-1">Grade</p>
                <p className="text-2xl font-black text-blue-600">{grade}</p>
              </div>
              <div className="h-10 w-px bg-slate-200 hidden sm:block"></div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-1">Final Result</p>
                <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-bold ${result === 'Pass' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {result}
                </span>
              </div>
              <div className="h-10 w-px bg-slate-200 hidden sm:block"></div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-1">Date of Issue</p>
                <p className="text-base font-semibold text-slate-700">{formatDateDisplay(issueDate)}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-6 pt-6">
              <div className="text-center">
                <div className="mx-auto w-3/4 border-t-2 border-slate-400 mb-2" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Class Teacher</p>
              </div>
              <div className="text-center">
                <div className="mx-auto w-3/4 border-t-2 border-slate-400 mb-2" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Principal</p>
              </div>
              <div className="text-center">
                <div className="mx-auto w-3/4 border-t-2 border-slate-400 mb-2" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Parent / Guardian</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </motion.section>
  )
}

export default MarksheetPage
