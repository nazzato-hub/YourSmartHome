// ── Infrastructure – Stanza / Scenario / Notifica / Energia Repository ────────
const { query, getClient } = require('../db/connection');

// ── Stanza ────────────────────────────────────────────────────────────────────
class StanzaRepository {
  async getStanzeGruppo(idGruppo) {
    const res = await query(
      `SELECT s.*,
         COUNT(d.id_dispositivo) AS totale_dispositivi,
         COUNT(d.id_dispositivo) FILTER (WHERE d.stato_attuale) AS dispositivi_attivi
       FROM stanza s
       LEFT JOIN dispositivo d ON d.id_stanza = s.id_stanza
       WHERE s.id_gruppo = $1
       GROUP BY s.id_stanza
       ORDER BY s.nome`,
      [idGruppo]
    );
    return res.rows;
  }

  async getStanzaConDispositivi(idStanza, idGruppo) {
    const stRes = await query(
      'SELECT * FROM stanza WHERE id_stanza=$1 AND id_gruppo=$2',
      [idStanza, idGruppo]
    );
    if (stRes.rows.length === 0) throw new Error('Stanza non trovata');

    const devRes = await query(
      'SELECT * FROM dispositivo WHERE id_stanza=$1 ORDER BY nome',
      [idStanza]
    );
    return { ...stRes.rows[0], dispositivi: devRes.rows };
  }

  async creaStanza(idGruppo, idUtente, { nome, icona = '🏠' }) {
    await this._checkAdmin(idGruppo, idUtente);
    if (!nome) throw new Error('nome è obbligatorio');
    const res = await query(
      `INSERT INTO stanza (nome, icona, id_gruppo) VALUES ($1,$2,$3) RETURNING *`,
      [nome, icona, idGruppo]
    );
    return res.rows[0];
  }

  async aggiornaStanza(idStanza, idGruppo, idUtente, payload) {
    await this._checkAdmin(idGruppo, idUtente);
    const campi = [];
    const vals  = [];
    let i = 1;
    if (payload.nome)  { campi.push(`nome=$${i++}`);  vals.push(payload.nome); }
    if (payload.icona) { campi.push(`icona=$${i++}`); vals.push(payload.icona); }
    if (campi.length === 0) throw new Error('Nessun campo da aggiornare');
    vals.push(idStanza);
    const res = await query(
      `UPDATE stanza SET ${campi.join(',')} WHERE id_stanza=$${i} AND id_gruppo=${idGruppo} RETURNING *`,
      vals
    );
    return res.rows[0];
  }

  async eliminaStanza(idStanza, idGruppo, idUtente) {
    await this._checkAdmin(idGruppo, idUtente);
    await query('DELETE FROM stanza WHERE id_stanza=$1 AND id_gruppo=$2', [idStanza, idGruppo]);
    return { success: true };
  }

  async _checkAdmin(idGruppo, idUtente) {
    const res = await query(
      'SELECT ruolo FROM appartenenza WHERE id_utente=$1 AND id_gruppo=$2',
      [idUtente, idGruppo]
    );
    if (res.rows.length === 0) throw new Error('Non sei membro di questo gruppo');
    if (res.rows[0].ruolo !== 'Amministratore') throw new Error('Operazione riservata all\'amministratore');
  }
}

// ── Scenario ──────────────────────────────────────────────────────────────────
class ScenarioRepository {
  async getScenariGruppo(idGruppo) {
    const runQuery = () => query(
      `SELECT s.*,
         json_agg(json_build_object(
           'id_dispositivo', a.id_dispositivo,
           'nome_dispositivo', d.nome,
           'azione', a.azione_richiesta,
           'valore', a.valore_impostato
         )) FILTER (WHERE a.id_dispositivo IS NOT NULL) AS azioni
       FROM scenario s
       LEFT JOIN azione_scenario a ON a.id_scenario = s.id_scenario
       LEFT JOIN dispositivo d ON d.id_dispositivo = a.id_dispositivo
       WHERE s.id_gruppo = $1 AND (s.trigger_type IS NULL OR s.trigger_type = 'manual')
       GROUP BY s.id_scenario
       ORDER BY s.nome_scenario`,
      [idGruppo]
    );

    let res = await runQuery();
    if (res.rows.length === 0) {
      await this.creaPredefiniti(idGruppo);
      res = await runQuery();
    }
    return res.rows;
  }

