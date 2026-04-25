const router = require('express').Router()
const Card = require('../models/Card')
const Column = require('../models/Column')
const { protect } = require('../middleware/auth')
const { loadBoard } = require('../middleware/board')

router.use(protect)

// POST /api/cards/:boardId/:columnId
router.post('/:boardId/:columnId', loadBoard, async (req, res) => {
  try {
    const { title, priority, dueDate, labels } = req.body
    if (!title?.trim()) return res.status(400).json({ message: 'Title required' })
    const card = await Card.create({
      title: title.trim(),
      board: req.params.boardId,
      column: req.params.columnId,
      priority: priority || 'medium',
      dueDate: dueDate || null,
      labels: labels || []
    })
    const populatedCard = await Card.findById(card._id).populate('assignees', 'name email avatar')
    const column = await Column.findById(req.params.columnId)
    column.cardOrder.push(card._id)
    await column.save()
    const io = req.app.get('io')
    io.to(`board:${req.params.boardId}`).emit('card:created', {
      card: populatedCard, columnId: req.params.columnId, cardOrder: column.cardOrder
    })
    res.status(201).json(populatedCard)
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// PUT /api/cards/:boardId/:cardId/move
router.put('/:boardId/:cardId/move', loadBoard, async (req, res) => {
  try {
    const {
      sourceColumnId,
      destinationColumnId,
      sourceOrder,
      destinationOrder
    } = req.body

    const { boardId, cardId } = req.params

    if (!sourceColumnId || !destinationColumnId) {
      return res.status(400).json({ message: 'Source and destination columns required' })
    }

    if (!Array.isArray(sourceOrder) || !Array.isArray(destinationOrder)) {
      return res.status(400).json({ message: 'Source and destination order required' })
    }

    const card = await Card.findOne({ _id: cardId, board: boardId })

    if (!card) {
      return res.status(404).json({ message: 'Card not found' })
    }

    const sourceColumn = await Column.findOne({
      _id: sourceColumnId,
      board: boardId
    })

    const destinationColumn = await Column.findOne({
      _id: destinationColumnId,
      board: boardId
    })

    if (!sourceColumn || !destinationColumn) {
      return res.status(404).json({ message: 'Column not found' })
    }

    card.column = destinationColumnId
    sourceColumn.cardOrder = sourceOrder
    destinationColumn.cardOrder = destinationOrder

    await Promise.all([
      card.save(),
      sourceColumn.save(),
      destinationColumn.save()
    ])

    const updatedCard = await Card.findById(card._id)
      .populate('assignees', 'name email avatar')
      .populate('comments.author', 'name email avatar')

    const io = req.app.get('io')

    io.to(`board:${boardId}`).emit('card:moved', {
      card: updatedCard,
      sourceColumnId,
      destinationColumnId,
      sourceOrder,
      destinationOrder
    })

    res.json({
      card: updatedCard,
      sourceColumnId,
      destinationColumnId,
      sourceOrder,
      destinationOrder
    })
  } catch (err) {
    console.log('Move card error:', err)
    res.status(500).json({ message: err.message })
  }
})

// GET /api/cards/:boardId/:cardId — single card detail
router.get('/:boardId/:cardId', loadBoard, async (req, res) => {
  try {
    const card = await Card.findOne({ _id: req.params.cardId, board: req.params.boardId })
      .populate('assignees', 'name email avatar')
      .populate('comments.author', 'name email avatar')
    if (!card) return res.status(404).json({ message: 'Card not found' })
    res.json(card)
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// PUT /api/cards/:boardId/:cardId — update card
router.put('/:boardId/:cardId', loadBoard, async (req, res) => {
  try {
    const { title, description, priority, dueDate, labels, assignees, coverColor } = req.body
    const card = await Card.findOne({ _id: req.params.cardId, board: req.params.boardId })
    if (!card) return res.status(404).json({ message: 'Card not found' })

    

    if (title !== undefined) card.title = title.trim()
    if (description !== undefined) card.description = description
    if (priority !== undefined) card.priority = priority
    if (dueDate !== undefined) card.dueDate = dueDate || null
    if (labels !== undefined) card.labels = labels
    if (assignees !== undefined) card.assignees = assignees
    if (coverColor !== undefined) card.coverColor = coverColor

    await card.save()
    const updatedCard = await Card.findById(card._id)
      .populate('assignees', 'name email avatar')
      .populate('comments.author', 'name email avatar')

    const io = req.app.get('io')

    io.to(`board:${req.params.boardId}`).emit('card:updated', { card: updatedCard })
          console.log('backend here ')

    res.json(updatedCard)
  } catch (err) {
    console.log('error is:', err)
    res.status(500).json({ message: err.message })
  }
})

// DELETE /api/cards/:boardId/:cardId
router.delete('/:boardId/:cardId', loadBoard, async (req, res) => {
  try {
    const card = await Card.findOneAndDelete({ _id: req.params.cardId, board: req.params.boardId })
    if (!card) return res.status(404).json({ message: 'Card not found' })
    await Column.findByIdAndUpdate(card.column, {
      $pull: { cardOrder: card._id }
    })
    const io = req.app.get('io')
    io.to(`board:${req.params.boardId}`).emit('card:deleted', {
      cardId: card._id, columnId: card.column
    })
    res.json({ message: 'Card deleted' })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// POST /api/cards/:boardId/:cardId/comments
router.post('/:boardId/:cardId/comments', loadBoard, async (req, res) => {
  try {
    const { text } = req.body
    if (!text?.trim()) return res.status(400).json({ message: 'Comment text required' })
    const card = await Card.findOne({ _id: req.params.cardId, board: req.params.boardId })
    if (!card) return res.status(404).json({ message: 'Card not found' })
    card.comments.push({ author: req.user._id, text: text.trim() })
    await card.save()
    const updatedCard = await Card.findById(card._id)
      .populate('comments.author', 'name email avatar')
    const newComment = updatedCard.comments[updatedCard.comments.length - 1]
    const io = req.app.get('io')
    io.to(`board:${req.params.boardId}`).emit('card:commentAdded', {
      cardId: card._id, comment: newComment
    })
    res.status(201).json(newComment)
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// DELETE /api/cards/:boardId/:cardId/comments/:commentId
router.delete('/:boardId/:cardId/comments/:commentId', loadBoard, async (req, res) => {
  try {
    const card = await Card.findOne({ _id: req.params.cardId, board: req.params.boardId })
    if (!card) return res.status(404).json({ message: 'Card not found' })
    const comment = card.comments.id(req.params.commentId)
    if (!comment) return res.status(404).json({ message: 'Comment not found' })
    if (comment.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not your comment' })
    }
    comment.deleteOne()
    await card.save()
    const io = req.app.get('io')
    io.to(`board:${req.params.boardId}`).emit('card:commentDeleted', {
      cardId: card._id, commentId: req.params.commentId
    })
    res.json({ message: 'Comment deleted' })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

module.exports = router
