require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();

app.use(helmet()); // Security middleware to set various HTTP headers

app.set('trust proxy', 1); // Required if behind a proxy like Render, Vercel, etc.

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'myDevSecretKey', // Use a strong key in production
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production', // Only true when live
      httpOnly: true,                                // Prevent client-side JS access
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    },
  })
);

// ✅ CORS setup (allow cookies/session + frontend access)
app.use(
  cors({
    origin: ['http://192.168.142.7:3000', 'http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true, // required for session cookie
  })
);

// Limit 100 requests per IP per 15 minutes
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// ✅ Middleware
app.use(express.json());
app.use('/uploads', express.static('uploads')); // Serve uploaded files

// ✅ API Routes
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/leads', require('./routes/leadRoutes'));
app.use('/api/uploads', require('./routes/uploadRoutes'));
app.use('/api/export', require('./routes/exportRoutes'));

// ✅ Server
const PORT = process.env.PORT || 5000;
const HOST = '192.168.1.6'; // LAN IP for external device access

app.listen(PORT, HOST, () => {
  console.log(`🚀 Server running at http://${HOST}:${PORT}`);
});
