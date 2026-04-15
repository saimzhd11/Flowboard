const mongoose = require('mongoose')

const commentSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true, trim: true, maxlength: 500 }
}, { timestamps: true })

const cardSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 120 },
  description: { type: String, trim: true, maxlength: 1000, default: '' },
  board: { type: mongoose.Schema.Types.ObjectId, ref: 'Board', required: true },
  column: { type: mongoose.Schema.Types.ObjectId, ref: 'Column', required: true },
  priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
  assignees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  dueDate: { type: Date, default: null },
  labels: [{ type: String, trim: true }],
  comments: [commentSchema],
  coverColor: { type: String, default: '' }
}, { timestamps: true })

module.exports = mongoose.model('Card', cardSchema)
