// ── Database Migration – Crea tutte le tabelle dal diagramma E-R ──────────────
const { pool } = require('../src/infrastructure/db/connection');

const SQL = `

-- Utente
CREATE TABLE IF NOT EXISTS utente (
  id_utente     SERIAL PRIMARY KEY,
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  salt          VARCHAR(255) NOT NULL,
  nome          VARCHAR(100),
  avatar        VARCHAR(10) DEFAULT '👤',
  reset_code    VARCHAR(6),
  reset_expires TIMESTAMP,
  created_at    TIMESTAMP DEFAULT NOW()
);

-- Gruppo familiare (abitazione)
CREATE TABLE IF NOT EXISTS gruppo_familiare (
  id_gruppo                  SERIAL PRIMARY KEY,
  nome_abitazione            VARCHAR(100) NOT NULL,
  budget_energia_settimanale FLOAT DEFAULT 300,
  pin_sblocco_serrature      VARCHAR(4) DEFAULT '1234',
  created_at                 TIMESTAMP DEFAULT NOW()
);

-- Appartenenza (utente <-> gruppo, con ruolo)
CREATE TABLE IF NOT EXISTS appartenenza (
  id_utente INTEGER REFERENCES utente(id_utente) ON DELETE CASCADE,
  id_gruppo INTEGER REFERENCES gruppo_familiare(id_gruppo) ON DELETE CASCADE,
  ruolo     VARCHAR(20) NOT NULL CHECK (ruolo IN ('Amministratore','Membro')),
  PRIMARY KEY (id_utente, id_gruppo)
);

-- Invito
CREATE TABLE IF NOT EXISTS invito (
  id_invito             SERIAL PRIMARY KEY,
  identificativo_invitato VARCHAR(255) NOT NULL,
  stato_invito          VARCHAR(20) NOT NULL DEFAULT 'in_attesa'
                        CHECK (stato_invito IN ('in_attesa','accettato','rifiutato')),
  id_mittente           INTEGER REFERENCES utente(id_utente) ON DELETE CASCADE,
  id_gruppo             INTEGER REFERENCES gruppo_familiare(id_gruppo) ON DELETE CASCADE,
  created_at            TIMESTAMP DEFAULT NOW()
);

-- Stanza
CREATE TABLE IF NOT EXISTS stanza (
  id_stanza SERIAL PRIMARY KEY,
  nome      VARCHAR(100) NOT NULL,
  icona     VARCHAR(10) DEFAULT '🏠',
  id_gruppo INTEGER REFERENCES gruppo_familiare(id_gruppo) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Dispositivo (base)
CREATE TABLE IF NOT EXISTS dispositivo (
  id_dispositivo SERIAL PRIMARY KEY,
  nome           VARCHAR(100) NOT NULL,
  tipo_dispositivo VARCHAR(50) NOT NULL
                  CHECK (tipo_dispositivo IN ('Illuminazione','Porta_Principale','Termostato','Tapparelle','Videosorveglianza','Altro','Sensore_Presenza')),

  stato_attuale  BOOLEAN DEFAULT FALSE,
  consumo_watt   FLOAT DEFAULT 0,
  id_stanza      INTEGER REFERENCES stanza(id_stanza) ON DELETE SET NULL,
  id_gruppo      INTEGER REFERENCES gruppo_familiare(id_gruppo) ON DELETE CASCADE,
  timer_minuti   INTEGER DEFAULT NULL,
  sched_attivo   BOOLEAN DEFAULT FALSE,
  sched_giorni   VARCHAR(50) DEFAULT NULL,
  sched_accensione VARCHAR(5) DEFAULT NULL,
  sched_spegnimento VARCHAR(5) DEFAULT NULL,
  created_at     TIMESTAMP DEFAULT NOW()
);

-- Specializzazione: Termostato
CREATE TABLE IF NOT EXISTS termostato (
  id_dispositivo      INTEGER PRIMARY KEY REFERENCES dispositivo(id_dispositivo) ON DELETE CASCADE,
  temperatura_impostata FLOAT DEFAULT 20,
  temperatura_rilevata  FLOAT DEFAULT 20,
  modalita            VARCHAR(20) DEFAULT 'riscaldamento'
);

-- Specializzazione: Illuminazione
CREATE TABLE IF NOT EXISTS illuminazione (
  id_dispositivo INTEGER PRIMARY KEY REFERENCES dispositivo(id_dispositivo) ON DELETE CASCADE,
  intensita      INTEGER DEFAULT 100 CHECK (intensita BETWEEN 0 AND 100),
  colore_rgb     VARCHAR(7) DEFAULT '#FFFFFF'
);

-- Specializzazione: Videosorveglianza
CREATE TABLE IF NOT EXISTS videosorveglianza (
  id_dispositivo      INTEGER PRIMARY KEY REFERENCES dispositivo(id_dispositivo) ON DELETE CASCADE,
  registrazione_attiva BOOLEAN DEFAULT TRUE,
  risoluzione         VARCHAR(20) DEFAULT '1080p',
  allarme             BOOLEAN DEFAULT FALSE
);

-- Specializzazione: Porta principale
CREATE TABLE IF NOT EXISTS porta_principale (
  id_dispositivo     INTEGER PRIMARY KEY REFERENCES dispositivo(id_dispositivo) ON DELETE CASCADE,
  stato_serratura    VARCHAR(20) DEFAULT 'chiusa',
  allarme_intrusione BOOLEAN DEFAULT FALSE
);

-- Specializzazione: Tapparelle
CREATE TABLE IF NOT EXISTS tapparelle (
  id_dispositivo      INTEGER PRIMARY KEY REFERENCES dispositivo(id_dispositivo) ON DELETE CASCADE,
  percentuale_apertura INTEGER DEFAULT 0 CHECK (percentuale_apertura BETWEEN 0 AND 100)
);

-- Scenario
CREATE TABLE IF NOT EXISTS scenario (
  id_scenario   SERIAL PRIMARY KEY,
  nome_scenario VARCHAR(100) NOT NULL,
  icona_app     VARCHAR(10) DEFAULT '⚡',
  descrizione   TEXT,
  colore        VARCHAR(7) DEFAULT '#7C5CFF',
  is_active     BOOLEAN DEFAULT FALSE,
  id_gruppo     INTEGER REFERENCES gruppo_familiare(id_gruppo) ON DELETE CASCADE,
  trigger_type  VARCHAR(20) DEFAULT 'manual' CHECK (trigger_type IN ('manual', 'automatico', 'meteo')),
  id_dispositivo_sensore INTEGER REFERENCES dispositivo(id_dispositivo) ON DELETE CASCADE,
  condizione    VARCHAR(10) CHECK (condizione IN ('<', '>', '=', 'motion')),
  valore_soglia VARCHAR(50),
  valore_precedente TEXT DEFAULT NULL,
  created_at    TIMESTAMP DEFAULT NOW()
);

-- Azione scenario (scenario <-> dispositivo)
CREATE TABLE IF NOT EXISTS azione_scenario (
  id_scenario     INTEGER REFERENCES scenario(id_scenario) ON DELETE CASCADE,
  id_dispositivo  INTEGER REFERENCES dispositivo(id_dispositivo) ON DELETE CASCADE,
  azione_richiesta VARCHAR(50) NOT NULL,
  valore_impostato VARCHAR(100),
  PRIMARY KEY (id_scenario, id_dispositivo)
);

-- Programmazione oraria
CREATE TABLE IF NOT EXISTS programmazione_oraria (
  id_programmazione SERIAL PRIMARY KEY,
  ora_esecuzione    TIME NOT NULL,
  giorni_attivi     VARCHAR(50) NOT NULL,
  id_scenario       INTEGER REFERENCES scenario(id_scenario) ON DELETE CASCADE,
  created_at        TIMESTAMP DEFAULT NOW()
);

-- Consumo energetico
CREATE TABLE IF NOT EXISTS consumo_energetico (
  id_misurazione SERIAL PRIMARY KEY,
  data_ora       TIMESTAMP DEFAULT NOW(),
  watt_consumati FLOAT NOT NULL,
  id_dispositivo INTEGER REFERENCES dispositivo(id_dispositivo) ON DELETE CASCADE
);

-- Storico avvisi sicurezza
CREATE TABLE IF NOT EXISTS storico_avvisi_sicurezza (
  id_avviso        SERIAL PRIMARY KEY,
  timestamp_evento TIMESTAMP DEFAULT NOW(),
  tipo_avviso      VARCHAR(50) NOT NULL,
  descrizione      TEXT,
  data_scadenza    TIMESTAMP,
  id_dispositivo   INTEGER REFERENCES dispositivo(id_dispositivo) ON DELETE SET NULL
);

-- Notifica
CREATE TABLE IF NOT EXISTS notifica (
  id_notifica SERIAL PRIMARY KEY,
  timestamp   TIMESTAMP DEFAULT NOW(),
  tipo        VARCHAR(50) NOT NULL,
  messaggio   TEXT NOT NULL,
  letta       BOOLEAN DEFAULT FALSE,
  urgente     BOOLEAN DEFAULT FALSE,
  id_utente   INTEGER REFERENCES utente(id_utente) ON DELETE CASCADE,
  id_avviso   INTEGER REFERENCES storico_avvisi_sicurezza(id_avviso) ON DELETE SET NULL
);

-- Indici per le query più frequenti
CREATE INDEX IF NOT EXISTS idx_appartenenza_utente ON appartenenza(id_utente);
CREATE INDEX IF NOT EXISTS idx_appartenenza_gruppo ON appartenenza(id_gruppo);
CREATE INDEX IF NOT EXISTS idx_dispositivo_stanza  ON dispositivo(id_stanza);
CREATE INDEX IF NOT EXISTS idx_consumo_dispositivo ON consumo_energetico(id_dispositivo);
CREATE INDEX IF NOT EXISTS idx_notifica_utente      ON notifica(id_utente);
CREATE INDEX IF NOT EXISTS idx_invito_gruppo        ON invito(id_gruppo);
CREATE INDEX IF NOT EXISTS idx_stanza_gruppo        ON stanza(id_gruppo);
`;

async function migrate() {
  console.log('[Migration] Avvio migrazione database...');
  try {
    await pool.query(SQL);
    console.log('[Migration] ✅ Tutte le tabelle create correttamente');
  } catch (err) {
    console.error('[Migration] ❌ Errore:', err.message);
    throw err;
  } finally {
    await pool.end();
  }
}

migrate();
