import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import CustomSelect from '../components/CustomSelect'
import { useAppContext } from '../context/AppContext'

const navItems = [
  { id: 'dashboard', label: 'Staff Dashboard' },
  { id: 'staff', label: 'Staff List' },
  { id: 'attendance', label: 'Attendance' },
  { id: 'payroll', label: 'Payroll' },
  { id: 'leaves', label: 'Leave Approval' },
]

const seedStaff = [
  {
    id: 'S01',
    name: 'Rakesh Kumar',
    role: 'Support Staff',
    designation: 'Canteen Supervisor',
    department: 'Canteen',
    contact: '0000002101',
    status: 'present',
    employment: 'Active',
    monthlyAttendance: 94,
    basic: 32000,
    deductions: 1800,
    allowance: 2500,
    leaveDays: 2,
    emergencyContact: '0000003101',
    email: 'rakesh.canteen@schoolmail.com',
    joiningDate: '2023-04-10',
    shift: 'Morning',
    assignedArea: 'Main Canteen',
    busRoute: 'N/A',
    vehicleNumber: 'N/A',
    transportHistory: [],
  },
  {
    id: 'S02',
    name: 'Pooja Jain',
    role: 'Academic Support',
    designation: 'Librarian',
    department: 'Library',
    contact: '0000002102',
    status: 'present',
    employment: 'Active',
    monthlyAttendance: 96,
    basic: 36000,
    deductions: 1600,
    allowance: 3000,
    leaveDays: 1,
    emergencyContact: '0000003102',
    email: 'pooja.library@schoolmail.com',
    joiningDate: '2022-06-18',
    shift: 'Day',
    assignedArea: 'Main Library',
    busRoute: 'N/A',
    vehicleNumber: 'N/A',
    transportHistory: [],
  },
  {
    id: 'S03',
    name: 'Nitin Yadav',
    role: 'Transport Staff',
    designation: 'Bus Attendant',
    department: 'Transport',
    contact: '0000002103',
    status: 'leave',
    employment: 'Active',
    monthlyAttendance: 88,
    basic: 25000,
    deductions: 900,
    allowance: 1200,
    leaveDays: 4,
    emergencyContact: '0000003103',
    email: 'nitin.transport@schoolmail.com',
    joiningDate: '2024-01-15',
    shift: 'Morning',
    assignedArea: 'Transport Yard',
    busRoute: 'Route-3',
    vehicleNumber: 'DL1PC7781',
    transportHistory: [
      { id: 'TR-001', period: '2025-04 to 2025-09', route: 'Route-2', vehicle: 'DL1PC6651', shift: 'Morning', remarks: 'Regular duty completed' },
      { id: 'TR-002', period: '2025-10 to Present', route: 'Route-3', vehicle: 'DL1PC7781', shift: 'Morning', remarks: 'Current assignment' },
    ],
  },
  {
    id: 'S04',
    name: 'Renu Singh',
    role: 'Transport Staff',
    designation: 'Transport Coordinator',
    department: 'Transport',
    contact: '0000002104',
    status: 'present',
    employment: 'Active',
    monthlyAttendance: 91,
    basic: 42000,
    deductions: 2100,
    allowance: 3500,
    leaveDays: 2,
    emergencyContact: '0000003104',
    email: 'renu.transport@schoolmail.com',
    joiningDate: '2021-09-20',
    shift: 'Day',
    assignedArea: 'Transport Office',
    busRoute: 'All Routes',
    vehicleNumber: 'N/A',
    transportHistory: [
      { id: 'TR-101', period: '2024-01 to 2024-12', route: 'Route-1, Route-4', vehicle: 'Multiple', shift: 'Day', remarks: 'Route planning and supervision' },
      { id: 'TR-102', period: '2025-01 to Present', route: 'All Routes', vehicle: 'Multiple', shift: 'Day', remarks: 'Transport coordination lead' },
    ],
  },
]

const statusOptions = [
  { value: 'all', label: 'All Status' },
  { value: 'present', label: 'Present' },
  { value: 'leave', label: 'On Leave' },
  { value: 'absent', label: 'Absent' },
]

