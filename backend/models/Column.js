const mongoose = require('mongoose')

const columnSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 60 },
  board: { type: mongoose.Schema.Types.ObjectId, ref: 'Board', required: true },
  cardOrder: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Card' }]
}, { timestamps: true })

module.exports = mongoose.model('Column', columnSchema)
