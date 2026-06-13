const jwt = require('jsonwebtoken');
const { getMeteoAttuale } = require('../../infrastructure/services/MeteoService');


function sign(user) {
  return jwt.sign(
    { sub: user.id || user.id_utente, email: user.email },
    process.env.JWT_SECRET || 'dev_secret',
    { expiresIn: '7d' }
  );
}

// ── Auth ──────────────────────────────────────────────────────────────────────
function makeAuthController(authRepo) {
  return {
    async register(req, res, next) {
      try {
        const result = await authRepo.register(req.body);
        const token  = sign({ id: result.user.id_utente, email: result.user.email });
        res.status(201).json({ token, user: result.user, idGruppo: result.idGruppo });
      } catch (e) { e.status = 400; next(e); }
    },

    async login(req, res, next) {
      try {
        const user  = await authRepo.login(req.body);
        const token = sign(user);
        res.json({ token, user });
      } catch (e) { e.status = 401; next(e); }
    },

    async me(req, res, next) {
      try { res.json(await authRepo.getProfile(req.user.id)); }
      catch (e) { next(e); }
    },

    async updateCredentials(req, res, next) {
      try { res.json(await authRepo.updateCredentials(req.user.id, req.body)); }
      catch (e) { e.status = 400; next(e); }
    },

    async deleteAccount(req, res, next) {
      try {
        await authRepo.deleteAccount(req.user.id, req.body.password);
        res.status(204).send();
      } catch (e) { next(e); }
    },

    async forgotPassword(req, res, next) {
      try {
        const result = await authRepo.generateResetCode(req.body.email);
        res.json(result);
      } catch (e) { e.status = 400; next(e); }
    },

    async resetPassword(req, res, next) {
      try {
        const result = await authRepo.resetPassword(req.body);
        res.json(result);
      } catch (e) { e.status = 400; next(e); }
    },
  };
}

// ── Gruppo Familiare ──────────────────────────────────────────────────────────
function makeGruppoController(gruppoRepo, notifRepo, eventBus) {
  return {
    async getMiei(req, res, next) {
      try { res.json(await gruppoRepo.getGruppiUtente(req.user.id)); }
      catch (e) { next(e); }
    },

    async crea(req, res, next) {
      try { res.status(201).json(await gruppoRepo.creaGruppo(req.user.id, req.body)); }
      catch (e) { e.status = 400; next(e); }
    },

    async aggiornaBudget(req, res, next) {
      try {
        const r = await gruppoRepo.aggiornaBudget(req.params.idGruppo, req.user.id, req.body.budget);
        res.json(r);
      } catch (e) { next(e); }
    },

    async aggiornaPin(req, res, next) {
      try {
        const r = await gruppoRepo.aggiornaPinSblocco(req.params.idGruppo, req.user.id, req.body.pin);
        res.json(r);
      } catch (e) { next(e); }
    },

    async getMembri(req, res, next) {
      try { res.json(await gruppoRepo.getMembri(req.params.idGruppo, req.user.id)); }
      catch (e) { next(e); }
    },

    async invita(req, res, next) {
      try {
        const inv = await gruppoRepo.invitaUtente(req.params.idGruppo, req.user.id, req.body.email);
        eventBus.publish('INVITO_INVIATO', { ...inv, idGruppo: parseInt(req.params.idGruppo) });
        res.status(201).json(inv);
      } catch (e) { e.status = 400; next(e); }
    },

    async getInvitiInviati(req, res, next) {
      try { res.json(await gruppoRepo.getInvitiInviati(req.params.idGruppo, req.user.id)); }
      catch (e) { next(e); }
    },

    async getInvitiRicevuti(req, res, next) {
      try { res.json(await gruppoRepo.getInvitiRicevuti(req.user.id)); }
      catch (e) { next(e); }
    },

    async rispondiInvito(req, res, next) {
      try {
        const r = await gruppoRepo.rispondiInvito(req.params.idInvito, req.user.id, req.body.accetta);
        if (r.stato === 'accettato')
          eventBus.publish('MEMBRO_AGGIUNTO', { idGruppo: r.idGruppo, idUtente: req.user.id });
        res.json(r);
      } catch (e) { next(e); }
    },

    async rimuoviMembro(req, res, next) {
      try {
        await gruppoRepo.rimuoviMembro(req.params.idGruppo, req.user.id, parseInt(req.params.idMembro));
        eventBus.publish('MEMBRO_RIMOSSO', { idGruppo: parseInt(req.params.idGruppo), idMembro: parseInt(req.params.idMembro) });
        res.status(204).send();
      } catch (e) { next(e); }
    },

    async abbandonaGruppo(req, res, next) {
      try {
        await gruppoRepo.abbandonaGruppo(req.params.idGruppo, req.user.id);
        res.status(204).send();
      } catch (e) { next(e); }
    },
  };
}

