import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import CustomSelect from '../components/CustomSelect'
import { useAppContext } from '../context/AppContext'

const genderOptions = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
]

const departmentOptions = [
  { value: 'science', label: 'Science' },
  { value: 'math', label: 'Mathematics' },
  { value: 'language', label: 'Languages' },
  { value: 'social_science', label: 'Social Science' },
  { value: 'pre_primary', label: 'Pre-Primary' },
  { value: 'sports', label: 'Sports' },
  { value: 'arts', label: 'Arts' },
]

const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'on_leave', label: 'On Leave' },
  { value: 'inactive', label: 'Inactive' },
]

const employmentTypeOptions = [
  { value: 'full_time', label: 'Full Time' },
  { value: 'part_time', label: 'Part Time' },
  { value: 'contract', label: 'Contract' },
]

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

const classOptions = ['Nursery', 'LKG', 'UKG', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th'].map((item) => ({
  value: item,
  label: classLabelMap[item] || item,
}))

const sectionOptions = [
  { value: 'A', label: 'A' },
  { value: 'B', label: 'B' },
  { value: 'C', label: 'C' },
]

const formatLabel = (value) => {
  if (!value) return 'N/A'
  return value
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(' ')
}

const generateEmployeeId = () => {
  const now = Date.now().toString()
  const randomPart = Math.floor(100 + Math.random() * 900)
  return `TCH-${now.slice(-5)}${randomPart}`
}

