# YourSmartHome — React Native App

App smart home basata sul wireframe fornito, con tema dark moderno e navigazione completa.

---

## Struttura file

```
YourSmartHome/
├── App.js                          # Entry point
├── package.json                    # Dipendenze
└── src/
    ├── theme/
    │   └── index.js                # Colori, tipografia, spaziatura, ombre
    ├── components/
    │   └── index.js                # Componenti riutilizzabili (DeviceCard, Toggle, ecc.)
    ├── navigation/
    │   ├── AppNavigator.js         # Root navigator (auth + main)
    │   └── MainTabNavigator.js     # Tab bar + stack navigators interni
    └── screens/
        ├── auth/
        │   ├── LoginScreen.js      # Schermata Welcome/Login
        │   └── RegisterScreen.js   # Schermata Registrazione
        └── main/
            ├── HomeScreen.js       # Dashboard principale
            ├── AddDeviceScreen.js  # Aggiunta dispositivo (scanner BT)
            ├── RoomsScreen.js      # Lista stanze
            ├── RoomDetailScreen.js # Dettaglio stanza
            ├── DeviceScreen.js     # Controllo dispositivo singolo
            ├── ScenarioScreen.js   # Gestione scenari
            ├── AnalysisScreen.js   # Analisi consumi
            └── UserScreen.js       # Profilo utente e impostazioni
```

---

## Flusso di navigazione

```
AppNavigator (Stack)
├── LoginScreen
├── RegisterScreen
└── Main → MainTabNavigator (Tab)
    ├── Home (Stack)
    │   ├── HomeScreen (Dashboard)
    │   ├── AddDeviceScreen
    │   ├── DeviceScreen
    │   └── ScenarioScreen
    ├── AnalysisScreen
    ├── Rooms (Stack)
    │   ├── RoomsScreen
    │   ├── RoomDetailScreen
    │   ├── DeviceScreen
    │   └── AddDeviceScreen
    └── UserScreen
```

---

## Setup e avvio

### Prerequisiti
- Node.js ≥ 18
- Expo CLI: `npm install -g expo-cli`

### Installazione
```bash
cd YourSmartHome
npm install
```

### Avvio
```bash
npx expo start
```
Poi scansiona il QR con **Expo Go** (iOS/Android) o premi `i` per iOS simulator / `a` per Android emulator.

---

## Design System

| Token         | Valore                |
|---------------|-----------------------|
| Background    | `#0D0F14` (dark navy) |
| Surface       | `#161A23`             |
| Card          | `#1E2330`             |
| Accent        | `#4FC3F7` (sky blue)  |
| Success       | `#4ADE80` (green)     |
| Warning       | `#FBBF24` (amber)     |
| Danger        | `#F87171` (red)       |

---

## Schermate implementate

| Schermata       | Wireframe         | Note                                         |
|-----------------|-------------------|----------------------------------------------|
| LoginScreen     | Welcome/Login     | Email, password, link a registrazione        |
| RegisterScreen  | Registration      | Email, password, checkbox "ricorda i dati"   |
| HomeScreen      | Home              | Temperatura, dispositivi, filtri, scenari    |
| AddDeviceScreen | Add device        | Scanner BT animato con ripple rings          |
| RoomsScreen     | Room example      | Lista stanze con anteprima dispositivi       |
| RoomDetailScreen| Room example      | Dettaglio stanza con controlli               |
| DeviceScreen    | Device example    | Toggle, intensità, consumo, timer/pianifica  |
| ScenarioScreen  | Scenary           | Cinema, Party, Away Mode + aggiungi          |
| AnalysisScreen  | Analysis (tab)    | Grafici a barre, top dispositivi             |
| UserScreen      | User (tab)        | Profilo, impostazioni, toggle, logout        |
