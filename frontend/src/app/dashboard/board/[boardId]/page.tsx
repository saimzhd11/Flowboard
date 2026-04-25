'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { BoardProvider, useBoard } from '@/context/BoardContext'
import BoardHeader from '@/components/board/BoardHeader'
import MembersPanel from '@/components/board/MembersPanel'
import CardModal from '@/components/cards/CardModal'
import type { Card } from '@/types'
import toast from 'react-hot-toast'
import api from '@/lib/api'
import AddColumnInline from '@/components/board/AddColumnInline'
import BoardCanvas from '@/components/board/BoardCanvas'
import BoardLoadingScreen from '@/components/board/BoardLoadingScreen'
import { useBoardDnd } from '@/hooks/ useBoardDnd'
import { canManageBoard } from '@/utils/boardPermissions'

type BoardViewProps = {
  boardId: string
}

function BoardView({ boardId }: BoardViewProps) {
  const { user } = useAuth()
  const router = useRouter()
  const { board, loading: isBoardLoading, error, fetchBoard, setColumnOrder, setCardOrderInColumn,moveCardBetweenColumnsLocally } = useBoard()

  const [selectedCard, setSelectedCard] = useState<Card | null>(null)
  const [isMembersPanelOpen, setIsMembersPanelOpen] = useState(false)
  const [isAddColumnOpen, setIsAddColumnOpen] = useState(false)

  useEffect(() => {
    fetchBoard(boardId)
  }, [boardId, fetchBoard])

  useEffect(() => {
    if (!error) return
    toast.error(error)
    router.replace('/dashboard')
  }, [error, router])

  const openMembersPanel = () => setIsMembersPanelOpen(true)
  const closeMembersPanel = () => setIsMembersPanelOpen(false)
  const openAddColumn = () => setIsAddColumnOpen(true)
  const closeAddColumn = () => setIsAddColumnOpen(false)
  const closeSelectedCard = () => setSelectedCard(null)

  const handleDelete = async () => {
    try {
      await api.delete(`/boards/${boardId}`)
      toast.success('Board deleted')
      router.replace('/dashboard')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete board')
    }
  }

  const canManage = canManageBoard(board, user?._id)

  const {
    sensors,
    activeDragId,
    activeDragType,
    activeCard,
    handleDragStart,
    handleDragOver,
    handleDragEnd
  } = useBoardDnd({
    board,
    boardId,
    fetchBoard,
    setColumnOrder,
    setCardOrderInColumn,
    moveCardBetweenColumnsLocally
  })

  if (isBoardLoading) {
    return <BoardLoadingScreen />
  }

  if (!board) return null

  return (
    <div className="min-h-screen bg-dark-300 flex flex-col">
      <BoardHeader
        board={board}
        onOpenMembers={openMembersPanel}
        onAddColumn={openAddColumn}
        onDelete={canManage ? handleDelete : undefined}
      />

      <BoardCanvas
        board={board}
        boardId={boardId}
        canManage={canManage}
        onCardClick={setSelectedCard}
        sensors={sensors}
        activeDragId={activeDragId}
        activeDragType={activeDragType}
        activeCard={activeCard}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <AddColumnInline
          boardId={boardId}
          open={isAddColumnOpen}
          onOpen={openAddColumn}
          onClose={closeAddColumn}
          onCreated={() => fetchBoard(boardId)}
        />
      </BoardCanvas>

      {selectedCard && (
        <CardModal
          card={selectedCard}
          boardId={boardId}
          onClose={closeSelectedCard}
        />
      )}

      {isMembersPanelOpen && (
        <MembersPanel
          boardId={boardId}
          onClose={closeMembersPanel}
        />
      )}
    </div>
  )
}

export default function BoardPage() {
 const useBoardIdParam=()=> {
    const params = useParams()
    return params.boardId as string
  }
  const boardId = useBoardIdParam()
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/auth/login')
    }
  }, [authLoading, user, router])

  if (authLoading || !user) return null

  return (
    <BoardProvider boardId={boardId}>
      <BoardView boardId={boardId} />
    </BoardProvider>
  )
}