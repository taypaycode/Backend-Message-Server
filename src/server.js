// Load environment variables from .env file
require('dotenv').config();

// Import required Node.js modules
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const Message = require('./models/message');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const fs = require('fs');
const winston = require('winston');
const User = require('./models/user');

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Ensure uploads directory exists
    if (!fs.existsSync('./uploads')) {
        fs.mkdirSync('./uploads', { recursive: true });
    }
    cb(null, './uploads');
  },
  filename: function (req, file, cb) {
    // Create unique filename with original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// Filter for image files
const imageFilter = function (req, file, cb) {
  // Accept images only
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
    return cb(new Error('Only image files are allowed!'), false);
  }
  cb(null, true);
};

// Initialize upload with configuration
const upload = multer({ 
  storage: storage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Setup Winston logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'backend-message-server' },
  transports: [
    // Write all logs to console
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    // Write all logs with level 'error' and below to error.log
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    // Write all logs with level 'info' and below to combined.log
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

// Create logs directory if it doesn't exist
if (!fs.existsSync('./logs')) {
  fs.mkdirSync('./logs', { recursive: true });
}

// Create a single Express application instance
const app = express();
const port = 3000;

// Enable JSON body parsing middleware with debug logging
app.use(express.json({
  verify: (req, res, buf, encoding) => {
    try {
      // Just check if it's parseable (this is what express.json does internally)
      JSON.parse(buf.toString());
      console.log('Successfully parsed JSON body');
    } catch (e) {
      console.error('ERROR parsing JSON body:', e.message);
      console.log('Raw body:', buf.toString().substring(0, 200) + '...');
    }
  }
}));

// Single middleware setup for static files
app.use(express.static('public'));

// First API endpoint
app.get('/api/hello', (req, res) => {
    res.json({ message: 'Hello from the backend!' });
});

// Debug route to test API connectivity
app.get('/api/debug', (req, res) => {
    res.json({
        message: 'Debug route is working',
        routes: {
            auth: {
                register: '/api/auth/register (POST)',
                login: '/api/auth/login (POST)'
            },
            messages: '/api/messages (GET/POST)',
            images: '/api/images (GET)',
            uploads: '/api/images/upload (POST)'
        },
        serverInfo: {
            time: new Date().toISOString(),
            node: process.version,
            mongoConnected: mongoose.connection.readyState === 1
        }
    });
});

// Simple test route for auth
app.get('/api/auth/test', (req, res) => {
    res.json({
        message: 'Auth routes are accessible',
        authRoutes: {
            register: '/api/auth/register (POST)',
            login: '/api/auth/login (POST)'
        }
    });
});

// Second API endpoint - both endpoints on the same app instance
app.get('/api/hello2', (req, res) => {
    res.json({ message: 'Hello from the backend2!' });
});

// Third API endpoint - both endpoints on the same app instance
app.get('/api/hello3', (req, res) => {
    res.json({ message: 'Hello from the backend3!' });
});

// Connect to MongoDB Atlas
const mongoURI = process.env.MONGODB_URI;
console.log('MongoDB URI:', mongoURI ? 'URI found in environment variables' : 'No URI found in environment variables');

mongoose.connect(mongoURI, {
    serverApi: {
        version: '1',
        strict: true,
        deprecationErrors: true,
    }
})
.then(() => {
    console.log('Connected to MongoDB Atlas');
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

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user._id, 
      username: user.username,
      email: user.email,
      role: user.role
    }, 
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '24h' }
  );
};

// Authentication middleware
const authMiddleware = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required. Please provide a valid token.' });
    }
    
    // Extract token
    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Authentication required. Please provide a valid token.' });
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Check if user still exists
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ error: 'User no longer exists.' });
    }
    
    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token.' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired.' });
    }
    res.status(500).json({ error: 'Authentication failed.' });
  }
};

// Admin middleware - ensure user is an admin
const adminMiddleware = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ error: 'Access denied. Admin privileges required.' });
  }
};

