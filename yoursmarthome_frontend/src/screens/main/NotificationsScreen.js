import React, { useState, useRef, useEffect } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, StatusBar, Animated,
  Modal,
} from 'react-native';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../theme';
import AppHeader from '../../components/AppHeader';

import { api } from '../../services/api';

const mapDbNotification = (n) => {
  let icon = '🔔';
  let title = 'Notifica';
  if (n.tipo === 'intrusion') {
    icon = '🚨';
    title = '🚨 Allarme Sicurezza!';
  } else if (n.tipo === 'budget') {
    icon = '⚡';
    title = '⚡ Budget Raggiunto';
  } else if (n.tipo === 'system') {
    icon = '✅';
    title = 'Sistema';
  }

  // Formato ora leggibile
  let timeStr = new Date(n.timestamp).toLocaleDateString() + ' ' + new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const diffMs = Date.now() - new Date(n.timestamp).getTime();
  if (diffMs < 86400000) {
    timeStr = 'Oggi ' + new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  return {
    id: String(n.id_notifica),
    type: n.tipo,
    title: title,
    message: n.messaggio,
    time: timeStr,
    read: n.letta,
    urgent: n.urgente,
    device: n.tipo === 'intrusion' ? 'Sistema Sicurezza' : 'Sistema',
    icon: icon,
  };
};

/* ─── Pulsing urgent badge ─── */
function UrgentDot() {
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.5, duration: 600, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1,   duration: 600, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', width: 16, height: 16 }}>
      <Animated.View style={{
        position: 'absolute', width: 14, height: 14, borderRadius: 7,
        backgroundColor: Colors.danger + '30', transform: [{ scale: pulse }],
      }} />
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.danger }} />
    </View>
  );
}

/* ─── Detail Modal ─── */

function NotifDetail({ notif, visible, onClose, onMarkRead }) {
  if (!notif) return null;
  const typeColor = notif.type === 'intrusion' ? Colors.danger :
                    notif.type === 'budget'    ? Colors.warning : Colors.accent;
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={dStyles.overlay}>
        <View style={dStyles.sheet}>
          <View style={dStyles.handle} />
          <View style={[dStyles.typeBadge, { backgroundColor: typeColor + '20', borderColor: typeColor + '60' }]}>
            <Text style={[dStyles.typeText, { color: typeColor }]}>
              {notif.type === 'intrusion' ? 'SICUREZZA' : notif.type === 'budget' ? 'ENERGIA' : 'SISTEMA'}
            </Text>
          </View>
          <Text style={dStyles.title}>{notif.title}</Text>
          <View style={{flexDirection:'row',alignItems:'center',gap:4}}><MaterialCommunityIcons name="clock-outline" size={12} color={Colors.textMuted} /><Text style={dStyles.time}>{notif.time} · {notif.device}</Text></View>
          <View style={dStyles.msgBox}>
            <Text style={dStyles.message}>{notif.message}</Text>
          </View>
          {notif.type === 'intrusion' && (
            <View style={dStyles.actionsRow}>
              <TouchableOpacity style={[dStyles.actionBtn, { borderColor: Colors.danger + '60' }]}>
                <MaterialCommunityIcons name="phone" size={18} color={Colors.textSecondary} />
                <Text style={[dStyles.actionText, { color: Colors.danger }]}>Chiama Emergenza</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[dStyles.actionBtn, { borderColor: Colors.accent + '60' }]}>
                <MaterialCommunityIcons name="camera" size={18} color={Colors.textSecondary} />
                <Text style={[dStyles.actionText, { color: Colors.accent }]}>Vedi Camera</Text>
              </TouchableOpacity>
            </View>
          )}
          {!notif.read && (
            <TouchableOpacity
              style={dStyles.readBtn}
              onPress={() => { onMarkRead(notif.id); onClose(); }}
            >
              <Text style={dStyles.readBtnText}>Segna come letta</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

const dStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: Colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm, paddingBottom: 40,
    borderTopWidth: 1, borderColor: Colors.border,
  },
  handle: { width: 40, height: 4, backgroundColor: Colors.borderLight, borderRadius: 2, alignSelf: 'center', marginBottom: Spacing.lg },
  typeBadge: { alignSelf: 'flex-start', borderRadius: Radius.full, borderWidth: 1, paddingVertical: 3, paddingHorizontal: 12, marginBottom: Spacing.sm },
  typeText: { fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  title: { ...Typography.heading2, marginBottom: 4 },
  time: { ...Typography.caption, marginBottom: Spacing.md },
  msgBox: { backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.lg },
  message: { fontSize: 15, color: Colors.textSecondary, lineHeight: 22 },
  actionsRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 11, borderRadius: Radius.md, borderWidth: 1, backgroundColor: Colors.card },
  actionIcon: { fontSize: 16 },
  actionText: { fontSize: 13, fontWeight: '700' },
  readBtn: { backgroundColor: Colors.accentSoft, borderRadius: Radius.full, paddingVertical: 13, alignItems: 'center', borderWidth: 1, borderColor: Colors.accent },
  readBtnText: { fontSize: 15, fontWeight: '700', color: Colors.accent },
});

