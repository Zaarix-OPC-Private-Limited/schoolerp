const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '')

const buildUrl = (path, query = {}) => {
    const url = new URL(path, API_BASE.endsWith('/') ? API_BASE : API_BASE + '/')
    Object.entries(query).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') return
        url.searchParams.set(key, String(value))
    })
    return url.toString()
}

export const request = async (path, options = {}) => {
    const isFormData = options.body instanceof FormData

    const response = await fetch(buildUrl(path, options.query), {
        method: options.method || 'GET',
        headers: isFormData
            ? { ...(options.headers || {}) }                           // Let browser set multipart boundary
            : { 'Content-Type': 'application/json', ...(options.headers || {}) },
        credentials: 'include',
        body: isFormData
            ? options.body                                             // Send FormData as-is
            : options.body ? JSON.stringify(options.body) : undefined, // Stringify plain objects
    })

    if (!response.ok) {
        const text = await response.text()
        try {
            const json = JSON.parse(text)
            throw new Error(json.message || `Request failed (${response.status})`)
        } catch (e) {
            throw new Error(text || `Request failed (${response.status})`)
        }
    }

    if (response.status === 204) return null
    return response.json()
}

export const login = ({ email, password }) =>
    request('/api/v1/auth/login', {
        method: 'POST',
        body: { email, password },
    })

export const logout = () =>
    request('/api/v1/auth/logout', {
        method: 'POST',
    })

export const getMe = () =>
    request('/api/v1/auth/me')
