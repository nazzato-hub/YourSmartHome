# YourSmartHome Backend — API v2 (Node.js + PostgreSQL + WebSockets)

Backend completo per l'applicazione mobile **YourSmartHome**, sviluppato in Node.js ed Express. Implementa un'architettura strutturata basata sul pattern **Repository** per separare la logica di business dall'accesso al database PostgreSQL, con supporto per aggiornamenti in tempo reale tramite **WebSockets**.

---

## Caratteristiche principali

- **Autenticazione sicura**: Autenticazione utente basata su token JWT (JSON Web Tokens) e crittografia password con Bcrypt.
- **Gestione Multi-Gruppo**: Gli utenti possono creare gruppi (es. Famiglia, Ufficio), invitare membri tramite email e condividere il controllo della stessa casa domotica.
- **Controllo Dispositivi**: Gestione di diverse tipologie di dispositivi (Illuminazione, Termostati, Tapparelle, Videosorveglianza, Serrature principali e smart lock) con stato persistito su database.
- **Aggiornamenti Real-time**: WebSocket server per notificare istantaneamente i client sui cambi di stato, avvisi energetici e notifiche di sicurezza (es. allarme intrusione).
- **Pianificazioni ed Automazioni**: Gestione di scenari preimpostati (es. Cinema, Away Mode) e regole automatiche (es. accensione luci a una determinata ora).
- **Monitoraggio Energetico**: Statistiche sui consumi cumulativi ed istantanei dei dispositivi con report dettagliati (settimanali, mensili, annuali) e avvisi di superamento del budget impostato per il gruppo.

---

## Architettura del Progetto

Il codice segue una struttura pulita a livelli:

```
YourSmartHomebackend/
├── index.js                  # Entry point del server (HTTP + WS setup)
├── Dockerfile                # File Docker per l'applicazione Node
├── docker-compose.yml        # Orchestrazione PostgreSQL + Backend + pgAdmin
├── migrations/
│   ├── init.sql              # Schema DDL iniziale del database
│   ├── migrate.js            # Script di esecuzione migrazioni
│   ├── seed_devices.sql      # Seed SQL con dati fittizi sui dispositivi
│   └── seed_devices.js       # Script JS helper per popolare il DB
└── src/
    ├── presentation/
    │   ├── routes/
    │   │   └── index.js      # Definizione delle rotte Express (/api/auth, /api/gruppi, ecc.)
    │   └── controllers/
    │       └── index.js      # Controller Express per la gestione delle richieste
    └── infrastructure/
        ├── db/
        │   └── index.js      # Configurazione e connessione a PostgreSQL (pg Pool)
        ├── middleware/
        │   └── auth.js       # Middleware per validazione JWT e gestione errori
        ├── websocket/
        │   └── index.js      # Gestore WebSocket e Event Bus per aggiornamenti in tempo reale
        └── repositories/
            ├── AuthRepository.js        # Gestione utenti e autenticazione
            ├── GruppoRepository.js      # Gestione gruppi, membri e inviti
            ├── DispositivoRepository.js # Gestione stato dispositivi e comandi
            └── OtherRepositories.js     # Repositories per Stanze, Scenari, Notifiche, Energia e Regole
```

---

## Setup e Avvio

### Metodo 1: Tramite Docker (Consigliato)

Assicurati di avere Docker e Docker Compose installati, quindi esegui nella directory principale:

```bash
docker-compose up --build
```

Questo comando avvierà automaticamente tre servizi:
1. **PostgreSQL** su porta `5433` (mappato internamente a `5432`). Inizializza automaticamente lo schema tramite `migrations/init.sql`.
2. **Backend Node.js** su porta `3000`. Esegue l'API REST e il server WebSocket.
3. **pgAdmin 4** su porta `5050` (interfaccia web per esplorare il DB: email `admin@yoursmarthome.com`, password `admin_password`).

### Metodo 2: Esecuzione Locale Manuale

1. **Configurazione Database**:
   - Assicurati di avere PostgreSQL attivo.
   - Crea un database chiamato `yoursmarthomedb` su porta `5433` (o adatta il file `.env`).

2. **File di configurazione `.env`**:
   Crea o verifica la presenza del file `.env` nella root del backend:
   ```env
   PORT=3000
   NODE_ENV=development
   JWT_SECRET=la_tua_chiave_segreta
   DB_HOST=localhost
   DB_PORT=5433
   DB_NAME=yoursmarthomedb
   DB_USER=ysh_user
   DB_PASSWORD=ysh_password
   ALLOWED_ORIGINS=*
   ```

3. **Installazione dipendenze**:
   ```bash
   npm install
   ```

4. **Esecuzione delle Migrazioni e Seed**:
   Per creare le tabelle e popolare il database con i dati iniziali di prova:
   ```bash
   npm run migrate
   ```

5. **Avvio in modalità sviluppo**:
   ```bash
   npm run dev
   ```

---

## Endpoint Principali (REST API)

| Metodo | Endpoint | Descrizione |
|---|---|---|
| **POST** | `/api/auth/register` | Registrazione di un nuovo utente |
| **POST** | `/api/auth/login` | Login dell'utente e rilascio del token JWT |
| **GET** | `/api/auth/me` | Recupero info utente corrente (richiede auth) |
| **POST** | `/api/gruppi` | Creazione di un nuovo gruppo di gestione smart home |
| **GET** | `/api/gruppi/:id/dispositivi` | Lista dei dispositivi del gruppo |
| **PATCH** | `/api/gruppi/:id/dispositivi/:devId/toggle` | Accensione/Spegnimento dispositivo |
| **POST** | `/api/gruppi/:id/dispositivi` | Aggiunta di un nuovo dispositivo |
| **GET** | `/api/gruppi/:id/stanze` | Lista delle stanze del gruppo |
| **GET** | `/api/gruppi/:id/energia/report` | Report consumi (periodo: settimana/mese/anno) |
| **GET** | `/api/notifiche` | Lista delle notifiche per l'utente loggato |
