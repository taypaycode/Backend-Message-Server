// Import required Node.js modules
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const Message = require('./models/message');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const winston = require('winston');

// Create a single Express application instance
const app = express();
const port = 3000;

// Enable JSON body parsing middleware
app.use(express.json());

// Single middleware setup for static files
app.use(express.static('public'));

// First API endpoint
app.get('/api/hello', (req, res) => {
    res.json({ message: 'Hello from the backend!' });
});

// Second API endpoint - both endpoints on the same app instance
app.get('/api/hello2', (req, res) => {
    res.json({ message: 'Hello from the backend2!' });
});

// Third API endpoint - both endpoints on the same app instance
app.get('/api/hello3', (req, res) => {
    res.json({ message: 'Hello from the backend3!' });
});



// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/messageDB')
    .then(() => {
        console.log('Connected to MongoDB');
    })
    .catch(err => {
        console.error('MongoDB connection error:', err);
        // Gracefully handle connection failure
        process.exit(1);
    });

// API endpoint to save a message
app.post('/api/messages', async (req, res) => {
    try {
        const message = new Message({
            text: req.body.text
        });
        await message.save();
        res.json({ success: true, message });
    } catch (error) {
        res.status(500).json({ error: 'Failed to save message' });
    }
});

// API endpoint to get all messages
app.get('/api/messages', async (req, res) => {
    try {
        const messages = await Message.find().sort({ timestamp: -1 });
        res.json(messages);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});



// Middleware to protect routes
const authMiddleware = (req, res, next) => {
    const token = req.headers.authorization;
    try {
        const decoded = jwt.verify(token, 'your-secret-key');
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Unauthorized' });
    }
};

// Protected route example
app.get('/api/protected', authMiddleware, (req, res) => {
    res.json({ message: `Hello ${req.user.name}!` });
});

app.post('/api/user', [
    body('email').isEmail(),
    body('password').isLength({ min: 6 }),
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    // Process valid input...
});

app.post('/api/upload', upload.single('file'), (req, res) => {
    res.json({ 
        filename: req.file.filename,
        size: req.file.size 
    });
});


// Catch-all route
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    logger.error(err.stack);
    res.status(500).json({ 
        error: 'Something broke!',
        requestId: req.id 
    });
});

// Single server listening
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
}); 