function AddTeacherPage() {
  const navigate = useNavigate()
  const { addTeacher } = useAppContext()
  const [employeeId] = useState(generateEmployeeId)
  const [photoPreview, setPhotoPreview] = useState('')
  const [salary, setSalary] = useState('')
  const [allowance, setAllowance] = useState('')
  const [formError, setFormError] = useState('')

  const totalCompensation = useMemo(() => {
    const base = Number.parseFloat(salary || '0')
    const bonus = Number.parseFloat(allowance || '0')
    if (Number.isNaN(base) || Number.isNaN(bonus)) return ''
    return (base + bonus).toFixed(2)
  }, [salary, allowance])

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0]
    if (!file) {
      setPhotoPreview('')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setPhotoPreview(typeof reader.result === 'string' ? reader.result : '')
    }
    reader.readAsDataURL(file)
  }

  const validateTeacherForm = (formData) => {
    const requiredCustomSelects = ['gender', 'status', 'employmentType', 'department']
    for (const field of requiredCustomSelects) {
      if (!formData.get(field)?.toString().trim()) {
        return `Please select ${formatLabel(field)}.`
      }
    }

    const phoneRegex = /^[6-9]\d{9}$/
    const phone = formData.get('phoneNumber')?.toString().trim() || ''
    if (!phoneRegex.test(phone)) {
      return 'Phone Number must be a valid 10-digit mobile number.'
    }

    const emergencyPhone = formData.get('emergencyContactNumber')?.toString().trim() || ''
    if (emergencyPhone && !phoneRegex.test(emergencyPhone)) {
      return 'Emergency Contact Number must be a valid 10-digit mobile number.'
    }

    const email = formData.get('email')?.toString().trim() || ''
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return 'Please enter a valid email address.'
    }

    const dob = formData.get('dob')?.toString().trim() || ''
    const joiningDate = formData.get('joiningDate')?.toString().trim() || ''
    const today = new Date().toISOString().slice(0, 10)
    if (dob && dob > today) {
      return 'Date of Birth cannot be in the future.'
    }
    if (joiningDate && joiningDate > today) {
      return 'Date of Joining cannot be in the future.'
    }
    if (dob && joiningDate && joiningDate <= dob) {
      return 'Date of Joining must be after Date of Birth.'
    }

    const passingYear = Number.parseInt(formData.get('passingYear')?.toString().trim() || '', 10)
    const currentYear = new Date().getFullYear()
    if (!Number.isFinite(passingYear) || passingYear < 1980 || passingYear > currentYear) {
      return `Passing Year must be between 1980 and ${currentYear}.`
    }

    const baseSalary = Number.parseFloat(salary || '0')
    const extraAllowance = Number.parseFloat(allowance || '0')
    if (!Number.isFinite(baseSalary) || baseSalary < 0) {
      return 'Base Salary must be a valid non-negative number.'
    }
    if (!Number.isFinite(extraAllowance) || extraAllowance < 0) {
      return 'Allowance must be a valid non-negative number.'
    }

    return ''
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const validationMessage = validateTeacherForm(formData)
    if (validationMessage) {
      setFormError(validationMessage)
      return
    }
    setFormError('')

    const teacherPayload = {
      id: formData.get('employeeId')?.toString().trim() || `teacher-${Date.now()}`,
      employeeId: formData.get('employeeId')?.toString().trim() || 'N/A',
      name: formData.get('fullName')?.toString().trim() || 'Teacher',
      subject: formData.get('mainSubject')?.toString().trim() || 'N/A',
      classTeacherName: formData.get('classTeacherOf')?.toString().trim() || 'N/A',
      classTeacherSection: formData.get('classTeacherSection')?.toString().trim() || 'N/A',
      department: formatLabel(formData.get('department')?.toString().trim() || 'N/A'),
      qualification: formData.get('highestQualification')?.toString().trim() || 'N/A',
      experienceYears: formData.get('experienceYears')?.toString().trim() || '0',
      contactNumber: formData.get('phoneNumber')?.toString().trim() || 'N/A',
      email: formData.get('email')?.toString().trim() || 'N/A',
      dob: formData.get('dob')?.toString().trim() || 'N/A',
      gender: formatLabel(formData.get('gender')?.toString().trim() || 'N/A'),
      address: formData.get('address')?.toString().trim() || 'N/A',
      status: formData.get('status')?.toString().trim() || 'active',
      employmentType: formatLabel(formData.get('employmentType')?.toString().trim() || 'N/A'),
      joiningDate: formData.get('joiningDate')?.toString().trim() || 'N/A',
      attendancePercent: formData.get('attendancePercent')?.toString().trim() || '0%',
      leaveBalance: formData.get('leaveBalance')?.toString().trim() || '0',
      emergencyContactName: formData.get('emergencyContactName')?.toString().trim() || 'N/A',
      emergencyContactNumber: formData.get('emergencyContactNumber')?.toString().trim() || 'N/A',
      salaryGrade: formData.get('salaryGrade')?.toString().trim() || 'N/A',
      salary: salary || '0',
      allowance: allowance || '0',
      totalCompensation,
      university: formData.get('university')?.toString().trim() || 'N/A',
      passingYear: formData.get('passingYear')?.toString().trim() || 'N/A',
      certifications: formData.get('certifications')?.toString().trim() || 'N/A',
      documentsStatus: formData.get('documentsStatus')?.toString().trim() || 'Pending Verification',
      photoPreview,
    }

    addTeacher(teacherPayload)
    navigate('/teachers')
  }

  return (
    <motion.section
      key="add-teacher"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="erp-fees-shell erp-add-teacher-page min-h-screen"
    >
      <header className="erp-add-teacher-header border-b border-cyan-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700">School ERP</p>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Add Teacher</h1>
          </div>
          <button type="button" className="erp-nav-button" onClick={() => navigate(-1)}>
            ← Back
          </button>
        </div>
      </header>

      <div className="erp-add-teacher-container mx-auto w-full max-w-6xl px-5 py-8 sm:px-8">
        <form
          className="erp-form-shell erp-premium-entry-form erp-add-teacher-form"
          onSubmit={handleSubmit}
          onChange={() => {
            if (formError) setFormError('')
          }}
        >
          {formError ? <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">{formError}</p> : null}
          <p className="erp-form-quick-note">
            Fill basic details first, then role and compensation. Mandatory fields are validated before save.
          </p>
          <section className="erp-form-section">
            <h2 className="erp-form-title">Teacher Photo</h2>
            <div className="erp-student-photo-uploader">
              <div className="erp-student-photo-preview-wrap">
                {photoPreview ? <img src={photoPreview} alt="Teacher preview" className="erp-student-photo-preview" /> : <span className="erp-student-photo-placeholder">No Image</span>}
              </div>
              <label className="erp-form-field erp-form-field-full">
                <span>Upload Teacher Photo</span>
                <input name="teacherPhoto" type="file" accept="image/*" onChange={handlePhotoChange} required />
              </label>
            </div>
          </section>

          <section className="erp-form-section">
            <h2 className="erp-form-title">Basic Details</h2>
            <div className="erp-form-grid">
              <label className="erp-form-field">
                <span>Teacher Full Name</span>
                <input name="fullName" type="text" placeholder="Enter full name" required />
              </label>
              <label className="erp-form-field">
                <span>Employee ID</span>
                <input name="employeeId" type="text" value={employeeId} readOnly required />
              </label>
              <label className="erp-form-field">
                <span>Date of Birth</span>
                <input name="dob" type="date" required />
              </label>
              <label className="erp-form-field">
                <span>Gender</span>
                <CustomSelect name="gender" options={genderOptions} placeholder="Select" required />
              </label>
              <label className="erp-form-field">
                <span>Phone Number</span>
                <input name="phoneNumber" type="tel" placeholder="10 digit mobile" required />
              </label>
              <label className="erp-form-field">
                <span>Email</span>
                <input name="email" type="email" placeholder="teacher@email.com" required />
              </label>
              <label className="erp-form-field">
                <span>Status</span>
                <CustomSelect name="status" options={statusOptions} placeholder="Select" required />
              </label>
              <label className="erp-form-field">
                <span>Employment Type</span>
                <CustomSelect name="employmentType" options={employmentTypeOptions} placeholder="Select" required />
              </label>
              <label className="erp-form-field erp-form-field-full">
                <span>Address</span>
                <textarea name="address" rows={3} placeholder="Complete address" required />
              </label>
            </div>
          </section>

          <section className="erp-form-section">
            <h2 className="erp-form-title">Academic and Role</h2>
            <div className="erp-form-grid">
              <label className="erp-form-field">
                <span>Department</span>
                <CustomSelect name="department" options={departmentOptions} placeholder="Select" required />
              </label>
              <label className="erp-form-field">
                <span>Main Subject</span>
                <input name="mainSubject" type="text" placeholder="Example: Physics" required />
              </label>
              <label className="erp-form-field">
                <span>Class Teacher Of</span>
                <CustomSelect name="classTeacherOf" options={classOptions} placeholder="Select Class" />
              </label>
              <label className="erp-form-field">
                <span>Section</span>
                <CustomSelect name="classTeacherSection" options={sectionOptions} placeholder="Select Section" />
              </label>
              <label className="erp-form-field">
                <span>Experience (Years)</span>
                <input name="experienceYears" type="number" min="0" placeholder="0" required />
              </label>
              <label className="erp-form-field">
                <span>Date of Joining</span>
                <input name="joiningDate" type="date" required />
              </label>
              <label className="erp-form-field">
                <span>Attendance Percentage</span>
                <input name="attendancePercent" type="text" placeholder="Example: 96%" />
              </label>
              <label className="erp-form-field">
                <span>Leave Balance (Days)</span>
                <input name="leaveBalance" type="number" min="0" placeholder="0" />
              </label>
            </div>
          </section>

          <section className="erp-form-section">
            <h2 className="erp-form-title">Qualification</h2>
            <div className="erp-form-grid">
              <label className="erp-form-field">
                <span>Highest Qualification</span>
                <input name="highestQualification" type="text" placeholder="M.Ed / M.Sc / B.Ed etc." required />
              </label>
              <label className="erp-form-field">
                <span>University / Institute</span>
                <input name="university" type="text" placeholder="University name" required />
              </label>
              <label className="erp-form-field">
                <span>Passing Year</span>
                <input name="passingYear" type="number" min="1980" max="2099" placeholder="YYYY" required />
              </label>
              <label className="erp-form-field">
                <span>Certification Details</span>
                <input name="certifications" type="text" placeholder="CTET / TET / Other certifications" />
              </label>
            </div>
          </section>

          <section className="erp-form-section">
            <h2 className="erp-form-title">Contact and Compensation</h2>
            <div className="erp-form-grid">
              <label className="erp-form-field">
                <span>Emergency Contact Name</span>
                <input name="emergencyContactName" type="text" placeholder="Emergency contact person" />
              </label>
              <label className="erp-form-field">
                <span>Emergency Contact Number</span>
                <input name="emergencyContactNumber" type="tel" placeholder="Emergency number" />
              </label>
              <label className="erp-form-field">
                <span>Salary Grade</span>
                <input name="salaryGrade" type="text" placeholder="Example: Grade A" />
              </label>
              <label className="erp-form-field">
                <span>Base Salary</span>
                <input type="number" min="0" step="0.01" value={salary} onChange={(event) => setSalary(event.target.value)} placeholder="Enter salary" />
              </label>
              <label className="erp-form-field">
                <span>Allowance</span>
                <input type="number" min="0" step="0.01" value={allowance} onChange={(event) => setAllowance(event.target.value)} placeholder="Enter allowance" />
              </label>
              <label className="erp-form-field">
                <span>Total Compensation</span>
                <input type="text" value={totalCompensation} readOnly placeholder="Auto calculated" />
              </label>
            </div>
          </section>

          <section className="erp-form-section">
            <h2 className="erp-form-title">Documents</h2>
            <div className="erp-form-grid">
              <label className="erp-form-field">
                <span>Qualification Certificates</span>
                <input name="qualificationCertificates" type="file" accept=".pdf,.jpg,.jpeg,.png" required />
              </label>
              <label className="erp-form-field">
                <span>ID Proof</span>
                <input name="idProof" type="file" accept=".pdf,.jpg,.jpeg,.png" required />
              </label>
              <label className="erp-form-field">
                <span>Resume</span>
                <input name="resume" type="file" accept=".pdf,.doc,.docx" />
              </label>
              <label className="erp-form-field">
                <span>Documents Status</span>
                <input name="documentsStatus" type="text" placeholder="Verified / Pending Verification" />
              </label>
            </div>
          </section>

          <div className="erp-form-actions erp-form-actions-sticky">
            <button type="submit" className="erp-form-primary-button">
              Save Teacher
            </button>
          </div>
        </form>
      </div>
    </motion.section>
  )
}

export default AddTeacherPage


