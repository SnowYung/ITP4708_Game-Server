const mongoose = require('mongoose');

const gameRecordSchema = new mongoose.Schema({
    playerName: String,
    score: Number,
    totalRounds: Number,
    Win: { type: Boolean, default: false },
    timestamp: { type: Date, default: Date.now }
});

gameRecordSchema.index({ playerName: 1, timestamp: 1 }, { unique: true });

module.exports = mongoose.model('GameRecord', gameRecordSchema);