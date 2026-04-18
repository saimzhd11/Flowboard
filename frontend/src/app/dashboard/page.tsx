'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

import { useBoards } from '@/hooks/useBoards'
import BoardsLoading from '@/components/board/BoardsLoading'
import EmptyBoardsState from '@/components/board/EmptyBoardsState'
import CreateBoardModal from '@/components/board/CreateBoardModal'

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const {
    boards,
    setBoards,
    isBoardsLoading
  } = useBoards(user)

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/auth/login')
    }
  }, [authLoading, user, router])

  const openCreateModal = () => setIsCreateModalOpen(true)
  const closeCreateModal = () => setIsCreateModalOpen(false)

  if (authLoading || !user) return null

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold text-slate-100">My Boards</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {boards.length} {boards.length === 1 ? 'workspace' : 'workspaces'}
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="btn-primary flex items-center gap-1.5"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New board
        </button>
      </div>

      {isBoardsLoading ? (
        <BoardsLoading />
      ) : boards.length === 0 ? (
        <EmptyBoardsState onCreate={openCreateModal} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {boards.map(board => (
            <button
              key={board._id}
              onClick={() => router.push(`/dashboard/board/${board._id}`)}
              className="card-surface p-5 text-left hover:border-white/20 hover:bg-dark-100/80 transition-all duration-150 group"
            >
              <div className="flex items-start gap-3 mb-3">
                <div
                  className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center text-white font-semibold text-sm"
                  style={{ backgroundColor: board.color }}
                >
                  {board.title[0].toUpperCase()}
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="font-medium text-slate-100 truncate group-hover:text-white transition-colors">
                    {board.title}
                  </h3>
                  {board.description && (
                    <p className="text-slate-500 text-xs mt-0.5 truncate">
                      {board.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex -space-x-1.5">
                  {board.members.slice(0, 4).map(member => (
                    <div
                      key={member.user._id}
                      className="w-6 h-6 rounded-full bg-dark-200 border border-dark-300 flex items-center justify-center text-xs text-slate-300 font-medium"
                      title={member.user.name}
                    >
                      {member.user.name[0].toUpperCase()}
                    </div>
                  ))}
                  {board.members.length > 4 && (
                    <div className="w-6 h-6 rounded-full bg-dark-200 border border-dark-300 flex items-center justify-center text-xs text-slate-500">
                      +{board.members.length - 4}
                    </div>
                  )}
                </div>

                <span className="text-slate-600 text-xs">
                  {new Date(board.updatedAt).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short'
                  })}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      <CreateBoardModal
        open={isCreateModalOpen}
        onClose={closeCreateModal}
        onCreated={board => setBoards(prev => [board, ...prev])}
      />
    </div>
  )
}