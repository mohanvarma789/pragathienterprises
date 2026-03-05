const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config({ silent: true });
const errorHandler = require('./middleware/error-handler');

process.on('uncaughtException', (err) => {
    console.error('[UNCAUGHT EXCEPTION]', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('[UNHANDLED REJECTION]', reason);
});

const app = express();
const PORT = process.env.PORT || 3000;

// Test database connection on startup
const pool = require('./config/db');
pool.getConnection()
    .then(conn => {
        conn.release();
    })
    .catch(err => {
        console.error('[CRITICAL] Database connection failed:', err.message);
    });

app.use(helmet());

// CORS — allow Pragathi Enterprises frontends
const allowedOrigins = [
  'http://localhost:4200',
  'http://localhost:3000',
  'http://13.234.120.26',
  'https://13.234.120.26',
  'http://pragathi-enterprises-frontend-2026.s3-website.ap-south-1.amazonaws.com'
];
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.error('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET','POST','PUT','DELETE','PATCH','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again after 15 minutes'
});
app.use('/api/', limiter);

// Routes
const shopRoutes = require('./routes/shops');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const authRoutes = require('./routes/auth');
const verifyToken = require('./middleware/auth');

app.use('/api/auth', authRoutes);
app.use('/api/shops', verifyToken, shopRoutes);
app.use('/api/products', verifyToken, productRoutes);
app.use('/api/orders', verifyToken, orderRoutes);
app.use('/api/backorders', verifyToken, require('./routes/backorders'));
app.use('/api/stock-requests', verifyToken, require('./routes/stock-requests'));

app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date(),
        version: require('../package.json').version
    });
});

// Global Error Handler (must be last)
app.use(errorHandler);

const server = app.listen(PORT, '0.0.0.0', (err) => {
    if (err) {
        console.error('[CRITICAL] Server failed to start:', err);
        return;
    }
    console.log(`Server running on http://localhost:${PORT}`);
});
