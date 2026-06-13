import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, Modal, Animated,
  StyleSheet, SafeAreaView, ScrollView, Dimensions, StatusBar,
} from 'react-native';
import { Colors, Typography, Spacing, Radius, Shadow } from '../theme';
import { useDeviceStore } from '../store/DeviceStore';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getScenarioIcon } from '../store/deviceConstants';
import { api, setGruppo, getGruppo } from '../services/api';

const { width: SCREEN_W } = Dimensions.get('window');
const SIDEBAR_W = SCREEN_W * 0.78;

const NAV_LINKS = [
  { label: 'Dashboard',  icon: 'home-variant', tab: 'Home' },
  { label: 'Analisi',    icon: 'chart-line', tab: 'Analysis' },
  { label: 'Stanze',     icon: 'sofa', tab: 'Rooms' },
  { label: 'Profilo',    icon: 'account-circle', tab: 'User' },
];

const QUICK_SETTINGS = [
  { label: 'Aggiungi dispositivo', icon: 'plus-box-outline', screen: 'AddDevice' },
  { label: 'Scenari',              icon: 'lightning-bolt', screen: 'Scenarios' },
  { label: 'Impostazioni',         icon: 'cog-outline', screen: null },
];

/* ────────────────────────────────────────────
   Sidebar (slide-in modal from right)
──────────────────────────────────────────── */
function Sidebar({ visible, onClose, navigation, activeTab, activeHomes, notifications }) {
  const slideAnim = useRef(new Animated.Value(SIDEBAR_W)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 80, friction: 12 }),
        Animated.timing(fadeAnim,  { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: SIDEBAR_W, duration: 220, useNativeDriver: true }),
        Animated.timing(fadeAnim,  { toValue: 0,         duration: 180, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const navigate = (tab, screen) => {
    onClose();
    setTimeout(() => {
      if (tab)    navigation.navigate(tab);
      if (screen) navigation.navigate(screen);
    }, 250);
  };

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
      </Animated.View>

      {/* Drawer Panel */}
      <Animated.View style={[styles.sidebar, { transform: [{ translateX: slideAnim }] }]}>
        <SafeAreaView style={{ flex: 1 }}>
          {/* Header */}
          <View style={styles.sidebarHeader}>
            <View style={styles.sidebarBrand}>
              <View style={styles.sidebarLogo}>
                <MaterialCommunityIcons name="home-variant" size={24} color={Colors.accent} />
              </View>
              <View>
                <Text style={styles.sidebarAppName}>YourSmartHome</Text>
                <Text style={styles.sidebarAppSub}>Casa intelligente</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Stats strip */}
          <View style={styles.sidebarStats}>
            <View style={styles.sidebarStat}>
              <Text style={styles.sidebarStatVal}>{activeHomes}</Text>
              <Text style={styles.sidebarStatLabel}>Case attive</Text>
            </View>
            <View style={styles.sidebarStatDiv} />
            <View style={styles.sidebarStat}>
              <Text style={[styles.sidebarStatVal, notifications > 0 && { color: Colors.warning }]}>
                {notifications}
              </Text>
              <Text style={styles.sidebarStatLabel}>Notifiche</Text>
            </View>
            <View style={styles.sidebarStatDiv} />
            <View style={styles.sidebarStat}>
              <Text style={styles.sidebarStatVal}>12</Text>
              <Text style={styles.sidebarStatLabel}>Dispositivi</Text>
            </View>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
            {/* Navigation */}
            <Text style={styles.sidebarSection}>NAVIGAZIONE</Text>
            {NAV_LINKS.map(link => {
              const isActive = activeTab === link.tab;
              return (
                <TouchableOpacity
                  key={link.tab}
                  style={[styles.sidebarLink, isActive && styles.sidebarLinkActive]}
                  onPress={() => navigate(link.tab, null)}
                  activeOpacity={0.75}
                >
                  <View style={[styles.sidebarLinkIcon, isActive && styles.sidebarLinkIconActive]}>
                    <MaterialCommunityIcons name={link.icon} size={20} color={isActive ? Colors.accent : Colors.textSecondary} />
                  </View>
                  <Text style={[styles.sidebarLinkLabel, isActive && styles.sidebarLinkLabelActive]}>
                    {link.label}
                  </Text>
                  {isActive && <View style={styles.sidebarActiveDot} />}
                </TouchableOpacity>
              );
            })}

            {/* Quick Actions */}
            <Text style={styles.sidebarSection}>AZIONI RAPIDE</Text>
            {QUICK_SETTINGS.map(item => (
              <TouchableOpacity
                key={item.label}
                style={styles.sidebarLink}
                onPress={() => navigate(null, item.screen)}
                activeOpacity={0.75}
              >
                <View style={styles.sidebarLinkIcon}>
                  <MaterialCommunityIcons name={item.icon} size={20} color={Colors.textSecondary} />
                </View>
                <Text style={styles.sidebarLinkLabel}>{item.label}</Text>
                <Text style={styles.sidebarChevron}>›</Text>
              </TouchableOpacity>
            ))}

            {/* Scenarios */}
            <Text style={styles.sidebarSection}>SCENARI ATTIVI</Text>
            {[
              { name: 'Nessuno attivo', icon: 'circle-outline', desc: 'Tocca per attivarne uno' },
            ].map(sc => (
              <TouchableOpacity
                key={sc.name}
                style={styles.sidebarScenario}
                onPress={() => navigate(null, 'Scenarios')}
              >
                <MaterialCommunityIcons name={getScenarioIcon(sc.icon)} size={22} color={Colors.textSecondary} style={{ marginRight: Spacing.sm }} />
                <View>
                  <Text style={styles.sidebarLinkLabel}>{sc.name}</Text>
                  <Text style={styles.sidebarScenarioDesc}>{sc.desc}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Footer */}
          <View style={styles.sidebarFooter}>
            <TouchableOpacity style={styles.sidebarFooterBtn}>
              <MaterialCommunityIcons name="help-circle-outline" size={22} color={Colors.textSecondary} />
              <Text style={styles.sidebarFooterLabel}>Supporto</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.sidebarFooterBtn}>
              <MaterialCommunityIcons name="shield-check-outline" size={22} color={Colors.textSecondary} />
              <Text style={styles.sidebarFooterLabel}>Privacy</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.sidebarFooterBtn}>
              <MaterialCommunityIcons name="information-outline" size={22} color={Colors.textSecondary} />
              <Text style={styles.sidebarFooterLabel}>v2.4.1</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Animated.View>
    </Modal>
  );
}

