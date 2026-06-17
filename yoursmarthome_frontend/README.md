# YourSmartHome — React Native App (Expo)

Applicazione mobile smart home per il controllo domotico integrato, sviluppata in **React Native** con il framework **Expo**. L'applicazione implementa un'interfaccia utente moderna a tema scuro (dark mode), una navigazione strutturata con persistenza della barra inferiore (tab bar), e un'integrazione client-server tramite API REST e notifiche push.

---

## Struttura del Progetto

La struttura delle cartelle dell'applicazione frontend è organizzata come segue:

```
YourSmartHome/
├── App.js                          # Entry point dell'applicazione (registrazione notif. e DeviceProvider)
├── app.json                        # Configurazione del progetto Expo
├── package.json                    # Dipendenze del progetto e script npm
├── index.js                        # Registrazione iniziale di Expo
└── src/
    ├── theme/
    │   └── index.js                # Design System: Colori, tipografia, spaziatura e ombre
    ├── services/
    │   └── api.js                  # Integrazione delle chiamate HTTP REST al backend
    ├── store/
    │   ├── DeviceStore.js          # React Context + Reducer per la gestione dello stato globale
    │   └── deviceConstants.js      # Costanti dei tipi di dispositivi domotici e relative icone
    ├── components/
    │   └── index.js                # Componenti UI riutilizzabili (DeviceCard, AppHeader, Toggle, ecc.)
    ├── navigation/
    │   ├── AppNavigator.js         # Navigazione principale (Switch tra Auth Stack e Main App)
    │   └── MainTabNavigator.js     # Navigazione a Tab (Home, Analisi, Serrature, Stanze, Profilo)
    └── screens/
        ├── auth/
        │   ├── LoginScreen.js      # Schermata di Login
        │   ├── RegisterScreen.js   # Schermata di Registrazione nuovo account
        │   └── ForgotPasswordScreen.js # Schermata recupero password (tramite codice email)
        └── main/
            ├── HomeScreen.js       # Dashboard principale (temperatura, dispositivi preferiti, scenari rapidi)
            ├── AddDeviceScreen.js  # Schermata di scansione Bluetooth/Wi-Fi (con animazione a cerchi concentrici)
            ├── RoomsScreen.js      # Elenco delle stanze configurate (con anteprima dei dispositivi attivi)
            ├── RoomDetailScreen.js # Dettaglio singola stanza con controlli dedicati
            ├── DeviceScreen.js     # Controllo dettagliato del singolo dispositivo (intensità, termostato, timer)
            ├── ScenarioScreen.js   # Gestione scenari (Cinema, Away, Party) ed automazioni orarie
            ├── AnalysisScreen.js   # Schermata consumi energetici con grafici comparativi
            ├── LockScreen.js       # Gestione della sicurezza (serrature esterne e PIN challenge)
            ├── NotificationsScreen.js # Centro notifiche per allarmi sicurezza, sforamento budget e sistema
            └── UserScreen.js       # Gestione profilo utente, budget di gruppo e credenziali
```

---

## Gestione dello Stato Globale

