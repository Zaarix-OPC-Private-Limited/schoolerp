const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '')

const buildUrl = (path, query = {}) => {
  const url = new URL(`${API_BASE}${path}`, window.location.origin)
  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return
    url.searchParams.set(key, String(value))
  })
  return url.toString()
}

const request = async (path, options = {}) => {
  const response = await fetch(buildUrl(path, options.query), {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    credentials: 'include',
    body: options.body ? JSON.stringify(options.body) : undefined,
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || `Request failed (${response.status})`)
  }

  if (response.status === 204) return null
  return response.json()
}

export const getAttendance = ({ className, studentId, month, year }) =>
  request('/api/attendance', {
    query: { className, studentId, month, year },
  })

export const markAttendance = ({ studentId, date, status }) =>
  request('/api/attendance', {
    method: 'POST',
    body: { studentId, date, status },
  })

export const getStudentLeaveRequests = ({ studentId }) =>
  request('/api/attendance/leave-requests', {
    query: { studentId },
  })

export const updateLeaveRequestStatus = ({ leaveId, status }) =>
  request(`/api/attendance/leave-requests/${leaveId}`, {
    method: 'PATCH',
    body: { status },
  })

export const getAttendanceSyncStatus = ({ className }) =>
  request('/api/attendance/sync-status', {
    query: { className },
  })

export const getTeacherAttendance = ({ teacherId, month, year }) =>
  request('/api/teacher-attendance', {
    query: { teacherId, month, year },
  })

export const markTeacherAttendanceManual = ({ teacherId, date, status, reason }) =>
  request('/api/teacher-attendance/manual-override', {
    method: 'POST',
    body: { teacherId, date, status, reason },
  })

export const getTeacherAttendanceSyncStatus = ({ teacherId }) =>
  request('/api/teacher-attendance/sync-status', {
    query: { teacherId },
  })
