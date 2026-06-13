// ── Infrastructure – Dispositivo Repository (PostgreSQL) ──────────────────────
const { query, getClient } = require('../db/connection');

const TIPI_VALIDI = ['Illuminazione','Porta_Principale','Termostato','Tapparelle','Videosorveglianza','Altro','Sensore_Presenza'];

class DispositivoRepository {

  // ── Lista dispositivi del gruppo ──────────────────────────────────────────
  async getDispositiviGruppo(idGruppo) {
    const res = await query(
      `SELECT d.*, s.nome AS nome_stanza, s.icona AS icona_stanza
       FROM dispositivo d
       LEFT JOIN stanza s ON s.id_stanza = d.id_stanza
       WHERE d.id_gruppo = $1
       ORDER BY s.nome, d.nome`,
      [idGruppo]
    );
    // Arricchisce con dati specializzati
    const dispositivi = await Promise.all(res.rows.map(d => this._arricchisci(d)));
    return dispositivi;
  }

  // ── Singolo dispositivo ───────────────────────────────────────────────────
  async getById(idDispositivo) {
    const res = await query(
      `SELECT d.*, s.nome AS nome_stanza, s.icona AS icona_stanza, s.id_gruppo
       FROM dispositivo d
       LEFT JOIN stanza s ON s.id_stanza = d.id_stanza
       WHERE d.id_dispositivo = $1`,
      [idDispositivo]
    );
    if (res.rows.length === 0) throw new Error('Dispositivo non trovato');
    return this._arricchisci(res.rows[0]);
  }

