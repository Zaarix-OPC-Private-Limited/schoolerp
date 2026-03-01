import { request } from './authApi'

export const createStudent = (studentData) =>
    request('/api/v1/students', {
        method: 'POST',
        body: studentData,
    })

export const getStudents = () =>
    request('/api/v1/students', {
        method: 'GET',
    })

export const createTeacher = (teacherData) =>
    request('/api/v1/teachers', {
        method: 'POST',
        body: teacherData,
    })

export const getTeachers = () =>
    request('/api/v1/teachers', {
        method: 'GET',
    })

export const createClass = (classData) =>
    request('/api/v1/classes', {
        method: 'POST',
        body: classData,
    })

export const getClasses = () =>
    request('/api/v1/classes', {
        method: 'GET',
    })

export const createStaff = (staffData) =>
    request('/api/v1/staff', {
        method: 'POST',
        body: staffData,
    })

export const getStaff = () =>
    request('/api/v1/staff', {
        method: 'GET',
    })

// Bulk mark attendance — only exceptions (Absent/Late/Half-Day) are saved
// Body: { date: 'YYYY-MM-DD', entries: [{ userId, userRole, status }] }
export const bulkMarkAttendance = (date, entries) =>
    request('/api/v1/attendance/bulk', {
        method: 'POST',
        body: { date, entries },
    })

// Fetch existing exception records for a date and role
export const getAttendanceExceptions = (date, role) =>
    request('/api/v1/attendance', {
        method: 'GET',
        query: { date, role },
    })
