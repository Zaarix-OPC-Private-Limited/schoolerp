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
