const router = require('express').Router()
const Board = require('../models/Board')
const Column = require('../models/Column')
const Card = require('../models/Card')
const User = require('../models/User')
const { protect, requireRole } = require('../middleware/auth')
const { loadBoard } = require('../middleware/board')

router.use(protect)

// GET /api/boards — all boards the user is a member of
router.get('/', async (req, res) => {
  try {
    const boards = await Board.find({ 'members.user': req.user._id })
      .populate('members.user', 'name email avatar')
      .sort({ updatedAt: -1 })
    res.json(boards)
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// POST /api/boards — create board
router.post('/', async (req, res) => {
  try {
    const { title, description, color } = req.body
    if (!title?.trim()) return res.status(400).json({ message: 'Title is required' })
    const board = await Board.create({
      title: title.trim(),
      description: description?.trim() || '',
      color: color || '#6366f1',
      members: [{ user: req.user._id, role: 'owner' }]
    })
    await board.populate('members.user', 'name email avatar')
    const io = req.app.get('io')
    io.to(`board:${board._id}`).emit('board:updated', board)
    res.status(201).json(board)
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// GET /api/boards/:boardId — full board with columns and cards
router.get('/:boardId', loadBoard, async (req, res) => {
  try {
    const board = await Board.findById(req.params.boardId)
      .populate('members.user', 'name email avatar')
      .populate({
        path: 'columnOrder',
        populate: {
          path: 'cardOrder',
          populate: { path: 'assignees', select: 'name email avatar' }
        }
      })
    res.json(board)
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// PUT /api/boards/:boardId — update board (admin/owner)
router.put('/:boardId', loadBoard, requireRole('owner', 'admin'), async (req, res) => {
  try {
    const { title, description, color } = req.body
    const board = req.board
    if (title) board.title = title.trim()
    if (description !== undefined) board.description = description.trim()
    if (color) board.color = color
    await board.save()
    const io = req.app.get('io')
    io.to(`board:${board._id}`).emit('board:updated', board)
    res.json(board)
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// DELETE /api/boards/:boardId — owner only
router.delete('/:boardId', loadBoard, requireRole('owner'), async (req, res) => {
  try {
    const boardId = req.params.boardId
    await Column.deleteMany({ board: boardId })
    await Card.deleteMany({ board: boardId })
    await Board.findByIdAndDelete(boardId)
    const io = req.app.get('io')
    io.to(`board:${boardId}`).emit('board:deleted', { boardId })
    res.json({ message: 'Board deleted' })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// POST /api/boards/:boardId/members — invite by email (admin/owner)
router.post('/:boardId/members', loadBoard, requireRole('owner', 'admin'), async (req, res) => {
  try {
    const { email, role = 'member' } = req.body
    const user = await User.findOne({ email: email?.toLowerCase() })
    if (!user) return res.status(404).json({ message: 'No user found with that email' })
    const board = req.board
    if (board.isMember(user._id)) return res.status(400).json({ message: 'User is already a member' })
    board.members.push({ user: user._id, role })
    await board.save()
    await board.populate('members.user', 'name email avatar')
    const io = req.app.get('io')
    io.to(`board:${board._id}`).emit('board:memberAdded', { board })
    res.json(board)
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// PUT /api/boards/:boardId/members/:userId — change role (owner only)
router.put('/:boardId/members/:userId', loadBoard, requireRole('owner'), async (req, res) => {
  try {
    const { role } = req.body
    const board = req.board
    const member = board.members.find(m => m.user._id.toString() === req.params.userId)
    if (!member) return res.status(404).json({ message: 'Member not found' })
    if (member.role === 'owner') return res.status(400).json({ message: 'Cannot change owner role' })
    member.role = role
    await board.save()
    const io = req.app.get('io')
    io.to(`board:${board._id}`).emit('board:updated', board)
    res.json(board)
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// DELETE /api/boards/:boardId/members/:userId — remove member (owner/admin)
router.delete('/:boardId/members/:userId', loadBoard, requireRole('owner', 'admin'), async (req, res) => {
  try {
    const board = req.board
    const targetId = req.params.userId
    const target = board.members.find(m => m.user._id.toString() === targetId)
    if (!target) return res.status(404).json({ message: 'Member not found' })
    if (target.role === 'owner') return res.status(400).json({ message: 'Cannot remove owner' })
    board.members = board.members.filter(m => m.user._id.toString() !== targetId)
    await board.save()
    const io = req.app.get('io')
    io.to(`board:${board._id}`).emit('board:memberRemoved', { userId: targetId })
    res.json(board)
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// PUT /api/boards/:boardId/column-order — reorder columns (drag & drop)
router.put('/:boardId/column-order', loadBoard, async (req, res) => {
  try {
    const { columnOrder } = req.body
    const board = req.board
    board.columnOrder = columnOrder
    await board.save()
    const io = req.app.get('io')
    io.to(`board:${board._id}`).emit('board:columnOrderUpdated', { columnOrder })
    res.json({ columnOrder })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

module.exports = router
