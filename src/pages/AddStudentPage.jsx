import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import CustomSelect from '../components/CustomSelect'
import { useAppContext } from '../context/AppContext'

const classOptions = ['Nursery', 'LKG', 'UKG', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th']
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
const genderOptions = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
]
const bloodGroupOptions = [
  { value: 'A+', label: 'A+' },
  { value: 'A-', label: 'A-' },
  { value: 'B+', label: 'B+' },
  { value: 'B-', label: 'B-' },
  { value: 'AB+', label: 'AB+' },
  { value: 'AB-', label: 'AB-' },
  { value: 'O+', label: 'O+' },
  { value: 'O-', label: 'O-' },
]
const categoryOptions = [
  { value: 'general', label: 'General' },
  { value: 'obc', label: 'OBC' },
  { value: 'sc', label: 'SC' },
  { value: 'st', label: 'ST' },
]
const religionOptions = [
  { value: 'hindu', label: 'Hindu' },
  { value: 'muslim', label: 'Muslim' },
  { value: 'sikh', label: 'Sikh' },
  { value: 'christian', label: 'Christian' },
  { value: 'other', label: 'Other' },
]
const currentStatusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'left', label: 'Left School' },
  { value: 'alumni', label: 'Alumni' },
]
const transportModeOptions = [
  { value: 'school_bus', label: 'School Bus' },
  { value: 'van', label: 'Van' },
  { value: 'self', label: 'Self / Pick & Drop' },
  { value: 'walk', label: 'Walk' },
]
const feeCategoryOptions = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'half-yearly', label: 'Half-Yearly' },
  { value: 'annual', label: 'Annual' },
]
const concessionOptions = [
  { value: 'none', label: 'None' },
  { value: 'merit', label: 'Merit Scholarship' },
  { value: 'sports', label: 'Sports Scholarship' },
  { value: 'sibling', label: 'Sibling Concession' },
  { value: 'staff-child', label: 'Staff Child Concession' },
  { value: 'economically-weaker', label: 'Economically Weaker Section' },
]
const classDropdownOptions = classOptions.map((className) => ({ value: className, label: classLabelMap[className] || className }))

const generateAdmissionNumber = () => {
  const now = Date.now().toString()
  const randomPart = Math.floor(100 + Math.random() * 900)
  return `ADM-${now.slice(-6)}${randomPart}`
}

const formatLabel = (value) => {
  if (!value) return 'N/A'
  return value
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(' ')
}

