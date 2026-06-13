// ── Infrastructure – EventBus + WebSocket ─────────────────────────────────────
const { WebSocketServer } = require('ws');

class EventBus {
  constructor() { this._subs = new Map(); }

  subscribe(topic, fn) {
    if (!this._subs.has(topic)) this._subs.set(topic, new Set());
    this._subs.get(topic).add(fn);
    return () => this._subs.get(topic)?.delete(fn);
  }

  publish(topic, payload) {
    for (const fn of this._subs.get(topic) || []) {
      try { fn({ topic, payload }); } catch (e) { console.error('[EventBus]', e.message); }
    }
  }
}

const eventBus = new EventBus();

function setupWebSocket(server) {
  const wss = new WebSocketServer({ server, path: '/ws' });

  const TOPICS = [
    'DEVICE_TOGGLED','DEVICE_UPDATED','DEVICE_ADDED','DEVICE_DELETED',
    'NOTIFICATION_NEW','NOTIFICATION_READ','NOTIFICATION_ALL_READ',
    'SCENARIO_ACTIVATED','SCENARIO_DELETED',
    'MEMBRO_AGGIUNTO','MEMBRO_RIMOSSO','INVITO_INVIATO',
  ];

  for (const topic of TOPICS) {
    eventBus.subscribe(topic, ({ topic, payload }) => {
      const msg = JSON.stringify({ topic, payload });
      // Invia solo ai client del gruppo corretto
      for (const client of wss.clients) {
        if (client.readyState === client.OPEN) {
          const idGruppo = payload?.idGruppo || payload?.id_gruppo;
          if (!idGruppo || client._idGruppo === idGruppo || !client._idGruppo) {
            client.send(msg);
          }
        }
      }
    });
  }

  wss.on('connection', (ws, req) => {
    console.log(`[WS] Client connesso. Totale: ${wss.clients.size}`);
    ws.send(JSON.stringify({ topic: 'CONNECTED', payload: { ok: true } }));

    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.type === 'ping') ws.send(JSON.stringify({ type: 'pong' }));
        // Il client può identificare il proprio gruppo
        if (msg.type === 'join' && msg.idGruppo) ws._idGruppo = msg.idGruppo;
      } catch {}
    });

    ws.on('close', () => console.log(`[WS] Client disconnesso. Totale: ${wss.clients.size}`));
  });

  console.log('[WS] WebSocket attivo su /ws');
  return wss;
}

module.exports = { eventBus, setupWebSocket };
