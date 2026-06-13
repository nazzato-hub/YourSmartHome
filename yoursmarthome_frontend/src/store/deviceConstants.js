// Costanti dispositivi — file separato per evitare problemi di import circolare
// con Hermes/Metro bundler

export const DEVICE_TYPES = {
  ILLUMINAZIONE:     'Illuminazione',
  PORTA_PRINCIPALE:  'Porta_Principale',
  TERMOSTATO:        'Termostato',
  TAPPARELLE:        'Tapparelle',
  VIDEOSORVEGLIANZA: 'Videosorveglianza',
  ALTRO:             'Altro',
};

export const DEVICE_ICONS = {
  Illuminazione:    'lightbulb-on',
  Porta_Principale: 'door-closed',
  Termostato:       'thermometer',
  Tapparelle:       'window-shutter',
  Videosorveglianza:'cctv',
  Sensore_Presenza: 'motion-sensor',
  Altro:            'devices',
};

export const DEVICE_ICONS_OFF = {
  Illuminazione:    'lightbulb-outline',
  Porta_Principale: 'door-closed-lock',
  Termostato:       'thermometer-low',
  Tapparelle:       'window-shutter-open',
  Videosorveglianza:'cctv',
  Sensore_Presenza: 'motion-sensor-off',
  Altro:            'devices',
};

export const ROOM_ICONS = {
  '🛋️': 'sofa',
  '🛏️': 'bed',
  '🍳': 'stove',
  '🚿': 'shower',
  '🚗': 'garage',
  '🌿': 'tree',
  'sofa': 'sofa',
  'bed': 'bed',
  'stove': 'stove',
  'shower': 'shower',
  'garage': 'garage',
  'tree': 'tree',
};

export const getRoomIcon = (iconStr) => {
  return ROOM_ICONS[iconStr] || 'home';
};

export const SCENARIO_ICONS = {
  '🎬': 'lightning-bolt',
  '⚡': 'lightning-bolt',
  '⭕': 'circle-outline',
  'lightning-bolt': 'lightning-bolt',
  'circle-outline': 'circle-outline',
};

export const getScenarioIcon = (iconStr) => {
  return SCENARIO_ICONS[iconStr] || 'lightning-bolt';
};



