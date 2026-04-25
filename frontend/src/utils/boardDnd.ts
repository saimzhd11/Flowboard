import { arrayMove } from '@dnd-kit/sortable'
import type { Over } from '@dnd-kit/core'
import type { Column } from '@/types'

type GetOverColumnIdParams = {
  over: Over
  findCardColumn: (cardId: string) => Column | undefined
}

type MoveCardAcrossColumnsParams = {
  columns: Column[]
  activeCardId: string
  activeColumnId: string
  overColumnId: string
  overId?: string
  overType?: string
}

type GetSameColumnCardOrderParams = {
  column: Column
  activeCardId: string
  overId: string
  overType?: string
}

export function findColumnOfCard(columns: Column[] | undefined, cardId: string) {
  return columns?.find(column => column.cardOrder.some(card => card._id === cardId))
}

export function getOverColumnId({
  over,
  findCardColumn
}: GetOverColumnIdParams) {
  const overType = over.data.current?.type

  if (overType === 'CARD') {
    return findCardColumn(String(over.id))?._id
  }

  return (
    over.data.current?.columnId ??
    (typeof over.id === 'string' ? over.id : String(over.id))
  )
}

export function moveCardAcrossColumns({
  columns,
  activeCardId,
  activeColumnId,
  overColumnId,
  overId,
  overType
}: MoveCardAcrossColumnsParams) {
  const activeColumn = columns.find(column => column._id === activeColumnId)
  const overColumn = columns.find(column => column._id === overColumnId)
  console.log('moveCardAcrossColumns activeColumn:',activeColumn,'\noverColumn:',overColumn)

  if (!activeColumn || !overColumn) return null

  const movingCard = activeColumn.cardOrder.find(card => card._id === activeCardId)
  if (!movingCard) return null

  const activeColumnCardOrder = activeColumn.cardOrder
    .filter(card => card._id !== activeCardId)
    .map(card => card._id)

  const overCardIds = overColumn.cardOrder
    .map(card => card._id)
    .filter(cardId => cardId !== activeCardId)

  let insertIndex = overCardIds.length

  if (overType === 'CARD' && overId) {
    const hoveredCardIndex = overCardIds.findIndex(cardId => cardId === overId)
    insertIndex = hoveredCardIndex === -1 ? overCardIds.length : hoveredCardIndex
  }

  const overColumnCardOrder = [
    ...overCardIds.slice(0, insertIndex),
    movingCard._id,
    ...overCardIds.slice(insertIndex)
  ]

  return {
    activeColumnCardOrder,
    overColumnCardOrder
  }
}

export function getSameColumnCardOrder({
  column,
  activeCardId,
  overId,
  overType
}: GetSameColumnCardOrderParams) {
  const oldIndex = column.cardOrder.findIndex(card => card._id === activeCardId)

  const newIndex =
    overType === 'CARD'
      ? column.cardOrder.findIndex(card => card._id === overId)
      : column.cardOrder.length - 1

  if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return null

  return arrayMove(column.cardOrder, oldIndex, newIndex).map(card => card._id)
}

export function getColumnOrderAfterMove(
  columns: Column[],
  activeId: string,
  overId: string
) {
  const oldIndex = columns.findIndex(column => column._id === activeId)
  const newIndex = columns.findIndex(column => column._id === overId)

  if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return null

  return arrayMove(columns, oldIndex, newIndex).map(column => column._id)
}