  async creaPredefiniti(idGruppo) {
    const devRes = await query(
      `SELECT d.id_dispositivo, d.nome, d.tipo_dispositivo
       FROM dispositivo d
       LEFT JOIN stanza s ON s.id_stanza = d.id_stanza
       WHERE s.id_gruppo = $1 OR d.id_stanza IS NULL`,
      [idGruppo]
    );
    const devices = devRes.rows;

    const predefiniti = [
      {
        nome: 'Cinema',
        icona: '🎬',
        colore: '#E91E63',
        descrizione: 'Luci soffuse, tapparelle giù e TV accesa',
        filtroAzioni: (d) => {
          if (d.tipo_dispositivo === 'Illuminazione' && d.nome.toLowerCase().includes('soggiorno')) {
            return { azione: 'regola', valore: '20' };
          }
          if (d.tipo_dispositivo === 'Tapparelle' && d.nome.toLowerCase().includes('soggiorno')) {
            return { azione: 'regola', valore: '10' };
          }
          if (d.tipo_dispositivo === 'Altro' && d.nome.toLowerCase().includes('tv')) {
            return { azione: 'accendi', valore: null };
          }
          return null;
        }
      },
      {
        nome: 'Rientro a casa',
        icona: '🏠',
        colore: '#4CAF50',
        descrizione: 'Sblocca porta, accendi luci ingresso e clima',
        filtroAzioni: (d) => {
          if (d.tipo_dispositivo === 'Porta_Principale' && d.nome.toLowerCase().includes('ingresso')) {
            return { azione: 'regola', valore: 'aperta' };
          }
          if (d.tipo_dispositivo === 'Illuminazione' && (d.nome.toLowerCase().includes('ingresso') || d.nome.toLowerCase().includes('soggiorno'))) {
            return { azione: 'accendi', valore: null };
          }
          if (d.tipo_dispositivo === 'Termostato' && d.nome.toLowerCase().includes('soggiorno')) {
            return { azione: 'regola', valore: '22' };
          }
          return null;
        }
      },
      {
        nome: 'Buonanotte',
        icona: '🌙',
        colore: '#3F51B5',
        descrizione: 'Spegni tutto, tapparelle giù e chiudi porte',
        filtroAzioni: (d) => {
          if (d.tipo_dispositivo === 'Illuminazione') {
            return { azione: 'spegni', valore: null };
          }
          if (d.tipo_dispositivo === 'Tapparelle') {
            return { azione: 'regola', valore: '0' };
          }
          if (d.tipo_dispositivo === 'Porta_Principale') {
            return { azione: 'regola', valore: 'chiusa' };
          }
          return null;
        }
      },
      {
        nome: 'Fuori casa',
        icona: '🚪',
        colore: '#FF9800',
        descrizione: 'Spegni tutto, attiva videosorveglianza',
        filtroAzioni: (d) => {
          if (d.tipo_dispositivo === 'Illuminazione' || d.tipo_dispositivo === 'Altro' || d.tipo_dispositivo === 'Termostato') {
            return { azione: 'spegni', valore: null };
          }
          if (d.tipo_dispositivo === 'Videosorveglianza') {
            return { azione: 'accendi', valore: null };
          }
          if (d.tipo_dispositivo === 'Porta_Principale') {
            return { azione: 'regola', valore: 'chiusa' };
          }
          return null;
        }
      },
      {
        nome: 'Risparmio Energetico',
        icona: '🌱',
        colore: '#009688',
        descrizione: 'Clima più basso e luci soffuse',
        filtroAzioni: (d) => {
          if (d.tipo_dispositivo === 'Termostato') {
            return { azione: 'regola', valore: '18' };
          }
          if (d.tipo_dispositivo === 'Illuminazione') {
            return { azione: 'regola', valore: '30' };
          }
          return null;
        }
      }
    ];

    const client = await getClient();
    try {
      await client.query('BEGIN');
      for (const p of predefiniti) {
        const scRes = await client.query(
          `INSERT INTO scenario (nome_scenario, icona_app, descrizione, colore, id_gruppo)
           VALUES ($1,$2,$3,$4,$5) RETURNING id_scenario`,
          [p.nome, p.icona, p.descrizione, p.colore, idGruppo]
        );
        const idScenario = scRes.rows[0].id_scenario;

        for (const d of devices) {
          const act = p.filtroAzioni(d);
          if (act) {
            await client.query(
              `INSERT INTO azione_scenario (id_scenario, id_dispositivo, azione_richiesta, valore_impostato)
               VALUES ($1,$2,$3,$4)`,
              [idScenario, d.id_dispositivo, act.azione, act.valore]
            );
          }
        }
      }
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      console.error('[ScenarioRepository] Errore creazione predefiniti:', e.message);
    } finally {
      client.release();
    }
  }

