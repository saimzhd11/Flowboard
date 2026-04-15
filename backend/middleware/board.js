const Board = require('../models/Board')

// Loads board from :boardId param, checks user is a member
const loadBoard = async (req, res, next) => {
  try {
    const board = await Board.findById(req.params.boardId).populate('members.user', 'name email avatar')
    if (!board) return res.status(404).json({ message: 'Board not found' })
    if (!board.isMember(req.user._id)) {
      return res.status(403).json({ message: 'You are not a member of this board' })
    }
    req.board = board
    next()
  } catch {
    res.status(500).json({ message: 'Failed to load board' })
  }
}

module.exports = { loadBoard }
