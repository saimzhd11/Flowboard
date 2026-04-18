type BoardMember = {
  user: {
    _id: string
  }
  role: string
}

type BoardWithMembers = {
  members: BoardMember[]
} | null | undefined

export function getUserBoardRole(board: BoardWithMembers, userId?: string) {
  if (!board || !userId) return undefined
  return board.members.find(member => member.user._id === userId)?.role
}

export function canManageBoard(board: BoardWithMembers, userId?: string) {
  const role = getUserBoardRole(board, userId)
  return role === 'owner' || role === 'admin'
}