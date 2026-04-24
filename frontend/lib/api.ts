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

// On 401, clear tokens and redirect to login
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      window.location.href = '/login'
    }
    return Promise.reject(error)
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
