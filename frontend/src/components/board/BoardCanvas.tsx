'use client'

import { ReactNode } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  DragOverlay
} from '@dnd-kit/core'
import {
  SortableContext,
  horizontalListSortingStrategy
} from '@dnd-kit/sortable'
import ColumnComponent from '@/components/board/ColumnComponent'
import CardItem from '@/components/cards/CardItem'
import type { Card, Column } from '@/types'

type BoardShape = {
  columnOrder: Column[]
}

type BoardCanvasProps = {
  board: BoardShape
  boardId: string
  canManage: boolean
  onCardClick: (card: Card) => void
  sensors: any
  activeDragId: string | null
  activeDragType: 'CARD' | 'COLUMN' | null
  activeCard: Card | null
  onDragStart: (event: DragStartEvent) => void
  onDragOver: (event: DragOverEvent) => void
  onDragEnd: (event: DragEndEvent) => void
  children?: ReactNode
}

export default function BoardCanvas({
  board,
  boardId,
  canManage,
  onCardClick,
  sensors,
  activeDragId,
  activeDragType,
  activeCard,
  onDragStart,
  onDragOver,
  onDragEnd,
  children
}: BoardCanvasProps) {
  const columns = board?.columnOrder ?? []
  const columnIds = columns.map(column => column._id)

  return (
    <div className="flex-1 overflow-x-auto overflow-y-hidden">
      <div className="flex gap-3 p-4 h-full items-start min-w-max">
        <DndContext
          sensors={sensors}
          onDragStart={onDragStart}
          onDragOver={onDragOver}
          onDragEnd={onDragEnd}
        >
          <SortableContext items={columnIds} strategy={horizontalListSortingStrategy}>
            {columns.map(column => (
              <ColumnComponent
                key={column._id}
                column={column}
                boardId={boardId}
                onCardClick={onCardClick}
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

            {activeDragType === 'COLUMN' && activeDragId && (
              <div className="opacity-70 w-72 h-16 rounded-xl bg-dark-100 border border-brand-500/30" />
            )}
          </DragOverlay>
        </DndContext>

        {children}
      </div>
    </div>
  )
}