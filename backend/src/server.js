// LifeLine AI - Express Server Entry Point
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const authRoutes = require('./routes/auth.routes');
const sosRoutes = require('./routes/sos.routes');
const chatRoutes = require('./routes/chat.routes');
const analyzeRoutes = require('./routes/analyze.routes');
const doctorRoutes = require('./routes/doctor.routes');
const sessionRoutes = require('./routes/session.routes');
const financeRoutes = require('./routes/finance.routes'); // Finance Guard [additive]

const app = express();
const PORT = process.env.PORT || 5500;

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: '*' }));
app.use(express.json());

// ── Health check ────────────────────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok', service: 'LifeLine AI' }));

// ── Routes ──────────────────────────────────────────────────────────────────
app.use('/auth', authRoutes);
app.use('/sos', sosRoutes);
app.use('/chat', chatRoutes);
app.use('/analyze', analyzeRoutes);
app.use('/doctor', doctorRoutes);
app.use('/session', sessionRoutes);
app.use('/finance', financeRoutes); // Finance Guard [additive]

// ── Global error handler ────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

app.get("/", (req, res) => {
  res.send("solution challanger!");
});

const server = app.listen(5500, () => {
  console.log(`🚀 LifeLine AI backend running on http://0.0.0.0:${5500}`);
  console.log(`   → LAN access: http://10.171.161.128:${5500}`);
});

// ── Friendly error for port-in-use (EADDRINUSE) ─────────────────────────────
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use. Run: npx kill-port ${PORT}`);
    process.exit(1);
  } else {
    throw err;
  }
});

module.exports = app;
