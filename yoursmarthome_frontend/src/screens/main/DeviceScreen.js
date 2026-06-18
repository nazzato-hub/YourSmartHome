
import React, { useState, useRef, useEffect } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, StatusBar, Animated, Alert,
} from 'react-native';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../theme';
import AppHeader from '../../components/AppHeader';
import { SmartToggle } from '../../components';
import { useDeviceStore } from '../../store/DeviceStore';

/* ─── Shared Tab Styles ─── */
const tabStyles = StyleSheet.create({
  container: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.xl },
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flex: 1 },
  rowIcon: { fontSize: 20 },
  rowLabel: { ...Typography.bodyBold, fontSize: 14 },
  rowSub: { ...Typography.caption, marginTop: 2 },
  timerPicker: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, paddingVertical: Spacing.md },
  timerChip: {
    backgroundColor: Colors.accentSoft, borderRadius: Radius.full,
    paddingVertical: 7, paddingHorizontal: 16, borderWidth: 1, borderColor: Colors.accent,
  },
  timerChipText: { fontSize: 13, fontWeight: '600', color: Colors.accent },
  scheduleLabel: { ...Typography.label, marginBottom: Spacing.sm },
  daysRow: { flexDirection: 'row', gap: Spacing.xs, marginBottom: Spacing.md },
  dayBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.card, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  dayBtnActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  dayLabel: { fontSize: 12, fontWeight: '700', color: Colors.textMuted },
  dayLabelActive: { color: Colors.background },
  timeChip: {
    backgroundColor: Colors.accentSoft, borderRadius: Radius.sm,
    paddingVertical: 6, paddingHorizontal: 14, borderWidth: 1, borderColor: Colors.accent,
  },
  timeChipText: { fontSize: 14, fontWeight: '700', color: Colors.accent },
  graphHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.md },
  graphTotal: { fontSize: 26, fontWeight: '800', color: Colors.textPrimary },
  graphSub: { ...Typography.caption },
  graphCost: { alignItems: 'flex-end' },
  graphCostVal: { fontSize: 18, fontWeight: '700', color: Colors.success },
  graphCostLabel: { ...Typography.caption },
  chart: { flexDirection: 'row', height: 100, alignItems: 'flex-end', gap: 6 },
  barCol: { flex: 1, alignItems: 'center', gap: 3 },
  barVal: { fontSize: 8, color: Colors.textMuted },
  barTrack: { flex: 1, width: '70%', backgroundColor: Colors.card, borderRadius: 3, justifyContent: 'flex-end', overflow: 'hidden' },
  bar: { backgroundColor: Colors.accent, borderRadius: 3, width: '100%' },
  barLabel: { fontSize: 10, color: Colors.textMuted, fontWeight: '600' },
  moreRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  moreIcon: { fontSize: 20, width: 28, textAlign: 'center' },
  moreInfo: { flex: 1 },
  moreLabel: { ...Typography.bodyBold, fontSize: 14 },
  moreSub: { ...Typography.caption, marginTop: 1 },
  moreChevron: { fontSize: 20, color: Colors.textMuted },
  deleteRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingVertical: 14, marginTop: Spacing.md,
    borderWidth: 1, borderColor: Colors.danger + '40',
    borderRadius: Radius.md, paddingHorizontal: Spacing.md,
  },
  deleteIcon: { fontSize: 18 },
  deleteLabel: { fontSize: 14, fontWeight: '600', color: Colors.danger },
  propCard: {
    backgroundColor: Colors.card, borderRadius: Radius.lg,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  propTitle: { ...Typography.label, marginBottom: Spacing.sm },
  propRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.border },
  propLabel: { fontSize: 13, color: Colors.textSecondary },
  propValue: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary },
  sliderRow: { marginBottom: Spacing.sm },
  sliderLabel: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  sliderTrack: { height: 6, backgroundColor: Colors.card, borderRadius: 3, overflow: 'hidden' },
  sliderFill: { height: '100%', borderRadius: 3 },
  sliderBtns: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  sliderBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.card, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  sliderBtnText: { fontSize: 18, color: Colors.textPrimary, fontWeight: '300' },
});

