import axios from 'axios'

const baseURL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005') + '/api'
console.log('API baseURL:', baseURL)

// Check if we're in demo mode (when API server is not available)
let isDemoMode = false
if (typeof window !== 'undefined') {
  // Try to detect if we're in production without backend
  if (window.location.hostname !== 'localhost' && baseURL.includes('localhost')) {
    isDemoMode = true
    console.warn('Running in demo mode - backend API not available')
  }
}

export const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export { isDemoMode }