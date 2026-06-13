require('dotenv').config();
const http    = require('http');
const express = require('express');
const cors    = require('cors');

const { createRouter }       = require('./src/presentation/routes');
const { errorMiddleware, notFoundMiddleware } = require('./src/infrastructure/middleware/auth');
const { eventBus, setupWebSocket } = require('./src/infrastructure/websocket');

const { AuthRepository }       = require('./src/infrastructure/repositories/AuthRepository');
const { GruppoRepository }     = require('./src/infrastructure/repositories/GruppoRepository');
const { DispositivoRepository }= require('./src/infrastructure/repositories/DispositivoRepository');
const { StanzaRepository, ScenarioRepository, NotificaRepository, EnergiaRepository, RegolaRepository } =
  require('./src/infrastructure/repositories/OtherRepositories');

const app    = express();
const server = http.createServer(app);

app.use(cors({ origin: '*', methods: ['GET','POST','PATCH','DELETE','OPTIONS'], allowedHeaders: ['Content-Type','Authorization'] }));
app.use(express.json());
app.use((req, _res, next) => { console.log(`[HTTP] ${req.method} ${req.path}`); next(); });

const repos = {
  authRepo:     new AuthRepository(),
  gruppoRepo:   new GruppoRepository(),
  devRepo:      new DispositivoRepository(),
  stanzaRepo:   new StanzaRepository(),
  scenarioRepo: new ScenarioRepository(),
  notifRepo:    new NotificaRepository(),
  energiaRepo:  new EnergiaRepository(),
  regolaRepo:   new RegolaRepository(),
};

app.use('/api', createRouter(repos, eventBus));
app.get('/', (req, res) => res.json({ name: 'YourSmartHome API v2', health: '/api/health' }));
app.use(notFoundMiddleware);
app.use(errorMiddleware);

setupWebSocket(server);

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🏠 YourSmartHome API v2`);
  console.log(`   HTTP → http://0.0.0.0:${PORT}`);
  console.log(`   WS   → ws://0.0.0.0:${PORT}/ws`);
  console.log(`   DB   → ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}\n`);
});
