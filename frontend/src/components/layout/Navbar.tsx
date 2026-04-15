'use client'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const initials = user?.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) ?? '?'

  return (
    <header className="h-12 bg-dark-200 border-b border-white/[0.06] flex items-center px-4 gap-4 sticky top-0 z-20">
      <Link href="/dashboard" className="flex items-center gap-2 mr-2">
        <div className="w-6 h-6 rounded-md bg-brand-500/20 flex items-center justify-center">
          <svg className="w-3.5 h-3.5 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7" />
          </svg>
        </div>
        <span className="text-sm font-semibold text-slate-100">FlowBoard</span>
      </Link>

      <div className="flex-1" />

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-white/5 transition-colors">
          <div className="w-6 h-6 rounded-full bg-brand-500/30 flex items-center justify-center text-brand-300 text-xs font-semibold">
            {initials}
          </div>
          <span className="text-sm text-slate-300 hidden sm:block">{user?.name}</span>
        </div>
        <button onClick={logout} className="btn-ghost text-xs">Sign out</button>
      </div>
    </header>
  )
}
