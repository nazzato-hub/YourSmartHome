import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, StatusBar,
} from 'react-native';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../theme';
import { DeviceCard, SectionHeader } from '../../components';
import AppHeader from '../../components/AppHeader';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDeviceStore } from '../../store/DeviceStore';
import { DEVICE_TYPES, DEVICE_ICONS, DEVICE_ICONS_OFF } from '../../store/deviceConstants';
const { api, getGruppo } = require('../../services/api');


const FILTER_TABS = ['Tutti', 'Luci', 'Clima', 'Sicurezza', 'Altro'];

const FILTER_MAP = {
  Tutti:     function() { return true; },
  Luci:      function(d) { return d.type === 'Illuminazione'; },
  Clima:     function(d) { return d.type === 'Termostato' || d.type === 'Tapparelle'; },
  Sicurezza: function(d) { return d.type === 'Videosorveglianza' || d.type === 'Porta_Principale' || d.type === 'Sensore_Presenza'; },
  Altro:     function(d) { return d.type === 'Altro'; },
};




const SCENARIO_ICON_MAP = {
  '⚡': 'lightning-bolt',
  '🎬': 'movie-open',
  '🏠': 'home',
  '🌙': 'weather-night',
  '🚪': 'door-open',
  '🌱': 'leaf',
  '🎵': 'music-note',
  '🍽️': 'silverware-fork-knife',
  '💡': 'lightbulb-on',
};

function getScenarioIcon(icona) {
  if (!icona) return 'lightning-bolt';
  // Already a Material name (saved after the update)
  if (!icona.match(/\p{Emoji}/u)) return icona;
  // Legacy emoji — convert
  return SCENARIO_ICON_MAP[icona] || 'lightning-bolt';
}

