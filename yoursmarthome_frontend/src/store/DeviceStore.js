import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { DEVICE_TYPES, DEVICE_ICONS } from './deviceConstants';
import { api, getGruppo } from '../services/api';

export { DEVICE_TYPES, DEVICE_ICONS };

// Helper per generare i sottotitoli delle schede dei dispositivi
function getSubtitleForDevice(d) {
  let sub = '';
  if (d.tipo_dispositivo === 'Illuminazione') {
    sub = d.stato_attuale ? `Intensità ${d.dettagli?.intensita || 100}%` : 'Spenta';
  } else if (d.tipo_dispositivo === 'Termostato') {
    sub = `${d.dettagli?.temperatura_impostata || 20}°C`;
  } else if (d.tipo_dispositivo === 'Tapparelle') {
    sub = d.stato_attuale ? `${d.dettagli?.percentuale_apertura || 50}%` : 'Chiusa';
  } else if (d.tipo_dispositivo === 'Videosorveglianza') {
    sub = d.stato_attuale ? 'Registrazione ON' : 'Registrazione OFF';
  } else if (d.tipo_dispositivo === 'Porta_Principale') {
    sub = d.dettagli?.stato_serratura === 'chiusa' ? 'Chiusa' : 'Aperta';
  } else {
    sub = d.stato_attuale ? 'Acceso' : 'Spento';
  }

  // Active timer/schedule reminder
  const reminders = [];
  const timer = d.timer_minuti !== undefined && d.timer_minuti !== null ? d.timer_minuti : d.timerMinuti;
  const sAttivo = d.sched_attivo !== undefined && d.sched_attivo !== null ? d.sched_attivo : d.schedAttivo;
  
  if (timer) {
    reminders.push(`Timer: ${timer}m`);
  }
  if (sAttivo) {
    const acc = d.sched_accensione || d.schedAccensione || '07:00';
    const speg = d.sched_spegnimento || d.schedSpegnimento || '23:30';
    reminders.push(`Prog: ${acc}-${speg}`);
  }
  if (reminders.length > 0) {
    sub += ` (${reminders.join(' · ')})`;
  }
  return sub;
}

// Reducer per la gestione dello stato locale sincrono
function reducer(state, action) {
  switch (action.type) {
    case 'SET_DATA':
      return {
        ...state,
        rooms: action.rooms || state.rooms,
        devices: action.devices || state.devices,
        groupId: action.groupId !== undefined ? action.groupId : state.groupId,
      };

    case 'TOGGLE_DEVICE':
      return {
        ...state,
        devices: state.devices.map(function(d) {
          return d.id === action.id ? Object.assign({}, d, { isOn: !d.isOn }) : d;
        }),
      };
    case 'UPDATE_DEVICE':
      return {
        ...state,
        devices: state.devices.map(function(d) {
          return d.id === action.id ? Object.assign({}, d, action.payload) : d;
        }),
      };
    case 'ADD_DEVICE_TO_ROOM':
      return {
        ...state,
        devices: state.devices.map(function(d) {
          return d.id === action.deviceId ? Object.assign({}, d, { roomId: action.roomId }) : d;
        }),
      };
    case 'REMOVE_DEVICE_FROM_ROOM':
      return {
        ...state,
        devices: state.devices.map(function(d) {
          return d.id === action.deviceId ? Object.assign({}, d, { roomId: null }) : d;
        }),
      };
    case 'ADD_NEW_DEVICE':
      return {
        ...state,
        devices: state.devices.concat([action.device]),
      };
    case 'ADD_ROOM':
      return {
        ...state,
        rooms: state.rooms.concat([action.room]),
      };
    case 'DELETE_DEVICE':
      return {
        ...state,
        devices: state.devices.filter(function(d) { return d.id !== action.id; }),
      };
    default:
      return state;
  }
}

// ── Context ──────────────────────────────────────────────────────────────────
var DeviceContext = createContext(null);

