import React, { useState, useEffect, useCallback } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, StatusBar, Animated,
  Modal, TextInput,
} from 'react-native';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../theme';
import AppHeader from '../../components/AppHeader';
import { useDeviceStore } from '../../store/DeviceStore';
import { useFocusEffect } from '@react-navigation/native';
const { api, getGruppo } = require('../../services/api');

const PERIOD_TABS = ['Oggi', 'Settimana', 'Mese', 'Anno'];

const CHART_DATA = {
  'Oggi':      [20, 35, 28, 42, 18, 55, 38, 60, 45, 72, 50, 30],
  'Settimana': [40, 65, 50, 80, 45, 70, 55],
  'Mese':      [320, 410, 380, 450, 390, 430, 400, 370, 420, 460, 350, 480],
  'Anno':      [2100, 1900, 2300, 2600, 2800, 3100, 3400, 3200, 2900, 2400, 2100, 1800],
};

const CHART_LABELS = {
  'Oggi':      ['1', '3', '5', '7', '9', '11', '13', '15', '17', '19', '21', '23'],
  'Settimana': ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'],
  'Mese':      ['1','3','5','7','9','11','13','15','17','19','21','23','25','28'],
  'Anno':      ['Gen','Feb','Mar','Apr','Mag','Giu','Lug','Ago','Set','Ott','Nov','Dic'],
};

const TIPS = [
  { icon: '💡', text: 'L\'aria condizionata consuma di più nelle ore 14-18. Considera di alzare di 2°C.' },
  { icon: '⏰', text: 'La lavatrice è più economica di notte (22:00–07:00): risparmia fino al 30%.' },
  { icon: '🌿', text: 'Questa settimana la tua CO₂ è sotto la media mensile. Ottimo lavoro!' },
];

/* ─── Mini Donut Chart (SVG-free, via view arcs) ─── */
function DonutRing({ devices, totalKWh }) {
  let cumPct = 0;
  const total = 360;
  return (
    <View style={donutStyles.wrap}>
      <View style={donutStyles.ring}>
        {devices.map((d, i) => {
          const deg = (d.pct / 100) * total;
          const style = {
            position: 'absolute',
            width: 80, height: 80,
            borderRadius: 40,
            borderWidth: 10,
            borderColor: 'transparent',
            borderTopColor: d.color,
            transform: [{ rotate: `${cumPct * 3.6}deg` }],
          };
          cumPct += d.pct;
          return <View key={d.name} style={style} />;
        })}
        <View style={donutStyles.center}>
          <Text style={donutStyles.centerVal}>{totalKWh}</Text>
          <Text style={donutStyles.centerUnit}>kWh</Text>
        </View>
      </View>
    </View>
  );
}

const donutStyles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md },
  ring: {
    width: 100, height: 100, borderRadius: 50,
    position: 'relative', alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.card,
  },
  center: {
    position: 'absolute', alignItems: 'center', justifyContent: 'center',
    width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.surface,
  },
  centerVal: { fontSize: 13, fontWeight: '800', color: Colors.textPrimary },
  centerUnit: { fontSize: 9, color: Colors.textMuted },
});

