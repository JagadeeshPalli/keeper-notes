import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081'

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Attach stored access token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ── Token refresh queue ─────────────────────────────────────────────────────
// When an access token expires, multiple concurrent requests can all get 401.
// We queue them and replay them all once a single refresh succeeds.
let isRefreshing = false
let failedQueue: { resolve: (token: string) => void; reject: (err: unknown) => void }[] = []

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach(p => error ? p.reject(error) : p.resolve(token!))
  failedQueue = []
}

function clearSessionAndRedirect() {
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
  window.location.href = '/login'
}

// On 401:
// 1. If it's an auth endpoint (login / register / refresh), let the form handle it.
// 2. Otherwise, attempt a silent token refresh first.
//    Success → replay the failed request with the new token.
//    Failure → clear session and redirect to /login.
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config
    const url: string = originalRequest?.url ?? ''
    const isAuthEndpoint = url.includes('/api/auth/')

    if (error.response?.status !== 401 || isAuthEndpoint || originalRequest._retry) {
      return Promise.reject(error)
    }

    // If a refresh is already in flight, queue this request until it resolves
    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject })
      }).then(token => {
        originalRequest.headers.Authorization = `Bearer ${token}`
        return api(originalRequest)
      })
    }

    originalRequest._retry = true
    isRefreshing = true

    const refreshToken = localStorage.getItem('refreshToken')
    if (!refreshToken) {
      isRefreshing = false
      clearSessionAndRedirect()
      return Promise.reject(error)
    }

    try {
      // Use a plain axios call to avoid triggering this interceptor again
      const res = await api.post<ApiResponse<AuthResponse>>(
        '/api/auth/refresh',
        { refreshToken },
      )
      const { accessToken, refreshToken: newRefresh } = res.data.data
      localStorage.setItem('accessToken', accessToken)
      localStorage.setItem('refreshToken', newRefresh)
      api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`
      processQueue(null, accessToken)
      originalRequest.headers.Authorization = `Bearer ${accessToken}`
      return api(originalRequest)
    } catch (refreshError) {
      processQueue(refreshError, null)
      clearSessionAndRedirect()
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  }
)

export type ApiResponse<T> = {
  data: T
  message?: string
}

export type AuthResponse = {
  accessToken: string
  refreshToken: string
  user: UserProfile
}

export type UserProfile = {
  id: string
  email: string
  displayName: string
  avatarUrl?: string
  createdAt: string
}

export const authApi = {
  register: (email: string, password: string, displayName: string) =>
    api.post<ApiResponse<AuthResponse>>('/api/auth/register', { email, password, displayName }),

  login: (email: string, password: string) =>
    api.post<ApiResponse<AuthResponse>>('/api/auth/login', { email, password }),

  logout: (refreshToken: string) =>
    api.post('/api/auth/logout', { refreshToken }),

  me: () => api.get<ApiResponse<UserProfile>>('/api/auth/me'),
}
