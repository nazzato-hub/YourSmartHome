import React, { useState, useEffect } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, StatusBar, Modal, TextInput,
  KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../theme';
import AppHeader from '../../components/AppHeader';
import { useDeviceStore } from '../../store/DeviceStore';
const { api } = require('../../services/api');

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
  if (!icona.match(/\p{Emoji}/u)) return icona;
  return SCENARIO_ICON_MAP[icona] || 'lightning-bolt';
}

export default function ScenarioScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('scenari'); // 'scenari' | 'automazioni'
  const [scenarios, setScenarios] = useState([]);
  const [rules, setRules] = useState([]);
  const { devices, loadData: loadDeviceStoreData } = useDeviceStore();

  // Edit / Create Scenario States
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingScenario, setEditingScenario] = useState(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editIcon, setEditIcon] = useState('lightning-bolt');
  const [editColor, setEditColor] = useState('#7C5CFF');
  const [editActions, setEditActions] = useState([]);

  // Scenario Add Action States
  const [selectedDevId, setSelectedDevId] = useState('');
  const [selectedAction, setSelectedAction] = useState('accendi');
  const [regolaValore, setRegolaValore] = useState('100');

  // Rule States
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [ruleName, setRuleName] = useState('');
  const [ruleSensorId, setRuleSensorId] = useState('');
  const [ruleCondition, setRuleCondition] = useState('motion'); // '<' | '>' | 'motion'
  const [ruleValoreSoglia, setRuleValoreSoglia] = useState('true');
  const [ruleActuatorId, setRuleActuatorId] = useState('');
  const [ruleAzione, setRuleAzione] = useState('accendi');
  const [ruleValoreAzione, setRuleValoreAzione] = useState('');

  const loadScenarios = async () => {
    try {
      const dbScenarios = await api.getScenarios();
      const mapped = dbScenarios.map(s => ({
        id: String(s.id_scenario),
        name: s.nome_scenario,
        icon: getScenarioIcon(s.icona_app),
        description: s.descrizione || 'Scenario personalizzato',
        isActive: s.is_active || false,
        color: s.colore || Colors.accent,
        actions: (s.azioni || []).map(a => {
          const deviceName = a.nome_dispositivo || `disp. #${a.id_dispositivo}`;
          if (a.azione === 'accendi') return `Accendi ${deviceName}`;
          if (a.azione === 'spegni') return `Spegni ${deviceName}`;
          if (a.azione === 'regola') {
            if (a.valore === 'aperta' || a.valore === 'chiusa') {
              return `Regola ${deviceName} (${a.valore})`;
            }
            if (a.valore && !isNaN(a.valore)) {
              const dev = devices.find(d => String(d.id) === String(a.id_dispositivo));
              if (dev) {
                if (dev.type === 'Illuminazione') return `Regola ${deviceName} (${a.valore}%)`;
                if (dev.type === 'Tapparelle') return `Regola ${deviceName} (${a.valore}%)`;
                if (dev.type === 'Termostato') return `Regola ${deviceName} (${a.valore}°C)`;
              }
              const valNum = parseFloat(a.valore);
              if (valNum >= 15 && valNum <= 30) return `Regola ${deviceName} (${a.valore}°C)`;
              return `Regola ${deviceName} (${a.valore}%)`;
            }
            return `Regola ${deviceName} (${a.valore || ''})`;
          }
          return `${a.azione || ''}`;
        }),
        rawActions: s.azioni || [],
      }));
      setScenarios(mapped);
    } catch (e) {
      console.warn("loadScenarios error:", e.message);
    }
  };

  const loadRules = async () => {
    try {
      const dbRules = await api.getRegole();
      setRules(dbRules);
    } catch (e) {
      console.warn("loadRules error:", e.message);
    }
  };

  useEffect(() => {
    loadScenarios();
    loadDeviceStoreData();
    loadRules();
  }, []);

  // Sync actions and rules once devices load
  useEffect(() => {
    if (devices.length > 0) {
      loadScenarios();
      loadRules();
    }
  }, [devices]);

  const activateScenario = async (id) => {
    try {
      await api.activateScene(id);
      await loadScenarios();
    } catch (e) {
      Alert.alert("Errore", "Errore attivazione scenario: " + e.message);
    }
  };

  const deactivateScenario = async (id) => {
    try {
      await api.deactivateScene(id);
      await loadScenarios();
    } catch (e) {
      Alert.alert("Errore", "Errore disattivazione scenario: " + e.message);
    }
  };

  const openEditModal = (scenario) => {
    setEditingScenario(scenario);
    setEditName(scenario.name);
    setEditDesc(scenario.description);
    setEditIcon(scenario.icon);
    setEditColor(scenario.color);
    setEditActions((scenario.rawActions || []).map(a => ({
      idDispositivo: a.id_dispositivo,
      nome_dispositivo: a.nome_dispositivo,
      azione: a.azione,
      valore: a.valore
    })));

    if (devices.length > 0) {
      const d = devices[0];
      setSelectedDevId(d.id);
      if (d.type === 'Illuminazione') {
        setSelectedAction('regola');
        setRegolaValore('100');
      } else if (d.type === 'Tapparelle') {
        setSelectedAction('regola');
        setRegolaValore('50');
      } else if (d.type === 'Termostato') {
        setSelectedAction('regola');
        setRegolaValore('20');
      } else {
        setSelectedAction('accendi');
        setRegolaValore('100');
      }
    }
    setShowEditModal(true);
  };

  const openCreateModal = () => {
    setEditingScenario(null);
    setEditName('');
    setEditDesc('');
    setEditIcon('lightning-bolt');
    setEditColor('#7C5CFF');
    setEditActions([]);

    if (devices.length > 0) {
      const d = devices[0];
      setSelectedDevId(d.id);
      if (d.type === 'Illuminazione') {
        setSelectedAction('regola');
        setRegolaValore('100');
      } else if (d.type === 'Tapparelle') {
        setSelectedAction('regola');
        setRegolaValore('50');
      } else if (d.type === 'Termostato') {
        setSelectedAction('regola');
        setRegolaValore('20');
      } else {
        setSelectedAction('accendi');
        setRegolaValore('100');
      }
    }
    setShowEditModal(true);
  };

  const addActionToScenario = () => {
    if (!selectedDevId) {
      Alert.alert("Errore", "Seleziona un dispositivo.");
      return;
    }
    const d = devices.find(x => String(x.id) === String(selectedDevId));
    if (!d) return;

    if (editActions.some(act => String(act.idDispositivo) === String(selectedDevId))) {
      Alert.alert("Attenzione", "Questo dispositivo ha già un'azione impostata in questo scenario.");
      return;
    }

    const newActionObj = {
      idDispositivo: parseInt(selectedDevId),
      nome_dispositivo: d.name,
      azione: selectedAction,
      valore: selectedAction === 'regola' ? regolaValore : null
    };

    setEditActions([...editActions, newActionObj]);
  };

  const saveScenarioChanges = async () => {
    if (!editName.trim()) {
      Alert.alert("Errore", "Il nome dello scenario è obbligatorio.");
      return;
    }

    try {
      const payload = {
        nomeScenario: editName.trim(),
        descrizione: editDesc.trim() || 'Scenario personalizzato',
        iconaApp: editIcon,
        colore: editColor,
        azioni: editActions.map(act => ({
          idDispositivo: act.idDispositivo,
          azione: act.azione,
          valore: act.valore
        }))
      };

      if (editingScenario) {
        await api.updateScenario(editingScenario.id, payload);
      } else {
        await api.addScenario(payload);
      }

      setShowEditModal(false);
      setEditingScenario(null);
      await loadScenarios();
    } catch (e) {
      Alert.alert("Errore", "Errore salvataggio scenario: " + e.message);
    }
  };

  const deleteScenario = async () => {
    if (!editingScenario) return;
    Alert.alert(
      "Conferma eliminazione",
      `Sei sicuro di voler eliminare lo scenario "${editingScenario.name}"?`,
      [
        { text: "Annulla", style: "cancel" },
        {
          text: "Elimina",
          style: "destructive",
          onPress: async () => {
            try {
              await api.deleteScenario(editingScenario.id);
              setShowEditModal(false);
              setEditingScenario(null);
              await loadScenarios();
            } catch (e) {
              Alert.alert("Errore", "Errore eliminazione scenario: " + e.message);
            }
          }
        }
      ]
    );
  };

  const selectedDeviceObj = devices.find(d => String(d.id) === String(selectedDevId));
  const supportsRegola = selectedDeviceObj && [
    'Illuminazione', 'Tapparelle', 'Termostato'
  ].includes(selectedDeviceObj.type);

  const adjustPercent = (amount) => {
    let current = parseInt(regolaValore) || 0;
    let next = Math.min(100, Math.max(0, current + amount));
    setRegolaValore(String(next));
  };

  const adjustTemp = (amount) => {
    let current = parseFloat(regolaValore) || 20;
    let next = Math.min(30, Math.max(15, current + amount));
    next = Math.round(next * 10) / 10;
    setRegolaValore(String(next));
  };

  // Rule management helpers
  const openRuleModal = () => {
    setRuleName('');
    const sensorDevs = devices.filter(d => ['Termostato', 'Sensore_Presenza'].includes(d.type));
    if (sensorDevs.length > 0) {
      const d = sensorDevs[0];
      setRuleSensorId(d.id);
      if (d.type === 'Termostato') {
        setRuleCondition('<');
        setRuleValoreSoglia('19');
      } else {
        setRuleCondition('motion');
        setRuleValoreSoglia('true');
      }
    } else {
      setRuleSensorId('');
    }

    if (devices.length > 0) {
      const act = devices[0];
      setRuleActuatorId(act.id);
      if (act.type === 'Illuminazione') {
        setRuleAzione('regola');
        setRuleValoreAzione('100');
      } else if (act.type === 'Tapparelle') {
        setRuleAzione('regola');
        setRuleValoreAzione('50');
      } else if (act.type === 'Termostato') {
        setRuleAzione('regola');
        setRuleValoreAzione('20');
      } else {
        setRuleAzione('accendi');
        setRuleValoreAzione('');
      }
    } else {
      setRuleActuatorId('');
    }
    setShowRuleModal(true);
  };

  const saveRule = async () => {
    if (!ruleName.trim()) {
      Alert.alert("Errore", "Il nome della regola è obbligatorio.");
      return;
    }
    if (!ruleSensorId) {
      Alert.alert("Errore", "Nessun dispositivo sensore disponibile.");
      return;
    }
    if (!ruleActuatorId) {
      Alert.alert("Errore", "Nessun dispositivo attuatore disponibile.");
      return;
    }

    try {
      const payload = {
        nomeRegola: ruleName.trim(),
        idDispositivoSensore: parseInt(ruleSensorId),
        condizione: ruleCondition,
        valoreSoglia: ruleValoreSoglia,
        idDispositivoAttuatore: parseInt(ruleActuatorId),
        azione: ruleAzione,
        valoreAzione: ruleAzione === 'regola' ? ruleValoreAzione : null
      };

      await api.addRegola(payload);
      setShowRuleModal(false);
      await loadRules();
    } catch (e) {
      Alert.alert("Errore", "Errore salvataggio regola: " + e.message);
    }
  };

  const toggleRuleActive = async (idRegola, currentStatus) => {
    try {
      await api.updateRegola(idRegola, { attiva: !currentStatus });
      await loadRules();
    } catch (e) {
      Alert.alert("Errore", "Errore modifica stato regola: " + e.message);
    }
  };

  const deleteRule = async (idRegola, name) => {
    Alert.alert(
      "Conferma eliminazione",
      `Sei sicuro di voler eliminare la regola "${name}"?`,
      [
        { text: "Annulla", style: "cancel" },
        {
          text: "Elimina",
          style: "destructive",
          onPress: async () => {
            try {
              await api.deleteRegola(idRegola);
              await loadRules();
            } catch (e) {
              Alert.alert("Errore", "Errore eliminazione regola: " + e.message);
            }
          }
        }
      ]
    );
  };

  const adjustThresholdTemp = (amount) => {
    let current = parseFloat(ruleValoreSoglia) || 19;
    let next = Math.min(30, Math.max(15, current + amount));
    next = Math.round(next * 10) / 10;
    setRuleValoreSoglia(String(next));
  };

  const adjustRuleActionPercent = (amount) => {
    let current = parseInt(ruleValoreAzione) || 0;
    let next = Math.min(100, Math.max(0, current + amount));
    setRuleValoreAzione(String(next));
  };

  const adjustRuleActionTemp = (amount) => {
    let current = parseFloat(ruleValoreAzione) || 20;
    let next = Math.min(30, Math.max(15, current + amount));
    next = Math.round(next * 10) / 10;
    setRuleValoreAzione(String(next));
  };

  const selectedSensorObj = devices.find(d => String(d.id) === String(ruleSensorId));
  const selectedActuatorObj = devices.find(d => String(d.id) === String(ruleActuatorId));
  const actuatorSupportsRegola = selectedActuatorObj && [
    'Illuminazione', 'Tapparelle', 'Termostato'
  ].includes(selectedActuatorObj.type);

  const activeScenario = scenarios.find(s => s.isActive);
  const sensorDevices = devices.filter(d => ['Termostato', 'Sensore_Presenza'].includes(d.type));

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <AppHeader navigation={navigation} title="Scenari e Regole" showBack />

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'scenari' && styles.tabButtonActive]}
          onPress={() => setActiveTab('scenari')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabButtonText, activeTab === 'scenari' && styles.tabButtonTextActive]}>Scenari</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'automazioni' && styles.tabButtonActive]}
          onPress={() => setActiveTab('automazioni')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabButtonText, activeTab === 'automazioni' && styles.tabButtonTextActive]}>Regole Auto</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'scenari' ? (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          {/* Active Scenario Banner */}
          {activeScenario && (
            <View style={[styles.activeBanner, { borderColor: activeScenario.color }]}>
              <MaterialCommunityIcons name={activeScenario.icon || 'lightning-bolt'} size={28} color={activeScenario.color} />
              <View style={styles.activeBannerText}>
                <Text style={styles.activeBannerLabel}>SCENARIO ATTIVO</Text>
                <Text style={styles.activeBannerName}>{activeScenario.name}</Text>
              </View>
              <TouchableOpacity
                style={styles.deactivateBtn}
                onPress={() => deactivateScenario(activeScenario.id)}
              >
                <Text style={styles.deactivateBtnText}>Disattiva</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Scenario Grid */}
          <Text style={styles.sectionTitle}>Tutti gli scenari</Text>

          <View style={styles.scenariosGrid}>
            {scenarios.map(scenario => (
              <TouchableOpacity
                key={scenario.id}
                style={[
                  styles.scenarioCard,
                  scenario.isActive && { borderColor: scenario.color, backgroundColor: scenario.color + '15' },
                ]}
                onPress={() => activateScenario(scenario.id)}
                activeOpacity={0.8}
              >
                {/* Active Indicator */}
                {scenario.isActive && (
                  <View style={[styles.activeIndicator, { backgroundColor: scenario.color }]}>
                    <Text style={styles.activeIndicatorText}>ON</Text>
                  </View>
                )}

                <MaterialCommunityIcons
                  name={scenario.icon || 'lightning-bolt'}
                  size={32}
                  color={scenario.isActive ? scenario.color : Colors.textSecondary}
                  style={{ marginBottom: Spacing.sm }}
                />
                <Text style={[styles.scenarioCardName, scenario.isActive && { color: scenario.color }]}>
                  {scenario.name}
                </Text>
                <Text style={styles.scenarioCardDesc}>{scenario.description}</Text>

                {/* Actions Preview */}
                {scenario.actions.length > 0 && (
                  <View style={styles.actionsPreview}>
                    {scenario.actions.slice(0, 2).map((action, i) => (
                      <Text key={i} style={styles.actionChip}>{action}</Text>
                    ))}
                    {scenario.actions.length > 2 && (
                      <Text style={styles.actionMore}>+{scenario.actions.length - 2}</Text>
                    )}
                  </View>
                )}

                {/* Edit Card Button */}
                <TouchableOpacity
                  style={styles.editCardBtn}
                  onPress={(e) => {
                    e.stopPropagation();
                    openEditModal(scenario);
                  }}
                  activeOpacity={0.6}
                >
                  <MaterialCommunityIcons name="cog" size={18} color={Colors.textSecondary} />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}

            {/* Add Scenario Card */}
            <TouchableOpacity
              style={styles.addScenarioCard}
              onPress={openCreateModal}
            >
              <Text style={styles.addScenarioIcon}>+</Text>
              <Text style={styles.addScenarioLabel}>Aggiungi scenario</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          {/* Rules List */}
          <Text style={styles.sectionTitle}>Regole automatiche</Text>

          <View style={styles.rulesListContainer}>
            {rules.map(rule => {
              const sensoreIconName = rule.tipo_sensore === 'Termostato' ? 'thermometer' : 'motion-sensor';
              let triggerText = '';
              if (rule.condizione === '<' || rule.condizione === '>') {
                triggerText = `Temperatura di ${rule.nome_sensore} ${rule.condizione} ${rule.valore_soglia}°C`;
              } else if (rule.condizione === 'motion') {
                triggerText = `${rule.nome_sensore} rileva movimento`;
              } else {
                triggerText = `Stato di ${rule.nome_sensore} è ${rule.valore_soglia}`;
              }

              const attuatoreIconName = rule.tipo_attuatore === 'Illuminazione' ? 'lightbulb-on' :
                                    rule.tipo_attuatore === 'Termostato' ? 'thermometer' :
                                    rule.tipo_attuatore === 'Tapparelle' ? 'window-shutter' :
                                    rule.tipo_attuatore === 'Porta_Principale' ? 'door-closed-lock' : 'devices';
              let actionText = '';
              if (rule.azione === 'accendi') actionText = `Accendi ${rule.nome_attuatore}`;
              else if (rule.azione === 'spegni') actionText = `Spegni ${rule.nome_attuatore}`;
              else if (rule.azione === 'regola') {
                const suffix = rule.tipo_attuatore === 'Termostato' ? '°C' :
                               rule.tipo_attuatore === 'Porta_Principale' ? '' : '%';
                actionText = `Imposta ${rule.nome_attuatore} a ${rule.valore_azione}${suffix}`;
              }

              return (
                <View key={rule.id_regola} style={[styles.ruleCard, !rule.attiva && styles.ruleCardInactive]}>
                  <View style={styles.ruleCardHeader}>
                    <Text style={[styles.ruleCardTitle, !rule.attiva && styles.textInactive]}>
                      {rule.nome_regola}
                    </Text>

                    <TouchableOpacity
                      style={[styles.switchContainer, rule.attiva ? styles.switchActive : styles.switchInactive]}
                      onPress={() => toggleRuleActive(rule.id_regola, rule.attiva)}
                      activeOpacity={0.8}
                    >
                      <View style={[styles.switchCircle, rule.attiva ? styles.switchCircleActive : styles.switchCircleInactive]} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.ruleDetails}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={styles.ruleStepLabel}>TRIGGER: </Text>
                      <MaterialCommunityIcons name={sensoreIconName} size={14} color={Colors.textMuted} />
                      <Text style={styles.ruleDetailText}>{triggerText}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={styles.ruleStepLabel}>AZIONE: </Text>
                      <MaterialCommunityIcons name={attuatoreIconName} size={14} color={Colors.textMuted} />
                      <Text style={styles.ruleDetailText}>{actionText}</Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.ruleDeleteBtn}
                    onPress={() => deleteRule(rule.id_regola, rule.nome_regola)}
                  >
                    <View style={{flexDirection:'row',alignItems:'center',gap:6}}><MaterialCommunityIcons name="trash-can-outline" size={16} color={Colors.danger} /><Text style={styles.ruleDeleteBtnText}>Elimina Regola</Text></View>
                  </TouchableOpacity>
                </View>
              );
            })}

            {/* Add Rule Card */}
            <TouchableOpacity
              style={styles.addScenarioCard}
              onPress={openRuleModal}
            >
              <Text style={styles.addScenarioIcon}>+</Text>
              <Text style={styles.addScenarioLabel}>Aggiungi regola automatica</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* Unified Edit/Create Scenario Modal */}
      <Modal transparent visible={showEditModal} animationType="slide" onRequestClose={() => setShowEditModal(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlayScroll}
        >
          <ScrollView contentContainerStyle={styles.modalContainerScroll} keyboardShouldPersistTaps="handled">
            <View style={styles.modalCardLarge}>
              <Text style={styles.modalTitle}>
                {editingScenario ? 'Modifica Scenario' : 'Nuovo Scenario'}
              </Text>

              {/* Name input */}
              <Text style={styles.fieldLabel}>Nome Scenario</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="es. Scenario Cinema"
                placeholderTextColor={Colors.textMuted}
                value={editName}
                onChangeText={setEditName}
              />

              {/* Description input */}
              <Text style={styles.fieldLabel}>Descrizione</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="es. Abbassa le tapparelle ed accendi la TV"
                placeholderTextColor={Colors.textMuted}
                value={editDesc}
                onChangeText={setEditDesc}
              />

              {/* Icon choices */}
              <Text style={styles.fieldLabel}>Icona Scenario</Text>
              <View style={styles.iconRow}>
                {[
                  { name: 'lightning-bolt', label: 'Energia' },
                  { name: 'movie-open', label: 'Cinema' },
                  { name: 'home', label: 'Casa' },
                  { name: 'weather-night', label: 'Notte' },
                  { name: 'door-open', label: 'Porta' },
                  { name: 'leaf', label: 'Natura' },
                  { name: 'music-note', label: 'Musica' },
                  { name: 'silverware-fork-knife', label: 'Cena' },
                  { name: 'lightbulb-on', label: 'Luce' },
                ].map(ic => (
                  <TouchableOpacity
                    key={ic.name}
                    style={[styles.iconChoice, editIcon === ic.name && { borderColor: editColor, backgroundColor: editColor + '15' }]}
                    onPress={() => setEditIcon(ic.name)}
                  >
                    <MaterialCommunityIcons name={ic.name} size={20} color={editIcon === ic.name ? editColor : Colors.textSecondary} />
                  </TouchableOpacity>
                ))}
              </View>

              {/* Color choices */}
              <Text style={styles.fieldLabel}>Colore Scenario</Text>
              <View style={styles.colorRow}>
                {['#E91E63', '#4CAF50', '#3F51B5', '#FF9800', '#009688', '#7C5CFF', '#00BCD4', '#FFC107'].map(col => (
                  <TouchableOpacity
                    key={col}
                    style={[styles.colorChoice, { backgroundColor: col }, editColor === col && styles.colorChoiceActive]}
                    onPress={() => setEditColor(col)}
                  />
                ))}
              </View>

              {/* Existing Actions List */}
              <Text style={styles.fieldLabel}>Azioni associate ({editActions.length})</Text>
              {editActions.length === 0 ? (
                <Text style={styles.noActionsText}>Nessuna azione impostata per questo scenario. Aggiungine una sotto.</Text>
              ) : (
                <View style={styles.actionsList}>
                  {editActions.map((act, index) => {
                    let actText = '';
                    if (act.azione === 'accendi') actText = 'Accendi';
                    else if (act.azione === 'spegni') actText = 'Spegni';
                    else if (act.azione === 'regola') {
                      if (act.valore === 'aperta' || act.valore === 'chiusa') {
                        actText = `Regola (${act.valore})`;
                      } else {
                        const d = devices.find(x => String(x.id) === String(act.idDispositivo));
                        const suffix = d?.type === 'Termostato' ? '°C' : '%';
                        actText = `Regola (${act.valore}${suffix})`;
                      }
                    }
                    return (
                      <View key={index} style={styles.actionItem}>
                        <Text style={styles.actionItemName}>
                          {act.nome_dispositivo || devices.find(d => String(d.id) === String(act.idDispositivo))?.name || `Dispositivo #${act.idDispositivo}`}
                        </Text>
                        <Text style={styles.actionItemType}>{actText}</Text>
                        <TouchableOpacity
                          style={styles.actionItemDelete}
                          onPress={() => {
                            setEditActions(editActions.filter((_, idx) => idx !== index));
                          }}
                        >
                          <MaterialCommunityIcons name="trash-can-outline" size={16} color={Colors.danger} />
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>
              )}

              {/* Add Action Section */}
              <View style={styles.addActionsSection}>
                <Text style={styles.addSubTitle}>AGGIUNGI AZIONE DISPOSITIVO</Text>

                {devices.length === 0 ? (
                  <Text style={styles.noActionsText}>Nessun dispositivo disponibile nella tua casa.</Text>
                ) : (
                  <>
                    {/* Horizontal Device selection */}
                    <Text style={styles.fieldLabel}>Seleziona Dispositivo</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.devicesScroll}>
                      {devices.map(d => (
                        <TouchableOpacity
                          key={d.id}
                          style={[styles.deviceChip, selectedDevId === d.id && styles.deviceChipSelected]}
                          onPress={() => {
                            setSelectedDevId(d.id);
                            if (d.type === 'Illuminazione') {
                              setSelectedAction('regola');
                              setRegolaValore('100');
                            } else if (d.type === 'Tapparelle') {
                              setSelectedAction('regola');
                              setRegolaValore('50');
                            } else if (d.type === 'Termostato') {
                              setSelectedAction('regola');
                              setRegolaValore('20');
                            } else {
                              setSelectedAction('accendi');
                              setRegolaValore('100');
                            }
                          }}
                        >
                          <MaterialCommunityIcons
                            name={d.icon || 'devices'}
                            size={13}
                            color={selectedDevId === d.id ? Colors.accent : Colors.textSecondary}
                          />
                          <Text style={[styles.deviceChipText, selectedDevId === d.id && styles.deviceChipTextSelected]}>
                            {d.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>

                    {/* Action Selector */}
                    <Text style={styles.fieldLabel}>Seleziona Azione</Text>
                    <View style={styles.actionTypeRow}>
                      <TouchableOpacity
                        style={[styles.actionTypeBtn, selectedAction === 'accendi' && styles.actionTypeBtnSelected]}
                        onPress={() => setSelectedAction('accendi')}
                      >
                        <Text style={[styles.actionTypeBtnText, selectedAction === 'accendi' && styles.actionTypeBtnTextSelected]}>Accendi</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionTypeBtn, selectedAction === 'spegni' && styles.actionTypeBtnSelected]}
                        onPress={() => setSelectedAction('spegni')}
                      >
                        <Text style={[styles.actionTypeBtnText, selectedAction === 'spegni' && styles.actionTypeBtnTextSelected]}>Spegni</Text>
                      </TouchableOpacity>
                      {supportsRegola && (
                        <TouchableOpacity
                          style={[styles.actionTypeBtn, selectedAction === 'regola' && styles.actionTypeBtnSelected]}
                          onPress={() => setSelectedAction('regola')}
                        >
                          <Text style={[styles.actionTypeBtnText, selectedAction === 'regola' && styles.actionTypeBtnTextSelected]}>Regola</Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    {/* Specialized rule value adjuster */}
                    {selectedAction === 'regola' && selectedDeviceObj && (
                      <View>
                        <Text style={styles.fieldLabel}>Valore di Regolazione</Text>

                        {selectedDeviceObj.type === 'Illuminazione' && (
                          <View style={styles.presetButtonsRow}>
                            {[25, 50, 75, 100].map(val => (
                              <TouchableOpacity
                                key={val}
                                style={[styles.presetBtn, String(regolaValore) === String(val) && styles.presetBtnActive]}
                                onPress={() => setRegolaValore(String(val))}
                              >
                                <Text style={[styles.presetBtnText, String(regolaValore) === String(val) && styles.presetBtnTextActive]}>
                                  {val}%
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        )}

                        {selectedDeviceObj.type === 'Tapparelle' && (
                          <View style={styles.presetButtonsRow}>
                            {[0, 25, 50, 75, 100].map(val => {
                              let label = `${val}%`;
                              if (val === 0) label = 'Chiuse';
                              if (val === 100) label = 'Aperte';
                              return (
                                <TouchableOpacity
                                  key={val}
                                  style={[styles.presetBtn, String(regolaValore) === String(val) && styles.presetBtnActive]}
                                  onPress={() => setRegolaValore(String(val))}
                                >
                                  <Text style={[styles.presetBtnText, String(regolaValore) === String(val) && styles.presetBtnTextActive]}>
                                    {label}
                                  </Text>
                                </TouchableOpacity>
                              );
                            })}
                          </View>
                        )}

                        {selectedDeviceObj.type === 'Termostato' && (
                          <View style={styles.valueAdjusterRow}>
                            <TouchableOpacity style={styles.adjustBtn} onPress={() => adjustTemp(-0.5)}>
                              <Text style={styles.adjustBtnText}>-0.5°C</Text>
                            </TouchableOpacity>
                            <View style={styles.valueDisplayContainer}>
                              <Text style={styles.valueDisplayVal}>{regolaValore}°C</Text>
                            </View>
                            <TouchableOpacity style={styles.adjustBtn} onPress={() => adjustTemp(0.5)}>
                              <Text style={styles.adjustBtnText}>+0.5°C</Text>
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    )}

                    <TouchableOpacity style={styles.addActionBtn} onPress={addActionToScenario}>
                      <Text style={styles.addActionBtnText}>+ Aggiungi Azione allo Scenario</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>

              {/* Bottom buttons */}
              <View style={styles.modalButtonsRow}>
                <TouchableOpacity style={styles.modalBtnCancel} onPress={() => { setShowEditModal(false); setEditingScenario(null); }}>
                  <Text style={styles.modalBtnCancelText}>Annulla</Text>
                </TouchableOpacity>

                {editingScenario && (
                  <TouchableOpacity style={styles.modalBtnDelete} onPress={deleteScenario}>
                    <Text style={styles.modalBtnDeleteText}>Elimina</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity style={styles.modalBtnSave} onPress={saveScenarioChanges}>
                  <Text style={styles.modalBtnSaveText}>{editingScenario ? 'Salva' : 'Crea'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* Create Rule Modal */}
      <Modal transparent visible={showRuleModal} animationType="slide" onRequestClose={() => setShowRuleModal(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlayScroll}
        >
          <ScrollView contentContainerStyle={styles.modalContainerScroll} keyboardShouldPersistTaps="handled">
            <View style={styles.modalCardLarge}>
              <Text style={styles.modalTitle}>Nuova Regola Automatica</Text>

              {/* Rule Name */}
              <Text style={styles.fieldLabel}>Nome Regola</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="es. Accendi riscaldamento al freddo"
                placeholderTextColor={Colors.textMuted}
                value={ruleName}
                onChangeText={setRuleName}
              />

              <View style={styles.addActionsSection}>
                <Text style={styles.addSubTitle}>CONDIZIONE DI ATTIVAZIONE</Text>

                {sensorDevices.length === 0 ? (
                  <Text style={styles.noActionsText}>
                    Nessun sensore disponibile (es. Termostati o Sensori Presenza) nella tua casa.
                  </Text>
                ) : (
                  <>
                    {/* Trigger Sensor Device Selector */}
                    <Text style={styles.fieldLabel}>Seleziona Dispositivo Sensore</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.devicesScroll}>
                      {sensorDevices.map(d => (
                        <TouchableOpacity
                          key={d.id}
                          style={[styles.deviceChip, ruleSensorId === d.id && styles.deviceChipSelected]}
                          onPress={() => {
                            setRuleSensorId(d.id);
                            if (d.type === 'Termostato') {
                              setRuleCondition('<');
                              setRuleValoreSoglia('19');
                            } else {
                              setRuleCondition('motion');
                              setRuleValoreSoglia('true');
                            }
                          }}
                        >
                          <MaterialCommunityIcons
                            name={d.icon || 'devices'}
                            size={13}
                            color={ruleSensorId === d.id ? Colors.accent : Colors.textSecondary}
                          />
                          <Text style={[styles.deviceChipText, ruleSensorId === d.id && styles.deviceChipTextSelected]}>
                            {d.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>

                    {/* Sensor Condition Config */}
                    {selectedSensorObj && selectedSensorObj.type === 'Termostato' && (
                      <View>
                        <Text style={styles.fieldLabel}>Condizione di Soglia Temperatura</Text>
                        <View style={styles.actionTypeRow}>
                          <TouchableOpacity
                            style={[styles.actionTypeBtn, ruleCondition === '<' && styles.actionTypeBtnSelected]}
                            onPress={() => setRuleCondition('<')}
                          >
                            <Text style={[styles.actionTypeBtnText, ruleCondition === '<' && styles.actionTypeBtnTextSelected]}>
                              Minore di (&lt;)
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.actionTypeBtn, ruleCondition === '>' && styles.actionTypeBtnSelected]}
                            onPress={() => setRuleCondition('>')}
                          >
                            <Text style={[styles.actionTypeBtnText, ruleCondition === '>' && styles.actionTypeBtnTextSelected]}>
                              Maggiore di (&gt;)
                            </Text>
                          </TouchableOpacity>
                        </View>

                        <Text style={styles.fieldLabel}>Temperatura di Soglia</Text>
                        <View style={styles.valueAdjusterRow}>
                          <TouchableOpacity style={styles.adjustBtn} onPress={() => adjustThresholdTemp(-0.5)}>
                            <Text style={styles.adjustBtnText}>-0.5°C</Text>
                          </TouchableOpacity>
                          <View style={styles.valueDisplayContainer}>
                            <Text style={styles.valueDisplayVal}>{ruleValoreSoglia}°C</Text>
                          </View>
                          <TouchableOpacity style={styles.adjustBtn} onPress={() => adjustThresholdTemp(0.5)}>
                            <Text style={styles.adjustBtnText}>+0.5°C</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}

                    {selectedSensorObj && selectedSensorObj.type === 'Sensore_Presenza' && (
                      <View style={{ marginVertical: Spacing.sm }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <MaterialCommunityIcons name="map-marker" size={14} color={Colors.textMuted} />
                          <Text style={styles.ruleDetailText}>La regola scatterà non appena il sensore rileva movimento.</Text>
                        </View>
                      </View>
                    )}
                  </>
                )}
              </View>

              <View style={styles.addActionsSection}>
                <Text style={styles.addSubTitle}>AZIONE DA COMPIERE</Text>

                {devices.length === 0 ? (
                  <Text style={styles.noActionsText}>Nessun dispositivo disponibile.</Text>
                ) : (
                  <>
                    {/* Actuator Device Selector */}
                    <Text style={styles.fieldLabel}>Seleziona Dispositivo Attuatore</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.devicesScroll}>
                      {devices.map(d => (
                        <TouchableOpacity
                          key={d.id}
                          style={[styles.deviceChip, ruleActuatorId === d.id && styles.deviceChipSelected]}
                          onPress={() => {
                            setRuleActuatorId(d.id);
                            if (d.type === 'Illuminazione') {
                              setRuleAzione('regola');
                              setRuleValoreAzione('100');
                            } else if (d.type === 'Tapparelle') {
                              setRuleAzione('regola');
                              setRuleValoreAzione('50');
                            } else if (d.type === 'Termostato') {
                              setRuleAzione('regola');
                              setRuleValoreAzione('20');
                            } else {
                              setRuleAzione('accendi');
                              setRuleValoreAzione('');
                            }
                          }}
                        >
                          <MaterialCommunityIcons
                            name={d.icon || 'devices'}
                            size={13}
                            color={ruleActuatorId === d.id ? Colors.accent : Colors.textSecondary}
                          />
                          <Text style={[styles.deviceChipText, ruleActuatorId === d.id && styles.deviceChipTextSelected]}>
                            {d.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>

                    {/* Action Selector */}
                    <Text style={styles.fieldLabel}>Seleziona Azione</Text>
                    <View style={styles.actionTypeRow}>
                      <TouchableOpacity
                        style={[styles.actionTypeBtn, ruleAzione === 'accendi' && styles.actionTypeBtnSelected]}
                        onPress={() => setRuleAzione('accendi')}
                      >
                        <Text style={[styles.actionTypeBtnText, ruleAzione === 'accendi' && styles.actionTypeBtnTextSelected]}>Accendi</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionTypeBtn, ruleAzione === 'spegni' && styles.actionTypeBtnSelected]}
                        onPress={() => setRuleAzione('spegni')}
                      >
                        <Text style={[styles.actionTypeBtnText, ruleAzione === 'spegni' && styles.actionTypeBtnTextSelected]}>Spegni</Text>
                      </TouchableOpacity>
                      {actuatorSupportsRegola && (
                        <TouchableOpacity
                          style={[styles.actionTypeBtn, ruleAzione === 'regola' && styles.actionTypeBtnSelected]}
                          onPress={() => setRuleAzione('regola')}
                        >
                          <Text style={[styles.actionTypeBtnText, ruleAzione === 'regola' && styles.actionTypeBtnTextSelected]}>Regola</Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    {/* Specialized value adjuster */}
                    {ruleAzione === 'regola' && selectedActuatorObj && (
                      <View>
                        <Text style={styles.fieldLabel}>Valore di Regolazione</Text>

                        {selectedActuatorObj.type === 'Illuminazione' && (
                          <View style={styles.presetButtonsRow}>
                            {[25, 50, 75, 100].map(val => (
                              <TouchableOpacity
                                key={val}
                                style={[styles.presetBtn, String(ruleValoreAzione) === String(val) && styles.presetBtnActive]}
                                onPress={() => setRuleValoreAzione(String(val))}
                              >
                                <Text style={[styles.presetBtnText, String(ruleValoreAzione) === String(val) && styles.presetBtnTextActive]}>
                                  {val}%
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        )}

                        {selectedActuatorObj.type === 'Tapparelle' && (
                          <View style={styles.presetButtonsRow}>
                            {[0, 25, 50, 75, 100].map(val => {
                              let label = `${val}%`;
                              if (val === 0) label = 'Chiuse';
                              if (val === 100) label = 'Aperte';
                              return (
                                <TouchableOpacity
                                  key={val}
                                  style={[styles.presetBtn, String(ruleValoreAzione) === String(val) && styles.presetBtnActive]}
                                  onPress={() => setRuleValoreAzione(String(val))}
                                >
                                  <Text style={[styles.presetBtnText, String(ruleValoreAzione) === String(val) && styles.presetBtnTextActive]}>
                                    {label}
                                  </Text>
                                </TouchableOpacity>
                              );
                            })}
                          </View>
                        )}

                        {selectedActuatorObj.type === 'Termostato' && (
                          <View style={styles.valueAdjusterRow}>
                            <TouchableOpacity style={styles.adjustBtn} onPress={() => adjustRuleActionTemp(-0.5)}>
                              <Text style={styles.adjustBtnText}>-0.5°C</Text>
                            </TouchableOpacity>
                            <View style={styles.valueDisplayContainer}>
                              <Text style={styles.valueDisplayVal}>{ruleValoreAzione}°C</Text>
                            </View>
                            <TouchableOpacity style={styles.adjustBtn} onPress={() => adjustRuleActionTemp(0.5)}>
                              <Text style={styles.adjustBtnText}>+0.5°C</Text>
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    )}
                  </>
                )}
              </View>

              {/* Bottom buttons */}
              <View style={styles.modalButtonsRow}>
                <TouchableOpacity style={styles.modalBtnCancel} onPress={() => setShowRuleModal(false)}>
                  <Text style={styles.modalBtnCancelText}>Annulla</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.modalBtnSave} onPress={saveRule}>
                  <Text style={styles.modalBtnSaveText}>Crea</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.lg, paddingBottom: Spacing.xxl },

  // Active Banner
  activeBanner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.md,
    borderWidth: 1.5, marginBottom: Spacing.lg, gap: Spacing.sm, ...Shadow.card,
  },
  activeBannerIcon: { fontSize: 28 },
  activeBannerText: { flex: 1 },
  activeBannerLabel: { fontSize: 9, fontWeight: '700', color: Colors.success, letterSpacing: 1.5 },
  activeBannerName: { ...Typography.bodyBold },
  deactivateBtn: {
    backgroundColor: Colors.danger + '20', borderRadius: Radius.sm,
    paddingVertical: 6, paddingHorizontal: Spacing.sm,
    borderWidth: 1, borderColor: Colors.danger + '50',
  },
  deactivateBtnText: { fontSize: 12, fontWeight: '600', color: Colors.danger },

  sectionTitle: { ...Typography.heading3, marginBottom: Spacing.md },

  // Scenarios Grid
  scenariosGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm,
  },
  scenarioCard: {
    width: '47%', backgroundColor: Colors.card, borderRadius: Radius.xl,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.border,
    position: 'relative', overflow: 'hidden', ...Shadow.card,
    minHeight: 140,
  },
  activeIndicator: {
    position: 'absolute', top: Spacing.sm, right: Spacing.sm,
    borderRadius: Radius.full, paddingVertical: 2, paddingHorizontal: 8,
  },
  activeIndicatorText: { fontSize: 9, fontWeight: '800', color: '#fff', letterSpacing: 1 },
  scenarioCardIcon: { fontSize: 32, marginBottom: Spacing.sm },
  scenarioCardName: { ...Typography.bodyBold, marginBottom: 4 },
  scenarioCardDesc: { ...Typography.caption, marginBottom: Spacing.sm },
  actionsPreview: { gap: 3, marginBottom: Spacing.lg },
  actionChip: { fontSize: 10, color: Colors.textMuted, fontWeight: '500' },
  actionMore: { fontSize: 10, color: Colors.accent, fontWeight: '600' },

  // Edit Card Button
  editCardBtn: {
    position: 'absolute',
    bottom: Spacing.sm,
    right: Spacing.sm,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    zIndex: 10,
    ...Shadow.card,
  },
  editCardBtnText: { fontSize: 13, color: Colors.textSecondary },

  // Add Card
  addScenarioCard: {
    width: '47%', backgroundColor: Colors.card, borderRadius: Radius.xl,
    padding: Spacing.md, borderWidth: 1.5, borderColor: Colors.borderLight,
    borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center',
    minHeight: 140,
  },
  addScenarioIcon: { fontSize: 28, color: Colors.textMuted, marginBottom: Spacing.sm },
  addScenarioLabel: { ...Typography.caption, color: Colors.textMuted, textAlign: 'center' },

  // Modal Layout Scroll
  modalOverlayScroll: { flex: 1, backgroundColor: Colors.overlay },
  modalContainerScroll: { flexGrow: 1, justifyContent: 'flex-end' },
  modalCardLarge: {
    backgroundColor: Colors.surface, borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl,
    padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border,
  },

  modalTitle: { ...Typography.heading2, marginBottom: Spacing.lg },
  fieldLabel: { ...Typography.label, marginBottom: Spacing.xs, marginTop: Spacing.sm },
  modalInput: {
    backgroundColor: Colors.card, borderRadius: Radius.md,
    paddingVertical: 12, paddingHorizontal: Spacing.md,
    color: Colors.textPrimary, fontSize: 15,
    borderWidth: 1, borderColor: Colors.border,
    marginBottom: Spacing.sm,
  },

  iconRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginBottom: Spacing.md, marginTop: Spacing.xs },
  iconChoice: {
    width: 42, height: 42, borderRadius: 21,
    borderWidth: 1.5, borderColor: Colors.border,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: Colors.card,
  },
  iconChoiceText: { fontSize: 20 },
  colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.md, marginTop: Spacing.xs },
  colorChoice: {
    width: 30, height: 30, borderRadius: 15,
    borderWidth: 1.5, borderColor: 'transparent',
  },
  colorChoiceActive: {
    borderColor: '#ffffff',
    transform: [{ scale: 1.1 }],
  },

  // Actions List in Modal
  noActionsText: { ...Typography.caption, color: Colors.textMuted, fontStyle: 'italic', marginBottom: Spacing.md, marginTop: Spacing.xs },
  actionsList: { gap: Spacing.xs, marginBottom: Spacing.md, marginTop: Spacing.xs },
  actionItem: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.card, borderRadius: Radius.md,
    paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md,
    borderWidth: 1, borderColor: Colors.border,
  },
  actionItemName: { ...Typography.bodyBold, flex: 1, fontSize: 13 },
  actionItemType: { ...Typography.caption, color: Colors.accent, fontWeight: '600', marginRight: Spacing.md },
  actionItemDelete: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.danger + '15', justifyContent: 'center', alignItems: 'center',
  },
  actionItemDeleteText: { fontSize: 13 },

  // Add Action Section
  addActionsSection: {
    backgroundColor: Colors.card, borderRadius: Radius.lg,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.border,
    marginBottom: Spacing.lg, marginTop: Spacing.md,
  },
  addSubTitle: { ...Typography.label, color: Colors.textSecondary, marginBottom: Spacing.xs, fontSize: 12 },
  devicesScroll: { flexDirection: 'row', marginBottom: Spacing.md, marginTop: Spacing.xs },
  deviceChip: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface,
    borderRadius: Radius.full, paddingVertical: 6, paddingHorizontal: 12,
    marginRight: Spacing.sm, borderWidth: 1, borderColor: Colors.border, gap: 4, height: 32,
  },
  deviceChipSelected: {
    backgroundColor: Colors.accentSoft, borderColor: Colors.accent,
  },
  deviceChipIcon: { fontSize: 13 },
  deviceChipText: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500' },
  deviceChipTextSelected: { color: Colors.accent, fontWeight: '700' },

  actionTypeRow: { flexDirection: 'row', gap: Spacing.xs, marginBottom: Spacing.md, marginTop: Spacing.xs },
  actionTypeBtn: {
    flex: 1, paddingVertical: 10, alignItems: 'center',
    borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  actionTypeBtnSelected: {
    backgroundColor: Colors.accent, borderColor: Colors.accent,
  },
  actionTypeBtnText: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  actionTypeBtnTextSelected: { color: Colors.background, fontWeight: '700' },

  valueAdjusterRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    marginBottom: Spacing.md, justifyContent: 'center', marginTop: Spacing.xs,
  },
  adjustBtn: {
    backgroundColor: Colors.surface, borderRadius: Radius.full,
    paddingVertical: 8, paddingHorizontal: 16,
    borderWidth: 1, borderColor: Colors.border,
  },
  adjustBtnText: { fontSize: 12, fontWeight: '700', color: Colors.textPrimary },
  valueDisplayContainer: { minWidth: 80, alignItems: 'center' },
  valueDisplayVal: { fontSize: 18, fontWeight: '700', color: Colors.accent },

  segmentBtn: {
    flex: 1, paddingVertical: 10, alignItems: 'center',
    borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  segmentBtnActive: {
    backgroundColor: Colors.accentSoft, borderColor: Colors.accent,
  },
  segmentBtnText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  segmentBtnTextActive: { color: Colors.accent, fontWeight: '700' },

  addActionBtn: {
    backgroundColor: Colors.accentSoft, borderRadius: Radius.full,
    paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: Colors.accent,
    marginTop: Spacing.sm,
  },
  addActionBtnText: { fontSize: 13, fontWeight: '700', color: Colors.accent },

  modalButtonsRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md, marginBottom: Spacing.md },
  modalBtnSave: {
    flex: 2, paddingVertical: 14, alignItems: 'center',
    borderRadius: Radius.full, backgroundColor: Colors.accent, ...Shadow.accent,
  },
  modalBtnSaveText: { fontSize: 14, fontWeight: '700', color: Colors.background },
  modalBtnDelete: {
    flex: 1, paddingVertical: 14, alignItems: 'center',
    borderRadius: Radius.full, backgroundColor: Colors.danger + '20',
    borderWidth: 1, borderColor: Colors.danger + '50',
  },
  modalBtnDeleteText: { fontSize: 14, fontWeight: '600', color: Colors.danger },
  modalBtnCancel: {
    flex: 1.5, paddingVertical: 14, alignItems: 'center',
    borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.borderLight,
    backgroundColor: Colors.card,
  },
  modalBtnCancelText: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },

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

  // Rules List & Cards
  rulesListContainer: { gap: Spacing.md },
  ruleCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.card,
  },
  ruleCardInactive: {
    opacity: 0.65,
  },
  ruleCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderColor: Colors.borderLight,
    paddingBottom: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  ruleCardTitle: { ...Typography.bodyBold, fontSize: 15 },
  textInactive: { color: Colors.textMuted },
  ruleDetails: { gap: Spacing.xs, marginBottom: Spacing.sm },
  ruleStepLabel: { fontSize: 10, fontWeight: '700', color: Colors.textMuted },
  ruleDetailText: { fontSize: 13, color: Colors.textPrimary, lineHeight: 18 },
  ruleDeleteBtn: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.danger + '15',
    paddingVertical: 6,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.danger + '50',
    marginTop: Spacing.xs,
  },
  ruleDeleteBtnText: { fontSize: 11, fontWeight: '600', color: Colors.danger },

  // Switch styles
  switchContainer: {
    width: 44,
    height: 22,
    borderRadius: 11,
    padding: 2,
    justifyContent: 'center',
  },
  switchActive: {
    backgroundColor: Colors.success,
  },
  switchInactive: {
    backgroundColor: Colors.border,
  },
  switchCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#fff',
    ...Shadow.card,
  },
  switchCircleActive: {
    alignSelf: 'flex-end',
  },
  switchCircleInactive: {
    alignSelf: 'flex-start',
  },
  presetButtonsRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    justifyContent: 'space-between',
    marginTop: Spacing.xs,
    marginBottom: Spacing.md,
  },
  presetBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  presetBtnActive: {
    backgroundColor: Colors.accentSoft,
    borderColor: Colors.accent,
  },
  presetBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  presetBtnTextActive: {
    color: Colors.accent,
    fontWeight: '700',
  },
});
