import { arrayMove } from '@dnd-kit/sortable'
import type { DragOverEvent, Over } from '@dnd-kit/core'
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
  return over.data.current?.type === 'CARD'
    ? findCardColumn(over.id as string)?._id
    : over.id as string
}

export function moveCardAcrossColumns({
  columns,
  activeCardId,
  activeColumnId,
  overColumnId
}: MoveCardAcrossColumnsParams) {
  const activeColumn = columns.find(column => column._id === activeColumnId)
  const overColumn = columns.find(column => column._id === overColumnId)

  if (!activeColumn || !overColumn) return null

  const movingCard = activeColumn.cardOrder.find(card => card._id === activeCardId)
  if (!movingCard) return null

  const activeColumnCardOrder = activeColumn.cardOrder
    .filter(card => card._id !== activeCardId)
    .map(card => card._id)

  const overColumnCardOrder = [...overColumn.cardOrder, movingCard].map(card => card._id)

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
  const newIndex = overType === 'CARD'
    ? column.cardOrder.findIndex(card => card._id === overId)
    : column.cardOrder.length - 1

  if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return null

  return arrayMove(column.cardOrder, oldIndex, newIndex).map(card => card._id)
}

export function getColumnOrderAfterMove(columns: Column[], activeId: string, overId: string) {
  const oldIndex = columns.findIndex(column => column._id === activeId)
  const newIndex = columns.findIndex(column => column._id === overId)

  if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return null

  return arrayMove(columns, oldIndex, newIndex).map(column => column._id)
}