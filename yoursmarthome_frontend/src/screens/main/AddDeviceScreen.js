import React, { useState, useEffect, useRef } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, Animated, ScrollView, Alert,
  TextInput,
} from 'react-native';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../theme';
import AppHeader from '../../components/AppHeader';
import { useDeviceStore } from '../../store/DeviceStore';

const TEMPLATE_DEVICES = [
  { name: 'Lampada Soggiorno', type: 'Illuminazione', icon: '💡' },
  { name: 'Lampadario smart', type: 'Illuminazione', icon: '💡' },
  { name: 'Striscia LED RGB', type: 'Illuminazione', icon: '💡' },
  { name: 'Faretto dimmerabile', type: 'Illuminazione', icon: '💡' },
  { name: 'Termostato Nest', type: 'Termostato', icon: '🌡️' },
  { name: 'Climatizzatore Daikin', type: 'Termostato', icon: '🌡️' },
  { name: 'Sensore temperatura', type: 'Termostato', icon: '🌡️' },
  { name: 'Serratura Yale', type: 'Porta_Principale', icon: '🔒' },
  { name: 'Porta blindata smart', type: 'Porta_Principale', icon: '🔒' },
  { name: 'Apri-garage Meross', type: 'Porta_Principale', icon: '🔒' },
  { name: 'Tapparella Somfy Soggiorno', type: 'Tapparelle', icon: '🪟' },
  { name: 'Tapparella Cucina', type: 'Tapparelle', icon: '🪟' },
  { name: 'Telecamera Ezviz', type: 'Videosorveglianza', icon: '📷' },
  { name: 'Arlo Ultra Cam', type: 'Videosorveglianza', icon: '📷' },
  { name: 'Videocitofono Ring', type: 'Videosorveglianza', icon: '📷' },
  { name: 'Sensore movimento Ingresso', type: 'Sensore_Presenza', icon: '🏃' },
  { name: 'Sensore presenza Corridoio', type: 'Sensore_Presenza', icon: '🏃' },
  { name: 'Smart Plug TP-Link', type: 'Altro', icon: '🔌' },
  { name: 'Purificatore Dyson', type: 'Altro', icon: '📺' },
  { name: 'Smart TV LG', type: 'Altro', icon: '📺' },
  { name: 'Diffusore Sonos', type: 'Altro', icon: '📺' },
  { name: 'Deumidificatore Xiaomi', type: 'Altro', icon: '📺' },
];

const MANUAL_DEVICE_TYPES = [
  { key: 'Illuminazione', name: 'Luce', icon: '💡', defaultPower: '15' },
  { key: 'Termostato', name: 'Termostato', icon: '🌡️', defaultPower: '800' },
  { key: 'Videosorveglianza', name: 'Telecamera', icon: '📷', defaultPower: '12' },
  { key: 'Porta_Principale', name: 'Serratura', icon: '🔒', defaultPower: '5' },
  { key: 'Tapparelle', name: 'Tapparelle', icon: '🪟', defaultPower: '110' },
  { key: 'Sensore_Presenza', name: 'Sensore Presenza', icon: '🏃', defaultPower: '1' },
  { key: 'Altro', name: 'Altro', icon: '🔌', defaultPower: '50' },
];