export default function AnalysisScreen({ navigation }) {
  const [activePeriod, setActivePeriod] = useState('Settimana');
  const [activeBar, setActiveBar] = useState(null);

  const [report, setReport] = useState(null);
  const [budgetLimit, setBudgetLimit] = useState(300);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [newBudgetInput, setNewBudgetInput] = useState('');

  const { rooms, devices, loadData } = useDeviceStore();

  const loadAnalysisData = async () => {
    try {
      await loadData();
      const apiPeriod = activePeriod.toLowerCase() === 'oggi' ? 'oggi' :
                        activePeriod.toLowerCase() === 'settimana' ? 'settimana' :
                        activePeriod.toLowerCase() === 'mese' ? 'mese' : 'anno';

      const rep = await api.getReport(apiPeriod);
      setReport(rep);

      const groups = await api.getGruppi();
      const activeId = getGruppo();
      const activeGroup = groups.find(g => String(g.id_gruppo) === String(activeId));
      if (activeGroup) {
        setBudgetLimit(activeGroup.budget_energia_settimanale || 300);
      }
    } catch (e) {
      console.warn("loadAnalysisData error:", e.message);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadAnalysisData();
    }, [activePeriod])
  );

  const handleUpdateBudget = async () => {
    const val = parseFloat(newBudgetInput);
    if (!isNaN(val) && val > 0) {
      try {
        await api.aggiornaBudget({ budget: val });
        setBudgetLimit(val);
        setShowBudgetModal(false);
        setNewBudgetInput('');
        await loadAnalysisData();
      } catch (e) {
        alert("Errore aggiornamento budget: " + e.message);
      }
    } else {
      alert("Inserisci un budget valido");
    }
  };

  const totalKWh = report ? parseFloat(report.totaleKWh) : 0;
  const costStr = report ? `€${parseFloat(report.costoEur).toFixed(2)}` : '€0.00';
  const co2Str = report ? `${parseFloat(report.co2Kg).toFixed(1)}` : '0';

  const templateData = CHART_DATA[activePeriod];
  const templateSum = templateData.reduce((a, b) => a + b, 0);
  const chartData = templateData.map(val => {
    if (templateSum === 0) return 0;
    return parseFloat(((val / templateSum) * totalKWh).toFixed(1));
  });

  const chartLabels = CHART_LABELS[activePeriod];
  const maxBar = Math.max(...chartData, 0.1);

  const rawDevices = report?.perDispositivo || {};
  const deviceKeys = Object.keys(rawDevices);
  let devicesList = [];
  if (deviceKeys.length > 0) {
    const totalWh = report.totaleWh || 1;
    devicesList = deviceKeys.map((name, index) => {
      const Wh = rawDevices[name];
      const kWh = Wh / 1000;
      const pct = Math.round((Wh / totalWh) * 100);
      let icon = '🔌';
      let color = Colors.textMuted;
      const lower = name.toLowerCase();
      if (lower.includes('luce') || lower.includes('lamp')) { icon = '💡'; color = '#C084FC'; }
      else if (lower.includes('aria') || lower.includes('clima') || lower.includes('condiz')) { icon = '❄️'; color = Colors.accent; }
      else if (lower.includes('lavatrice') || lower.includes('lavastoviglie')) { icon = '🌀'; color = Colors.success; }
      else if (lower.includes('tv') || lower.includes('televisore')) { icon = '📺'; color = Colors.warning; }
      else if (lower.includes('frigo')) { icon = '🥦'; color = '#F43F5E'; }

      return {
        name,
        icon,
        kWh: parseFloat(kWh.toFixed(1)),
        cost: `€${(kWh * 0.12).toFixed(2)}`,
        pct,
        color,
      };
    }).sort((a, b) => b.kWh - a.kWh);
  } else {
    devicesList = [];
  }

  // Scaling/checking budget
  const budgetProgressPct = budgetLimit > 0 ? Math.min(100, Math.round((totalKWh / budgetLimit) * 100)) : 0;
  const budgetColor = budgetProgressPct > 90 ? Colors.danger : budgetProgressPct > 70 ? Colors.warning : Colors.success;

  // Calcolo consumi attivi per stanza
  const roomConsumptions = rooms.map(room => {
    const roomDevices = devices.filter(d => d.roomId === room.id);
    const activeDevices = roomDevices.filter(d => d.isOn);
    const totalWatts = activeDevices.reduce((sum, d) => sum + (d.consumption || 0), 0);
    return {
      ...room,
      activeDevices,
      totalWatts,
    };
  }).sort((a, b) => b.totalWatts - a.totalWatts);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <AppHeader navigation={navigation} title="Analisi Energia" activeTab="Analysis" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Period Selector */}
        <View style={styles.periodTabs}>
          {PERIOD_TABS.map(tab => (
            <TouchableOpacity
              key={tab}
              style={[styles.periodTab, activePeriod === tab && styles.periodTabActive]}
              onPress={() => { setActivePeriod(tab); setActiveBar(null); }}
            >
              <Text style={[styles.periodTabText, activePeriod === tab && styles.periodTabTextActive]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCardLarge, { borderColor: Colors.accent + '40' }]}>
            <View style={styles.summaryCardHeader}>
              <MaterialCommunityIcons name="lightning-bolt" size={24} color={Colors.accent} />
              <View style={[styles.deltaBadge, { backgroundColor: Colors.success + '20' }]}>
                <Text style={[styles.deltaText, { color: Colors.success }]}>
                  {activePeriod === 'Oggi' ? '+2%' : activePeriod === 'Settimana' ? '-5%' : '-8%'}
                </Text>
              </View>
            </View>
            <Text style={[styles.summaryValue, { color: Colors.accent }]}>{totalKWh} kWh</Text>
            <Text style={styles.summaryUnit}>Consumati nel periodo</Text>
          </View>

          <View style={styles.summaryColRight}>
            <View style={[styles.summaryCardSmall, { borderColor: Colors.success + '40', marginBottom: Spacing.sm }]}>
              <MaterialCommunityIcons name="currency-eur" size={18} color={Colors.accent} />
              <Text style={[styles.summaryValueSm, { color: Colors.success }]}>{costStr}</Text>
              <Text style={styles.summaryUnitSm}>costo stimato</Text>
            </View>
            <View style={[styles.summaryCardSmall, { borderColor: '#A3E635' + '40' }]}>
              <MaterialCommunityIcons name="leaf" size={18} color={Colors.success} />
              <Text style={[styles.summaryValueSm, { color: '#A3E635' }]}>{co2Str} kg</Text>
              <Text style={styles.summaryUnitSm}>CO₂ emessa</Text>
            </View>
          </View>
        </View>

        {/* Budget Progress */}
        <View style={styles.budgetCard}>
          <View style={styles.budgetHeader}>
            <View>
              <Text style={styles.budgetTitle}>Budget Energetico Settimanale</Text>
              <Text style={styles.budgetMeta}>{totalKWh.toFixed(1)} / {budgetLimit} kWh</Text>
            </View>
            <TouchableOpacity onPress={() => { setNewBudgetInput(String(budgetLimit)); setShowBudgetModal(true); }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.accent }}>✏️ Modifica</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.budgetTrack}>
            <View style={[styles.budgetFill, { width: `${budgetProgressPct}%`, backgroundColor: budgetColor }]} />
            <View style={styles.budgetThreshold} />
          </View>
          <Text style={[styles.budgetHint, { color: budgetColor }]}>
            {budgetProgressPct >= 100 
              ? '🚨 Hai esaurito il budget impostato!' 
              : `Stai usando il ${budgetProgressPct}% del budget impostato`}
          </Text>
        </View>

        {/* Bar Chart */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>Andamento consumi</Text>
            {activeBar !== null && (
              <View style={styles.chartTooltip}>
                <Text style={styles.chartTooltipText}>
                  {chartLabels[activeBar]}: <Text style={{ color: Colors.accent, fontWeight: '700' }}>{chartData[activeBar]} kWh</Text>
                </Text>
              </View>
            )}
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={[styles.chart, { width: Math.max(chartData.length * 44, 300) }]}>
              {chartData.map((val, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.barGroup}
                  onPress={() => setActiveBar(activeBar === i ? null : i)}
                  activeOpacity={0.8}
                >
                  <View style={styles.barTrack}>
                    <View style={[
                      styles.bar,
                      {
                        height: `${(val / maxBar) * 100}%`,
                        backgroundColor: activeBar === i ? Colors.warning : (val === maxBar ? Colors.danger : Colors.accent),
                        opacity: activeBar !== null && activeBar !== i ? 0.35 : 1,
                      }
                    ]} />
                  </View>
                  <Text style={[styles.barLabel, activeBar === i && { color: Colors.accent }]}>
                    {chartLabels[i]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
          <View style={styles.chartLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: Colors.accent }]} />
              <Text style={styles.legendText}>Normale</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: Colors.danger }]} />
              <Text style={styles.legendText}>Picco massimo</Text>
            </View>
          </View>
        </View>

        {/* Room Consumption Section */}
        <Text style={[styles.sectionTitle, { marginTop: Spacing.lg, marginBottom: Spacing.md }]}>
          Consumo Attivo per Stanza
        </Text>
        <View style={styles.roomsConsCard}>
          {roomConsumptions.map((rc, idx) => (
            <View
              key={rc.id}
              style={[
                styles.roomConsRow,
                idx === roomConsumptions.length - 1 && { borderBottomWidth: 0 }
              ]}
            >
              <View style={styles.roomConsHeader}>
                <View style={styles.roomConsTitleCol}>
                  <Text style={styles.roomConsIcon}>{rc.icon || '🏠'}</Text>
                  <View>
                    <Text style={styles.roomConsName}>{rc.name}</Text>
                    <Text style={styles.roomConsMeta}>
                      {rc.activeDevices.length} su {devices.filter(d => d.roomId === rc.id).length} disp. attivi
                    </Text>
                  </View>
                </View>
                <View style={styles.roomConsPowerCol}>
                  <Text style={[styles.roomConsPowerVal, rc.totalWatts > 0 && { color: Colors.warning }]}>
                    {rc.totalWatts} W
                  </Text>
                </View>
              </View>
              {rc.activeDevices.length > 0 && (
                <View style={styles.roomConsDetail}>
                  {rc.activeDevices.map(d => (
                    <View key={d.id} style={styles.roomConsDeviceRow}>
                      <View style={{flexDirection:'row',alignItems:'center',gap:3}}><MaterialCommunityIcons name="lightning-bolt" size={12} color={Colors.accent} /><Text style={styles.roomConsDeviceName}>{d.name}</Text></View>
                      <Text style={styles.roomConsDevicePower}>{d.consumption || 0} W</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ))}
          {roomConsumptions.length === 0 && (
            <View style={styles.noRoomsBox}>
              <Text style={styles.noRoomsText}>Nessuna stanza configurata nell'abitazione.</Text>
            </View>
          )}
        </View>

        {/* Top Devices Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Dispositivi più energivori</Text>
          <TouchableOpacity style={styles.exportBtn} onPress={() => {}}>
            <Text style={styles.exportText}>↑ Esporta</Text>
          </TouchableOpacity>
        </View>

        {/* Distribution Row: Donut + Legend */}
        {devicesList.length > 0 ? (
          <View style={styles.distributionCard}>
            <DonutRing devices={devicesList} totalKWh={totalKWh.toFixed(1)} />
            <View style={styles.legendList}>
              {devicesList.map(d => (
                <View key={d.name} style={styles.legendRow}>
                  <View style={[styles.legendColorDot, { backgroundColor: d.color }]} />
                  <Text style={styles.legendDeviceName} numberOfLines={1}>{d.name}</Text>
                  <Text style={[styles.legendDevicePct, { color: d.color }]}>{d.pct}%</Text>
                </View>
              ))}
            </View>
          </View>
        ) : (
          <View style={[styles.infoBox, { marginTop: 0, marginBottom: Spacing.md }]}>
            <MaterialCommunityIcons name="chart-bar" size={28} color={Colors.textMuted} />
            <Text style={styles.infoText}>
              Nessun consumo rilevato per questo periodo. Aggiungi e attiva i dispositivi per monitorare l'energia consumata.
            </Text>
          </View>
        )}

        {/* Device Bars */}
        {devicesList.map((device, idx) => (
          <View key={device.name} style={styles.deviceRow}>
            <View style={[styles.deviceRank, { backgroundColor: idx < 3 ? device.color + '20' : Colors.card }]}>
              <Text style={styles.deviceRankText}>{idx + 1}</Text>
            </View>
            <Text style={styles.deviceIcon}>{device.icon}</Text>
            <View style={deviceInfoStyles.deviceInfo}>
              <View style={styles.deviceTop}>
                <Text style={styles.deviceName}>{device.name}</Text>
                <Text style={[styles.deviceCost, { color: device.color }]}>{device.cost}</Text>
              </View>
              <View style={styles.deviceTrack}>
                <View style={[styles.deviceFill, { width: `${device.pct}%`, backgroundColor: device.color }]} />
              </View>
              <Text style={styles.deviceMeta}>{device.kWh} kWh · {device.pct}% del totale</Text>
            </View>
          </View>
        ))}

        {/* Smart Tips */}
        <Text style={[styles.sectionTitle, { marginTop: Spacing.lg, marginBottom: Spacing.md }]}>
          Consigli Smart
        </Text>
        {TIPS.map((tip, i) => (
          <View key={i} style={styles.tipCard}>
            <Text style={styles.tipIcon}>{tip.icon}</Text>
            <Text style={styles.tipText}>{tip.text}</Text>
          </View>
        ))}

      </ScrollView>

      {/* Edit Budget Modal */}
      <Modal transparent visible={showBudgetModal} animationType="slide" onRequestClose={() => setShowBudgetModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Imposta Budget Settimanale</Text>
            <TextInput
              style={styles.modalInput}
              keyboardType="numeric"
              placeholder="Budget in kWh..."
              placeholderTextColor={Colors.textMuted}
              value={newBudgetInput}
              onChangeText={setNewBudgetInput}
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowBudgetModal(false)}>
                <Text style={styles.modalCancelText}>Annulla</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirmBtn} onPress={handleUpdateBudget}>
                <Text style={styles.modalConfirmText}>Salva</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const deviceInfoStyles = StyleSheet.create({
  deviceInfo: { flex: 1 }
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.lg, paddingBottom: Spacing.xxl },

  // Period tabs
  periodTabs: {
    flexDirection: 'row', backgroundColor: Colors.card, borderRadius: Radius.md,
    padding: 3, marginBottom: Spacing.lg, borderWidth: 1, borderColor: Colors.border,
  },
  periodTab: { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: Radius.sm - 2 },
  periodTabActive: { backgroundColor: Colors.accent },
  periodTabText: { fontSize: 13, fontWeight: '600', color: Colors.textMuted },
  periodTabTextActive: { color: Colors.background, fontWeight: '700' },

  // Summary
  summaryRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  summaryCardLarge: {
    flex: 1.2, backgroundColor: Colors.surface, borderRadius: Radius.lg,
    padding: Spacing.md, borderWidth: 1, ...Shadow.card,
  },
  summaryCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  summaryIcon: { fontSize: 22 },
  deltaBadge: { borderRadius: Radius.full, paddingVertical: 2, paddingHorizontal: 8 },
  deltaText: { fontSize: 11, fontWeight: '700' },
  summaryValue: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  summaryUnit: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },

  summaryColRight: { flex: 1, gap: Spacing.sm },
  summaryCardSmall: {
    flex: 1, backgroundColor: Colors.surface, borderRadius: Radius.lg,
    padding: Spacing.sm, borderWidth: 1, ...Shadow.card,
  },
  summaryIconSm: { fontSize: 16, marginBottom: 2 },
  summaryValueSm: { fontSize: 15, fontWeight: '800' },
  summaryUnitSm: { fontSize: 10, color: Colors.textMuted },

  // Budget
  budgetCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.warning + '40',
    marginBottom: Spacing.md, ...Shadow.card,
  },
  budgetHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm },
  budgetTitle: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  budgetMeta: { fontSize: 13, fontWeight: '700', color: Colors.warning },
  budgetTrack: {
    height: 8, backgroundColor: Colors.card, borderRadius: 4,
    overflow: 'hidden', marginBottom: Spacing.sm, position: 'relative',
  },
  budgetFill: { height: '100%', borderRadius: 4 },
  budgetThreshold: {
    position: 'absolute', right: '10%', top: 0, bottom: 0,
    width: 2, backgroundColor: Colors.danger,
  },
  budgetHint: { fontSize: 11, color: Colors.warning, fontWeight: '500' },

  // Chart
  chartCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.xl,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.border,
    marginBottom: Spacing.lg, ...Shadow.card,
  },
  chartHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: Spacing.md,
  },
  chartTitle: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, letterSpacing: 0.5 },
  chartTooltip: {
    backgroundColor: Colors.card, borderRadius: Radius.sm, paddingVertical: 4, paddingHorizontal: 10,
    borderWidth: 1, borderColor: Colors.border,
  },
  chartTooltipText: { fontSize: 12, color: Colors.textSecondary },
  chart: {
    flexDirection: 'row', alignItems: 'flex-end', height: 130,
    paddingBottom: Spacing.xs,
  },
  barGroup: { flex: 1, alignItems: 'center', minWidth: 36 },
  barTrack: {
    flex: 1, width: '55%', backgroundColor: Colors.card, borderRadius: 4,
    justifyContent: 'flex-end', overflow: 'hidden', marginBottom: 6,
  },
  bar: { borderRadius: 4, width: '100%' },
  barLabel: { fontSize: 10, color: Colors.textMuted, fontWeight: '500' },
  chartLegend: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.sm },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, color: Colors.textMuted },

  // Section
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: Spacing.md,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  exportBtn: {
    backgroundColor: Colors.card, borderRadius: Radius.full,
    paddingVertical: 7, paddingHorizontal: 14,
    borderWidth: 1, borderColor: Colors.border,
  },
  exportText: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },

  // Distribution card
  distributionCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.xl,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.border,
    flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md,
    ...Shadow.card,
  },
  legendList: { flex: 1, marginLeft: Spacing.md, gap: 8 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendColorDot: { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  legendDeviceName: { flex: 1, fontSize: 12, color: Colors.textSecondary },
  legendDevicePct: { fontSize: 12, fontWeight: '700', minWidth: 32, textAlign: 'right' },

  // Device rows
  deviceRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.card, borderRadius: Radius.md, padding: Spacing.md,
    borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.sm,
    gap: Spacing.sm, ...Shadow.card,
  },
  deviceRank: {
    width: 28, height: 28, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center', flexShrink: 0,
  },
  deviceRankText: { fontSize: 11, fontWeight: '800', color: Colors.textSecondary },
  deviceIcon: { fontSize: 22, flexShrink: 0 },
  deviceInfo: { flex: 1 },
  deviceTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  deviceName: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  deviceCost: { fontSize: 13, fontWeight: '700' },
  deviceTrack: { height: 4, backgroundColor: Colors.background, borderRadius: 2, overflow: 'hidden', marginBottom: 4 },
  deviceFill: { height: '100%', borderRadius: 2 },
  deviceMeta: { fontSize: 11, color: Colors.textMuted },

  // Tips
  tipCard: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    padding: Spacing.md, borderWidth: 1,
    borderColor: Colors.accentGlow + '30', marginBottom: Spacing.sm,
    gap: Spacing.sm, ...Shadow.card,
  },
  tipIcon: { fontSize: 20, flexShrink: 0 },
  tipText: { flex: 1, fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },

  // Rooms Consumption
  roomsConsCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.xl,
    paddingHorizontal: Spacing.md, borderWidth: 1, borderColor: Colors.border,
    marginBottom: Spacing.lg, ...Shadow.card,
  },
  roomConsRow: {
    borderBottomWidth: 1, borderBottomColor: Colors.border,
    paddingVertical: Spacing.md,
  },
  roomConsHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  roomConsTitleCol: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
  },
  roomConsIcon: { fontSize: 24 },
  roomConsName: { ...Typography.bodyBold, color: Colors.textPrimary },
  roomConsMeta: { ...Typography.caption, color: Colors.textMuted, marginTop: 2 },
  roomConsPowerCol: {
    alignItems: 'flex-end',
  },
  roomConsPowerVal: { fontSize: 16, fontWeight: '800', color: Colors.textSecondary },
  roomConsDetail: {
    marginTop: Spacing.sm, backgroundColor: Colors.card, borderRadius: Radius.md,
    padding: Spacing.sm, gap: 6, borderWidth: 1, borderColor: Colors.border,
  },
  roomConsDeviceRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  roomConsDeviceName: { fontSize: 12, color: Colors.textSecondary },
  roomConsDevicePower: { fontSize: 12, fontWeight: '700', color: Colors.textMuted },
  noRoomsBox: { padding: Spacing.lg, alignItems: 'center' },
  noRoomsText: { ...Typography.body, color: Colors.textMuted },
});
