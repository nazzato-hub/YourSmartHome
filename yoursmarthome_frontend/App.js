
import React from 'react';
import AppNavigator from './src/navigation/AppNavigator';
import { DeviceProvider } from './src/store/DeviceStore';

export default function App() {
  return (
    <DeviceProvider>
      <AppNavigator />
    </DeviceProvider>
  );
}

