const express = require('express');
const session = require('express-session');
const path = require('path');

const collectRoutes = require('./routes/collect');
const reportingRoutes = require('./routes/reporting');

const app = express();
app.use((req, res, next) => {
    console.log(`>>> ${req.method} ${req.url} | Origin: ${req.headers.origin}`);
    next();
});
app.set('trust proxy', true);

// Body Parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.text({ type: '*/*', limit: '1mb' }));

// Sessions (Required for Dashboard Auth)
app.use(session({
  secret: 'course_dashboard_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, httpOnly: true, sameSite: 'lax', maxAge: 86400000 }
}));

// Unified CORS
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // Explicitly allow your domains
  if (origin && (origin.includes('nathanguyen.site') || origin.includes('localhost'))) {
    res.header('Access-Control-Allow-Origin', origin);
  } else {
    // Fallback for testing
    res.header('Access-Control-Allow-Origin', '*');
  }

  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

  // IMMEDIATELY respond to OPTIONS requests
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  next();
});

// Routes
app.use(collectRoutes);
app.use(reportingRoutes);

// Serve Static Dashboard Files
app.use(express.static(path.join(__dirname, '../reporting.nathanguyen.site/public_html')));

// --- 404 Handler ---
app.use((req, res) => {
    // API routes return JSON 404
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'Not found' });
    }
    // HTML pages return 404.html
    res.status(404).sendFile(path.join(__dirname, '../reporting.nathanguyen.site/public_html/404.html'));
});

// --- 500 Error Handler ---
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err.message);
    if (req.path.startsWith('/api/')) {
        return res.status(500).json({ error: 'Internal server error' });
    }
    res.status(500).sendFile(path.join(__dirname, '../reporting.nathanguyen.site/public_html/500.html'));
});

const PORT = 3005;
app.listen(PORT, () => {
  console.log(`Analytics Hub running on port ${PORT}`);
});