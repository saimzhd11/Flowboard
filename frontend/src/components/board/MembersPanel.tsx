'use client'
import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useBoard } from '@/context/BoardContext'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import Avatar from '@/components/ui/Avatar'
import type { Role } from '@/types'

const ROLES: Role[] = ['admin', 'member']
const ROLE_LABELS: Record<Role, string> = { owner: 'Owner', admin: 'Admin', member: 'Member' }
const ROLE_DESC: Record<Role, string> = {
  owner: 'Full access, cannot be changed',
  admin: 'Can manage columns, cards and members',
  member: 'Can create and edit cards'
}

interface Props {
  boardId: string
  onClose: () => void
}

export default function MembersPanel({ boardId, onClose }: Props) {
  const { user } = useAuth()
  const { board, fetchBoard } = useBoard()
  const [email, setEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<Role>('member')
  const [inviting, setInviting] = useState(false)

  const myRole = board?.members.find(m => m.user._id === user?._id)?.role
  const canManage = myRole === 'owner' || myRole === 'admin'

  const invite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setInviting(true)
    try {
      await api.post(`/boards/${boardId}/members`, { email: email.trim(), role: inviteRole })
      await fetchBoard(boardId)
      setEmail('')
      toast.success('Member invited')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to invite member')
    } finally { setInviting(false) }
  }

  const changeRole = async (userId: string, role: Role) => {
    try {
      await api.put(`/boards/${boardId}/members/${userId}`, { role })
      await fetchBoard(boardId)
      toast.success('Role updated')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update role')
    }
  }

  const removeMember = async (userId: string, name: string) => {
    if (!confirm(`Remove ${name} from this board?`)) return
    try {
      await api.delete(`/boards/${boardId}/members/${userId}`)
      await fetchBoard(boardId)
      toast.success('Member removed')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to remove member')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4" onClick={onClose}>
      <div className="bg-dark-200 border border-white/[0.08] rounded-2xl w-full max-w-md animate-slide-up"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <h2 className="font-semibold text-slate-100">Board members</h2>
          <button onClick={onClose} className="btn-ghost p-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Members list */}
          <div className="space-y-2">
            {board?.members.map(m => (
              <div key={m.user._id}
                className="flex items-center gap-3 p-2.5 rounded-xl bg-dark-100 border border-white/[0.04]">
                <Avatar user={m.user} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-slate-200 truncate">{m.user.name}</p>
                    {m.user._id === user?._id && (
                      <span className="text-xs text-slate-600">(you)</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 truncate">{m.user.email}</p>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {m.role === 'owner' || !canManage || m.user._id === user?._id ? (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-slate-400">
                      {ROLE_LABELS[m.role]}
                    </span>
                  ) : (
                    <>
                      <select
                        value={m.role}
                        onChange={e => changeRole(m.user._id, e.target.value as Role)}
                        className="text-xs bg-dark-300 border border-white/10 text-slate-300 rounded-lg px-2 py-1 outline-none focus:border-brand-500">
                        {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                      </select>
                      {myRole === 'owner' && (
                        <button onClick={() => removeMember(m.user._id, m.user.name)}
                          className="p-1 text-slate-600 hover:text-red-400 transition-colors">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Role legend */}
          <div className="space-y-1.5 bg-dark-100 rounded-xl p-3 border border-white/[0.04]">
            {(Object.keys(ROLE_DESC) as Role[]).map(r => (
              <div key={r} className="flex items-baseline gap-2">
                <span className="text-xs font-medium text-slate-400 w-12 flex-shrink-0">{ROLE_LABELS[r]}</span>
                <span className="text-xs text-slate-600">{ROLE_DESC[r]}</span>
              </div>
            ))}
          </div>

          {/* Invite form */}
          {canManage && (
            <div className="border-t border-white/[0.06] pt-4">
              <p className="text-xs font-medium text-slate-400 mb-3">Invite by email</p>
              <form onSubmit={invite} className="space-y-2">
                <input value={email} onChange={e => setEmail(e.target.value)}
                  className="input text-sm" type="email" placeholder="colleague@example.com" required />
                <div className="flex gap-2">
                  <select value={inviteRole} onChange={e => setInviteRole(e.target.value as Role)}
                    className="input text-sm flex-shrink-0 w-32">
                    {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                  </select>
                  <button type="submit" disabled={inviting || !email.trim()} className="btn-primary text-sm flex-1">
                    {inviting ? 'Inviting...' : 'Send invite'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
