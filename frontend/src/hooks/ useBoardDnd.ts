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
  moveCardBetweenColumnsLocally: (
    cardId: string,
    sourceColumnId: string,
    destinationColumnId: string,
    sourceOrder: string[],
    destinationOrder: string[]
  ) => void
}

export function useBoardDnd({
  board,
  boardId,
  fetchBoard,
  setColumnOrder,
  setCardOrderInColumn,
  moveCardBetweenColumnsLocally
}: UseBoardDndParams) {
  const [activeDragId, setActiveDragId] = useState<string | null>(null)
  const [activeDragType, setActiveDragType] = useState<'CARD' | 'COLUMN' | null>(null)
  const [activeCard, setActiveCard] = useState<Card | null>(null)
  const [activeCardSourceColumnId, setActiveCardSourceColumnId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )
  //find which column owns the card.
  const findCardColumn = useCallback(
    (cardId: string) => findColumnOfCard(board?.columnOrder, cardId),
    [board?.columnOrder]
  )

  const reloadBoard = useCallback(async () => {
    await fetchBoard(boardId)
  }, [fetchBoard, boardId])

  const handleReloadError = useCallback(
    async (message: string, error?: unknown) => {
      console.error(message, error)
      toast.error(message)
      await reloadBoard()
    },
    [reloadBoard]
  )

  const persistColumnOrder = useCallback(
    async (columnOrder: string[]) => {
      try {
        await api.put(`/boards/${boardId}/column-order`, { columnOrder })
      } catch (error) {
        await handleReloadError('Failed to save column order', error)
      }
    },
    [boardId, handleReloadError]
  )

  const persistCardOrder = useCallback(
    async (columnId: string, cardOrder: string[]) => {
      try {
        await api.put(`/columns/${boardId}/${columnId}/card-order`, { cardOrder })
      } catch (error) {
        await handleReloadError('Failed to save card order', error)
      }
    },
    [boardId, handleReloadError]
  )

  const persistCrossColumnMove = useCallback(
    async (
      cardId: string,
      sourceColumnId: string,
      destinationColumnId: string,
      sourceOrder: string[],
      destinationOrder: string[]
    ) => {
      try {
        await api.put(`/cards/${boardId}/${cardId}/move`, {
          sourceColumnId,
          destinationColumnId,
          sourceOrder,
          destinationOrder
        })
      } catch (error) {
        await handleReloadError('Failed to move card', error)
      }
    },
    [boardId, handleReloadError]
  )

 const handleDragStart = useCallback((event: DragStartEvent) => {
  const dragType = event.active.data.current?.type ?? null
  const activeId = String(event.active.id)

  setActiveDragType(dragType)
  setActiveDragId(activeId)

  if (dragType === 'CARD') {
    const sourceColumn = findCardColumn(activeId)

    setActiveCard(event.active.data.current?.card ?? null)
    setActiveCardSourceColumnId(sourceColumn?._id ?? null)
  }
}, [findCardColumn])

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      console.log('here is handleDragOver')

      const { active, over } = event

      if (!over || !board) return

      const activeType = active.data.current?.type
      if (activeType !== 'CARD') return

      const activeCardId = String(active.id)
      const activeColumnId = findCardColumn(activeCardId)?._id
      const overColumnId = getOverColumnId({
        over,
        findCardColumn
      })


      if (!activeColumnId || !overColumnId || activeColumnId === overColumnId) return
      console.log('before moveCardAcrossColumns')
      const nextState = moveCardAcrossColumns({
        columns: board.columnOrder,
        activeCardId,
        activeColumnId,
        overColumnId,
        overId: String(over.id),
        overType: over.data.current?.type
      })
      // console.log('nextState response from movedCardAcrossColumns',nextState)
      if (!nextState) return

      moveCardBetweenColumnsLocally(
        activeCardId,
        activeColumnId,
        overColumnId,
        nextState.activeColumnCardOrder,
        nextState.overColumnCardOrder
      )
    },
    [board, findCardColumn, moveCardBetweenColumnsLocally]
  )

  const handleColumnDragEnd = useCallback(
    async (activeId: string, overId: string) => {
      if (!board || activeId === overId) return

      const nextColumnOrder = getColumnOrderAfterMove(board.columnOrder, activeId, overId)
      if (!nextColumnOrder) return

      setColumnOrder(nextColumnOrder)
      await persistColumnOrder(nextColumnOrder)
    },
    [board, persistColumnOrder, setColumnOrder]
  )

  const handleSameColumnCardMove = useCallback(
    async (
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
    },
    [board, persistCardOrder, setCardOrderInColumn]
  )

    const handleCrossColumnCardMove = useCallback(
    async (
      activeCardId: string,
      sourceColumnId: string,
      destinationColumnId: string,
      sourceOrder: string[],
      destinationOrder: string[]
    ) => {
      moveCardBetweenColumnsLocally(
        activeCardId,
        sourceColumnId,
        destinationColumnId,
        sourceOrder,
        destinationOrder
      )

      await persistCrossColumnMove(
        activeCardId,
        sourceColumnId,
        destinationColumnId,
        sourceOrder,
        destinationOrder
      )
    },
    [moveCardBetweenColumnsLocally, persistCrossColumnMove]
  )

 const handleCardDragEnd = useCallback(
  async (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || !board) return

    const activeCardId = String(active.id)

    const sourceColumnId = activeCardSourceColumnId
    const overColumnId = getOverColumnId({
      over,
      findCardColumn
    })
console.log('handleCardDragEnd',{
  activeCardId,
  sourceColumnId,
  overColumnId,
  activeCardSourceColumnId
})
    if (!sourceColumnId || !overColumnId) return

    if (sourceColumnId === overColumnId) {
      await handleSameColumnCardMove(
        activeCardId,
        String(over.id),
        over.data.current?.type,
        sourceColumnId
      )
      return
    }
    

    const sourceColumn = board.columnOrder.find(col => col._id === sourceColumnId)
    const destinationColumn = board.columnOrder.find(col => col._id === overColumnId)

    if (!sourceColumn || !destinationColumn) return

    const sourceOrder = sourceColumn.cardOrder
      .filter(card => card._id !== activeCardId)
      .map(card => card._id)

    let destinationOrder = destinationColumn.cardOrder.map(card => card._id)

    if (!destinationOrder.includes(activeCardId)) {
      destinationOrder.push(activeCardId)
    }

    await handleCrossColumnCardMove(
      activeCardId,
      sourceColumnId,
      overColumnId,
      sourceOrder,
      destinationOrder
    )
  },
  [
    board,
    findCardColumn,
    activeCardSourceColumnId,
    handleSameColumnCardMove,
    handleCrossColumnCardMove
  ]
)
  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event

      try {
        if (!over || !board) return

        const activeType = active.data.current?.type

        if (activeType === 'COLUMN') {
          await handleColumnDragEnd(String(active.id), String(over.id))
          return
        }

        if (activeType === 'CARD') {
          await handleCardDragEnd(event)
        }
      } finally {
        setActiveDragId(null)
        setActiveDragType(null)
        setActiveCard(null)
        setActiveCardSourceColumnId(null)
      }
    },
    [board, handleCardDragEnd, handleColumnDragEnd]
  )
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