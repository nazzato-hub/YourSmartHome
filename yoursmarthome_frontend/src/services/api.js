const BASE_URL = 'http://172.20.10.4:3000/api';

const state = { token: null, idGruppo: null };

function setToken(t) { state.token = t; }
function setGruppo(id) { state.idGruppo = id; }
function getToken() { return state.token; }
function getGruppo() { return state.idGruppo; }

async function req(method, path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(state.token ? { Authorization: 'Bearer ' + state.token } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!res.ok) {
    const err = await res.json().catch(function () { return {}; });
    throw new Error(err.error || 'Errore HTTP ' + res.status);
  }
  if (res.status === 204) return null;
  return res.json();
}

function g() { return '/gruppi/' + state.idGruppo; }

const api = {
  login: function (b) { return req('POST', '/auth/login', b); },
  register: function (b) { return req('POST', '/auth/register', b); },
  me: function () { return req('GET', '/auth/me'); },

  getGruppi: function () { return req('GET', '/gruppi'); },

  getDevices: function () { return req('GET', g() + '/dispositivi'); },
  getStats: function () { return req('GET', g() + '/dispositivi/stats'); },
  toggleDevice: function (id) { return req('PATCH', g() + '/dispositivi/' + id + '/toggle'); },
  addDevice: function (b) { return req('POST', g() + '/dispositivi', b); },
  updateDevice: function (id, b) { return req('PATCH', g() + '/dispositivi/' + id, b); },
  deleteDevice: function (id) { return req('DELETE', g() + '/dispositivi/' + id); },

  getRooms: function () { return req('GET', g() + '/stanze'); },
  getRoom: function (id) { return req('GET', g() + '/stanze/' + id); },
  addRoom: function (b) { return req('POST', g() + '/stanze', b); },

  getScenarios: function () { return req('GET', g() + '/scenari'); },
  addScenario: function (b) { return req('POST', g() + '/scenari', b); },
  activateScene: function (id) { return req('POST', g() + '/scenari/' + id + '/attiva'); },
  deactivateScene: function (id) { return req('POST', g() + '/scenari/' + id + '/disattiva'); },
  updateScenario: function (id, b) { return req('PATCH', g() + '/scenari/' + id, b); },
  deleteScenario: function (id) { return req('DELETE', g() + '/scenari/' + id); },
  getRegole: function () { return req('GET', g() + '/regole'); },
  addRegola: function (b) { return req('POST', g() + '/regole', b); },
  updateRegola: function (id, b) { return req('PATCH', g() + '/regole/' + id, b); },
  deleteRegola: function (id) { return req('DELETE', g() + '/regole/' + id); },

  getNotifs: function () { return req('GET', '/notifiche'); },
  markAllRead: function () { return req('PATCH', '/notifiche/leggi-tutte'); },
  markRead: function (id) { return req('PATCH', '/notifiche/' + id + '/leggi'); },

  getMembri: function () { return req('GET', g() + '/membri'); },
  deleteMembro: function (id) { return req('DELETE', g() + '/membri/' + id); },
  invita: function (email) { return req('POST', g() + '/invita', { email: email }); },
  getInvitiInviati: function () { return req('GET', g() + '/inviti/inviati'); },
  getInviti: function () { return req('GET', '/inviti'); },
  rispondiInvito: function (id, a) { return req('PATCH', '/inviti/' + id + '/rispondi', { accetta: a }); },

  getReport: function (p) { return req('GET', g() + '/energia/report?periodo=' + (p || 'settimana')); },
  getStoricoAvvisi: function () { return req('GET', g() + '/energia/storico'); },
  getMeteoSuggerimenti: function () { return req('GET', g() + '/meteo-suggerimenti'); },


  updateCredentials: function (b) { return req('PATCH', '/auth/credenziali', b); },
  deleteAccount: function (b) { return req('DELETE', '/auth/account', b); },

  creaGruppo: function (b) { return req('POST', '/gruppi', b); },
  aggiornaBudget: function (b) { return req('PATCH', g() + '/budget', b); },
  aggiornaPin: function (pin) { return req('PATCH', g() + '/pin', { pin: pin }); },
  abbandonaGruppo: function () { return req('DELETE', g() + '/abbandona'); },
  forgotPassword: function (email) { return req('POST', '/auth/forgot-password', { email: email }); },
  resetPassword: function (email, code, newPassword) { return req('POST', '/auth/reset-password', { email: email, code: code, newPassword: newPassword }); },
};

export { api, setToken, setGruppo, getToken, getGruppo };