import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate, useLocation } from 'react-router-dom'
import { classNames, defaultLeaveRequests, statuses, weekDays } from '../components/dashboard/constants'
import { buildStudentsByClass, formatDateKey, getAttendanceSummary, seedAttendance } from '../components/dashboard/utils'
import { useAppContext } from '../context/AppContext'

const normalizeStudent = (student, index) => ({
  id: student.id || `STD-${String(index + 1).padStart(3, '0')}`,
  name: student.name || 'Student',
  className: student.className || 'N/A',
  section: student.section || 'A',
  rollNumber: student.rollNumber || String(index + 1).padStart(2, '0'),
  classTeacherName: student.classTeacherName || 'N/A',
  contactNumber: student.contactNumber || 'N/A',
  fatherName: student.fatherName || 'N/A',
  motherName: student.motherName || 'N/A',
  guardianName: student.guardianName || 'N/A',
  guardianRelation: student.guardianRelation || 'N/A',
  fatherContact: student.fatherContact || student.contactNumber || 'N/A',
  motherContact: student.motherContact || 'N/A',
  guardianContact: student.guardianContact || 'N/A',
  studentStatus: student.studentStatus || 'Active',
  admissionNumber: student.admissionNumber || 'N/A',
  admissionDate: student.admissionDate || 'N/A',
  dob: student.dob || 'N/A',
  gender: student.gender || 'N/A',
  bloodGroup: student.bloodGroup || 'N/A',
  category: student.category || 'N/A',
  religion: student.religion || 'N/A',
  aadharLast4: student.aadharLast4 || 'N/A',
  address: student.address || 'N/A',
  transportMode: student.transportMode || 'N/A',
  busRoute: student.busRoute || 'N/A',
  pickupPoint: student.pickupPoint || 'N/A',
  driverName: student.driverName || 'N/A',
  driverContactNumber: student.driverContactNumber || 'N/A',
  vehicleNumber: student.vehicleNumber || 'N/A',
  attendancePercent: student.attendancePercent || '0%',
  feeStatus: student.feeStatus || 'N/A',
  feeCategory: student.feeCategory || 'N/A',
  totalFee: student.totalFee || '0.00',
  paidAmount: student.paidAmount || '0.00',
  pendingAmount: student.pendingAmount || '0.00',
  scholarship: student.scholarship || 'N/A',
  previousSchool: student.previousSchool || 'N/A',
  previousPerformance: student.previousPerformance || 'N/A',
  medicalNotes: student.medicalNotes || 'N/A',
  siblingInfo: student.siblingInfo || 'N/A',
  photoPreview: student.photoPreview || '',
})