L'applicazione utilizza un sistema di **React Context** combinato con `useReducer` all'interno di [DeviceStore.js](file:///c:/Users/gaiat/OneDrive/Desktop/Academy/app/YourSmartHome/src/store/DeviceStore.js) per:
- Centralizzare lo stato dei dispositivi domotici, delle stanze, del budget e delle notifiche.
- Sincronizzare le modifiche dell'utente (es. accensione di una luce, variazione temperatura termostato) con il backend e aggiornare lo stato locale.
- Gestire il caricamento iniziale dei dati subito dopo l'autenticazione.

---

## Flusso di Navigazione

La navigazione è progettata per mantenere la barra dei menu inferiore (**Tab Bar**) costantemente visibile durante l'esplorazione, evitando che le schermate di dettaglio (come il controllo del dispositivo o la scansione bluetooth) coprano l'interfaccia principale.

```
AppNavigator (Stack)
├── LoginScreen
├── RegisterScreen
├── ForgotPasswordScreen
└── Main → MainTabNavigator (Custom Tab Bar)
    ├── Home (Stack)
    │   ├── HomeScreen (Dashboard)
    │   ├── RoomDetailScreen
    │   └── [SHARED_SCREENS]*
    ├── Analysis (Stack)
    │   ├── AnalysisScreen
    │   ├── RoomDetailScreen
    │   └── [SHARED_SCREENS]*
    ├── Locks (Stack)
    │   ├── LockScreen
    │   ├── RoomDetailScreen
    │   └── [SHARED_SCREENS]*
    ├── Rooms (Stack)
    │   ├── RoomsScreen
    │   ├── RoomDetailScreen
    │   └── [SHARED_SCREENS]*
    └── User (Stack)
        ├── UserScreen
        ├── RoomDetailScreen
        └── [SHARED_SCREENS]*

*Nota: [SHARED_SCREENS] contiene DeviceScreen, AddDeviceScreen, ScenarioScreen e NotificationsScreen, registrate in ciascuno stack per mantenere la tab bar sempre visibile.
```

---

## Design System (Tema Dark)

Definito centralmente in [theme/index.js](file:///c:/Users/gaiat/OneDrive/Desktop/Academy/app/YourSmartHome/src/theme/index.js), offre una palette dark moderna ad alto contrasto per garantire la migliore leggibilità:

| Token | Valore | Descrizione |
|---|---|---|
| **Background** | `#0D0F14` | Sfondo principale dell'app (dark navy) |
| **Surface** | `#161A23` | Colore dei contenitori e della Tab Bar |
| **Card** | `#1E2330` | Sfondo delle schede dispositivo |
| **Accent** | `#4FC3F7` | Colore dei dettagli attivi (sky blue) |
| **Success** | `#4ADE80` | Indicatore dispositivi ON / operazioni completate |
| **Warning** | `#FBBF24` | Avvisi di livello medio (es. budget energetico quasi esaurito) |
| **Danger** | `#F87171` | Allarmi di sicurezza e pulsanti distruttivi |

---

## Schermate implementate in Dettaglio

| Schermata | Wireframe di riferimento | Funzionalità incluse |
|---|---|---|
| **LoginScreen** | Welcome/Login | Autenticazione email e password, pulsante di accesso ed opzione "Remember Me". |
| **RegisterScreen** | Registration | Form di registrazione account con inserimento credenziali ed accettazione condizioni. |
| **ForgotPasswordScreen** | Forgot Password | Recupero credenziali tramite invio codice temporaneo e reimpostazione password. |
| **HomeScreen** | Home (Dashboard) | Mostra i sensori meteo, temperatura della casa, controllo rapido dei dispositivi preferiti e attivazione scenari. |
| **AddDeviceScreen** | Add device | Scanner Bluetooth fittizio con cerchi concentrici animati per l'aggiunta di nuovi moduli domotici. |
| **RoomsScreen** | Rooms list | Lista delle stanze configurate con contatore dei dispositivi attivi in tempo reale. |
| **RoomDetailScreen** | Room Detail | Focus sulla singola stanza, con lista dei dispositivi e controllo massivo. |
| **DeviceScreen** | Device Control | Controllo del singolo dispositivo (slider luminosità/temperatura, timer spegnimento, programmazione oraria). |
| **ScenarioScreen** | Scenarios | Gestione scenari (Cinema, Party, Fuori casa) con sequenze di azioni preimpostate. |
| **AnalysisScreen** | Analysis | Dashboard energetica con grafici a barre dei consumi e classifica dei dispositivi più energivori. |
| **LockScreen** | Locks | Pannello di controllo delle porte e finestre con tastiera numerica per lo sblocco tramite **sfida PIN**. |
| **NotificationsScreen** | Notifications | Centro messaggi ordinati cronologicamente (Allarmi di sicurezza, superamento soglie consumi). |
| **UserScreen** | Profile / Settings | Modifica password, impostazione del budget energetico del gruppo, PIN di sicurezza e logout. |

---

## Setup e Avvio dell'Applicazione

### Prerequisiti
- **Node.js** versione 18 o superiore.
- Applicazione mobile **Expo Go** installata sul proprio smartphone (disponibile su Google Play Store e Apple App Store) oppure un simulatore/emulatore configurato (Xcode / Android Studio).

### Installazione delle Dipendenze

Posizionarsi nella cartella del progetto frontend ed eseguire:

```bash
npm install
```

### Configurazione API del Backend

Modifica l'indirizzo IP del server all'interno di [src/services/api.js](file:///c:/Users/gaiat/OneDrive/Desktop/Academy/app/YourSmartHome/src/services/api.js) inserendo l'indirizzo locale della tua macchina che esegue il backend (es. `http://localhost:3000/api`).

### Avvio in locale

Per avviare il server di sviluppo Expo:

```bash
npm start
```

Verrà mostrato un **QR Code** nel terminale. Scansionalo con la fotocamera del tuo smartphone (iOS) o tramite l'app Expo Go (Android) per aprire l'applicazione sul tuo dispositivo in tempo reale.
Alternativamente, premi `a` per avviarlo su emulatore Android o `i` per il simulatore iOS.