/* ─── Main Screen ─── */
const FILTER_TABS = ['Tutte', 'Sicurezza', 'Energia', 'Sistema'];

export default function NotificationsScreen({ navigation }) {
  const [notifications, setNotifications] = useState([]);
  const [activeFilter, setActiveFilter] = useState('Tutte');
  const [selected, setSelected] = useState(null);
  const [detailVisible, setDetailVisible] = useState(false);

  const loadNotifications = async () => {
    try {
      const dbNotifs = await api.getNotifs();
      if (dbNotifs) {
        setNotifications(dbNotifs.map(mapDbNotification));
      }
    } catch (e) {
      console.warn("loadNotifications error:", e.message);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const markRead = async (id) => {
    try {
      await api.markRead(parseInt(id));
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (e) {
      console.warn("markRead error:", e.message);
    }
  };

  const markAllRead = async () => {
    try {
      await api.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (e) {
      console.warn("markAllRead error:", e.message);
    }
  };

  const filtered = notifications.filter(n => {
    if (activeFilter === 'Tutte') return true;
    if (activeFilter === 'Sicurezza') return n.type === 'intrusion';
    if (activeFilter === 'Energia') return n.type === 'budget';
    if (activeFilter === 'Sistema') return n.type === 'system' || n.type === 'device';
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <AppHeader navigation={navigation} title="Notifiche" activeTab="Notifications" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Header row */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>Centro Notifiche</Text>
            {unreadCount > 0 && (
              <Text style={styles.unreadCount}>{unreadCount} non lette</Text>
            )}
          </View>
          {unreadCount > 0 && (
            <TouchableOpacity style={styles.markAllBtn} onPress={markAllRead}>
              <Text style={styles.markAllText}>Segna tutte lette</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Intrusion banner if urgent unread exist */}
        {notifications.some(n => n.type === 'intrusion' && !n.read) && (
          <TouchableOpacity
            style={styles.urgentBanner}
            onPress={() => {
              const u = notifications.find(n => n.type === 'intrusion' && !n.read);
              setSelected(u); setDetailVisible(true);
            }}
          >
            <View style={styles.urgentBannerLeft}>
              <UrgentDot />
              <View style={styles.urgentBannerText}>
                <Text style={styles.urgentBannerTitle}>Allerta Sicurezza Attiva</Text>
                <Text style={styles.urgentBannerSub}>Tocca per visualizzare i dettagli</Text>
              </View>
            </View>
            <Text style={styles.urgentBannerArrow}>›</Text>
          </TouchableOpacity>
        )}

        {/* Filter Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          {FILTER_TABS.map(tab => (
            <TouchableOpacity
              key={tab}
              style={[styles.filterTab, activeFilter === tab && styles.filterTabActive]}
              onPress={() => setActiveFilter(tab)}
            >
              <Text style={[styles.filterTabText, activeFilter === tab && styles.filterTabTextActive]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>


        {/* Notification list */}
        {filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="bell-off-outline" size={40} color={Colors.textMuted} />
            <Text style={styles.emptyText}>Nessuna notifica in questa categoria</Text>
          </View>
        ) : (
          filtered.map(notif => {
            const borderColor = notif.type === 'intrusion' ? Colors.danger :
                                notif.type === 'budget'    ? Colors.warning : Colors.border;
            return (
              <TouchableOpacity
                key={notif.id}
                style={[
                  styles.notifCard,
                  !notif.read && styles.notifCardUnread,
                  notif.urgent && styles.notifCardUrgent,
                  { borderLeftColor: borderColor },
                ]}
                onPress={() => { setSelected(notif); setDetailVisible(true); }}
                activeOpacity={0.8}
              >
                <View style={styles.notifLeft}>
                  <Text style={styles.notifIcon}>{notif.icon}</Text>
                  {!notif.read && <View style={styles.unreadDot} />}
                </View>
                <View style={styles.notifContent}>
                  <Text style={[styles.notifTitle, !notif.read && styles.notifTitleUnread]}>
                    {notif.title}
                  </Text>
                  <Text style={styles.notifMessage} numberOfLines={2}>{notif.message}</Text>
                  <View style={styles.notifMeta}>
                    <Text style={styles.notifTime}>{notif.time}</Text>
                    <Text style={styles.notifDevice}>· {notif.device}</Text>
                  </View>
                </View>
                {notif.urgent && !notif.read && <UrgentDot />}
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      <NotifDetail
        notif={selected}
        visible={detailVisible}
        onClose={() => setDetailVisible(false)}
        onMarkRead={markRead}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.lg, paddingBottom: Spacing.xxl },

  headerRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: Spacing.md,
  },
  headerTitle: { ...Typography.heading2 },
  unreadCount: { fontSize: 12, color: Colors.danger, fontWeight: '600', marginTop: 2 },
  markAllBtn: {
    backgroundColor: Colors.card, borderRadius: Radius.full,
    paddingVertical: 7, paddingHorizontal: 12,
    borderWidth: 1, borderColor: Colors.border,
  },
  markAllText: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },

  urgentBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.danger + '18', borderRadius: Radius.lg,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.danger + '60',
    marginBottom: Spacing.md,
  },
  urgentBannerLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  urgentBannerText: {},
  urgentBannerTitle: { fontSize: 14, fontWeight: '800', color: Colors.danger },
  urgentBannerSub: { fontSize: 11, color: Colors.danger + 'AA', marginTop: 1 },
  urgentBannerArrow: { fontSize: 22, color: Colors.danger },

  filterRow: { marginBottom: Spacing.lg },
  filterTab: {
    paddingVertical: 8, paddingHorizontal: 18,
    borderRadius: Radius.full, marginRight: Spacing.sm,
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border,
  },
  filterTabActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  filterTabText: { ...Typography.label, color: Colors.textMuted },
  filterTabTextActive: { color: Colors.background, fontWeight: '700' },

  notifCard: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: Colors.card, borderRadius: Radius.lg,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.border,
    borderLeftWidth: 3, marginBottom: Spacing.sm,
    gap: Spacing.sm, ...Shadow.card,
  },
  notifCardUnread: { backgroundColor: Colors.surface },
  notifCardUrgent: {},
  notifLeft: { alignItems: 'center', gap: 6 },
  notifIcon: { fontSize: 22 },
  unreadDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.accent },
  notifContent: { flex: 1 },
  notifTitle: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary, marginBottom: 3 },
  notifTitleUnread: { color: Colors.textPrimary, fontWeight: '700' },
  notifMessage: { fontSize: 13, color: Colors.textMuted, lineHeight: 18, marginBottom: 5 },
  notifMeta: { flexDirection: 'row', gap: 4 },
  notifTime: { fontSize: 11, color: Colors.textMuted },
  notifDevice: { fontSize: 11, color: Colors.textMuted },

  emptyState: { alignItems: 'center', paddingVertical: Spacing.xxl },
  emptyIcon: { fontSize: 44, marginBottom: Spacing.md },
  emptyText: { ...Typography.body, color: Colors.textMuted },
});
