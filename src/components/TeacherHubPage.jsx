import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { baseTeachers, classNames, classTeacherByClass } from './dashboard/constants'

const classPayrollDefaults = {
  Nursery: { salary: 27000, allowance: 1100, deductions: 750 },
  LKG: { salary: 28000, allowance: 1200, deductions: 800 },
  UKG: { salary: 29000, allowance: 1300, deductions: 850 },
  '1st': { salary: 30000, allowance: 1400, deductions: 900 },
  '2nd': { salary: 31000, allowance: 1500, deductions: 950 },
  '3rd': { salary: 32000, allowance: 1600, deductions: 1000 },
  '4th': { salary: 33000, allowance: 1700, deductions: 1050 },
  '5th': { salary: 34000, allowance: 1800, deductions: 1100 },
  '6th': { salary: 35000, allowance: 1900, deductions: 1150 },
  '7th': { salary: 36000, allowance: 2000, deductions: 1200 },
  '8th': { salary: 37000, allowance: 2100, deductions: 1250 },
  '9th': { salary: 39000, allowance: 2300, deductions: 1300 },
  '10th': { salary: 41000, allowance: 2500, deductions: 1400 },
  '11th': { salary: 44000, allowance: 2800, deductions: 1500 },
  '12th': { salary: 47000, allowance: 3200, deductions: 1600 },
}

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

const hasValue = (value) => value !== undefined && value !== null && String(value).trim() !== ''

const normalizeTeacher = (teacher, index) => ({
  ...(() => {
    const className = teacher.classTeacherName || 'N/A'
    const payrollDefault = classPayrollDefaults[className] || { salary: 35000, allowance: 1500, deductions: 1000 }
    return {
      salary: hasValue(teacher.salary) ? teacher.salary : hasValue(teacher.basic) ? teacher.basic : String(payrollDefault.salary),
      allowance: hasValue(teacher.allowance) ? teacher.allowance : String(payrollDefault.allowance),
      deductions: hasValue(teacher.deductions) ? teacher.deductions : String(payrollDefault.deductions),
    }
  })(),
  id: teacher.id || `T-${String(index + 1).padStart(3, '0')}`,
  employeeId: teacher.employeeId || teacher.id || `EMP-${String(index + 1).padStart(3, '0')}`,
  name: teacher.name || 'Teacher',
  subject: teacher.subject || 'N/A',
  contactNumber: teacher.contactNumber || 'N/A',
  email: teacher.email || 'N/A',
  department: teacher.department || 'N/A',
  experienceYears: teacher.experienceYears || '0',
  qualification: teacher.qualification || 'N/A',
  status: teacher.status || 'active',
  classTeacherName: teacher.classTeacherName || 'N/A',
  classTeacherSection: teacher.classTeacherSection || 'A',
  address: teacher.address || 'N/A',
  gender: teacher.gender || 'N/A',
  dob: teacher.dob || 'N/A',
  joiningDate: teacher.joiningDate || 'N/A',
  photoPreview: teacher.photoPreview || '',
  leaveDays: teacher.leaveDays || teacher.leaveBalance || '0',
})

