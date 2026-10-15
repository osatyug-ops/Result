const mongoose = require('mongoose');

const ResultSchema = new mongoose.Schema({
  date: { type: String, required: true, unique: true }, // Format: YYYY-MM-DD
  disawar: { type: String, default: "XX" },
  delhiBazar: { type: String, default: "XX" },
  shriGanesh: { type: String, default: "XX" },
  faridabad: { type: String, default: "XX" },
  ghaziabad: { type: String, default: "XX" },
  gali: { type: String, default: "XX" },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Result', ResultSchema);