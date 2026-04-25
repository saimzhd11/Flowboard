'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import Avatar from '@/components/ui/Avatar'
import type { Board } from '@/types'

interface Props {
  board: Board
  onOpenMembers: () => void
  onAddColumn: () => void
  onDelete?: () => void
}

export default function BoardHeader({ board, onOpenMembers, onAddColumn, onDelete }: Props) {
  const { user } = useAuth()
  const myRole = board.members.find(m => m.user._id === user?._id)?.role
  const canManage = myRole === 'owner'
  const visibleMembers = board.members.slice(0, 5)
  const overflow = board.members.length - 5

  return (
    <div className="h-12 bg-dark-100/80 backdrop-blur border-b border-white/[0.06] flex items-center gap-3 px-4 flex-shrink-0">
      {/* Breadcrumb */}
      <Link href="/dashboard" className="text-slate-500 hover:text-slate-300 transition-colors">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      </Link>
      <svg className="w-3 h-3 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>

      {/* Board indicator */}
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded-md flex-shrink-0" style={{ backgroundColor: board.color }} />
        <span className="text-sm font-medium text-slate-200 truncate max-w-[180px]">{board.title}</span>
        {myRole && (
          <span className="text-xs px-1.5 py-0.5 rounded-full bg-white/5 text-slate-500 hidden sm:inline">
            {myRole}
          </span>
        )}
      </div>

      <div className="flex-1" />

      {/* Member avatars */}
      <button onClick={onOpenMembers}
        className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-white/5 transition-colors group">
        <div className="flex -space-x-1.5">
          {visibleMembers.map(m => <Avatar key={m?.user?._id} user={m?.user} />)}
          {overflow > 0 && (
            <div className="w-6 h-6 rounded-full bg-dark-100 border border-dark-300 flex items-center justify-center text-xs text-slate-500">
              +{overflow}
            </div>
          )}
        </div>
        {canManage && (
          <span className="text-xs text-slate-500 group-hover:text-slate-400 transition-colors hidden sm:block">
            Manage
          </span>
        )}
      </button>

      {/* Delete board (owner) */}
      {canManage && (
        <button onClick={onDelete} className="btn-danger flex items-center gap-1.5 text-xs py-1.5 px-3 mr-2">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M10 3h4l1 2H9l1-2z" />
          </svg>
          <span className="hidden sm:inline">Delete board</span>
        </button>
      )}

      {/* Add column */}
      <button onClick={onAddColumn} className="btn-primary flex items-center gap-1.5 text-xs py-1.5 px-3">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        <span className="hidden sm:inline">Add column</span>
      </button>
    </div>
  )
}
