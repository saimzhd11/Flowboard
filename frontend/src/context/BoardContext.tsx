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
  deleteCardLocally: (cardId: string, colId: string) => void
  setColumnOrder: (order: string[]) => void
  setCardOrderInColumn: (colId: string, order: string[]) => void
  moveCardBetweenColumnsLocally: (
    cardId: string,
    sourceColumnId: string,
    destinationColumnId: string,
    sourceOrder: string[],
    destinationOrder: string[]
  ) => void
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
      setBoard(prev => {
        if (!prev) return prev

        const columnMap = new Map(prev.columnOrder.map(col => [col._id, col]))
        const reorderedColumns = columnOrder
          .map(id => columnMap.get(id))
          .filter((col): col is Column => Boolean(col))

        return { ...prev, columnOrder: reorderedColumns }
      })
    })
    socket.on('column:created', ({ column, columnOrder }: { column: Column; columnOrder: string[] }) => {
      setBoard(prev => {
        if (!prev) return prev

        const mergedColumns = [...prev.columnOrder.filter(c => c._id !== column._id), { ...column, cardOrder: [] }]
        const columnMap = new Map(mergedColumns.map(col => [col._id, col]))
        const reorderedColumns = columnOrder
          .map(id => columnMap.get(id))
          .filter((col): col is Column => Boolean(col))

        return { ...prev, columnOrder: reorderedColumns }
      })
    })
    socket.on('card:updated', ({ card }: { card: Card }) => {
  setBoard(prev => {
    if (!prev) return prev

    return {
      ...prev,
      columnOrder: prev.columnOrder.map(col => ({
        ...col,
        cardOrder: col.cardOrder.map(c =>
          c._id === card._id ? card : c
        )
      }))
    }
  })
})
    socket.on('card:moved', ({
  card,
  sourceColumnId,
  destinationColumnId,
  sourceOrder,
  destinationOrder
}: {
  card: Card
  sourceColumnId: string
  destinationColumnId: string
  sourceOrder: string[]
  destinationOrder: string[]
}) => {
  setBoard(prev => {
    if (!prev) return prev

    const sourceColumn = prev.columnOrder.find(col => col._id === sourceColumnId)
    const destinationColumn = prev.columnOrder.find(col => col._id === destinationColumnId)

    if (!sourceColumn || !destinationColumn) return prev

    const allCards = prev.columnOrder.flatMap(col => col.cardOrder)
    const cardMap = new Map(allCards.map(c => [c._id, c]))
    cardMap.set(card._id, card)

    return {
      ...prev,
      columnOrder: prev.columnOrder.map(col => {
        if (col._id === sourceColumnId) {
          return {
            ...col,
            cardOrder: sourceOrder
              .map(id => cardMap.get(id))
              .filter((c): c is Card => Boolean(c))
          }
        }

        if (col._id === destinationColumnId) {
          return {
            ...col,
            cardOrder: destinationOrder
              .map(id => cardMap.get(id))
              .filter((c): c is Card => Boolean(c))
          }
        }

        return col
      })
    }
  })
})
    socket.on('column:deleted', ({ columnId, columnOrder }: { columnId: string; columnOrder: string[] }) => {
      setBoard(prev => {
        if (!prev) return prev

        const remaining = prev.columnOrder.filter(c => c._id !== columnId)
        const columnMap = new Map(remaining.map(col => [col._id, col]))
        const reorderedColumns = columnOrder
          .map(id => columnMap.get(id))
          .filter((col): col is Column => Boolean(col))

        return { ...prev, columnOrder: reorderedColumns }
      })
    })
    socket.on('column:cardOrderUpdated', ({ columnId, cardOrder }: { columnId: string; cardOrder: string[] }) => {

      setBoard(prev => {
        if (!prev) return prev

        return {
          ...prev,
          columnOrder: prev.columnOrder.map(col => {
            if (col._id !== columnId) return col

            const cardMap = new Map(col.cardOrder.map(card => [card._id, card]))
            const reorderedCards = cardOrder
              .map(id => cardMap.get(id))
              .filter((card): card is Card => Boolean(card))

            return { ...col, cardOrder: reorderedCards }
          })
        }
      })
    })
    socket.on('card:created', ({ card, columnId, cardOrder }: { card: Card; columnId: string; cardOrder: string[] }) => {
      setBoard(prev => {
        if (!prev) return prev
        return {
          ...prev, columnOrder: prev.columnOrder.map(col => {
            if (col._id !== columnId) return col
            const cards = [...col.cardOrder.filter(c => c._id !== card._id), card]
            return { ...col, cardOrder: cards.sort((a, b) => cardOrder.indexOf(a._id) - cardOrder.indexOf(b._id)) }
          })
        }
      })
    })
    // socket.on('card:updated', ({ card }: { card: Card }) => {
    //   setBoard(prev => {
    //     if (!prev) return prev
    //     return {
    //       ...prev, columnOrder: prev.columnOrder.map(col => ({
    //         ...col, cardOrder: col.cardOrder.map(c => c._id === card._id ? card : c)
    //       }))
    //     }
    //   })
    // })
    socket.on('card:deleted', ({ cardId, columnId }: { cardId: string; columnId: string }) => {
      setBoard(prev => {
        if (!prev) return prev
        return {
          ...prev, columnOrder: prev.columnOrder.map(col =>
            col._id === columnId ? { ...col, cardOrder: col.cardOrder.filter(c => c._id !== cardId) } : col
          )
        }
      })
    })
    socket.on('board:memberAdded', ({ board }: { board: Board }) => setBoard(board))
    socket.on('board:memberRemoved', ({ userId }: { userId: string }) => {
      setBoard(prev => prev ? { ...prev, members: prev.members.filter(m => m.user._id !== userId) } : prev)
    })

    return () => {
      socket.emit('board:leave', boardId)
      socket.off('board:updated'); socket.off('board:columnOrderUpdated')
      socket.off('card:moved')
      socket.off('column:created'); socket.off('column:updated'); socket.off('column:deleted')
      socket.off('column:cardOrderUpdated'); socket.off('card:created')
      socket.off('card:updated'); socket.off('card:deleted')
      socket.off('board:memberAdded'); socket.off('board:memberRemoved')
    }
  }, [user, boardId])

  // Local optimistic updaters
  const updateCardLocally = (card: Card) =>
    setBoard(prev => prev ? {
      ...prev, columnOrder: prev.columnOrder.map(col => ({
        ...col, cardOrder: col.cardOrder.map(c => c._id === card._id ? card : c)
      }))
    } : prev)

  const addColumnLocally = (col: Column, order: string[]) =>
    setBoard(prev => {
      if (!prev) return prev
      const cols = [...prev.columnOrder, { ...col, cardOrder: [] }]
      return { ...prev, columnOrder: cols.sort((a, b) => order.indexOf(a._id) - order.indexOf(b._id)) }
    })

  const deleteColumnLocally = (colId: string, order: string[]) =>
    setBoard(prev => prev ? {
      ...prev,
      columnOrder: prev.columnOrder.filter(c => c._id !== colId)
    } : prev)

  const updateColumnLocally = (col: Column) =>
    setBoard(prev => prev ? {
      ...prev,
      columnOrder: prev.columnOrder.map(c => c._id === col._id ? { ...c, title: col.title } : c)
    } : prev)



  const deleteCardLocally = (cardId: string, colId: string) =>
    setBoard(prev => prev ? {
      ...prev, columnOrder: prev.columnOrder.map(col =>
        col._id === colId ? { ...col, cardOrder: col.cardOrder.filter(c => c._id !== cardId) } : col
      )
    } : prev)

  const setColumnOrder = (order: string[]) =>
    setBoard(prev => {
      if (!prev) return prev

      const columnMap = new Map(prev.columnOrder.map(col => [col._id, col]))
      const reorderedColumns = order
        .map(id => columnMap.get(id))
        .filter((col): col is Column => Boolean(col))

      return {
        ...prev,
        columnOrder: reorderedColumns
      }
    })
  const setCardOrderInColumn = (colId: string, order: string[]) =>
    setBoard(prev => {
      if (!prev) return prev

      return {
        ...prev,
        columnOrder: prev.columnOrder.map(col => {
          if (col._id !== colId) return col

          const cardMap = new Map(col.cardOrder.map(card => [card._id, card]))
          const reorderedCards = order
            .map(id => cardMap.get(id))
            .filter((card): card is Card => Boolean(card))

          return { ...col, cardOrder: reorderedCards }
        })
      }
    })

  const moveCardBetweenColumnsLocally = (
    cardId: string,
    sourceColumnId: string,
    destinationColumnId: string,
    sourceOrder: string[],
    destinationOrder: string[]
  ) =>
    setBoard(prev => {
      console.log('here is mivedCardBetweenColumnsLocally - Context')
      if (!prev) return prev

      const sourceColumn = prev.columnOrder.find(col => col._id === sourceColumnId)
      const destinationColumn = prev.columnOrder.find(col => col._id === destinationColumnId)

      if (!sourceColumn || !destinationColumn) return prev

      const movingCard = sourceColumn.cardOrder.find(card => card._id === cardId)
      if (!movingCard) return prev

      const nextSourceCards = sourceColumn.cardOrder.filter(card => card._id !== cardId)
      const nextDestinationCards = [
        ...destinationColumn.cardOrder.filter(card => card._id !== cardId),
        movingCard
      ]

      const sourceCardMap = new Map(nextSourceCards.map(card => [card._id, card]))
      const destinationCardMap = new Map(nextDestinationCards.map(card => [card._id, card]))

      const reorderedSourceCards = sourceOrder
        .map(id => sourceCardMap.get(id))
        .filter((card): card is Card => Boolean(card))

      const reorderedDestinationCards = destinationOrder
        .map(id => destinationCardMap.get(id))
        .filter((card): card is Card => Boolean(card))

      return {
        ...prev,
        columnOrder: prev.columnOrder.map(col => {
          if (col._id === sourceColumnId) {
            return { ...col, cardOrder: reorderedSourceCards }
          }

          if (col._id === destinationColumnId) {
            return { ...col, cardOrder: reorderedDestinationCards }
          }

          return col
        })
      }
    })
  return (
    <BoardContext.Provider value={{
      board, loading, error, fetchBoard,
      updateCardLocally, addColumnLocally, deleteColumnLocally,
      updateColumnLocally, deleteCardLocally,
      setColumnOrder, setCardOrderInColumn, moveCardBetweenColumnsLocally
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
