import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import CustomSelect from '../components/CustomSelect'
import { useAppContext } from '../context/AppContext'

const input = "w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 transition-colors placeholder:text-slate-400 hover:border-slate-400 focus:border-cyan-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-cyan-500/10";
const textarea = "w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 transition-colors placeholder:text-slate-400 hover:border-slate-400 focus:border-cyan-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-cyan-500/10";
const label = "flex flex-col gap-2";
const labelText = "text-sm font-semibold text-slate-700";
const grid = "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3";
const section = "mb-10 border-b border-slate-100 pb-10 last:border-0 last:pb-0";
const sectionTitle = "mb-6 text-lg font-bold tracking-tight text-slate-800 flex items-center gap-3 before:h-6 before:w-1.5 before:rounded-full before:bg-cyan-500";
const submitBtn = "rounded-xl bg-cyan-600 px-8 py-3.5 font-bold text-white shadow-md transition-all hover:bg-cyan-700 hover:shadow-lg hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-cyan-500/30 active:translate-y-0";

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

// classOptions moved inside component for dynamic classRecords support

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
  const { addTeacher, classRecords = [] } = useAppContext()

  const dynamicClassOptions = useMemo(() => {
    const options = [{ value: 'none', label: 'None' }]
    const dbOptions = classRecords.map((cls) => ({
      value: cls.name, // Or cls.id if you prefer, but name is used in model
      label: `${cls.name} - ${cls.section}`,
    }))
    return [...options, ...dbOptions]
  }, [classRecords])
  const [employeeId] = useState(generateEmployeeId)
  const [photoPreview, setPhotoPreview] = useState('')
  const [qualCertPreview, setQualCertPreview] = useState('')
  const [idProofPreview, setIdProofPreview] = useState('')
  const [resumePreview, setResumePreview] = useState('')
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

  const handleFileChange = (event, setter) => {
    const file = event.target.files?.[0]
    if (!file) {
      setter('')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setter(typeof reader.result === 'string' ? reader.result : '')
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

    const isValidMobile = (num) => {
      const clean = num.replace(/\D/g, '')
      if (clean.length === 10) return /^[6-9]\d{9}$/.test(clean)
      if (clean.length === 11) return /^0[6-9]\d{9}$/.test(clean)
      if (clean.length === 12) return /^91[6-9]\d{9}$/.test(clean)
      return false
    }

    const phone = formData.get('phoneNumber')?.toString().trim() || ''
    if (!isValidMobile(phone)) {
      return 'Phone Number must be a valid mobile number.'
    }

    const emergencyPhone = formData.get('emergencyContactNumber')?.toString().trim() || ''
    if (emergencyPhone && !isValidMobile(emergencyPhone)) {
      return 'Emergency Contact Number must be a valid mobile number.'
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

  const handleSubmit = async (event) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const validationMessage = validateTeacherForm(formData)
    if (validationMessage) {
      setFormError(validationMessage)
      return
    }
    setFormError('')

    // 1-to-1 Mapping to Teacher.js Model
    const teacherPayload = {
      // Assuming context handles userId and schoolId
      id: formData.get('employeeId')?.toString().trim() || `teacher-${Date.now()}`,
      employeeId: formData.get('employeeId')?.toString().trim() || 'N/A',

      // Basic Details
      dob: formData.get('dob')?.toString().trim() || 'N/A',
      gender: formatLabel(formData.get('gender')?.toString().trim() || 'N/A'),
      phoneNumber: formData.get('phoneNumber')?.toString().trim() || 'N/A',
      status: formData.get('status')?.toString().trim() || 'active',
      employmentType: formatLabel(formData.get('employmentType')?.toString().trim() || 'N/A'),
      address: formData.get('address')?.toString().trim() || 'N/A',

      // Academic & Role
      department: formatLabel(formData.get('department')?.toString().trim() || 'N/A'),
      subject: formData.get('mainSubject')?.toString().trim() || 'N/A',
      classTeacherName: formData.get('classTeacherOf')?.toString().trim() === 'none' ? 'N/A' : (formData.get('classTeacherOf')?.toString().trim() || 'N/A'),
      classTeacherSection: formData.get('classTeacherOf')?.toString().trim() === 'none' ? 'N/A' : (formData.get('classTeacherSection')?.toString().trim() || 'N/A'),
      experienceYears: Number(formData.get('experienceYears') || 0),
      joiningDate: formData.get('joiningDate')?.toString().trim() || 'N/A',
      attendancePercent: formData.get('attendancePercent')?.toString().trim() || '0%',
      leaveBalance: Number(formData.get('leaveBalance') || 0),

      // Qualification
      qualification: formData.get('highestQualification')?.toString().trim() || 'N/A',
      university: formData.get('university')?.toString().trim() || 'N/A',
      passingYear: Number(formData.get('passingYear') || 0),
      certifications: formData.get('certifications')?.toString().trim() || 'N/A',

      // Contact & Compensation
      emergencyContactName: formData.get('emergencyContactName')?.toString().trim() || 'N/A',
      emergencyContactNumber: formData.get('emergencyContactNumber')?.toString().trim() || 'N/A',
      salaryGrade: formData.get('salaryGrade')?.toString().trim() || 'N/A',
      salary: Number(salary || 0),
      allowance: Number(allowance || 0),
      totalCompensation: Number(totalCompensation || 0),

      documentsStatus: formData.get('documentsStatus')?.toString().trim() || 'Pending Verification',
      photoPreview,
      qualificationCertificates: qualCertPreview,
      idProof: idProofPreview,
      resume: resumePreview,

      // Also sending `name` mapping to `fullName` because we originally had a `name` field in UI lists.
      name: formData.get('fullName')?.toString().trim() || 'Teacher',
      email: formData.get('email')?.toString().trim() || 'N/A',
    }

    try {
      await addTeacher(teacherPayload)
      alert('Teacher successfully created!')
      navigate('/teachers')
    } catch (error) {
      setFormError(error.message || 'Failed to save teacher')
    }
  }

  return (
    <motion.section
      key="add-teacher"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="min-h-screen bg-slate-50 text-slate-900 relative"
    >
      <header className="border-b border-slate-200 bg-white shadow-sm sticky top-0 z-10">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700">School ERP</p>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Add Teacher</h1>
          </div>
          <button type="button" className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors" onClick={() => navigate(-1)}>
            ← Back
          </button>
        </div>
      </header>

      <div className="mx-auto w-full max-w-5xl px-5 py-10">
        <form
          className="rounded-2xl border border-slate-200 bg-white p-8 shadow-xl"
          onSubmit={handleSubmit}
          onChange={() => {
            if (formError) setFormError('')
          }}
        >
          {formError ? <p className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">{formError}</p> : null}
          <p className="mb-8 text-sm text-slate-500">
            Fill basic details first, then role and compensation. Mandatory fields are validated before save.
          </p>
          <section className={section}>
            <h2 className={sectionTitle}>Teacher Photo</h2>
            <div className="flex gap-6 items-center">
              <div className="h-28 w-28 overflow-hidden rounded-xl border bg-slate-100 flex items-center justify-center">
                {photoPreview ? <img src={photoPreview} alt="Teacher preview" className="h-full w-full object-cover" /> : <span className="text-slate-400 text-sm">No Image</span>}
              </div>
              <label className={label}>
                <span className={labelText}>Upload Teacher Photo</span>
                <input name="teacherPhoto" type="file" accept="image/*" onChange={handlePhotoChange} required className="block text-sm" />
              </label>
            </div>
          </section>

          <section className={section}>
            <h2 className={sectionTitle}>Basic Details</h2>
            <div className={grid}>
              <label className={label}>
                <span className={labelText}>Teacher Full Name</span>
                <input name="fullName" type="text" placeholder="Enter full name" className={input} required />
              </label>
              <label className={label}>
                <span className={labelText}>Employee ID</span>
                <input name="employeeId" type="text" value={employeeId} className={input} readOnly required />
              </label>
              <label className={label}>
                <span className={labelText}>Date of Birth</span>
                <input name="dob" type="date" className={input} required />
              </label>
              <label className={label}>
                <span className={labelText}>Gender</span>
                <CustomSelect name="gender" options={genderOptions} placeholder="Select" required />
              </label>
              <label className={label}>
                <span className={labelText}>Phone Number</span>
                <input name="phoneNumber" type="tel" placeholder="10 digit mobile" className={input} required />
              </label>
              <label className={label}>
                <span className={labelText}>Email</span>
                <input name="email" type="email" placeholder="teacher@email.com" className={input} required />
              </label>
              <label className={label}>
                <span className={labelText}>Status</span>
                <CustomSelect name="status" options={statusOptions} placeholder="Select" required />
              </label>
              <label className={label}>
                <span className={labelText}>Employment Type</span>
                <CustomSelect name="employmentType" options={employmentTypeOptions} placeholder="Select" required />
              </label>
              <label className={`${label} sm:col-span-2 lg:col-span-3`}>
                <span className={labelText}>Address</span>
                <textarea name="address" rows={2} placeholder="Complete address" className={textarea} required />
              </label>
            </div>
          </section>

          <section className={section}>
            <h2 className={sectionTitle}>Academic and Role</h2>
            <div className={grid}>
              <label className={label}>
                <span className={labelText}>Department</span>
                <CustomSelect name="department" options={departmentOptions} placeholder="Select" required />
              </label>
              <label className={label}>
                <span className={labelText}>Main Subject</span>
                <input name="mainSubject" type="text" placeholder="Example: Physics" className={input} required />
              </label>
              <label className={label}>
                <span className={labelText}>Class Teacher Of</span>
                <CustomSelect name="classTeacherOf" options={dynamicClassOptions} placeholder="Select Class" />
              </label>
              <label className={label}>
                <span className={labelText}>Section</span>
                <CustomSelect name="classTeacherSection" options={sectionOptions} placeholder="Select Section" />
              </label>
              <label className={label}>
                <span className={labelText}>Experience (Years)</span>
                <input name="experienceYears" type="number" min="0" placeholder="0" className={input} required />
              </label>
              <label className={label}>
                <span className={labelText}>Date of Joining</span>
                <input name="joiningDate" type="date" className={input} required />
              </label>
              <label className={label}>
                <span className={labelText}>Attendance Percentage</span>
                <input name="attendancePercent" type="text" placeholder="Example: 96%" className={input} />
              </label>
              <label className={label}>
                <span className={labelText}>Leave Balance (Days)</span>
                <input name="leaveBalance" type="number" min="0" placeholder="0" className={input} />
              </label>
            </div>
          </section>

          <section className={section}>
            <h2 className={sectionTitle}>Qualification</h2>
            <div className={grid}>
              <label className={label}>
                <span className={labelText}>Highest Qualification</span>
                <input name="highestQualification" type="text" placeholder="M.Ed / M.Sc / B.Ed etc." className={input} required />
              </label>
              <label className={label}>
                <span className={labelText}>University / Institute</span>
                <input name="university" type="text" placeholder="University name" className={input} required />
              </label>
              <label className={label}>
                <span className={labelText}>Passing Year</span>
                <input name="passingYear" type="number" min="1980" max="2099" placeholder="YYYY" className={input} required />
              </label>
              <label className={label}>
                <span className={labelText}>Certification Details</span>
                <input name="certifications" type="text" placeholder="CTET / TET / Other certifications" className={input} />
              </label>
            </div>
          </section>

          <section className={section}>
            <h2 className={sectionTitle}>Contact and Compensation</h2>
            <div className={grid}>
              <label className={label}>
                <span className={labelText}>Emergency Contact Name</span>
                <input name="emergencyContactName" type="text" placeholder="Emergency contact person" className={input} />
              </label>
              <label className={label}>
                <span className={labelText}>Emergency Contact Number</span>
                <input name="emergencyContactNumber" type="tel" placeholder="Emergency number" className={input} />
              </label>
              <label className={label}>
                <span className={labelText}>Salary Grade</span>
                <input name="salaryGrade" type="text" placeholder="Example: Grade A" className={input} />
              </label>
              <label className={label}>
                <span className={labelText}>Base Salary</span>
                <input type="number" min="0" step="0.01" value={salary} onChange={(event) => setSalary(event.target.value)} placeholder="Enter salary" className={input} />
              </label>
              <label className={label}>
                <span className={labelText}>Allowance</span>
                <input type="number" min="0" step="0.01" value={allowance} onChange={(event) => setAllowance(event.target.value)} placeholder="Enter allowance" className={input} />
              </label>
              <label className={label}>
                <span className={labelText}>Total Compensation (Auto Calculated)</span>
                <input type="text" value={totalCompensation} readOnly placeholder="Auto calculated" className={`${input} bg-slate-100 font-bold`} />
              </label>
            </div>
          </section>

          <section className={section}>
            <h2 className={sectionTitle}>Documents</h2>
            <div className={grid}>
              <label className={label}>
                <span className={labelText}>Qualification Certificates</span>
                <input name="qualificationCertificates" type="file" accept=".pdf,.jpg,.jpeg,.png" className="block text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-cyan-50 file:text-cyan-700 hover:file:bg-cyan-100" onChange={(e) => handleFileChange(e, setQualCertPreview)} />
              </label>
              <label className={label}>
                <span className={labelText}>ID Proof</span>
                <input name="idProof" type="file" accept=".pdf,.jpg,.jpeg,.png" className="block text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-cyan-50 file:text-cyan-700 hover:file:bg-cyan-100" onChange={(e) => handleFileChange(e, setIdProofPreview)} />
              </label>
              <label className={label}>
                <span className={labelText}>Resume</span>
                <input name="resume" type="file" accept=".pdf,.doc,.docx" className="block text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-cyan-50 file:text-cyan-700 hover:file:bg-cyan-100" onChange={(e) => handleFileChange(e, setResumePreview)} />
              </label>
              <label className={label}>
                <span className={labelText}>Documents Status</span>
                <input name="documentsStatus" type="text" placeholder="Verified / Pending Verification" className={input} />
              </label>
            </div>
          </section>

          <div className="flex justify-end pt-6">
            <button type="submit" className={submitBtn}>
              Save Teacher
            </button>
          </div>
        </form>
      </div>
    </motion.section>
  )
}

export default AddTeacherPage