const getInitials = (name) =>
  String(name || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || 'ST'

const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
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

const toMonthPrefix = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
const STUDENTS_PER_PAGE = 8



function StudentsHubPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { studentRecords: students = [], updateStudent: onUpdateStudent, addClass, classRecords } = useAppContext()
  const navigationIntent = location.state || null
  const onNavigationHandled = () => window.history.replaceState({}, '')
  const onAddStudent = () => navigate('/students/add')
  const onOpenNotice = (student) => navigate('/notices', { state: { source: 'student-profile', student } })
  const onOpenAttendance = (student, cls) => navigate('/attendance/students', { state: { student, selectedClass: cls } })
  const onSelectStudentForMarksheet = (student) => navigate('/marksheet', { state: { preselectedStudent: student } })
  const [searchText, setSearchText] = useState('')
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [profileStudentId, setProfileStudentId] = useState('')
  const [actionMessage, setActionMessage] = useState('')
  const [studentEdits, setStudentEdits] = useState({})
  const [editingStudentId, setEditingStudentId] = useState('')
  const [editForm, setEditForm] = useState({})
  const [editPhotoPreview, setEditPhotoPreview] = useState('')
  const [editError, setEditError] = useState('')
  const [attendanceStudentId, setAttendanceStudentId] = useState('')
  const [attendanceMonth, setAttendanceMonth] = useState(() => new Date())
  const [attendanceRecords, setAttendanceRecords] = useState({})
  const [leaveRequests, setLeaveRequests] = useState(() => defaultLeaveRequests.filter((item) => item.requesterType === 'student'))
  const [currentPage, setCurrentPage] = useState(1)

  const [showAddClassModal, setShowAddClassModal] = useState(false)
  const [newClassName, setNewClassName] = useState('')
  const [newClassSection, setNewClassSection] = useState('')
  const [isAddingClass, setIsAddingClass] = useState(false)

  const records = useMemo(() => {
    const withEdits = (list) => list.map((item) => (studentEdits[item.id] ? { ...item, ...studentEdits[item.id] } : item))
    return withEdits(students.map(normalizeStudent))
  }, [studentEdits, students])

  const studentsByClass = useMemo(
    () =>
      records.reduce((acc, student) => {
        if (!acc[student.className]) acc[student.className] = []
        acc[student.className].push(student)
        return acc
      }, {}),
    [records],
  )

  const classCards = useMemo(() => {
    return (classRecords || []).map((dbClass) => {
      const displayClassName = `${dbClass.name} - ${dbClass.section}`
      const stds = studentsByClass[displayClassName] || []

      const teacherName = dbClass.classTeacherId?.name
        || stds[0]?.classTeacherName
        || 'Unassigned'

      return {
        className: displayClassName,
        baseName: dbClass.name,
        section: dbClass.section,
        count: stds.length,
        teacher: teacherName,
      }
    })
  }, [classRecords, studentsByClass])

  const classStudents = useMemo(() => (selectedClass ? studentsByClass[selectedClass] || [] : []), [studentsByClass, selectedClass])

  const filteredClassStudents = useMemo(() => {
    const q = searchText.trim().toLowerCase()
    return classStudents.filter((student) => {
      if (!q) return true
      return (
        student.name.toLowerCase().includes(q) ||
        student.id.toLowerCase().includes(q) ||
        student.rollNumber.toLowerCase().includes(q) ||
        `${student.className}-${student.section}`.toLowerCase().includes(q) ||
        student.classTeacherName.toLowerCase().includes(q)
      )
    })
  }, [classStudents, searchText])

  const searchResultStudents = useMemo(() => {
    const q = searchText.trim()
    if (!q) return []
    return filteredClassStudents.slice(0, 10)
  }, [filteredClassStudents, searchText])

  const totalPages = useMemo(() => Math.max(1, Math.ceil(filteredClassStudents.length / STUDENTS_PER_PAGE)), [filteredClassStudents.length])

  const paginatedClassStudents = useMemo(() => {
    const start = (currentPage - 1) * STUDENTS_PER_PAGE
    return filteredClassStudents.slice(start, start + STUDENTS_PER_PAGE)
  }, [currentPage, filteredClassStudents])

  useEffect(() => {
    setCurrentPage(1)
  }, [selectedClass, searchText])

  useEffect(() => {
    if (!selectedClass) setProfileStudentId('')
  }, [selectedClass])

  useEffect(() => {
    if (!navigationIntent) return
    if (navigationIntent.selectedClass) {
      setSelectedClass(navigationIntent.selectedClass)
      setSearchText('')
      setCurrentPage(1)
    }
    if (navigationIntent.selectedStudentId) {
      setSelectedStudentId(navigationIntent.selectedStudentId)
      setProfileStudentId('')
      setAttendanceStudentId('')
    }
    onNavigationHandled?.()
  }, [navigationIntent, onNavigationHandled])

  useEffect(() => {
    if (currentPage <= totalPages) return
    setCurrentPage(totalPages)
  }, [currentPage, totalPages])

  const selectedStudent = useMemo(
    () => classStudents.find((student) => student.id === selectedStudentId) || filteredClassStudents[0] || classStudents[0] || null,
    [classStudents, filteredClassStudents, selectedStudentId],
  )
  const profileStudent = useMemo(() => classStudents.find((student) => student.id === profileStudentId) || null, [classStudents, profileStudentId])

  const attendanceStudent = useMemo(
    () => classStudents.find((student) => student.id === attendanceStudentId) || null,
    [attendanceStudentId, classStudents],
  )

  const attendanceRecord = attendanceStudentId ? attendanceRecords[attendanceStudentId] || {} : {}

  const attendanceSummary = useMemo(() => getAttendanceSummary(attendanceRecord), [attendanceRecord])

  const monthSummary = useMemo(() => {
    const monthPrefix = toMonthPrefix(attendanceMonth)
    const counters = { present: 0, absent: 0, leave: 0 }
    Object.entries(attendanceRecord).forEach(([dateKey, status]) => {
      if (!dateKey.startsWith(monthPrefix) || counters[status] === undefined) return
      counters[status] += 1
    })
    const total = counters.present + counters.absent + counters.leave
    return {
      ...counters,
      total,
      percent: total ? Math.round((counters.present / total) * 100) : 0,
    }
  }, [attendanceMonth, attendanceRecord])

  const attendanceCalendarDays = useMemo(() => {
    const year = attendanceMonth.getFullYear()
    const month = attendanceMonth.getMonth()
    const totalDays = new Date(year, month + 1, 0).getDate()
    const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7
    return {
      year,
      month,
      totalDays,
      firstDayIndex,
      monthLabel: `${monthNames[month]} ${year}`,
    }
  }, [attendanceMonth])

  const attendanceLeaveRequests = useMemo(() => {
    if (!attendanceStudent) return []
    return leaveRequests.filter(
      (item) =>
        item.requesterName === attendanceStudent.name ||
        (item.className === attendanceStudent.className && item.rollNumber === attendanceStudent.rollNumber),
    )
  }, [attendanceStudent, leaveRequests])

  const cycleDayStatus = (dateKey) => {
    if (!attendanceStudentId) return
    const currentStatus = attendanceRecord[dateKey] ?? null
    const currentIndex = statuses.indexOf(currentStatus)
    const nextStatus = statuses[(currentIndex + 1) % statuses.length]
    setAttendanceRecords((previous) => {
      const studentRecord = previous[attendanceStudentId] || {}
      if (nextStatus === null) {
        const { [dateKey]: _ignored, ...rest } = studentRecord
        return { ...previous, [attendanceStudentId]: rest }
      }
      return {
        ...previous,
        [attendanceStudentId]: {
          ...studentRecord,
          [dateKey]: nextStatus,
        },
      }
    })
    setActionMessage(`Attendance updated for ${dateKey}: ${nextStatus || 'none'}.`)
  }

  const setTodayStatus = (status) => {
    if (!attendanceStudentId) return
    const todayKey = formatDateKey(new Date())
    setAttendanceRecords((previous) => ({
      ...previous,
      [attendanceStudentId]: {
        ...(previous[attendanceStudentId] || {}),
        [todayKey]: status,
      },
    }))
    setActionMessage(`Today's status set to ${status} for ${attendanceStudent?.name || 'student'}.`)
  }

  const openAttendancePanel = (student) => {
    setAttendanceStudentId(student.id)
    setAttendanceMonth(new Date())
    setAttendanceRecords((previous) => {
      if (previous[student.id]) return previous
      return { ...previous, [student.id]: seedAttendance(student.id) }
    })
    setActionMessage('')
  }

  const changeLeaveStatus = (leaveId, nextStatus) => {
    setLeaveRequests((previous) => previous.map((item) => (item.id === leaveId ? { ...item, status: nextStatus } : item)))
    setActionMessage(`Leave request ${leaveId} marked ${nextStatus}.`)
  }

  const createLeaveRequest = () => {
    if (!attendanceStudent) return
    const id = `LR-${Date.now()}`
    const today = formatDateKey(new Date())
    setLeaveRequests((previous) => [
      {
        id,
        requesterName: attendanceStudent.name,
        requesterType: 'student',
        className: attendanceStudent.className,
        rollNumber: attendanceStudent.rollNumber,
        reason: 'Parent submitted leave request',
        fromDate: today,
        toDate: today,
        parentContact: attendanceStudent.contactNumber,
        status: 'pending',
        requestedAt: `${today} 09:00`,
      },
      ...previous,
    ])
    setActionMessage(`Leave request created for ${attendanceStudent.name}.`)
  }

  const openEditProfile = (student) => {
    if (!student) return
    setEditingStudentId(student.id)
    setEditError('')
    setEditForm({
      name: student.name || '',
      rollNumber: student.rollNumber || '',
      section: student.section || '',
      fatherName: student.fatherName || '',
      motherName: student.motherName || '',
      contactNumber: student.contactNumber || '',
      fatherContact: student.fatherContact || '',
      motherContact: student.motherContact || '',
      address: student.address || '',
      studentStatus: student.studentStatus || 'Active',
      dob: student.dob || '',
      gender: student.gender || '',
      bloodGroup: student.bloodGroup || '',
      category: student.category || '',
      religion: student.religion || '',
    })
    setEditPhotoPreview(student.photoPreview || '')
  }

  const handleEditPhotoChange = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setEditPhotoPreview(typeof reader.result === 'string' ? reader.result : '')
    }
    reader.readAsDataURL(file)
  }

  const handleEditSave = () => {
    if (!editingStudentId) return
    if (!String(editForm.name || '').trim()) {
      setEditError('Student name is required.')
      return
    }
    if (!String(editForm.rollNumber || '').trim()) {
      setEditError('Roll number is required.')
      return
    }

    const current = records.find((item) => item.id === editingStudentId)
    if (!current) {
      setEditError('Unable to locate student record.')
      return
    }

    const updated = {
      ...current,
      ...editForm,
      name: String(editForm.name).trim(),
      rollNumber: String(editForm.rollNumber).trim(),
      section: String(editForm.section || 'A').trim() || 'A',
      photoPreview: editPhotoPreview || current.photoPreview || '',
    }

    setStudentEdits((previous) => ({
      ...previous,
      [editingStudentId]: updated,
    }))
    onUpdateStudent?.(updated)
    setActionMessage(`Profile updated for ${updated.name}.`)
    setEditingStudentId('')
    setEditPhotoPreview('')
  }

  const studentInfoRows = useMemo(() => {
    if (!profileStudent) return []
    return [
      { label: 'Student Name', value: profileStudent.name },
      { label: 'Admission No.', value: profileStudent.admissionNumber },
      { label: 'Class', value: `${profileStudent.className}-${profileStudent.section}` },
      { label: 'Roll Number', value: profileStudent.rollNumber },
      { label: 'Class Teacher', value: profileStudent.classTeacherName },
      { label: 'Status', value: profileStudent.studentStatus },
      { label: 'DOB', value: profileStudent.dob },
      { label: 'Gender', value: profileStudent.gender },
      { label: 'Blood Group', value: profileStudent.bloodGroup },
      { label: 'Category', value: profileStudent.category },
      { label: 'Religion', value: profileStudent.religion },
      { label: 'Aadhaar Last 4', value: profileStudent.aadharLast4 },
      { label: 'Father Name', value: profileStudent.fatherName },
      { label: 'Mother Name', value: profileStudent.motherName },
      { label: 'Guardian', value: `${profileStudent.guardianName} (${profileStudent.guardianRelation})` },
      { label: 'Contact', value: profileStudent.contactNumber },
      { label: 'Father Contact', value: profileStudent.fatherContact },
      { label: 'Mother Contact', value: profileStudent.motherContact },
      { label: 'Guardian Contact', value: profileStudent.guardianContact },
      { label: 'Admission Date', value: profileStudent.admissionDate },
      { label: 'Address', value: profileStudent.address },
      { label: 'Attendance', value: profileStudent.attendancePercent },
      { label: 'Fee Status', value: profileStudent.feeStatus },
      { label: 'Fee Category', value: profileStudent.feeCategory },
      { label: 'Total Fee', value: profileStudent.totalFee },
      { label: 'Paid Amount', value: profileStudent.paidAmount },
      { label: 'Pending Amount', value: profileStudent.pendingAmount },
      { label: 'Scholarship', value: profileStudent.scholarship },
      { label: 'Previous School', value: profileStudent.previousSchool },
      { label: 'Previous Performance', value: profileStudent.previousPerformance },
    ]
  }, [profileStudent])

  const handleAddClassSubmit = async () => {
    if (!newClassName.trim() || !newClassSection.trim()) {
      alert("Please enter both Class Name and Section");
      return;
    }
    setIsAddingClass(true);
    try {
      await addClass({ name: newClassName, section: newClassSection });
      setShowAddClassModal(false);
      setNewClassName("");
      setNewClassSection("");
      alert("Class added successfully!");
    } catch (err) {
      alert("Failed to add class. Ensure name and section are valid and unique.");
    } finally {
      setIsAddingClass(false);
    }
  };

  return (
    <motion.section
      key="students-hub-page"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-white text-slate-800 relative"
    >
      {/* ADD CLASS MODAL */}
      {showAddClassModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
          >
            <h3 className="mb-4 text-lg font-bold text-slate-800">Add New Class</h3>
            <div className="space-y-4">
              <label className="flex flex-col gap-2">
                <span className="text-sm font-semibold text-slate-700">Class Name (e.g. 1st)</span>
                <input
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 transition-colors placeholder:text-slate-400 hover:border-slate-400 focus:border-cyan-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-cyan-500/10"
                  placeholder="1st"
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-sm font-semibold text-slate-700">Section (e.g. A)</span>
                <input
                  value={newClassSection}
                  onChange={(e) => setNewClassSection(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 transition-colors placeholder:text-slate-400 hover:border-slate-400 focus:border-cyan-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-cyan-500/10"
                  placeholder="A"
                />
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowAddClassModal(false)}
                className="rounded-lg px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddClassSubmit}
                disabled={isAddingClass}
                className="rounded-lg bg-cyan-600 px-4 py-2 font-bold text-white hover:bg-cyan-700 disabled:opacity-50"
              >
                {isAddingClass ? "Saving..." : "Save Class"}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <div className="mx-auto max-w-7xl px-5 py-6 sm:px-8">
        <header className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700">Student Management</p>
              <h1 className="text-2xl font-semibold text-slate-900">Students Cards</h1>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50" onClick={() => navigate('/dashboard')}>
                Back to Dashboard
              </button>
              <button type="button" className="rounded-lg border border-cyan-300 bg-cyan-50 px-3 py-2 text-sm font-bold text-cyan-700 hover:bg-cyan-100" onClick={() => setShowAddClassModal(true)}>
                + Add Class
              </button>
              <button type="button" className="rounded-lg bg-cyan-600 px-3 py-2 text-sm font-medium text-white hover:bg-cyan-700" onClick={onAddStudent}>
                Add Student
              </button>
            </div>
          </div>
        </header>

        {!selectedClass ? (
          <section className="space-y-4">
            <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <article className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Students</p>
                <p className="mt-1 text-2xl font-semibold text-slate-900">{records.length}</p>
              </article>
              <article className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-cyan-700">Total Classes</p>
                <p className="mt-1 text-2xl font-semibold text-cyan-800">{classCards.length}</p>
              </article>
              <article className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Average/Class</p>
                <p className="mt-1 text-2xl font-semibold text-emerald-800">{classCards.length ? Math.round(records.length / classCards.length) : 0}</p>
              </article>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="mb-3 text-lg font-semibold text-slate-900">Class Cards</h2>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {classCards.map((item) => (
                  <button
                    key={item.className}
                    type="button"
                    className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:-translate-y-0.5 hover:border-cyan-300 hover:bg-cyan-50"
                    onClick={() => {
                      setSelectedClass(item.className)
                      setSearchText('')
                      setSelectedStudentId('')
                      setProfileStudentId('')
                      setActionMessage('')
                      setAttendanceStudentId('')
                    }}
                  >
                    <p className="text-sm font-semibold text-slate-900">{getClassLabel(item.className)}</p>
                    <p className="mt-1 text-2xl font-bold text-cyan-800">{item.count}</p>
                    <p className="mt-1 text-xs text-slate-600">Class Teacher: {item.teacher}</p>
                  </button>
                ))}
              </div>
            </section>
          </section>
        ) : (
          <section className="space-y-4">
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  onClick={() => {
                    setSelectedClass('')
                    setSearchText('')
                    setSelectedStudentId('')
                    setProfileStudentId('')
                    setActionMessage('')
                    setAttendanceStudentId('')
                  }}
                >
                  Back to Class Cards
                </button>
                {profileStudent ? (
                  <button
                    type="button"
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    onClick={() => {
                      setProfileStudentId('')
                      setActionMessage('')
                      setAttendanceStudentId('')
                    }}
                  >
                    Back to Student Cards
                  </button>
                ) : null}
                <span className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-semibold text-cyan-800">
                  Class: {getClassLabel(selectedClass)} | Students: {classStudents.length}
                </span>
              </div>
              <input
                type="text"
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                placeholder={`Search ${getClassLabel(selectedClass)} students by name, roll, ID`}
                className="mt-3 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 focus:border-cyan-500 focus:outline-none"
              />
              {searchText.trim() ? (
                <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Search Results</p>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    {searchResultStudents.length ? (
                      searchResultStudents.map((student) => (
                        <button
                          key={`search-${student.id}`}
                          type="button"
                          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm font-medium text-slate-700 hover:border-cyan-300 hover:bg-cyan-50"
                          onClick={() => {
                            setSelectedStudentId(student.id)
                            setProfileStudentId(student.id)
                            setAttendanceStudentId('')
                            setActionMessage('')
                          }}
                        >
                          {student.name} ({student.className}-{student.section}) | Roll {student.rollNumber}
                        </button>
                      ))
                    ) : (
                      <p className="text-sm text-slate-600">No matching student found.</p>
                    )}
                  </div>
                </div>
              ) : null}
            </section>

            {!profileStudent ? (
              <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="erp-student-compact-grid">
                  {paginatedClassStudents.map((student) => (
                    <button
                      key={student.id}
                      type="button"
                      onClick={() => {
                        setSelectedStudentId(student.id)
                        setProfileStudentId(student.id)
                        setActionMessage('')
                        setAttendanceStudentId('')
                      }}
                      className={`erp-student-compact-card ${selectedStudent?.id === student.id ? 'erp-student-compact-card-active' : ''}`}
                    >
                      {student.photoPreview ? (
                        <img src={student.photoPreview} alt={student.name} className="erp-student-compact-image rounded-full object-cover" />
                      ) : (
                        <div className="erp-student-compact-avatar grid place-items-center rounded-full bg-cyan-100 text-sm font-semibold text-cyan-800">
                          {getInitials(student.name)}
                        </div>
                      )}
                      <p className="erp-student-compact-name">{student.name}</p>
                      <p className="erp-student-compact-roll">Roll: {student.rollNumber}</p>
                      <p className="erp-student-compact-teacher">
                        Class: {student.className}-{student.section}
                      </p>
                    </button>
                  ))}
                </div>
                {filteredClassStudents.length ? (
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-slate-600">
                      Showing {(currentPage - 1) * STUDENTS_PER_PAGE + 1}-
                      {Math.min(currentPage * STUDENTS_PER_PAGE, filteredClassStudents.length)} of {filteredClassStudents.length} students
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="erp-nav-button"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      >
                        Prev
                      </button>
                      <span className="text-xs font-semibold text-slate-700">
                        Page {currentPage} / {totalPages}
                      </span>
                      <button
                        type="button"
                        className="erp-nav-button"
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                ) : null}
              </section>
            ) : (
              <section className="space-y-4">
                <section className="erp-student-profile-page">
                  <aside className="erp-student-profile-sidebar">
                    {profileStudent.photoPreview ? (
                      <img src={profileStudent.photoPreview} alt={profileStudent.name} className="erp-student-profile-cover" />
                    ) : (
                      <div className="erp-student-profile-cover erp-student-profile-cover-fallback">{getInitials(profileStudent.name)}</div>
                    )}
                    <h3>{profileStudent.name}</h3>
                    <p>
                      {profileStudent.className}-{profileStudent.section} | Roll {profileStudent.rollNumber}
                    </p>
                    <div className="erp-student-profile-pills">
                      <span>{profileStudent.studentStatus}</span>
                      <span>{profileStudent.attendancePercent} Attendance</span>
                      <span>{profileStudent.feeStatus} Fee</span>
                    </div>
                    <div className="erp-student-profile-actions mt-3">
                      <button type="button" className="erp-nav-button erp-nav-button-notice" onClick={() => onOpenNotice?.(profileStudent)}>
                        Send Notice
                      </button>
                      <button type="button" className="erp-nav-button erp-nav-button-attendance" onClick={() => onOpenAttendance?.(profileStudent, selectedClass)}>
                        View Attendance
                      </button>
                      <button type="button" className="erp-nav-button" onClick={() => onSelectStudentForMarksheet?.(profileStudent)}>
                        Use In Marksheet
                      </button>
                      <button type="button" className="erp-nav-button" onClick={() => openEditProfile(profileStudent)}>
                        Edit Profile
                      </button>
                    </div>
                    {actionMessage ? <p className="erp-notice-status">{actionMessage}</p> : null}
                  </aside>

                  <article className="erp-student-profile-main">
                    <div className="erp-student-profile-head">
                      {profileStudent.photoPreview ? (
                        <img src={profileStudent.photoPreview} alt={profileStudent.name} className="erp-student-avatar-image" />
                      ) : (
                        <span className="erp-student-avatar">{getInitials(profileStudent.name)}</span>
                      )}
                      <div className="erp-student-info">
                        <p className="erp-student-name">{profileStudent.name}</p>
                        <p className="erp-student-meta">
                          {profileStudent.className}-{profileStudent.section} | Name: {profileStudent.name}
                        </p>
                      </div>
                    </div>
                    <div className="erp-student-profile-grid">
                      {studentInfoRows.map((row) => (
                        <span key={row.label}>
                          {row.label}: {row.value}
                        </span>
                      ))}
                    </div>
                  </article>
                </section>
              </section>
            )}

            {attendanceStudent ? (
              <section className="erp-attendance-workspace">
                <article className="erp-attendance-left">
                  <div className="erp-attendance-person-header">
                    {attendanceStudent.photoPreview ? (
                      <img src={attendanceStudent.photoPreview} alt={attendanceStudent.name} className="erp-student-avatar-image" />
                    ) : (
                      <span className="erp-student-avatar">{getInitials(attendanceStudent.name)}</span>
                    )}
                    <div>
                      <p className="erp-student-name">{attendanceStudent.name}</p>
                      <p className="erp-student-meta">
                        {attendanceStudent.className}-{attendanceStudent.section} | Roll {attendanceStudent.rollNumber}
                      </p>
                    </div>
                  </div>

                  <div className="erp-attendance-top-grid">
                    <article className="erp-attendance-top-card">
                      <p>This Month</p>
                      <strong>{monthSummary.percent}%</strong>
                    </article>
                    <article className="erp-attendance-top-card">
                      <p>Present Days</p>
                      <strong>{monthSummary.present}</strong>
                    </article>
                    <article className="erp-attendance-top-card">
                      <p>Leave Days</p>
                      <strong>{monthSummary.leave}</strong>
                    </article>
                  </div>

                  <div className="erp-attendance-calendar-shell mt-3">
                    <div className="erp-attendance-calendar-top">
                      <p className="erp-attendance-month-label">{attendanceCalendarDays.monthLabel}</p>
                      <div className="erp-attendance-month-controls">
                        <button
                          type="button"
                          className="erp-nav-button"
                          onClick={() => setAttendanceMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
                        >
                          Prev
                        </button>
                        <button
                          type="button"
                          className="erp-nav-button"
                          onClick={() => setAttendanceMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
                        >
                          Next
                        </button>
                      </div>
                    </div>

                    <div className="erp-attendance-legend">
                      <span className="erp-legend-item erp-legend-present">Present</span>
                      <span className="erp-legend-item erp-legend-absent">Absent</span>
                      <span className="erp-legend-item erp-legend-leave">Leave</span>
                    </div>

                    <div className="erp-attendance-quick-actions">
                      <p>
                        Mark Today:
                        <span className="erp-attendance-today-status"> {formatDateKey(new Date())}</span>
                      </p>
                      <div className="erp-attendance-quick-buttons">
                        <button type="button" className="erp-attendance-quick-btn erp-attendance-quick-present" onClick={() => setTodayStatus('present')}>
                          Present
                        </button>
                        <button type="button" className="erp-attendance-quick-btn erp-attendance-quick-absent" onClick={() => setTodayStatus('absent')}>
                          Absent
                        </button>
                        <button type="button" className="erp-attendance-quick-btn erp-attendance-quick-leave" onClick={() => setTodayStatus('leave')}>
                          Leave
                        </button>
                      </div>
                    </div>

                    <div className="erp-attendance-week-grid">
                      {weekDays.map((day) => (
                        <span key={day} className="erp-attendance-week-label">
                          {day}
                        </span>
                      ))}
                    </div>

                    <div className="erp-attendance-days-grid mt-2">
                      {Array.from({ length: attendanceCalendarDays.firstDayIndex }).map((_, index) => (
                        <div key={`empty-${index}`} className="erp-attendance-day-empty" />
                      ))}
                      {Array.from({ length: attendanceCalendarDays.totalDays }).map((_, index) => {
                        const day = index + 1
                        const date = new Date(attendanceCalendarDays.year, attendanceCalendarDays.month, day)
                        const dateKey = formatDateKey(date)
                        const status = attendanceRecord[dateKey]
                        const todayKey = formatDateKey(new Date())
                        const className = [
                          'erp-attendance-day',
                          status ? `erp-attendance-${status}` : 'erp-attendance-empty',
                          dateKey === todayKey ? 'erp-attendance-today' : '',
                        ]
                          .filter(Boolean)
                          .join(' ')
                        return (
                          <button key={dateKey} type="button" className={className} onClick={() => cycleDayStatus(dateKey)} title={`${dateKey} (${status || 'none'})`}>
                            {day}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <div className="erp-attendance-report">
                    <p className="erp-attendance-report-title">Overall Attendance Report</p>
                    <div className="erp-attendance-report-grid">
                      <article className="erp-attendance-report-card">
                        <p>Present</p>
                        <strong>{attendanceSummary.present}</strong>
                      </article>
                      <article className="erp-attendance-report-card">
                        <p>Absent</p>
                        <strong>{attendanceSummary.absent}</strong>
                      </article>
                      <article className="erp-attendance-report-card">
                        <p>Leave</p>
                        <strong>{attendanceSummary.leave}</strong>
                      </article>
                      <article className="erp-attendance-report-card">
                        <p>Attendance %</p>
                        <strong>{attendanceSummary.percentage}%</strong>
                      </article>
                    </div>
                    <p className="erp-attendance-report-line">Click any date to rotate status: None -&gt; Present -&gt; Absent -&gt; Leave.</p>
                  </div>
                </article>

                <aside className="erp-attendance-right">
                  <h3 className="erp-attendance-right-title">Student Leave Requests</h3>
                  <div className="erp-leave-shell">
                    <div className="erp-leave-summary">
                      <article className="erp-leave-summary-card">
                        <p>Total Requests</p>
                        <strong>{attendanceLeaveRequests.length}</strong>
                      </article>
                      <article className="erp-leave-summary-card">
                        <p>Pending</p>
                        <strong>{attendanceLeaveRequests.filter((item) => item.status === 'pending').length}</strong>
                      </article>
                      <article className="erp-leave-summary-card">
                        <p>Approved</p>
                        <strong>{attendanceLeaveRequests.filter((item) => item.status === 'approved').length}</strong>
                      </article>
                      <article className="erp-leave-summary-card">
                        <p>Rejected</p>
                        <strong>{attendanceLeaveRequests.filter((item) => item.status === 'rejected').length}</strong>
                      </article>
                    </div>

                    <div className="erp-leave-panel">
                      <button type="button" className="erp-nav-button erp-nav-button-leave" onClick={createLeaveRequest}>
                        Add Leave Request
                      </button>
                      <div className="erp-leave-list">
                        {attendanceLeaveRequests.length ? (
                          attendanceLeaveRequests.map((item) => (
                            <article key={item.id} className="erp-leave-item">
                              <div className="erp-leave-item-head">
                                <div>
                                  <p className="erp-student-name">{item.requesterName}</p>
                                  <p className="erp-student-meta">
                                    {item.fromDate} to {item.toDate}
                                  </p>
                                </div>
                                <span className={`erp-leave-status-pill erp-leave-status-${item.status}`}>{item.status}</span>
                              </div>
                              <p className="erp-student-meta mt-2">{item.reason}</p>
                              <p className="erp-student-meta mt-1">Parent Contact: {item.parentContact}</p>
                              {item.status === 'pending' ? (
                                <div className="erp-leave-actions">
                                  <button type="button" className="erp-nav-button" onClick={() => changeLeaveStatus(item.id, 'approved')}>
                                    Approve
                                  </button>
                                  <button type="button" className="erp-nav-button" onClick={() => changeLeaveStatus(item.id, 'rejected')}>
                                    Reject
                                  </button>
                                </div>
                              ) : null}
                            </article>
                          ))
                        ) : (
                          <p className="erp-student-meta">No leave requests for this student.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </aside>
              </section>
            ) : null}
          </section>
        )}

        {editingStudentId ? (
          <div className="erp-student-modal-overlay" role="dialog" aria-modal="true">
            <article className="erp-student-modal">
              <button
                type="button"
                className="erp-modal-close"
                onClick={() => {
                  setEditingStudentId('')
                  setEditError('')
                  setEditPhotoPreview('')
                }}
              >
                Close
              </button>
              <div className="erp-modal-header">
                {editPhotoPreview ? <img src={editPhotoPreview} alt="Student preview" className="erp-modal-photo-image" /> : <div className="erp-modal-photo">ED</div>}
                <div>
                  <h3 className="erp-modal-name">Edit Student Profile</h3>
                  <p className="erp-modal-subtitle">Update details and save changes.</p>
                </div>
              </div>

              <div className="mb-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <label className="block text-xs font-semibold text-slate-600">Upload Student Photo</label>
                <input type="file" accept="image/*" className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" onChange={handleEditPhotoChange} />
              </div>

              <div className="erp-modal-grid">
                <article className="erp-modal-card">
                  <h4 className="erp-modal-card-title">Basic</h4>
                  <label className="block text-xs font-semibold text-slate-600">Name</label>
                  <input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={editForm.name || ''} onChange={(event) => setEditForm((prev) => ({ ...prev, name: event.target.value }))} />
                  <label className="mt-2 block text-xs font-semibold text-slate-600">Roll Number</label>
                  <input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={editForm.rollNumber || ''} onChange={(event) => setEditForm((prev) => ({ ...prev, rollNumber: event.target.value }))} />
                  <label className="mt-2 block text-xs font-semibold text-slate-600">Section</label>
                  <input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={editForm.section || ''} onChange={(event) => setEditForm((prev) => ({ ...prev, section: event.target.value }))} />
                  <label className="mt-2 block text-xs font-semibold text-slate-600">Status</label>
                  <input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={editForm.studentStatus || ''} onChange={(event) => setEditForm((prev) => ({ ...prev, studentStatus: event.target.value }))} />
                </article>

                <article className="erp-modal-card">
                  <h4 className="erp-modal-card-title">Parents</h4>
                  <label className="block text-xs font-semibold text-slate-600">Father Name</label>
                  <input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={editForm.fatherName || ''} onChange={(event) => setEditForm((prev) => ({ ...prev, fatherName: event.target.value }))} />
                  <label className="mt-2 block text-xs font-semibold text-slate-600">Mother Name</label>
                  <input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={editForm.motherName || ''} onChange={(event) => setEditForm((prev) => ({ ...prev, motherName: event.target.value }))} />
                  <label className="mt-2 block text-xs font-semibold text-slate-600">Contact</label>
                  <input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={editForm.contactNumber || ''} onChange={(event) => setEditForm((prev) => ({ ...prev, contactNumber: event.target.value }))} />
                  <label className="mt-2 block text-xs font-semibold text-slate-600">Father Contact</label>
                  <input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={editForm.fatherContact || ''} onChange={(event) => setEditForm((prev) => ({ ...prev, fatherContact: event.target.value }))} />
                  <label className="mt-2 block text-xs font-semibold text-slate-600">Mother Contact</label>
                  <input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={editForm.motherContact || ''} onChange={(event) => setEditForm((prev) => ({ ...prev, motherContact: event.target.value }))} />
                </article>

                <article className="erp-modal-card">
                  <h4 className="erp-modal-card-title">Personal</h4>
                  <label className="block text-xs font-semibold text-slate-600">DOB</label>
                  <input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={editForm.dob || ''} onChange={(event) => setEditForm((prev) => ({ ...prev, dob: event.target.value }))} />
                  <label className="mt-2 block text-xs font-semibold text-slate-600">Gender</label>
                  <input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={editForm.gender || ''} onChange={(event) => setEditForm((prev) => ({ ...prev, gender: event.target.value }))} />
                  <label className="mt-2 block text-xs font-semibold text-slate-600">Blood Group</label>
                  <input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={editForm.bloodGroup || ''} onChange={(event) => setEditForm((prev) => ({ ...prev, bloodGroup: event.target.value }))} />
                  <label className="mt-2 block text-xs font-semibold text-slate-600">Category</label>
                  <input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={editForm.category || ''} onChange={(event) => setEditForm((prev) => ({ ...prev, category: event.target.value }))} />
                  <label className="mt-2 block text-xs font-semibold text-slate-600">Religion</label>
                  <input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={editForm.religion || ''} onChange={(event) => setEditForm((prev) => ({ ...prev, religion: event.target.value }))} />
                </article>

                <article className="erp-modal-card">
                  <h4 className="erp-modal-card-title">Address</h4>
                  <textarea
                    rows={8}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    value={editForm.address || ''}
                    onChange={(event) => setEditForm((prev) => ({ ...prev, address: event.target.value }))}
                  />
                </article>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button type="button" className="erp-form-primary-button" onClick={handleEditSave}>
                  Save Changes
                </button>
                <button
                  type="button"
                  className="erp-nav-button"
                  onClick={() => {
                    setEditingStudentId('')
                    setEditError('')
                    setEditPhotoPreview('')
                  }}
                >
                  Cancel
                </button>
              </div>
              {editError ? <p className="erp-notice-status">{editError}</p> : null}
            </article>
          </div>
        ) : null}
      </div>
    </motion.section>
  )
}

export default StudentsHubPage
