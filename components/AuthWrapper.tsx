import { useAuth } from '@/hooks/useAuth'
import React, { useEffect } from 'react'
import LoginPage from './LoginPage'

interface AuthWrapperProps {
  children: React.ReactNode
}

const AuthWrapper: React.FC<AuthWrapperProps> = ({ children }) => {
  const { user, loading } = useAuth()
  const [isInitialized, setIsInitialized] = React.useState(false)

  // Check for user_id in localStorage on mount
  useEffect(() => {
    const initializeAuth = () => {
      const userId = localStorage.getItem('user_id')
      const userData = localStorage.getItem('user_data')
      console.log('🔍 AuthWrapper initialization - userId:', userId)
      console.log('🔍 AuthWrapper initialization - userData:', userData ? 'exists' : 'missing')
      if (!userId && !loading) {
        console.log('No user_id found in localStorage')
      }
      setIsInitialized(true)
    }
    
    // Small delay to ensure localStorage is ready
    const timer = setTimeout(initializeAuth, 100)
    return () => clearTimeout(timer)
  }, [loading])

  // Add effect to check user state changes
  useEffect(() => {
    console.log('👤 AuthWrapper user state:', user ? 'logged in' : 'not logged in')
    console.log('⏳ AuthWrapper loading state:', loading)
    console.log('🚀 AuthWrapper initialized state:', isInitialized)
  }, [user, loading, isInitialized])
  // Show loading spinner while initializing or loading
  if (loading || !isInitialized) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
          <p className="text-white text-lg">Loading your music...</p>
        </div>
      </div>
    )
  }

  // Show login page if no user
  if (!user && isInitialized) {
    return <LoginPage />
  }

  // Show main app if user is authenticated
  return user ? <>{children}</> : null
}

export default AuthWrapper