// ── Dispositivo ───────────────────────────────────────────────────────────────
function makeDispositivoController(devRepo, eventBus) {
  return {
    async getAll(req, res, next) {
      try { res.json(await devRepo.getDispositiviGruppo(req.params.idGruppo)); }
      catch (e) { next(e); }
    },

    async getOne(req, res, next) {
      try { res.json(await devRepo.getById(req.params.idDispositivo)); }
      catch (e) { e.status = 404; next(e); }
    },

    async aggiungi(req, res, next) {
      try {
        const d = await devRepo.aggiungi(req.params.idGruppo, req.user.id, req.body);
        eventBus.publish('DEVICE_ADDED', { ...d, idGruppo: parseInt(req.params.idGruppo) });
        res.status(201).json(d);
      } catch (e) { e.status = 400; next(e); }
    },

    async toggle(req, res, next) {
      try {
        const d = await devRepo.toggle(req.params.idDispositivo, req.user.id, req.params.idGruppo);
        eventBus.publish('DEVICE_TOGGLED', { ...d, idGruppo: parseInt(req.params.idGruppo) });
        if (d.tipo_dispositivo === 'Sensore_Presenza' && d.stato_attuale) {
          eventBus.publish('NOTIFICATION_NEW', { idGruppo: parseInt(req.params.idGruppo) });
        }
        res.json(d);
      } catch (e) { next(e); }
    },


    async aggiorna(req, res, next) {
      try {
        const d = await devRepo.aggiorna(req.params.idDispositivo, req.user.id, req.params.idGruppo, req.body);
        eventBus.publish('DEVICE_UPDATED', { ...d, idGruppo: parseInt(req.params.idGruppo) });
        res.json(d);
      } catch (e) { next(e); }
    },

    async rimuovi(req, res, next) {
      try {
        await devRepo.rimuovi(req.params.idDispositivo, req.user.id, req.params.idGruppo);
        eventBus.publish('DEVICE_DELETED', { idDispositivo: parseInt(req.params.idDispositivo), idGruppo: parseInt(req.params.idGruppo) });
        res.status(204).send();
      } catch (e) { next(e); }
    },

    async stats(req, res, next) {
      try { res.json(await devRepo.getStats(req.params.idGruppo)); }
      catch (e) { next(e); }
    },

    async getMeteoSuggerimenti(req, res, next) {
      try {
        const meteo = await getMeteoAttuale();
        const dispositivi = await devRepo.getDispositiviGruppo(req.params.idGruppo);
        const suggerimenti = [];

        for (const d of dispositivi) {
          // Salta i dispositivi non assegnati ad alcuna stanza
          if (d.id_stanza === null || d.id_stanza === undefined) {
            continue;
          }

          // 1. Caldo Rilevato: Temp > 28°C -> Accendi Climatizzatore / Termostato (se spento)
          if (meteo.temperatura > 28) {
            if (d.tipo_dispositivo === 'Termostato' && !d.stato_attuale) {
              const isCooling = d.dettagli?.modalita === 'raffreddamento' || d.nome.toLowerCase().includes('clima') || d.nome.toLowerCase().includes('condizionatore');
              if (isCooling) {
                suggerimenti.push({
                  id: `sug_clima_${d.id_dispositivo}`,
                  titolo: 'Caldo rilevato 🥵',
                  messaggio: `Fuori ci sono ${meteo.temperatura}°C. Ti consigliamo di accendere il climatizzatore "${d.nome}" per rinfrescare l'ambiente.`,
                  azione: 'accendi',
                  tipo: d.tipo_dispositivo,
                  id_dispositivo: d.id_dispositivo
                });
              }
            }
          }

          // 2. Freddo Rilevato: Temp < 14°C -> Accendi Riscaldamento / Termostato (se spento)
          if (meteo.temperatura < 14) {
            if (d.tipo_dispositivo === 'Termostato' && !d.stato_attuale) {
              const isHeating = d.dettagli?.modalita === 'riscaldamento' || d.nome.toLowerCase().includes('riscaldamento') || d.nome.toLowerCase().includes('termostato');
              if (isHeating) {
                suggerimenti.push({
                  id: `sug_risc_${d.id_dispositivo}`,
                  titolo: 'Freddo rilevato 🥶',
                  messaggio: `Fuori ci sono ${meteo.temperatura}°C. Ti consigliamo di accendere il riscaldamento "${d.nome}" per scaldare la stanza.`,
                  azione: 'accendi',
                  tipo: d.tipo_dispositivo,
                  id_dispositivo: d.id_dispositivo
                });
              }
            }
          }

          // 3. Pioggia in corso: Weather Code >= 51 (drizzle, rain, thunderstorm) -> Chiudi Tapparelle (se aperte)
          if (meteo.weatherCode >= 51) {
            if (d.tipo_dispositivo === 'Tapparelle' && d.dettagli?.percentuale_apertura > 0) {
              suggerimenti.push({
                id: `sug_tappa_rain_${d.id_dispositivo}`,
                titolo: 'Pioggia rilevata 🌧️',
                messaggio: `Sta piovendo. Ti consigliamo di abbassare la tapparella "${d.nome}" al 0% per proteggere gli infissi.`,
                azione: 'regola',
                valore: 0,
                tipo: d.tipo_dispositivo,
                id_dispositivo: d.id_dispositivo
              });
            }
          }

          // 4. Soleggiato / Bella giornata: Clear sky (0) e Temp tra 18°C e 25°C -> Apri Tapparelle (se chiuse)
          if (meteo.weatherCode === 0 && meteo.temperatura >= 18 && meteo.temperatura <= 26) {
            if (d.tipo_dispositivo === 'Tapparelle' && d.dettagli?.percentuale_apertura < 80) {
              suggerimenti.push({
                id: `sug_tappa_sun_${d.id_dispositivo}`,
                titolo: 'Bella giornata ☀️',
                messaggio: `Il cielo è sereno e ci sono ${meteo.temperatura}°C. Ti consigliamo di aprire la tapparella "${d.nome}" al 100% per far entrare luce naturale.`,
                azione: 'regola',
                valore: 100,
                tipo: d.tipo_dispositivo,
                id_dispositivo: d.id_dispositivo
              });
            }
          }
        }

        res.json({
          meteo,
          suggerimenti
        });
      } catch (e) {
        next(e);
      }
    },
  };
}

