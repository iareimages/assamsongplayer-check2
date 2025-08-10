import { supabase } from '@/lib/supabase'
import { useEffect, useState } from 'react'

interface User {
  id: string
  email: string
  user_metadata?: {
    full_name?: string
    name?: string
    avatar_url?: string
  }
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check localStorage for user_id
    const storedUserId = localStorage.getItem('user_id')
    const storedUserData = localStorage.getItem('user_data')
    
    if (storedUserId && storedUserData) {
      try {
        const userData = JSON.parse(storedUserData)
        setUser(userData)
        setLoading(false)
      } catch (error) {
        console.error('Error parsing stored user data:', error)
        localStorage.removeItem('user_id')
        localStorage.removeItem('user_data')
        setUser(null)
        setLoading(false)
      }
    } else {
      setUser(null)
      setLoading(false)
    }
  }, [])

  const signInWithGoogle = async () => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      })
      if (error) {
        console.error('Error signing in:', error)
        setLoading(false)
      }
    } catch (error) {
      console.error('Sign in error:', error)
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      console.log('🚪 Starting sign out process...')
      setLoading(true)
      
      // Clear localStorage
      localStorage.removeItem('user_id')
      localStorage.removeItem('user_data')
      console.log('🗑️ Cleared localStorage')
      
      // Sign out from Supabase
      await supabase.auth.signOut()
      console.log('✅ Signed out from Supabase')
      
      // Clear any other cached data
      sessionStorage.clear()
      
      setUser(null)
      setLoading(false)
      
      // Force page reload to ensure clean state
      console.log('🔄 Forcing page reload...')
      setTimeout(() => {
        window.location.reload()
      }, 100)
    } catch (error) {
      console.error('Sign out error:', error)
      // Even if there's an error, clear local state and redirect
      localStorage.removeItem('user_id')
      localStorage.removeItem('user_data')
      setUser(null)
      setLoading(false)
      setTimeout(() => {
        window.location.reload()
      }, 100)
    }
  }

  // Listen for successful OAuth callback
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const userData = {
            id: session.user.id,
            email: session.user.email!,
            user_metadata: session.user.user_metadata
          }
          
          // Store in localStorage
          localStorage.setItem('user_id', session.user.id)
          localStorage.setItem('user_data', JSON.stringify(userData))
          
          setUser(userData)
          setLoading(false)

          // Update user data in database
          try {
            await supabase
              .from('users')
              .upsert({
                id: session.user.id,
                email: session.user.email!,
                username: session.user.user_metadata?.full_name || session.user.user_metadata?.name,
                avatar_url: session.user.user_metadata?.avatar_url,
                last_login: new Date().toISOString()
              })
          } catch (error) {
            console.error('Error updating user data:', error)
          }
        } else if (event === 'SIGNED_OUT') {
          localStorage.removeItem('user_id')
          localStorage.removeItem('user_data')
          setUser(null)
          setLoading(false)
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return {
    user,
    loading,
    signInWithGoogle,
    signOut
  }
}