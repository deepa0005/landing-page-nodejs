require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');

const app = express();

// ✅ Session middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'mySecretKey', // Store this in .env
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: false, // true if using HTTPS
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    },
  })
);

// ✅ CORS setup (allow cookies/session + frontend access)
app.use(
  cors({
    origin: ['http://192.168.1.8:3000', 'http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true, // required for session cookie
  })
);

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
