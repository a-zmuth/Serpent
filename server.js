const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

// Import Models
const User = require('./models/user');
const HighScore = require('./models/highscore');

// Initialize Express app
const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public')); // Serve static files

// Endpoint to create a user
app.post('/api/users', async (req, res) => {
    const { walletAddress } = req.body;

    try {
        const user = new User({ walletAddress });
        await user.save();
        res.json({ success: true, userID: user._id });
    } catch (error) {
        res.status(400).json({ success: false, message: 'User already exists' });
    }
});

// Endpoint to submit a score
app.post('/api/scores', async (req, res) => {
    const { userID, score } = req.body;

    const highScore = new HighScore({ userID, score });
    await highScore.save();

    res.json({ success: true });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});