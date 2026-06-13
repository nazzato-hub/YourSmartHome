// ── Infrastructure – Gruppo Familiare Repository (PostgreSQL) ─────────────────
const { query, getClient } = require('../db/connection');

class GruppoRepository {

  // ── Gruppi dell'utente ────────────────────────────────────────────────────
  async getGruppiUtente(idUtente) {
    const res = await query(
      `SELECT g.id_gruppo, g.nome_abitazione, g.budget_energia_settimanale, g.pin_sblocco_serrature, a.ruolo
       FROM gruppo_familiare g
       JOIN appartenenza a ON a.id_gruppo = g.id_gruppo
       WHERE a.id_utente = $1
       ORDER BY g.created_at`,
      [idUtente]
    );
    return res.rows;
  }

  // ── Crea nuovo gruppo (RQ-37) ─────────────────────────────────────────────
  async creaGruppo(idUtente, payload) {
    const nomeAbitazione = payload.nomeAbitazione || payload.nome_abitazione || payload.nome;
    const budgetEnergia = payload.budgetEnergia !== undefined ? payload.budgetEnergia : (payload.budget_energia !== undefined ? payload.budget_energia : 300);

    if (!nomeAbitazione) throw new Error('nome_abitazione è obbligatorio');

    const client = await getClient();
    try {
      await client.query('BEGIN');

      const groupRes = await client.query(
        `INSERT INTO gruppo_familiare (nome_abitazione, budget_energia_settimanale)
         VALUES ($1,$2) RETURNING *`,
        [nomeAbitazione, budgetEnergia]
      );
      const gruppo = groupRes.rows[0];

      await client.query(
        `INSERT INTO appartenenza (id_utente, id_gruppo, ruolo) VALUES ($1,$2,'Amministratore')`,
        [idUtente, gruppo.id_gruppo]
      );

      await client.query('COMMIT');
      return { ...gruppo, ruolo: 'Amministratore' };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  // ── Aggiorna budget (RQ-30) ───────────────────────────────────────────────
  async aggiornaBudget(idGruppo, idUtente, budget) {
    await this._checkAdmin(idGruppo, idUtente);
    const res = await query(
      `UPDATE gruppo_familiare SET budget_energia_settimanale=$1 WHERE id_gruppo=$2 RETURNING *`,
      [budget, idGruppo]
    );
    return res.rows[0];
  }

  // ── Aggiorna PIN sblocco serrature ─────────────────────────────────────────
  async aggiornaPinSblocco(idGruppo, idUtente, pin) {
    await this._checkAdmin(idGruppo, idUtente);
    if (!pin || !/^\d{4,6}$/.test(pin)) {
      throw new Error('Il PIN deve essere composto da 4 a 6 cifre numeriche');
    }
    const res = await query(
      `UPDATE gruppo_familiare SET pin_sblocco_serrature=$1 WHERE id_gruppo=$2 RETURNING *`,
      [pin, idGruppo]
    );
    return res.rows[0];
  }

  // ── Membri del gruppo (RQ-43) ─────────────────────────────────────────────
  async getMembri(idGruppo, idUtente) {
    await this._checkMembro(idGruppo, idUtente);
    const res = await query(
      `SELECT u.id_utente, u.email, u.nome, u.avatar, a.ruolo
       FROM utente u
       JOIN appartenenza a ON a.id_utente = u.id_utente
       WHERE a.id_gruppo = $1
       ORDER BY a.ruolo DESC, u.nome`,
      [idGruppo]
    );
    return res.rows;
  }

  // ── Invita utente (RQ-38) ─────────────────────────────────────────────────
  async invitaUtente(idGruppo, idMittente, emailInvitato) {
    await this._checkAdmin(idGruppo, idMittente);

    // Controlla che non sia già membro
    const userRes = await query(
      'SELECT id_utente FROM utente WHERE email=$1', [emailInvitato.toLowerCase()]
    );
    if (userRes.rows.length > 0) {
      const idInvitato = userRes.rows[0].id_utente;
      const membroRes = await query(
        'SELECT 1 FROM appartenenza WHERE id_utente=$1 AND id_gruppo=$2',
        [idInvitato, idGruppo]
      );
      if (membroRes.rows.length > 0) throw new Error('L\'utente è già membro del gruppo');
    }

    // Controlla invito già pendente
    const existing = await query(
      `SELECT 1 FROM invito WHERE identificativo_invitato=$1 AND id_gruppo=$2 AND stato_invito='in_attesa'`,
      [emailInvitato.toLowerCase(), idGruppo]
    );
    if (existing.rows.length > 0) throw new Error('Invito già inviato e in attesa');

    const res = await query(
      `INSERT INTO invito (identificativo_invitato, stato_invito, id_mittente, id_gruppo)
       VALUES ($1,'in_attesa',$2,$3) RETURNING *`,
      [emailInvitato.toLowerCase(), idMittente, idGruppo]
    );

    // Crea notifica per l'invitato se esiste nel sistema
    if (userRes.rows.length > 0) {
      const idInvitato = userRes.rows[0].id_utente;
      const gruppoRes = await query(
        'SELECT nome_abitazione FROM gruppo_familiare WHERE id_gruppo=$1', [idGruppo]
      );
      await query(
        `INSERT INTO notifica (tipo, messaggio, id_utente)
         VALUES ('invito', $1, $2)`,
        [`Hai ricevuto un invito per unirti al gruppo "${gruppoRes.rows[0].nome_abitazione}"`, idInvitato]
      );
    }

    return res.rows[0];
  }

  // ── Inviti inviati dall'utente per il gruppo (Nuovo) ──────────────────────
  async getInvitiInviati(idGruppo, idUtente) {
    await this._checkAdmin(idGruppo, idUtente);
    const res = await query(
      `SELECT i.id_invito, i.identificativo_invitato, i.stato_invito, i.created_at
       FROM invito i
       WHERE i.id_gruppo = $1 AND i.id_mittente = $2
       ORDER BY i.created_at DESC`,
      [idGruppo, idUtente]
    );
    return res.rows;
  }

  // ── Inviti ricevuti dall'utente (RQ-39) ───────────────────────────────────
  async getInvitiRicevuti(idUtente) {
    const userRes = await query('SELECT email FROM utente WHERE id_utente=$1', [idUtente]);
    if (userRes.rows.length === 0) throw new Error('Utente non trovato');
    const email = userRes.rows[0].email;

    const res = await query(
      `SELECT i.id_invito, i.stato_invito, i.created_at,
              g.nome_abitazione, g.id_gruppo,
              u.nome AS nome_mittente, u.email AS email_mittente
       FROM invito i
       JOIN gruppo_familiare g ON g.id_gruppo = i.id_gruppo
       JOIN utente u ON u.id_utente = i.id_mittente
       WHERE i.identificativo_invitato = $1
       ORDER BY i.created_at DESC`,
      [email]
    );
    return res.rows;
  }

  // ── Rispondi a invito: accetta o rifiuta (RQ-39) ──────────────────────────
  async rispondiInvito(idInvito, idUtente, accetta) {
    const userRes = await query('SELECT email FROM utente WHERE id_utente=$1', [idUtente]);
    if (userRes.rows.length === 0) throw new Error('Utente non trovato');

    const invRes = await query(
      `SELECT * FROM invito WHERE id_invito=$1 AND identificativo_invitato=$2 AND stato_invito='in_attesa'`,
      [idInvito, userRes.rows[0].email]
    );
    if (invRes.rows.length === 0) throw new Error('Invito non trovato o già gestito');

    const inv    = invRes.rows[0];
    const stato  = accetta ? 'accettato' : 'rifiutato';

    const client = await getClient();
    try {
      await client.query('BEGIN');

      await client.query(
        `UPDATE invito SET stato_invito=$1 WHERE id_invito=$2`,
        [stato, idInvito]
      );

      if (accetta) {
        await client.query(
          `INSERT INTO appartenenza (id_utente, id_gruppo, ruolo) VALUES ($1,$2,'Membro')`,
          [idUtente, inv.id_gruppo]
        );
      }

      await client.query('COMMIT');
      return { stato, idGruppo: inv.id_gruppo };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  // ── Rimuovi membro (RQ-41) ────────────────────────────────────────────────
  async rimuoviMembro(idGruppo, idAdmin, idMembro) {
    await this._checkAdmin(idGruppo, idAdmin);
    if (idAdmin === idMembro) throw new Error('Non puoi rimuovere te stesso');

    const res = await query(
      `DELETE FROM appartenenza WHERE id_utente=$1 AND id_gruppo=$2 RETURNING *`,
      [idMembro, idGruppo]
    );
    if (res.rows.length === 0) throw new Error('Membro non trovato nel gruppo');
    return { success: true };
  }

  // ── Abbandona gruppo (RQ-42) ──────────────────────────────────────────────
  async abbandonaGruppo(idGruppo, idUtente) {
    const ruoloRes = await query(
      'SELECT ruolo FROM appartenenza WHERE id_utente=$1 AND id_gruppo=$2',
      [idUtente, idGruppo]
    );
    if (ruoloRes.rows.length === 0) throw new Error('Non sei membro di questo gruppo');
    if (ruoloRes.rows[0].ruolo === 'Amministratore') {
      const altriRes = await query(
        'SELECT COUNT(*) FROM appartenenza WHERE id_gruppo=$1', [idGruppo]
      );
      if (parseInt(altriRes.rows[0].count) > 1)
        throw new Error('Trasferisci il ruolo di amministratore prima di abbandonare il gruppo');
    }

    await query(
      'DELETE FROM appartenenza WHERE id_utente=$1 AND id_gruppo=$2',
      [idUtente, idGruppo]
    );
    return { success: true };
  }

  // ── Helpers interni ───────────────────────────────────────────────────────
  async _checkAdmin(idGruppo, idUtente) {
    const res = await query(
      `SELECT ruolo FROM appartenenza WHERE id_utente=$1 AND id_gruppo=$2`,
      [idUtente, idGruppo]
    );
    if (res.rows.length === 0) throw new Error('Non sei membro di questo gruppo');
    if (res.rows[0].ruolo !== 'Amministratore') throw new Error('Operazione riservata all\'amministratore');
  }

  async _checkMembro(idGruppo, idUtente) {
    const res = await query(
      `SELECT 1 FROM appartenenza WHERE id_utente=$1 AND id_gruppo=$2`,
      [idUtente, idGruppo]
    );
    if (res.rows.length === 0) throw new Error('Non sei membro di questo gruppo');
  }
}

module.exports = { GruppoRepository };
