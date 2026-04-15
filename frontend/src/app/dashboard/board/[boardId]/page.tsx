'use client'
import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  DndContext, DragEndEvent, DragOverEvent, DragStartEvent,
  PointerSensor, useSensor, useSensors, closestCorners, DragOverlay
} from '@dnd-kit/core'
import { SortableContext, horizontalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import { useAuth } from '@/context/AuthContext'
import { BoardProvider, useBoard } from '@/context/BoardContext'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import BoardHeader from '@/components/board/BoardHeader'
import ColumnComponent from '@/components/board/ColumnComponent'
import MembersPanel from '@/components/board/MembersPanel'
import CardModal from '@/components/cards/CardModal'
import CardItem from '@/components/cards/CardItem'
import type { Card, Column } from '@/types'

// Inner board component — has access to BoardContext
function BoardView() {
  const params = useParams()
  const boardId = params.boardId as string
  const { user } = useAuth()
  const router = useRouter()
  const { board, loading, error, fetchBoard, setColumnOrder, setCardOrderInColumn } = useBoard()

  const [selectedCard, setSelectedCard] = useState<Card | null>(null)
  const [showMembers, setShowMembers] = useState(false)
  const [showAddColumn, setShowAddColumn] = useState(false)
  const [newColumnTitle, setNewColumnTitle] = useState('')
  const [addingCol, setAddingCol] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [activeDragType, setActiveDragType] = useState<'CARD' | 'COLUMN' | null>(null)
  const [activeCard, setActiveCard] = useState<Card | null>(null)

  useEffect(() => { fetchBoard(boardId) }, [boardId, fetchBoard])

  useEffect(() => {
    if (error) { toast.error(error); router.push('/dashboard') }
  }, [error, router])

  const myRole = board?.members.find(m => m.user._id === user?._id)?.role
  const canManage = myRole === 'owner' || myRole === 'admin'

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const findColumnOfCard = useCallback((cardId: string): Column | undefined => {
    return board?.columnOrder.find(col => col.cardOrder.some(c => c._id === cardId))
  }, [board])

  const onDragStart = (e: DragStartEvent) => {
    const type = e.active.data.current?.type
    setActiveDragType(type)
    setActiveId(e.active.id as string)
    if (type === 'CARD') {
      setActiveCard(e.active.data.current?.card ?? null)
    }
  }

  const onDragOver = (e: DragOverEvent) => {
    const { active, over } = e
    if (!over || !board) return

    const activeType = active.data.current?.type
    if (activeType !== 'CARD') return

    const activeColId = findColumnOfCard(active.id as string)?._id
    const overColId = over.data.current?.type === 'CARD'
      ? findColumnOfCard(over.id as string)?._id
      : over.id as string

    if (!activeColId || !overColId || activeColId === overColId) return

    // Move card to different column optimistically
    const activeCol = board.columnOrder.find(c => c._id === activeColId)
    const overCol = board.columnOrder.find(c => c._id === overColId)
    if (!activeCol || !overCol) return

    const movingCard = activeCol.cardOrder.find(c => c._id === active.id)
    if (!movingCard) return

    const newActiveCards = activeCol.cardOrder.filter(c => c._id !== active.id)
    const newOverCards = [...overCol.cardOrder, movingCard]

    setCardOrderInColumn(activeColId, newActiveCards.map(c => c._id))
    setCardOrderInColumn(overColId, newOverCards.map(c => c._id))
  }

  const onDragEnd = async (e: DragEndEvent) => {
    const { active, over } = e
    setActiveId(null)
    setActiveDragType(null)
    setActiveCard(null)
    if (!over || !board) return

    const activeType = active.data.current?.type

    // Column reorder
    if (activeType === 'COLUMN' && active.id !== over.id) {
      const oldIndex = board.columnOrder.findIndex(c => c._id === active.id)
      const newIndex = board.columnOrder.findIndex(c => c._id === over.id)
      if (oldIndex === -1 || newIndex === -1) return
      const newOrder = arrayMove(board.columnOrder, oldIndex, newIndex).map(c => c._id)
      setColumnOrder(newOrder)
      try {
        await api.put(`/boards/${boardId}/column-order`, { columnOrder: newOrder })
      } catch { toast.error('Failed to save column order'); fetchBoard(boardId) }
      return
    }

    // Card reorder within same column
    if (activeType === 'CARD') {
      const activeColId = findColumnOfCard(active.id as string)?._id
      const overColId = over.data.current?.type === 'CARD'
        ? findColumnOfCard(over.id as string)?._id
        : over.id as string

      if (!activeColId) return

      if (activeColId === overColId) {
        const col = board.columnOrder.find(c => c._id === activeColId)
        if (!col) return
        const oldIdx = col.cardOrder.findIndex(c => c._id === active.id)
        const newIdx = over.data.current?.type === 'CARD'
          ? col.cardOrder.findIndex(c => c._id === over.id)
          : col.cardOrder.length - 1
        if (oldIdx === newIdx) return
        const newOrder = arrayMove(col.cardOrder, oldIdx, newIdx).map(c => c._id)
        setCardOrderInColumn(activeColId, newOrder)
        try {
          await api.put(`/columns/${boardId}/${activeColId}/card-order`, { cardOrder: newOrder })
        } catch { toast.error('Failed to save card order'); fetchBoard(boardId) }
      } else if (overColId) {
        // Cross-column move — persist via card update
        try {
          const overCol = board.columnOrder.find(c => c._id === overColId)
          if (!overCol) return
          const newOrder = overCol.cardOrder.map(c => c._id)
          await api.put(`/cards/${boardId}/${active.id}`, { column: overColId })
          await api.put(`/columns/${boardId}/${overColId}/card-order`, { cardOrder: newOrder })
        } catch { toast.error('Failed to move card'); fetchBoard(boardId) }
      }
    }
  }

  const addColumn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newColumnTitle.trim()) return
    setAddingCol(true)
    try {
      await api.post(`/columns/${boardId}`, { title: newColumnTitle.trim() })
      setNewColumnTitle('')
      setShowAddColumn(false)
    } catch { toast.error('Failed to add column') }
    finally { setAddingCol(false) }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-300 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!board) return null

  const columnIds = board.columnOrder.map(c => c._id)

  return (
    <div className="min-h-screen bg-dark-300 flex flex-col">
      <BoardHeader
        board={board}
        onOpenMembers={() => setShowMembers(true)}
        onAddColumn={() => setShowAddColumn(true)}
      />

      {/* Board canvas */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex gap-3 p-4 h-full items-start min-w-max">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDragEnd={onDragEnd}
          >
            <SortableContext items={columnIds} strategy={horizontalListSortingStrategy}>
              {board.columnOrder.map(col => (
                <ColumnComponent
                  key={col._id}
                  column={col}
                  boardId={boardId}
                  onCardClick={setSelectedCard}
                  canManage={canManage}
                />
              ))}
            </SortableContext>

            <DragOverlay>
              {activeDragType === 'CARD' && activeCard && (
                <div className="rotate-2 opacity-90 w-72">
                  <CardItem card={activeCard} onClick={() => {}} />
                </div>
              )}
              {activeDragType === 'COLUMN' && activeId && (
                <div className="opacity-70 w-72 h-16 rounded-xl bg-dark-100 border border-brand-500/30" />
              )}
            </DragOverlay>
          </DndContext>

          {/* Add column inline */}
          {showAddColumn ? (
            <form onSubmit={addColumn}
              className="flex-shrink-0 w-72 bg-dark-200 border border-white/[0.06] rounded-xl p-3 space-y-2">
              <input value={newColumnTitle} onChange={e => setNewColumnTitle(e.target.value)}
                className="input text-sm" placeholder="Column name..." autoFocus
                onKeyDown={e => e.key === 'Escape' && setShowAddColumn(false)} />
              <div className="flex gap-1.5">
                <button type="submit" disabled={addingCol || !newColumnTitle.trim()} className="btn-primary text-xs py-1 px-3">
                  {addingCol ? '...' : 'Add column'}
                </button>
                <button type="button" onClick={() => setShowAddColumn(false)} className="btn-ghost text-xs py-1">
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <button onClick={() => setShowAddColumn(true)}
              className="flex-shrink-0 w-72 flex items-center gap-2 px-4 py-3 rounded-xl
                         border border-dashed border-white/10 text-slate-600
                         hover:text-slate-400 hover:border-white/20 hover:bg-white/[0.02]
                         transition-all duration-150 text-sm">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add column
            </button>
          )}
        </div>
      </div>

      {/* Card detail modal */}
      {selectedCard && (
        <CardModal
          card={selectedCard}
          boardId={boardId}
          onClose={() => setSelectedCard(null)}
        />
      )}

      {/* Members panel */}
      {showMembers && (
        <MembersPanel boardId={boardId} onClose={() => setShowMembers(false)} />
      )}
    </div>
  )
}

// Outer page wraps with BoardProvider
export default function BoardPage() {
  const params = useParams()
  const boardId = params.boardId as string
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) router.push('/auth/login')
  }, [user, loading, router])

  if (loading || !user) return null

  return (
    <BoardProvider boardId={boardId}>
      <BoardView />
    </BoardProvider>
  )
}
