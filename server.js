require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet({
    contentSecurityPolicy: false // Allow inline scripts for simple HTML
}));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Serve static files
app.use('/storage', express.static(path.join(__dirname, 'storage')));
app.use('/public', express.static(path.join(__dirname, 'public')));

// Serve frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API Routes
const studentRoutes = require('./src/routes/students');
const problemRoutes = require('./src/routes/problems');
const testRoutes = require('./src/routes/tests');
const resultRoutes = require('./src/routes/results');

// Scheduler for automated tasks
const scheduler = require('./src/services/scheduler');

app.use('/api/students', studentRoutes);
app.use('/api/problems', problemRoutes);
app.use('/api/tests', testRoutes);
app.use('/api/results', resultRoutes);

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        system: 'MARGA - Math Assessment Recognition & Grading Automation'
    });
});

// Error handling
app.use((err, req, res, next) => {
    console.error('Error:', err);

    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Внутренняя ошибка сервера',
        error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Страница не найдена'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`
    ╔═══════════════════════════════════════════════════════╗
    ║                                                       ║
    ║   MARGA - Math Assessment Recognition & Grading      ║
    ║           Automation System                           ║
    ║                                                       ║
    ║   Server running on port ${PORT}                         ║
    ║   Environment: ${process.env.NODE_ENV || 'development'}                         ║
    ║                                                       ║
    ║   Admin Panel: http://localhost:${PORT}                  ║
    ║   API: http://localhost:${PORT}/api                      ║
    ║   Health: http://localhost:${PORT}/health                ║
    ║                                                       ║
    ╚═══════════════════════════════════════════════════════╝
    `);

    // Start scheduled tasks (backup sync every 24h)
    scheduler.start();
});

module.exports = app;
