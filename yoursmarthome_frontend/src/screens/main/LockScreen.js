import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, StatusBar, Animated,
  Modal, Alert,
} from 'react-native';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../theme';
import AppHeader from '../../components/AppHeader';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDeviceStore } from '../../store/DeviceStore';
import { api, getGruppo } from '../../services/api';



/* ─── PIN Challenge Modal ─── */
function PinChallengeModal({ visible, lockName, onCorrectPin, onClose, correctPin }) {
  const [enteredPin, setEnteredPin] = useState('');

  useEffect(() => {
    if (visible) {
      setEnteredPin('');
    }
  }, [visible]);

  const handleKeyPress = (val) => {
    if (enteredPin.length < correctPin.length) {
      setEnteredPin(enteredPin + val);
    }
  };

  const handleBackspace = () => {
    setEnteredPin(enteredPin.slice(0, -1));
  };

  const handleVerify = () => {
    if (enteredPin === correctPin) {
      onCorrectPin();
      onClose();
    } else {
      Alert.alert('Errore', 'Il PIN inserito è errato!');
      setEnteredPin('');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={pinStyles.overlay}>
        <View style={pinStyles.sheet}>
          <View style={pinStyles.handle} />
          <Text style={pinStyles.title}>Inserisci PIN di Sblocco</Text>
          <Text style={pinStyles.subtitle}>Sblocco richiesto per: {lockName}</Text>

          {/* Dots Indicator */}
          <View style={pinStyles.dotsRow}>
            {[...Array(correctPin.length)].map((_, i) => (
              <View
                key={i}
                style={[
                  pinStyles.dot,
                  i < enteredPin.length && pinStyles.dotFilled
                ]}
              />
            ))}
          </View>

          {/* Tastiera Numerica */}
          <View style={pinStyles.keypad}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <TouchableOpacity
                key={num}
                style={pinStyles.key}
                onPress={() => handleKeyPress(String(num))}
              >
                <Text style={pinStyles.keyText}>{num}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[pinStyles.key, pinStyles.backspaceKey]}
              onPress={handleBackspace}
            >
              <MaterialCommunityIcons name="backspace-outline" size={22} color={Colors.textPrimary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={pinStyles.key}
              onPress={() => handleKeyPress('0')}
            >
              <Text style={pinStyles.keyText}>0</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[pinStyles.key, pinStyles.verifyKey]}
              onPress={handleVerify}
            >
              <MaterialCommunityIcons name="check" size={22} color={Colors.background} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={pinStyles.cancelBtn} onPress={onClose}>
            <Text style={pinStyles.cancelText}>Annulla</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const pinStyles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: 40,
    alignItems: 'center', borderTopWidth: 1, borderColor: Colors.border,
  },
  handle: {
    width: 40, height: 4, backgroundColor: Colors.borderLight,
    borderRadius: 2, marginBottom: Spacing.lg,
  },
  title: { ...Typography.heading2, marginBottom: 4 },
  subtitle: { ...Typography.body, color: Colors.textMuted, marginBottom: Spacing.xl },
  dotsRow: {
    flexDirection: 'row', gap: 16, marginBottom: Spacing.xl,
  },
  dot: {
    width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: Colors.border,
    backgroundColor: 'transparent',
  },
  dotFilled: {
    backgroundColor: Colors.accent, borderColor: Colors.accent,
  },
  keypad: {
    flexDirection: 'row', flexWrap: 'wrap', width: 280, justifyContent: 'center', gap: 16, marginBottom: Spacing.xl,
  },
  key: {
    width: 70, height: 70, borderRadius: 35, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border,
    justifyContent: 'center', alignItems: 'center',
  },
  keyText: { fontSize: 24, fontWeight: '700', color: Colors.textPrimary },
  backspaceKey: { backgroundColor: Colors.cardAlt },
  verifyKey: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  verifyKeyText: { fontSize: 24, fontWeight: '700', color: Colors.background },
  cancelBtn: {
    marginTop: Spacing.md, paddingVertical: 12, paddingHorizontal: 40,
    borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border,
  },
  cancelText: { fontSize: 15, fontWeight: '600', color: Colors.textSecondary },
});

