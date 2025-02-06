const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    walletAddress: { type: String, unique: true, required: true },
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('user', UserSchema);