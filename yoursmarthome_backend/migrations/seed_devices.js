// Script di popolatamento dei dispositivi di test (Seeding)
const { Client } = require('pg');

const client = new Client({
  host: '127.0.0.1',
  port: 5432,
  database: 'yoursmarthome',
  user: 'ysh_user',
  password: 'ysh_password',
});

const DEVICES_TO_SEED = [
  // ── Illuminazione (10) ──
  { nome: 'Lampada Soggiorno', tipo: 'Illuminazione', watt: 15, det: { intensita: 80, coloreRgb: '#FFCC00' } },
  { nome: 'Lampadario Cucina', tipo: 'Illuminazione', watt: 24, det: { intensita: 100, coloreRgb: '#FFFFFF' } },
  { nome: 'Faretto Bagno', tipo: 'Illuminazione', watt: 8, det: { intensita: 90, coloreRgb: '#E0F7FA' } },
  { nome: 'Luce Ingresso', tipo: 'Illuminazione', watt: 12, det: { intensita: 100, coloreRgb: '#FFFDE7' } },
  { nome: 'Lampada da Lettura', tipo: 'Illuminazione', watt: 6, det: { intensita: 50, coloreRgb: '#FFEB3B' } },
  { nome: 'Applique Corridoio', tipo: 'Illuminazione', watt: 10, det: { intensita: 70, coloreRgb: '#FFF9C4' } },
  { nome: 'Striscia LED Letto', tipo: 'Illuminazione', watt: 18, det: { intensita: 40, coloreRgb: '#E040FB' } },
  { nome: 'Luce Giardino', tipo: 'Illuminazione', watt: 30, det: { intensita: 100, coloreRgb: '#FFFFFF' } },
  { nome: 'Lampadario Tavolo', tipo: 'Illuminazione', watt: 28, det: { intensita: 85, coloreRgb: '#FFF3E0' } },
  { nome: 'Faretto Specchio', tipo: 'Illuminazione', watt: 7, det: { intensita: 95, coloreRgb: '#E0F2F1' } },

  // ── Porta_Principale (10) ──
  { nome: 'Serratura Ingresso', tipo: 'Porta_Principale', watt: 2, det: { statoSerratura: 'chiusa' } },
  { nome: 'Porta Garage', tipo: 'Porta_Principale', watt: 150, det: { statoSerratura: 'chiusa' } },
  { nome: 'Cancello Esterno', tipo: 'Porta_Principale', watt: 200, det: { statoSerratura: 'chiusa' } },
  { nome: 'Porta Sul Retro', tipo: 'Porta_Principale', watt: 2, det: { statoSerratura: 'chiusa' } },
  { nome: 'Serratura Cantina', tipo: 'Porta_Principale', watt: 1, det: { statoSerratura: 'chiusa' } },
  { nome: 'Porta Studio', tipo: 'Porta_Principale', watt: 2, det: { statoSerratura: 'aperta' } },
  { nome: 'Serratura Mansarda', tipo: 'Porta_Principale', watt: 1, det: { statoSerratura: 'chiusa' } },
  { nome: 'Cancello Pedonale', tipo: 'Porta_Principale', watt: 25, det: { statoSerratura: 'chiusa' } },
  { nome: 'Porta Taverna', tipo: 'Porta_Principale', watt: 2, det: { statoSerratura: 'chiusa' } },
  { nome: 'Porta Cucina Esterna', tipo: 'Porta_Principale', watt: 2, det: { statoSerratura: 'chiusa' } },

  // ── Termostato (10) ──
  { nome: 'Termostato Soggiorno', tipo: 'Termostato', watt: 5, det: { temperaturaImpostata: 21.5, temperaturaRilevata: 20.8, modalita: 'riscaldamento' } },
  { nome: 'Climatizzatore Cucina', tipo: 'Termostato', watt: 900, det: { temperaturaImpostata: 24.0, temperaturaRilevata: 26.2, modalita: 'raffreddamento' } },
  { nome: 'Riscaldamento Bagno', tipo: 'Termostato', watt: 1200, det: { temperaturaImpostata: 23.0, temperaturaRilevata: 21.1, modalita: 'riscaldamento' } },
  { nome: 'Termostato Camera', tipo: 'Termostato', watt: 4, det: { temperaturaImpostata: 19.0, temperaturaRilevata: 18.5, modalita: 'riscaldamento' } },
  { nome: 'Clima Studio', tipo: 'Termostato', watt: 750, det: { temperaturaImpostata: 22.0, temperaturaRilevata: 24.5, modalita: 'raffreddamento' } },
  { nome: 'Termostato Corridoio', tipo: 'Termostato', watt: 3, det: { temperaturaImpostata: 20.0, temperaturaRilevata: 19.8, modalita: 'riscaldamento' } },
  { nome: 'Riscaldamento Mansarda', tipo: 'Termostato', watt: 1000, det: { temperaturaImpostata: 18.0, temperaturaRilevata: 16.5, modalita: 'spento' } },
  { nome: 'Termostato Taverna', tipo: 'Termostato', watt: 5, det: { temperaturaImpostata: 20.5, temperaturaRilevata: 18.2, modalita: 'riscaldamento' } },
  { nome: 'Clima Ospiti', tipo: 'Termostato', watt: 800, det: { temperaturaImpostata: 23.0, temperaturaRilevata: 23.0, modalita: 'raffreddamento' } },
  { nome: 'Riscaldamento Ingresso', tipo: 'Termostato', watt: 5, det: { temperaturaImpostata: 20.0, temperaturaRilevata: 19.1, modalita: 'riscaldamento' } },

  // ── Tapparelle (10) ──
  { nome: 'Tapparella Soggiorno', tipo: 'Tapparelle', watt: 110, det: { percentualeApertura: 100 } },
  { nome: 'Tapparella Cucina', tipo: 'Tapparelle', watt: 110, det: { percentualeApertura: 50 } },
  { nome: 'Tapparella Camera', tipo: 'Tapparelle', watt: 110, det: { percentualeApertura: 0 } },
  { nome: 'Tapparella Studio', tipo: 'Tapparelle', watt: 110, det: { percentualeApertura: 80 } },
  { nome: 'Tapparella Bagno', tipo: 'Tapparelle', watt: 110, det: { percentualeApertura: 20 } },
  { nome: 'Tapparella Cameretta', tipo: 'Tapparelle', watt: 110, det: { percentualeApertura: 0 } },
  { nome: 'Tapparella Corridoio', tipo: 'Tapparelle', watt: 110, det: { percentualeApertura: 100 } },
  { nome: 'Tapparella Mansarda', tipo: 'Tapparelle', watt: 110, det: { percentualeApertura: 30 } },
  { nome: 'Tapparella Taverna', tipo: 'Tapparelle', watt: 110, det: { percentualeApertura: 0 } },
  { nome: 'Tapparella Ripostiglio', tipo: 'Tapparelle', watt: 110, det: { percentualeApertura: 100 } },

  // ── Videosorveglianza (10) ──
  { nome: 'Telecamera Ingresso', tipo: 'Videosorveglianza', watt: 6, det: { registrazioneAttiva: true, risoluzione: '1080p' } },
  { nome: 'Telecamera Garage', tipo: 'Videosorveglianza', watt: 6, det: { registrazioneAttiva: true, risoluzione: '1080p' } },
  { nome: 'Telecamera Giardino', tipo: 'Videosorveglianza', watt: 8, det: { registrazioneAttiva: true, risoluzione: '2K' } },
  { nome: 'Telecamera Cortile', tipo: 'Videosorveglianza', watt: 8, det: { registrazioneAttiva: true, risoluzione: '1080p' } },
  { nome: 'Telecamera Salotto', tipo: 'Videosorveglianza', watt: 5, det: { registrazioneAttiva: false, risoluzione: '1080p' } },
  { nome: 'Telecamera Corridoio', tipo: 'Videosorveglianza', watt: 5, det: { registrazioneAttiva: true, risoluzione: '720p' } },
  { nome: 'Telecamera Retro', tipo: 'Videosorveglianza', watt: 6, det: { registrazioneAttiva: true, risoluzione: '1080p' } },
  { nome: 'Telecamera Terrazzo', tipo: 'Videosorveglianza', watt: 7, det: { registrazioneAttiva: true, risoluzione: '2K' } },
  { nome: 'Telecamera Ingresso Pedonale', tipo: 'Videosorveglianza', watt: 6, det: { registrazioneAttiva: true, risoluzione: '1080p' } },
  { nome: 'Telecamera Cantina', tipo: 'Videosorveglianza', watt: 5, det: { registrazioneAttiva: false, risoluzione: '720p' } },

  // ── Altro (10) ──
  { nome: 'Presa TV', tipo: 'Altro', watt: 1, det: {} },
  { nome: 'Smart Plug Lavatrice', tipo: 'Altro', watt: 2, det: {} },
  { nome: 'Presa Macchina Caffè', tipo: 'Altro', watt: 2, det: {} },
  { nome: 'Presa Lavastoviglie', tipo: 'Altro', watt: 2, det: {} },
  { nome: 'Diffusore Audio', tipo: 'Altro', watt: 15, det: {} },
  { nome: 'Smart TV', tipo: 'Altro', watt: 85, det: {} },
  { nome: 'Purificatore Aria', tipo: 'Altro', watt: 35, det: {} },
  { nome: 'Deumidificatore', tipo: 'Altro', watt: 320, det: {} },
  { nome: 'Console Giochi', tipo: 'Altro', watt: 150, det: {} },
  { nome: 'Presa Ricarica', tipo: 'Altro', watt: 5, det: {} },
];

