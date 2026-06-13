import React, { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, Animated, StyleSheet, Switch,
} from 'react-native';
import { Colors, Radius, Spacing, Shadow, Typography } from '../theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getRoomIcon, getScenarioIcon } from '../store/deviceConstants';

/* ─── SmartToggle ─── */
export function SmartToggle({ value, onValueChange }) {
  return (
    <Switch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: Colors.cardAlt, true: Colors.accentSoft }}
      thumbColor={value ? Colors.accent : Colors.textMuted}
      ios_backgroundColor={Colors.cardAlt}
    />
  );
}

/* ─── DeviceCard — now tappable, navigates to DeviceScreen ─── */
export function DeviceCard({ name, icon, isOn, onToggle, subtitle, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.deviceCard, isOn && styles.deviceCardActive]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.deviceCardTop}>
        <View style={[styles.deviceIcon, isOn && styles.deviceIconActive]}>
          <MaterialCommunityIcons name={icon} size={22} color={isOn ? Colors.accent : Colors.textMuted} />
        </View>
        <SmartToggle value={isOn} onValueChange={onToggle} />
      </View>
      <Text style={styles.deviceName} numberOfLines={1}>{name}</Text>
      {subtitle ? <Text style={styles.deviceSub} numberOfLines={1}>{subtitle}</Text> : null}
      {isOn && <View style={styles.activePill}><Text style={styles.activePillText}>ON</Text></View>}
    </TouchableOpacity>
  );
}

/* ─── RoomCard ─── */
export function RoomCard({ name, deviceCount, icon, onPress }) {
  return (
    <TouchableOpacity style={styles.roomCard} onPress={onPress} activeOpacity={0.75}>
      <MaterialCommunityIcons name={getRoomIcon(icon)} size={28} color={Colors.accent} style={{ marginBottom: Spacing.xs }} />
      <Text style={styles.roomName}>{name}</Text>
      <Text style={styles.roomCount}>{deviceCount} dispositivi</Text>
    </TouchableOpacity>
  );
}

/* ─── ScenarioButton ─── */
export function ScenarioButton({ label, icon, isActive, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.scenarioBtn, isActive && styles.scenarioBtnActive]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <MaterialCommunityIcons name={getScenarioIcon(icon)} size={22} color={isActive ? Colors.accent : Colors.textSecondary} style={{ marginBottom: 4 }} />
      <Text style={[styles.scenarioLabel, isActive && styles.scenarioLabelActive]}>{label}</Text>
    </TouchableOpacity>
  );
}


/* ─── SectionHeader ─── */
export function SectionHeader({ title, actionLabel, onAction }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={Typography.heading3}>{title}</Text>
      {actionLabel ? (
        <TouchableOpacity onPress={onAction}>
          <Text style={styles.sectionAction}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  deviceCard: {
    backgroundColor: Colors.card, borderRadius: Radius.lg,
    padding: Spacing.md, width: '47%',
    borderWidth: 1, borderColor: Colors.border, ...Shadow.card,
  },
  deviceCardActive: { borderColor: Colors.accentGlow, backgroundColor: Colors.accentSoft },
  deviceCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  deviceIcon: {
    width: 40, height: 40, borderRadius: Radius.sm,
    backgroundColor: Colors.cardAlt, justifyContent: 'center', alignItems: 'center',
  },
  deviceIconActive: { backgroundColor: Colors.accentGlow + '30' },
  deviceEmoji: { fontSize: 20 },
  deviceName: { ...Typography.bodyBold, marginTop: 2, fontSize: 13 },
  deviceSub: { ...Typography.caption, marginTop: 2 },
  activePill: {
    alignSelf: 'flex-start', marginTop: 5,
    backgroundColor: Colors.accentGlow + '30', borderRadius: Radius.full,
    paddingVertical: 2, paddingHorizontal: 8, borderWidth: 1, borderColor: Colors.accentGlow + '60',
  },
  activePillText: { fontSize: 9, fontWeight: '800', color: Colors.accent, letterSpacing: 1 },

  roomCard: {
    backgroundColor: Colors.card, borderRadius: Radius.lg,
    padding: Spacing.md, marginBottom: Spacing.sm,
    borderWidth: 1, borderColor: Colors.border, ...Shadow.card,
  },
  roomEmoji: { fontSize: 28, marginBottom: Spacing.xs },
  roomName: { ...Typography.bodyBold, marginBottom: 2 },
  roomCount: { ...Typography.caption },

  scenarioBtn: {
    backgroundColor: Colors.card, borderRadius: Radius.full,
    paddingVertical: 14, paddingHorizontal: 20,
    alignItems: 'center', borderWidth: 1, borderColor: Colors.border,
    minWidth: 110, ...Shadow.card,
  },
  scenarioBtnActive: { borderColor: Colors.accent, backgroundColor: Colors.accentSoft },
  scenarioIcon: { fontSize: 22, marginBottom: 4 },
  scenarioLabel: { ...Typography.label, color: Colors.textSecondary },
  scenarioLabelActive: { color: Colors.accent },

  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: Spacing.md,
  },
  sectionAction: { ...Typography.label, color: Colors.accent },
});
