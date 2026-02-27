const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '')

const buildUrl = (path, query = {}) => {
    const url = new URL(`${API_BASE}${path}`, window.location.origin)
    Object.entries(query).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') return
        url.searchParams.set(key, String(value))
    })
    return url.toString()
}

export const request = async (path, options = {}) => {
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