async function seed() {
  console.log('[Seed] Connessione al database...');
  try {
    await client.connect();
    console.log('[Seed] Connessione riuscita. Avvio inserimento dispositivi...');

    // Trova il primo gruppo registrato nel sistema (default a 1 se vuoto)
    const groupRes = await client.query('SELECT id_gruppo FROM gruppo_familiare LIMIT 1');
    const firstGroupId = groupRes.rows[0]?.id_gruppo || 1;
    console.log(`[Seed] Tutti i dispositivi di test verranno assegnati al gruppo ID: ${firstGroupId}`);

    for (const d of DEVICES_TO_SEED) {
      // Inserisce dispositivo generico
      const devRes = await client.query(
        `INSERT INTO dispositivo (nome, tipo_dispositivo, stato_attuale, consumo_watt, id_stanza, id_gruppo)
         VALUES ($1, $2, false, $3, null, $4) RETURNING id_dispositivo`,
        [d.nome, d.tipo, d.watt, firstGroupId]
      );
      const idDev = devRes.rows[0].id_dispositivo;

      // Inserisce specializzazione in base al tipo
      switch (d.tipo) {
        case 'Termostato':
          await client.query(
            `INSERT INTO termostato (id_dispositivo, temperatura_impostata, temperatura_rilevata, modalita)
             VALUES ($1, $2, $3, $4)`,
            [idDev, d.det.temperaturaImpostata, d.det.temperaturaRilevata, d.det.modalita]
          );
          break;
        case 'Illuminazione':
          await client.query(
            `INSERT INTO illuminazione (id_dispositivo, intensita, colore_rgb)
             VALUES ($1, $2, $3)`,
            [idDev, d.det.intensita, d.det.coloreRgb]
          );
          break;
        case 'Videosorveglianza':
          await client.query(
            `INSERT INTO videosorveglianza (id_dispositivo, registrazione_attiva, risoluzione)
             VALUES ($1, $2, $3)`,
            [idDev, d.det.registrazioneAttiva, d.det.risoluzione]
          );
          break;
        case 'Porta_Principale':
          await client.query(
            `INSERT INTO porta_principale (id_dispositivo, stato_serratura)
             VALUES ($1, $2)`,
            [idDev, d.det.statoSerratura]
          );
          break;
        case 'Tapparelle':
          await client.query(
            `INSERT INTO tapparelle (id_dispositivo, percentuale_apertura)
             VALUES ($1, $2)`,
            [idDev, d.det.percentualeApertura]
          );
          break;
      }
    }

    console.log(`[Seed] ✅ Completato con successo! Inseriti ${DEVICES_TO_SEED.length} dispositivi.`);
  } catch (err) {
    console.error('[Seed] ❌ Errore durante il seeding:', err.message);
  } finally {
    await client.end();
  }
}

seed();
