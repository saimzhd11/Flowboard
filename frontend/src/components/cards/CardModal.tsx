'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useBoard } from '@/context/BoardContext'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import PriorityBadge from '@/components/ui/PriorityBadge'
import Avatar from '@/components/ui/Avatar'
import type { Card, Priority } from '@/types'

// Patch payload that allows sending assignee id arrays (string[])
type UpdateCardPayload = Partial<Omit<Card, 'assignees'>> & { assignees?: string[] | Card['assignees'] }

const PRIORITIES: Priority[] = ['low', 'medium', 'high', 'urgent']
const COVER_COLORS = ['#6366f1','#8b5cf6','#ec4899','#f59e0b','#10b981','#3b82f6','#ef4444','']

interface Props {
  card: Card
  boardId: string
  onClose: () => void
}

export default function CardModal({ card: initialCard, boardId, onClose }: Props) {
  const { user } = useAuth()
  const { board, updateCardLocally, deleteCardLocally } = useBoard()
  const [card, setCard] = useState<Card>(initialCard)
  const [editTitle, setEditTitle] = useState(false)
  const [title, setTitle] = useState(card.title)
  const [description, setDescription] = useState(card.description)
  const [editDesc, setEditDesc] = useState(false)
  const [comment, setComment] = useState('')
  const [saving, setSaving] = useState(false)
  const [addingLabel, setAddingLabel] = useState(false)
  const [newLabel, setNewLabel] = useState('')

  const patch = async (data: UpdateCardPayload) => {
    try {
      const { data: updated } = await api.put<Card>(`/cards/${boardId}/${card._id}`, data)
      setCard(updated)
      updateCardLocally(updated)
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Update failed')
    }
  }

  const saveTitle = async () => {
    if (!title.trim() || title === card.title) { setEditTitle(false); setTitle(card.title); return }
    await patch({ title })
    setEditTitle(false)
  }

  const saveDesc = async () => {
    await patch({ description })
    setEditDesc(false)
    toast.success('Description saved')
  }

  const addComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!comment.trim()) return
    setSaving(true)
    try {
      const { data } = await api.post(`/cards/${boardId}/${card._id}/comments`, { text: comment })
      setCard(p => ({ ...p, comments: [...p.comments, data] }))
      updateCardLocally({ ...card, comments: [...card.comments, data] })
      setComment('')
    } catch { toast.error('Failed to add comment') }
    finally { setSaving(false) }
  }

  const deleteComment = async (commentId: string) => {
    try {
      await api.delete(`/cards/${boardId}/${card._id}/comments/${commentId}`)
      const updated = { ...card, comments: card.comments.filter(c => c._id !== commentId) }
      setCard(updated)
      updateCardLocally(updated)
    } catch { toast.error('Failed to delete comment') }
  }

  const deleteCard = async () => {
    if (!confirm('Delete this card?')) return
    try {
      await api.delete(`/cards/${boardId}/${card._id}`)
      deleteCardLocally(card._id, card.column)
      onClose()
      toast.success('Card deleted')
    } catch { toast.error('Failed to delete card') }
  }

  const addLabel = async () => {
    if (!newLabel.trim() || card.labels.includes(newLabel.trim())) return
    await patch({ labels: [...card.labels, newLabel.trim()] })
    setNewLabel('')
    setAddingLabel(false)
  }

  const removeLabel = (label: string) => patch({ labels: card.labels.filter(l => l !== label) })

  const myRole = board?.members.find(m => m.user._id === user?._id)?.role

  return (
    <div className="fixed inset-0 bg-black/70 flex items-start justify-center z-50 pt-10 px-4 pb-4 overflow-y-auto"
      onClick={onClose}>
      <div className="bg-dark-200 border border-white/[0.08] rounded-2xl w-full max-w-2xl animate-slide-up"
        onClick={e => e.stopPropagation()}>

        {/* Cover */}
        {card.coverColor && (
          <div className="h-3 rounded-t-2xl" style={{ backgroundColor: card.coverColor }} />
        )}

        <div className="p-6">
          {/* Title */}
          <div className="flex items-start justify-between gap-4 mb-5">
            {editTitle ? (
              <input value={title} onChange={e => setTitle(e.target.value)}
                onBlur={saveTitle} onKeyDown={e => e.key === 'Enter' && saveTitle()}
                className="input text-base font-semibold flex-1" autoFocus />
            ) : (
              <h2 className="text-base font-semibold text-slate-100 flex-1 cursor-pointer hover:text-white"
                onClick={() => setEditTitle(true)}>{card.title}</h2>
            )}
            <button onClick={onClose} className="btn-ghost p-1 flex-shrink-0">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-3 gap-6">
            {/* Left - main content */}
            <div className="col-span-2 space-y-5">
              {/* Description */}
              <div>
                <p className="text-xs font-medium text-slate-500 mb-2">Description</p>
                {editDesc ? (
                  <div>
                    <textarea value={description} onChange={e => setDescription(e.target.value)}
                      className="input resize-none text-sm" rows={4} autoFocus />
                    <div className="flex gap-2 mt-2">
                      <button onClick={saveDesc} className="btn-primary text-xs py-1 px-3">Save</button>
                      <button onClick={() => { setEditDesc(false); setDescription(card.description) }}
                        className="btn-ghost text-xs py-1">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div onClick={() => setEditDesc(true)}
                    className="min-h-[60px] rounded-lg bg-dark-100 border border-white/[0.04] p-3 cursor-pointer
                               text-sm text-slate-400 hover:border-white/10 hover:text-slate-300 transition-all">
                    {card.description || <span className="text-slate-600">Click to add description...</span>}
                  </div>
                )}
              </div>

              {/* Labels */}
              <div>
                <p className="text-xs font-medium text-slate-500 mb-2">Labels</p>
                <div className="flex flex-wrap gap-1.5">
                  {card.labels.map(l => (
                    <span key={l} className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-brand-500/15 text-brand-400">
                      {l}
                      <button onClick={() => removeLabel(l)} className="hover:text-brand-200 ml-0.5">×</button>
                    </span>
                  ))}
                  {addingLabel ? (
                    <div className="flex items-center gap-1">
                      <input value={newLabel} onChange={e => setNewLabel(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && addLabel()}
                        className="input text-xs py-0.5 px-2 w-28" placeholder="Label..." autoFocus />
                      <button onClick={addLabel} className="btn-primary text-xs py-0.5 px-2">Add</button>
                      <button onClick={() => setAddingLabel(false)} className="btn-ghost text-xs py-0.5">✕</button>
                    </div>
                  ) : (
                    <button onClick={() => setAddingLabel(true)}
                      className="text-xs px-2 py-0.5 rounded-full border border-dashed border-white/20 text-slate-500 hover:text-slate-400 hover:border-white/30 transition-all">
                      + Add label
                    </button>
                  )}
                </div>
              </div>

              {/* Comments */}
              <div>
                <p className="text-xs font-medium text-slate-500 mb-3">
                  Comments {card.comments.length > 0 && <span className="text-slate-600">({card.comments.length})</span>}
                </p>
                <div className="space-y-3 mb-3 max-h-48 overflow-y-auto">
                  {card.comments.map(c => (
                    <div key={c._id} className="flex gap-2.5">
                      <Avatar user={c.author} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          <span className="text-xs font-medium text-slate-300">{c.author.name}</span>
                          <span className="text-xs text-slate-600">
                            {new Date(c.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                          </span>
                          {c.author._id === user?._id && (
                            <button onClick={() => deleteComment(c._id)}
                              className="text-xs text-slate-700 hover:text-red-400 transition-colors ml-auto">Delete</button>
                          )}
                        </div>
                        <p className="text-sm text-slate-400 mt-0.5">{c.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <form onSubmit={addComment} className="flex gap-2">
                  <input value={comment} onChange={e => setComment(e.target.value)}
                    className="input text-sm flex-1" placeholder="Add a comment..." />
                  <button type="submit" disabled={saving || !comment.trim()} className="btn-primary text-sm px-3">
                    {saving ? '...' : 'Post'}
                  </button>
                </form>
              </div>
            </div>

            {/* Right - metadata */}
            <div className="space-y-4">
              {/* Priority */}
              <div>
                <p className="text-xs font-medium text-slate-500 mb-2">Priority</p>
                <div className="space-y-1">
                  {PRIORITIES.map(p => (
                    <button key={p} onClick={() => patch({ priority: p })}
                      className={`w-full text-left px-2 py-1 rounded text-xs transition-all ${card.priority === p ? 'bg-white/10' : 'hover:bg-white/5'}`}>
                      <PriorityBadge priority={p} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Due date */}
              <div>
                <p className="text-xs font-medium text-slate-500 mb-2">Due date</p>
                <input type="date" value={card.dueDate?.split('T')[0] || ''}
                  onChange={e => patch({ dueDate: e.target.value || null })}
                  className="input text-xs py-1.5" />
              </div>

              {/* Cover color */}
              <div>
                <p className="text-xs font-medium text-slate-500 mb-2">Cover</p>
                <div className="flex flex-wrap gap-1.5">
                  {COVER_COLORS.map(c => (
                    <button key={c} onClick={() => patch({ coverColor: c })}
                      className={`w-6 h-6 rounded transition-all ${!c ? 'border border-dashed border-white/20 text-slate-600 text-xs' : ''} ${card.coverColor === c ? 'ring-2 ring-white ring-offset-1 ring-offset-dark-200 scale-110' : 'hover:scale-105'}`}
                      style={c ? { backgroundColor: c } : {}}>
                      {!c && '✕'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Assignees */}
              <div>
                <p className="text-xs font-medium text-slate-500 mb-2">Assignees</p>
                <div className="space-y-1.5">
                  {board?.members.map(m => {
                    const isAssigned = card.assignees.some(a => a._id === m?.user?._id)
                    return (
                      <button key={m?.user?._id}
                        onClick={() => patch({
                          assignees: isAssigned
                            ? card.assignees.filter(a => a._id !== m?.user?._id).map(a => a._id)
                            : [...card.assignees.map(a => a._id), m?.user?._id]
                        })}
                        className={`w-full flex items-center gap-2 px-2 py-1 rounded text-xs transition-all ${isAssigned ? 'bg-brand-500/15' : 'hover:bg-white/5'}`}>
                        <Avatar user={m?.user} />
                        <span className={isAssigned ? 'text-brand-300' : 'text-slate-400'}>{m?.user?.name}</span>
                        {isAssigned && <svg className="w-3 h-3 text-brand-400 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
                      </button>
                    )
                  })}
                </div>
              </div>

              {(myRole === 'owner' || myRole === 'admin') && (
                <button onClick={deleteCard} className="btn-danger w-full text-xs mt-2">
                  Delete card
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
