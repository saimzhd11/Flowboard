'use client'
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { useAuth } from './AuthContext'
import api from '@/lib/api'
import { connectSocket } from '@/lib/socket'
import type { Board, Card, Column } from '@/types'

interface BoardContextType {
  board: Board | null
  loading: boolean
  error: string | null
  fetchBoard: (id: string) => Promise<void>
  updateCardLocally: (card: Card) => void
  addColumnLocally: (col: Column, order: string[]) => void
  deleteColumnLocally: (colId: string, order: string[]) => void
  updateColumnLocally: (col: Column) => void
  addCardLocally: (card: Card, colId: string, order: string[]) => void
  deleteCardLocally: (cardId: string, colId: string) => void
  setColumnOrder: (order: string[]) => void
  setCardOrderInColumn: (colId: string, order: string[]) => void
}

const BoardContext = createContext<BoardContextType | null>(null)

export function BoardProvider({ children, boardId }: { children: ReactNode; boardId: string }) {
  const [board, setBoard] = useState<Board | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  const fetchBoard = useCallback(async (id: string) => {
    try {
      setLoading(true)
      const { data } = await api.get<Board>(`/boards/${id}`)
      setBoard(data)
      setError(null)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load board')
    } finally {
      setLoading(false)
    }
  }, [])

  // Real-time socket listeners
  useEffect(() => {
    if (!user || !boardId) return
    const socket = connectSocket()
    socket.emit('board:join', boardId)

    socket.on('board:updated', (updated: Board) => setBoard(updated))
    socket.on('board:columnOrderUpdated', ({ columnOrder }: { columnOrder: string[] }) => {
      setBoard(prev => prev ? { ...prev, columnOrder: prev.columnOrder.sort((a, b) =>
        columnOrder.indexOf(a._id) - columnOrder.indexOf(b._id)) } : prev)
    })
    socket.on('column:created', ({ column, columnOrder }: { column: Column; columnOrder: string[] }) => {
      setBoard(prev => {
        if (!prev) return prev
        const cols = [...prev.columnOrder, { ...column, cardOrder: [] }]
        return { ...prev, columnOrder: cols.sort((a, b) =>
          columnOrder.indexOf(a._id) - columnOrder.indexOf(b._id)) }
      })
    })
    socket.on('column:updated', ({ column }: { column: Column }) => {
      setBoard(prev => prev ? { ...prev, columnOrder: prev.columnOrder.map(c =>
        c._id === column._id ? { ...c, title: column.title } : c) } : prev)
    })
    socket.on('column:deleted', ({ columnId, columnOrder }: { columnId: string; columnOrder: string[] }) => {
      setBoard(prev => prev ? { ...prev,
        columnOrder: prev.columnOrder.filter(c => c._id !== columnId)
          .sort((a, b) => columnOrder.indexOf(a._id) - columnOrder.indexOf(b._id))
      } : prev)
    })
    socket.on('column:cardOrderUpdated', ({ columnId, cardOrder }: { columnId: string; cardOrder: string[] }) => {
      setBoard(prev => {
        if (!prev) return prev
        return { ...prev, columnOrder: prev.columnOrder.map(col => {
          if (col._id !== columnId) return col
          const sorted = [...col.cardOrder].sort((a, b) =>
            cardOrder.indexOf(a._id) - cardOrder.indexOf(b._id))
          return { ...col, cardOrder: sorted }
        })}
      })
    })
    socket.on('card:created', ({ card, columnId, cardOrder }: { card: Card; columnId: string; cardOrder: string[] }) => {
      setBoard(prev => {
        if (!prev) return prev
        return { ...prev, columnOrder: prev.columnOrder.map(col => {
          if (col._id !== columnId) return col
          const cards = [...col.cardOrder.filter(c => c._id !== card._id), card]
          return { ...col, cardOrder: cards.sort((a, b) => cardOrder.indexOf(a._id) - cardOrder.indexOf(b._id)) }
        })}
      })
    })
    socket.on('card:updated', ({ card }: { card: Card }) => {
      setBoard(prev => {
        if (!prev) return prev
        return { ...prev, columnOrder: prev.columnOrder.map(col => ({
          ...col, cardOrder: col.cardOrder.map(c => c._id === card._id ? card : c)
        }))}
      })
    })
    socket.on('card:deleted', ({ cardId, columnId }: { cardId: string; columnId: string }) => {
      setBoard(prev => {
        if (!prev) return prev
        return { ...prev, columnOrder: prev.columnOrder.map(col =>
          col._id === columnId ? { ...col, cardOrder: col.cardOrder.filter(c => c._id !== cardId) } : col
        )}
      })
    })
    socket.on('board:memberAdded', ({ board }: { board: Board }) => setBoard(board))
    socket.on('board:memberRemoved', ({ userId }: { userId: string }) => {
      setBoard(prev => prev ? { ...prev, members: prev.members.filter(m => m.user._id !== userId) } : prev)
    })

    return () => {
      socket.emit('board:leave', boardId)
      socket.off('board:updated'); socket.off('board:columnOrderUpdated')
      socket.off('column:created'); socket.off('column:updated'); socket.off('column:deleted')
      socket.off('column:cardOrderUpdated'); socket.off('card:created')
      socket.off('card:updated'); socket.off('card:deleted')
      socket.off('board:memberAdded'); socket.off('board:memberRemoved')
    }
  }, [user, boardId])

  // Local optimistic updaters
  const updateCardLocally = (card: Card) =>
    setBoard(prev => prev ? { ...prev, columnOrder: prev.columnOrder.map(col => ({
      ...col, cardOrder: col.cardOrder.map(c => c._id === card._id ? card : c)
    }))} : prev)

  const addColumnLocally = (col: Column, order: string[]) =>
    setBoard(prev => {
      if (!prev) return prev
      const cols = [...prev.columnOrder, { ...col, cardOrder: [] }]
      return { ...prev, columnOrder: cols.sort((a, b) => order.indexOf(a._id) - order.indexOf(b._id)) }
    })

  const deleteColumnLocally = (colId: string, order: string[]) =>
    setBoard(prev => prev ? { ...prev,
      columnOrder: prev.columnOrder.filter(c => c._id !== colId)
    } : prev)

  const updateColumnLocally = (col: Column) =>
    setBoard(prev => prev ? { ...prev,
      columnOrder: prev.columnOrder.map(c => c._id === col._id ? { ...c, title: col.title } : c)
    } : prev)

  const addCardLocally = (card: Card, colId: string, order: string[]) =>
    setBoard(prev => {
      if (!prev) return prev
      return { ...prev, columnOrder: prev.columnOrder.map(col => {
        if (col._id !== colId) return col
        const cards = [...col.cardOrder, card]
        return { ...col, cardOrder: cards.sort((a, b) => order.indexOf(a._id) - order.indexOf(b._id)) }
      })}
    })

  const deleteCardLocally = (cardId: string, colId: string) =>
    setBoard(prev => prev ? { ...prev, columnOrder: prev.columnOrder.map(col =>
      col._id === colId ? { ...col, cardOrder: col.cardOrder.filter(c => c._id !== cardId) } : col
    )} : prev)

  const setColumnOrder = (order: string[]) =>
    setBoard(prev => prev ? { ...prev,
      columnOrder: [...prev.columnOrder].sort((a, b) => order.indexOf(a._id) - order.indexOf(b._id))
    } : prev)

  const setCardOrderInColumn = (colId: string, order: string[]) =>
    setBoard(prev => {
      if (!prev) return prev
      return { ...prev, columnOrder: prev.columnOrder.map(col => {
        if (col._id !== colId) return col
        return { ...col, cardOrder: [...col.cardOrder].sort((a, b) => order.indexOf(a._id) - order.indexOf(b._id)) }
      })}
    })

  return (
    <BoardContext.Provider value={{
      board, loading, error, fetchBoard,
      updateCardLocally, addColumnLocally, deleteColumnLocally,
      updateColumnLocally, addCardLocally, deleteCardLocally,
      setColumnOrder, setCardOrderInColumn
    }}>
      {children}
    </BoardContext.Provider>
  )
}

export const useBoard = () => {
  const ctx = useContext(BoardContext)
  if (!ctx) throw new Error('useBoard must be inside BoardProvider')
  return ctx
}