// ── Stanza ────────────────────────────────────────────────────────────────────
function makeStanzaController(stanzaRepo) {
  return {
    async getAll(req, res, next) {
      try { res.json(await stanzaRepo.getStanzeGruppo(req.params.idGruppo)); }
      catch (e) { next(e); }
    },
    async getOne(req, res, next) {
      try { res.json(await stanzaRepo.getStanzaConDispositivi(req.params.idStanza, req.params.idGruppo)); }
      catch (e) { e.status = 404; next(e); }
    },
    async crea(req, res, next) {
      try { res.status(201).json(await stanzaRepo.creaStanza(req.params.idGruppo, req.user.id, req.body)); }
      catch (e) { e.status = 400; next(e); }
    },
    async aggiorna(req, res, next) {
      try { res.json(await stanzaRepo.aggiornaStanza(req.params.idStanza, req.params.idGruppo, req.user.id, req.body)); }
      catch (e) { next(e); }
    },
    async elimina(req, res, next) {
      try { await stanzaRepo.eliminaStanza(req.params.idStanza, req.params.idGruppo, req.user.id); res.status(204).send(); }
      catch (e) { next(e); }
    },
  };
}

// ── Scenario ──────────────────────────────────────────────────────────────────
function makeScenarioController(scenarioRepo, eventBus) {
  return {
    async getAll(req, res, next) {
      try { res.json(await scenarioRepo.getScenariGruppo(req.params.idGruppo)); }
      catch (e) { next(e); }
    },
    async crea(req, res, next) {
      try { res.status(201).json(await scenarioRepo.creaScenario(req.params.idGruppo, req.user.id, req.body)); }
      catch (e) { e.status = 400; next(e); }
    },
    async attiva(req, res, next) {
      try {
        const s = await scenarioRepo.attivaScenario(req.params.idScenario, req.params.idGruppo, req.user.id);
        eventBus.publish('SCENARIO_ACTIVATED', { ...s, idGruppo: parseInt(req.params.idGruppo) });
        res.json(s);
      } catch (e) { next(e); }
    },
    async disattiva(req, res, next) {
      try {
        const s = await scenarioRepo.disattivaScenario(req.params.idScenario, req.params.idGruppo, req.user.id);
        eventBus.publish('SCENARIO_DEACTIVATED', { ...s, idGruppo: parseInt(req.params.idGruppo) });
        res.json(s);
      } catch (e) { next(e); }
    },
    async aggiorna(req, res, next) {
      try {
        const s = await scenarioRepo.aggiornaScenario(req.params.idScenario, req.params.idGruppo, req.user.id, req.body);
        eventBus.publish('SCENARIO_UPDATED', { ...s, idGruppo: parseInt(req.params.idGruppo) });
        res.json(s);
      } catch (e) { next(e); }
    },
    async elimina(req, res, next) {
      try { await scenarioRepo.eliminaScenario(req.params.idScenario, req.params.idGruppo, req.user.id); res.status(204).send(); }
      catch (e) { next(e); }
    },

  };
}

