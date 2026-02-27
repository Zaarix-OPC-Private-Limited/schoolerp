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