const toNumber = (value) => Number.parseFloat(String(value ?? 0)) || 0
const rs = (value) => `Rs ${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Math.max(toNumber(value), 0))}`
const normalizePhone = (value) => String(value || '').replace(/\D/g, '')
const getInitials = (name) =>
  String(name || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || 'ST'
const buildAvatarDataUri = (name) => {
  const initials = getInitials(name)
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><rect width="120" height="120" rx="60" fill="#0891b2"/><text x="60" y="68" text-anchor="middle" font-family="Arial, sans-serif" font-size="38" font-weight="700" fill="white">${initials}</text></svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

function StaffHubPage() {
  const navigate = useNavigate()
  const { staffRecords: staff = [], addStaff: ctxAddStaff } = useAppContext()
  const onBack = () => navigate('/dashboard')
  const onAddStaff = ctxAddStaff || (() => { })
  const [activeView, setActiveView] = useState('dashboard')
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedStaffId, setSelectedStaffId] = useState('')
  const [isProfilePopupOpen, setIsProfilePopupOpen] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false)
  const [newStaff, setNewStaff] = useState({
    name: '',
    role: '',
    designation: '',
    department: '',
    contact: '',
    salary: '',
    allowance: '',
    photoPreview: '',
  })
  const [payrollInputs, setPayrollInputs] = useState({})
  const [generatedPayslip, setGeneratedPayslip] = useState('')
  const [generatedPayslipKey, setGeneratedPayslipKey] = useState('')

  const [records, setRecords] = useState(() => {
    if (!staff.length) {
      return seedStaff.map((item) => ({
        ...item,
        photoPreview: item.photoPreview || buildAvatarDataUri(item.name),
      }))
    }
    return staff.map((member, index) => ({
      id: member.id || `S${String(index + 1).padStart(2, '0')}`,
      name: member.name || 'Staff',
      role: member.role || 'Support Staff',
      designation: member.designation || member.role || 'Staff Member',
      department: member.department ? member.department[0].toUpperCase() + member.department.slice(1) : 'Admin',
      contact: member.contactNumber || 'N/A',
      status: member.status === 'on_leave' ? 'leave' : member.status === 'active' ? 'present' : 'absent',
      employment: member.status === 'inactive' ? 'Inactive' : 'Active',
      monthlyAttendance: member.monthlyAttendance || 90,
      basic: member.basic || 30000,
      deductions: member.deductions || 1000,
      allowance: member.allowance || 1500,
      leaveDays: member.leaveDays || 2,
      emergencyContact: member.emergencyContactNumber || member.emergencyContact || 'N/A',
      email: member.email || 'N/A',
      joiningDate: member.joiningDate || 'N/A',
      shift: member.shift ? member.shift[0].toUpperCase() + member.shift.slice(1) : 'Day',
      assignedArea: member.assignedArea || 'N/A',
      busRoute: member.busRoute || 'N/A',
      vehicleNumber: member.vehicleNumber || 'N/A',
      transportHistory: Array.isArray(member.transportHistory) ? member.transportHistory : [],
      photoPreview: member.photoPreview || buildAvatarDataUri(member.name || 'Staff'),
    }))
  })

  const [leaveRequests, setLeaveRequests] = useState(() => [
    { id: 'SL-001', staffId: records[0]?.id || 'S01', name: records[0]?.name || 'Staff', from: '2026-02-21', to: '2026-02-22', reason: 'Medical', status: 'pending' },
    { id: 'SL-002', staffId: records[2]?.id || 'S03', name: records[2]?.name || 'Staff', from: '2026-02-24', to: '2026-02-24', reason: 'Personal Work', status: 'pending' },
    { id: 'SL-003', staffId: records[1]?.id || 'S02', name: records[1]?.name || 'Staff', from: '2026-02-10', to: '2026-02-10', reason: 'Official Duty', status: 'approved' },
  ])

  const filteredStaff = useMemo(() => {
    const q = searchText.trim().toLowerCase()
    return records.filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false
      if (!q) return true
      return (
        item.name.toLowerCase().includes(q) ||
        item.role.toLowerCase().includes(q) ||
        item.designation.toLowerCase().includes(q) ||
        item.department.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q)
      )
    })
  }, [records, searchText, statusFilter])

  const selectedStaff = useMemo(
    () => records.find((item) => item.id === selectedStaffId) || filteredStaff[0] || records[0] || null,
    [records, filteredStaff, selectedStaffId],
  )

  const summary = useMemo(() => {
    const total = records.length
    const present = records.filter((item) => item.status === 'present').length
    const onLeave = records.filter((item) => item.status === 'leave').length
    const payrollPending = records.filter((item) => toNumber(item.basic) + toNumber(item.allowance) - toNumber(item.deductions) <= 0).length
    return {
      total,
      present,
      onLeave,
      payrollStatus: payrollPending === 0 ? 'Processed' : `${payrollPending} Pending`,
    }
  }, [records])

  const leaveHistory = useMemo(
    () => leaveRequests.filter((request) => request.staffId === selectedStaff?.id),
    [leaveRequests, selectedStaff],
  )

  const payrollPreview = useMemo(() => {
    if (!selectedStaff) return { gross: 0, net: 0 }
    const gross = toNumber(selectedStaff.basic) + toNumber(selectedStaff.allowance)
    const net = gross - toNumber(selectedStaff.deductions)
    return { gross, net }
  }, [selectedStaff])

  const selectedPayrollInputs = useMemo(() => {
    if (!selectedStaff) return { leaveDays: 0, deductionPerLeaveDay: 500, bonus: 0, extraDeductions: 0, month: '2026-02' }
    const existing = payrollInputs[selectedStaff.id] || {}
    return {
      basicSalary: Number.isFinite(Number(existing.basicSalary)) ? Number(existing.basicSalary) : Number(selectedStaff.basic || 0),
      allowanceAmount: Number.isFinite(Number(existing.allowanceAmount)) ? Number(existing.allowanceAmount) : Number(selectedStaff.allowance || 0),
      fixedDeductions: Number.isFinite(Number(existing.fixedDeductions)) ? Number(existing.fixedDeductions) : Number(selectedStaff.deductions || 0),
      leaveDays: Number.isFinite(Number(existing.leaveDays)) ? Number(existing.leaveDays) : Number(selectedStaff.leaveDays || 0),
      deductionPerLeaveDay: Number.isFinite(Number(existing.deductionPerLeaveDay)) ? Number(existing.deductionPerLeaveDay) : 500,
      bonus: Number.isFinite(Number(existing.bonus)) ? Number(existing.bonus) : 0,
      extraDeductions: Number.isFinite(Number(existing.extraDeductions)) ? Number(existing.extraDeductions) : 0,
      month: existing.month || '2026-02',
    }
  }, [payrollInputs, selectedStaff])

  const payrollBreakup = useMemo(() => {
    if (!selectedStaff) return { base: 0, allowance: 0, bonus: 0, leaveDeduction: 0, extraDeductions: 0, gross: 0, totalDeductions: 0, net: 0 }
    const base = toNumber(selectedPayrollInputs.basicSalary)
    const allowance = toNumber(selectedPayrollInputs.allowanceAmount)
    const bonus = toNumber(selectedPayrollInputs.bonus)
    const leaveDeduction = Math.max(selectedPayrollInputs.leaveDays, 0) * Math.max(selectedPayrollInputs.deductionPerLeaveDay, 0)
    const extraDeductions = toNumber(selectedPayrollInputs.extraDeductions) + toNumber(selectedPayrollInputs.fixedDeductions)
    const gross = base + allowance + bonus
    const totalDeductions = leaveDeduction + extraDeductions
    const net = Math.max(gross - totalDeductions, 0)
    return { base, allowance, bonus, leaveDeduction, extraDeductions, gross, totalDeductions, net }
  }, [selectedPayrollInputs, selectedStaff])

  const currentPayslipKey = useMemo(() => {
    if (!selectedStaff) return ''
    return [
      selectedStaff.id,
      selectedPayrollInputs.month,
      selectedPayrollInputs.basicSalary,
      selectedPayrollInputs.allowanceAmount,
      selectedPayrollInputs.fixedDeductions,
      selectedPayrollInputs.leaveDays,
      selectedPayrollInputs.deductionPerLeaveDay,
      selectedPayrollInputs.bonus,
      selectedPayrollInputs.extraDeductions,
    ].join('|')
  }, [selectedPayrollInputs, selectedStaff])

  const selectedPhoneDigits = useMemo(() => normalizePhone(selectedStaff?.contact), [selectedStaff])
  const hasValidSelectedContact = selectedPhoneDigits.length >= 10
  const selectedRecipientLabel = useMemo(() => {
    if (!selectedStaff) return 'No staff selected'
    return `${selectedStaff.name} (${selectedStaff.contact || 'N/A'})`
  }, [selectedStaff])
  const staffSelectOptions = useMemo(
    () => records.map((item) => ({ value: item.id, label: `${item.name} (${item.id})` })),
    [records],
  )

  const isTransportStaff = useMemo(() => {
    if (!selectedStaff) return false
    const roleText = `${selectedStaff.role} ${selectedStaff.designation} ${selectedStaff.department}`.toLowerCase()
    return roleText.includes('transport') || roleText.includes('driver') || roleText.includes('bus')
  }, [selectedStaff])

  const transportHistory = useMemo(() => {
    if (!selectedStaff || !isTransportStaff) return []
    if (selectedStaff.transportHistory?.length) return selectedStaff.transportHistory
    return [
      {
        id: `${selectedStaff.id}-TR`,
        period: 'Current',
        route: selectedStaff.busRoute || 'N/A',
        vehicle: selectedStaff.vehicleNumber || 'N/A',
        shift: selectedStaff.shift || 'Day',
        remarks: 'Current assignment',
      },
    ]
  }, [selectedStaff, isTransportStaff])

  const handleLeaveDecision = (leaveId, decision) => {
    setLeaveRequests((prev) => prev.map((item) => (item.id === leaveId ? { ...item, status: decision } : item)))
    const current = leaveRequests.find((item) => item.id === leaveId)
    if (decision === 'approved' && current) {
      setRecords((prev) => prev.map((item) => (item.id === current.staffId ? { ...item, status: 'leave' } : item)))
    }
    setStatusMessage(`Leave request ${leaveId} ${decision}.`)
  }

  const buildPayslipLines = () => {
    if (!selectedStaff) return []
    return [
      'Digital Payslip',
      `Month: ${selectedPayrollInputs.month}`,
      `Staff: ${selectedStaff.name} (${selectedStaff.id})`,
      `Department: ${selectedStaff.department}`,
      `Basic: ${rs(payrollBreakup.base)}`,
      `Allowance: ${rs(payrollBreakup.allowance)}`,
      `Bonus: ${rs(payrollBreakup.bonus)}`,
      `Leave Deduction (${selectedPayrollInputs.leaveDays} day): ${rs(payrollBreakup.leaveDeduction)}`,
      `Other Deductions: ${rs(payrollBreakup.extraDeductions)}`,
      `Gross: ${rs(payrollBreakup.gross)}`,
      `Total Deductions: ${rs(payrollBreakup.totalDeductions)}`,
      `Net Pay: ${rs(payrollBreakup.net)}`,
    ]
  }

  const showPayslipForSelected = () => {
    if (!selectedStaff) return
    const lines = buildPayslipLines()
    setGeneratedPayslip(lines.join('\n'))
    setGeneratedPayslipKey(currentPayslipKey)
    setStatusMessage(`Digital payslip generated for ${selectedStaff.name}. Net Pay: ${rs(payrollBreakup.net)}`)
  }

  const generatePayslip = () => {
    if (!selectedStaff) return
    if (generatedPayslip && generatedPayslipKey === currentPayslipKey) {
      setGeneratedPayslip('')
      setGeneratedPayslipKey('')
      setStatusMessage(`Digital payslip hidden for ${selectedStaff.name}.`)
      return
    }
    showPayslipForSelected()
  }

  const sendPayslipToContact = () => {
    if (!selectedStaff) return
    const phoneDigits = selectedPhoneDigits
    if (phoneDigits.length < 10) {
      setStatusMessage(`Cannot send payslip. Valid contact number missing for ${selectedStaff.name}.`)
      return
    }

    const message = generatedPayslip && generatedPayslipKey === currentPayslipKey
      ? generatedPayslip
      : buildPayslipLines().join('\n')
    const targetPhone = phoneDigits.length === 10 ? `91${phoneDigits}` : phoneDigits
    const whatsappUrl = `https://wa.me/${targetPhone}?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer')
    setStatusMessage(`Digital payslip opened for sending to ${selectedStaff.name} (${selectedStaff.contact}).`)
  }

  const buildPayslipTextForStaff = (item) => {
    const input = payrollInputs[item.id] || {}
    const month = input.month || selectedPayrollInputs.month
    const base = Number.isFinite(Number(input.basicSalary)) ? Number(input.basicSalary) : toNumber(item.basic)
    const allowance = Number.isFinite(Number(input.allowanceAmount)) ? Number(input.allowanceAmount) : toNumber(item.allowance)
    const fixedDeductions = Number.isFinite(Number(input.fixedDeductions)) ? Number(input.fixedDeductions) : toNumber(item.deductions)
    const leaveDays = Number.isFinite(Number(input.leaveDays)) ? Number(input.leaveDays) : Number(item.leaveDays || 0)
    const deductionPerLeaveDay = Number.isFinite(Number(input.deductionPerLeaveDay)) ? Number(input.deductionPerLeaveDay) : 500
    const bonus = Number.isFinite(Number(input.bonus)) ? Number(input.bonus) : 0
    const extraDeductions = Number.isFinite(Number(input.extraDeductions)) ? Number(input.extraDeductions) : 0
    const leaveDeduction = Math.max(leaveDays, 0) * Math.max(deductionPerLeaveDay, 0)
    const otherDeductions = fixedDeductions + extraDeductions
    const gross = base + allowance + bonus
    const totalDeductions = leaveDeduction + otherDeductions
    const net = Math.max(gross - totalDeductions, 0)

    return [
      'Digital Payslip',
      `Month: ${month}`,
      `Staff: ${item.name} (${item.id})`,
      `Department: ${item.department}`,
      `Basic: ${rs(base)}`,
      `Allowance: ${rs(allowance)}`,
      `Bonus: ${rs(bonus)}`,
      `Leave Deduction (${leaveDays} day): ${rs(leaveDeduction)}`,
      `Other Deductions: ${rs(otherDeductions)}`,
      `Gross: ${rs(gross)}`,
      `Total Deductions: ${rs(totalDeductions)}`,
      `Net Pay: ${rs(net)}`,
    ].join('\n')
  }

  const sendAllPayslips = () => {
    if (!records.length) return
    const sendableStaff = records.filter((item) => normalizePhone(item.contact).length >= 10)
    if (!sendableStaff.length) {
      setStatusMessage('Cannot send payslips. No staff has a valid contact number.')
      return
    }

    sendableStaff.forEach((item, index) => {
      const phoneDigits = normalizePhone(item.contact)
      const targetPhone = phoneDigits.length === 10 ? `91${phoneDigits}` : phoneDigits
      const message = buildPayslipTextForStaff(item)
      const whatsappUrl = `https://wa.me/${targetPhone}?text=${encodeURIComponent(message)}`
      setTimeout(() => {
        window.open(whatsappUrl, '_blank', 'noopener,noreferrer')
      }, index * 300)
    })

    const skipped = records.length - sendableStaff.length
    setStatusMessage(`Opened send flow for ${sendableStaff.length} staff payslip(s). ${skipped > 0 ? `${skipped} skipped due to invalid contact.` : ''}`.trim())
  }

  const generateAllPayslips = () => {
    if (!records.length) return
    const month = selectedPayrollInputs.month
    const totalNet = records.reduce((sum, item) => {
      const input = payrollInputs[item.id] || {}
      const basicSalary = Number.isFinite(Number(input.basicSalary)) ? Number(input.basicSalary) : toNumber(item.basic)
      const allowanceAmount = Number.isFinite(Number(input.allowanceAmount)) ? Number(input.allowanceAmount) : toNumber(item.allowance)
      const fixedDeductions = Number.isFinite(Number(input.fixedDeductions)) ? Number(input.fixedDeductions) : toNumber(item.deductions)
      const leaveDays = Number.isFinite(Number(input.leaveDays)) ? Number(input.leaveDays) : Number(item.leaveDays || 0)
      const deductionPerLeaveDay = Number.isFinite(Number(input.deductionPerLeaveDay)) ? Number(input.deductionPerLeaveDay) : 500
      const bonus = Number.isFinite(Number(input.bonus)) ? Number(input.bonus) : 0
      const extraDeductions = Number.isFinite(Number(input.extraDeductions)) ? Number(input.extraDeductions) : 0
      const gross = basicSalary + allowanceAmount + bonus
      const totalDeductions = fixedDeductions + extraDeductions + (Math.max(leaveDays, 0) * Math.max(deductionPerLeaveDay, 0))
      const net = Math.max(gross - totalDeductions, 0)
      return sum + net
    }, 0)
    setStatusMessage(`All staff digital payslips generated for ${month}. Total Net Payroll: ${rs(totalNet)}.`)
  }

  const openStaffProfile = (staffId) => {
    setSelectedStaffId(staffId)
    setIsProfilePopupOpen(true)
  }

  const handleAddStaffSubmit = (event) => {
    event.preventDefault()
    const name = newStaff.name.trim()
    const role = newStaff.role.trim()
    const designation = newStaff.designation.trim()
    const department = newStaff.department.trim()
    const contact = newStaff.contact.trim()
    const basic = Number.parseFloat(newStaff.salary || '0')
    const allowance = Number.parseFloat(newStaff.allowance || '0')

    if (!name || !role || !designation || !department || !contact) {
      setStatusMessage('Please fill all required staff fields before saving.')
      return
    }

    const maxStaffNumber = records.reduce((maxValue, item) => {
      const parsed = Number.parseInt(String(item.id || '').replace(/\D+/g, ''), 10)
      if (!Number.isFinite(parsed)) return maxValue
      return Math.max(maxValue, parsed)
    }, 0)
    const nextId = `S${String(maxStaffNumber + 1).padStart(2, '0')}`
    const nextRecord = {
      id: nextId,
      name,
      role,
      designation,
      department,
      contact,
      status: 'present',
      employment: 'Active',
      monthlyAttendance: 90,
      basic: Number.isFinite(basic) && basic > 0 ? basic : 30000,
      deductions: 1000,
      allowance: Number.isFinite(allowance) && allowance >= 0 ? allowance : 1500,
      leaveDays: 0,
      emergencyContact: 'N/A',
      email: 'N/A',
      joiningDate: new Date().toISOString().slice(0, 10),
      shift: 'Day',
      assignedArea: 'N/A',
      busRoute: 'N/A',
      vehicleNumber: 'N/A',
      transportHistory: [],
      photoPreview: newStaff.photoPreview || buildAvatarDataUri(name),
    }

    setRecords((prev) => [nextRecord, ...prev])
    onAddStaff?.({
      id: nextRecord.id,
      employeeId: nextRecord.id,
      name: nextRecord.name,
      role: nextRecord.role,
      department: nextRecord.department.toLowerCase(),
      contactNumber: nextRecord.contact,
      email: 'N/A',
      joiningDate: new Date().toISOString().slice(0, 10),
      address: 'N/A',
      emergencyContactName: 'N/A',
      emergencyContactNumber: 'N/A',
      shift: 'day',
      assignedArea: 'N/A',
      busRoute: 'N/A',
      vehicleNumber: 'N/A',
      qualification: 'N/A',
      status: 'active',
      documentsStatus: 'Pending Verification',
      designation: nextRecord.designation,
      basic: nextRecord.basic,
      deductions: nextRecord.deductions,
      allowance: nextRecord.allowance,
      leaveDays: nextRecord.leaveDays,
      monthlyAttendance: nextRecord.monthlyAttendance,
      photoPreview: nextRecord.photoPreview,
    })
    setSelectedStaffId(nextRecord.id)
    setActiveView('staff')
    setIsAddStaffOpen(false)
    setNewStaff({
      name: '',
      role: '',
      designation: '',
      department: '',
      contact: '',
      salary: '',
      allowance: '',
      photoPreview: '',
    })
    setStatusMessage(`New staff added: ${nextRecord.name} (${nextRecord.id}).`)
  }

  const handleStaffPhotoChange = (event) => {
    const file = event.target.files?.[0]
    if (!file) {
      setNewStaff((prev) => ({ ...prev, photoPreview: '' }))
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setNewStaff((prev) => ({ ...prev, photoPreview: typeof reader.result === 'string' ? reader.result : '' }))
    }
    reader.readAsDataURL(file)
  }

  const inputBase = 'h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 focus:border-cyan-500 focus:outline-none'
  const cardBase = 'rounded-2xl border border-white/20 bg-white/90 shadow-xl backdrop-blur'

  return (
    <motion.section
      key="staff-hub-modern"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="relative min-h-screen overflow-hidden bg-white text-slate-800"
    >



      <div className="relative mx-auto max-w-[1400px] px-4 py-6 lg:px-8">
        <header className="mb-4 rounded-2xl border border-white/20 bg-white/85 p-4 shadow-xl backdrop-blur md:p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700">School ERP</p>
              <h1 className="text-2xl font-semibold text-slate-900 md:text-3xl">Staff Operations Dashboard</h1>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-semibold text-cyan-800">Role: Head/Principal</span>
              <button type="button" className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-white hover:bg-slate-200" onClick={onBack}>
                Back to Dashboard
              </button>
            </div>
          </div>
        </header>

        <div className="grid gap-4 xl:grid-cols-[260px_1fr]">
          <aside className="rounded-2xl border border-cyan-200/30 bg-white/80 p-4 text-white shadow-2xl backdrop-blur">
            <div className="mb-4 rounded-xl border border-white/10 bg-white/10 p-3">
              <p className="text-xs uppercase tracking-widest text-blue-600">Institution</p>
              <h2 className="mt-1 text-lg font-semibold">School ERP</h2>
              <p className="text-xs text-slate-300">Staff & HR Command</p>
            </div>
            <nav className="space-y-2">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveView(item.id)}
                  className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${activeView === item.id ? 'bg-cyan-400 text-slate-900 font-semibold' : 'bg-white/10 text-slate-800 hover:bg-white/20'
                    }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </aside>

          <main className="space-y-4">
            {activeView !== 'staffProfile' && (
              <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <article className={`${cardBase} p-4`}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Staff</p>
                  <p className="mt-1 text-2xl font-semibold text-slate-900">{summary.total}</p>
                </article>
                <article className={`${cardBase} p-4`}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Present Today</p>
                  <p className="mt-1 text-2xl font-semibold text-emerald-700">{summary.present}</p>
                </article>
                <article className={`${cardBase} p-4`}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-amber-600">On Leave</p>
                  <p className="mt-1 text-2xl font-semibold text-amber-700">{summary.onLeave}</p>
                </article>
                <article className={`${cardBase} p-4`}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-cyan-700">Payroll Status</p>
                  <p className="mt-1 text-2xl font-semibold text-cyan-800">{summary.payrollStatus}</p>
                </article>
              </section>
            )}

            {(activeView === 'staffProfile') && selectedStaff && (
              <section className={`${cardBase} p-4 md:p-5`}>
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700">Full Staff Profile</p>
                    <h2 className="text-2xl font-semibold text-slate-900">{selectedStaff.name}</h2>
                    <p className="text-sm text-slate-600">
                      {selectedStaff.id} | {selectedStaff.designation} | {selectedStaff.department}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50" onClick={() => setActiveView('staff')}>
                      Back to Staff List
                    </button>
                    <button type="button" className="rounded-lg border border-cyan-300 bg-cyan-50 px-3 py-2 text-sm font-medium text-cyan-800 hover:bg-cyan-100" onClick={() => setActiveView('attendance')}>
                      Open Attendance
                    </button>
                    <button type="button" className="rounded-lg bg-cyan-600 px-3 py-2 text-sm font-medium text-white hover:bg-cyan-700" onClick={() => setActiveView('payroll')}>
                      Open Payroll
                    </button>
                  </div>
                </div>

                <article className="mb-3 rounded-2xl border border-cyan-200 bg-gradient-to-r from-cyan-50 to-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700">Particular Staff Profile Card</p>
                  <div className="mt-2 grid gap-3 md:grid-cols-[90px_1fr]">
                    <img src={selectedStaff.photoPreview || buildAvatarDataUri(selectedStaff.name)} alt={selectedStaff.name} className="h-20 w-20 rounded-full border border-cyan-200 object-cover" />
                    <div>
                      <h3 className="text-xl font-semibold text-slate-900">{selectedStaff.name}</h3>
                      <p className="text-sm text-slate-600">{selectedStaff.id} | {selectedStaff.designation} | {selectedStaff.department}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {selectedStaff.contact && selectedStaff.contact !== 'N/A' ? (
                          <a href={`tel:${selectedStaff.contact}`} className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-200">
                            Call: {selectedStaff.contact}
                          </a>
                        ) : (
                          <span className="rounded-lg bg-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700">Call: N/A</span>
                        )}
                        {selectedStaff.emergencyContact && selectedStaff.emergencyContact !== 'N/A' ? (
                          <a href={`tel:${selectedStaff.emergencyContact}`} className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                            Emergency: {selectedStaff.emergencyContact}
                          </a>
                        ) : (
                          <span className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700">Emergency: N/A</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3">
                    <button
                      type="button"
                      className="rounded-lg bg-cyan-600 px-3 py-2 text-sm font-medium text-white hover:bg-cyan-700"
                      onClick={() => {
                        showPayslipForSelected()
                        setActiveView('payroll')
                      }}
                    >
                      Generate Salary Slip
                    </button>
                  </div>
                </article>

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <article className="rounded-xl border border-slate-200 bg-white p-3"><p className="text-xs text-slate-500">Role</p><strong>{selectedStaff.role}</strong></article>
                  <article className="rounded-xl border border-slate-200 bg-white p-3"><p className="text-xs text-slate-500">Designation</p><strong>{selectedStaff.designation}</strong></article>
                  <article className="rounded-xl border border-slate-200 bg-white p-3"><p className="text-xs text-slate-500">Contact</p><strong>{selectedStaff.contact}</strong></article>
                  <article className="rounded-xl border border-slate-200 bg-white p-3"><p className="text-xs text-slate-500">Employment</p><strong>{selectedStaff.employment}</strong></article>
                  <article className="rounded-xl border border-slate-200 bg-white p-3"><p className="text-xs text-slate-500">Emergency Contact</p><strong>{selectedStaff.emergencyContact}</strong></article>
                  <article className="rounded-xl border border-slate-200 bg-white p-3"><p className="text-xs text-slate-500">Email</p><strong>{selectedStaff.email}</strong></article>
                  <article className="rounded-xl border border-slate-200 bg-white p-3"><p className="text-xs text-slate-500">Joining Date</p><strong>{selectedStaff.joiningDate}</strong></article>
                  <article className="rounded-xl border border-slate-200 bg-white p-3"><p className="text-xs text-slate-500">Shift</p><strong>{selectedStaff.shift}</strong></article>
                  <article className="rounded-xl border border-slate-200 bg-white p-3"><p className="text-xs text-slate-500">Assigned Area</p><strong>{selectedStaff.assignedArea}</strong></article>
                  <article className="rounded-xl border border-slate-200 bg-white p-3"><p className="text-xs text-slate-500">Bus Route</p><strong>{selectedStaff.busRoute}</strong></article>
                  <article className="rounded-xl border border-slate-200 bg-white p-3"><p className="text-xs text-slate-500">Vehicle Number</p><strong>{selectedStaff.vehicleNumber}</strong></article>
                  <article className="rounded-xl border border-slate-200 bg-white p-3"><p className="text-xs text-slate-500">Monthly Attendance</p><strong>{selectedStaff.monthlyAttendance}%</strong></article>
                  <article className="rounded-xl border border-slate-200 bg-white p-3"><p className="text-xs text-slate-500">Leave Days</p><strong>{selectedStaff.leaveDays}</strong></article>
                  <article className="rounded-xl border border-slate-200 bg-white p-3"><p className="text-xs text-slate-500">Gross Pay</p><strong>{rs(payrollPreview.gross)}</strong></article>
                  <article className="rounded-xl border border-slate-200 bg-white p-3"><p className="text-xs text-slate-500">Net Pay</p><strong>{rs(payrollPreview.net)}</strong></article>
                </div>

                {isTransportStaff ? (
                  <section className="mt-4 rounded-xl border border-slate-200 bg-white p-3">
                    <h3 className="text-sm font-semibold text-slate-900">Bus Driver / Transport Duty History</h3>
                    <div className="mt-2 overflow-x-auto rounded-lg border border-slate-200">
                      <table className="min-w-full text-left text-xs">
                        <thead className="bg-slate-100 text-slate-600">
                          <tr>
                            <th className="px-3 py-2">History ID</th>
                            <th className="px-3 py-2">Period</th>
                            <th className="px-3 py-2">Route</th>
                            <th className="px-3 py-2">Vehicle</th>
                            <th className="px-3 py-2">Shift</th>
                            <th className="px-3 py-2">Remarks</th>
                          </tr>
                        </thead>
                        <tbody>
                          {transportHistory.map((item) => (
                            <tr key={item.id} className="border-t border-slate-200">
                              <td className="px-3 py-2">{item.id}</td>
                              <td className="px-3 py-2">{item.period}</td>
                              <td className="px-3 py-2">{item.route}</td>
                              <td className="px-3 py-2">{item.vehicle}</td>
                              <td className="px-3 py-2">{item.shift}</td>
                              <td className="px-3 py-2">{item.remarks}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>
                ) : null}
              </section>
            )}

            {(activeView === 'dashboard' || activeView === 'staff') && (
              <section className={`${cardBase} p-4 md:p-5`}>
                <div className="mb-3 flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">Staff Directory</h2>
                    <p className="text-sm text-slate-600">Searchable and filterable records for principal-level review.</p>
                  </div>
                  <div className="grid gap-2 lg:w-[640px] lg:grid-cols-[1fr_180px_auto]">
                    <input type="text" value={searchText} onChange={(event) => setSearchText(event.target.value)} placeholder="Search by name, role, designation, ID" className={inputBase} />
                    <CustomSelect options={statusOptions} value={statusFilter} onChange={setStatusFilter} />
                    <button
                      type="button"
                      className="h-10 rounded-lg bg-cyan-600 px-4 text-sm font-semibold text-white hover:bg-cyan-700"
                      onClick={() => setIsAddStaffOpen((prev) => !prev)}
                    >
                      {isAddStaffOpen ? 'Close Form' : '+ Add New Staff'}
                    </button>
                  </div>
                </div>

                {isAddStaffOpen ? (
                  <form className="mb-3 rounded-xl border border-cyan-200 bg-cyan-50/60 p-3" onSubmit={handleAddStaffSubmit}>
                    <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
                      <label className="erp-form-field">
                        <span>Staff Photo</span>
                        <input type="file" accept="image/*" onChange={handleStaffPhotoChange} />
                      </label>
                      <input type="text" className={inputBase} placeholder="Full Name *" value={newStaff.name} onChange={(event) => setNewStaff((prev) => ({ ...prev, name: event.target.value }))} />
                      <input type="text" className={inputBase} placeholder="Role *" value={newStaff.role} onChange={(event) => setNewStaff((prev) => ({ ...prev, role: event.target.value }))} />
                      <input type="text" className={inputBase} placeholder="Designation *" value={newStaff.designation} onChange={(event) => setNewStaff((prev) => ({ ...prev, designation: event.target.value }))} />
                      <input type="text" className={inputBase} placeholder="Department *" value={newStaff.department} onChange={(event) => setNewStaff((prev) => ({ ...prev, department: event.target.value }))} />
                      <input type="text" className={inputBase} placeholder="Contact Number *" value={newStaff.contact} onChange={(event) => setNewStaff((prev) => ({ ...prev, contact: event.target.value }))} />
                      <input type="number" className={inputBase} placeholder="Basic Salary" value={newStaff.salary} onChange={(event) => setNewStaff((prev) => ({ ...prev, salary: event.target.value }))} />
                      <input type="number" className={inputBase} placeholder="Allowance" value={newStaff.allowance} onChange={(event) => setNewStaff((prev) => ({ ...prev, allowance: event.target.value }))} />
                      <button type="submit" className="h-10 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700">
                        Save Staff
                      </button>
                    </div>
                  </form>
                ) : null}

                {statusMessage ? <p className="mb-3 rounded-lg bg-cyan-50 px-3 py-2 text-sm text-cyan-700">{statusMessage}</p> : null}

                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-slate-100 text-slate-600">
                      <tr>
                        <th className="px-3 py-2">Staff</th>
                        <th className="px-3 py-2">Role</th>
                        <th className="px-3 py-2">Designation</th>
                        <th className="px-3 py-2">Department</th>
                        <th className="px-3 py-2">Contact</th>
                        <th className="px-3 py-2">Employment</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStaff.map((item) => (
                        <tr key={item.id} onClick={() => openStaffProfile(item.id)} className="cursor-pointer border-t border-slate-200 hover:bg-cyan-50">
                          <td className="px-3 py-2 font-medium">
                            <div className="flex items-center gap-2">
                              <img src={item.photoPreview || buildAvatarDataUri(item.name)} alt={item.name} className="h-8 w-8 rounded-full border border-slate-200 object-cover" />
                              <span>{item.name}</span>
                            </div>
                          </td>
                          <td className="px-3 py-2">{item.role}</td>
                          <td className="px-3 py-2">{item.designation}</td>
                          <td className="px-3 py-2">{item.department}</td>
                          <td className="px-3 py-2">{item.contact}</td>
                          <td className="px-3 py-2">{item.employment}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {(activeView === 'dashboard' || activeView === 'attendance') && selectedStaff && (
              <section className={`${cardBase} p-4 md:p-5`}>
                <h2 className="text-lg font-semibold text-slate-900">Attendance & Leave Tracking</h2>
                <p className="mt-1 text-sm text-slate-600">
                  {selectedStaff.name} | {selectedStaff.designation} | Monthly Attendance: {selectedStaff.monthlyAttendance}%
                </p>
                <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-slate-100 text-slate-600">
                      <tr>
                        <th className="px-3 py-2">Name</th>
                        <th className="px-3 py-2">From</th>
                        <th className="px-3 py-2">To</th>
                        <th className="px-3 py-2">Reason</th>
                        <th className="px-3 py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaveHistory.length ? (
                        leaveHistory.map((request) => (
                          <tr key={request.id} className="border-t border-slate-200">
                            <td className="px-3 py-2">{request.name}</td>
                            <td className="px-3 py-2">{request.from}</td>
                            <td className="px-3 py-2">{request.to}</td>
                            <td className="px-3 py-2">{request.reason}</td>
                            <td className="px-3 py-2">{request.status}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td className="px-3 py-3" colSpan="5">No leave history available.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {(activeView === 'dashboard' || activeView === 'payroll') && selectedStaff && (
              <section className={`${cardBase} relative overflow-hidden p-4 md:p-5`}>
                <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-cyan-300/30 blur-2xl" />
                <h2 className="text-lg font-semibold text-slate-900">Payroll Snapshot</h2>
                <div className="mt-2 grid gap-2 sm:max-w-md">
                  <label className="text-xs font-semibold text-slate-600">
                    Select Staff For Digital Slip
                    <div className="mt-1">
                      <CustomSelect options={staffSelectOptions} value={selectedStaff.id} onChange={setSelectedStaffId} />
                    </div>
                  </label>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <article className="rounded-xl border border-slate-200 bg-white p-3"><p className="text-xs text-slate-500">Basic Salary</p><strong>{rs(selectedPayrollInputs.basicSalary)}</strong></article>
                  <article className="rounded-xl border border-slate-200 bg-white p-3"><p className="text-xs text-slate-500">Allowance</p><strong>{rs(selectedPayrollInputs.allowanceAmount)}</strong></article>
                  <article className="rounded-xl border border-slate-200 bg-white p-3"><p className="text-xs text-slate-500">Deductions</p><strong>{rs(selectedPayrollInputs.fixedDeductions)}</strong></article>
                  <article className="rounded-xl border border-slate-200 bg-white p-3"><p className="text-xs text-slate-500">Net Pay</p><strong>{rs(payrollBreakup.net)}</strong></article>
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  <label className="text-xs font-semibold text-slate-600">Month
                    <input type="month" className={`${inputBase} mt-1`} value={selectedPayrollInputs.month} onChange={(event) => setPayrollInputs((prev) => ({ ...prev, [selectedStaff.id]: { ...(prev[selectedStaff.id] || {}), month: event.target.value } }))} />
                  </label>
                  <label className="text-xs font-semibold text-slate-600">Basic Salary
                    <input type="number" min="0" className={`${inputBase} mt-1`} value={selectedPayrollInputs.basicSalary} onChange={(event) => setPayrollInputs((prev) => ({ ...prev, [selectedStaff.id]: { ...(prev[selectedStaff.id] || {}), basicSalary: event.target.value } }))} />
                  </label>
                  <label className="text-xs font-semibold text-slate-600">Allowance
                    <input type="number" min="0" className={`${inputBase} mt-1`} value={selectedPayrollInputs.allowanceAmount} onChange={(event) => setPayrollInputs((prev) => ({ ...prev, [selectedStaff.id]: { ...(prev[selectedStaff.id] || {}), allowanceAmount: event.target.value } }))} />
                  </label>
                  <label className="text-xs font-semibold text-slate-600">Fixed Deductions
                    <input type="number" min="0" className={`${inputBase} mt-1`} value={selectedPayrollInputs.fixedDeductions} onChange={(event) => setPayrollInputs((prev) => ({ ...prev, [selectedStaff.id]: { ...(prev[selectedStaff.id] || {}), fixedDeductions: event.target.value } }))} />
                  </label>
                  <label className="text-xs font-semibold text-slate-600">Leave Days
                    <input type="number" min="0" className={`${inputBase} mt-1`} value={selectedPayrollInputs.leaveDays} onChange={(event) => setPayrollInputs((prev) => ({ ...prev, [selectedStaff.id]: { ...(prev[selectedStaff.id] || {}), leaveDays: event.target.value } }))} />
                  </label>
                  <label className="text-xs font-semibold text-slate-600">Deduction / Leave Day
                    <input type="number" min="0" className={`${inputBase} mt-1`} value={selectedPayrollInputs.deductionPerLeaveDay} onChange={(event) => setPayrollInputs((prev) => ({ ...prev, [selectedStaff.id]: { ...(prev[selectedStaff.id] || {}), deductionPerLeaveDay: event.target.value } }))} />
                  </label>
                  <label className="text-xs font-semibold text-slate-600">Bonus
                    <input type="number" min="0" className={`${inputBase} mt-1`} value={selectedPayrollInputs.bonus} onChange={(event) => setPayrollInputs((prev) => ({ ...prev, [selectedStaff.id]: { ...(prev[selectedStaff.id] || {}), bonus: event.target.value } }))} />
                  </label>
                  <label className="text-xs font-semibold text-slate-600">Extra Deductions
                    <input type="number" min="0" className={`${inputBase} mt-1`} value={selectedPayrollInputs.extraDeductions} onChange={(event) => setPayrollInputs((prev) => ({ ...prev, [selectedStaff.id]: { ...(prev[selectedStaff.id] || {}), extraDeductions: event.target.value } }))} />
                  </label>
                </div>
                <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
                  <p><span className="font-semibold">Digital slip recipient:</span> {selectedRecipientLabel}</p>
                  <p className="mt-1 text-slate-600">Send All Slips uses each staff member's Contact from Staff List.</p>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-700" onClick={generatePayslip}>
                    {generatedPayslip && generatedPayslipKey === currentPayslipKey ? `Hide Digital Payslip (${selectedStaff.name})` : `Generate Digital Payslip (${selectedStaff.name})`}
                  </button>
                  <button type="button" disabled={!hasValidSelectedContact} className={`rounded-lg border px-4 py-2 text-sm font-medium ${hasValidSelectedContact ? 'border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100' : 'cursor-not-allowed border-slate-300 bg-slate-100 text-slate-400'}`} onClick={sendPayslipToContact}>
                    Send to Number
                  </button>
                  <button type="button" className="rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800 hover:bg-emerald-100" onClick={sendAllPayslips}>
                    Send All Slips
                  </button>
                  <button type="button" className="rounded-lg border border-cyan-300 bg-cyan-50 px-4 py-2 text-sm font-medium text-cyan-800 hover:bg-cyan-100" onClick={generateAllPayslips}>
                    Generate All Slips
                  </button>
                </div>
                {generatedPayslip ? (
                  <pre className="mt-3 overflow-x-auto rounded-xl border border-slate-200 bg-slate-950 p-3 text-xs text-cyan-100">{generatedPayslip}</pre>
                ) : null}
              </section>
            )}

            {(activeView === 'dashboard' || activeView === 'leaves') && (
              <section className={`${cardBase} p-4 md:p-5`}>
                <h2 className="text-lg font-semibold text-slate-900">Leave Approval Desk</h2>
                <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-slate-100 text-slate-600">
                      <tr>
                        <th className="px-3 py-2">Request ID</th>
                        <th className="px-3 py-2">Staff Name</th>
                        <th className="px-3 py-2">From</th>
                        <th className="px-3 py-2">To</th>
                        <th className="px-3 py-2">Reason</th>
                        <th className="px-3 py-2">Status</th>
                        <th className="px-3 py-2">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaveRequests.map((request) => (
                        <tr key={request.id} className="border-t border-slate-200">
                          <td className="px-3 py-2">{request.id}</td>
                          <td className="px-3 py-2">{request.name}</td>
                          <td className="px-3 py-2">{request.from}</td>
                          <td className="px-3 py-2">{request.to}</td>
                          <td className="px-3 py-2">{request.reason}</td>
                          <td className="px-3 py-2">{request.status}</td>
                          <td className="px-3 py-2">
                            {request.status === 'pending' ? (
                              <div className="flex gap-2">
                                <button type="button" className="rounded-md bg-emerald-600 px-3 py-1 text-xs font-medium text-white" onClick={() => handleLeaveDecision(request.id, 'approved')}>
                                  Approve
                                </button>
                                <button type="button" className="rounded-md bg-rose-600 px-3 py-1 text-xs font-medium text-white" onClick={() => handleLeaveDecision(request.id, 'rejected')}>
                                  Reject
                                </button>
                              </div>
                            ) : (
                              '-'
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {isProfilePopupOpen && selectedStaff ? (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
                <div className="w-full max-w-4xl rounded-2xl border border-cyan-200 bg-white p-4 shadow-2xl md:p-5">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700">Particular Staff Profile Card</p>
                      <h3 className="text-xl font-semibold text-slate-900">{selectedStaff.name}</h3>
                      <p className="text-sm text-slate-600">{selectedStaff.id} | {selectedStaff.designation} | {selectedStaff.department}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="rounded-lg border border-cyan-300 bg-cyan-50 px-3 py-2 text-sm font-medium text-cyan-800 hover:bg-cyan-100"
                        onClick={() => {
                          setActiveView('attendance')
                          setIsProfilePopupOpen(false)
                        }}
                      >
                        Open Attendance
                      </button>
                      <button
                        type="button"
                        className="rounded-lg bg-cyan-600 px-3 py-2 text-sm font-medium text-white hover:bg-cyan-700"
                        onClick={() => {
                          setActiveView('payroll')
                          showPayslipForSelected()
                          setIsProfilePopupOpen(false)
                        }}
                      >
                        Generate Salary Slip
                      </button>
                      <button type="button" className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50" onClick={() => setIsProfilePopupOpen(false)}>
                        Close
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-[90px_1fr]">
                    <img src={selectedStaff.photoPreview || buildAvatarDataUri(selectedStaff.name)} alt={selectedStaff.name} className="h-20 w-20 rounded-full border border-cyan-200 object-cover" />
                    <div className="mt-1 flex flex-wrap gap-2">
                      {selectedStaff.contact && selectedStaff.contact !== 'N/A' ? (
                        <a href={`tel:${selectedStaff.contact}`} className="inline-flex items-center rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:from-emerald-700 hover:to-teal-700">
                          Call Now: {selectedStaff.contact}
                        </a>
                      ) : (
                        <span className="rounded-lg bg-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700">Call: N/A</span>
                      )}
                      {selectedStaff.emergencyContact && selectedStaff.emergencyContact !== 'N/A' ? (
                        <a href={`tel:${selectedStaff.emergencyContact}`} className="inline-flex items-center rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-100">
                          Emergency: {selectedStaff.emergencyContact}
                        </a>
                      ) : (
                        <span className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700">Emergency: N/A</span>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <article className="rounded-xl border border-slate-200 bg-white p-3"><p className="text-xs text-slate-500">Role</p><strong>{selectedStaff.role}</strong></article>
                    <article className="rounded-xl border border-slate-200 bg-white p-3"><p className="text-xs text-slate-500">Designation</p><strong>{selectedStaff.designation}</strong></article>
                    <article className="rounded-xl border border-slate-200 bg-white p-3"><p className="text-xs text-slate-500">Department</p><strong>{selectedStaff.department}</strong></article>
                    <article className="rounded-xl border border-slate-200 bg-white p-3"><p className="text-xs text-slate-500">Employment</p><strong>{selectedStaff.employment}</strong></article>
                    <article className="rounded-xl border border-slate-200 bg-white p-3"><p className="text-xs text-slate-500">Contact</p><strong>{selectedStaff.contact}</strong></article>
                    <article className="rounded-xl border border-slate-200 bg-white p-3"><p className="text-xs text-slate-500">Emergency Contact</p><strong>{selectedStaff.emergencyContact}</strong></article>
                    <article className="rounded-xl border border-slate-200 bg-white p-3"><p className="text-xs text-slate-500">Email</p><strong>{selectedStaff.email}</strong></article>
                    <article className="rounded-xl border border-slate-200 bg-white p-3"><p className="text-xs text-slate-500">Joining Date</p><strong>{selectedStaff.joiningDate}</strong></article>
                    <article className="rounded-xl border border-slate-200 bg-white p-3"><p className="text-xs text-slate-500">Shift</p><strong>{selectedStaff.shift}</strong></article>
                    <article className="rounded-xl border border-slate-200 bg-white p-3"><p className="text-xs text-slate-500">Assigned Area</p><strong>{selectedStaff.assignedArea}</strong></article>
                    <article className="rounded-xl border border-slate-200 bg-white p-3"><p className="text-xs text-slate-500">Bus Route</p><strong>{selectedStaff.busRoute}</strong></article>
                    <article className="rounded-xl border border-slate-200 bg-white p-3"><p className="text-xs text-slate-500">Vehicle Number</p><strong>{selectedStaff.vehicleNumber}</strong></article>
                    <article className="rounded-xl border border-slate-200 bg-white p-3"><p className="text-xs text-slate-500">Monthly Attendance</p><strong>{selectedStaff.monthlyAttendance}%</strong></article>
                    <article className="rounded-xl border border-slate-200 bg-white p-3"><p className="text-xs text-slate-500">Leave Days</p><strong>{selectedStaff.leaveDays}</strong></article>
                    <article className="rounded-xl border border-slate-200 bg-white p-3"><p className="text-xs text-slate-500">Basic Salary</p><strong>{rs(selectedStaff.basic)}</strong></article>
                    <article className="rounded-xl border border-slate-200 bg-white p-3"><p className="text-xs text-slate-500">Allowance</p><strong>{rs(selectedStaff.allowance)}</strong></article>
                    <article className="rounded-xl border border-slate-200 bg-white p-3"><p className="text-xs text-slate-500">Deductions</p><strong>{rs(selectedStaff.deductions)}</strong></article>
                    <article className="rounded-xl border border-slate-200 bg-white p-3"><p className="text-xs text-slate-500">Gross Pay</p><strong>{rs(payrollPreview.gross)}</strong></article>
                    <article className="rounded-xl border border-slate-200 bg-white p-3"><p className="text-xs text-slate-500">Net Pay</p><strong>{rs(payrollPreview.net)}</strong></article>
                  </div>

                  {isTransportStaff ? (
                    <section className="mt-4 rounded-xl border border-slate-200 bg-white p-3">
                      <h3 className="text-sm font-semibold text-slate-900">Bus Driver / Transport Duty History</h3>
                      <div className="mt-2 overflow-x-auto rounded-lg border border-slate-200">
                        <table className="min-w-full text-left text-xs">
                          <thead className="bg-slate-100 text-slate-600">
                            <tr>
                              <th className="px-3 py-2">History ID</th>
                              <th className="px-3 py-2">Period</th>
                              <th className="px-3 py-2">Route</th>
                              <th className="px-3 py-2">Vehicle</th>
                              <th className="px-3 py-2">Shift</th>
                              <th className="px-3 py-2">Remarks</th>
                            </tr>
                          </thead>
                          <tbody>
                            {transportHistory.map((item) => (
                              <tr key={item.id} className="border-t border-slate-200">
                                <td className="px-3 py-2">{item.id}</td>
                                <td className="px-3 py-2">{item.period}</td>
                                <td className="px-3 py-2">{item.route}</td>
                                <td className="px-3 py-2">{item.vehicle}</td>
                                <td className="px-3 py-2">{item.shift}</td>
                                <td className="px-3 py-2">{item.remarks}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </section>
                  ) : null}
                </div>
              </div>
            ) : null}
          </main>
        </div>
      </div>
    </motion.section>
  )
}

export default StaffHubPage
