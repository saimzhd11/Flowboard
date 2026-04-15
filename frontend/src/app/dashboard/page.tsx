'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import type { BoardSummary } from '@/types'

const COLORS = ['#6366f1','#8b5cf6','#ec4899','#f59e0b','#10b981','#3b82f6','#ef4444','#06b6d4']

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [boards, setBoards] = useState<BoardSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', color: COLORS[0] })

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/login')
  }, [user, authLoading, router])

  useEffect(() => {
    if (!user) return
    api.get<BoardSummary[]>('/boards').then(r => setBoards(r.data)).finally(() => setLoading(false))
  }, [user])

  const createBoard = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) return
    setCreating(true)
    try {
      const { data } = await api.post<BoardSummary>('/boards', form)
      setBoards(p => [data, ...p])
      setShowNew(false)
      setForm({ title: '', description: '', color: COLORS[0] })
      toast.success('Board created')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create board')
    } finally { setCreating(false) }
  }

  if (authLoading || !user) return null

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold text-slate-100">My Boards</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {boards.length} {boards.length === 1 ? 'workspace' : 'workspaces'}
          </p>
        </div>
        <button onClick={() => setShowNew(true)} className="btn-primary flex items-center gap-1.5">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New board
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : boards.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-14 h-14 rounded-2xl bg-dark-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7" />
            </svg>
          </div>
          <p className="text-slate-400 font-medium">No boards yet</p>
          <p className="text-slate-600 text-sm mt-1 mb-4">Create your first board to get started</p>
          <button onClick={() => setShowNew(true)} className="btn-primary">Create board</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {boards.map(board => (
            <button key={board._id} onClick={() => router.push(`/dashboard/board/${board._id}`)}
              className="card-surface p-5 text-left hover:border-white/20 hover:bg-dark-100/80 transition-all duration-150 group">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center text-white font-semibold text-sm"
                  style={{ backgroundColor: board.color }}>
                  {board.title[0].toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium text-slate-100 truncate group-hover:text-white transition-colors">
                    {board.title}
                  </h3>
                  {board.description && (
                    <p className="text-slate-500 text-xs mt-0.5 truncate">{board.description}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex -space-x-1.5">
                  {board.members.slice(0, 4).map(m => (
                    <div key={m.user._id}
                      className="w-6 h-6 rounded-full bg-dark-200 border border-dark-300 flex items-center justify-center text-xs text-slate-300 font-medium"
                      title={m.user.name}>
                      {m.user.name[0].toUpperCase()}
                    </div>
                  ))}
                  {board.members.length > 4 && (
                    <div className="w-6 h-6 rounded-full bg-dark-200 border border-dark-300 flex items-center justify-center text-xs text-slate-500">
                      +{board.members.length - 4}
                    </div>
                  )}
                </div>
                <span className="text-slate-600 text-xs">
                  {new Date(board.updatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* New board modal */}
      {showNew && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4" onClick={() => setShowNew(false)}>
          <div className="card-surface p-6 w-full max-w-md animate-slide-up" onClick={e => e.stopPropagation()}>
            <h2 className="font-semibold text-slate-100 mb-5">Create board</h2>
            <form onSubmit={createBoard} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Name *</label>
                <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  className="input" placeholder="e.g. Product Roadmap" required autoFocus />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Description</label>
                <input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  className="input" placeholder="Optional description" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2">Color</label>
                <div className="flex gap-2 flex-wrap">
                  {COLORS.map(c => (
                    <button key={c} type="button" onClick={() => setForm(p => ({ ...p, color: c }))}
                      className={`w-7 h-7 rounded-lg transition-all ${form.color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-dark-100 scale-110' : 'hover:scale-105'}`}
                      style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowNew(false)} className="btn-ghost flex-1">Cancel</button>
                <button type="submit" disabled={creating || !form.title.trim()} className="btn-primary flex-1">
                  {creating ? 'Creating...' : 'Create board'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
