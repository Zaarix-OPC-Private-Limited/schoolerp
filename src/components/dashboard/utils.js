import { classNames, classStudentNames, classTeacherByClass } from './constants'

export const getInitials = (fullName) =>
  fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((item) => item[0]?.toUpperCase() ?? '')
    .join('')

export const formatLabel = (value) =>
  value
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((item) => item[0].toUpperCase() + item.slice(1))
    .join(' ')

export const formatDateKey = (dateObject) => {
  const year = dateObject.getFullYear()
  const month = String(dateObject.getMonth() + 1).padStart(2, '0')
  const day = String(dateObject.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const seedAttendance = (id) => {
  const seeded = {}
  const today = new Date()
  for (let offset = 0; offset < 90; offset += 1) {
    const day = new Date(today.getFullYear(), today.getMonth(), today.getDate() - offset)
    if (day.getDay() === 0) continue
    const key = formatDateKey(day)
    const score = (id.length * 13 + day.getDate() + offset) % 10
    seeded[key] = score <= 6 ? 'present' : score <= 8 ? 'absent' : 'leave'
  }
  return seeded
}

export const getAttendanceGrade = (percentage) => {
  if (percentage >= 95) return 'A+'
  if (percentage >= 90) return 'A'
  if (percentage >= 80) return 'B'
  if (percentage >= 70) return 'C'
  if (percentage >= 60) return 'D'
  return 'E'
}

export const getAttendanceSummary = (record) => {
  const counters = { present: 0, absent: 0, leave: 0 }
  Object.values(record).forEach((status) => {
    if (status && counters[status] !== undefined) {
      counters[status] += 1
    }
  })
  const total = counters.present + counters.absent + counters.leave
  const percentage = total ? Math.round((counters.present / total) * 100) : 0
  return {
    ...counters,
    total,
    percentage,
    grade: getAttendanceGrade(percentage),
  }
}

export const buildStudentsByClass = (students, studentOverrides) => {
  const seeded = classNames.reduce((accumulator, className, classIndex) => {
    const names = classStudentNames[className] ?? []
    accumulator[className] = names.map((name, studentIndex) => ({
      id: `${className}-${classIndex}-${studentIndex}`,
      name,
      rollNumber: String(classIndex * 10 + studentIndex + 1).padStart(3, '0'),
      className,
      section: String.fromCharCode(65 + (studentIndex % 3)),
      bloodGroup: ['A+', 'B+', 'O+', 'AB+'][(classIndex + studentIndex) % 4],
      busTransport: (classIndex + studentIndex) % 2 === 0 ? 'Yes' : 'No',
      fatherName: `Mr. ${name.split(' ')[1] ?? 'Guardian'}`,
      motherName: `Mrs. ${name.split(' ')[1] ?? 'Guardian'}`,
      contactNumber: `0000${String(210000 + classIndex * 100 + studentIndex).slice(-6)}`,
      emergencyContact: `0000${String(410000 + classIndex * 100 + studentIndex).slice(-6)}`,
      address: `Sector ${classIndex + 1}, Main Road`,
      admissionDate: `20${18 + (classIndex % 6)}-04-10`,
      admissionNumber: `ADM-${classIndex + 1}${String(studentIndex + 1).padStart(3, '0')}`,
      previousSchool: classIndex < 3 ? 'N/A (New Admission)' : 'School ERP',
      previousPerformance: classIndex < 3 ? 'N/A' : `${75 + ((classIndex + studentIndex) % 20)}%`,
      attendancePercent: `${88 + ((classIndex + studentIndex) % 9)}%`,
      feeStatus: (classIndex + studentIndex) % 3 === 0 ? 'Pending' : 'Paid',
      scholarship: (classIndex + studentIndex) % 4 === 0 ? 'Merit Scholarship' : 'N/A',
      dob: `20${10 + (classIndex % 5)}-0${(studentIndex % 8) + 1}-1${studentIndex % 9}`,
      gender: studentIndex % 2 === 0 ? 'Male' : 'Female',
      house: ['Ruby', 'Emerald', 'Sapphire', 'Topaz'][(classIndex + studentIndex) % 4],
      religion: (classIndex + studentIndex) % 2 === 0 ? 'Hindu' : 'Muslim',
      category: ['General', 'OBC', 'SC'][(classIndex + studentIndex) % 3],
      aadharLast4: `${(2230 + classIndex * 7 + studentIndex).toString().padStart(4, '0')}`,
      medicalNotes: studentIndex % 4 === 0 ? 'Seasonal allergy' : 'No major issues',
      siblingInfo: studentIndex % 3 === 0 ? 'Sibling enrolled' : 'No sibling in school',
      studentStatus: 'Active',
      feeCategory: 'Monthly',
      classTeacherName: classTeacherByClass[className] || 'N/A',
      totalFee: '0.00',
      paidAmount: '0.00',
      pendingAmount: '0.00',
      paymentHistory: 'N/A',
      concessionAmount: '0',
      guardianName: 'N/A',
      guardianRelation: 'N/A',
      guardianOccupation: 'N/A',
      fatherOccupation: 'N/A',
      motherOccupation: 'N/A',
      fatherContact: `0000${String(210000 + classIndex * 100 + studentIndex).slice(-6)}`,
      motherContact: `0000${String(310000 + classIndex * 100 + studentIndex).slice(-6)}`,
      fatherEmail: `${name.split(' ')[0].toLowerCase()}.father@schoolmail.com`,
      guardianAddress: 'N/A',
      parentEmail: `${name.split(' ')[0].toLowerCase()}.parent@schoolmail.com`,
      alternateContact: 'N/A',
      transportMode: 'N/A',
      busRoute: 'N/A',
      pickupPoint: 'N/A',
      driverName: 'N/A',
      driverContactNumber: 'N/A',
      vehicleNumber: 'N/A',
      photoPreview: '',
    }))
    return accumulator
  }, {})

  students.forEach((student) => {
    const className = student.className && classNames.includes(student.className) ? student.className : classNames[0]
    if (!seeded[className]) {
      seeded[className] = []
    }
    seeded[className] = [
      {
        ...student,
        id: student.id || `custom-${Date.now()}`,
        className,
        section: student.section || 'A',
        classTeacherName: student.classTeacherName || classTeacherByClass[className] || 'N/A',
        attendancePercent: student.attendancePercent || '0%',
      },
      ...seeded[className],
    ]
  })

  return Object.fromEntries(
    Object.entries(seeded).map(([className, list]) => [
      className,
      list.map((student) => (studentOverrides[student.id] ? { ...student, ...studentOverrides[student.id] } : student)),
    ]),
  )
}