// Authentication routes
// Register user
app.post('/api/auth/register', [
  body('username').trim().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
  try {
    // Debug logging
    console.log('Register request received:');
    console.log('- Headers:', req.headers);
    console.log('- Body:', req.body);
    
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { username, email, password } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      console.log('User already exists:', email);
      return res.status(400).json({ error: 'User with this email or username already exists' });
    }
    
    // Create new user
    const user = new User({
      username,
      email,
      password
    });
    
    // Save user to database
    await user.save();
    
    // Generate token
    const token = generateToken(user);
    
    // Log successful registration
    logger.info(`New user registered: ${username} (${email})`);
    console.log(`User registered successfully: ${username} (${email})`);
    
    // Return token
    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    logger.error('Registration error:', error);
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login user
app.post('/api/auth/login', [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    // Debug logging
    console.log('Login request received:');
    console.log('- Headers:', req.headers);
    console.log('- Body:', req.body);
    
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { email, password } = req.body;
    
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found:', email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      // Log failed login attempt
      console.log('Password mismatch for:', email);
      logger.warn(`Failed login attempt for user: ${email}`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Generate token
    const token = generateToken(user);
    
    // Log successful login
    logger.info(`User logged in: ${user.username} (${user.email})`);
    console.log(`User logged in successfully: ${user.username} (${user.email})`);
    
    // Return token
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    logger.error('Login error:', error);
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get current user
app.get('/api/auth/me', authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

// Update the protected route to use the enhanced middleware
app.get('/api/protected', authMiddleware, (req, res) => {
  logger.info(`Protected route accessed by user: ${req.user.username}`);
  res.json({ 
    message: `Hello ${req.user.username}!`,
    user: req.user
  });
});

// Add an admin-only route
app.get('/api/admin', authMiddleware, adminMiddleware, (req, res) => {
  logger.info(`Admin route accessed by: ${req.user.username}`);
  res.json({ message: 'Welcome to the admin area' });
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

// Create an Image model
const imageSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  path: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  mimetype: {
    type: String,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
});

const Image = mongoose.model('Image', imageSchema);

// Route to get a single image by ID
app.get('/api/images/:id', async (req, res) => {
  try {
    const image = await Image.findById(req.params.id);
    
    if (!image) {
      return res.status(404).json({ error: 'Image not found' });
    }
    
    // Get host info for constructing full URL
    const protocol = req.protocol;
    const host = req.get('host');
    const fullUrl = `${protocol}://${host}`;
    
    res.json({
      id: image._id,
      filename: image.filename,
      originalName: image.originalName,
      url: `${fullUrl}${image.path}`,
      size: image.size,
      uploadedAt: image.uploadedAt,
      userId: image.userId
    });
  } catch (error) {
    logger.error('Error fetching image:', error);
    res.status(500).json({ error: 'Failed to fetch image' });
  }
});

// Route for image upload - Make sure the route name matches the frontend
app.post('/api/images/upload', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Please upload an image file' });
    }
    
    // Get host info for constructing full URL
    const protocol = req.protocol;
    const host = req.get('host');
    const fullUrl = `${protocol}://${host}`;
    const relativePath = `/uploads/${req.file.filename}`;
    
    // Create image record in database
    const image = new Image({
      filename: req.file.filename,
      originalName: req.file.originalname,
      path: relativePath,
      size: req.file.size,
      mimetype: req.file.mimetype,
      userId: req.user._id
    });
    
    // Save image record
    await image.save();
    
    // Log upload
    logger.info(`Image uploaded by ${req.user.username}: ${req.file.originalname} (${req.file.size} bytes)`);
    
    // Return image details
    res.status(201).json({ 
      message: 'Image uploaded successfully',
      image: {
        id: image._id,
        filename: image.filename,
        originalName: image.originalName,
        url: `${fullUrl}${relativePath}`,
        size: image.size,
        uploadedAt: image.uploadedAt
      }
    });
  } catch (error) {
    logger.error('Image upload error:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

// Route to get all images
app.get('/api/images', authMiddleware, async (req, res) => {
  try {
    const images = await Image.find()
      .sort({ uploadedAt: -1 })
      .limit(100); // Limit to last 100 images
    
    // Get host info for constructing full URLs
    const protocol = req.protocol;
    const host = req.get('host');
    const fullUrl = `${protocol}://${host}`;
    
    // Transform images to include full URLs
    const imagesWithUrls = images.map(image => ({
      id: image._id,
      filename: image.filename,
      originalName: image.originalName,
      url: `${fullUrl}${image.path}`,
      size: image.size,
      uploadedAt: image.uploadedAt,
      userId: image.userId
    }));
    
    res.json(imagesWithUrls);
  } catch (error) {
    logger.error('Error fetching images:', error);
    res.status(500).json({ error: 'Failed to fetch images' });
  }
});

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Add logs API endpoint
app.get('/api/logs', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    // Determine which log file to read based on level
    const level = req.query.level || 'all';
    let logFile = 'logs/combined.log';
    
    if (level === 'error') {
      logFile = 'logs/error.log';
    }
    
    // Check if log file exists
    if (!fs.existsSync(logFile)) {
      return res.status(404).json({ error: 'Log file not found' });
    }
    
    // Read the log file
    const fileContent = fs.readFileSync(logFile, 'utf8');
    
    // Parse log entries
    const logs = fileContent
      .split('\n')
      .filter(line => line.trim() !== '')
      .map(line => {
        try {
          return JSON.parse(line);
        } catch (e) {
          return { level: 'unknown', message: line, timestamp: new Date() };
        }
      })
      .filter(log => level === 'all' || log.level === level)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 100); // Limit to last 100 logs
    
    res.json(logs);
  } catch (error) {
    logger.error('Error fetching logs:', error);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

// Request Logger Middleware
app.use((req, res, next) => {
  // Generate a unique request ID
  req.id = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  // Log request details
  logger.info(`[${req.id}] ${req.method} ${req.originalUrl}`, {
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  // Track response time
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`[${req.id}] Response: ${res.statusCode} - ${duration}ms`);
  });
  next();
});

// Catch-all route
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Enhanced error handling middleware
app.use((err, req, res, next) => {
  // Log the error with details
  logger.error(`[${req.id || 'UNKNOWN'}] Error: ${err.message}`, {
    error: err.stack,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip
  });
  
  // Determine status code
  const statusCode = err.statusCode || 500;
  
  // Send error response
  res.status(statusCode).json({ 
    error: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message,
    requestId: req.id || 'UNKNOWN'
  });
});

// Single server listening
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
}); 