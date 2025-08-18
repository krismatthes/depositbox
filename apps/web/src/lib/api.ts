import axios from 'axios'

const baseURL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005') + '/api'
console.log('API baseURL:', baseURL)

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