/* ─── Battery indicator ─── */
function BatteryBar({ pct }) {
  const color = pct > 50 ? Colors.success : pct > 20 ? Colors.warning : Colors.danger;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
      <View style={{ width: 22, height: 11, borderRadius: 3, borderWidth: 1.5, borderColor: Colors.textMuted, justifyContent: 'center', paddingHorizontal: 1.5 }}>
        <View style={{ height: 5, width: `${pct}%`, backgroundColor: color, borderRadius: 1.5 }} />
      </View>
      <Text style={{ fontSize: 10, color, fontWeight: '700' }}>{pct}%</Text>
    </View>
  );
}

/* ─── Lock Card ─── */
function LockCard({ lock, onToggle, onBiometric, onToggleAlarm }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.96, duration: 80, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1,    duration: 120, useNativeDriver: true }),
    ]).start();
    if (lock.biometricEnabled) {
      onBiometric(lock);
    } else {
      onToggle(lock.id);
    }
  };

  const statusColor = lock.locked ? Colors.success : Colors.danger;
  const statusLabel = lock.locked ? 'Chiusa' : 'Aperta';
  const statusIconName = lock.locked ? 'lock' : 'lock-open-variant';

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <View style={[styles.lockCard, !lock.locked && styles.lockCardOpen]}>
        {/* Header row */}
        <View style={styles.lockCardHeader}>
          <View style={styles.lockIconWrap}>
            <MaterialCommunityIcons name={lock.icon} size={22} color={Colors.accent} />
          </View>
          <View style={styles.lockInfo}>
            <Text style={styles.lockName}>{lock.name}</Text>
            <View style={{flexDirection:'row', alignItems:'center', gap:3}}><MaterialCommunityIcons name="map-marker" size={12} color={Colors.textMuted} /><Text style={styles.lockRoom}>{lock.room}</Text></View>
            <BatteryBar pct={lock.battery} />
          </View>
          <View style={styles.lockStatusWrap}>
            <View style={[styles.lockStatusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.lockStatusText, { color: statusColor }]}>{statusLabel}</Text>
          </View>
        </View>

        {/* Last event */}
        <View style={styles.lockEventRow}>
          <MaterialCommunityIcons name="clock-outline" size={14} color={Colors.textMuted} />
          <Text style={styles.lockEventText}>{lock.lastEvent}</Text>
        </View>

        {/* Action row */}
        <View style={styles.lockActions}>
          <TouchableOpacity
            style={[styles.lockMainBtn, !lock.locked && styles.lockMainBtnOpen]}
            onPress={handlePress}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name={statusIconName} size={18} color={lock.locked ? Colors.textPrimary : Colors.danger} />
            <Text style={[styles.lockMainBtnText, !lock.locked && { color: Colors.danger }]}>
              {lock.locked ? 'Sblocca' : 'Blocca'}
            </Text>
            {lock.biometricEnabled && (
              <View style={[styles.bioBadge,{flexDirection:'row',alignItems:'center',gap:3}]}><MaterialCommunityIcons name="fingerprint" size={12} color={Colors.accent} /><Text style={{fontSize:10,color:Colors.accent,fontWeight:'700'}}>Bio</Text></View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.alarmBtn, lock.alarmEnabled && styles.alarmBtnOn]}
            onPress={() => onToggleAlarm(lock.id)}
          >
            <MaterialCommunityIcons name={lock.alarmEnabled ? 'shield-check' : 'bell-off'} size={18} color={lock.alarmEnabled ? Colors.accent : Colors.textMuted} />
            <Text style={[styles.alarmBtnText, lock.alarmEnabled && { color: Colors.accent }]}>
              {lock.alarmEnabled ? 'Allarme On' : 'Allarme Off'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}