export default function HomeScreen({ navigation }) {
  const { devices, toggleDevice, loadData, showNotificationBanner } = useDeviceStore();
  const [activeFilter, setActiveFilter] = useState('Tutti');
  const [budgetPct, setBudgetPct] = useState('73%');
  const [isBudgetOk, setIsBudgetOk] = useState(true);
  const [lastAlert, setLastAlert] = useState(null);
  const [dbScenarios, setDbScenarios] = useState([]);
  const [meteo, setMeteo] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const processedNotifIds = useRef(new Set());


  const roomDevices = devices.filter(d => d.roomId !== null && d.roomId !== undefined && d.roomId !== '');
  const activeCount = roomDevices.filter(d => d.isOn).length;
  const filteredDevices = roomDevices.filter(FILTER_MAP[activeFilter]);

  const openDevice = (device) => navigation.navigate('Device', { device });

  const fetchStatsAndAlerts = async () => {
    try {
      await loadData();
      
      const report = await api.getReport('settimana');
      const groups = await api.getGruppi();
      const activeId = getGruppo();
      const activeGroup = groups.find(g => String(g.id_gruppo) === String(activeId));
      if (activeGroup && report) {
        const limit = activeGroup.budget_energia_settimanale || 300;
        const current = (report.totaleWh || 0) / 1000;
        const pct = Math.min(100, Math.round((current / limit) * 100));
        setBudgetPct(`${pct}%`);
        setIsBudgetOk(pct < 95);
      }

      const alerts = await api.getStoricoAvvisi();
      if (alerts && alerts.length > 0) {
        const first = alerts[0];
        setLastAlert({
          title: first.tipo_avviso,
          sub: `${new Date(first.timestamp_evento).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · ${first.descrizione}`,
        });
      }

      // Controlla nuove notifiche per notifica locale in-app
      try {
        const notifs = await api.getNotifs();
        if (notifs && notifs.length > 0) {
          const unread = notifs.filter(n => !n.letta);
          for (const n of unread) {
            if (!processedNotifIds.current.has(n.id_notifica)) {
              processedNotifIds.current.add(n.id_notifica);

              // Solo se è recente (ultimi 2 minuti) per evitare spam
              const notifTime = new Date(n.timestamp).getTime();
              const nowTime = Date.now();
              if (nowTime - notifTime < 120000) {
                if (showNotificationBanner) {
                  showNotificationBanner(
                    n.urgente ? "🚨 Allarme Sicurezza!" : "🔔 Nuova Notifica",
                    n.messaggio,
                    n.tipo
                  );
                }
              }
            }
          }
        }
      } catch (err) {
        console.warn("fetchStatsAndAlerts notifications check error:", err.message);
      }

      const scens = await api.getScenarios();
      setDbScenarios(scens);

      try {
        const meteoRes = await api.getMeteoSuggerimenti();
        if (meteoRes) {
          setMeteo(meteoRes.meteo);
          setSuggestions(meteoRes.suggerimenti);
        }
      } catch (err) {
        console.warn("fetchStatsAndAlerts weather suggestions error:", err.message);
      }
    } catch (e) {
      console.warn("fetchStatsAndAlerts error:", e.message);
    }
  };


  useEffect(() => {
    fetchStatsAndAlerts();
    
    const timer = setInterval(fetchStatsAndAlerts, 10000);
    return () => clearInterval(timer);
  }, []);

  const handleToggleScenario = async (sc) => {
    try {
      if (sc.is_active) {
        await api.deactivateScene(sc.id_scenario);
        alert(`Scenario "${sc.nome_scenario}" disattivato!`);
      } else {
        await api.activateScene(sc.id_scenario);
        alert(`Scenario "${sc.nome_scenario}" attivato!`);
      }
      fetchStatsAndAlerts();
    } catch (e) {
      alert(e.message);
    }
  };

  const handleIgnoreSuggestion = (id) => {
    setSuggestions(prev => prev.filter(item => item.id !== id));
  };

  const handleApplySuggestion = async (sug) => {
    try {
      if (sug.azione === 'accendi') {
        await api.toggleDevice(sug.id_dispositivo);
      } else if (sug.azione === 'regola') {
        const body = { dettagli: {} };
        if (sug.tipo === 'Tapparelle') {
          body.dettagli.percentualeApertura = sug.valore;
        } else if (sug.tipo === 'Illuminazione') {
          body.dettagli.intensita = sug.valore;
        } else if (sug.tipo === 'Termostato') {
          body.dettagli.temperaturaImpostata = sug.valore;
        }
        await api.updateDevice(sug.id_dispositivo, body);
        
        const dev = devices.find(d => String(d.id) === String(sug.id_dispositivo));
        if (dev && !dev.isOn) {
          await api.toggleDevice(sug.id_dispositivo);
        }
      }
      alert(`Automazione applicata: ${sug.titolo}`);
      setSuggestions(prev => prev.filter(item => item.id !== sug.id));
      fetchStatsAndAlerts();
    } catch (e) {
      alert("Errore nell'applicazione dell'automazione: " + e.message);
    }
  };

  const totalConsumptionW = roomDevices.reduce((sum, d) => sum + (d.isOn ? (d.consumption || 0) : 0), 0);
  const totalConsumptionKW = (totalConsumptionW / 1000).toFixed(2);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <AppHeader navigation={navigation} title="Dashboard" activeTab="Home" />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Top Bar */}
        <View style={styles.topBar}>
          <View>
            <Text style={styles.greeting}>Bentornato</Text>
            <Text style={styles.subGreeting}>La tua casa è sotto controllo</Text>
          </View>
          <View style={styles.topBtns}>
            <TouchableOpacity style={styles.notifBtn} onPress={() => navigation.navigate('Notifications')}>
              <MaterialCommunityIcons name="bell" size={20} color={Colors.accent} />
              <View style={styles.notifDot} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('AddDevice')}>
              <Text style={styles.addBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroGlow} />
          <View style={styles.heroLeft}>
            <Text style={styles.heroLabel}>TEMPERATURA INTERNA</Text>
            <Text style={styles.heroTemp}>24°</Text>
            <Text style={styles.heroSub}>Umidità 58% · Ottimale</Text>
          </View>
          <View style={styles.heroRight}>
            <View style={styles.heroStatsRow}>
              <View style={styles.miniStat}>
                <Text style={styles.miniStatVal}>{activeCount}</Text>
                <Text style={styles.miniStatLabel}>Attivi</Text>
              </View>
              <View style={styles.miniStatDiv} />
              <View style={styles.miniStat}>
                <Text style={styles.miniStatVal}>{roomDevices.length}</Text>
                <Text style={styles.miniStatLabel}>Totali</Text>
              </View>
            </View>
            <MaterialCommunityIcons name="thermometer" size={44} color={Colors.accent} />
          </View>
        </View>

        {meteo && (
          <View style={styles.weatherWidget}>
            <View style={styles.weatherHeader}>
              <View style={styles.weatherInfoLeft}>
                <MaterialCommunityIcons name={meteo.weather_icon || 'weather-sunny'} size={28} color={Colors.accent} />
                <View style={{ marginLeft: 6 }}>
                  <Text style={styles.weatherTitle}>Meteo Roma</Text>
                  <Text style={styles.weatherStatus}>{meteo.stato} · {meteo.temperatura}°C</Text>
                </View>
              </View>
              <View style={styles.weatherBadge}>
                <Text style={styles.weatherBadgeText}>SMART ASSISTANT</Text>
              </View>
            </View>

            {suggestions.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestionsScroll}>
                {suggestions.map(sug => (
                  <View key={sug.id} style={styles.suggestionCard}>
                    <View style={styles.suggestionHeader}>
                      <Text style={styles.suggestionTitle} numberOfLines={1}>{sug.titolo}</Text>
                      <TouchableOpacity onPress={() => handleIgnoreSuggestion(sug.id)}>
                        <Text style={styles.ignoreText}>Ignora</Text>
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.suggestionMsg}>{sug.messaggio}</Text>
                    <TouchableOpacity style={styles.applyBtn} onPress={() => handleApplySuggestion(sug)}>
                      <Text style={styles.applyBtnText}>Applica</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.noSuggestionsRow}>
                <Text style={styles.noSuggestionsText}>Condizioni ambientali ottimali. Nessun suggerimento.</Text>
              </View>
            )}
          </View>
        )}

        {/* Status strip */}
        <View style={styles.statusStrip}>
          {[
            { label: 'Consumo ora', value: `${totalConsumptionKW} kW`, icon: 'lightning-bolt', ok: true },
            { label: 'Budget sett.', value: budgetPct,   icon: 'chart-bar', ok: isBudgetOk },
            { label: 'Sicurezza',   value: 'Attiva', icon: 'shield-check', ok: true },
          ].map(s => (
            <TouchableOpacity
              key={s.label}
              style={styles.statusItem}
              onPress={s.label !== 'Sicurezza' ? () => navigation.navigate('Analysis') : undefined}
            >
              <MaterialCommunityIcons name={s.icon} size={20} color={s.ok ? Colors.success : Colors.warning} />
              <Text style={[styles.statusValue, { color: s.ok ? Colors.success : Colors.warning }]}>{s.value}</Text>
              <Text style={styles.statusLabel}>{s.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Filter Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          {FILTER_TABS.map(tab => (
            <TouchableOpacity
              key={tab}
              style={[styles.filterTab, activeFilter === tab && styles.filterTabActive]}
              onPress={() => setActiveFilter(tab)}
            >
              <Text style={[styles.filterTabText, activeFilter === tab && styles.filterTabTextActive]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Devices Grid */}
        <SectionHeader
          title={`Dispositivi connessi (${filteredDevices.length})`}
          actionLabel="Vedi stanze →"
          onAction={() => navigation.navigate('Rooms')}
        />
        {filteredDevices.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="magnify" size={32} color={Colors.textMuted} />
            <Text style={styles.emptyText}>Nessun dispositivo in questa categoria</Text>
          </View>
        ) : (
          <View style={styles.devicesGrid}>
            {filteredDevices.map(device => (
              <DeviceCard
                key={device.id}
                name={device.name}
                icon={device.isOn ? (DEVICE_ICONS[device.type] || 'devices') : (DEVICE_ICONS_OFF[device.type] || 'devices')}
                isOn={device.isOn}
                onToggle={() => toggleDevice(device.id)}
                subtitle={device.subtitle}
                onPress={() => openDevice(device)}
              />
            ))}
          </View>
        )}

        {/* Quick Scenarios */}
        <SectionHeader
          title="Scenari rapidi"
          actionLabel="Gestisci →"
          onAction={() => navigation.navigate('Scenarios')}
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scenariosRow}>
          {dbScenarios.length === 0 ? (
            <View style={{ paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md }}>
              <Text style={{ ...Typography.caption, color: Colors.textMuted }}>
                Nessuno scenario creato. Tocca "Gestisci" per aggiungerne uno.
              </Text>
            </View>
          ) : (
            dbScenarios.map(sc => {
              const coinvolge = (sc.azioni || [])
                .map(a => a.nome_dispositivo || `Disp. #${a.id_dispositivo}`)
                .join(', ');
              return (
                <TouchableOpacity
                  key={sc.id_scenario}
                  style={[
                    styles.quickScenario,
                    { borderColor: (sc.colore || Colors.accent) + '50' },
                    sc.is_active && { backgroundColor: (sc.colore || Colors.accent) + '15', borderColor: sc.colore || Colors.accent }
                  ]}
                  activeOpacity={0.8}
                  onPress={() => handleToggleScenario(sc)}
                >
                  <View style={[styles.quickScenarioIconBg, { backgroundColor: (sc.colore || Colors.accent) + '20' }]}>
                    <MaterialCommunityIcons
                      name={getScenarioIcon(sc.icona_app)}
                      size={22}
                      color={sc.colore || Colors.accent}
                    />
                  </View>
                  <Text style={[styles.quickScenarioLabel, { color: sc.colore || Colors.textPrimary }]}>
                    {sc.nome_scenario}
                  </Text>
                  {coinvolge ? (
                    <Text style={{ fontSize: 9, color: Colors.textMuted, textAlign: 'center', marginTop: 2, maxWidth: 100 }} numberOfLines={1}>
                      {coinvolge}
                    </Text>
                  ) : (
                    <Text style={{ fontSize: 9, color: Colors.textMuted, textAlign: 'center', marginTop: 2 }}>
                      Nessun disp.
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>

        {/* Alert */}
        <TouchableOpacity style={styles.alertCard} onPress={() => navigation.navigate('Notifications')}>
          <View style={styles.alertLeft}>
            <MaterialCommunityIcons name={lastAlert ? 'alert-circle' : 'shield-check'} size={24} color={lastAlert ? Colors.danger : Colors.success} />
            <View>
              <Text style={[styles.alertTitle, lastAlert && { color: Colors.danger }]}>
                {lastAlert ? lastAlert.title : 'Allarme intruso attivo'}
              </Text>
              <Text style={styles.alertSub}>
                {lastAlert ? lastAlert.sub : 'Nessuna attività sospetta registrata'}
              </Text>
            </View>
          </View>
          <Text style={styles.alertArrow}>›</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.lg },
  greeting: { fontSize: 23, fontWeight: '700', color: Colors.textPrimary },
  subGreeting: { ...Typography.body, color: Colors.textMuted, marginTop: 2 },
  addBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: Colors.accent, justifyContent: 'center', alignItems: 'center', ...Shadow.accent },
  addBtnText: { fontSize: 26, color: Colors.background, fontWeight: '300', lineHeight: 32 },
  heroCard: {
    backgroundColor: Colors.accentSoft, borderRadius: Radius.xl, padding: Spacing.lg,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderWidth: 1, borderColor: Colors.accentGlow + '50', marginBottom: Spacing.md, ...Shadow.accent, overflow: 'hidden',
  },
  heroGlow: { position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: 60, backgroundColor: Colors.accentGlow + '18' },
  heroLeft: { flex: 1 },
  heroLabel: { fontSize: 9, fontWeight: '700', color: Colors.accent, letterSpacing: 2, marginBottom: 4 },
  heroTemp: { fontSize: 56, fontWeight: '800', color: Colors.textPrimary, letterSpacing: -3, lineHeight: 60 },
  heroSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 4 },
  heroRight: { alignItems: 'flex-end', gap: Spacing.sm },
  heroEmoji: { fontSize: 44 },
  heroStatsRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  miniStat: { alignItems: 'center' },
  miniStatVal: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary },
  miniStatLabel: { fontSize: 10, color: Colors.textSecondary, fontWeight: '500' },
  miniStatDiv: { width: 1, height: 30, backgroundColor: Colors.borderLight },
  statusStrip: { flexDirection: 'row', backgroundColor: Colors.card, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.lg, padding: Spacing.sm },
  statusItem: { flex: 1, alignItems: 'center', paddingVertical: Spacing.xs },
  statusIcon: { fontSize: 16, marginBottom: 2 },
  statusValue: { fontSize: 13, fontWeight: '700' },
  statusLabel: { fontSize: 10, color: Colors.textMuted, marginTop: 1 },
  filterRow: { marginBottom: Spacing.lg },
  filterTab: { paddingVertical: 9, paddingHorizontal: 18, borderRadius: Radius.full, marginRight: Spacing.sm, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border },
  filterTabActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  filterTabText: { ...Typography.label, color: Colors.textMuted },
  filterTabTextActive: { color: Colors.background, fontWeight: '700' },
  devicesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.lg },
  emptyState: { alignItems: 'center', paddingVertical: Spacing.xl, marginBottom: Spacing.lg },
  emptyIcon: { fontSize: 32, marginBottom: Spacing.sm },
  emptyText: { ...Typography.body, color: Colors.textMuted },
  topBtns: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' },
  notifBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: Colors.card, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Colors.border, position: 'relative' },
  notifBtnIcon: { fontSize: 20 },
  notifDot: { position: 'absolute', top: 8, right: 8, width: 9, height: 9, borderRadius: 5, backgroundColor: Colors.danger, borderWidth: 1.5, borderColor: Colors.background },
  scenariosRow: { marginBottom: Spacing.lg },
  quickScenario: { backgroundColor: Colors.card, borderRadius: Radius.lg, paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg, marginRight: Spacing.sm, alignItems: 'center', borderWidth: 1, minWidth: 86, gap: 6 },
  quickScenarioIconBg: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  quickScenarioIconText: { fontSize: 22 },
  quickScenarioLabel: { fontSize: 12, fontWeight: '700' },
  alertCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.md, borderWidth: 1, borderColor: Colors.warning + '40', ...Shadow.card },
  alertLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  alertIcon: { fontSize: 22 },
  alertTitle: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
  alertSub: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  alertArrow: { fontSize: 20, color: Colors.textMuted },
  weatherWidget: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
    ...Shadow.card,
  },
  weatherHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border + '50',
    paddingBottom: Spacing.xs,
  },
  weatherInfoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weatherEmoji: {
    fontSize: 28,
  },
  weatherTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  weatherStatus: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  weatherBadge: {
    backgroundColor: Colors.accentSoft + '40',
    borderWidth: 1,
    borderColor: Colors.accent + '50',
    borderRadius: Radius.full,
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  weatherBadgeText: {
    fontSize: 8,
    fontWeight: '800',
    color: Colors.accent,
    letterSpacing: 0.5,
  },
  suggestionsScroll: {
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  suggestionCard: {
    backgroundColor: Colors.cardAlt,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    width: 250,
    marginRight: Spacing.sm,
  },
  suggestionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  suggestionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.accent,
    flex: 1,
  },
  ignoreText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  suggestionMsg: {
    fontSize: 11,
    color: Colors.textSecondary,
    lineHeight: 15,
    marginBottom: Spacing.md,
  },
  applyBtn: {
    backgroundColor: Colors.accent,
    borderRadius: Radius.md,
    paddingVertical: 6,
    alignItems: 'center',
  },
  applyBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.background,
  },
  noSuggestionsRow: {
    paddingVertical: Spacing.xs,
  },
  noSuggestionsText: {
    fontSize: 11,
    color: Colors.textMuted,
  },
});
