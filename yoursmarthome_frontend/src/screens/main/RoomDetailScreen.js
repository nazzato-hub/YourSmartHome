import React, { useState } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, StatusBar, Modal, FlatList,
} from 'react-native';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../theme';
import { DeviceCard, SectionHeader } from '../../components';
import AppHeader from '../../components/AppHeader';
import { useDeviceStore } from '../../store/DeviceStore';
import { DEVICE_ICONS, DEVICE_ICONS_OFF, getRoomIcon } from '../../store/deviceConstants';

/* ─── Modal selezione dispositivo da aggiungere ─── */
function AddDeviceModal({ visible, onClose, roomId }) {
  const { devices, addDeviceToRoom } = useDeviceStore();
  // Dispositivi non ancora assegnati a nessuna stanza
  const available = devices.filter(d => !d.roomId);

  const handleAdd = (deviceId) => {
    addDeviceToRoom(deviceId, roomId);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={modal.overlay}>
        <View style={modal.sheet}>
          <View style={modal.handle} />
          <Text style={modal.title}>Aggiungi dispositivo</Text>
          <Text style={modal.sub}>
            {available.length === 0
              ? 'Nessun dispositivo disponibile'
              : 'Seleziona un dispositivo da aggiungere alla stanza'}
          </Text>

          <FlatList
            data={available}
            keyExtractor={d => d.id}
            style={{ maxHeight: 340 }}
            renderItem={({ item }) => (
              <TouchableOpacity style={modal.item} onPress={() => handleAdd(item.id)} activeOpacity={0.8}>
                <View style={{ marginRight: Spacing.md }}>
                  <MaterialCommunityIcons name={DEVICE_ICONS[item.type] || 'devices'} size={26} color={Colors.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={modal.itemName}>{item.name}</Text>
                  <Text style={modal.itemType}>{item.type}</Text>
                </View>
                <Text style={modal.addIcon}>＋</Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <Text style={modal.empty}>Tutti i dispositivi sono già assegnati a una stanza.</Text>
            }
          />

          <TouchableOpacity style={modal.cancelBtn} onPress={onClose}>
            <Text style={modal.cancelText}>Annulla</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

/* ─── Schermata principale ─── */
export default function RoomDetailScreen({ navigation, route }) {
  const { room } = route.params;
  const { getDevicesForRoom, toggleDevice, removeDeviceFromRoom } = useDeviceStore();
  const [showAddModal, setShowAddModal] = useState(false);

  // Observer: segue automaticamente qualsiasi modifica allo store
  const devices = getDevicesForRoom(room.id);
  const activeCount = devices.filter(d => d.isOn).length;

  const handleRemove = (deviceId) => {
    removeDeviceFromRoom(deviceId);
  };

  const handleOpenDevice = (device) => {
    navigation.navigate('Device', { device });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <AppHeader navigation={navigation} title={room.name} showBack />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Room Hero */}
        <View style={styles.roomHero}>
          <MaterialCommunityIcons name={getRoomIcon(room.icon)} size={80} color={Colors.accent} />
          <View style={styles.roomHeroOverlay}>
            <Text style={styles.roomHeroName}>{room.name}</Text>
            <View style={styles.roomHeroStats}>
              <View style={styles.roomHeroStat}>
                <Text style={styles.roomHeroStatVal}>{activeCount}</Text>
                <Text style={styles.roomHeroStatLabel}>Attivi</Text>
              </View>
              <View style={styles.roomHeroStatDivider} />
              <View style={styles.roomHeroStat}>
                <Text style={styles.roomHeroStatVal}>{devices.length}</Text>
                <Text style={styles.roomHeroStatLabel}>Totali</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.content}>
          {/* Quick Controls */}
          <View style={styles.quickControls}>
            {[
              { label: 'Tutte le luci', icon: 'lightbulb-on', action: () => {} },
              { label: 'Tutto spento', icon: 'circle-outline', action: () => {} },
              { label: 'Scenario', icon: 'lightning-bolt', action: () => navigation.navigate('Scenarios') },
            ].map(ctrl => (
              <TouchableOpacity key={ctrl.label} style={styles.quickCtrlBtn} onPress={ctrl.action}>
                <MaterialCommunityIcons name={ctrl.icon} size={20} color={Colors.textSecondary} style={{ marginBottom: 4 }} />
                <Text style={styles.quickCtrlLabel}>{ctrl.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Devices */}
          <SectionHeader
            title={`Dispositivi (${devices.length})`}
            actionLabel="+ Aggiungi"
            onAction={() => setShowAddModal(true)}
          />

          {devices.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="inbox-remove-outline" size={36} color={Colors.textMuted} />
              <Text style={styles.emptyText}>Nessun dispositivo in questa stanza</Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={() => setShowAddModal(true)}>
                <Text style={styles.emptyBtnText}>+ Aggiungi dispositivo</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.devicesGrid}>
              {devices.map(device => (
                <View key={device.id} style={styles.deviceWrapper}>
                  <DeviceCard
                    name={device.name}
                    icon={device.isOn ? (DEVICE_ICONS[device.type] || 'devices') : (DEVICE_ICONS_OFF[device.type] || 'devices')}
                    isOn={device.isOn}
                    onToggle={() => toggleDevice(device.id)}
                    subtitle={device.subtitle}
                    onPress={() => handleOpenDevice(device)}
                  />
                  {/* Pulsante rimozione */}
                  <TouchableOpacity
                    style={styles.removeBtn}
                    onPress={() => handleRemove(device.id)}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  >
                    <Text style={styles.removeBtnText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <AddDeviceModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        roomId={room.id}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  roomHero: {
    height: 200, backgroundColor: Colors.card,
    justifyContent: 'center', alignItems: 'center',
  },
  roomHeroIcon: { fontSize: 80 },
  roomHeroOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.background + 'CC',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  roomHeroName: { ...Typography.heading2 },
  roomHeroStats: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  roomHeroStat: { alignItems: 'center' },
  roomHeroStatVal: { fontSize: 18, fontWeight: '700', color: Colors.accent },
  roomHeroStatLabel: { ...Typography.caption },
  roomHeroStatDivider: { width: 1, height: 24, backgroundColor: Colors.border },

  content: { padding: Spacing.lg },

  quickControls: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
  quickCtrlBtn: {
    flex: 1, backgroundColor: Colors.card, borderRadius: Radius.md,
    paddingVertical: Spacing.sm, alignItems: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  quickCtrlIcon: { fontSize: 20, marginBottom: 4 },
  quickCtrlLabel: { fontSize: 10, fontWeight: '600', color: Colors.textMuted, textAlign: 'center' },

  devicesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },

  deviceWrapper: { position: 'relative', width: '47%' },
  removeBtn: {
    position: 'absolute', top: 6, right: 6,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: Colors.danger + 'CC',
    justifyContent: 'center', alignItems: 'center',
    zIndex: 10,
  },
  removeBtnText: { fontSize: 10, color: Colors.white, fontWeight: '800' },

  emptyState: { alignItems: 'center', paddingVertical: Spacing.xl },
  emptyIcon: { fontSize: 40, marginBottom: Spacing.sm },
  emptyText: { ...Typography.body, color: Colors.textMuted, marginBottom: Spacing.md },
  emptyBtn: {
    backgroundColor: Colors.accentSoft, borderRadius: Radius.full,
    paddingVertical: 10, paddingHorizontal: 24,
    borderWidth: 1, borderColor: Colors.accent,
  },
  emptyBtnText: { fontSize: 14, fontWeight: '600', color: Colors.accent },
});

// ─── Stili Modal ─────────────────────────────────────────────────────────────
const modal = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.surface, borderTopLeftRadius: Radius.xxl,
    borderTopRightRadius: Radius.xxl, paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm, paddingBottom: 40,
    borderWidth: 1, borderColor: Colors.border,
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: Colors.border, alignSelf: 'center', marginBottom: Spacing.md,
  },
  title: { ...Typography.heading3, marginBottom: 4 },
  sub: { ...Typography.caption, marginBottom: Spacing.md },
  item: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.card, borderRadius: Radius.md,
    padding: Spacing.md, marginBottom: Spacing.sm,
    borderWidth: 1, borderColor: Colors.border,
  },
  itemIcon: { fontSize: 26, marginRight: Spacing.md },
  itemName: { ...Typography.bodyBold, fontSize: 14 },
  itemType: { ...Typography.caption, marginTop: 2 },
  addIcon: { fontSize: 22, color: Colors.accent, fontWeight: '700' },
  empty: { ...Typography.body, color: Colors.textMuted, textAlign: 'center', paddingVertical: Spacing.lg },
  cancelBtn: {
    marginTop: Spacing.md, backgroundColor: Colors.card,
    borderRadius: Radius.full, paddingVertical: 14,
    alignItems: 'center', borderWidth: 1, borderColor: Colors.border,
  },
  cancelText: { fontSize: 15, fontWeight: '600', color: Colors.textSecondary },
});