const getInitials = (name) =>
  String(name || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || 'TR'

const toNumber = (value) => Number.parseFloat(String(value ?? 0)) || 0
const rs = (value) => `Rs ${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Math.max(toNumber(value), 0))}`
const normalizePhone = (value) => String(value || '').replace(/\D/g, '')

function TeacherHubPage({
  teachers = [],
  navigationIntent,
  onNavigationHandled,
  onBack,
  onOpenNotice,
  onOpenAttendance,
  onUpdateTeacher,
}) {
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedTeacherId, setSelectedTeacherId] = useState('')
  const [profileTeacherId, setProfileTeacherId] = useState('')
  const [searchText, setSearchText] = useState('')
  const [actionMessage, setActionMessage] = useState('')
  const [teacherEdits, setTeacherEdits] = useState({})
  const [editingTeacherId, setEditingTeacherId] = useState('')
  const [editForm, setEditForm] = useState({})
  const [editPhotoPreview, setEditPhotoPreview] = useState('')
  const [editError, setEditError] = useState('')
  const [payrollInputs, setPayrollInputs] = useState({})
  const [generatedPayslip, setGeneratedPayslip] = useState('')
  const [generatedPayslipKey, setGeneratedPayslipKey] = useState('')

  const records = useMemo(() => {
    const source = teachers.length ? teachers : baseTeachers
    const normalized = source.map(normalizeTeacher)
    return normalized.map((item) => (teacherEdits[item.id] ? { ...item, ...teacherEdits[item.id] } : item))
  }, [teacherEdits, teachers])

  const classOrder = useMemo(() => classNames, [])

  const teachersByClass = useMemo(() => {
    const mapped = {}
    classOrder.forEach((className) => {
      const directTeachers = records.filter((teacher) => teacher.classTeacherName === className)
      const byName = records.filter((teacher) => teacher.name === classTeacherByClass[className])
      const merged = [...directTeachers, ...byName].reduce((acc, teacher) => {
        if (acc.some((item) => item.id === teacher.id)) return acc
        acc.push(teacher)
        return acc
      }, [])
      mapped[className] = merged
    })
    return mapped
  }, [classOrder, records])

  const extraClasses = useMemo(
    () =>
      Array.from(new Set(records.map((item) => item.classTeacherName).filter(Boolean))).filter((item) => !classOrder.includes(item)),
    [classOrder, records],
  )

  const classCards = useMemo(
    () =>
      [...classOrder, ...extraClasses].map((className) => {
        const classTeachers = teachersByClass[className] || records.filter((teacher) => teacher.classTeacherName === className)
        return {
          className,
          count: classTeachers.length,
          classTeacher: classTeachers[0]?.name || classTeacherByClass[className] || 'Not Assigned',
          section: classTeachers[0]?.classTeacherSection || 'A',
          subjects: classTeachers.length ? Array.from(new Set(classTeachers.map((item) => item.subject).filter(Boolean))).join(', ') : 'Not Assigned',
        }
      }),
    [classOrder, extraClasses, records, teachersByClass],
  )

  const classTeachers = useMemo(() => {
    if (!selectedClass) return []
    return teachersByClass[selectedClass] || records.filter((teacher) => teacher.classTeacherName === selectedClass)
  }, [records, selectedClass, teachersByClass])

  const filteredTeachers = useMemo(() => {
    const q = searchText.trim().toLowerCase()
    if (!q) return classTeachers
    return classTeachers.filter(
      (teacher) =>
        teacher.name.toLowerCase().includes(q) ||
        teacher.id.toLowerCase().includes(q) ||
        teacher.employeeId.toLowerCase().includes(q) ||
        teacher.subject.toLowerCase().includes(q) ||
        teacher.contactNumber.toLowerCase().includes(q),
    )
  }, [classTeachers, searchText])

  const selectedTeacher = useMemo(
    () => classTeachers.find((teacher) => teacher.id === selectedTeacherId) || filteredTeachers[0] || classTeachers[0] || null,
    [classTeachers, filteredTeachers, selectedTeacherId],
  )

  const profileTeacher = useMemo(() => classTeachers.find((teacher) => teacher.id === profileTeacherId) || null, [classTeachers, profileTeacherId])

  useEffect(() => {
    if (!selectedClass) {
      setSelectedTeacherId('')
      setProfileTeacherId('')
      setSearchText('')
      return
    }
    if (!classTeachers.length) {
      setSelectedTeacherId('')
      setProfileTeacherId('')
      return
    }
    if (!selectedTeacherId || !classTeachers.some((teacher) => teacher.id === selectedTeacherId)) {
      setSelectedTeacherId(classTeachers[0].id)
    }
  }, [classTeachers, selectedClass, selectedTeacherId])

  useEffect(() => {
    if (!navigationIntent) return
    if (navigationIntent.selectedClass) {
      setSelectedClass(navigationIntent.selectedClass)
      setSearchText('')
    }
    if (navigationIntent.selectedTeacherId) {
      setSelectedTeacherId(navigationIntent.selectedTeacherId)
      setProfileTeacherId(navigationIntent.selectedTeacherId)
    }
    onNavigationHandled?.()
  }, [navigationIntent, onNavigationHandled])

  const openEditProfile = (teacher) => {
    if (!teacher) return
    setEditingTeacherId(teacher.id)
    setEditError('')
    setEditPhotoPreview(teacher.photoPreview || '')
    setEditForm({
      name: teacher.name || '',
      employeeId: teacher.employeeId || '',
      subject: teacher.subject || '',
      department: teacher.department || '',
      experienceYears: teacher.experienceYears || '',
      qualification: teacher.qualification || '',
      contactNumber: teacher.contactNumber || '',
      email: teacher.email || '',
      classTeacherName: teacher.classTeacherName || '',
      classTeacherSection: teacher.classTeacherSection || '',
      status: teacher.status || 'active',
      gender: teacher.gender || '',
      dob: teacher.dob || '',
      joiningDate: teacher.joiningDate || '',
      address: teacher.address || '',
    })
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
    if (!editingTeacherId) return
    if (!String(editForm.name || '').trim()) {
      setEditError('Teacher name is required.')
      return
    }

    const current = records.find((item) => item.id === editingTeacherId)
    if (!current) {
      setEditError('Unable to find teacher record.')
      return
    }

    const updated = {
      ...current,
      ...editForm,
      name: String(editForm.name || '').trim(),
      employeeId: String(editForm.employeeId || '').trim() || current.employeeId,
      classTeacherName: String(editForm.classTeacherName || '').trim() || current.classTeacherName,
      classTeacherSection: String(editForm.classTeacherSection || '').trim() || current.classTeacherSection,
      photoPreview: editPhotoPreview || current.photoPreview || '',
    }

    setTeacherEdits((previous) => ({
      ...previous,
      [editingTeacherId]: updated,
    }))
    onUpdateTeacher?.(updated)

    if (selectedClass && selectedClass !== updated.classTeacherName) {
      setSelectedClass(updated.classTeacherName)
      setProfileTeacherId(updated.id)
      setSelectedTeacherId(updated.id)
    }

    setActionMessage(`Profile updated for ${updated.name}.`)
    setEditingTeacherId('')
    setEditPhotoPreview('')
  }

  const profileRows = useMemo(() => {
    if (!profileTeacher) return []
    return [
      { label: 'Teacher ID', value: profileTeacher.id },
      { label: 'Employee ID', value: profileTeacher.employeeId },
      { label: 'Name', value: profileTeacher.name },
      { label: 'Class Teacher', value: `${profileTeacher.classTeacherName}-${profileTeacher.classTeacherSection}` },
      { label: 'Subject', value: profileTeacher.subject },
      { label: 'Department', value: profileTeacher.department },
      { label: 'Qualification', value: profileTeacher.qualification },
      { label: 'Experience', value: `${profileTeacher.experienceYears} years` },
      { label: 'Status', value: profileTeacher.status },
      { label: 'Phone', value: profileTeacher.contactNumber },
      { label: 'Email', value: profileTeacher.email },
      { label: 'Gender', value: profileTeacher.gender },
      { label: 'DOB', value: profileTeacher.dob },
      { label: 'Joining Date', value: profileTeacher.joiningDate },
      { label: 'Address', value: profileTeacher.address },
    ]
  }, [profileTeacher])

  const selectedPayrollInputs = useMemo(() => {
    if (!profileTeacher) return { leaveDays: 0, deductionPerLeaveDay: 700, bonus: 0, extraDeductions: 0, month: '2026-02' }
    const existing = payrollInputs[profileTeacher.id] || {}
    return {
      leaveDays: Number.isFinite(Number(existing.leaveDays)) ? Number(existing.leaveDays) : Number(profileTeacher.leaveDays || 0),
      deductionPerLeaveDay: Number.isFinite(Number(existing.deductionPerLeaveDay)) ? Number(existing.deductionPerLeaveDay) : 700,
      bonus: Number.isFinite(Number(existing.bonus)) ? Number(existing.bonus) : 0,
      extraDeductions: Number.isFinite(Number(existing.extraDeductions)) ? Number(existing.extraDeductions) : 0,
      month: existing.month || '2026-02',
    }
  }, [payrollInputs, profileTeacher])

  const payrollBreakup = useMemo(() => {
    if (!profileTeacher) return { base: 0, allowance: 0, bonus: 0, leaveDeduction: 0, fixedDeductions: 0, extraDeductions: 0, gross: 0, totalDeductions: 0, net: 0 }
    const base = toNumber(profileTeacher.salary)
    const allowance = toNumber(profileTeacher.allowance)
    const fixedDeductions = toNumber(profileTeacher.deductions)
    const bonus = toNumber(selectedPayrollInputs.bonus)
    const leaveDeduction = Math.max(selectedPayrollInputs.leaveDays, 0) * Math.max(selectedPayrollInputs.deductionPerLeaveDay, 0)
    const extraDeductions = toNumber(selectedPayrollInputs.extraDeductions)
    const gross = base + allowance + bonus
    const totalDeductions = fixedDeductions + leaveDeduction + extraDeductions
    const net = Math.max(gross - totalDeductions, 0)
    return { base, allowance, bonus, leaveDeduction, fixedDeductions, extraDeductions, gross, totalDeductions, net }
  }, [profileTeacher, selectedPayrollInputs])

  const currentPayslipKey = useMemo(() => {
    if (!profileTeacher) return ''
    return [
      profileTeacher.id,
      selectedPayrollInputs.month,
      selectedPayrollInputs.leaveDays,
      selectedPayrollInputs.deductionPerLeaveDay,
      selectedPayrollInputs.bonus,
      selectedPayrollInputs.extraDeductions,
      profileTeacher.salary,
      profileTeacher.allowance,
      profileTeacher.deductions,
    ].join('|')
  }, [profileTeacher, selectedPayrollInputs])

  const buildTeacherPayslipLines = () => {
    if (!profileTeacher) return []
    return [
      'Digital Teacher Payslip',
      `Month: ${selectedPayrollInputs.month}`,
      `Teacher: ${profileTeacher.name} (${profileTeacher.employeeId || profileTeacher.id})`,
      `Department: ${profileTeacher.department}`,
      `Basic: ${rs(payrollBreakup.base)}`,
      `Allowance: ${rs(payrollBreakup.allowance)}`,
      `Bonus: ${rs(payrollBreakup.bonus)}`,
      `Leave Deduction (${selectedPayrollInputs.leaveDays} day): ${rs(payrollBreakup.leaveDeduction)}`,
      `Fixed Deductions: ${rs(payrollBreakup.fixedDeductions)}`,
      `Extra Deductions: ${rs(payrollBreakup.extraDeductions)}`,
      `Gross: ${rs(payrollBreakup.gross)}`,
      `Total Deductions: ${rs(payrollBreakup.totalDeductions)}`,
      `Net Pay: ${rs(payrollBreakup.net)}`,
    ]
  }

  const generateTeacherPayslip = () => {
    if (!profileTeacher) return
    if (generatedPayslip && generatedPayslipKey === currentPayslipKey) {
      setGeneratedPayslip('')
      setGeneratedPayslipKey('')
      setActionMessage(`Digital payslip hidden for ${profileTeacher.name}.`)
      return
    }
    const lines = buildTeacherPayslipLines()
    setGeneratedPayslip(lines.join('\n'))
    setGeneratedPayslipKey(currentPayslipKey)
    setActionMessage(`Digital payslip generated for ${profileTeacher.name}. Net Pay: ${rs(payrollBreakup.net)}`)
  }

  const sendTeacherPayslip = () => {
    if (!profileTeacher) return
    const phoneDigits = normalizePhone(profileTeacher.contactNumber)
    if (phoneDigits.length < 10) {
      setActionMessage(`Cannot send payslip. Valid contact number missing for ${profileTeacher.name}.`)
      return
    }
    const text = generatedPayslip && generatedPayslipKey === currentPayslipKey
      ? generatedPayslip
      : buildTeacherPayslipLines().join('\n')
    const targetPhone = phoneDigits.length === 10 ? `91${phoneDigits}` : phoneDigits
    const whatsappUrl = `https://wa.me/${targetPhone}?text=${encodeURIComponent(text)}`
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer')
    setActionMessage(`Digital payslip opened for sending to ${profileTeacher.name} (${profileTeacher.contactNumber}).`)
  }

  const generateAllTeacherPayslips = () => {
    if (!classTeachers.length) return
    const month = selectedPayrollInputs.month
    const totalNet = classTeachers.reduce((sum, teacher) => {
      const input = payrollInputs[teacher.id] || {}
      const leaveDays = Number.isFinite(Number(input.leaveDays)) ? Number(input.leaveDays) : Number(teacher.leaveDays || 0)
      const deductionPerLeaveDay = Number.isFinite(Number(input.deductionPerLeaveDay)) ? Number(input.deductionPerLeaveDay) : 700
      const bonus = Number.isFinite(Number(input.bonus)) ? Number(input.bonus) : 0
      const extraDeductions = Number.isFinite(Number(input.extraDeductions)) ? Number(input.extraDeductions) : 0
      const gross = toNumber(teacher.salary) + toNumber(teacher.allowance) + bonus
      const totalDeductions = toNumber(teacher.deductions) + extraDeductions + (Math.max(leaveDays, 0) * Math.max(deductionPerLeaveDay, 0))
      return sum + Math.max(gross - totalDeductions, 0)
    }, 0)
    setActionMessage(`All teacher digital payslips generated for ${month}. Total Net Payroll: ${rs(totalNet)}.`)
  }

  return (
    <motion.section
      key="teacher-hub-page"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-slate-100 text-slate-800"
    >
      <div className="mx-auto max-w-7xl px-5 py-6 sm:px-8">
        <header className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700">Teacher Management</p>
              <h1 className="text-2xl font-semibold text-slate-900">Teacher Cards</h1>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                onClick={onBack}
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </header>

        {!selectedClass ? (
          <section className="space-y-4">
            <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <article className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Teachers</p>
                <p className="mt-1 text-2xl font-semibold text-slate-900">{records.length}</p>
              </article>
              <article className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-cyan-700">Class Teacher Mapped</p>
                <p className="mt-1 text-2xl font-semibold text-cyan-800">{classCards.length}</p>
              </article>
            </section>

            <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {classCards.map((item) => (
                <article key={item.className} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Class</p>
                  <h3 className="mt-1 text-xl font-semibold text-slate-900">{getClassLabel(item.className)}</h3>
                  <p className="mt-1 text-sm text-slate-600">
                    Class Teacher: {item.classTeacher} ({item.section})
                  </p>
                  <p className="text-sm text-slate-600">Subjects: {item.subjects}</p>
                  <p className="text-sm text-slate-600">Teacher Count: {item.count}</p>
                  <button
                    type="button"
                    className="mt-3 rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm font-medium text-cyan-800 hover:bg-cyan-100"
                    onClick={() => {
                      setSelectedClass(item.className)
                      setSelectedTeacherId('')
                      setProfileTeacherId('')
                      setSearchText('')
                    }}
                  >
                    View Teacher Cards
                  </button>
                </article>
              ))}
            </section>
          </section>
        ) : (
          <section className="space-y-4">
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Selected Class</p>
                  <h2 className="text-xl font-semibold text-slate-900">{getClassLabel(selectedClass)}</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="erp-nav-button"
                    onClick={() => {
                      setProfileTeacherId('')
                      setSelectedClass('')
                      setSelectedTeacherId('')
                      setSearchText('')
                    }}
                  >
                    Back to Class Cards
                  </button>
                  {profileTeacher ? (
                    <button
                      type="button"
                      className="erp-nav-button"
                      onClick={() => {
                        setProfileTeacherId('')
                      }}
                    >
                      Back to Teacher Cards
                    </button>
                  ) : null}
                </div>
              </div>

              {!profileTeacher ? (
                <div className="mt-3">
                  <label className="text-sm font-semibold text-slate-700">
                    Search Teacher
                    <input
                      type="text"
                      className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
                      value={searchText}
                      onChange={(event) => setSearchText(event.target.value)}
                      placeholder="Search by name, ID, employee ID, subject"
                    />
                  </label>

                  {searchText.trim() ? (
                    <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-2">
                      {filteredTeachers.length ? (
                        filteredTeachers.slice(0, 8).map((teacher) => (
                          <button
                            key={`search-${teacher.id}`}
                            type="button"
                            className="mb-1 block w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-left text-sm text-slate-700 hover:bg-slate-100"
                            onClick={() => {
                              setSelectedTeacherId(teacher.id)
                              setProfileTeacherId(teacher.id)
                            }}
                          >
                            {teacher.name} ({teacher.id}) - {teacher.subject}
                          </button>
                        ))
                      ) : (
                        <p className="text-sm text-slate-500">No teacher found.</p>
                      )}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </section>

            {!profileTeacher ? (
              <section className="erp-student-compact-grid">
                {filteredTeachers.map((teacher) => (
                  <article
                    key={teacher.id}
                    className={`erp-student-compact-card erp-teacher-compact-card ${selectedTeacher?.id === teacher.id ? 'erp-student-compact-card-active erp-teacher-compact-card-active' : ''}`}
                    onClick={() => setSelectedTeacherId(teacher.id)}
                  >
                    <div className="flex items-center gap-3">
                      {teacher.photoPreview ? (
                        <img src={teacher.photoPreview} alt={teacher.name} className="erp-student-compact-image rounded-full object-cover" />
                      ) : (
                        <span className="erp-student-compact-avatar">{getInitials(teacher.name)}</span>
                      )}
                      <div>
                        <p className="erp-student-compact-name">{teacher.name}</p>
                        <p className="erp-student-compact-roll">ID: {teacher.id}</p>
                        <p className="erp-student-compact-teacher">Subject: {teacher.subject}</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="erp-student-compact-action erp-teacher-profile-button"
                      onClick={(event) => {
                        event.stopPropagation()
                        setSelectedTeacherId(teacher.id)
                        setProfileTeacherId(teacher.id)
                      }}
                    >
                      View Full Profile
                    </button>
                  </article>
                ))}
                {!filteredTeachers.length ? (
                  <article className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm">No teachers found for this class.</article>
                ) : null}
              </section>
            ) : (
              <section className="erp-student-profile-page">
                <aside className="erp-student-profile-sidebar">
                  {profileTeacher.photoPreview ? (
                    <img src={profileTeacher.photoPreview} alt={profileTeacher.name} className="erp-student-profile-cover" />
                  ) : (
                    <div className="erp-student-profile-cover erp-student-profile-cover-fallback">{getInitials(profileTeacher.name)}</div>
                  )}
                  <h3>{profileTeacher.name}</h3>
                  <p>
                    {profileTeacher.classTeacherName}-{profileTeacher.classTeacherSection} | {profileTeacher.subject}
                  </p>
                  <div className="erp-student-profile-pills">
                    <span>{profileTeacher.status}</span>
                    <span>{profileTeacher.department}</span>
                    <span>{profileTeacher.experienceYears} Years</span>
                  </div>
                  <div className="erp-student-profile-actions mt-3">
                    <button type="button" className="erp-nav-button erp-nav-button-notice" onClick={() => onOpenNotice?.(profileTeacher)}>
                      Send Notice
                    </button>
                    <button type="button" className="erp-nav-button erp-nav-button-attendance" onClick={() => onOpenAttendance?.(profileTeacher, selectedClass)}>
                      View Attendance
                    </button>
                    <button type="button" className="erp-nav-button" onClick={() => openEditProfile(profileTeacher)}>
                      Edit Profile
                    </button>
                  </div>
                  {actionMessage ? <p className="erp-notice-status">{actionMessage}</p> : null}
                </aside>

                <article className="erp-student-profile-main">
                  <div className="erp-student-profile-head">
                    {profileTeacher.photoPreview ? (
                      <img src={profileTeacher.photoPreview} alt={profileTeacher.name} className="erp-student-avatar-image" />
                    ) : (
                      <span className="erp-student-avatar">{getInitials(profileTeacher.name)}</span>
                    )}
                    <div className="erp-student-info">
                      <p className="erp-student-name">{profileTeacher.name}</p>
                      <p className="erp-student-meta">
                        {profileTeacher.classTeacherName}-{profileTeacher.classTeacherSection} | ID: {profileTeacher.id}
                      </p>
                    </div>
                  </div>
                  <div className="erp-student-profile-grid">
                    {profileRows.map((row) => (
                      <span key={row.label}>
                        {row.label}: {row.value}
                      </span>
                    ))}
                  </div>
                  <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                    <h3 className="text-base font-semibold text-slate-900">Teacher Payroll and Digital Payslip</h3>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
                      <label className="text-xs font-semibold text-slate-600">Month
                        <input type="month" className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm" value={selectedPayrollInputs.month} onChange={(event) => setPayrollInputs((prev) => ({ ...prev, [profileTeacher.id]: { ...(prev[profileTeacher.id] || {}), month: event.target.value } }))} />
                      </label>
                      <label className="text-xs font-semibold text-slate-600">Leave Days
                        <input type="number" min="0" className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm" value={selectedPayrollInputs.leaveDays} onChange={(event) => setPayrollInputs((prev) => ({ ...prev, [profileTeacher.id]: { ...(prev[profileTeacher.id] || {}), leaveDays: event.target.value } }))} />
                      </label>
                      <label className="text-xs font-semibold text-slate-600">Deduction / Leave Day
                        <input type="number" min="0" className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm" value={selectedPayrollInputs.deductionPerLeaveDay} onChange={(event) => setPayrollInputs((prev) => ({ ...prev, [profileTeacher.id]: { ...(prev[profileTeacher.id] || {}), deductionPerLeaveDay: event.target.value } }))} />
                      </label>
                      <label className="text-xs font-semibold text-slate-600">Bonus
                        <input type="number" min="0" className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm" value={selectedPayrollInputs.bonus} onChange={(event) => setPayrollInputs((prev) => ({ ...prev, [profileTeacher.id]: { ...(prev[profileTeacher.id] || {}), bonus: event.target.value } }))} />
                      </label>
                      <label className="text-xs font-semibold text-slate-600">Extra Deductions
                        <input type="number" min="0" className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm" value={selectedPayrollInputs.extraDeductions} onChange={(event) => setPayrollInputs((prev) => ({ ...prev, [profileTeacher.id]: { ...(prev[profileTeacher.id] || {}), extraDeductions: event.target.value } }))} />
                      </label>
                    </div>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4 text-sm">
                      <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">Basic: <strong>{rs(payrollBreakup.base)}</strong></p>
                      <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">Allowance: <strong>{rs(payrollBreakup.allowance)}</strong></p>
                      <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">Total Deductions: <strong>{rs(payrollBreakup.totalDeductions)}</strong></p>
                      <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-emerald-900">Net Pay: <strong>{rs(payrollBreakup.net)}</strong></p>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button type="button" className="erp-nav-button erp-nav-button-attendance" onClick={generateTeacherPayslip}>
                        {generatedPayslip && generatedPayslipKey === currentPayslipKey ? 'Hide Digital Payslip' : 'Generate Digital Payslip'}
                      </button>
                      <button
                        type="button"
                        className="erp-nav-button"
                        disabled={normalizePhone(profileTeacher.contactNumber).length < 10}
                        onClick={sendTeacherPayslip}
                      >
                        Send to Number
                      </button>
                      <button type="button" className="erp-nav-button" onClick={generateAllTeacherPayslips}>
                        Generate All Class Slips
                      </button>
                    </div>
                    {generatedPayslip ? (
                      <pre className="mt-3 overflow-x-auto rounded-lg border border-slate-200 bg-slate-950 p-3 text-xs text-cyan-100">{generatedPayslip}</pre>
                    ) : null}
                  </section>
                </article>
              </section>
            )}
          </section>
        )}

        {editingTeacherId ? (
          <div className="erp-student-modal-overlay" role="dialog" aria-modal="true">
            <article className="erp-student-modal">
              <button
                type="button"
                className="erp-modal-close"
                onClick={() => {
                  setEditingTeacherId('')
                  setEditPhotoPreview('')
                  setEditError('')
                }}
              >
                Close
              </button>

              <div className="erp-modal-header">
                {editPhotoPreview ? <img src={editPhotoPreview} alt="Teacher preview" className="erp-modal-photo-image" /> : <div className="erp-modal-photo">ED</div>}
                <div>
                  <h3 className="erp-modal-name">Edit Teacher Profile</h3>
                  <p className="erp-modal-subtitle">Update details and save changes.</p>
                </div>
              </div>

              <div className="mb-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <label className="block text-xs font-semibold text-slate-600">Upload Teacher Photo</label>
                <input type="file" accept="image/*" className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" onChange={handleEditPhotoChange} />
              </div>

              <div className="erp-modal-grid">
                <article className="erp-modal-card">
                  <h4 className="erp-modal-card-title">Basic</h4>
                  <label className="block text-xs font-semibold text-slate-600">Name</label>
                  <input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={editForm.name || ''} onChange={(event) => setEditForm((prev) => ({ ...prev, name: event.target.value }))} />
                  <label className="mt-2 block text-xs font-semibold text-slate-600">Employee ID</label>
                  <input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={editForm.employeeId || ''} onChange={(event) => setEditForm((prev) => ({ ...prev, employeeId: event.target.value }))} />
                  <label className="mt-2 block text-xs font-semibold text-slate-600">Subject</label>
                  <input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={editForm.subject || ''} onChange={(event) => setEditForm((prev) => ({ ...prev, subject: event.target.value }))} />
                  <label className="mt-2 block text-xs font-semibold text-slate-600">Department</label>
                  <input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={editForm.department || ''} onChange={(event) => setEditForm((prev) => ({ ...prev, department: event.target.value }))} />
                  <label className="mt-2 block text-xs font-semibold text-slate-600">Status</label>
                  <input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={editForm.status || ''} onChange={(event) => setEditForm((prev) => ({ ...prev, status: event.target.value }))} />
                </article>

                <article className="erp-modal-card">
                  <h4 className="erp-modal-card-title">Contact</h4>
                  <label className="block text-xs font-semibold text-slate-600">Phone</label>
                  <input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={editForm.contactNumber || ''} onChange={(event) => setEditForm((prev) => ({ ...prev, contactNumber: event.target.value }))} />
                  <label className="mt-2 block text-xs font-semibold text-slate-600">Email</label>
                  <input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={editForm.email || ''} onChange={(event) => setEditForm((prev) => ({ ...prev, email: event.target.value }))} />
                  <label className="mt-2 block text-xs font-semibold text-slate-600">Qualification</label>
                  <input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={editForm.qualification || ''} onChange={(event) => setEditForm((prev) => ({ ...prev, qualification: event.target.value }))} />
                  <label className="mt-2 block text-xs font-semibold text-slate-600">Experience (Years)</label>
                  <input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={editForm.experienceYears || ''} onChange={(event) => setEditForm((prev) => ({ ...prev, experienceYears: event.target.value }))} />
                </article>

                <article className="erp-modal-card">
                  <h4 className="erp-modal-card-title">Class Mapping</h4>
                  <label className="block text-xs font-semibold text-slate-600">Class Teacher Name</label>
                  <input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={editForm.classTeacherName || ''} onChange={(event) => setEditForm((prev) => ({ ...prev, classTeacherName: event.target.value }))} />
                  <label className="mt-2 block text-xs font-semibold text-slate-600">Section</label>
                  <input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={editForm.classTeacherSection || ''} onChange={(event) => setEditForm((prev) => ({ ...prev, classTeacherSection: event.target.value }))} />
                  <label className="mt-2 block text-xs font-semibold text-slate-600">Gender</label>
                  <input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={editForm.gender || ''} onChange={(event) => setEditForm((prev) => ({ ...prev, gender: event.target.value }))} />
                  <label className="mt-2 block text-xs font-semibold text-slate-600">DOB</label>
                  <input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={editForm.dob || ''} onChange={(event) => setEditForm((prev) => ({ ...prev, dob: event.target.value }))} />
                  <label className="mt-2 block text-xs font-semibold text-slate-600">Joining Date</label>
                  <input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={editForm.joiningDate || ''} onChange={(event) => setEditForm((prev) => ({ ...prev, joiningDate: event.target.value }))} />
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
                    setEditingTeacherId('')
                    setEditPhotoPreview('')
                    setEditError('')
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

export default TeacherHubPage
