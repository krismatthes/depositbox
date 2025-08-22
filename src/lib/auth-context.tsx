'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import Cookies from 'js-cookie'
import { api } from './api'

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  phone?: string
  role?: string
  createdAt: string
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, firstName: string, lastName: string, phone?: string, role?: string) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = Cookies.get('token')
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      // Fetch user data if token exists
      fetchUserProfile()
    } else {
      setLoading(false)
    }
  }, [])

  const fetchUserProfile = async () => {
    try {
      const response = await api.get('/auth/profile')
      setUser(response.data.user)
    } catch (error: any) {
      console.error('Failed to fetch user profile:', error)
      
      // Fallback for demo when API is not available
      if (error.code === 'ERR_NETWORK' || 
          error.message?.includes('Network Error') ||
          error.response?.status === 404 ||
          error.response?.status === 503) {
        // Check if demo user exists in localStorage
        const demoUserStr = localStorage.getItem('demoUser')
        if (demoUserStr) {
          const demoUser = JSON.parse(demoUserStr)
          setUser(demoUser)
        } else {
          // Token might be invalid, clear it
          Cookies.remove('token')
          delete api.defaults.headers.common['Authorization']
        }
      } else {
        // Token might be invalid, clear it
        Cookies.remove('token')
        delete api.defaults.headers.common['Authorization']
      }
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    try {
      console.log('Login attempt to:', api.defaults.baseURL + '/auth/login')
      const response = await api.post('/auth/login', { email, password })
      console.log('Login response:', response.data)
      const { user: userData, token } = response.data
      
      Cookies.set('token', token, { expires: 7 })
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      setUser(userData)
      console.log('User set:', userData)
    } catch (error: any) {
      console.log('Login API error:', error)
      console.log('Error code:', error.code)
      console.log('Error status:', error.response?.status)
      
      // Fallback for demo when API is not available
      if (error.code === 'ERR_NETWORK' || 
          error.message?.includes('Network Error') ||
          error.response?.status === 404 ||
          error.response?.status === 503) {
        console.warn('API not available, using demo mode')
        
        // Check if demo user exists in localStorage
        const demoUserStr = localStorage.getItem('demoUser')
        if (demoUserStr) {
          const demoUser = JSON.parse(demoUserStr)
          if (demoUser.email === email) {
            const token = `demo-token-${Date.now()}`
            Cookies.set('token', token, { expires: 7 })
            setUser(demoUser)
            return
          }
        }
        
        throw new Error('Demo user not found. Please register first.')
      }
      
      console.error('Login API error:', error)
      throw error
    }
  }

  const register = async (email: string, password: string, firstName: string, lastName: string, phone?: string, role?: string) => {
    try {
      const response = await api.post('/auth/register', { email, password, firstName, lastName, phone, role })
      const { user: userData, token } = response.data
      
      Cookies.set('token', token, { expires: 7 })
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      setUser(userData)
    } catch (error: any) {
      console.log('Registration API error:', error)
      console.log('Error code:', error.code)
      console.log('Error status:', error.response?.status)
      
      // Fallback for demo when API is not available
      if (error.code === 'ERR_NETWORK' || 
          error.message?.includes('Network Error') ||
          error.response?.status === 404 ||
          error.response?.status === 503) {
        console.warn('API not available, using demo mode')
        
        // Create demo user
        const userData = {
          id: `demo-${Date.now()}`,
          email,
          firstName,
          lastName,
          phone,
          role,
          createdAt: new Date().toISOString()
        }
        
        const token = `demo-token-${Date.now()}`
        
        // Store in localStorage for demo
        localStorage.setItem('demoUser', JSON.stringify(userData))
        Cookies.set('token', token, { expires: 7 })
        setUser(userData)
        return
      }
      
      throw error
    }
  }

  const logout = () => {
    Cookies.remove('token')
    delete api.defaults.headers.common['Authorization']
    localStorage.removeItem('demoUser')
    setUser(null)
  }

  const refreshUser = async () => {
    await fetchUserProfile()
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, refreshUser, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}