function AddStudentPage() {
  const navigate = useNavigate()
  const { addStudent } = useAppContext()
  const [selectedClass, setSelectedClass] = useState('')
  const [admissionNumber] = useState(generateAdmissionNumber)
  const [totalFee, setTotalFee] = useState('')
  const [paidAmount, setPaidAmount] = useState('')
  const [photoPreview, setPhotoPreview] = useState('')
  const [formError, setFormError] = useState('')

  const marksheetHelpText = useMemo(
    () =>
      selectedClass === '12th'
        ? '10th marksheet is required for Class 12 admission.'
        : 'If available, you can upload the previous class result/marksheet.',
    [selectedClass],
  )

  const pendingAmount = useMemo(() => {
    const total = Number.parseFloat(totalFee || '0')
    const paid = Number.parseFloat(paidAmount || '0')
    if (Number.isNaN(total) || Number.isNaN(paid)) {
      return ''
    }
    return Math.max(total - paid, 0).toFixed(2)
  }, [totalFee, paidAmount])

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

  const validateStudentForm = (formData) => {
    const requiredCustomSelects = ['gender', 'bloodGroup', 'category', 'religion', 'studentStatus', 'className', 'transportMode', 'feeCategory']
    for (const field of requiredCustomSelects) {
      if (!formData.get(field)?.toString().trim()) {
        return `Please select ${formatLabel(field)}.`
      }
    }

    const phoneFields = [
      ['fatherContact', 'Father Contact Number'],
      ['motherContact', 'Mother Contact Number'],
      ['guardianContact', 'Guardian Contact Number'],
      ['emergencyContactNumber', 'Emergency Contact Number'],
    ]
    const phoneRegex = /^[6-9]\d{9}$/
    for (const [field, label] of phoneFields) {
      const value = formData.get(field)?.toString().trim() || ''
      if (!phoneRegex.test(value)) {
        return `${label} must be a valid 10-digit mobile number.`
      }
    }

    const optionalPhoneFields = [
      ['driverContactNumber', 'Driver Contact Number'],
    ]
    for (const [field, label] of optionalPhoneFields) {
      const value = formData.get(field)?.toString().trim() || ''
      if (value && !phoneRegex.test(value)) {
        return `${label} must be a valid 10-digit mobile number.`
      }
    }

    const aadhaar = formData.get('aadhaar')?.toString().trim() || ''
    if (aadhaar && !/^\d{12}$/.test(aadhaar)) {
      return 'Aadhaar must be exactly 12 digits.'
    }

    const email = formData.get('fatherEmail')?.toString().trim() || ''
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return 'Father Email is not valid.'
    }

    const dob = formData.get('dob')?.toString().trim() || ''
    const admissionDate = formData.get('admissionDate')?.toString().trim() || ''
    const today = new Date().toISOString().slice(0, 10)
    if (dob && dob > today) {
      return 'Date of Birth cannot be in the future.'
    }
    if (admissionDate && admissionDate > today) {
      return 'Admission Date cannot be in the future.'
    }
    if (dob && admissionDate && dob >= admissionDate) {
      return 'Admission Date must be after Date of Birth.'
    }

    const total = Number.parseFloat(totalFee || '0')
    const paid = Number.parseFloat(paidAmount || '0')
    if (!Number.isFinite(total) || total < 0) {
      return 'Total Fee must be a valid non-negative number.'
    }
    if (!Number.isFinite(paid) || paid < 0) {
      return 'Paid Amount must be a valid non-negative number.'
    }
    if (paid > total) {
      return 'Paid Amount cannot be greater than Total Fee.'
    }

    if (selectedClass === '12th') {
      const tenthMarksheet = formData.get('tenthMarksheet')
      if (!(tenthMarksheet instanceof File) || tenthMarksheet.size === 0) {
        return '10th Marksheet is required for Class 12 admission.'
      }
    }

    return ''
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const validationMessage = validateStudentForm(formData)
    if (validationMessage) {
      setFormError(validationMessage)
      return
    }
    setFormError('')

    const total = Number.parseFloat(totalFee || '0')
    const paid = Number.parseFloat(paidAmount || '0')
    const nextPending = Math.max((Number.isNaN(total) ? 0 : total) - (Number.isNaN(paid) ? 0 : paid), 0)

    const studentPayload = {
      id: `custom-${Date.now()}`,
      name: formData.get('fullName')?.toString().trim() || 'New Student',
      rollNumber: formData.get('rollNumber')?.toString().trim() || '000',
      className: formData.get('className')?.toString().trim() || selectedClass || 'N/A',
      section: formData.get('section')?.toString().trim() || 'A',
      bloodGroup: formData.get('bloodGroup')?.toString().trim() || 'N/A',
      busTransport: formData.get('transportMode')?.toString() ? 'Yes' : 'No',
      fatherName: formData.get('fatherName')?.toString().trim() || 'N/A',
      fatherEmail: formData.get('fatherEmail')?.toString().trim() || 'N/A',
      motherName: formData.get('motherName')?.toString().trim() || 'N/A',
      guardianName: formData.get('guardianName')?.toString().trim() || 'N/A',
      guardianRelation: formData.get('guardianRelation')?.toString().trim() || 'N/A',
      fatherOccupation: formData.get('fatherOccupation')?.toString().trim() || 'N/A',
      motherOccupation: formData.get('motherOccupation')?.toString().trim() || 'N/A',
      guardianOccupation: formData.get('guardianOccupation')?.toString().trim() || 'N/A',
      contactNumber: formData.get('fatherContact')?.toString().trim() || 'N/A',
      fatherContact: formData.get('fatherContact')?.toString().trim() || 'N/A',
      motherContact: formData.get('motherContact')?.toString().trim() || 'N/A',
      guardianContact: formData.get('guardianContact')?.toString().trim() || 'N/A',
      emergencyContact: formData.get('emergencyContactNumber')?.toString().trim() || 'N/A',
      emergencyContactName: 'N/A',
      emergencyContactRelation: 'N/A',
      address: formData.get('address')?.toString().trim() || 'N/A',
      admissionDate: formData.get('admissionDate')?.toString().trim() || 'N/A',
      admissionNumber,
      previousSchool: formData.get('previousSchoolName')?.toString().trim() || 'N/A',
      previousPerformance: formData.get('lastClassPassed')?.toString().trim() || 'N/A',
      attendancePercent: '0%',
      feeStatus: nextPending > 0 ? 'Pending' : 'Paid',
      scholarship: formatLabel(formData.get('scholarshipType')?.toString().trim() || 'none'),
      dob: formData.get('dob')?.toString().trim() || 'N/A',
      gender: formatLabel(formData.get('gender')?.toString().trim() || 'N/A'),
      house: 'N/A',
      religion: formatLabel(formData.get('religion')?.toString().trim() || 'N/A'),
      category: formatLabel(formData.get('category')?.toString().trim() || 'N/A'),
      aadharLast4: (formData.get('aadhaar')?.toString().trim() || '').slice(-4) || 'N/A',
      medicalNotes: 'No major issues',
      siblingInfo: 'N/A',
      studentStatus: formatLabel(formData.get('studentStatus')?.toString().trim() || 'N/A'),
      feeCategory: formatLabel(formData.get('feeCategory')?.toString().trim() || 'N/A'),
      totalFee: total.toFixed(2),
      paidAmount: paid.toFixed(2),
      pendingAmount: nextPending.toFixed(2),
      paymentHistory: formData.get('paymentHistory')?.toString().trim() || 'N/A',
      concessionAmount: formData.get('scholarshipAmount')?.toString().trim() || '0',
      guardianAddress: 'N/A',
      parentEmail: formData.get('fatherEmail')?.toString().trim() || 'N/A',
      alternateContact: 'N/A',
      transportMode: formatLabel(formData.get('transportMode')?.toString().trim() || 'N/A'),
      busRoute: formData.get('busRoute')?.toString().trim() || 'N/A',
      pickupPoint: formData.get('pickupPoint')?.toString().trim() || 'N/A',
      driverName: formData.get('driverName')?.toString().trim() || 'N/A',
      driverContactNumber: formData.get('driverContactNumber')?.toString().trim() || 'N/A',
      vehicleNumber: formData.get('vehicleNumber')?.toString().trim() || 'N/A',
      photoPreview,
    }

    try {
      await addStudent(studentPayload)
      alert('Student successfully created!')
      navigate('/students')
    } catch (error) {
      setFormError(error.message || 'Failed to save student')
    }
  }

  return (
    <motion.section
      key="add-student"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="erp-add-student-page min-h-screen"
    >
      <header className="erp-add-student-header border-b border-cyan-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700">School ERP</p>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Add Student</h1>
          </div>
          <button type="button" className="erp-nav-button" onClick={() => navigate(-1)}>
            ← Back
          </button>
        </div>
      </header>

      <div className="erp-add-student-container mx-auto w-full max-w-6xl px-5 py-8 sm:px-8">
        <form
          className="erp-form-shell erp-premium-entry-form erp-add-student-form"
          onSubmit={handleSubmit}
          onChange={() => {
            if (formError) setFormError('')
          }}
        >
          {formError ? <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">{formError}</p> : null}
          <p className="erp-form-quick-note">
            Start with photo and personal details first. Save will work once mandatory fields are completed.
          </p>
          <section className="erp-form-section">
            <h2 className="erp-form-title">Student Profile Photo</h2>
            <div className="erp-student-photo-uploader">
              <div className="erp-student-photo-preview-wrap">
                {photoPreview ? <img src={photoPreview} alt="Student preview" className="erp-student-photo-preview" /> : <span className="erp-student-photo-placeholder">No Image</span>}
              </div>
              <label className="erp-form-field erp-form-field-full">
                <span>Upload Student Photo</span>
                <input name="studentPhoto" type="file" accept="image/*" onChange={handlePhotoChange} required />
              </label>
            </div>
          </section>

          <section className="erp-form-section">
            <h2 className="erp-form-title">Personal Details</h2>
            <div className="erp-form-grid">
              <label className="erp-form-field">
                <span>Student Full Name</span>
                <input name="fullName" type="text" placeholder="Enter full name" required />
              </label>

              <label className="erp-form-field">
                <span>Admission Number</span>
                <input name="admissionNumber" type="text" value={admissionNumber} readOnly required />
              </label>

              <label className="erp-form-field">
                <span>Roll Number</span>
                <input name="rollNumber" type="text" placeholder="Enter roll number" required />
              </label>

              <label className="erp-form-field">
                <span>Section</span>
                <input name="section" type="text" placeholder="A / B / C" />
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
                <span>Blood Group</span>
                <CustomSelect name="bloodGroup" options={bloodGroupOptions} placeholder="Select" required />
              </label>

              <label className="erp-form-field">
                <span>Category</span>
                <CustomSelect name="category" options={categoryOptions} placeholder="Select" required />
              </label>

              <label className="erp-form-field">
                <span>Religion</span>
                <CustomSelect name="religion" options={religionOptions} placeholder="Select" required />
              </label>

              <label className="erp-form-field">
                <span>Aadhaar Number (Optional)</span>
                <input name="aadhaar" type="text" inputMode="numeric" maxLength={12} placeholder="12 digit Aadhaar" />
              </label>

              <label className="erp-form-field">
                <span>Admission Date</span>
                <input name="admissionDate" type="date" required />
              </label>

              <label className="erp-form-field">
                <span>Current Status</span>
                <CustomSelect name="studentStatus" options={currentStatusOptions} placeholder="Select" required />
              </label>

              <label className="erp-form-field">
                <span>Class Applying For</span>
                <CustomSelect name="className" options={classDropdownOptions} value={selectedClass} onChange={setSelectedClass} placeholder="Select Class" required />
              </label>

              <label className="erp-form-field erp-form-field-full">
                <span>Address</span>
                <textarea name="address" rows={3} placeholder="Complete address" required />
              </label>
            </div>
          </section>

          <section className="erp-form-section">
            <h2 className="erp-form-title">Parent and Guardian Details</h2>
            <div className="erp-form-grid">
              <label className="erp-form-field">
                <span>Father Full Name</span>
                <input name="fatherName" type="text" placeholder="Father full name" required />
              </label>

              <label className="erp-form-field">
                <span>Father Contact Number</span>
                <input name="fatherContact" type="tel" placeholder="10 digit mobile" required />
              </label>

              <label className="erp-form-field">
                <span>Father Email</span>
                <input name="fatherEmail" type="email" placeholder="father@email.com" required />
              </label>

              <label className="erp-form-field">
                <span>Mother Full Name</span>
                <input name="motherName" type="text" placeholder="Mother full name" required />
              </label>

              <label className="erp-form-field">
                <span>Mother Contact Number</span>
                <input name="motherContact" type="tel" placeholder="10 digit mobile" required />
              </label>

              <label className="erp-form-field">
                <span>Guardian Full Name</span>
                <input name="guardianName" type="text" placeholder="Guardian full name" required />
              </label>

              <label className="erp-form-field">
                <span>Guardian Relation</span>
                <input name="guardianRelation" type="text" placeholder="Uncle / Aunt / Grandparent etc." required />
              </label>

              <label className="erp-form-field">
                <span>Guardian Contact Number</span>
                <input name="guardianContact" type="tel" placeholder="10 digit mobile" required />
              </label>

              <label className="erp-form-field">
                <span>Emergency Contact Number</span>
                <input name="emergencyContactNumber" type="tel" placeholder="Emergency contact mobile number" required />
              </label>
            </div>
          </section>

          <section className="erp-form-section">
            <h2 className="erp-form-title">Transport Details</h2>
            <div className="erp-form-grid">
              <label className="erp-form-field">
                <span>Mode of Transport</span>
                <CustomSelect name="transportMode" options={transportModeOptions} placeholder="Select" required />
              </label>
              <label className="erp-form-field">
                <span>Bus Route</span>
                <input name="busRoute" type="text" placeholder="Route number / route name" />
              </label>
              <label className="erp-form-field">
                <span>Pickup Point</span>
                <input name="pickupPoint" type="text" placeholder="Pickup point location" />
              </label>
              <label className="erp-form-field">
                <span>Driver Name</span>
                <input name="driverName" type="text" placeholder="Assigned driver name" />
              </label>
              <label className="erp-form-field">
                <span>Driver Contact Number</span>
                <input name="driverContactNumber" type="tel" placeholder="Driver contact number" />
              </label>
              <label className="erp-form-field">
                <span>Vehicle Number</span>
                <input name="vehicleNumber" type="text" placeholder="Bus / van number" />
              </label>
            </div>
          </section>

          <section className="erp-form-section">
            <h2 className="erp-form-title">Previous School History</h2>
            <div className="erp-form-grid">
              <label className="erp-form-field">
                <span>Previous School Name</span>
                <input name="previousSchoolName" type="text" placeholder="Previous school name" />
              </label>
              <label className="erp-form-field">
                <span>Last Class Passed</span>
                <input name="lastClassPassed" type="text" placeholder="Example: 10th" />
              </label>
              <label className="erp-form-field">
                <span>Previous School Board</span>
                <input name="previousSchoolBoard" type="text" placeholder="CBSE / ICSE / State Board" />
              </label>
              <label className="erp-form-field">
                <span>Transfer Certificate Number</span>
                <input name="transferCertificateNumber" type="text" placeholder="TC number" />
              </label>
            </div>
          </section>

          <section className="erp-form-section">
            <h2 className="erp-form-title">Fee and Scholarship Details</h2>
            <div className="erp-form-grid">
              <label className="erp-form-field">
                <span>Fee Category</span>
                <CustomSelect name="feeCategory" options={feeCategoryOptions} placeholder="Select" required />
              </label>
              <label className="erp-form-field">
                <span>Total Fee</span>
                <input type="number" min="0" step="0.01" placeholder="Enter total fee" value={totalFee} onChange={(event) => setTotalFee(event.target.value)} required />
              </label>
              <label className="erp-form-field">
                <span>Paid Amount</span>
                <input type="number" min="0" step="0.01" placeholder="Enter paid amount" value={paidAmount} onChange={(event) => setPaidAmount(event.target.value)} required />
              </label>
              <label className="erp-form-field">
                <span>Pending Amount (Auto Calculated)</span>
                <input name="pendingAmount" type="text" value={pendingAmount} readOnly placeholder="Auto calculated" />
              </label>
              <label className="erp-form-field">
                <span>Scholarship / Concession</span>
                <CustomSelect name="scholarshipType" options={concessionOptions} placeholder="None" />
              </label>
              <label className="erp-form-field">
                <span>Scholarship / Concession Amount</span>
                <input name="scholarshipAmount" type="number" min="0" step="0.01" placeholder="Enter concession amount" />
              </label>
              <label className="erp-form-field erp-form-field-full">
                <span>Payment History</span>
                <textarea name="paymentHistory" rows={3} placeholder="Example: 12-Apr-2026 | Rs 4,500 | UPI | Receipt #1234" />
              </label>
            </div>
          </section>

          <section className="erp-form-section">
            <h2 className="erp-form-title">Documents</h2>
            <div className="erp-form-grid">
              <label className="erp-form-field">
                <span>Birth Certificate</span>
                <input name="birthCertificate" type="file" accept=".pdf,.jpg,.jpeg,.png" required />
              </label>
              <label className="erp-form-field">
                <span>Previous Class Marksheet</span>
                <input name="previousMarksheet" type="file" accept=".pdf,.jpg,.jpeg,.png" />
              </label>
              <label className="erp-form-field">
                <span>10th Marksheet (Required for Class 12)</span>
                <input name="tenthMarksheet" type="file" accept=".pdf,.jpg,.jpeg,.png" required={selectedClass === '12th'} />
                <small className="erp-form-hint">{marksheetHelpText}</small>
              </label>
            </div>
          </section>

          <div className="erp-form-actions erp-form-actions-sticky">
            <button type="submit" className="erp-form-primary-button">
              Save Student
            </button>
          </div>
        </form>
      </div>
    </motion.section>
  )
}

export default AddStudentPage


