export const cards = [
  { title: 'Students', value: '1,248', note: 'Total enrolled students', gradient: 'linear-gradient(135deg, #0f172a 0%, #0891b2 100%)' },
  { title: 'Faculty', value: '124', note: 'Teaching staff active', gradient: 'linear-gradient(135deg, #164e63 0%, #06b6d4 100%)' },
  { title: 'Staff', value: '86', note: 'Operations and support', gradient: 'linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)' },
  { title: 'Accounting', value: 'Rs 18.4L', note: 'Monthly fee collections', gradient: 'linear-gradient(135deg, #0f172a 0%, #0ea5e9 100%)' },
]

export const classNames = ['Nursery', 'LKG', 'UKG', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th']

export const classStudentNames = {
  Nursery: ['Aarav Singh', 'Kiara Jain', 'Vihaan Patel', 'Myra Sharma'],
  LKG: ['Reyansh Verma', 'Anaya Gupta', 'Ayaan Khan', 'Saanvi Yadav'],
  UKG: ['Advik Mehta', 'Diya Rawat', 'Kabir Joshi', 'Pari Chauhan'],
  '1st': ['Rudra Tiwari', 'Ira Malhotra', 'Arjun Nair', 'Riya Das'],
  '2nd': ['Laksh Bansal', 'Mahi Rathi', 'Krish Kapoor', 'Siya Anand'],
  '3rd': ['Yash Sengar', 'Aditi Saxena', 'Shaurya Mishra', 'Nitya Roy'],
  '4th': ['Harsh Vashisht', 'Trisha Soni', 'Dev Rathore', 'Aarohi Sen'],
  '5th': ['Kunal Sahu', 'Tanvi Arora', 'Ishaan Dutta', 'Prisha Kulkarni'],
  '6th': ['Atharv Bhatt', 'Meera Nanda', 'Rohan Iyer', 'Anvi Chawla'],
  '7th': ['Sarthak Goyal', 'Navya Khandelwal', 'Om Rajput', 'Ritika Pal'],
  '8th': ['Naman Dubey', 'Ishita Sethi', 'Aditya Solanki', 'Jiya Thakur'],
  '9th': ['Manav Oberoi', 'Pihu Tripathi', 'Keshav Tyagi', 'Niharika Batra'],
  '10th': ['Rajat Chaturvedi', 'Shruti Pandey', 'Pranav Negi', 'Tanya Aras'],
  '11th': ['Dhruv Awasthi', 'Kanika Tomar', 'Samar Puri', 'Palak Bhardwaj'],
  '12th': ['Raghav Bedi', 'Ishani Raina', 'Yuvraj Kohli', 'Sakshi Mahajan'],
}

export const classTeacherByClass = {
  Nursery: 'Priya Sharma',
  LKG: 'Neha Arora',
  UKG: 'Amit Verma',
  '1st': 'Shikha Rawat',
  '2nd': 'Priya Sharma',
  '3rd': 'Neha Arora',
  '4th': 'Amit Verma',
  '5th': 'Shikha Rawat',
  '6th': 'Priya Sharma',
  '7th': 'Neha Arora',
  '8th': 'Amit Verma',
  '9th': 'Shikha Rawat',
  '10th': 'Priya Sharma',
  '11th': 'Neha Arora',
  '12th': 'Shikha Rawat',
}

export const baseTeachers = [
  { id: 'T01', employeeId: 'T01', name: 'Shikha Rawat', subject: 'Mathematics', contactNumber: '0000001101', email: 'shikha.rawat@schoolmail.com', department: 'Mathematics', experienceYears: '8', qualification: 'M.Sc, B.Ed', status: 'active', classTeacherName: '12th', classTeacherSection: 'A', photoPreview: '' },
  { id: 'T02', employeeId: 'T02', name: 'Priya Sharma', subject: 'English', contactNumber: '0000001102', email: 'priya.sharma@schoolmail.com', department: 'Languages', experienceYears: '6', qualification: 'M.A, B.Ed', status: 'active', classTeacherName: '10th', classTeacherSection: 'B', photoPreview: '' },
  { id: 'T03', employeeId: 'T03', name: 'Amit Verma', subject: 'Science', contactNumber: '0000001103', email: 'amit.verma@schoolmail.com', department: 'Science', experienceYears: '10', qualification: 'M.Sc, B.Ed', status: 'active', classTeacherName: '8th', classTeacherSection: 'A', photoPreview: '' },
  { id: 'T04', employeeId: 'T04', name: 'Neha Arora', subject: 'Computer', contactNumber: '0000001104', email: 'neha.arora@schoolmail.com', department: 'Science', experienceYears: '5', qualification: 'MCA', status: 'active', classTeacherName: '11th', classTeacherSection: 'C', photoPreview: '' },
]

export const staffMembers = [
  { id: 'S01', name: 'Rakesh Kumar', role: 'Account Assistant', contactNumber: '0000002101' },
  { id: 'S02', name: 'Pooja Jain', role: 'Front Office', contactNumber: '0000002102' },
  { id: 'S03', name: 'Nitin Yadav', role: 'Lab Assistant', contactNumber: '0000002103' },
  { id: 'S04', name: 'Renu Singh', role: 'Transport Coordinator', contactNumber: '0000002104' },
]

export const audienceOptions = [
  { value: 'all_school', label: 'All School' },
  { value: 'students', label: 'Only Students' },
  { value: 'teachers', label: 'Only Teachers' },
  { value: 'staff', label: 'Only Other Staff' },
  { value: 'class_wise', label: 'Class-wise Students' },
]

export const noticeTypeOptions = [
  { value: 'general', label: 'General Notice' },
  { value: 'complaint', label: 'Complaint Notice' },
  { value: 'fee', label: 'Fee Related Notice' },
  { value: 'discipline', label: 'Discipline Notice' },
  { value: 'event', label: 'Event Notice' },
  { value: 'exam', label: 'Exam Notice' },
]

export const leaveAudienceOptions = [
  { value: 'all', label: 'All Requests' },
  { value: 'student', label: 'Students' },
  { value: 'teacher', label: 'Teachers' },
  { value: 'staff', label: 'Other Staff' },
]

export const leaveStatusOptions = [
  { value: 'all', label: 'All Status' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
]

export const statuses = [null, 'present', 'absent', 'leave']
export const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
export const STUDENTS_PER_PAGE = 12

export const defaultLeaveRequests = [
  {
    id: 'LR-001',
    requesterName: 'Aarav Singh',
    requesterType: 'student',
    className: 'Nursery',
    rollNumber: '001',
    reason: 'Medical leave due to fever',
    fromDate: '2026-02-18',
    toDate: '2026-02-19',
    parentContact: '0000003001',
    status: 'pending',
    requestedAt: '2026-02-17 09:30',
  },
  {
    id: 'LR-002',
    requesterName: 'Shikha Rawat',
    requesterType: 'teacher',
    className: 'N/A',
    rollNumber: '-',
    reason: 'Family function leave request',
    fromDate: '2026-02-20',
    toDate: '2026-02-20',
    parentContact: '0000001101',
    status: 'pending',
    requestedAt: '2026-02-17 11:10',
  },
  {
    id: 'LR-003',
    requesterName: 'Rakesh Kumar',
    requesterType: 'staff',
    className: 'N/A',
    rollNumber: '-',
    reason: 'Personal emergency',
    fromDate: '2026-02-18',
    toDate: '2026-02-18',
    parentContact: '0000002101',
    status: 'approved',
    requestedAt: '2026-02-16 14:20',
  },
  {
    id: 'LR-004',
    requesterName: 'Priya Sharma',
    requesterType: 'teacher',
    className: 'N/A',
    rollNumber: '-',
    reason: 'Health check-up',
    fromDate: '2026-02-19',
    toDate: '2026-02-19',
    parentContact: '0000001102',
    status: 'rejected',
    requestedAt: '2026-02-16 10:40',
  },
]
