// ── Infrastructure – Auth Repository (PostgreSQL) ─────────────────────────────
const { query, getClient } = require('../db/connection');
const bcrypt = require('bcryptjs');

class AuthRepository {

  // ── Registrazione ─────────────────────────────────────────────────────────
  async register({ email, password, nome }) {
    // Validazione password: min 8 char, maiuscola, minuscola, carattere speciale
    const pwdRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{8,}$/;
    if (!pwdRegex.test(password))
      throw new Error('La password deve avere almeno 8 caratteri, una maiuscola, una minuscola e un carattere speciale');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email))
      throw new Error('Formato email non valido');

    // Controlla duplicato
    const existing = await query('SELECT id_utente FROM utente WHERE email=$1', [email.toLowerCase()]);
    if (existing.rows.length > 0) throw new Error('Email già registrata');

    const salt        = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);
    const avatar      = (nome || email).substring(0, 2).toUpperCase();

    const client = await getClient();
    try {
      await client.query('BEGIN');

      // Crea utente
      const userRes = await client.query(
        `INSERT INTO utente (email, password_hash, salt, nome, avatar)
         VALUES ($1,$2,$3,$4,$5) RETURNING id_utente, email, nome, avatar`,
        [email.toLowerCase(), passwordHash, salt, nome || email.split('@')[0], avatar]
      );
      const user = userRes.rows[0];

      // Crea gruppo familiare automatico (RQ-03)
      const groupRes = await client.query(
        `INSERT INTO gruppo_familiare (nome_abitazione, budget_energia_settimanale)
         VALUES ($1, 300) RETURNING id_gruppo`,
        [`Casa di ${user.nome}`]
      );
      const idGruppo = groupRes.rows[0].id_gruppo;

      // Assegna ruolo Amministratore (RQ-03)
      await client.query(
        `INSERT INTO appartenenza (id_utente, id_gruppo, ruolo) VALUES ($1,$2,'Amministratore')`,
        [user.id_utente, idGruppo]
      );

      await client.query('COMMIT');
      return { user, idGruppo };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  // ── Login ─────────────────────────────────────────────────────────────────
  async login({ email, password }) {
    const res = await query(
      'SELECT id_utente, email, password_hash, nome, avatar FROM utente WHERE email=$1',
      [email.toLowerCase()]
    );
    if (res.rows.length === 0) throw new Error('Credenziali non valide');

    const user  = res.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) throw new Error('Credenziali non valide');

    // Carica gruppi e ruoli dell'utente
    const groups = await query(
      `SELECT g.id_gruppo, g.nome_abitazione, g.budget_energia_settimanale, a.ruolo
       FROM gruppo_familiare g
       JOIN appartenenza a ON a.id_gruppo = g.id_gruppo
       WHERE a.id_utente = $1`,
      [user.id_utente]
    );

    return {
      id:     user.id_utente,
      email:  user.email,
      nome:   user.nome,
      avatar: user.avatar,
      gruppi: groups.rows,
    };
  }

  // ── Profilo ───────────────────────────────────────────────────────────────
  async getProfile(idUtente) {
    const res = await query(
      'SELECT id_utente, email, nome, avatar, created_at FROM utente WHERE id_utente=$1',
      [idUtente]
    );
    if (res.rows.length === 0) throw new Error('Utente non trovato');
    return res.rows[0];
  }

  // ── Modifica credenziali (RQ-07) ──────────────────────────────────────────
  async updateCredentials(idUtente, { email, password, nuovaPassword }) {
    const userRes = await query(
      'SELECT password_hash FROM utente WHERE id_utente=$1', [idUtente]
    );
    if (userRes.rows.length === 0) throw new Error('Utente non trovato');

    const valid = await bcrypt.compare(password, userRes.rows[0].password_hash);
    if (!valid) throw new Error('Password attuale non corretta');

    const updates = [];
    const values  = [];
    let i = 1;

    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) throw new Error('Formato email non valido');
      updates.push(`email=$${i++}`);
      values.push(email.toLowerCase());
    }

    if (nuovaPassword) {
      const pwdRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{8,}$/;
      if (!pwdRegex.test(nuovaPassword))
        throw new Error('La nuova password deve avere almeno 8 caratteri, una maiuscola, una minuscola e un carattere speciale');
      const salt = await bcrypt.genSalt(12);
      const hash = await bcrypt.hash(nuovaPassword, salt);
      updates.push(`password_hash=$${i++}`, `salt=$${i++}`);
      values.push(hash, salt);
    }

    if (updates.length === 0) throw new Error('Nessun campo da aggiornare');

    values.push(idUtente);
    await query(
      `UPDATE utente SET ${updates.join(',')} WHERE id_utente=$${i}`,
      values
    );
    return { success: true };
  }

  // ── Elimina account (RQ-08) ───────────────────────────────────────────────
  async deleteAccount(idUtente, password) {
    const userRes = await query(
      'SELECT password_hash FROM utente WHERE id_utente=$1', [idUtente]
    );
    if (userRes.rows.length === 0) throw new Error('Utente non trovato');

    const valid = await bcrypt.compare(password, userRes.rows[0].password_hash);
    if (!valid) throw new Error('Password non corretta');

    await query('DELETE FROM utente WHERE id_utente=$1', [idUtente]);
    return { success: true };
  }

  // ── Recupero Password (RQ-06) ──────────────────────────────────────────────
  async generateResetCode(email) {
    if (!email) throw new Error('Email richiesta');
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email))
      throw new Error('Formato email non valido');

    const res = await query('SELECT id_utente FROM utente WHERE email=$1', [email.toLowerCase()]);
    if (res.rows.length === 0) {
      throw new Error('Nessun utente registrato con questa email');
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minuti da ora

    await query(
      'UPDATE utente SET reset_code = $1, reset_expires = $2 WHERE email = $3',
      [code, expires, email.toLowerCase()]
    );

    console.log(`[RESET PASSWORD] Codice per email ${email}: ${code}`);
    return { code }; // Ritorniamo il codice per facilitare il testing/debug
  }

  async resetPassword({ email, code, newPassword }) {
    if (!email || !code || !newPassword) throw new Error('Tutti i campi sono obbligatori');

    const pwdRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{8,}$/;
    if (!pwdRegex.test(newPassword))
      throw new Error('La nuova password deve avere almeno 8 caratteri, una maiuscola, una minuscola e un carattere speciale');

    const res = await query(
      'SELECT id_utente, reset_code, reset_expires FROM utente WHERE email=$1',
      [email.toLowerCase()]
    );
    if (res.rows.length === 0) throw new Error('Utente non trovato');

    const user = res.rows[0];
    if (!user.reset_code || user.reset_code !== code) {
      throw new Error('Codice di verifica non valido');
    }

    if (new Date() > new Date(user.reset_expires)) {
      throw new Error('Codice di verifica scaduto');
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await query(
      'UPDATE utente SET password_hash = $1, salt = $2, reset_code = NULL, reset_expires = NULL WHERE id_utente = $3',
      [passwordHash, salt, user.id_utente]
    );

    return { success: true };
  }
}

module.exports = { AuthRepository };