/* ─── Device-specific controls ─── */
function ThermostatControls({ device, onUpdate }) {
  const temp = device.dettagli?.temperatura_impostata || 22;
  const mode = device.dettagli?.modalita || 'riscaldamento';
  const MODES = ['riscaldamento', 'raffreddamento', 'auto', 'off'];
  
  const handleTempChange = (newTemp) => {
    onUpdate({ temperaturaImpostata: newTemp });
  };
  
  const handleModeChange = (newMode) => {
    onUpdate({ modalita: newMode });
  };

  return (
    <View style={tabStyles.propCard}>
      <Text style={tabStyles.propTitle}>CONTROLLO TERMOSTATO</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md }}>
        <TouchableOpacity style={tabStyles.sliderBtn} onPress={() => handleTempChange(Math.max(10, temp - 0.5))}>
          <Text style={tabStyles.sliderBtnText}>−</Text>
        </TouchableOpacity>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 48, fontWeight: '800', color: Colors.accent, letterSpacing: -2 }}>{temp}°</Text>
          <Text style={{ fontSize: 12, color: Colors.textMuted }}>Temperatura impostata</Text>
        </View>
        <TouchableOpacity style={tabStyles.sliderBtn} onPress={() => handleTempChange(Math.min(30, temp + 0.5))}>
          <Text style={tabStyles.sliderBtnText}>+</Text>
        </TouchableOpacity>
      </View>
      <View style={[tabStyles.propRow, { borderBottomWidth: 0 }]}>
        <View style={{flexDirection:'row',alignItems:'center',gap:5}}><MaterialCommunityIcons name="thermometer" size={14} color={Colors.textMuted} /><Text style={tabStyles.propLabel}>Temperatura rilevata</Text></View>
        <Text style={[tabStyles.propValue, { color: Colors.warning }]}>{device.dettagli?.temperatura_rilevata || 19.5}°C</Text>
      </View>
      <Text style={[tabStyles.propTitle, { marginTop: Spacing.sm }]}>MODALITÀ</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
        {MODES.map(m => (
          <TouchableOpacity
            key={m}
            onPress={() => handleModeChange(m)}
            style={[tabStyles.timerChip, mode === m && { backgroundColor: Colors.accent }]}
          >
            <Text style={[tabStyles.timerChipText, mode === m && { color: Colors.background }]}>{m.toUpperCase()}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function LightControls({ device, onUpdate }) {
  const intensity = device.dettagli?.intensita || 100;
  const selectedColor = device.dettagli?.colore_rgb || '#FFFFFF';
  const COLORS = ['#FFFFFF', '#FFF9C4', '#FFCC80', '#80DEEA', '#CE93D8', '#EF9A9A'];
  
  const handleIntensityChange = (val) => {
    onUpdate({ intensita: val });
  };
  
  const handleColorChange = (col) => {
    onUpdate({ coloreRgb: col });
  };

  return (
    <View style={tabStyles.propCard}>
      <Text style={tabStyles.propTitle}>CONTROLLO LUCE</Text>
      <View style={tabStyles.sliderRow}>
        <View style={tabStyles.sliderLabel}>
          <Text style={{ fontSize: 13, color: Colors.textSecondary }}>☀️ Intensità</Text>
          <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.accent }}>{intensity}%</Text>
        </View>
        <View style={tabStyles.sliderTrack}>
          <View style={[tabStyles.sliderFill, { width: `${intensity}%`, backgroundColor: Colors.accent }]} />
        </View>
        <View style={tabStyles.sliderBtns}>
          <TouchableOpacity style={tabStyles.sliderBtn} onPress={() => handleIntensityChange(Math.max(0, intensity - 10))}>
            <Text style={tabStyles.sliderBtnText}>−</Text>
          </TouchableOpacity>
          {[25, 50, 75, 100].map(v => (
            <TouchableOpacity
              key={v}
              onPress={() => handleIntensityChange(v)}
              style={[tabStyles.timerChip, { paddingVertical: 5, paddingHorizontal: 10 }]}
            >
              <Text style={tabStyles.timerChipText}>{v}%</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={tabStyles.sliderBtn} onPress={() => handleIntensityChange(Math.min(100, intensity + 10))}>
            <Text style={tabStyles.sliderBtnText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
      <Text style={[tabStyles.propTitle, { marginTop: Spacing.sm }]}>COLORE</Text>
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 6 }}>
        {COLORS.map(c => (
          <TouchableOpacity
            key={c}
            onPress={() => handleColorChange(c)}
            style={{
              width: 32, height: 32, borderRadius: 16, backgroundColor: c,
              borderWidth: selectedColor === c ? 3 : 1,
              borderColor: selectedColor === c ? Colors.accent : Colors.border,
            }}
          />
        ))}
      </View>
    </View>
  );
}

function CameraControls({ device, onUpdate }) {
  const recording = device.dettagli?.registrazione_attiva !== false;
  return (
    <View style={tabStyles.propCard}>
      <Text style={tabStyles.propTitle}>VIDEOSORVEGLIANZA</Text>
      <View style={tabStyles.propRow}>
        <View style={{flexDirection:'row',alignItems:'center',gap:5}}><MaterialCommunityIcons name="access-point" size={14} color={Colors.textMuted} /><Text style={tabStyles.propLabel}>Stato Streaming</Text></View>
        <Text style={[tabStyles.propValue, { color: Colors.success }]}>Live ●</Text>
      </View>
      <View style={tabStyles.propRow}>
        <View style={{flexDirection:'row',alignItems:'center',gap:5}}><MaterialCommunityIcons name="television" size={14} color={Colors.textMuted} /><Text style={tabStyles.propLabel}>Risoluzione</Text></View>
        <Text style={tabStyles.propValue}>{device.dettagli?.risoluzione || '1080p'}</Text>
      </View>
      <View style={[tabStyles.row, { borderBottomWidth: 0 }]}>
        <View style={tabStyles.rowLeft}>
          <MaterialCommunityIcons name="record-circle" size={18} color={Colors.danger} />
          <View>
            <Text style={tabStyles.rowLabel}>Registrazione Attiva</Text>
            <Text style={tabStyles.rowSub}>Salva su cloud automaticamente</Text>
          </View>
        </View>
        <SmartToggle value={recording} onValueChange={(val) => onUpdate({ registrazioneAttiva: val })} />
      </View>
      <TouchableOpacity style={[tabStyles.timerChip, { alignSelf: 'flex-start', marginTop: Spacing.sm }]}>
        <Text style={tabStyles.timerChipText}>▶ Vedi Live Stream</Text>
      </TouchableOpacity>
    </View>
  );
}

function LockControls({ device, onUpdate }) {
  const locked = device.dettagli?.stato_serratura !== 'aperta';
  const alarm = true;
  return (
    <View style={tabStyles.propCard}>
      <Text style={tabStyles.propTitle}>CONTROLLO SERRATURA</Text>
      <View style={tabStyles.propRow}>
        <View style={{flexDirection:'row',alignItems:'center',gap:5}}><MaterialCommunityIcons name="lock" size={14} color={Colors.textMuted} /><Text style={tabStyles.propLabel}>Stato</Text></View>
        <Text style={[tabStyles.propValue, { color: locked ? Colors.success : Colors.danger }]}>
          {locked ? 'Chiusa' : 'Aperta'}
        </Text>
      </View>
      <View style={[tabStyles.row, { borderBottomWidth: 0 }]}>
        <View style={tabStyles.rowLeft}>
          <MaterialCommunityIcons name="shield-check" size={18} color={Colors.accent} />
          <Text style={tabStyles.rowLabel}>Allarme Intrusione</Text>
        </View>
        <SmartToggle value={alarm} onValueChange={() => {}} />
      </View>
      <TouchableOpacity
        style={[tabStyles.timerChip, { alignSelf: 'center', marginTop: Spacing.md, borderColor: locked ? Colors.success : Colors.danger }]}
        onPress={() => onUpdate({ statoSerratura: locked ? 'aperta' : 'chiusa' })}
      >
        <Text style={[tabStyles.timerChipText, { color: locked ? Colors.success : Colors.danger }]}>
          {locked ? '🔓 Sblocca Porta' : '🔒 Blocca Porta'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function BlindsControls({ device, onUpdate }) {
  const pct = device.dettagli?.percentuale_apertura || 0;
  return (
    <View style={tabStyles.propCard}>
      <Text style={tabStyles.propTitle}>CONTROLLO TAPPARELLE</Text>
      <View style={tabStyles.sliderRow}>
        <View style={tabStyles.sliderLabel}>
          <View style={{flexDirection:'row',alignItems:'center',gap:4}}><MaterialCommunityIcons name="window-open-variant" size={13} color={Colors.textSecondary} /><Text style={{ fontSize: 13, color: Colors.textSecondary }}>Apertura</Text></View>
          <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.accent }}>{pct}%</Text>
        </View>
        <View style={tabStyles.sliderTrack}>
          <View style={[tabStyles.sliderFill, { width: `${pct}%`, backgroundColor: Colors.accent }]} />
        </View>
        <View style={[tabStyles.sliderBtns, { justifyContent: 'center', gap: 8 }]}>
          {[0, 25, 50, 75, 100].map(v => (
            <TouchableOpacity key={v} onPress={() => onUpdate({ percentualeApertura: v })} style={[tabStyles.timerChip, { paddingVertical: 5, paddingHorizontal: 10 }]}>
              <Text style={tabStyles.timerChipText}>{v === 0 ? 'Chiuse' : v === 100 ? 'Aperte' : `${v}%`}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}

/* ─── Generic prop display ─── */
function GenericControls() {
  return (
    <View style={tabStyles.propCard}>
      <Text style={tabStyles.propTitle}>STATO DISPOSITIVO</Text>
      <View style={tabStyles.propRow}>
        <View style={{flexDirection:'row',alignItems:'center',gap:5}}><MaterialCommunityIcons name="wifi" size={14} color={Colors.textMuted} /><Text style={tabStyles.propLabel}>Connessione</Text></View>
        <Text style={[tabStyles.propValue, { color: Colors.success }]}>Wi-Fi ● Ottimo</Text>
      </View>
      <View style={[tabStyles.propRow, { borderBottomWidth: 0 }]}>
        <View style={{flexDirection:'row',alignItems:'center',gap:5}}><MaterialCommunityIcons name="timer-outline" size={14} color={Colors.textMuted} /><Text style={tabStyles.propLabel}>Uptime</Text></View>
        <Text style={tabStyles.propValue}>3 giorni</Text>
      </View>
    </View>
  );
}

function TimerTab({ device, onUpdate }) {
  const timerOn = !!device.timerMinuti;
  
  const TIMER_OPTIONS = [
    { label: '30 min', val: 30 },
    { label: '1 ora', val: 60 },
    { label: '2 ore', val: 120 },
    { label: '4 ore', val: 240 },
    { label: '8 ore', val: 480 },
  ];

  const handleToggleTimer = (val) => {
    if (val) {
      onUpdate({ timerMinuti: 30 });
    } else {
      onUpdate({ timerMinuti: null });
    }
  };

  return (
    <View style={tabStyles.container}>
      <View style={tabStyles.row}>
        <View style={tabStyles.rowLeft}>
          <MaterialCommunityIcons name="timer-outline" size={18} color={Colors.accent} />
          <View>
            <Text style={tabStyles.rowLabel}>Spegni automaticamente</Text>
            <Text style={tabStyles.rowSub}>Imposta un timer di spegnimento</Text>
          </View>
        </View>
        <SmartToggle value={timerOn} onValueChange={handleToggleTimer} />
      </View>
      {timerOn && (
        <View style={tabStyles.timerPicker}>
          {TIMER_OPTIONS.map(opt => {
            const isActive = device.timerMinuti === opt.val;
            return (
              <TouchableOpacity 
                key={opt.val} 
                style={[
                  tabStyles.timerChip, 
                  isActive && { backgroundColor: Colors.accent }
                ]}
                onPress={() => onUpdate({ timerMinuti: opt.val })}
              >
                <Text style={[
                  tabStyles.timerChipText,
                  isActive && { color: Colors.background }
                ]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}

function ScheduleTab({ device, onUpdate }) {
  const DAYS = ['L', 'M', 'M', 'G', 'V', 'S', 'D'];
  const schedActive = !!device.schedAttivo;
  const activeDays = device.schedGiorni ? device.schedGiorni.split(',').map(Number) : [];
  const [editingField, setEditingField] = useState(null); // 'accensione', 'spegnimento', or null

  const handleToggleDay = (idx) => {
    let next;
    if (activeDays.includes(idx)) {
      next = activeDays.filter(d => d !== idx);
    } else {
      next = [...activeDays, idx];
    }
    onUpdate({ schedGiorni: next.join(',') });
  };

  const adjustTime = (field, deltaMinutes) => {
    const currentTime = field === 'accensione' 
      ? (device.schedAccensione || '07:00') 
      : (device.schedSpegnimento || '23:30');
    const [hStr, mStr] = currentTime.split(':');
    let hours = parseInt(hStr, 10);
    let minutes = parseInt(mStr, 10);
    
    let totalMinutes = hours * 60 + minutes + deltaMinutes;
    if (totalMinutes < 0) totalMinutes += 1440;
    totalMinutes = totalMinutes % 1440;
    
    const newHours = Math.floor(totalMinutes / 60);
    const newMinutes = totalMinutes % 60;
    
    const formattedTime = `${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`;
    
    if (field === 'accensione') {
      onUpdate({ schedAccensione: formattedTime });
    } else {
      onUpdate({ schedSpegnimento: formattedTime });
    }
  };

  return (
    <View style={tabStyles.container}>
      {/* Enable Schedule Toggle */}
      <View style={tabStyles.row}>
        <View style={tabStyles.rowLeft}>
          <MaterialCommunityIcons name="calendar" size={18} color={Colors.accent} />
          <View>
            <Text style={tabStyles.rowLabel}>Abilita programmazione</Text>
            <Text style={tabStyles.rowSub}>Accendi e spegni a orari stabiliti</Text>
          </View>
        </View>
        <SmartToggle 
          value={schedActive} 
          onValueChange={(val) => {
            onUpdate({ schedAttivo: val });
            if (val && !device.schedGiorni) {
              onUpdate({ schedAttivo: val, schedGiorni: '0,1,2,3,4', schedAccensione: '07:00', schedSpegnimento: '23:30' });
            }
          }} 
        />
      </View>

      {schedActive && (
        <View style={{ marginTop: Spacing.sm }}>
          <Text style={tabStyles.scheduleLabel}>Giorni attivi</Text>
          <View style={tabStyles.daysRow}>
            {DAYS.map((d, i) => {
              const isActive = activeDays.includes(i);
              return (
                <TouchableOpacity 
                  key={i} 
                  style={[tabStyles.dayBtn, isActive && tabStyles.dayBtnActive]} 
                  onPress={() => handleToggleDay(i)}
                >
                  <Text style={[tabStyles.dayLabel, isActive && tabStyles.dayLabelActive]}>{d}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Turn On Time */}
          <View style={tabStyles.row}>
            <View style={tabStyles.rowLeft}>
              <MaterialCommunityIcons name="clock-start" size={18} color={Colors.success} />
              <Text style={tabStyles.rowLabel}>Ora accensione</Text>
            </View>
            <TouchableOpacity 
              style={[tabStyles.timeChip, editingField === 'accensione' && { borderColor: Colors.accent }]}
              onPress={() => setEditingField(editingField === 'accensione' ? null : 'accensione')}
            >
              <Text style={tabStyles.timeChipText}>{device.schedAccensione || '07:00'}</Text>
            </TouchableOpacity>
          </View>
          {editingField === 'accensione' && (
            <View style={styles.adjusterRow}>
              <TouchableOpacity style={styles.adjustBtn} onPress={() => adjustTime('accensione', -60)}>
                <Text style={styles.adjustBtnText}>-1h</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.adjustBtn} onPress={() => adjustTime('accensione', -5)}>
                <Text style={styles.adjustBtnText}>-5m</Text>
              </TouchableOpacity>
              <Text style={styles.adjustValue}>{device.schedAccensione || '07:00'}</Text>
              <TouchableOpacity style={styles.adjustBtn} onPress={() => adjustTime('accensione', 5)}>
                <Text style={styles.adjustBtnText}>+5m</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.adjustBtn} onPress={() => adjustTime('accensione', 60)}>
                <Text style={styles.adjustBtnText}>+1h</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Turn Off Time */}
          <View style={tabStyles.row}>
            <View style={tabStyles.rowLeft}>
              <MaterialCommunityIcons name="clock-end" size={18} color={Colors.danger} />
              <Text style={tabStyles.rowLabel}>Ora spegnimento</Text>
            </View>
            <TouchableOpacity 
              style={[tabStyles.timeChip, editingField === 'spegnimento' && { borderColor: Colors.accent }]}
              onPress={() => setEditingField(editingField === 'spegnimento' ? null : 'spegnimento')}
            >
              <Text style={tabStyles.timeChipText}>{device.schedSpegnimento || '23:30'}</Text>
            </TouchableOpacity>
          </View>
          {editingField === 'spegnimento' && (
            <View style={styles.adjusterRow}>
              <TouchableOpacity style={styles.adjustBtn} onPress={() => adjustTime('spegnimento', -60)}>
                <Text style={styles.adjustBtnText}>-1h</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.adjustBtn} onPress={() => adjustTime('spegnimento', -5)}>
                <Text style={styles.adjustBtnText}>-5m</Text>
              </TouchableOpacity>
              <Text style={styles.adjustValue}>{device.schedSpegnimento || '23:30'}</Text>
              <TouchableOpacity style={styles.adjustBtn} onPress={() => adjustTime('spegnimento', 5)}>
                <Text style={styles.adjustBtnText}>+5m</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.adjustBtn} onPress={() => adjustTime('spegnimento', 60)}>
                <Text style={styles.adjustBtnText}>+1h</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

function GraphTab({ consumption }) {
  const BAR_DATA = [45, 60, 38, 72, 55, 80, 48];
  const BAR_LABELS = ['L', 'M', 'M', 'G', 'V', 'S', 'D'];
  const maxVal = Math.max(...BAR_DATA);
  return (
    <View style={tabStyles.container}>
      <View style={tabStyles.graphHeader}>
        <View>
          <Text style={tabStyles.graphTotal}>{consumption} kWh</Text>
          <Text style={tabStyles.graphSub}>Consumo mensile stimato</Text>
        </View>
        <View style={tabStyles.graphCost}>
          <Text style={tabStyles.graphCostVal}>€{(consumption * 0.12).toFixed(2)}</Text>
          <Text style={tabStyles.graphCostLabel}>costo</Text>
        </View>
      </View>
      <View style={tabStyles.chart}>
        {BAR_DATA.map((val, i) => (
          <View key={i} style={tabStyles.barCol}>
            <Text style={tabStyles.barVal}>{val}</Text>
            <View style={tabStyles.barTrack}>
              <View style={[tabStyles.bar, { height: `${(val / maxVal) * 100}%` }]} />
            </View>
            <Text style={tabStyles.barLabel}>{BAR_LABELS[i]}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function MoreTab({ deviceName, onDelete }) {
  return (
    <View style={tabStyles.container}>
      {[
        { icon: '✏️', label: 'Rinomina dispositivo', sub: deviceName },
        { icon: '🔗', label: 'Stanza assegnata', sub: 'Soggiorno' },
        { icon: '🔄', label: 'Aggiorna firmware', sub: 'v2.1.4 — aggiornato' },
        { icon: '📡', label: 'Stato connessione', sub: 'Wi-Fi · segnale ottimo' },
        { icon: '🔍', label: 'Informazioni dispositivo', sub: 'Modello / Seriale' },
      ].map(item => (
        <TouchableOpacity key={item.label} style={tabStyles.moreRow}>
          <Text style={tabStyles.moreIcon}>{item.icon}</Text>
          <View style={tabStyles.moreInfo}>
            <Text style={tabStyles.moreLabel}>{item.label}</Text>
            <Text style={tabStyles.moreSub}>{item.sub}</Text>
          </View>
          <Text style={tabStyles.moreChevron}>›</Text>
        </TouchableOpacity>
      ))}
      <TouchableOpacity style={tabStyles.deleteRow} onPress={onDelete}>
        <MaterialCommunityIcons name="trash-can-outline" size={20} color={Colors.danger} />
        <Text style={tabStyles.deleteLabel}>Rimuovi dispositivo</Text>
      </TouchableOpacity>
    </View>
  );
}

/* ─── Bottom tabs ─── */
const BOTTOM_TABS = [
  { key: 'controls', label: 'Controlli', icon: '🎛️' },
  { key: 'timer',    label: 'Timer',     icon: '⏱️'  },
  { key: 'schedule', label: 'Pianifica', icon: '📅'  },
  { key: 'graph',    label: 'Grafico',   icon: '📊'  },
  { key: 'more',     label: 'Altro',     icon: '⋯'   },
];

/* ─── Main DeviceScreen ─── */
export default function DeviceScreen({ navigation, route }) {
  const routeDevice = route?.params?.device ?? {
    id: 'sample', name: 'Lampadario Soggiorno', type: 'Luce',
    icon: '💡', isOn: true, consumption: 220, room: 'Soggiorno',
  };

  const { devices, toggleDevice, updateDevice, deleteDevice } = useDeviceStore();
  const device = devices.find(d => String(d.id) === String(routeDevice.id)) || routeDevice;

  const handleDelete = () => {
    Alert.alert(
      "Elimina Dispositivo",
      `Sei sicuro di voler eliminare definitivamente "${device.name}" dal sistema?`,
      [
        { text: "Annulla", style: "cancel" },
        {
          text: "Elimina",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDevice(device.id);
              navigation.goBack();
            } catch (e) {
              Alert.alert("Errore", "Impossibile eliminare il dispositivo: " + e.message);
            }
          }
        }
      ]
    );
  };

  const [isOn, setIsOn]           = useState(device.isOn ?? true);
  
  useEffect(() => {
    setIsOn(device.isOn);
  }, [device.isOn]);

  const handleToggle = (val) => { setIsOn(val); toggleDevice(device.id); };
  const [activeTab, setActiveTab] = useState('controls');

  // Determine device type for specific controls
  const dtype = (device.type ?? '').toLowerCase();
  const isThermo  = dtype.includes('clima') || dtype.includes('termo') || dtype === 'termostato';
  const isLight   = dtype.includes('luce') || dtype.includes('illumina') || dtype === 'luce';
  const isCamera  = dtype.includes('camera') || dtype.includes('sorveg');
  const isLock    = dtype.includes('serratura') || dtype.includes('porta') || dtype.includes('lock');
  const isBlinds  = dtype.includes('tappar') || dtype.includes('blind');

  // Determina il livello per la manopola a seconda del tipo
  const level = device.type === 'Illuminazione' ? (device.dettagli?.intensita || 100) :
                (device.type === 'Tapparelle' ? (device.dettagli?.percentuale_apertura || 0) :
                (isThermo ? (device.dettagli?.temperatura_impostata || 22) : 100));

  const adjustLevel = (delta) => {
    if (isThermo) {
      const next = Math.min(30, Math.max(10, level + (delta > 0 ? 0.5 : -0.5)));
      updateDevice(device.id, { dettagli: { temperaturaImpostata: next } });
    } else {
      const next = Math.min(100, Math.max(0, level + delta));
      if (device.type === 'Illuminazione') {
        updateDevice(device.id, { dettagli: { intensita: next } });
      } else if (device.type === 'Tapparelle') {
        updateDevice(device.id, { dettagli: { percentualeApertura: next } });
      }
    }
  };

  const arcColor = isOn
    ? (isThermo
        ? (device.dettagli?.modalita === 'raffreddamento' ? '#00BCD4' : (device.dettagli?.modalita === 'riscaldamento' ? '#FF9800' : Colors.accent))
        : (level > 66 ? Colors.accent : level > 33 ? Colors.warning : Colors.danger))
    : Colors.textMuted;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <AppHeader navigation={navigation} showBack activeTab="Home" />

      <ScrollView showsVerticalScrollIndicator={false} stickyHeaderIndices={[isThermo ? 3 : 1]}>

        {/* Block 1: Device name + master toggle */}
        <View style={styles.nameBlock}>
          <View style={styles.nameLeft}>
            <View style={[styles.iconCircle, isOn && { borderColor: arcColor, backgroundColor: arcColor + '20' }]}>
              <MaterialCommunityIcons
                name={device.icon || 'devices'}
                size={30}
                color={isOn ? arcColor : Colors.textMuted}
              />
            </View>
            <View>
              <Text style={styles.deviceTypeBadge}>{(device.type ?? 'Dispositivo').toUpperCase()}</Text>
              <Text style={styles.deviceName}>{device.name}</Text>
              <Text style={styles.deviceRoom}>📍 {device.room || 'Nessuna Stanza'}</Text>
            </View>
          </View>
          <View style={{ alignItems: 'flex-end', gap: 6 }}>
            <SmartToggle value={isOn} onValueChange={handleToggle} />
            {!isThermo && (
              <View style={styles.headerConsumptionBadge}>
                <View style={{flexDirection:'row',alignItems:'center',gap:4}}><MaterialCommunityIcons name="lightning-bolt" size={13} color={Colors.accent} /><Text style={styles.headerConsumptionText}>{device.consumption ?? 0} Wh</Text></View>
              </View>
            )}
          </View>
        </View>

        {/* Block 2: Dial */}
        {isThermo && (
          <View style={[styles.dialBlock, !isOn && { opacity: 0.5 }]}>
            <TouchableOpacity
              style={[styles.ctrlBtn, !isOn && styles.ctrlBtnDisabled]}
              onPress={() => adjustLevel(-10)}
              disabled={!isOn}
            >
              <Text style={styles.ctrlBtnText}>−</Text>
            </TouchableOpacity>
            <View style={styles.dialOuter}>
              <View style={[styles.dialRing, { borderColor: arcColor }]}>
                <View style={styles.dialInner}>
                  <Text style={[styles.dialValue, !isOn && styles.dialValueOff]}>
                    {isOn ? level : level}
                  </Text>
                  <Text style={styles.dialUnit}>°C</Text>
                  <Text style={styles.dialStatus}>{isOn ? 'Attivo' : 'Spento'}</Text>
                </View>
              </View>
              {isOn && <View style={[styles.dialGlow, { borderColor: arcColor }]} />}
            </View>
            <TouchableOpacity
              style={[styles.ctrlBtn, !isOn && styles.ctrlBtnDisabled]}
              onPress={() => adjustLevel(10)}
              disabled={!isOn}
            >
              <Text style={styles.ctrlBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Block 3: Consumption pill */}
        {isThermo && (
          <TouchableOpacity style={styles.consumptionPill} onPress={() => setActiveTab('graph')}>
            <MaterialCommunityIcons name="lightning-bolt" size={22} color={Colors.accent} />
            <Text style={styles.consumptionText}>{device.consumption ?? 0} Wh</Text>
            <Text style={styles.consumptionSub}>cons. attuale</Text>
            <Text style={styles.consumptionArrow}>›</Text>
          </TouchableOpacity>
        )}

        {/* Block 4 (sticky): tab bar */}
        <View style={styles.tabBar}>
          {BOTTOM_TABS.map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tabBtn, activeTab === tab.key && styles.tabBtnActive]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={styles.tabIcon}>{tab.icon}</Text>
              <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        {activeTab === 'controls' && (
          <View style={tabStyles.container}>
            {isThermo  && <ThermostatControls device={device} onUpdate={(det) => updateDevice(device.id, { dettagli: det })} />}
            {isLight   && <LightControls device={device} onUpdate={(det) => updateDevice(device.id, { dettagli: det })} />}
            {isCamera  && <CameraControls device={device} onUpdate={(det) => updateDevice(device.id, { dettagli: det })} />}
            {isLock    && <LockControls device={device} onUpdate={(det) => updateDevice(device.id, { dettagli: det })} />}
            {isBlinds  && <BlindsControls device={device} onUpdate={(det) => updateDevice(device.id, { dettagli: det })} />}
            {!isThermo && !isLight && !isCamera && !isLock && !isBlinds && <GenericControls />}
          </View>
        )}
        {activeTab === 'timer'    && <TimerTab device={device} onUpdate={(payload) => updateDevice(device.id, payload)} />}
        {activeTab === 'schedule' && <ScheduleTab device={device} onUpdate={(payload) => updateDevice(device.id, payload)} />}
        {activeTab === 'graph'    && <GraphTab consumption={device.consumption ?? 0} />}
        {activeTab === 'more'     && <MoreTab deviceName={device.name} onDelete={handleDelete} />}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  nameBlock: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  nameLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, flex: 1 },
  iconCircle: {
    width: 56, height: 56, borderRadius: 16,
    backgroundColor: Colors.card, borderWidth: 2, borderColor: Colors.border,
    justifyContent: 'center', alignItems: 'center',
  },
  deviceEmoji: { fontSize: 30 },
  deviceTypeBadge: { fontSize: 9, fontWeight: '800', color: Colors.accent, letterSpacing: 1.5, marginBottom: 2 },
  deviceName: { ...Typography.heading3, maxWidth: 200 },
  deviceRoom: { ...Typography.caption, marginTop: 2 },

  dialBlock: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.xl, paddingVertical: Spacing.xl, backgroundColor: Colors.background,
  },
  ctrlBtn: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: Colors.card, borderWidth: 1.5, borderColor: Colors.borderLight,
    justifyContent: 'center', alignItems: 'center', ...Shadow.card,
  },
  ctrlBtnDisabled: { opacity: 0.35 },
  ctrlBtnText: { fontSize: 28, color: Colors.textPrimary, fontWeight: '200', lineHeight: 36 },

  dialOuter: { position: 'relative', alignItems: 'center', justifyContent: 'center' },
  dialGlow: { position: 'absolute', width: 158, height: 158, borderRadius: 79, borderWidth: 1, opacity: 0.25 },
  dialRing: {
    width: 148, height: 148, borderRadius: 74, borderWidth: 5,
    backgroundColor: Colors.surface, justifyContent: 'center', alignItems: 'center', ...Shadow.accent,
  },
  dialInner: {
    width: 120, height: 120, borderRadius: 60, backgroundColor: Colors.card,
    justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Colors.border,
  },
  dialValue: { fontSize: 36, fontWeight: '800', color: Colors.textPrimary, lineHeight: 42 },
  dialValueOff: { color: Colors.textMuted },
  dialUnit: { fontSize: 12, color: Colors.textSecondary, marginTop: -4 },
  dialStatus: { fontSize: 10, fontWeight: '700', color: Colors.textMuted, letterSpacing: 1, marginTop: 4 },

  consumptionPill: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'center',
    backgroundColor: Colors.card, borderRadius: Radius.full,
    paddingVertical: 10, paddingHorizontal: 22, borderWidth: 1, borderColor: Colors.border,
    marginBottom: Spacing.sm, gap: Spacing.sm, ...Shadow.card,
  },
  consumptionIcon: { fontSize: 18 },
  consumptionText: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  consumptionSub: { fontSize: 12, color: Colors.textMuted },
  consumptionArrow: { fontSize: 18, color: Colors.accent, fontWeight: '300' },

  tabBar: {
    flexDirection: 'row', backgroundColor: Colors.navBar,
    borderTopWidth: 1, borderTopColor: Colors.border,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  tabBtn: { flex: 1, alignItems: 'center', paddingVertical: 10, gap: 2 },
  tabBtnActive: { borderBottomWidth: 2, borderBottomColor: Colors.accent },
  tabIcon: { fontSize: 16 },
  tabLabel: { fontSize: 9, fontWeight: '600', color: Colors.textMuted, letterSpacing: 0.3 },
  tabLabelActive: { color: Colors.accent },

  // Adjuster styles
  adjusterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm,
    marginVertical: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
  },
  adjustBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: Radius.sm,
    backgroundColor: Colors.accentSoft,
    borderWidth: 1,
    borderColor: Colors.accent,
  },
  adjustBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.accent,
  },
  adjustValue: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  headerConsumptionBadge: {
    backgroundColor: Colors.cardAlt,
    borderRadius: Radius.sm,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: 4,
  },
  headerConsumptionText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.success,
  },
});