  async creaScenario(idGruppo, idUtente, { nomeScenario, iconaApp='⚡', descrizione='', colore='#7C5CFF', azioni=[] }) {
    await this._checkAdmin(idGruppo, idUtente);
    const client = await getClient();
    try {
      await client.query('BEGIN');
      const res = await client.query(
        `INSERT INTO scenario (nome_scenario, icona_app, descrizione, colore, id_gruppo)
         VALUES ($1,$2,$3,$4,$5) RETURNING *`,
        [nomeScenario, iconaApp, descrizione, colore, idGruppo]
      );
      const sc = res.rows[0];
      for (const az of azioni) {
        await client.query(
          `INSERT INTO azione_scenario (id_scenario, id_dispositivo, azione_richiesta, valore_impostato)
           VALUES ($1,$2,$3,$4)`,
          [sc.id_scenario, az.idDispositivo, az.azione, az.valore !== undefined && az.valore !== null ? String(az.valore) : null]
        );
      }
      await client.query('COMMIT');
      return sc;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async aggiornaScenario(idScenario, idGruppo, idUtente, { nomeScenario, iconaApp, descrizione, colore, azioni }) {
    await this._checkAdmin(idGruppo, idUtente);
    const client = await getClient();
    try {
      await client.query('BEGIN');
      
      const setFields = [];
      const vals = [];
      let i = 1;
      if (nomeScenario) { setFields.push(`nome_scenario=$${i++}`); vals.push(nomeScenario); }
      if (iconaApp) { setFields.push(`icona_app=$${i++}`); vals.push(iconaApp); }
      if (descrizione) { setFields.push(`descrizione=$${i++}`); vals.push(descrizione); }
      if (colore) { setFields.push(`colore=$${i++}`); vals.push(colore); }

      if (setFields.length > 0) {
        vals.push(idScenario, idGruppo);
        await client.query(
          `UPDATE scenario SET ${setFields.join(',')} WHERE id_scenario=$${i} AND id_gruppo=$${i+1}`,
          vals
        );
      }

      if (azioni !== undefined) {
        await client.query('DELETE FROM azione_scenario WHERE id_scenario=$1', [idScenario]);
        for (const az of azioni) {
          await client.query(
            `INSERT INTO azione_scenario (id_scenario, id_dispositivo, azione_richiesta, valore_impostato)
             VALUES ($1,$2,$3,$4)`,
            [idScenario, az.idDispositivo, az.azione, az.valore !== undefined && az.valore !== null ? String(az.valore) : null]
          );
        }
      }

      await client.query('COMMIT');
      
      const updated = await query('SELECT * FROM scenario WHERE id_scenario=$1', [idScenario]);
      return updated.rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async attivaScenario(idScenario, idGruppo, idUtente) {
    await this._checkMembro(idGruppo, idUtente);
    const client = await getClient();
    try {
      await client.query('BEGIN');
      await client.query(
        "UPDATE scenario SET is_active=false WHERE id_gruppo=$1 AND (trigger_type IS NULL OR trigger_type = 'manual')", [idGruppo]
      );
      const res = await client.query(
        'UPDATE scenario SET is_active=true WHERE id_scenario=$1 AND id_gruppo=$2 RETURNING *',
        [idScenario, idGruppo]
      );
      if (res.rows.length === 0) throw new Error('Scenario non trovato');

      const azioni = await client.query(
        'SELECT * FROM azione_scenario WHERE id_scenario=$1', [idScenario]
      );
      for (const az of azioni.rows) {
        const devRes = await client.query('SELECT tipo_dispositivo FROM dispositivo WHERE id_dispositivo=$1', [az.id_dispositivo]);
        if (devRes.rows.length === 0) continue;
        const tipo = devRes.rows[0].tipo_dispositivo;

        if (az.azione_richiesta === 'accendi') {
          await client.query('UPDATE dispositivo SET stato_attuale=true WHERE id_dispositivo=$1', [az.id_dispositivo]);
          if (tipo === 'Porta_Principale') {
            await client.query('UPDATE porta_principale SET stato_serratura=$1 WHERE id_dispositivo=$2', ['aperta', az.id_dispositivo]);
          }
        } else if (az.azione_richiesta === 'spegni') {
          await client.query('UPDATE dispositivo SET stato_attuale=false WHERE id_dispositivo=$1', [az.id_dispositivo]);
          if (tipo === 'Porta_Principale') {
            await client.query('UPDATE porta_principale SET stato_serratura=$1 WHERE id_dispositivo=$2', ['chiusa', az.id_dispositivo]);
          }
        } else if (az.azione_richiesta === 'regola') {
          await client.query('UPDATE dispositivo SET stato_attuale=true WHERE id_dispositivo=$1', [az.id_dispositivo]);
          
          const val = az.valore_impostato;
          if (tipo === 'Illuminazione') {
            await client.query('UPDATE illuminazione SET intensita=$1 WHERE id_dispositivo=$2', [parseInt(val) || 100, az.id_dispositivo]);
          } else if (tipo === 'Tapparelle') {
            await client.query('UPDATE tapparelle SET percentuale_apertura=$1 WHERE id_dispositivo=$2', [parseInt(val) || 0, az.id_dispositivo]);
          } else if (tipo === 'Termostato') {
            await client.query('UPDATE termostato SET temperatura_impostata=$1 WHERE id_dispositivo=$2', [parseFloat(val) || 20, az.id_dispositivo]);
          } else if (tipo === 'Porta_Principale') {
            await client.query('UPDATE porta_principale SET stato_serratura=$1 WHERE id_dispositivo=$2', [val || 'chiusa', az.id_dispositivo]);
          }
        }
      }

      await client.query('COMMIT');
      return res.rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async eliminaScenario(idScenario, idGruppo, idUtente) {
    await this._checkAdmin(idGruppo, idUtente);
    await query('DELETE FROM scenario WHERE id_scenario=$1 AND id_gruppo=$2', [idScenario, idGruppo]);
    return { success: true };
  }

  async disattivaScenario(idScenario, idGruppo, idUtente) {
    await this._checkMembro(idGruppo, idUtente);
    const res = await query(
      'UPDATE scenario SET is_active=false WHERE id_scenario=$1 AND id_gruppo=$2 RETURNING *',
      [idScenario, idGruppo]
    );
    if (res.rows.length === 0) throw new Error('Scenario non trovato');
    return res.rows[0];
  }

  async _checkAdmin(idGruppo, idUtente) {
    const res = await query('SELECT ruolo FROM appartenenza WHERE id_utente=$1 AND id_gruppo=$2', [idUtente, idGruppo]);
    if (res.rows.length === 0) throw new Error('Non sei membro di questo gruppo');
    if (res.rows[0].ruolo !== 'Amministratore') throw new Error('Operazione riservata all\'amministratore');
  }
  async _checkMembro(idGruppo, idUtente) {
    const res = await query('SELECT 1 FROM appartenenza WHERE id_utente=$1 AND id_gruppo=$2', [idUtente, idGruppo]);
    if (res.rows.length === 0) throw new Error('Non sei membro di questo gruppo');
  }
}

// ── Notifica ──────────────────────────────────────────────────────────────────
class NotificaRepository {
  async getNotifiche(idUtente) {
    const res = await query(
      `SELECT * FROM notifica WHERE id_utente=$1 ORDER BY timestamp DESC LIMIT 100`,
      [idUtente]
    );
    return res.rows;
  }

  async getNonLette(idUtente) {
    const res = await query(
      'SELECT * FROM notifica WHERE id_utente=$1 AND letta=false ORDER BY timestamp DESC',
      [idUtente]
    );
    return res.rows;
  }

  async creaNotifica({ idUtente, tipo, messaggio, urgente = false, idAvviso = null }) {
    const res = await query(
      `INSERT INTO notifica (tipo, messaggio, id_utente, urgente, id_avviso)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [tipo, messaggio, idUtente, urgente, idAvviso]
    );
    return res.rows[0];
  }

  async segnaLetta(idNotifica, idUtente) {
    await query(
      'UPDATE notifica SET letta=true WHERE id_notifica=$1 AND id_utente=$2',
      [idNotifica, idUtente]
    );
  }

  async segnaLetteTutte(idUtente) {
    await query('UPDATE notifica SET letta=true WHERE id_utente=$1', [idUtente]);
  }

  async elimina(idNotifica, idUtente) {
    await query('DELETE FROM notifica WHERE id_notifica=$1 AND id_utente=$2', [idNotifica, idUtente]);
  }
}

// ── Consumo Energetico ────────────────────────────────────────────────────────
class EnergiaRepository {
  // Report per periodo (RQ-22, RQ-23)
  async getReport(idGruppo, periodo) {
    let trunc, limit;
    switch (periodo) {
      case 'oggi':     trunc = 'hour';  limit = 24;  break;
      case 'settimana':trunc = 'day';   limit = 7;   break;
      case 'mese':     trunc = 'day';   limit = 30;  break;
      case 'anno':     trunc = 'month'; limit = 12;  break;
      default: throw new Error('Periodo non valido: oggi|settimana|mese|anno');
    }

    const res = await query(
      `SELECT
         date_trunc($1, ce.data_ora) AS periodo,
         SUM(ce.watt_consumati)      AS watt_totali,
         d.nome                      AS dispositivo,
         d.tipo_dispositivo
       FROM consumo_energetico ce
       JOIN dispositivo d ON d.id_dispositivo = ce.id_dispositivo
       JOIN stanza s ON s.id_stanza = d.id_stanza
       WHERE s.id_gruppo = $2
         AND ce.data_ora >= NOW() - INTERVAL '1 ${periodo === 'oggi' ? 'day' : periodo === 'settimana' ? 'week' : periodo === 'mese' ? 'month' : 'year'}'
       GROUP BY periodo, d.id_dispositivo, d.nome, d.tipo_dispositivo
       ORDER BY periodo DESC
       LIMIT $3`,
      [trunc, idGruppo, limit * 50]
    );

    // Consumi totali per dispositivo
    const perDispositivo = {};
    for (const row of res.rows) {
      const k = row.dispositivo;
      if (!perDispositivo[k]) perDispositivo[k] = 0;
      perDispositivo[k] += parseFloat(row.watt_totali);
    }

    const totaleWh = Object.values(perDispositivo).reduce((s, v) => s + v, 0);
    const costoEur = (totaleWh / 1000 * 0.12).toFixed(2);
    const co2Kg    = (totaleWh / 1000 * 0.4).toFixed(2);

    return {
      periodo,
      totaleWh:    Math.round(totaleWh),
      totaleKWh:   (totaleWh / 1000).toFixed(2),
      costoEur,
      co2Kg,
      perDispositivo,
    };
  }

  // Storico avvisi sicurezza (RQ-31)
  async getStoricoAvvisi(idGruppo, mesi = 12) {
    const res = await query(
      `SELECT sa.*
       FROM storico_avvisi_sicurezza sa
       JOIN dispositivo d ON d.id_dispositivo = sa.id_dispositivo
       JOIN stanza s ON s.id_stanza = d.id_stanza
       WHERE s.id_gruppo = $1
         AND sa.timestamp_evento >= NOW() - INTERVAL '${mesi} months'
       ORDER BY sa.timestamp_evento DESC`,
      [idGruppo]
    );
    return res.rows;
  }

  // Crea avviso sicurezza (RQ-19, RQ-20)
  async creaAvviso({ idDispositivo, tipoAvviso, descrizione }) {
    const scadenza = new Date();
    scadenza.setFullYear(scadenza.getFullYear() + 1);

    const res = await query(
      `INSERT INTO storico_avvisi_sicurezza (tipo_avviso, descrizione, data_scadenza, id_dispositivo)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [tipoAvviso, descrizione, scadenza, idDispositivo]
    );
    return res.rows[0];
  }
}

// ── Regole Automazione ────────────────────────────────────────────────────────
class RegolaRepository {
  async getRegoleGruppo(idGruppo) {
    const res = await query(
      `SELECT s.id_scenario AS id_regola, s.nome_scenario AS nome_regola, s.id_dispositivo_sensore, s.condizione, s.valore_soglia, s.is_active AS attiva, s.valore_precedente, s.id_gruppo, s.created_at,
         a.id_dispositivo AS id_dispositivo_attuatore, a.azione_richiesta AS azione, a.valore_impostato AS valore_azione,
         ds.nome AS nome_sensore, ds.tipo_dispositivo AS tipo_sensore,
         da.nome AS nome_attuatore, da.tipo_dispositivo AS tipo_attuatore
       FROM scenario s
       JOIN dispositivo ds ON ds.id_dispositivo = s.id_dispositivo_sensore
       LEFT JOIN azione_scenario a ON a.id_scenario = s.id_scenario
       LEFT JOIN dispositivo da ON da.id_dispositivo = a.id_dispositivo
       WHERE s.id_gruppo = $1 AND s.trigger_type = 'automatico'
       ORDER BY s.created_at DESC`,
      [idGruppo]
    );
    return res.rows;
  }

  async creaRegola(idGruppo, idUtente, { nomeRegola, idDispositivoSensore, condizione, valoreSoglia, idDispositivoAttuatore, azione, valoreAzione }) {
    await this._checkAdmin(idGruppo, idUtente);
    
    const resScenario = await query(
      `INSERT INTO scenario (nome_scenario, trigger_type, id_dispositivo_sensore, condizione, valore_soglia, is_active, id_gruppo)
       VALUES ($1, 'automatico', $2, $3, $4, true, $5) RETURNING *`,
      [nomeRegola, idDispositivoSensore, condizione, valoreSoglia, idGruppo]
    );
    const scenario = resScenario.rows[0];
    
    await query(
      `INSERT INTO azione_scenario (id_scenario, id_dispositivo, azione_richiesta, valore_impostato)
       VALUES ($1, $2, $3, $4)`,
      [scenario.id_scenario, idDispositivoAttuatore, azione, valoreAzione !== undefined && valoreAzione !== null ? String(valoreAzione) : null]
    );
    
    return {
      id_regola: scenario.id_scenario,
      nome_regola: scenario.nome_scenario,
      id_dispositivo_sensore: scenario.id_dispositivo_sensore,
      condizione: scenario.condizione,
      valore_soglia: scenario.valore_soglia,
      id_dispositivo_attuatore: idDispositivoAttuatore,
      azione: azione,
      valore_azione: valoreAzione !== undefined && valoreAzione !== null ? String(valoreAzione) : null,
      attiva: scenario.is_active,
      valore_precedente: scenario.valore_precedente,
      id_gruppo: scenario.id_gruppo,
      created_at: scenario.created_at
    };
  }

  async aggiornaRegola(idRegola, idGruppo, idUtente, payload) {
    await this._checkAdmin(idGruppo, idUtente);
    
    const campiScenario = [];
    const valsScenario = [];
    let i = 1;
    if (payload.nomeRegola) { campiScenario.push(`nome_scenario=$${i++}`); valsScenario.push(payload.nomeRegola); }
    if (payload.attiva !== undefined) { campiScenario.push(`is_active=$${i++}`); valsScenario.push(payload.attiva); }
    if (payload.condizione) { campiScenario.push(`condizione=$${i++}`); valsScenario.push(payload.condizione); }
    if (payload.valoreSoglia !== undefined) { campiScenario.push(`valore_soglia=$${i++}`); valsScenario.push(payload.valoreSoglia); }
    
    if (campiScenario.length > 0) {
      valsScenario.push(idRegola, idGruppo);
      await query(
        `UPDATE scenario SET ${campiScenario.join(',')} WHERE id_scenario=$${i} AND id_gruppo=$${i+1}`,
        valsScenario
      );
    }
    
    const campiAzione = [];
    const valsAzione = [];
    let j = 1;
    if (payload.azione) { campiAzione.push(`azione_richiesta=$${j++}`); valsAzione.push(payload.azione); }
    if (payload.valoreAzione !== undefined) { campiAzione.push(`valore_impostato=$${j++}`); valsAzione.push(payload.valoreAzione !== null ? String(payload.valoreAzione) : null); }
    
    if (campiAzione.length > 0) {
      valsAzione.push(idRegola);
      await query(
        `UPDATE azione_scenario SET ${campiAzione.join(',')} WHERE id_scenario=$${j}`,
        valsAzione
      );
    }
    
    const res = await query(
      `SELECT s.id_scenario AS id_regola, s.nome_scenario AS nome_regola, s.id_dispositivo_sensore, s.condizione, s.valore_soglia, s.is_active AS attiva, s.valore_precedente, s.id_gruppo, s.created_at,
              a.id_dispositivo AS id_dispositivo_attuatore, a.azione_richiesta AS azione, a.valore_impostato AS valore_azione
       FROM scenario s
       LEFT JOIN azione_scenario a ON a.id_scenario = s.id_scenario
       WHERE s.id_scenario = $1 AND s.id_gruppo = $2`,
      [idRegola, idGruppo]
    );
    return res.rows[0];
  }

  async eliminaRegola(idRegola, idGruppo, idUtente) {
    await this._checkAdmin(idGruppo, idUtente);
    await query('DELETE FROM scenario WHERE id_scenario=$1 AND id_gruppo=$2 AND trigger_type = \'automatico\'', [idRegola, idGruppo]);
    return { success: true };
  }

  async _checkAdmin(idGruppo, idUtente) {
    const res = await query('SELECT ruolo FROM appartenenza WHERE id_utente=$1 AND id_gruppo=$2', [idUtente, idGruppo]);
    if (res.rows.length === 0) throw new Error('Non sei membro di questo gruppo');
    if (res.rows[0].ruolo !== 'Amministratore') throw new Error('Operazione riservata all\'amministratore');
  }
}

module.exports = { StanzaRepository, ScenarioRepository, NotificaRepository, EnergiaRepository, RegolaRepository };