/* ────────────────────────────────────────────
   NotificationsPanel (dropdown modal)
──────────────────────────────────────────── */
function NotificationsPanel({ visible, onClose, notifs, onMarkRead, onMarkAll }) {
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.notifBackdrop} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={styles.notifPanel}>
          <View style={styles.notifHeader}>
            <Text style={styles.notifTitle}>Notifiche</Text>
            <TouchableOpacity onPress={onMarkAll}>
              <Text style={styles.notifMarkAll}>Leggi tutte</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={{ maxHeight: 300 }}>
            {notifs.length === 0 ? (
              <Text style={{ ...Typography.caption, padding: Spacing.md, textAlign: 'center' }}>Nessuna notifica</Text>
            ) : (
              notifs.map(n => (
                <TouchableOpacity
                  key={n.id}
                  style={[styles.notifItem, !n.read && styles.notifItemUnread]}
                  onPress={() => onMarkRead(n.id)}
                >
                  <View style={styles.notifItemIcon}>
                    <MaterialCommunityIcons name={n.icon} size={20} color={Colors.accent} />
                  </View>
                  <View style={styles.notifItemBody}>
                    <Text style={styles.notifItemTitle}>{n.title}</Text>
                    <Text style={styles.notifItemText}>{n.body}</Text>
                    <Text style={styles.notifItemTime}>{n.time}</Text>
                  </View>
                  {!n.read && <View style={styles.notifDot} />}
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

/* ────────────────────────────────────────────
   ActiveHomesPanel
──────────────────────────────────────────── */
function ActiveHomesPanel({ visible, onClose, homes, activeGroupId, onSelectHome, onAddHome }) {
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.notifBackdrop} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={styles.homesPanel}>
          <View style={styles.notifHeader}>
            <Text style={styles.notifTitle}>Le mie case</Text>
            <TouchableOpacity onPress={onAddHome}>
              <Text style={styles.notifMarkAll}>+ Aggiungi</Text>
            </TouchableOpacity>
          </View>
          {homes.map(home => {
            const isActive = String(home.id) === String(activeGroupId);
            return (
              <TouchableOpacity
                key={home.id}
                style={[styles.homeItem, isActive && styles.homeItemActive]}
                onPress={() => onSelectHome(home.id)}
              >
                <View style={[styles.homeIconWrap, isActive && styles.homeIconWrapActive]}>
                  <MaterialCommunityIcons name="home-variant-outline" size={22} color={isActive ? Colors.accent : Colors.textSecondary} />
                </View>
                <View style={styles.homeInfo}>
                  <Text style={styles.homeName}>{home.name}</Text>
                  <Text style={styles.homeMeta}>{home.location}</Text>
                </View>
                {isActive && (
                  <View style={styles.homeActiveBadge}>
                    <Text style={styles.homeActiveBadgeText}>ATTIVA</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

/* ────────────────────────────────────────────
   AppHeader — main export
──────────────────────────────────────────── */
export default function AppHeader({
  navigation,
  title,
  showBack = false,
  activeTab = 'Home',
  transparent = false,
}) {
  const [sidebarOpen,   setSidebarOpen]   = useState(false);
  const [notifOpen,     setNotifOpen]     = useState(false);
  const [homesOpen,     setHomesOpen]     = useState(false);

  const [homes, setHomes] = useState([]);
  const [notifs, setNotifs] = useState([]);
  const activeGroupId = getGruppo();
  const { loadData } = useDeviceStore();

  const fetchHeaderData = async () => {
    try {
      const dbGroups = await api.getGruppi();
      const mappedGroups = dbGroups.map(g => ({
        id: String(g.id_gruppo),
        name: g.nome_abitazione,
        location: g.ruolo,
      }));
      setHomes(mappedGroups);

      const dbNotifs = await api.getNotifs();
      const mappedNotifs = dbNotifs.map(n => ({
        id: String(n.id_notifica),
        title: n.tipo.toUpperCase(),
        body: n.messaggio,
        time: new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        icon: n.tipo === 'invito' ? 'email-arrow-right-outline' : (n.tipo === 'allarme' ? 'alarm-light-outline' : 'bell-outline'),
        read: n.letta,
      }));
      setNotifs(mappedNotifs);
    } catch (e) {
      console.warn("fetchHeaderData error:", e.message);
    }
  };

  useEffect(() => {
    fetchHeaderData();
  }, []);

  const handleSelectHome = async (id) => {
    setGruppo(parseInt(id));
    setHomesOpen(false);
    await loadData();
  };

  const handleMarkRead = async (id) => {
    try {
      await api.markRead(id);
      fetchHeaderData();
    } catch (e) {
      console.warn(e.message);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllRead();
      fetchHeaderData();
    } catch (e) {
      console.warn(e.message);
    }
  };

  const unreadCount = notifs.filter(n => !n.read).length;
  const activeHomes = homes.length;

  return (
    <>
      <View style={[styles.header, transparent && styles.headerTransparent]}>
        {/* Left: back or spacer */}
        {showBack ? (
          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.iconBtnText}>←</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.titleWrap}>
            {title ? <Text style={styles.headerTitle}>{title}</Text> : null}
          </View>
        )}

        {/* Right: 3 icons */}
        <View style={styles.rightIcons}>
          {/* 1. Active Houses */}
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => { fetchHeaderData(); setHomesOpen(true); }}
          >
            <MaterialCommunityIcons name="home-variant-outline" size={20} color={Colors.textPrimary} />
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{activeHomes}</Text>
            </View>
          </TouchableOpacity>

          {/* 2. Notifications */}
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => { fetchHeaderData(); setNotifOpen(true); }}
          >
            <MaterialCommunityIcons name={unreadCount > 0 ? "bell-badge" : "bell-outline"} size={20} color={Colors.textPrimary} />
            {unreadCount > 0 && (
              <View style={[styles.badge, styles.badgeWarning]}>
                <Text style={styles.badgeText}>{unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* 3. Menu / Sidebar */}
          <TouchableOpacity
            style={[styles.iconBtn, styles.menuBtn]}
            onPress={() => setSidebarOpen(true)}
          >
            <View style={styles.hamburger}>
              <View style={styles.hamburgerLine} />
              <View style={[styles.hamburgerLine, { width: 14 }]} />
              <View style={styles.hamburgerLine} />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Panels */}
      <Sidebar
        visible={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        navigation={navigation}
        activeTab={activeTab}
        activeHomes={activeHomes}
        notifications={unreadCount}
      />
      <NotificationsPanel
        visible={notifOpen}
        onClose={() => setNotifOpen(false)}
        notifs={notifs}
        onMarkRead={handleMarkRead}
        onMarkAll={handleMarkAllRead}
      />
      <ActiveHomesPanel
        visible={homesOpen}
        onClose={() => setHomesOpen(false)}
        homes={homes}
        activeGroupId={activeGroupId}
        onSelectHome={handleSelectHome}
        onAddHome={() => { setHomesOpen(false); navigation.navigate('User'); }}
      />
    </>
  );
}

/* ────────────────────────────────────────────
   Styles
──────────────────────────────────────────── */
const styles = StyleSheet.create({
  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingVertical: 10,
    backgroundColor: Colors.background,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  headerTransparent: { backgroundColor: 'transparent', borderBottomColor: 'transparent' },
  titleWrap: { flex: 1 },
  headerTitle: { ...Typography.heading3 },

  rightIcons: { flexDirection: 'row', gap: Spacing.xs },
  iconBtn: {
    width: 40, height: 40, borderRadius: Radius.sm,
    backgroundColor: Colors.card, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: Colors.border, position: 'relative',
  },
  iconBtnText: { fontSize: 18 },
  menuBtn: { backgroundColor: Colors.cardAlt },
  hamburger: { gap: 3, alignItems: 'flex-start' },
  hamburgerLine: { height: 2, width: 18, backgroundColor: Colors.textPrimary, borderRadius: 2 },

  badge: {
    position: 'absolute', top: -4, right: -4,
    backgroundColor: Colors.accent, borderRadius: 8,
    minWidth: 16, height: 16, justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 2, borderWidth: 1.5, borderColor: Colors.background,
  },
  badgeWarning: { backgroundColor: Colors.warning },
  badgeText: { fontSize: 9, fontWeight: '800', color: Colors.background },

  // Sidebar
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  sidebar: {
    position: 'absolute', top: 0, right: 0, bottom: 0,
    width: SIDEBAR_W, backgroundColor: Colors.surface,
    borderLeftWidth: 1, borderLeftColor: Colors.border,
    ...Shadow.card,
  },
  sidebarHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  sidebarBrand: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  sidebarLogo: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: Colors.accentSoft, borderWidth: 1, borderColor: Colors.accent,
    justifyContent: 'center', alignItems: 'center',
  },
  sidebarLogoIcon: { fontSize: 20 },
  sidebarAppName: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  sidebarAppSub: { ...Typography.caption },
  closeBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: Colors.card, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  closeBtnText: { fontSize: 14, color: Colors.textSecondary, fontWeight: '600' },

  sidebarStats: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
    paddingVertical: Spacing.md, backgroundColor: Colors.card,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  sidebarStat: { alignItems: 'center' },
  sidebarStatVal: { fontSize: 18, fontWeight: '800', color: Colors.accent },
  sidebarStatLabel: { ...Typography.caption, marginTop: 2 },
  sidebarStatDiv: { width: 1, height: 28, backgroundColor: Colors.border },

  sidebarSection: {
    fontSize: 10, fontWeight: '700', color: Colors.textMuted,
    letterSpacing: 1.5, paddingHorizontal: Spacing.md,
    paddingTop: Spacing.lg, paddingBottom: Spacing.xs,
  },
  sidebarLink: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingVertical: 12, paddingHorizontal: Spacing.md,
    borderRadius: Radius.md, marginHorizontal: Spacing.sm, marginBottom: 2,
  },
  sidebarLinkActive: { backgroundColor: Colors.accentSoft },
  sidebarLinkIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: Colors.card, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  sidebarLinkIconActive: { backgroundColor: Colors.accentGlow + '30', borderColor: Colors.accent },
  sidebarLinkEmoji: { fontSize: 18 },
  sidebarLinkLabel: { ...Typography.bodyBold, flex: 1 },
  sidebarLinkLabelActive: { color: Colors.accent },
  sidebarActiveDot: {
    width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.accent,
  },
  sidebarChevron: { fontSize: 20, color: Colors.textMuted },

  sidebarScenario: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingVertical: 12, paddingHorizontal: Spacing.md,
    marginHorizontal: Spacing.sm,
  },
  sidebarScenarioIcon: { fontSize: 22 },
  sidebarScenarioDesc: { ...Typography.caption, marginTop: 2 },

  sidebarFooter: {
    flexDirection: 'row', justifyContent: 'space-around',
    paddingVertical: Spacing.md, paddingBottom: Spacing.lg,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  sidebarFooterBtn: { alignItems: 'center', gap: 4 },
  sidebarFooterIcon: { fontSize: 20 },
  sidebarFooterLabel: { ...Typography.caption },

  // Notifications Panel
  notifBackdrop: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-start', alignItems: 'flex-end', paddingTop: 90,
  },
  notifPanel: {
    width: SCREEN_W * 0.88, backgroundColor: Colors.surface,
    borderRadius: Radius.xl, marginRight: Spacing.md,
    borderWidth: 1, borderColor: Colors.border, overflow: 'hidden',
    ...Shadow.card,
  },
  notifHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  notifTitle: { ...Typography.heading3 },
  notifMarkAll: { fontSize: 12, fontWeight: '600', color: Colors.accent },
  notifItem: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm,
    paddingVertical: 12, paddingHorizontal: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  notifItemUnread: { backgroundColor: Colors.accentSoft + '30' },
  notifItemIcon: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.card,
    justifyContent: 'center', alignItems: 'center',
  },
  notifItemBody: { flex: 1 },
  notifItemTitle: { ...Typography.bodyBold, fontSize: 13 },
  notifItemText: { ...Typography.caption, marginTop: 2, color: Colors.textSecondary },
  notifItemTime: { ...Typography.caption, marginTop: 2, fontSize: 10 },
  notifDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: Colors.accent, marginTop: 4,
  },

  // Homes Panel
  homesPanel: {
    width: SCREEN_W * 0.88, backgroundColor: Colors.surface,
    borderRadius: Radius.xl, marginRight: Spacing.md,
    borderWidth: 1, borderColor: Colors.border, overflow: 'hidden', ...Shadow.card,
  },
  homeItem: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  homeItemActive: { backgroundColor: Colors.accentSoft + '40' },
  homeIconWrap: {
    width: 44, height: 44, borderRadius: 14, backgroundColor: Colors.card,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  homeIconWrapActive: { borderColor: Colors.accent, backgroundColor: Colors.accentSoft },
  homeIcon: { fontSize: 22 },
  homeInfo: { flex: 1 },
  homeName: { ...Typography.bodyBold },
  homeMeta: { ...Typography.caption, marginTop: 2 },
  homeActiveBadge: {
    backgroundColor: Colors.success + '20', borderRadius: Radius.full,
    paddingVertical: 3, paddingHorizontal: 8,
    borderWidth: 1, borderColor: Colors.success + '60',
  },
  homeActiveBadgeText: { fontSize: 9, fontWeight: '800', color: Colors.success, letterSpacing: 1 },
});
