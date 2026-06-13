import React from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Colors, Spacing, Radius, Shadow } from '../theme';

import HomeScreen          from '../screens/main/HomeScreen';
import AnalysisScreen      from '../screens/main/AnalysisScreen';
import RoomsScreen         from '../screens/main/RoomsScreen';
import RoomDetailScreen    from '../screens/main/RoomDetailScreen';
import UserScreen          from '../screens/main/UserScreen';
import AddDeviceScreen     from '../screens/main/AddDeviceScreen';
import DeviceScreen        from '../screens/main/DeviceScreen';
import ScenarioScreen      from '../screens/main/ScenarioScreen';
import LockScreen          from '../screens/main/LockScreen';
import NotificationsScreen from '../screens/main/NotificationsScreen';

const Tab  = createBottomTabNavigator();

// Ogni tab ha il proprio stack così la tab bar rimane sempre visibile
// (punto 1: collegare ogni pagina alla navbar)
const HomeStack     = createNativeStackNavigator();
const AnalysisStack = createNativeStackNavigator();
const LockStack     = createNativeStackNavigator();
const RoomsStack    = createNativeStackNavigator();
const UserStack     = createNativeStackNavigator();

// Tutte le screen condivise (Device, AddDevice, Scenarios, Notifications)
// vengono registrate in ogni stack così la tab bar non scompare mai.
const SHARED_SCREENS = (Stack) => (
  <>
    <Stack.Screen name="Device"        component={DeviceScreen} />
    <Stack.Screen name="AddDevice"     component={AddDeviceScreen} />
    <Stack.Screen name="Scenarios"     component={ScenarioScreen} />
    <Stack.Screen name="Notifications" component={NotificationsScreen} />
  </>
);

function HomeStackScreen() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="Dashboard"  component={HomeScreen} />
      <HomeStack.Screen name="RoomDetail" component={RoomDetailScreen} />
      {SHARED_SCREENS(HomeStack)}
    </HomeStack.Navigator>
  );
}

function AnalysisStackScreen() {
  return (
    <AnalysisStack.Navigator screenOptions={{ headerShown: false }}>
      <AnalysisStack.Screen name="AnalysisMain" component={AnalysisScreen} />
      <AnalysisStack.Screen name="RoomDetail"   component={RoomDetailScreen} />
      {SHARED_SCREENS(AnalysisStack)}
    </AnalysisStack.Navigator>
  );
}

function LockStackScreen() {
  return (
    <LockStack.Navigator screenOptions={{ headerShown: false }}>
      <LockStack.Screen name="LockMain"   component={LockScreen} />
      <LockStack.Screen name="RoomDetail" component={RoomDetailScreen} />
      {SHARED_SCREENS(LockStack)}
    </LockStack.Navigator>
  );
}

function RoomsStackScreen() {
  return (
    <RoomsStack.Navigator screenOptions={{ headerShown: false }}>
      <RoomsStack.Screen name="RoomsList"  component={RoomsScreen} />
      <RoomsStack.Screen name="RoomDetail" component={RoomDetailScreen} />
      {SHARED_SCREENS(RoomsStack)}
    </RoomsStack.Navigator>
  );
}

function UserStackScreen() {
  return (
    <UserStack.Navigator screenOptions={{ headerShown: false }}>
      <UserStack.Screen name="UserMain"   component={UserScreen} />
      <UserStack.Screen name="RoomDetail" component={RoomDetailScreen} />
      {SHARED_SCREENS(UserStack)}
    </UserStack.Navigator>
  );
}

/* ─── Custom Tab Bar ──────────────────────────────────────────────────────── */
const TABS = [
  { label: 'Home',      icon: 'home-variant' },
  { label: 'Analisi',   icon: 'chart-bar' },
  { label: 'Serrature', icon: 'lock' },
  { label: 'Stanze',    icon: 'floor-plan' },
  { label: 'Profilo',   icon: 'account-circle' },
];

function CustomTabBar({ state, descriptors, navigation }) {
  return (
    <View style={styles.tabBar}>
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;
        const tab = TABS[index];
        return (
          <TouchableOpacity
            key={route.key}
            style={styles.tabItem}
            onPress={() => navigation.navigate(route.name)}
            activeOpacity={0.7}
          >
            <View style={[styles.tabIconWrap, isFocused && styles.tabIconWrapActive]}>
              <MaterialCommunityIcons name={tab.icon} size={20} color={isFocused ? Colors.accent : Colors.textMuted} />
            </View>
            <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

/* ─── Main export ─────────────────────────────────────────────────────────── */
export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home"     component={HomeStackScreen} />
      <Tab.Screen name="Analysis" component={AnalysisStackScreen} />
      <Tab.Screen name="Locks"    component={LockStackScreen} />
      <Tab.Screen name="Rooms"    component={RoomsStackScreen} />
      <Tab.Screen name="User"     component={UserStackScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row', backgroundColor: Colors.navBar,
    paddingBottom: 20, paddingTop: 10, paddingHorizontal: Spacing.sm,
    borderTopWidth: 1, borderTopColor: Colors.border, ...Shadow.card,
  },
  tabItem: { flex: 1, alignItems: 'center', gap: 3 },
  tabIconWrap: {
    width: 42, height: 30, borderRadius: 15,
    justifyContent: 'center', alignItems: 'center',
  },
  tabIconWrapActive: { backgroundColor: Colors.accentSoft },
  tabLabel: { fontSize: 9, fontWeight: '500', color: Colors.textMuted },
  tabLabelActive: { color: Colors.accent, fontWeight: '700' },
});
