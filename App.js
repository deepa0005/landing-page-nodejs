require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const zohoRoutes = require("./routes/zohoRoutes");

const app = express();


const MySQLStore = require('express-mysql-session')(session);

const sessionStore = new MySQLStore({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

app.use(helmet()); // Security middleware to set various HTTP headers

app.set('trust proxy', 1); // Required if behind a proxy like Render, Vercel, etc.

// app.use(
//   session({
//     secret: process.env.SESSION_SECRET || 'myDevSecretKey', // Use a strong key in production
//     resave: false,
//     saveUninitialized: false,
//     cookie: {
//       secure: process.env.NODE_ENV === 'production', // Only true when live
//       httpOnly: true,                                // Prevent client-side JS access
//       sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
//       maxAge: 24 * 60 * 60 * 1000, // 1 day
//     },
//   })
// );

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'myDevSecretKey',
    resave: false,
    saveUninitialized: false,
    store: sessionStore, // ✅ use MySQL session store
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);


// ✅ CORS setup (allow cookies/session + frontend access)
app.use(
  cors({
    origin: ['http://localhost:5173', 'http://localhost:3000', 'https://landing-page-reactjs-eosin.vercel.app', 'https://dashboard-tan-beta-19.vercel.app'],
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
// ✅ Static file serving
app.use("/api/zoho", zohoRoutes);

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

const HOST = process.env.HOST || '0.0.0.0';


// const HOST = '192.168.1.6'; // LAN IP for external device access

app.listen(PORT, HOST, () => {
  console.log(`🚀 Server running at http://${HOST}:${PORT}`);
});
