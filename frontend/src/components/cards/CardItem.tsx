'use client'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Card } from '@/types'
import PriorityBadge from '@/components/ui/PriorityBadge'
import Avatar from '@/components/ui/Avatar'

interface Props {
  card: Card
  onClick: () => void
}

export default function CardItem({ card, onClick }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card._id,
    data: { type: 'CARD', card }
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  const isOverdue = card.dueDate && new Date(card.dueDate) < new Date()

  return (
    <div
      ref={setNodeRef}
      key={card._id}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className="group bg-dark-200 border border-white/[0.15] rounded-lg p-3 cursor-pointer
                 hover:border-white/20 hover:bg-dark-100 transition-all duration-150 select-none"
    >
      {card.coverColor && (
        <div className="h-1.5 rounded-full mb-2.5 -mt-0.5" style={{ backgroundColor: card.coverColor }} />
      )}

      {card.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {card.labels.slice(0, 3).map(l => (
            <span key={l} className="text-xs px-1.5 py-0.5 rounded bg-brand-500/15 text-brand-400 font-medium">{l}</span>
          ))}
        </div>
      )}

      <p className="text-sm text-slate-200 leading-snug group-hover:text-white transition-colors">
        {card.title}
      </p>

      <div className="flex items-center justify-between mt-2.5 gap-2">
        <div className="flex items-center gap-1.5">
          <PriorityBadge priority={card.priority} />
          {card.dueDate && (
            <span className={`badge ${isOverdue ? 'bg-red-500/15 text-red-400' : 'bg-slate-700/60 text-slate-400'}`}>
              {new Date(card.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
            </span>
          )}
          {card.comments.length > 0 && (
            <span className="badge bg-slate-700/40 text-slate-500 gap-1">
              <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              {card.comments.length}
            </span>
          )}
        </div>
        {card.assignees.length > 0 && (
          <div className="flex -space-x-1.5">
            {card.assignees.slice(0, 3).map(u => <Avatar key={u._id} user={u} />)}
          </div>
        )}
      </div>
    </div>
  )
}
