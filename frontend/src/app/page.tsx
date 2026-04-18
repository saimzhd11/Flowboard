'use client'
import {  useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useEffect } from 'react'

export default function Home() {
    const { user, loading: authLoading } = useAuth()
      const router = useRouter()
    
    useEffect(() => {
        if (!authLoading && !user) router.push('/auth/login')
        else router.push('/dashboard')
    }, [user, authLoading])
}