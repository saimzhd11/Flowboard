import type { User } from '@/types'

export default function Avatar({ user, size = 'sm' }: { user: User; size?: 'sm' | 'md' }) {
  const initials = user?.name?.split(' ')?.map(n => n[0])?.join('')?.toUpperCase()?.slice(0, 2) ?? '?'
  const sz = size === 'sm' ? 'w-6 h-6 text-xs' : 'w-8 h-8 text-sm'
  return (
    <div className={`${sz} rounded-full bg-brand-500/20 text-brand-300 font-medium flex items-center justify-center flex-shrink-0`}
      title={user?.name}>
      {initials}
    </div>
  )
}
