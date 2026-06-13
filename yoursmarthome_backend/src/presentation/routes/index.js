// ── Presentation – Routes ─────────────────────────────────────────────────────
const { Router } = require('express');
const { authMiddleware } = require('../../infrastructure/middleware/auth');
const {
  makeAuthController, makeGruppoController, makeDispositivoController,
  makeStanzaController, makeScenarioController, makeNotificaController,
  makeEnergiaController, makeRegolaController,
} = require('../controllers');

function createRouter(repos, eventBus) {
  const r = Router();

  const auth      = makeAuthController(repos.authRepo);
  const gruppo    = makeGruppoController(repos.gruppoRepo, repos.notifRepo, eventBus);
  const device    = makeDispositivoController(repos.devRepo, eventBus);
  const stanza    = makeStanzaController(repos.stanzaRepo);
  const scenario  = makeScenarioController(repos.scenarioRepo, eventBus);
  const notifica  = makeNotificaController(repos.notifRepo);
  const energia   = makeEnergiaController(repos.energiaRepo);
  const regola    = makeRegolaController(repos.regolaRepo, eventBus);

  // ── Health ──────────────────────────────────────────────────────────────
  r.get('/health', (req, res) => res.json({ status: 'ok', ts: new Date() }));
  r.get('/tipi-dispositivo', (req, res) => res.json({
    tipi:  ['Illuminazione','Porta_Principale','Termostato','Tapparelle','Videosorveglianza','Altro'],
    icone: { Illuminazione:'💡', Porta_Principale:'🔒', Termostato:'🌡️', Tapparelle:'🪟', Videosorveglianza:'📷', Altro:'📺' },
  }));

  // ── Auth (RQ-01..RQ-08) ─────────────────────────────────────────────────
  r.post('/auth/register',           auth.register);
  r.post('/auth/login',              auth.login);
  r.get('/auth/me',                  authMiddleware, auth.me);
  r.patch('/auth/credenziali',       authMiddleware, auth.updateCredentials);
  r.delete('/auth/account',          authMiddleware, auth.deleteAccount);
  r.post('/auth/forgot-password',    auth.forgotPassword);
  r.post('/auth/reset-password',     auth.resetPassword);

  // ── Gruppi familiari (RQ-37, RQ-44) ────────────────────────────────────
  r.get('/gruppi',                   authMiddleware, gruppo.getMiei);
  r.post('/gruppi',                  authMiddleware, gruppo.crea);
  r.patch('/gruppi/:idGruppo/budget',authMiddleware, gruppo.aggiornaBudget);
  r.patch('/gruppi/:idGruppo/pin',   authMiddleware, gruppo.aggiornaPin);

  // ── Membri (RQ-41, RQ-42, RQ-43) ───────────────────────────────────────
  r.get('/gruppi/:idGruppo/membri',              authMiddleware, gruppo.getMembri);
  r.delete('/gruppi/:idGruppo/membri/:idMembro', authMiddleware, gruppo.rimuoviMembro);
  r.delete('/gruppi/:idGruppo/abbandona',        authMiddleware, gruppo.abbandonaGruppo);

  // ── Inviti (RQ-38, RQ-39) ───────────────────────────────────────────────
  r.post('/gruppi/:idGruppo/invita',             authMiddleware, gruppo.invita);
  r.get('/gruppi/:idGruppo/inviti/inviati',      authMiddleware, gruppo.getInvitiInviati);
  r.get('/inviti',                               authMiddleware, gruppo.getInvitiRicevuti);
  r.patch('/inviti/:idInvito/rispondi',          authMiddleware, gruppo.rispondiInvito);

  // ── Stanze (RQ-10) ──────────────────────────────────────────────────────
  r.get('/gruppi/:idGruppo/stanze',                       authMiddleware, stanza.getAll);
  r.post('/gruppi/:idGruppo/stanze',                      authMiddleware, stanza.crea);
  r.get('/gruppi/:idGruppo/stanze/:idStanza',             authMiddleware, stanza.getOne);
  r.patch('/gruppi/:idGruppo/stanze/:idStanza',           authMiddleware, stanza.aggiorna);
  r.delete('/gruppi/:idGruppo/stanze/:idStanza',          authMiddleware, stanza.elimina);

  // ── Dispositivi (RQ-14..RQ-17) ──────────────────────────────────────────
  r.get('/gruppi/:idGruppo/dispositivi',                        authMiddleware, device.getAll);
  r.post('/gruppi/:idGruppo/dispositivi',                       authMiddleware, device.aggiungi);
  r.get('/gruppi/:idGruppo/dispositivi/stats',                  authMiddleware, device.stats);
  r.get('/gruppi/:idGruppo/dispositivi/:idDispositivo',         authMiddleware, device.getOne);
  r.patch('/gruppi/:idGruppo/dispositivi/:idDispositivo',       authMiddleware, device.aggiorna);
  r.patch('/gruppi/:idGruppo/dispositivi/:idDispositivo/toggle',authMiddleware, device.toggle);
  r.delete('/gruppi/:idGruppo/dispositivi/:idDispositivo',      authMiddleware, device.rimuovi);
  r.get('/gruppi/:idGruppo/meteo-suggerimenti',                 authMiddleware, device.getMeteoSuggerimenti);

  // ── Scenari (RQ-27) ─────────────────────────────────────────────────────
  r.get('/gruppi/:idGruppo/scenari',                       authMiddleware, scenario.getAll);
  r.post('/gruppi/:idGruppo/scenari',                      authMiddleware, scenario.crea);
  r.post('/gruppi/:idGruppo/scenari/:idScenario/attiva',   authMiddleware, scenario.attiva);
  r.post('/gruppi/:idGruppo/scenari/:idScenario/disattiva',authMiddleware, scenario.disattiva);
  r.patch('/gruppi/:idGruppo/scenari/:idScenario',         authMiddleware, scenario.aggiorna);
  r.delete('/gruppi/:idGruppo/scenari/:idScenario',        authMiddleware, scenario.elimina);


  // ── Regole Automazione (RQ-33) ──────────────────────────────────────────
  r.get('/gruppi/:idGruppo/regole',                       authMiddleware, regola.getAll);
  r.post('/gruppi/:idGruppo/regole',                      authMiddleware, regola.crea);
  r.patch('/gruppi/:idGruppo/regole/:idRegola',           authMiddleware, regola.aggiorna);
  r.delete('/gruppi/:idGruppo/regole/:idRegola',          authMiddleware, regola.elimina);


  // ── Notifiche (RQ-20, RQ-30) ────────────────────────────────────────────
  r.get('/notifiche',                         authMiddleware, notifica.getAll);
  r.get('/notifiche/non-lette',               authMiddleware, notifica.getNonLette);
  r.patch('/notifiche/leggi-tutte',           authMiddleware, notifica.segnaLetteTutte);
  r.patch('/notifiche/:idNotifica/leggi',     authMiddleware, notifica.segnaLetta);
  r.delete('/notifiche/:idNotifica',          authMiddleware, notifica.elimina);

  // ── Energia / Report (RQ-22, RQ-23, RQ-31) ──────────────────────────────
  // ?periodo=oggi|settimana|mese|anno
  r.get('/gruppi/:idGruppo/energia/report',  authMiddleware, energia.getReport);
  r.get('/gruppi/:idGruppo/energia/storico', authMiddleware, energia.getStoricoAvvisi);

  return r;
}

module.exports = { createRouter };
