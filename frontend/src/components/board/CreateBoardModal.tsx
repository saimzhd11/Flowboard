'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import api from '@/lib/api'
import type { BoardSummary, CreateBoardForm } from '@/types'
import { BOARD_COLORS } from '@/constants/appConstants'

type CreateBoardModalProps = {
  open: boolean
  onClose: () => void
  onCreated: (board: BoardSummary) => void
}

const initialForm: CreateBoardForm = {
  title: '',
  description: '',
  color: BOARD_COLORS[0]
}

export default function CreateBoardModal({ open, onClose, onCreated }: CreateBoardModalProps) {
  const [form, setForm] = useState<CreateBoardForm>(initialForm)
  const [isCreatingBoard, setIsCreatingBoard] = useState(false)

  const handleTitleChange = (value: string) => {
    setForm(prev => ({ ...prev, title: value }))
  }

  const handleDescriptionChange = (value: string) => {
    setForm(prev => ({ ...prev, description: value }))
  }

  const handleColorSelect = (color: string) => {
    setForm(prev => ({ ...prev, color }))
  }

  const handleClose = () => {
    if (isCreatingBoard) return
    setForm(initialForm)
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.title.trim()) return

    setIsCreatingBoard(true)

    try {
      const { data } = await api.post<BoardSummary>('/boards', form)
      onCreated(data)
      toast.success('Board created')
      setForm(initialForm)
      onClose()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create board')
    } finally {
      setIsCreatingBoard(false)
    }
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4"
      onClick={handleClose}
    >
      <div
        className="card-surface p-6 w-full max-w-md animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="font-semibold text-slate-100 mb-5">Create board</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Name *
            </label>
            <input
              value={form.title}
              onChange={e => handleTitleChange(e.target.value)}
              className="input"
              placeholder="e.g. Product Roadmap"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Description
            </label>
            <input
              value={form.description}
              onChange={e => handleDescriptionChange(e.target.value)}
              className="input"
              placeholder="Optional description"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2">
              Color
            </label>
            <div className="flex gap-2 flex-wrap">
              {BOARD_COLORS.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => handleColorSelect(color)}
                  className={`w-7 h-7 rounded-lg transition-all ${
                    form.color === color
                      ? 'ring-2 ring-white ring-offset-2 ring-offset-dark-100 scale-110'
                      : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={handleClose}
              className="btn-ghost flex-1"
              disabled={isCreatingBoard}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isCreatingBoard || !form.title.trim()}
              className="btn-primary flex-1"
            >
              {isCreatingBoard ? 'Creating...' : 'Create board'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}