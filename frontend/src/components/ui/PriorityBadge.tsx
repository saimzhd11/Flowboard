import type { Priority } from '@/types'

const MAP: Record<Priority, { label: string; cls: string }> = {
  low:    { label: 'Low',    cls: 'bg-slate-700/60 text-slate-400' },
  medium: { label: 'Medium', cls: 'bg-yellow-500/15 text-yellow-400' },
  high:   { label: 'High',   cls: 'bg-orange-500/15 text-orange-400' },
  urgent: { label: 'Urgent', cls: 'bg-red-500/15 text-red-400' },
}

export default function PriorityBadge({ priority }: { priority: Priority }) {
  const { label, cls } = MAP[priority] ?? MAP.medium
  return <span className={`badge ${cls}`}>{label}</span>
}
