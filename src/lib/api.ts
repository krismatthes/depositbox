import axios from 'axios'

const baseURL = process.env.NEXT_PUBLIC_API_URL || '/api'
console.log('API baseURL:', baseURL)

// Check if we're in demo mode (when API server is not available)
let isDemoMode = false

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