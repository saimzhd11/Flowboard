'use client'
import { useState, useRef } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Column, Card } from '@/types'
import CardItem from '@/components/cards/CardItem'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import { useBoard } from '@/context/BoardContext'

interface Props {
  column: Column
  boardId: string
  onCardClick: (card: Card) => void
  canManage: boolean
}

export default function ColumnComponent({ column, boardId, onCardClick, canManage }: Props) {
  const { addCardLocally, updateColumnLocally, deleteColumnLocally } = useBoard()
  const [addingCard, setAddingCard] = useState(false)
  const [cardTitle, setCardTitle] = useState('')
  const [editingTitle, setEditingTitle] = useState(false)
  const [colTitle, setColTitle] = useState(column.title)
  const [saving, setSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const { attributes, listeners, setNodeRef: setSortableRef, transform, transition, isDragging } = useSortable({
    id: column._id,
    data: { type: 'COLUMN' }
  })

  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: column._id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const setRef = (el: HTMLDivElement | null) => {
    setSortableRef(el)
    setDropRef(el)
  }

  const addCard = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!cardTitle.trim()) return
    setSaving(true)
    try {
      const { data } = await api.post(`/cards/${boardId}/${column._id}`, { title: cardTitle.trim() })
      addCardLocally(data, column._id, [...column.cardOrder.map(c => c._id), data._id])
      setCardTitle('')
      setAddingCard(false)
    } catch { toast.error('Failed to add card') }
    finally { setSaving(false) }
  }

  const renameColumn = async () => {
    if (!colTitle.trim() || colTitle === column.title) { setEditingTitle(false); setColTitle(column.title); return }
    try {
      const { data } = await api.put(`/columns/${boardId}/${column._id}`, { title: colTitle.trim() })
      updateColumnLocally(data)
      setEditingTitle(false)
    } catch { toast.error('Failed to rename column') }
  }

  const deleteColumn = async () => {
    if (!confirm(`Delete "${column.title}" and all its cards?`)) return
    try {
      await api.delete(`/columns/${boardId}/${column._id}`)
      deleteColumnLocally(column._id, [])
      toast.success('Column deleted')
    } catch { toast.error('Failed to delete column') }
  }

  const cardIds = column.cardOrder.map(c => c._id)

  return (
    <div ref={setRef} style={style}
      className={`flex-shrink-0 w-72 flex flex-col rounded-xl border transition-colors duration-150
        ${isOver ? 'border-brand-500/40 bg-dark-100/80' : 'border-white/[0.06] bg-dark-200'}`}>

      {/* Column header */}
      <div className="flex items-center gap-2 px-3 pt-3 pb-2">
        <div {...attributes} {...listeners}
          className="cursor-grab active:cursor-grabbing p-0.5 text-slate-600 hover:text-slate-400 transition-colors">
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M7 4a1 1 0 110 2 1 1 0 010-2zM7 9a1 1 0 110 2 1 1 0 010-2zM7 14a1 1 0 110 2 1 1 0 010-2zM13 4a1 1 0 110 2 1 1 0 010-2zM13 9a1 1 0 110 2 1 1 0 010-2zM13 14a1 1 0 110 2 1 1 0 010-2z" />
          </svg>
        </div>

        {editingTitle ? (
          <input ref={inputRef} value={colTitle} onChange={e => setColTitle(e.target.value)}
            onBlur={renameColumn} onKeyDown={e => { if (e.key === 'Enter') renameColumn(); if (e.key === 'Escape') { setEditingTitle(false); setColTitle(column.title) } }}
            className="input text-sm font-medium flex-1 py-0.5 px-2" autoFocus />
        ) : (
          <button onClick={() => setEditingTitle(true)}
            className="flex-1 text-left text-sm font-medium text-slate-200 hover:text-white transition-colors truncate">
            {column.title}
          </button>
        )}

        <span className="text-xs text-slate-600 flex-shrink-0">{column.cardOrder.length}</span>

        {canManage && (
          <button onClick={deleteColumn}
            className="p-0.5 text-slate-700 hover:text-red-400 transition-colors flex-shrink-0">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Cards */}
      <div className="flex-1 px-2 pb-2 space-y-2 min-h-[40px] overflow-y-auto max-h-[calc(100vh-240px)]">
        <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
          {column.cardOrder.map(card => (
            <CardItem key={card._id} card={card} onClick={() => onCardClick(card)} />
          ))}
        </SortableContext>
      </div>

      {/* Add card */}
      <div className="px-2 pb-2">
        {addingCard ? (
          <form onSubmit={addCard} className="space-y-1.5">
            <textarea value={cardTitle} onChange={e => setCardTitle(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); addCard(e as any) } if (e.key === 'Escape') { setAddingCard(false); setCardTitle('') } }}
              className="input text-sm resize-none w-full" rows={2}
              placeholder="Card title..." autoFocus />
            <div className="flex gap-1.5">
              <button type="submit" disabled={saving || !cardTitle.trim()} className="btn-primary text-xs py-1 px-3">
                {saving ? '...' : 'Add'}
              </button>
              <button type="button" onClick={() => { setAddingCard(false); setCardTitle('') }}
                className="btn-ghost text-xs py-1">Cancel</button>
            </div>
          </form>
        ) : (
          <button onClick={() => setAddingCard(true)}
            className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-slate-500
                       hover:text-slate-300 hover:bg-white/5 transition-all text-sm">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add card
          </button>
        )}
      </div>
    </div>
  )
}
