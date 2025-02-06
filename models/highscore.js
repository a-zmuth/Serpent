const mongoose = require('mongoose');

const HighScoreSchema = new mongoose.Schema({
    userID: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
    score: { type: Number, required: true },
    sessionDate: { type: Date, default: Date.now },
});

module.exports = mongoose.model('highScore', HighScoreSchema);