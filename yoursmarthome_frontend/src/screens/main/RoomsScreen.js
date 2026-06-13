import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, SafeAreaView, StatusBar, Modal, TextInput,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../theme';
import AppHeader from '../../components/AppHeader';
import { useDeviceStore } from '../../store/DeviceStore';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getRoomIcon } from '../../store/deviceConstants';

export default function RoomsScreen({ navigation }) {
  const { rooms, getRoomStats, loadData, addNewRoom } = useDeviceStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomIcon, setNewRoomIcon] = useState('sofa');

  useEffect(() => {
    loadData();
  }, []);

  const handleAddRoom = async () => {
    if (newRoomName.trim()) {
      try {
        await addNewRoom(newRoomName.trim(), newRoomIcon);
        setNewRoomName('');
        setShowAddModal(false);
        loadData();
      } catch (e) {
        alert("Errore creazione stanza: " + e.message);
      }
    }
  };

  const renderRoom = ({ item }) => {
    const { total, active } = getRoomStats(item.id);  // <-- live dal store
    return (
      <TouchableOpacity
        style={styles.roomCard}
        onPress={() => navigation.navigate('RoomDetail', { room: item })}
        activeOpacity={0.8}
      >
        {/* Room Image */}
        <View style={styles.roomImageWrapper}>
          <MaterialCommunityIcons name={getRoomIcon(item.icon)} size={54} color={Colors.accent} />
          {active > 0 && (
            <View style={styles.activeBadge}>
              <Text style={styles.activeBadgeText}>{active} ON</Text>
            </View>
          )}
        </View>

        {/* Room Info */}
        <View style={styles.roomInfo}>
          <Text style={styles.roomName}>{item.name}</Text>
          <Text style={styles.roomMeta}>{total} dispositivi</Text>
        </View>

        {/* Arrow */}
        <View style={styles.roomActions}>
          <View style={styles.arrowBtn}>
            <Text style={styles.arrowText}>→</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <AppHeader navigation={navigation} title="Stanze" activeTab="Rooms" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Le mie stanze</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddModal(true)}>
          <Text style={styles.addBtnText}>+ Aggiungi</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={rooms}
        keyExtractor={item => item.id}
        renderItem={renderRoom}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />

      {/* Add Room Modal */}
      <Modal transparent visible={showAddModal} animationType="slide" onRequestClose={() => setShowAddModal(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Nuova Stanza</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Nome stanza (es. Soggiorno)..."
              placeholderTextColor={Colors.textMuted}
              value={newRoomName}
              onChangeText={setNewRoomName}
              autoFocus
            />
            <Text style={{ ...Typography.label, marginBottom: Spacing.xs }}>Icona</Text>
            <View style={{ flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg }}>
              {['sofa', 'bed', 'stove', 'shower', 'garage', 'tree'].map(iconName => (
                <TouchableOpacity
                  key={iconName}
                  onPress={() => setNewRoomIcon(iconName)}
                  style={{
                    width: 40, height: 40, borderRadius: Radius.full,
                    backgroundColor: newRoomIcon === iconName ? Colors.accentSoft : Colors.card,
                    borderWidth: 1, borderColor: newRoomIcon === iconName ? Colors.accent : Colors.border,
                    justifyContent: 'center', alignItems: 'center'
                  }}
                >
                  <MaterialCommunityIcons name={iconName} size={20} color={newRoomIcon === iconName ? Colors.accent : Colors.textSecondary} />
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowAddModal(false)}>
                <Text style={styles.modalCancelText}>Annulla</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirmBtn} onPress={handleAddRoom}>
                <Text style={styles.modalConfirmText}>Crea</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  headerTitle: { ...Typography.heading2 },
  list: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxl },

  addBtn: {
    backgroundColor: Colors.accentSoft, borderRadius: Radius.full,
    paddingVertical: 6, paddingHorizontal: 14, borderWidth: 1, borderColor: Colors.accent
  },
  addBtnText: { fontSize: 13, fontWeight: '700', color: Colors.accent },

  roomCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.xl,
    borderWidth: 1, borderColor: Colors.border,
    marginBottom: Spacing.md, overflow: 'hidden', ...Shadow.card,
  },
  roomImageWrapper: {
    height: 120, backgroundColor: Colors.card,
    justifyContent: 'center', alignItems: 'center',
    position: 'relative',
  },
  roomImageIcon: { fontSize: 54 },
  activeBadge: {
    position: 'absolute', top: Spacing.sm, right: Spacing.sm,
    backgroundColor: Colors.success, borderRadius: Radius.full,
    paddingVertical: 3, paddingHorizontal: 8,
  },
  activeBadgeText: { fontSize: 10, fontWeight: '700', color: Colors.background },

  roomInfo: { paddingHorizontal: Spacing.md, paddingTop: Spacing.sm },
  roomName: { ...Typography.heading3 },
  roomMeta: { ...Typography.caption, marginTop: 2, marginBottom: Spacing.sm },

  roomActions: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingBottom: Spacing.md,
  },
  arrowBtn: {
    marginLeft: 'auto', width: 38, height: 38, borderRadius: Radius.sm,
    backgroundColor: Colors.accentSoft, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: Colors.accent,
  },
  arrowText: { fontSize: 16, color: Colors.accent, fontWeight: '700' },

  modalOverlay: {
    flex: 1, backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: Colors.surface, borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl,
    padding: Spacing.xl, borderWidth: 1, borderColor: Colors.border,
  },
  modalTitle: { ...Typography.heading2, marginBottom: Spacing.lg },
  modalInput: {
    backgroundColor: Colors.card, borderRadius: Radius.md,
    paddingVertical: 14, paddingHorizontal: Spacing.md,
    color: Colors.textPrimary, fontSize: 15,
    borderWidth: 1, borderColor: Colors.accent,
    marginBottom: Spacing.lg,
  },
  modalActions: { flexDirection: 'row', gap: Spacing.sm },
  modalCancelBtn: {
    flex: 1, paddingVertical: 14, alignItems: 'center',
    borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.borderLight,
  },
  modalCancelText: { fontSize: 15, fontWeight: '600', color: Colors.textSecondary },
  modalConfirmBtn: {
    flex: 1, paddingVertical: 14, alignItems: 'center',
    borderRadius: Radius.full, backgroundColor: Colors.accent, ...Shadow.accent,
  },
  modalConfirmText: { fontSize: 15, fontWeight: '700', color: Colors.background },
});
