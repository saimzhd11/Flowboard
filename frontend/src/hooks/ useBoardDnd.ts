'use client'

import { useCallback, useState } from 'react'
import {
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import type { Card, Column } from '@/types'
import {
  findColumnOfCard,
  getOverColumnId,
  moveCardAcrossColumns,
  getSameColumnCardOrder,
  getColumnOrderAfterMove
} from '@/utils/boardDnd'

type BoardShape = {
  columnOrder: Column[]
} | null

type UseBoardDndParams = {
  board: BoardShape
  boardId: string
  fetchBoard: (boardId: string) => void | Promise<void>
  setColumnOrder: (order: string[]) => void
  setCardOrderInColumn: (columnId: string, order: string[]) => void
}

export function useBoardDnd({
  board,
  boardId,
  fetchBoard,
  setColumnOrder,
  setCardOrderInColumn
}: UseBoardDndParams) {
  const [activeDragId, setActiveDragId] = useState<string | null>(null)
  const [activeDragType, setActiveDragType] = useState<'CARD' | 'COLUMN' | null>(null)
  const [activeCard, setActiveCard] = useState<Card | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const findCardColumn = useCallback(
    (cardId: string) => findColumnOfCard(board?.columnOrder, cardId),
    [board]
  )

  const reloadBoard = useCallback(() => {
    fetchBoard(boardId)
  }, [fetchBoard, boardId])

  const handleReloadError = useCallback(
    (message: string) => {
      toast.error(message)
      reloadBoard()
    },
    [reloadBoard]
  )

  const persistColumnOrder = useCallback(
    async (columnOrder: string[]) => {
      try {
        await api.put(`/boards/${boardId}/column-order`, { columnOrder })
      } catch {
        handleReloadError('Failed to save column order')
      }
    },
    [boardId, handleReloadError]
  )

  const persistCardOrder = useCallback(
    async (columnId: string, cardOrder: string[]) => {
      try {
        await api.put(`/columns/${boardId}/${columnId}/card-order`, { cardOrder })
      } catch {
        handleReloadError('Failed to save card order')
      }
    },
    [boardId, handleReloadError]
  )

  const persistCrossColumnMove = useCallback(
    async (cardId: string, columnId: string, cardOrder: string[]) => {
      try {
        await api.put(`/cards/${boardId}/${cardId}`, { column: columnId })
        await api.put(`/columns/${boardId}/${columnId}/card-order`, { cardOrder })
      } catch {
        handleReloadError('Failed to move card')
      }
    },
    [boardId, handleReloadError]
  )

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const dragType = event.active.data.current?.type ?? null
    setActiveDragType(dragType)
    setActiveDragId(event.active.id as string)

    if (dragType === 'CARD') {
      setActiveCard(event.active.data.current?.card ?? null)
    }
  }, [])

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event

    if (!over || !board) return

    const activeType = active.data.current?.type
    if (activeType !== 'CARD') return

    const activeColumnId = findCardColumn(active.id as string)?._id
    const overColumnId = getOverColumnId({
      over,
      findCardColumn
    })

    if (!activeColumnId || !overColumnId || activeColumnId === overColumnId) return

    const nextState = moveCardAcrossColumns({
      columns: board.columnOrder,
      activeCardId: active.id as string,
      activeColumnId,
      overColumnId
    })

    if (!nextState) return

    setCardOrderInColumn(activeColumnId, nextState.activeColumnCardOrder)
    setCardOrderInColumn(overColumnId, nextState.overColumnCardOrder)
  }, [board, findCardColumn, setCardOrderInColumn])

  const handleColumnDragEnd = useCallback(async (activeId: string, overId: string) => {
    if (!board || activeId === overId) return

    const nextColumnOrder = getColumnOrderAfterMove(board.columnOrder, activeId, overId)
    if (!nextColumnOrder) return

    setColumnOrder(nextColumnOrder)
    await persistColumnOrder(nextColumnOrder)
  }, [board, persistColumnOrder, setColumnOrder])

  const handleSameColumnCardMove = useCallback(async (
    activeCardId: string,
    overId: string,
    overType: string | undefined,
    columnId: string
  ) => {
    if (!board) return

    const column = board.columnOrder.find(item => item._id === columnId)
    if (!column) return

    const nextCardOrder = getSameColumnCardOrder({
      column,
      activeCardId,
      overId,
      overType
    })

    if (!nextCardOrder) return

    setCardOrderInColumn(columnId, nextCardOrder)
    await persistCardOrder(columnId, nextCardOrder)
  }, [board, persistCardOrder, setCardOrderInColumn])

  const handleCrossColumnCardMove = useCallback(async (
    activeCardId: string,
    overColumnId: string
  ) => {
    if (!board) return

    const overColumn = board.columnOrder.find(item => item._id === overColumnId)
    if (!overColumn) return

    const nextCardOrder = overColumn.cardOrder.map(card => card._id)
    await persistCrossColumnMove(activeCardId, overColumnId, nextCardOrder)
  }, [board, persistCrossColumnMove])

  const handleCardDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || !board) return

    const activeColumnId = findCardColumn(active.id as string)?._id
    const overColumnId = getOverColumnId({
      over,
      findCardColumn
    })

    if (!activeColumnId) return

    if (activeColumnId === overColumnId) {
      await handleSameColumnCardMove(
        active.id as string,
        over.id as string,
        over.data.current?.type,
        activeColumnId
      )
      return
    }

    if (overColumnId) {
      await handleCrossColumnCardMove(active.id as string, overColumnId)
    }
  }, [board, findCardColumn, handleCrossColumnCardMove, handleSameColumnCardMove])

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    setActiveDragId(null)
    setActiveDragType(null)
    setActiveCard(null)

    const { active, over } = event
    if (!over || !board) return

    const activeType = active.data.current?.type

    if (activeType === 'COLUMN') {
      await handleColumnDragEnd(active.id as string, over.id as string)
      return
    }

    if (activeType === 'CARD') {
      await handleCardDragEnd(event)
    }
  }, [board, handleCardDragEnd, handleColumnDragEnd])

  return {
    sensors,
    collisionDetection: closestCorners,
    activeDragId,
    activeDragType,
    activeCard,
    handleDragStart,
    handleDragOver,
    handleDragEnd
  }
}