export default function AddDeviceScreen({ navigation }) {
  const { addNewDevice, rooms } = useDeviceStore();
  const [mode, setMode] = useState('automatic'); // 'automatic' or 'manual'

  // Automatic Scan States
  const [scanning, setScanning] = useState(false);
  const [foundDevices, setFoundDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const ring1 = useRef(new Animated.Value(0.4)).current;
  const ring2 = useRef(new Animated.Value(0.6)).current;
  const ring3 = useRef(new Animated.Value(0.8)).current;

  // Manual States
  const [manualName, setManualName] = useState('');
  const [manualType, setManualType] = useState('Illuminazione');
  const [manualConsumption, setManualConsumption] = useState('15');
  const [manualRoomId, setManualRoomId] = useState(null);
  const [focusedField, setFocusedField] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (scanning && mode === 'automatic') {
      // Pulse animation for BT icon
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.15, duration: 700, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
        ])
      ).start();

      // Ripple rings
      const ripple = (anim, delay) =>
        Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(anim, { toValue: 1, duration: 1800, useNativeDriver: true }),
            Animated.timing(anim, { toValue: 0.3, duration: 0, useNativeDriver: true }),
          ])
        ).start();

      ripple(ring1, 0);
      ripple(ring2, 600);
      ripple(ring3, 1200);

      // Simulate finding 6 random devices from templates
      const shuffled = [...TEMPLATE_DEVICES].sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, 6).map((item, idx) => ({
        id: 'temp_' + Date.now() + '_' + idx,
        name: item.name,
        type: item.type,
        icon: item.icon,
        signal: Math.floor(Math.random() * (99 - 50 + 1)) + 50,
      }));

      const timer = setTimeout(() => {
        setFoundDevices(selected);
      }, 2000);
      return () => clearTimeout(timer);
    } else {
      pulseAnim.setValue(1);
      ring1.setValue(0.4);
      ring2.setValue(0.6);
      ring3.setValue(0.8);
      setFoundDevices([]);
      setSelectedDevice(null);
      setSelectedRoomId(null);
    }
  }, [scanning, mode]);

  const handlePair = async () => {
    if (selectedDevice) {
      setLoading(true);
      try {
        let consumption = 15;
        if (selectedDevice.type === 'Termostato') consumption = 800;
        else if (selectedDevice.type === 'Tapparelle') consumption = 110;

        await addNewDevice({
          name: selectedDevice.name,
          type: selectedDevice.type,
          consumption: consumption,
          roomId: selectedRoomId,
          dettagli: {}
        });
        navigation.goBack();
      } catch (e) {
        Alert.alert("Errore", "Errore associazione: " + e.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleManualAdd = async () => {
    if (!manualName.trim()) {
      Alert.alert("Errore", "Inserisci il nome del dispositivo");
      return;
    }
    
    const consumptionNum = parseFloat(manualConsumption);
    if (isNaN(consumptionNum) || consumptionNum < 0) {
      Alert.alert("Errore", "Inserisci un valore di consumo valido e positivo");
      return;
    }

    setLoading(true);
    try {
      await addNewDevice({
        name: manualName.trim(),
        type: manualType,
        consumption: consumptionNum,
        roomId: manualRoomId,
        dettagli: {}
      });
      navigation.goBack();
    } catch (e) {
      Alert.alert("Errore", "Impossibile aggiungere il dispositivo: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <AppHeader navigation={navigation} title="Aggiungi dispositivo" showBack />

      {/* Mode Selector Tab */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, mode === 'automatic' && styles.tabButtonActive]}
          onPress={() => setMode('automatic')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabButtonText, mode === 'automatic' && styles.tabButtonTextActive]}>Rilevamento Auto</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, mode === 'manual' && styles.tabButtonActive]}
          onPress={() => setMode('manual')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabButtonText, mode === 'manual' && styles.tabButtonTextActive]}>Inserimento Manuale</Text>
        </TouchableOpacity>
      </View>

      {mode === 'automatic' ? (
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          {/* Scanner UI */}
          <View style={styles.scannerSection}>
            <View style={styles.scannerWrapper}>
              {/* Ripple Rings */}
              <Animated.View style={[styles.ring, styles.ring3, { opacity: ring3 }]} />
              <Animated.View style={[styles.ring, styles.ring2, { opacity: ring2 }]} />
              <Animated.View style={[styles.ring, styles.ring1, { opacity: ring1 }]} />

              {/* BT Center */}
              <Animated.View style={[styles.btCircle, { transform: [{ scale: pulseAnim }] }]}>
                <MaterialCommunityIcons name="bluetooth" size={18} color={Colors.textSecondary} />
                <Text style={styles.btLabel}>BT</Text>
              </Animated.View>

              {/* Device Type Hints */}
              {scanning && (
                <>
                  <View style={[styles.deviceHint, { top: 30, left: 30 }]}>
                    <View style={{flexDirection:'row',alignItems:'center',gap:4}}><MaterialCommunityIcons name="lightbulb-outline" size={14} color={Colors.textMuted} /><Text style={styles.deviceHintText}>Luce</Text></View>
                  </View>
                  <View style={[styles.deviceHint, { top: 30, right: 30 }]}>
                    <View style={{flexDirection:'row',alignItems:'center',gap:4}}><MaterialCommunityIcons name="thermometer" size={14} color={Colors.textMuted} /><Text style={styles.deviceHintText}>Clima</Text></View>
                  </View>
                  <View style={[styles.deviceHint, { bottom: 40, left: '40%' }]}>
                    <View style={{flexDirection:'row',alignItems:'center',gap:4}}><MaterialCommunityIcons name="power-plug-outline" size={14} color={Colors.textMuted} /><Text style={styles.deviceHintText}>Presa</Text></View>
                  </View>
                </>
              )}
            </View>

            <Text style={styles.scanStatus}>
              {scanning
                ? foundDevices.length > 0
                  ? `${foundDevices.length} dispositivi trovati`
                  : 'Ricerca in corso...'
                : 'Premi per iniziare la ricerca'}
            </Text>

            <TouchableOpacity
              style={[styles.scanButton, scanning && styles.scanButtonActive]}
              onPress={() => setScanning(!scanning)}
              activeOpacity={0.85}
            >
              <Text style={styles.scanButtonText}>
                {scanning ? 'Ferma' : 'Avvia scansione'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Found Devices List */}
          {foundDevices.length > 0 && (
            <View style={styles.foundSection}>
              <Text style={styles.foundTitle}>Dispositivi rilevati</Text>
              <View style={{ maxHeight: 220 }}>
                <ScrollView showsVerticalScrollIndicator={false}>
                  {foundDevices.map(device => (
                    <TouchableOpacity
                      key={device.id}
                      style={[styles.foundDevice, selectedDevice?.id === device.id && styles.foundDeviceSelected]}
                      onPress={() => { setSelectedDevice(device); setSelectedRoomId(null); }}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.foundDeviceIcon}>{device.icon}</Text>
                      <View style={styles.foundDeviceInfo}>
                        <Text style={styles.foundDeviceName}>{device.name}</Text>
                        <Text style={styles.foundDeviceType}>{device.type}</Text>
                      </View>
                      <View style={styles.signalBadge}>
                        <Text style={styles.signalText}>{device.signal}%</Text>
                      </View>
                      {selectedDevice?.id === device.id && (
                        <Text style={styles.checkIcon}>✓</Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {selectedDevice && (
                <View style={styles.roomSelectorContainer}>
                  <Text style={styles.roomSelectorTitle}>Assegna a una stanza:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.roomsScroll}>
                    <TouchableOpacity
                      style={[styles.roomChip, selectedRoomId === null && styles.roomChipSelected]}
                      onPress={() => setSelectedRoomId(null)}
                    >
                      <MaterialCommunityIcons name="cube-outline" size={14} color={Colors.textMuted} />
                      <Text style={[styles.roomChipText, selectedRoomId === null && styles.roomChipTextSelected]}>Nessuna stanza</Text>
                    </TouchableOpacity>

                    {rooms.map(room => (
                      <TouchableOpacity
                        key={room.id}
                        style={[styles.roomChip, selectedRoomId === room.id && styles.roomChipSelected]}
                        onPress={() => setSelectedRoomId(room.id)}
                      >
                        <Text style={styles.roomChipIcon}>{room.icon}</Text>
                        <Text style={[styles.roomChipText, selectedRoomId === room.id && styles.roomChipTextSelected]}>{room.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  <TouchableOpacity style={styles.pairButton} onPress={handlePair} activeOpacity={0.85} disabled={loading}>
                    <Text style={styles.pairButtonText}>Connetti "{selectedDevice.name}"</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </ScrollView>
      ) : (
        // Manual form
        <ScrollView style={styles.manualForm} showsVerticalScrollIndicator={false}>
          <Text style={styles.formTitle}>Nuovo Dispositivo</Text>

          {/* Name */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Nome Dispositivo</Text>
            <TextInput
              style={[styles.input, focusedField === 'name' && styles.inputFocused]}
              placeholder="es. Lampada Studio"
              placeholderTextColor={Colors.textMuted}
              value={manualName}
              onChangeText={setManualName}
              onFocus={() => setFocusedField('name')}
              onBlur={() => setFocusedField(null)}
            />
          </View>

          {/* Type Grid */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Tipo Dispositivo</Text>
            <View style={styles.typeGrid}>
              {MANUAL_DEVICE_TYPES.map(item => (
                <TouchableOpacity
                  key={item.key}
                  style={[
                    styles.typeCard,
                    manualType === item.key && styles.typeCardSelected
                  ]}
                  onPress={() => {
                    setManualType(item.key);
                    setManualConsumption(item.defaultPower);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.typeCardIcon}>{item.icon}</Text>
                  <Text style={[
                    styles.typeCardText,
                    manualType === item.key && styles.typeCardTextSelected
                  ]}>{item.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Consumption */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Consumo Stimato (Watt)</Text>
            <TextInput
              style={[styles.input, focusedField === 'consumption' && styles.inputFocused]}
              placeholder="es. 15"
              placeholderTextColor={Colors.textMuted}
              value={manualConsumption}
              onChangeText={setManualConsumption}
              keyboardType="numeric"
              onFocus={() => setFocusedField('consumption')}
              onBlur={() => setFocusedField(null)}
            />
          </View>

          {/* Room Selection */}
          <View style={styles.roomSelectorContainer}>
            <Text style={styles.roomSelectorTitle}>Assegna a una stanza:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.roomsScroll}>
              <TouchableOpacity
                style={[styles.roomChip, manualRoomId === null && styles.roomChipSelected]}
                onPress={() => setManualRoomId(null)}
              >
                <MaterialCommunityIcons name="cube-outline" size={14} color={Colors.textMuted} />
                <Text style={[styles.roomChipText, manualRoomId === null && styles.roomChipTextSelected]}>Nessuna stanza</Text>
              </TouchableOpacity>

              {rooms.map(room => (
                <TouchableOpacity
                  key={room.id}
                  style={[styles.roomChip, manualRoomId === room.id && styles.roomChipSelected]}
                  onPress={() => setManualRoomId(room.id)}
                >
                  <Text style={styles.roomChipIcon}>{room.icon}</Text>
                  <Text style={[styles.roomChipText, manualRoomId === room.id && styles.roomChipTextSelected]}>{room.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Submit */}
          <TouchableOpacity style={styles.submitButton} onPress={handleManualAdd} activeOpacity={0.85} disabled={loading}>
            <Text style={styles.submitButtonText}>Aggiungi Dispositivo</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.card, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  backIcon: { fontSize: 18, color: Colors.textPrimary },
  headerTitle: { ...Typography.heading3 },

  // Scanner
  scannerSection: { alignItems: 'center', paddingVertical: Spacing.lg },
  scannerWrapper: {
    width: 260, height: 260,
    justifyContent: 'center', alignItems: 'center', position: 'relative',
  },
  ring: {
    position: 'absolute', borderRadius: 130,
    borderWidth: 1.5, borderColor: Colors.accent,
  },
  ring1: { width: 200, height: 200 },
  ring2: { width: 240, height: 240 },
  ring3: { width: 260, height: 260 },

  btCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.accentSoft,
    borderWidth: 2, borderColor: Colors.accent,
    justifyContent: 'center', alignItems: 'center',
    ...Shadow.accent,
  },
  btIcon: { fontSize: 20, color: Colors.accent },
  btLabel: { fontSize: 11, fontWeight: '700', color: Colors.accent, letterSpacing: 1 },

  deviceHint: {
    position: 'absolute', backgroundColor: Colors.card,
    borderRadius: Radius.sm, paddingVertical: 4, paddingHorizontal: 8,
    borderWidth: 1, borderColor: Colors.border,
  },
  deviceHintText: { fontSize: 12, color: Colors.textSecondary },

  scanStatus: { ...Typography.body, color: Colors.textMuted, marginTop: Spacing.sm, marginBottom: Spacing.lg },
  scanButton: {
    backgroundColor: Colors.card, borderRadius: Radius.full,
    paddingVertical: 14, paddingHorizontal: 36,
    borderWidth: 1.5, borderColor: Colors.borderLight,
  },
  scanButtonActive: { borderColor: Colors.accent, backgroundColor: Colors.accentSoft },
  scanButtonText: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },

  // Found Devices
  foundSection: { flex: 1, paddingHorizontal: Spacing.lg },
  foundTitle: { ...Typography.label, marginBottom: Spacing.sm },
  foundDevice: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.card, borderRadius: Radius.md,
    padding: Spacing.md, marginBottom: Spacing.sm,
    borderWidth: 1, borderColor: Colors.border,
  },
  foundDeviceSelected: { borderColor: Colors.accent, backgroundColor: Colors.accentSoft },
  foundDeviceIcon: { fontSize: 24, marginRight: Spacing.md },
  foundDeviceInfo: { flex: 1 },
  foundDeviceName: { ...Typography.bodyBold },
  foundDeviceType: { ...Typography.caption, marginTop: 2 },
  signalBadge: {
    backgroundColor: Colors.successSoft, borderRadius: Radius.sm,
    paddingVertical: 2, paddingHorizontal: 6, marginRight: Spacing.sm,
  },
  signalText: { fontSize: 11, fontWeight: '600', color: Colors.success },
  checkIcon: { fontSize: 16, color: Colors.accent, fontWeight: '700' },

  pairButton: {
    backgroundColor: Colors.accent, borderRadius: Radius.full,
    paddingVertical: 14, alignItems: 'center', marginTop: Spacing.xs, ...Shadow.accent,
  },
  pairButtonText: { fontSize: 15, fontWeight: '700', color: Colors.background },

  roomSelectorContainer: { marginTop: Spacing.sm, paddingVertical: Spacing.xs },
  roomSelectorTitle: { ...Typography.label, marginBottom: Spacing.xs, fontSize: 12 },
  roomsScroll: { flexDirection: 'row', marginBottom: Spacing.sm },
  roomChip: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card,
    borderRadius: Radius.full, paddingVertical: 6, paddingHorizontal: 12,
    marginRight: Spacing.sm, borderWidth: 1, borderColor: Colors.border, gap: 4, height: 32
  },
  roomChipSelected: {
    backgroundColor: Colors.accentSoft, borderColor: Colors.accent
  },
  roomChipIcon: { fontSize: 13 },
  roomChipText: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500' },
  roomChipTextSelected: { color: Colors.accent, fontWeight: '700' },

  // Tabs
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: Radius.full,
    padding: 4,
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: Radius.full,
  },
  tabButtonActive: {
    backgroundColor: Colors.accent,
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  tabButtonTextActive: {
    color: Colors.background,
    fontWeight: '700',
  },

  // Manual Form
  manualForm: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  formTitle: {
    ...Typography.heading2,
    marginBottom: Spacing.md,
  },
  fieldGroup: {
    marginBottom: Spacing.md,
  },
  fieldLabel: {
    ...Typography.label,
    marginBottom: Spacing.xs,
  },
  input: {
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    paddingVertical: 12,
    paddingHorizontal: Spacing.md,
    color: Colors.textPrimary,
    fontSize: 15,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  inputFocused: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accentSoft,
  },
  
  // Type Grid
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    justifyContent: 'space-between',
  },
  typeCard: {
    width: '31%',
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.xs,
  },
  typeCardSelected: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accentSoft,
  },
  typeCardIcon: {
    fontSize: 22,
    marginBottom: 4,
  },
  typeCardText: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  typeCardTextSelected: {
    color: Colors.accent,
    fontWeight: '700',
  },

  submitButton: {
    backgroundColor: Colors.accent,
    borderRadius: Radius.full,
    paddingVertical: 16,
    alignItems: 'center',
    marginVertical: Spacing.md,
    ...Shadow.accent,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.background,
  },
});
