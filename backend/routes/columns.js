const router = require('express').Router()
const Column = require('../models/Column')
const Card = require('../models/Card')
const Board = require('../models/Board')
const { protect, requireRole } = require('../middleware/auth')
const { loadBoard } = require('../middleware/board')

router.use(protect)

// POST /api/columns/:boardId — create column
router.post('/:boardId', loadBoard, async (req, res) => {
  try {
    const { title } = req.body
    if (!title?.trim()) return res.status(400).json({ message: 'Title required' })
    const column = await Column.create({ title: title.trim(), board: req.params.boardId, cardOrder: [] })
    const board = req.board
    board.columnOrder.push(column._id)
    await board.save()
    const io = req.app.get('io')
    io.to(`board:${req.params.boardId}`).emit('column:created', { column, columnOrder: board.columnOrder })
    res.status(201).json(column)
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// PUT /api/columns/:boardId/:columnId — rename column
router.put('/:boardId/:columnId', loadBoard, async (req, res) => {
  try {
    const { title } = req.body
    const column = await Column.findOneAndUpdate(
      { _id: req.params.columnId, board: req.params.boardId },
      { title: title.trim() },
      { new: true }
    )
    if (!column) return res.status(404).json({ message: 'Column not found' })
    const io = req.app.get('io')
    io.to(`board:${req.params.boardId}`).emit('column:updated', { column })
    res.json(column)
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// DELETE /api/columns/:boardId/:columnId — delete column + its cards
router.delete('/:boardId/:columnId', loadBoard, requireRole('owner', 'admin'), async (req, res) => {
  try {
    const { boardId, columnId } = req.params
    await Card.deleteMany({ column: columnId })
    await Column.findByIdAndDelete(columnId)
    const board = req.board
    board.columnOrder = board.columnOrder.filter(id => id.toString() !== columnId)
    await board.save()
    const io = req.app.get('io')
    io.to(`board:${boardId}`).emit('column:deleted', { columnId, columnOrder: board.columnOrder })
    res.json({ message: 'Column deleted' })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// PUT /api/columns/:boardId/:columnId/card-order — reorder cards in column
router.put('/:boardId/:columnId/card-order', loadBoard, async (req, res) => {
  try {
    const { cardOrder } = req.body
    const column = await Column.findByIdAndUpdate(
      req.params.columnId,
      { cardOrder },
      { new: true }
    )
    const io = req.app.get('io')
    io.to(`board:${req.params.boardId}`).emit('column:cardOrderUpdated', {
      columnId: req.params.columnId, cardOrder
    })
    res.json(column)
  } catch (err) { res.status(500).json({ message: err.message }) }
})

module.exports = router
