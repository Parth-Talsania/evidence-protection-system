import axios from 'axios'

const API_BASE_URL = 'http://localhost:8000/api'

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    // If the data is FormData, remove the Content-Type header
    // to let the browser set it with the correct boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type']
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// User API
export const userAPI = {
  getAll: () => api.get('/users'),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`)
}

// Evidence API
export const evidenceAPI = {
  getAll: () => api.get('/evidence'),
  getById: (id) => api.get(`/evidence/${id}`),
  create: (data) => api.post('/evidence', data),
  update: (id, data) => api.put(`/evidence/${id}`, data),
  delete: (id) => api.delete(`/evidence/${id}`)
}

// Evidence Logs API
export const evidenceLogAPI = {
  create: (data) => api.post('/evidence-logs', data),
  getByEvidenceId: (id) => api.get(`/evidence-logs/${id}`)
}

// Activity Logs API
export const activityLogAPI = {
  getAll: () => api.get('/activity-logs')
}

// Blockchain API
export const blockchainAPI = {
  getChain: () => api.get('/blockchain'),
  validate: () => api.get('/blockchain/validate'),
  getRecent: (count = 10) => api.get(`/blockchain/recent?count=${count}`),
  getEvidenceHistory: (evidenceId) => api.get(`/blockchain/evidence/${evidenceId}`)
}

// Dashboard API
export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats')
}

export default api