export function DeviceProvider(props) {
  var children = props.children;
  var result = useReducer(reducer, { rooms: [], devices: [], groupId: null });
  var state = result[0];
  var dispatch = result[1];

  // Caricamento asincrono di stanze e dispositivi dal Back-end
  var loadData = useCallback(
    async function() {
      try {
        const activeGroup = getGruppo ? getGruppo() : null;
        const dbRooms = await api.getRooms();
        const mappedRooms = dbRooms.map(r => ({
          id: String(r.id_stanza),
          name: r.nome,
          icon: r.icona,
        }));

        const dbDevices = await api.getDevices();
        const mappedDevices = dbDevices.map(d => ({
          id: String(d.id_dispositivo),
          roomId: d.id_stanza ? String(d.id_stanza) : null,
          room: d.nome_stanza || null,
          name: d.nome,
          type: d.tipo_dispositivo,
          icon: DEVICE_ICONS[d.tipo_dispositivo] || 'devices',
          isOn: d.stato_attuale,
          subtitle: getSubtitleForDevice(d),
          consumption: d.consumo_watt,
          dettagli: d.dettagli || {},
          timerMinuti: d.timer_minuti,
          schedAttivo: d.sched_attivo,
          schedGiorni: d.sched_giorni,
          schedAccensione: d.sched_accensione,
          schedSpegnimento: d.sched_spegnimento,
        }));

        dispatch({ type: 'SET_DATA', rooms: mappedRooms, devices: mappedDevices, groupId: activeGroup });
      } catch (e) {
        console.warn("loadData error:", e.message);
      }
    },
    [dispatch]
  );


  var getDevicesForRoom = useCallback(
    function(roomId) {
      return state.devices.filter(function(d) { return d.roomId === roomId; });
    },
    [state.devices]
  );

  var getRoomStats = useCallback(
    function(roomId) {
      var devs = state.devices.filter(function(d) { return d.roomId === roomId; });
      return { total: devs.length, active: devs.filter(function(d) { return d.isOn; }).length };
    },
    [state.devices]
  );

  // Azioni asincrone con persistenza su Database
  var toggleDevice = useCallback(
    async function(id) {
      try {
        // Esegue l'aggiornamento ottimistico o attendi la risposta
        const updated = await api.toggleDevice(id);
        const mapped = {
          id: String(updated.id_dispositivo),
          roomId: updated.id_stanza ? String(updated.id_stanza) : null,
          room: updated.nome_stanza || null,
          name: updated.nome,
          type: updated.tipo_dispositivo,
          icon: DEVICE_ICONS[updated.tipo_dispositivo] || 'devices',
          isOn: updated.stato_attuale,
          subtitle: getSubtitleForDevice(updated),
          consumption: updated.consumo_watt,
          dettagli: updated.dettagli || {},
          timerMinuti: updated.timer_minuti,
          schedAttivo: updated.sched_attivo,
          schedGiorni: updated.sched_giorni,
          schedAccensione: updated.sched_accensione,
          schedSpegnimento: updated.sched_spegnimento,
        };
        dispatch({ type: 'UPDATE_DEVICE', id: id, payload: mapped });
      } catch (e) {
        console.warn("toggleDevice error:", e.message);
      }
    },
    [dispatch]
  );

  var updateDevice = useCallback(
    async function(id, payload) {
      try {
        const body = {};
        if (payload.name) body.nome = payload.name;
        if (payload.consumption !== undefined) body.consumoWatt = payload.consumption;
        if (payload.roomId !== undefined) body.idStanza = payload.roomId ? parseInt(payload.roomId) : null;
        if (payload.isOn !== undefined) body.statoAttuale = payload.isOn;
        if (payload.dettagli) body.dettagli = payload.dettagli;
        if (payload.timerMinuti !== undefined) body.timerMinuti = payload.timerMinuti;
        if (payload.schedAttivo !== undefined) body.schedAttivo = payload.schedAttivo;
        if (payload.schedGiorni !== undefined) body.schedGiorni = payload.schedGiorni;
        if (payload.schedAccensione !== undefined) body.schedAccensione = payload.schedAccensione;
        if (payload.schedSpegnimento !== undefined) body.schedSpegnimento = payload.schedSpegnimento;

        const updated = await api.updateDevice(id, body);
        const mapped = {
          id: String(updated.id_dispositivo),
          roomId: updated.id_stanza ? String(updated.id_stanza) : null,
          room: updated.nome_stanza || null,
          name: updated.nome,
          type: updated.tipo_dispositivo,
          icon: DEVICE_ICONS[updated.tipo_dispositivo] || 'devices',
          isOn: updated.stato_attuale,
          subtitle: getSubtitleForDevice(updated),
          consumption: updated.consumo_watt,
          dettagli: updated.dettagli || {},
          timerMinuti: updated.timer_minuti,
          schedAttivo: updated.sched_attivo,
          schedGiorni: updated.sched_giorni,
          schedAccensione: updated.sched_accensione,
          schedSpegnimento: updated.sched_spegnimento,
        };
        dispatch({ type: 'UPDATE_DEVICE', id: id, payload: mapped });
      } catch (e) {
        console.warn("updateDevice error:", e.message);
      }
    },
    [dispatch]
  );

  var addDeviceToRoom = useCallback(
    async function(deviceId, roomId) {
      try {
        await api.updateDevice(deviceId, { idStanza: parseInt(roomId) });
        dispatch({ type: 'ADD_DEVICE_TO_ROOM', deviceId: deviceId, roomId: roomId });
      } catch (e) {
        console.warn("addDeviceToRoom error:", e.message);
      }
    },
    [dispatch]
  );

  var removeDeviceFromRoom = useCallback(
    async function(deviceId) {
      try {
        await api.updateDevice(deviceId, { idStanza: null });
        dispatch({ type: 'REMOVE_DEVICE_FROM_ROOM', deviceId: deviceId });
      } catch (e) {
        console.warn("removeDeviceFromRoom error:", e.message);
      }
    },
    [dispatch]
  );

  var addNewDevice = useCallback(
    async function(device) {
      try {
        const body = {
          nome: device.name,
          tipodispositivo: device.type,
          idStanza: device.roomId ? parseInt(device.roomId) : null,
          consumoWatt: device.consumption || 0,
          dettagli: device.dettagli || {},
        };
        const added = await api.addDevice(body);
        const mapped = {
          id: String(added.id_dispositivo),
          roomId: added.id_stanza ? String(added.id_stanza) : null,
          room: added.nome_stanza || null,
          name: added.nome,
          type: added.tipo_dispositivo,
          icon: DEVICE_ICONS[added.tipo_dispositivo] || 'devices',
          isOn: added.stato_attuale,
          subtitle: getSubtitleForDevice(added),
          consumption: added.consumo_watt,
          dettagli: added.dettagli || {},
          timerMinuti: added.timer_minuti,
          schedAttivo: added.sched_attivo,
          schedGiorni: added.sched_giorni,
          schedAccensione: added.sched_accensione,
          schedSpegnimento: added.sched_spegnimento,
        };
        dispatch({ type: 'ADD_NEW_DEVICE', device: mapped });
      } catch (e) {
        console.warn("addNewDevice error:", e.message);
        throw e;
      }
    },
    [dispatch]
  );

  var addNewRoom = useCallback(
    async function(roomName, icon) {
      try {
        const added = await api.addRoom({ nome: roomName, icona: icon || 'home' });
        const mapped = {
          id: String(added.id_stanza),
          name: added.nome,
          icon: added.icona,
        };
        dispatch({ type: 'ADD_ROOM', room: mapped });
      } catch (e) {
        console.warn("addNewRoom error:", e.message);
        throw e;
      }
    },
    [dispatch]
  );

  var deleteDevice = useCallback(
    async function(id) {
      try {
        await api.deleteDevice(id);
        dispatch({ type: 'DELETE_DEVICE', id: id });
      } catch (e) {
        console.warn("deleteDevice error:", e.message);
        throw e;
      }
    },
    [dispatch]
  );

  var value = {
    rooms: state.rooms,
    devices: state.devices,
    groupId: state.groupId,
    loadData: loadData,
    getDevicesForRoom: getDevicesForRoom,
    getRoomStats: getRoomStats,
    toggleDevice: toggleDevice,
    updateDevice: updateDevice,
    addDeviceToRoom: addDeviceToRoom,
    removeDeviceFromRoom: removeDeviceFromRoom,
    addNewDevice: addNewDevice,
    addNewRoom: addNewRoom,
    deleteDevice: deleteDevice,
    DEVICE_TYPES: DEVICE_TYPES,
    DEVICE_ICONS: DEVICE_ICONS,
  };


  return React.createElement(DeviceContext.Provider, { value: value }, children);
}

export function useDeviceStore() {
  var ctx = useContext(DeviceContext);
  if (ctx === null || ctx === undefined) {
    throw new Error('useDeviceStore must be used inside DeviceProvider');
  }
  return ctx;
}
