// ── Infrastructure – Middleware (Chain of Responsibility) ─────────────────────
const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  const header = req.headers['authorization'];
  if (!header || !header.startsWith('Bearer '))
    return res.status(401).json({ error: 'Token mancante o malformato' });

  try {
    const decoded = jwt.verify(header.slice(7), process.env.JWT_SECRET || 'dev_secret');
    req.user = { id: decoded.sub, email: decoded.email };
    next();
  } catch {
    res.status(401).json({ error: 'Token non valido o scaduto' });
  }
}

// Verifica che l'utente sia admin del gruppo specificato in req.params.idGruppo o req.body.idGruppo
function gruppoMiddleware(req, res, next) {
  req.idGruppo = parseInt(req.params.idGruppo || req.body.idGruppo);
  if (!req.idGruppo) return res.status(400).json({ error: 'idGruppo mancante' });
  next();
}

function errorMiddleware(err, req, res, next) {
  console.error('[ERROR]', err.message);
  const status = err.status || 500;
  res.status(status).json({ error: err.message || 'Errore interno del server' });
}

function notFoundMiddleware(req, res) {
  res.status(404).json({ error: `Route "${req.method} ${req.path}" non trovata` });
}

module.exports = { authMiddleware, gruppoMiddleware, errorMiddleware, notFoundMiddleware };
