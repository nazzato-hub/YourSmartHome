import React from 'react';
import AppNavigator from './src/navigation/AppNavigator';
import { DeviceProvider } from './src/store/DeviceStore';
import * as Notifications from 'expo-notifications';

// Configura come gestire le notifiche quando l'app è in primo piano
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function App() {
  return (
    <DeviceProvider>
      <AppNavigator />
    </DeviceProvider>
  );
}

