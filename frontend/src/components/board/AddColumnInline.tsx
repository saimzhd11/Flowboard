'use client'

import { useState } from 'react'
import api from '@/lib/api'
import toast from 'react-hot-toast'

type AddColumnInlineProps = {
  boardId: string
  open: boolean
  onOpen: () => void
  onClose: () => void
  onCreated: () => void
}

export default function AddColumnInline({
  boardId,
  open,
  onOpen,
  onClose,
  onCreated
}: AddColumnInlineProps) {
  const [columnTitle, setColumnTitle] = useState('')
  const [isAddingColumn, setIsAddingColumn] = useState(false)

  const handleColumnTitleChange = (value: string) => {
    setColumnTitle(value)
  }

  const handleClose = () => {
    if (isAddingColumn) return
    setColumnTitle('')
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const title = columnTitle.trim()
    if (!title) return

    setIsAddingColumn(true)

    try {
      await api.post(`/columns/${boardId}`, { title })
      setColumnTitle('')
      onClose()
      onCreated()
    } catch {
      toast.error('Failed to add column')
    } finally {
      setIsAddingColumn(false)
    }
  }

  if (open) {
    return (
      <form
        onSubmit={handleSubmit}
        className="flex-shrink-0 w-72 bg-dark-100 border border-white/[0.06] rounded-xl p-3 space-y-2"
      >
        <input
          value={columnTitle}
          onChange={e => handleColumnTitleChange(e.target.value)}
          className="input text-sm"
          placeholder="Column name..."
          autoFocus
          onKeyDown={e => {
            if (e.key === 'Escape') handleClose()
          }}
        />

        <div className="flex gap-1.5">
          <button
            type="submit"
            disabled={isAddingColumn || !columnTitle.trim()}
            className="btn-primary text-xs py-1 px-3"
          >
            {isAddingColumn ? '...' : 'Add column'}
          </button>

          <button
            type="button"
            onClick={handleClose}
            className="btn-ghost text-xs py-1"
            disabled={isAddingColumn}
          >
            Cancel
          </button>
        </div>
      </form>
    )
  }

  return (
    <button
      onClick={onOpen}
      className="flex-shrink-0 w-72 flex items-center gap-2 px-4 py-3 rounded-xl border border-dashed border-white/10 text-slate-600 hover:text-slate-400 hover:border-white/20 hover:bg-white/[0.02] transition-all duration-150 text-sm"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
      Add column
    </button>
  )
}