  // ── Aggiungi dispositivo (RQ-14) ──────────────────────────────────────────
  async aggiungi(idGruppo, idUtente, { nome, tipodispositivo, idStanza, consumoWatt = 0, dettagli = {} }) {
    await this._checkAdmin(idGruppo, idUtente);

    if (!TIPI_VALIDI.includes(tipodispositivo))
      throw new Error(`Tipo non valido. Valori: ${TIPI_VALIDI.join(', ')}`);

    if (idStanza) {
      const stanzaRes = await query(
        'SELECT 1 FROM stanza WHERE id_stanza=$1 AND id_gruppo=$2',
        [idStanza, idGruppo]
      );
      if (stanzaRes.rows.length === 0) throw new Error('Stanza non trovata nel gruppo');
    }

    const client = await getClient();
    try {
      await client.query('BEGIN');

      const devRes = await client.query(
        `INSERT INTO dispositivo (nome, tipo_dispositivo, stato_attuale, consumo_watt, id_stanza, id_gruppo)
         VALUES ($1,$2,false,$3,$4,$5) RETURNING *`,
        [nome, tipodispositivo, consumoWatt, idStanza || null, idGruppo]
      );
      const dev = devRes.rows[0];

      // Inserisce specializzazione
      await this._inserisciSpecializzazione(client, dev.id_dispositivo, tipodispositivo, dettagli);

      await client.query('COMMIT');
      return this.getById(dev.id_dispositivo);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  // ── Toggle on/off (RQ-17) ─────────────────────────────────────────────────
  async toggle(idDispositivo, idUtente, idGruppo) {
    await this._checkMembroOAdmin(idGruppo, idUtente);
    const res = await query(
      `UPDATE dispositivo SET stato_attuale = NOT stato_attuale
       WHERE id_dispositivo = $1 RETURNING *`,
      [idDispositivo]
    );
    if (res.rows.length === 0) throw new Error('Dispositivo non trovato');

    // Registra consumo se acceso
    if (res.rows[0].stato_attuale) {
      await query(
        `INSERT INTO consumo_energetico (watt_consumati, id_dispositivo) VALUES ($1,$2)`,
        [res.rows[0].consumo_watt, idDispositivo]
      );
    }

    if (res.rows[0].tipo_dispositivo === 'Porta_Principale') {
      await query(
        `UPDATE porta_principale SET stato_serratura = $1 WHERE id_dispositivo = $2`,
        [res.rows[0].stato_attuale ? 'aperta' : 'chiusa', idDispositivo]
      );
    }

    // Rilevamento Intrusione (RQ-19, RQ-20)
    if (res.rows[0].tipo_dispositivo === 'Sensore_Presenza' && res.rows[0].stato_attuale) {
      const roomRes = await query(
        `SELECT nome FROM stanza WHERE id_stanza = $1`,
        [res.rows[0].id_stanza]
      );
      const roomName = roomRes.rows[0]?.nome || 'Casa';
      const devName = res.rows[0].nome;

      // Crea record avviso sicurezza
      const scadenza = new Date();
      scadenza.setFullYear(scadenza.getFullYear() + 1);
      const avvisoRes = await query(
        `INSERT INTO storico_avvisi_sicurezza (tipo_avviso, descrizione, data_scadenza, id_dispositivo)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        ['Rilevamento Intrusione', `Movimento sospetto in ${roomName} rilevato da ${devName}`, scadenza, idDispositivo]
      );
      const avviso = avvisoRes.rows[0];

      // Recupera tutti i membri del gruppo
      const membersRes = await query(
        `SELECT id_utente FROM appartenenza WHERE id_gruppo = $1`,
        [idGruppo]
      );

      // Crea notifica per ciascun membro
      for (const m of membersRes.rows) {
        await query(
          `INSERT INTO notifica (tipo, messaggio, id_utente, urgente, id_avviso)
           VALUES ($1, $2, $3, $4, $5)`,
          ['intrusion', `Allarme intrusione: rilevato movimento in ${roomName} da ${devName}.`, m.id_utente, true, avviso.id_avviso]
        );
      }
    }

    await this._valutaRegoleAutomazione(idGruppo, idDispositivo);
    return this.getById(idDispositivo);
  }


  // ── Aggiorna dispositivo ──────────────────────────────────────────────────
  async aggiorna(idDispositivo, idUtente, idGruppo, payload) {
    await this._checkAdmin(idGruppo, idUtente);

    const campi   = [];
    const valori  = [];
    let i = 1;

    if (payload.nome)        { campi.push(`nome=$${i++}`);         valori.push(payload.nome); }
    if (payload.consumoWatt !== undefined) { campi.push(`consumo_watt=$${i++}`); valori.push(payload.consumoWatt); }
    if (payload.idStanza !== undefined)    { campi.push(`id_stanza=$${i++}`);    valori.push(payload.idStanza); }
    if (payload.timerMinuti !== undefined) { campi.push(`timer_minuti=$${i++}`); valori.push(payload.timerMinuti); }
    if (payload.schedAttivo !== undefined) { campi.push(`sched_attivo=$${i++}`); valori.push(payload.schedAttivo); }
    if (payload.schedGiorni !== undefined) { campi.push(`sched_giorni=$${i++}`); valori.push(payload.schedGiorni); }
    if (payload.schedAccensione !== undefined) { campi.push(`sched_accensione=$${i++}`); valori.push(payload.schedAccensione); }
    if (payload.schedSpegnimento !== undefined) { campi.push(`sched_spegnimento=$${i++}`); valori.push(payload.schedSpegnimento); }

    if (campi.length > 0) {
      valori.push(idDispositivo);
      await query(`UPDATE dispositivo SET ${campi.join(',')} WHERE id_dispositivo=$${i}`, valori);
    }

    // Aggiorna specializzazione
    if (payload.dettagli) {
      const devRes = await query('SELECT tipo_dispositivo FROM dispositivo WHERE id_dispositivo=$1', [idDispositivo]);
      await this._aggiornaSpecializzazione(devRes.rows[0].tipo_dispositivo, idDispositivo, payload.dettagli);
    }

    await this._valutaRegoleAutomazione(idGruppo, idDispositivo);
    return this.getById(idDispositivo);
  }

  // ── Rimuovi dispositivo (RQ-15) ───────────────────────────────────────────
  async rimuovi(idDispositivo, idUtente, idGruppo) {
    await this._checkAdmin(idGruppo, idUtente);
    const res = await query(
      'DELETE FROM dispositivo WHERE id_dispositivo=$1 RETURNING id_dispositivo',
      [idDispositivo]
    );
    if (res.rows.length === 0) throw new Error('Dispositivo non trovato');
    return { success: true };
  }

  // ── Statistiche consumo del gruppo ────────────────────────────────────────
  async getStats(idGruppo) {
    const res = await query(
      `SELECT
         COUNT(d.id_dispositivo)                      AS totale,
         COUNT(d.id_dispositivo) FILTER (WHERE d.stato_attuale) AS attivi,
         COALESCE(SUM(d.consumo_watt) FILTER (WHERE d.stato_attuale), 0) AS consumo_attuale_w
       FROM dispositivo d
       LEFT JOIN stanza s ON s.id_stanza = d.id_stanza
       WHERE s.id_gruppo = $1`,
      [idGruppo]
    );
    const row = res.rows[0];
    return {
      totale:           parseInt(row.totale),
      attivi:           parseInt(row.attivi),
      consumoAttualeW:  parseFloat(row.consumo_attuale_w),
      consumoAttualeKW: (parseFloat(row.consumo_attuale_w) / 1000).toFixed(2),
    };
  }

  // ── Helpers privati ───────────────────────────────────────────────────────
  async _arricchisci(d) {
    let extra = {};
    try {
      switch (d.tipo_dispositivo) {
        case 'Termostato': {
          const r = await query('SELECT * FROM termostato WHERE id_dispositivo=$1', [d.id_dispositivo]);
          extra = r.rows[0] || {};
          break;
        }
        case 'Illuminazione': {
          const r = await query('SELECT * FROM illuminazione WHERE id_dispositivo=$1', [d.id_dispositivo]);
          extra = r.rows[0] || {};
          break;
        }
        case 'Videosorveglianza': {
          const r = await query('SELECT * FROM videosorveglianza WHERE id_dispositivo=$1', [d.id_dispositivo]);
          extra = r.rows[0] || {};
          break;
        }
        case 'Porta_Principale': {
          const r = await query('SELECT * FROM porta_principale WHERE id_dispositivo=$1', [d.id_dispositivo]);
          extra = r.rows[0] || {};
          break;
        }
        case 'Tapparelle': {
          const r = await query('SELECT * FROM tapparelle WHERE id_dispositivo=$1', [d.id_dispositivo]);
          extra = r.rows[0] || {};
          break;
        }
      }
    } catch (_) {}
    const { id_dispositivo: _, ...extraClean } = extra;
    return { ...d, dettagli: extraClean };
  }

  async _inserisciSpecializzazione(client, idDev, tipo, det) {
    switch (tipo) {
      case 'Termostato':
        await client.query(
          `INSERT INTO termostato (id_dispositivo, temperatura_impostata, temperatura_rilevata, modalita)
           VALUES ($1,$2,$3,$4) ON CONFLICT DO NOTHING`,
          [idDev, det.temperaturaImpostata||20, det.temperaturaRilevata||20, det.modalita||'riscaldamento']
        );
        break;
      case 'Illuminazione':
        await client.query(
          `INSERT INTO illuminazione (id_dispositivo, intensita, colore_rgb)
           VALUES ($1,$2,$3) ON CONFLICT DO NOTHING`,
          [idDev, det.intensita||100, det.coloreRgb||'#FFFFFF']
        );
        break;
      case 'Videosorveglianza':
        await client.query(
          `INSERT INTO videosorveglianza (id_dispositivo, registrazione_attiva, risoluzione)
           VALUES ($1,$2,$3) ON CONFLICT DO NOTHING`,
          [idDev, det.registrazioneAttiva!==false, det.risoluzione||'1080p']
        );
        break;
      case 'Porta_Principale':
        await client.query(
          `INSERT INTO porta_principale (id_dispositivo, stato_serratura)
           VALUES ($1,$2) ON CONFLICT DO NOTHING`,
          [idDev, det.statoSerratura||'chiusa']
        );
        break;
      case 'Tapparelle':
        await client.query(
          `INSERT INTO tapparelle (id_dispositivo, percentuale_apertura)
           VALUES ($1,$2) ON CONFLICT DO NOTHING`,
          [idDev, det.percentualeApertura||0]
        );
        break;
    }
  }

  async _aggiornaSpecializzazione(tipo, idDev, det) {
    switch (tipo) {
      case 'Termostato':
        if (det.temperaturaImpostata !== undefined)
          await query('UPDATE termostato SET temperatura_impostata=$1 WHERE id_dispositivo=$2', [det.temperaturaImpostata, idDev]);
        if (det.temperaturaRilevata !== undefined)
          await query('UPDATE termostato SET temperatura_rilevata=$1 WHERE id_dispositivo=$2', [det.temperaturaRilevata, idDev]);
        break;
      case 'Illuminazione':
        if (det.intensita !== undefined)
          await query('UPDATE illuminazione SET intensita=$1 WHERE id_dispositivo=$2', [det.intensita, idDev]);
        if (det.coloreRgb)
          await query('UPDATE illuminazione SET colore_rgb=$1 WHERE id_dispositivo=$2', [det.coloreRgb, idDev]);
        break;
      case 'Tapparelle':
        if (det.percentualeApertura !== undefined)
          await query('UPDATE tapparelle SET percentuale_apertura=$1 WHERE id_dispositivo=$2', [det.percentualeApertura, idDev]);
        break;
      case 'Porta_Principale':
        if (det.statoSerratura)
          await query('UPDATE porta_principale SET stato_serratura=$1 WHERE id_dispositivo=$2', [det.statoSerratura, idDev]);
        break;
    }
  }

  async _checkAdmin(idGruppo, idUtente) {
    const res = await query(
      'SELECT ruolo FROM appartenenza WHERE id_utente=$1 AND id_gruppo=$2',
      [idUtente, idGruppo]
    );
    if (res.rows.length === 0) throw new Error('Non sei membro di questo gruppo');
    if (res.rows[0].ruolo !== 'Amministratore') throw new Error('Operazione riservata all\'amministratore');
  }

  async _checkMembroOAdmin(idGruppo, idUtente) {
    const res = await query(
      'SELECT 1 FROM appartenenza WHERE id_utente=$1 AND id_gruppo=$2',
      [idUtente, idGruppo]
    );
    if (res.rows.length === 0) throw new Error('Non sei membro di questo gruppo');
  }

  async _valutaRegoleAutomazione(idGruppo, idDispositivoSensore) {
    try {
      const rulesRes = await query(
        `SELECT 
           s.id_scenario AS id_regola,
           s.nome_scenario AS nome_regola,
           s.id_dispositivo_sensore,
           s.condizione,
           s.valore_soglia,
           s.is_active AS attiva,
           s.valore_precedente,
           s.id_gruppo,
           s.created_at,
           a.id_dispositivo AS id_dispositivo_attuatore,
           a.azione_richiesta AS azione,
           a.valore_impostato AS valore_azione
         FROM scenario s
         JOIN azione_scenario a ON a.id_scenario = s.id_scenario
         WHERE s.id_gruppo = $1 
           AND s.id_dispositivo_sensore = $2 
           AND s.trigger_type = 'automatico' 
           AND s.is_active = true`,
        [idGruppo, idDispositivoSensore]
      );
      
      if (rulesRes.rows.length === 0) return;

      const sensore = await this.getById(idDispositivoSensore);

      for (const r of rulesRes.rows) {
        let targetTriggered = false;
        
        if (r.condizione === '<' || r.condizione === '>') {
          const rilevata = parseFloat(sensore.dettagli?.temperatura_rilevata);
          const soglia = parseFloat(r.valore_soglia);
          
          if (!isNaN(rilevata) && !isNaN(soglia)) {
            if (r.condizione === '<' && rilevata < soglia) targetTriggered = true;
            if (r.condizione === '>' && rilevata > soglia) targetTriggered = true;
          }
        } else if (r.condizione === 'motion') {
          if (sensore.stato_attuale) targetTriggered = true;
        } else if (r.condizione === '=') {
          const valStr = String(r.valore_soglia).toLowerCase();
          if (valStr === 'on' || valStr === 'true') {
            if (sensore.stato_attuale) targetTriggered = true;
          } else {
            if (!sensore.stato_attuale) targetTriggered = true;
          }
        }

        if (targetTriggered) {
          const attuatore = await this.getById(r.id_dispositivo_attuatore);
          
          // Se la regola non è già attiva (valore_precedente è null/falsy), salviamo lo stato attuale prima di applicare l'azione
          if (!r.valore_precedente) {
            const savedState = {
              stato_attuale: attuatore.stato_attuale,
              dettagli: attuatore.dettagli
            };
            await query(
              'UPDATE scenario SET valore_precedente = $1 WHERE id_scenario = $2',
              [JSON.stringify(savedState), r.id_regola]
            );
          }

          if (r.azione === 'accendi') {
            if (!attuatore.stato_attuale) {
              await query('UPDATE dispositivo SET stato_attuale = true WHERE id_dispositivo = $1', [r.id_dispositivo_attuatore]);
              await query('INSERT INTO consumo_energetico (watt_consumati, id_dispositivo) VALUES ($1,$2)', [attuatore.consumo_watt || 0, r.id_dispositivo_attuatore]);
            }
            if (attuatore.tipo_dispositivo === 'Porta_Principale') {
              await query('UPDATE porta_principale SET stato_serratura = $1 WHERE id_dispositivo = $2', ['aperta', r.id_dispositivo_attuatore]);
            }
          } else if (r.azione === 'spegni') {
            if (attuatore.stato_attuale) {
              await query('UPDATE dispositivo SET stato_attuale = false WHERE id_dispositivo = $1', [r.id_dispositivo_attuatore]);
            }
            if (attuatore.tipo_dispositivo === 'Porta_Principale') {
              await query('UPDATE porta_principale SET stato_serratura = $1 WHERE id_dispositivo = $2', ['chiusa', r.id_dispositivo_attuatore]);
            }
          } else if (r.azione === 'regola') {
            if (!attuatore.stato_attuale) {
              await query('UPDATE dispositivo SET stato_attuale = true WHERE id_dispositivo = $1', [r.id_dispositivo_attuatore]);
            }
            const val = r.valore_azione;
            if (attuatore.tipo_dispositivo === 'Illuminazione') {
              await query('UPDATE illuminazione SET intensita=$1 WHERE id_dispositivo=$2', [parseInt(val) || 100, r.id_dispositivo_attuatore]);
            } else if (attuatore.tipo_dispositivo === 'Tapparelle') {
              await query('UPDATE tapparelle SET percentuale_apertura=$1 WHERE id_dispositivo=$2', [parseInt(val) || 0, r.id_dispositivo_attuatore]);
            } else if (attuatore.tipo_dispositivo === 'Termostato') {
              await query('UPDATE termostato SET temperatura_impostata=$1 WHERE id_dispositivo=$2', [parseFloat(val) || 20, r.id_dispositivo_attuatore]);
            } else if (attuatore.tipo_dispositivo === 'Porta_Principale') {
              await query('UPDATE porta_principale SET stato_serratura=$1 WHERE id_dispositivo=$2', [val || 'chiusa', r.id_dispositivo_attuatore]);
            }
          }
        } else {
          // La condizione non è più verificata.
          // Se la regola era precedentemente attiva (valore_precedente non è null/falsy), ripristiniamo lo stato iniziale.
          if (r.valore_precedente) {
            const savedState = JSON.parse(r.valore_precedente);
            const attuatore = await this.getById(r.id_dispositivo_attuatore);
            
            // 1. Ripristina stato_attuale nel dispositivo base
            await query('UPDATE dispositivo SET stato_attuale = $1 WHERE id_dispositivo = $2', [savedState.stato_attuale, r.id_dispositivo_attuatore]);
            
            // Se si accende e prima era spento, registra consumo
            if (savedState.stato_attuale && !attuatore.stato_attuale) {
              await query('INSERT INTO consumo_energetico (watt_consumati, id_dispositivo) VALUES ($1,$2)', [attuatore.consumo_watt || 0, r.id_dispositivo_attuatore]);
            }
            
            // 2. Ripristina specializzazione convertendo snake_case a camelCase per _aggiornaSpecializzazione
            const mappedDetails = {};
            if (savedState.dettagli) {
              if (savedState.dettagli.temperatura_impostata !== undefined) {
                mappedDetails.temperaturaImpostata = savedState.dettagli.temperatura_impostata;
              }
              if (savedState.dettagli.temperatura_rilevata !== undefined) {
                mappedDetails.temperaturaRilevata = savedState.dettagli.temperatura_rilevata;
              }
              if (savedState.dettagli.intensita !== undefined) {
                mappedDetails.intensita = savedState.dettagli.intensita;
              }
              if (savedState.dettagli.colore_rgb !== undefined) {
                mappedDetails.coloreRgb = savedState.dettagli.colore_rgb;
              }
              if (savedState.dettagli.percentuale_apertura !== undefined) {
                mappedDetails.percentualeApertura = savedState.dettagli.percentuale_apertura;
              }
              if (savedState.dettagli.stato_serratura !== undefined) {
                mappedDetails.statoSerratura = savedState.dettagli.stato_serratura;
              }
              if (savedState.dettagli.registrazione_attiva !== undefined) {
                mappedDetails.registrazioneAttiva = savedState.dettagli.registrazione_attiva;
              }
              if (savedState.dettagli.risoluzione !== undefined) {
                mappedDetails.risoluzione = savedState.dettagli.risoluzione;
              }
            }
            
            await this._aggiornaSpecializzazione(attuatore.tipo_dispositivo, r.id_dispositivo_attuatore, mappedDetails);
            
            // 3. Resetta valore_precedente in scenario
            await query('UPDATE scenario SET valore_precedente = NULL WHERE id_scenario = $1', [r.id_regola]);
          }
        }
      }
    } catch (e) {
      console.error('[Automation] Error evaluating rules:', e.message);
    }
  }
}

module.exports = { DispositivoRepository };