/* ─── Main Screen ─── */
export default function LockScreen({ navigation }) {
  const { devices, updateDevice, groupId, loadData } = useDeviceStore();

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  console.log('[LockScreen] Rendered with groupId:', groupId, 'devices count:', devices.length);

  const [activeTab, setActiveTab] = useState('locks'); // locks | log
  const [accessLog, setAccessLog] = useState([]);
  const [activeGroupPin, setActiveGroupPin] = useState('1234');
  const [pinVerifyModal, setPinVerifyModal] = useState({ visible: false, lockId: null, lockName: '' });

  const fetchGroupPin = async () => {
    try {
      const groups = await api.getGruppi();
      const activeId = getGruppo ? getGruppo() : null;
      if (groups && groups.length > 0) {
        const activeGroup = groups.find(g => String(g.id_gruppo) === String(activeId)) || groups[0];
        if (activeGroup && activeGroup.pin_sblocco_serrature) {
          setActiveGroupPin(activeGroup.pin_sblocco_serrature);
        }
      }
    } catch (e) {
      console.warn("fetchGroupPin error:", e.message);
    }
  };

  useEffect(() => {
    fetchGroupPin();
  }, [groupId]);


  // Filter devices to get only locks (Porta_Principale)
  const rawLocks = devices.filter(d => d.type === 'Porta_Principale');
  const locks = rawLocks.map(d => ({
    id: d.id,
    name: d.name,
    icon: 'key-variant',
    room: d.room || 'Ingresso',
    locked: d.dettagli?.stato_serratura !== 'aperta',
    lastEvent: d.subtitle || 'Stato aggiornato',
    battery: d.dettagli?.batteria || 95,
    alarmEnabled: d.dettagli?.allarme_attivo !== false,
  }));

  const loadAccessLog = async () => {
    try {
      const dbAlerts = await api.getStoricoAvvisi();
      const mapped = dbAlerts.map(a => ({
        id: String(a.id_avviso),
        icon: a.tipo_avviso.toLowerCase().includes('intrusione') || a.tipo_avviso.toLowerCase().includes('tentativo') ? 'alert' : 'lock',
        event: a.tipo_avviso,
        by: a.descrizione || 'Sistema di sicurezza',
        time: new Date(a.timestamp_evento).toLocaleDateString() + ' ' + new Date(a.timestamp_evento).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        ok: !a.tipo_avviso.toLowerCase().includes('tentativo') && !a.tipo_avviso.toLowerCase().includes('allarme') && !a.tipo_avviso.toLowerCase().includes('intrusione'),
      }));
      setAccessLog(mapped);
    } catch (e) {
      console.warn("loadAccessLog error:", e.message);
    }
  };

  useEffect(() => {
    if (activeTab === 'log') {
      loadAccessLog();
    }
  }, [activeTab, groupId]);


  const executeUnlock = async (id) => {
    try {
      await updateDevice(id, {
        dettagli: {
          statoSerratura: 'aperta'
        }
      });
    } catch (e) {
      alert("Errore cambio stato serratura: " + e.message);
    }
  };

  const toggleLock = async (id) => {
    const lock = locks.find(l => l.id === id);
    if (!lock) return;
    const nextLockedState = !lock.locked;

    // Se si sta sbloccando (prossimo stato sbloccato/aperto), richiedi il PIN
    if (!nextLockedState) {
      await fetchGroupPin();
      setPinVerifyModal({ visible: true, lockId: id, lockName: lock.name });
      return;
    }

    // Altrimenti stiamo bloccando (chiudendo), procedi direttamente
    try {
      await updateDevice(id, {
        dettagli: {
          statoSerratura: 'chiusa'
        }
      });
    } catch (e) {
      alert("Errore cambio stato serratura: " + e.message);
    }
  };

  const toggleAlarm = async (id) => {
    const lock = locks.find(l => l.id === id);
    if (!lock) return;
    const nextAlarmState = !lock.alarmEnabled;
    try {
      await updateDevice(id, {
        dettagli: {
          allarme_attivo: nextAlarmState
        }
      });
    } catch (e) {
      alert("Errore modifica allarme: " + e.message);
    }
  };



  const lockedCount = locks.filter(l => l.locked).length;
  const allLocked   = locks.length > 0 && lockedCount === locks.length;
  const isSafe      = locks.length === 0 || allLocked;

  const handleLockAll = async () => {
    try {
      const openLocks = locks.filter(l => !l.locked);
      for (const lock of openLocks) {
        await updateDevice(lock.id, {
          dettagli: {
            statoSerratura: 'chiusa'
          }
        });
      }
    } catch (e) {
      alert("Errore chiusura varchi: " + e.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <AppHeader navigation={navigation} title="Serrature" activeTab="Locks" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Status Hero */}
        <View style={[styles.heroCard, !isSafe && styles.heroCardAlert]}>
          <View style={styles.heroLeft}>
            <Text style={styles.heroStatus}>
              {locks.length === 0 
                ? 'Nessun varco configurato' 
                : (allLocked ? 'Casa al Sicuro' : 'Varchi Aperti')
              }
            </Text>
            <Text style={styles.heroSub}>
              {locks.length === 0 
                ? 'Nessuna serratura da controllare' 
                : `${lockedCount}/${locks.length} serrature chiuse`
              }
            </Text>
          </View>
          <View style={styles.heroRight}>
            <MaterialCommunityIcons 
              name={locks.length === 0 ? 'shield-check-outline' : (allLocked ? 'lock' : 'lock-open-variant')} 
              size={48} 
              color={isSafe ? Colors.success : Colors.danger} 
            />
          </View>
        </View>

        {/* Chiudi tutto btn */}
        {!allLocked && locks.length > 0 && (
          <TouchableOpacity
            style={styles.lockAllBtn}
            onPress={handleLockAll}
          >
            <MaterialCommunityIcons name="lock" size={18} color={Colors.background} />
            <Text style={styles.lockAllText}>Chiudi Tutto</Text>
          </TouchableOpacity>
        )}

        {/* Tabs */}
        <View style={styles.tabs}>
          {['locks', 'log'].map(tab => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab === 'locks' ? 'Serrature' : 'Registro Accessi'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {activeTab === 'locks' && (
          <>
            {locks.map(lock => (
              <LockCard
                key={lock.id}
                lock={lock}
                onToggle={toggleLock}
                onToggleAlarm={toggleAlarm}
              />
            ))}
            {locks.length === 0 && (
              <View style={styles.infoBox}>
                <MaterialCommunityIcons name="lock" size={28} color={Colors.textMuted} />
                <Text style={styles.infoText}>
                  Nessuna serratura intelligente configurata in questa abitazione. Aggiungi un dispositivo di tipo Serratura per controllarlo qui.
                </Text>
              </View>
            )}
          </>
        )}

        {activeTab === 'log' && (
          <>
            <Text style={styles.logHint}>Ultimi accessi registrati</Text>
            {accessLog.map(ev => (
              <View key={ev.id} style={[styles.logRow, !ev.ok && styles.logRowAlert]}>
                <MaterialCommunityIcons name={ev.icon} size={20} color={ev.ok ? Colors.success : Colors.danger} />
                <View style={styles.logInfo}>
                  <Text style={[styles.logEvent, !ev.ok && { color: Colors.danger }]}>{ev.event}</Text>
                  <Text style={styles.logBy}>da {ev.by}</Text>
                </View>
                <Text style={styles.logTime}>{ev.time}</Text>
              </View>
            ))}
            {accessLog.length === 0 && (
              <View style={[styles.infoBox, { backgroundColor: Colors.card, borderColor: Colors.border }]}>
                <MaterialCommunityIcons name="clipboard-list-outline" size={28} color={Colors.textMuted} />
                <Text style={styles.infoText}>
                  Nessun evento registrato nello storico degli ultimi 12 mesi.
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>



      {/* PIN Verification Modal */}
      <PinChallengeModal
        visible={pinVerifyModal.visible}
        lockName={pinVerifyModal.lockName}
        correctPin={activeGroupPin}
        onCorrectPin={() => {
          if (pinVerifyModal.lockId) {
            executeUnlock(pinVerifyModal.lockId);
          }
        }}
        onClose={() => setPinVerifyModal({ visible: false, lockId: null, lockName: '' })}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.lg, paddingBottom: Spacing.xxl },

  heroCard: {
    backgroundColor: Colors.successSoft, borderRadius: Radius.xl,
    padding: Spacing.lg, flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', borderWidth: 1, borderColor: Colors.success + '50',
    marginBottom: Spacing.md, ...Shadow.card,
  },
  heroCardAlert: {
    backgroundColor: Colors.danger + '15', borderColor: Colors.danger + '50',
  },
  heroLeft: { flex: 1 },
  heroStatus: { fontSize: 17, fontWeight: '800', color: Colors.textPrimary, marginBottom: 4 },
  heroSub: { ...Typography.body, color: Colors.textSecondary },
  heroRight: {},
  heroBigIcon: { fontSize: 50 },

  lockAllBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, backgroundColor: Colors.danger + '20',
    borderRadius: Radius.full, paddingVertical: 12,
    borderWidth: 1, borderColor: Colors.danger + '60',
    marginBottom: Spacing.md,
  },
  lockAllIcon: { fontSize: 18 },
  lockAllText: { fontSize: 15, fontWeight: '700', color: Colors.danger },

  tabs: {
    flexDirection: 'row', backgroundColor: Colors.card,
    borderRadius: Radius.md, padding: 3,
    marginBottom: Spacing.lg, borderWidth: 1, borderColor: Colors.border,
  },
  tab: { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: Radius.sm - 2 },
  tabActive: { backgroundColor: Colors.accent },
  tabText: { fontSize: 13, fontWeight: '600', color: Colors.textMuted },
  tabTextActive: { color: Colors.background, fontWeight: '700' },

  // Lock Card
  lockCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.xl,
    borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.md, marginBottom: Spacing.md, ...Shadow.card,
  },
  lockCardOpen: { borderColor: Colors.danger + '60', backgroundColor: Colors.danger + '08' },
  lockCardHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: Spacing.sm, gap: Spacing.sm },
  lockIconWrap: {
    width: 50, height: 50, borderRadius: 14, backgroundColor: Colors.card,
    justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Colors.border,
  },
  lockIcon: { fontSize: 26 },
  lockInfo: { flex: 1, gap: 3 },
  lockName: { ...Typography.bodyBold },
  lockRoom: { ...Typography.caption },
  lockStatusWrap: { alignItems: 'flex-end', gap: 4 },
  lockStatusDot: { width: 8, height: 8, borderRadius: 4 },
  lockStatusText: { fontSize: 12, fontWeight: '700' },

  lockEventRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.card, borderRadius: Radius.sm,
    paddingVertical: 7, paddingHorizontal: 10, marginBottom: Spacing.sm,
  },
  lockEventIcon: { fontSize: 13 },
  lockEventText: { ...Typography.caption, flex: 1 },

  lockActions: { flexDirection: 'row', gap: Spacing.sm },
  lockMainBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, backgroundColor: Colors.accentSoft, borderRadius: Radius.md,
    paddingVertical: 11, borderWidth: 1, borderColor: Colors.accent,
  },
  lockMainBtnOpen: { backgroundColor: Colors.danger + '15', borderColor: Colors.danger },
  lockMainBtnIcon: { fontSize: 16 },
  lockMainBtnText: { fontSize: 14, fontWeight: '700', color: Colors.accent },

  alarmBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: Spacing.md, paddingVertical: 11,
    backgroundColor: Colors.card, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border,
  },
  alarmBtnOn: { borderColor: Colors.accent + '60' },
  alarmBtnIcon: { fontSize: 15 },
  alarmBtnText: { fontSize: 12, fontWeight: '600', color: Colors.textMuted },

  infoBox: {
    flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start',
    backgroundColor: Colors.accentSoft + '60', borderRadius: Radius.lg,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.accent + '30', marginTop: Spacing.sm,
  },
  infoIcon: { fontSize: 18 },
  infoText: { flex: 1, fontSize: 12, color: Colors.textSecondary, lineHeight: 18 },

  // Log
  logHint: { ...Typography.caption, marginBottom: Spacing.md },
  logRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.card, borderRadius: Radius.md,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.border,
    marginBottom: Spacing.sm,
  },
  logRowAlert: { borderColor: Colors.danger + '60', backgroundColor: Colors.danger + '08' },
  logIcon: { fontSize: 20 },
  logInfo: { flex: 1 },
  logEvent: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
  logBy: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  logTime: { fontSize: 11, color: Colors.textMuted, textAlign: 'right' },
});