// ── Notifica ──────────────────────────────────────────────────────────────────
function makeNotificaController(notifRepo) {
  return {
    async getAll(req, res, next) {
      try { res.json(await notifRepo.getNotifiche(req.user.id)); }
      catch (e) { next(e); }
    },
    async getNonLette(req, res, next) {
      try { res.json(await notifRepo.getNonLette(req.user.id)); }
      catch (e) { next(e); }
    },
    async segnaLetta(req, res, next) {
      try { await notifRepo.segnaLetta(req.params.idNotifica, req.user.id); res.status(204).send(); }
      catch (e) { next(e); }
    },
    async segnaLetteTutte(req, res, next) {
      try { await notifRepo.segnaLetteTutte(req.user.id); res.status(204).send(); }
      catch (e) { next(e); }
    },
    async elimina(req, res, next) {
      try { await notifRepo.elimina(req.params.idNotifica, req.user.id); res.status(204).send(); }
      catch (e) { next(e); }
    },
  };
}

// ── Energia ───────────────────────────────────────────────────────────────────
function makeEnergiaController(energiaRepo) {
  return {
    async getReport(req, res, next) {
      try { res.json(await energiaRepo.getReport(req.params.idGruppo, req.query.periodo || 'settimana')); }
      catch (e) { e.status = 400; next(e); }
    },
    async getStoricoAvvisi(req, res, next) {
      try { res.json(await energiaRepo.getStoricoAvvisi(req.params.idGruppo)); }
      catch (e) { next(e); }
    },
  };
}

// ── Regola Automazione Controller ─────────────────────────────────────────────
function makeRegolaController(regolaRepo, eventBus) {
  return {
    async getAll(req, res, next) {
      try { res.json(await regolaRepo.getRegoleGruppo(req.params.idGruppo)); }
      catch (e) { next(e); }
    },
    async crea(req, res, next) {
      try {
        const r = await regolaRepo.creaRegola(req.params.idGruppo, req.user.id, req.body);
        eventBus.publish('REGOLA_UPDATED', { idGruppo: parseInt(req.params.idGruppo) });
        res.status(201).json(r);
      } catch (e) { e.status = 400; next(e); }
    },
    async aggiorna(req, res, next) {
      try {
        const r = await regolaRepo.aggiornaRegola(req.params.idRegola, req.params.idGruppo, req.user.id, req.body);
        eventBus.publish('REGOLA_UPDATED', { idGruppo: parseInt(req.params.idGruppo) });
        res.json(r);
      } catch (e) { next(e); }
    },
    async elimina(req, res, next) {
      try {
        await regolaRepo.eliminaRegola(req.params.idRegola, req.params.idGruppo, req.user.id);
        eventBus.publish('REGOLA_UPDATED', { idGruppo: parseInt(req.params.idGruppo) });
        res.status(204).send();
      } catch (e) { next(e); }
    },
  };
}

module.exports = {
  makeAuthController,
  makeGruppoController,
  makeDispositivoController,
  makeStanzaController,
  makeScenarioController,
  makeNotificaController,
  makeEnergiaController,
  makeRegolaController,
};
