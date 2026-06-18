import React, { useState, useEffect } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, StatusBar, Modal, TextInput,
  ActivityIndicator, Alert, KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard, Platform,
} from 'react-native';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../theme';
import { SmartToggle } from '../../components';
import AppHeader from '../../components/AppHeader';
import { useDeviceStore } from '../../store/DeviceStore';
const { api } = require('../../services/api');

/* ──────────────────────────────────────────
   Family Members data + components
────────────────────────────────────────── */
const ROLE_COLORS = {
  'Amministratore': Colors.accent,
  'Membro':         Colors.success,
  'Ospite':         Colors.warning,
};

function FamilyMemberCard({ member, isMe, onRemove }) {
  return (
    <View style={[memberStyles.card, isMe && memberStyles.cardMe]}>
      {/* Avatar */}
      <View style={memberStyles.avatarWrap}>
        <View style={[memberStyles.avatar, isMe && memberStyles.avatarMe]}>
          <Text style={memberStyles.avatarText}>{member.avatar}</Text>
        </View>
        <View style={[memberStyles.onlineDot, member.online && memberStyles.onlineDotActive]} />
      </View>

      {/* Info */}
      <View style={memberStyles.info}>
        <View style={memberStyles.nameRow}>
          <Text style={memberStyles.name}>{member.name}</Text>
          {isMe && <Text style={memberStyles.meTag}>Tu</Text>}
        </View>
        <Text style={memberStyles.email}>{member.email}</Text>
        <View style={[memberStyles.roleBadge, { borderColor: ROLE_COLORS[member.role] + '70' }]}>
          <Text style={[memberStyles.roleText, { color: ROLE_COLORS[member.role] }]}>
            {member.role}
          </Text>
        </View>
      </View>

      {/* Actions (non puoi rimuovere te stesso) */}
      {!isMe && (
        <TouchableOpacity style={memberStyles.removeBtn} onPress={() => onRemove(member.id)}>
          <Text style={memberStyles.removeBtnText}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const memberStyles = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.md,
    borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.sm, gap: Spacing.sm,
    ...Shadow.card,
  },
  cardMe: { borderColor: Colors.accent + '60', backgroundColor: Colors.accentSoft + '30' },
  avatarWrap: { position: 'relative' },
  avatar: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: Colors.cardAlt, borderWidth: 2, borderColor: Colors.border,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarMe: { borderColor: Colors.accent, backgroundColor: Colors.accentSoft },
  avatarText: { fontSize: 14, fontWeight: '800', color: Colors.textPrimary },
  onlineDot: {
    position: 'absolute', bottom: 1, right: 1,
    width: 11, height: 11, borderRadius: 6,
    backgroundColor: Colors.textMuted, borderWidth: 2, borderColor: Colors.card,
  },
  onlineDotActive: { backgroundColor: Colors.success },
  info: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginBottom: 2 },
  name: { ...Typography.bodyBold, fontSize: 14 },
  meTag: {
    fontSize: 9, fontWeight: '800', color: Colors.accent,
    backgroundColor: Colors.accentSoft, borderRadius: Radius.full,
    paddingVertical: 1, paddingHorizontal: 6, letterSpacing: 0.5,
  },
  email: { ...Typography.caption, fontSize: 11 },
  roleBadge: {
    alignSelf: 'flex-start', borderRadius: Radius.full,
    paddingVertical: 2, paddingHorizontal: 8, borderWidth: 1, marginTop: 4,
  },
  roleText: { fontSize: 10, fontWeight: '700' },
  removeBtn: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: Colors.danger + '15', borderWidth: 1, borderColor: Colors.danger + '40',
    justifyContent: 'center', alignItems: 'center',
  },
  removeBtnText: { fontSize: 12, color: Colors.danger, fontWeight: '700' },
});

/* ──────────────────────────────────────────
   Settings sections
────────────────────────────────────────── */
const SETTINGS_SECTIONS = [
  {
    title: 'Account',
    items: [
      { label: 'Modifica Credenziali', icon: '👤', type: 'nav' },
      { label: 'Elimina account',       icon: '🗑️', type: 'nav' },
    ],
  },
  {
    title: 'Casa',
    items: [
      { label: 'Crea nuova casa',  icon: '➕', type: 'nav' },
      { label: 'Inviti ricevuti',  icon: '📨', type: 'nav' },
      { label: 'Inviti inviati',   icon: '📤', type: 'nav' },
      { label: 'Abbandona casa',   icon: '🚪', type: 'nav' },
      { label: 'Gestisci stanze',  icon: '🛋️', type: 'nav' },
      { label: 'Dispositivi',      icon: '📱', type: 'nav' },
    ],
  },
  {
    title: 'Preferenze',
    items: [
      { label: 'Notifiche Push',       icon: '🔔', type: 'toggle', key: 'notifications' },
      { label: 'Risparmio Energetico',  icon: '🌿', type: 'toggle', key: 'energySaving' },
    ],
  },
];

/* ──────────────────────────────────────────
   Main Screen
────────────────────────────────────────── */
export default function UserScreen({ navigation }) {
  const { devices, rooms, loadData } = useDeviceStore();
  const [toggles, setToggles] = useState({ notifications: true, nightMode: false, energySaving: true });
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState({
    id: null,
    name: 'Caricamento...',
    email: '',
    avatar: '??',
  });

  const [inviteModal, setInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');

  const [isAdmin, setIsAdmin] = useState(false);
  const [pinModal, setPinModal] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  const [credentialsModal, setCredentialsModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');

  const [deleteAccountModal, setDeleteAccountModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');

  const [createHouseModal, setCreateHouseModal] = useState(false);
  const [newHouseName, setNewHouseName] = useState('');

  const [invitesModal, setInvitesModal] = useState(false);
  const [pendingInvites, setPendingInvites] = useState([]);

  const [sentInvitesModal, setSentInvitesModal] = useState(false);
  const [sentInvites, setSentInvites] = useState([]);

  const setToggle = (key) => setToggles(prev => ({ ...prev, [key]: !prev[key] }));

  const fetchProfileAndMembers = async () => {
    setLoading(true);
    try {
      const user = await api.me();
      setUserProfile({
        id: String(user.id_utente),
        name: user.nome || user.email.split('@')[0],
        email: user.email,
        avatar: user.avatar || (user.nome || user.email).substring(0, 2).toUpperCase(),
      });

      const membersData = await api.getMembri();
      const mapped = membersData.map(m => ({
        id: String(m.id_utente),
        name: m.nome || m.email.split('@')[0],
        email: m.email,
        role: m.ruolo,
        avatar: m.avatar || (m.nome || m.email).substring(0, 2).toUpperCase(),
        online: m.id_utente === user.id_utente,
      }));
      setMembers(mapped);

      const currentUserMember = mapped.find(m => m.id === String(user.id_utente));
      setIsAdmin(currentUserMember?.role === 'Amministratore');
    } catch (e) {
      console.warn("Impossibile caricare il profilo o i membri:", e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePin = async () => {
    if (!newPin || !/^\d{4,6}$/.test(newPin)) {
      Alert.alert('Errore', 'Il PIN deve essere composto da 4 a 6 cifre numeriche.');
      return;
    }
    if (newPin !== confirmPin) {
      Alert.alert('Errore', 'I PIN inseriti non coincidono.');
      return;
    }
    try {
      await api.aggiornaPin(newPin);
      Alert.alert('Successo', 'PIN di sblocco serrature aggiornato correttamente.');
      setPinModal(false);
      setNewPin('');
      setConfirmPin('');
    } catch (e) {
      Alert.alert('Errore', e.message);
    }
  };

  const loadInvites = async () => {
    try {
      const list = await api.getInviti();
      setPendingInvites(list);
    } catch (e) {
      console.warn("loadInvites error:", e.message);
    }
  };

  const loadSentInvites = async () => {
    try {
      const list = await api.getInvitiInviati();
      setSentInvites(list);
    } catch (e) {
      console.warn("loadSentInvites error:", e.message);
    }
  };

  const handleOpenSentInvites = async () => {
    setSentInvitesModal(true);
    await loadSentInvites();
  };

  useEffect(() => {
    fetchProfileAndMembers();
  }, []);

  const removeMember = async (id) => {
    Alert.alert(
      'Rimuovi membro',
      'Sei sicuro di voler rimuovere questo membro dal gruppo familiare?',
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Rimuovi',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.deleteMembro(id);
              fetchProfileAndMembers();
            } catch (e) {
              Alert.alert('Errore', e.message);
            }
          }
        }
      ]
    );
  };

  const sendInvite = async () => {
    if (inviteEmail.trim()) {
      try {
        await api.invita(inviteEmail.trim());
        Alert.alert('Invito inviato', `L'invito è stato inviato con successo a: ${inviteEmail}`);
        setInviteEmail('');
        setInviteModal(false);
        fetchProfileAndMembers();
      } catch (e) {
        Alert.alert('Errore', e.message);
      }
    }
  };

  const handleUpdateCredentials = async () => {
    if (!currentPassword) {
      Alert.alert('Errore', 'Inserisci la password attuale per confermare le modifiche.');
      return;
    }
    try {
      const payload = { password: currentPassword };
      if (newEmail.trim()) payload.email = newEmail.trim();
      if (newPassword.trim()) payload.nuovaPassword = newPassword.trim();

      await api.updateCredentials(payload);
      Alert.alert('Successo', 'Credenziali aggiornate con successo.');
      setCredentialsModal(false);
      setNewEmail('');
      setNewPassword('');
      setCurrentPassword('');
      fetchProfileAndMembers();
    } catch (e) {
      Alert.alert('Errore', e.message);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      Alert.alert('Errore', 'Inserisci la password per confermare la cancellazione.');
      return;
    }
    try {
      await api.deleteAccount({ password: deletePassword });
      Alert.alert('Account Eliminato', 'Il tuo account è stato eliminato definitivamente.');
      setDeleteAccountModal(false);
      navigation.replace('Login');
    } catch (e) {
      Alert.alert('Errore', e.message);
    }
  };

  const handleCreateHouse = async () => {
    if (!newHouseName.trim()) {
      Alert.alert('Errore', 'Inserisci un nome valido per la nuova casa.');
      return;
    }
    try {
      const newGroup = await api.creaGruppo({ nome: newHouseName.trim() });
      Alert.alert('Casa Creata', `Nuova abitazione "${newHouseName}" creata con successo.`);
      const { setGruppo } = require('../../services/api');
      setGruppo(newGroup.id_gruppo);
      setCreateHouseModal(false);
      setNewHouseName('');
      await loadData();
      fetchProfileAndMembers();
    } catch (e) {
      Alert.alert('Errore', e.message);
    }
  };

  const handleOpenInvites = async () => {
    setInvitesModal(true);
    await loadInvites();
  };

  const handleRespondInvite = async (invitoId, accept) => {
    try {
      await api.rispondiInvito(invitoId, accept);
      Alert.alert('Successo', `Invito ${accept ? 'accettato' : 'rifiutato'}.`);
      await loadInvites();
      if (accept) {
        const groups = await api.getGruppi();
        if (groups && groups.length > 0) {
          const { setGruppo } = require('../../services/api');
          const acceptedGroup = groups[groups.length - 1];
          setGruppo(acceptedGroup.id_gruppo);
          await loadData();
        }
      }
      fetchProfileAndMembers();
    } catch (e) {
      Alert.alert('Errore', e.message);
    }
  };

  const handleAbandonHouse = async () => {
    const { getGruppo, setGruppo } = require('../../services/api');
    const activeId = getGruppo();
    if (!activeId) {
      Alert.alert('Errore', 'Nessuna casa attiva selezionata.');
      return;
    }
    Alert.alert(
      'Abbandona casa',
      'Sei sicuro di voler abbandonare questa casa? Perderai l\'accesso a tutti i dispositivi connessi.',
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Abbandona',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.abbandonaGruppo();
              Alert.alert('Casa Abbandonata', 'Hai abbandonato il gruppo familiare con successo.');
              
              const groups = await api.getGruppi();
              if (groups && groups.length > 0) {
                setGruppo(groups[0].id_gruppo);
                await loadData();
                fetchProfileAndMembers();
              } else {
                setGruppo(null);
                navigation.replace('Login');
              }
            } catch (e) {
              Alert.alert('Errore', e.message);
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <AppHeader navigation={navigation} title="Profilo" activeTab="User" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ── Profile Card ── */}
        <View style={styles.profileCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitials}>{userProfile.avatar}</Text>
            <View style={styles.onlineDot} />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{userProfile.name}</Text>
            <Text style={styles.profileEmail}>{userProfile.email}</Text>
          </View>
          <TouchableOpacity style={styles.editBtn} onPress={() => setCredentialsModal(true)}>
            <MaterialCommunityIcons name="pencil" size={16} color={Colors.accent} />
          </TouchableOpacity>
        </View>

        {/* ── Quick Stats ── */}
        <View style={styles.statsRow}>
          {[
            { label: 'Dispositivi', value: String(devices.length), icon: '📱' },
            { label: 'Stanze',      value: String(rooms.length),  icon: '🛋️' },
            { label: 'Famiglia',    value: String(members.length), icon: '👨‍👩‍👧' },
          ].map(s => (
            <View key={s.label} style={styles.statCard}>
              <Text style={styles.statIcon}>{s.icon}</Text>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* ── Family Group Section ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Gruppo familiare</Text>
            <TouchableOpacity
              style={styles.inviteBtn}
              onPress={() => setInviteModal(true)}
            >
              <Text style={styles.inviteBtnText}>+ Invita</Text>
            </TouchableOpacity>
          </View>

          {/* Online indicator legend */}
          <View style={styles.legendRow}>
            <View style={styles.legendDot} />
            <Text style={styles.legendText}>Online ora — </Text>
            <View style={[styles.legendDot, styles.legendDotOff]} />
            <Text style={styles.legendText}>Offline</Text>
          </View>

          {loading ? (
            <ActivityIndicator size="small" color={Colors.accent} style={{ marginVertical: Spacing.md }} />
          ) : members.length === 0 ? (
            <Text style={{ ...Typography.caption, paddingVertical: Spacing.sm, textAlign: 'center' }}>Nessun membro familiare trovato</Text>
          ) : (
            members.map(m => (
              <FamilyMemberCard
                key={m.id}
                member={m}
                isMe={m.id === userProfile.id}
                onRemove={removeMember}
              />
            ))
          )}

          {/* Pending invite placeholder */}
          <View style={styles.pendingInviteCard}>
            <MaterialCommunityIcons name="email-arrow-right-outline" size={22} color={Colors.textMuted} />
            <View style={{ flex: 1 }}>
              <Text style={styles.pendingLabel}>Invita altri membri</Text>
              <Text style={styles.pendingSub}>Condividi il controllo della casa</Text>
            </View>
            <TouchableOpacity style={styles.pendingBtn} onPress={() => setInviteModal(true)}>
              <Text style={styles.pendingBtnText}>Invita</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Settings Sections ── */}
        {[
          {
            title: 'Account',
            items: [
              { label: 'Modifica Credenziali', icon: '👤', type: 'nav' },
              { label: 'Elimina account',       icon: '🗑️', type: 'nav' },
            ],
          },
          {
            title: 'Casa',
            items: [
              { label: 'Crea nuova casa',  icon: '➕', type: 'nav' },
              { label: 'Inviti ricevuti',  icon: '📨', type: 'nav' },
              { label: 'Inviti inviati',   icon: '📤', type: 'nav' },
              ...(isAdmin ? [{ label: 'PIN sblocco serrature', icon: '🔑', type: 'nav' }] : []),
              { label: 'Abbandona casa',   icon: '🚪', type: 'nav' },
              { label: 'Gestisci stanze',  icon: '🛋️', type: 'nav' },
              { label: 'Dispositivi',      icon: '📱', type: 'nav' },
            ],
          },
          {
            title: 'Preferenze',
            items: [
              { label: 'Notifiche Push',       icon: '🔔', type: 'toggle', key: 'notifications' },
              { label: 'Risparmio Energetico',  icon: '🌿', type: 'toggle', key: 'energySaving' },
            ],
          },
        ].map(section => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionCard}>
              {section.items.map((item, index) => (
                <View key={item.label}>
                  <TouchableOpacity
                    style={styles.settingRow}
                    activeOpacity={item.type === 'toggle' ? 1 : 0.7}
                    onPress={() => {
                      if (item.type === 'toggle') return;
                      if (item.label === 'Gestisci stanze') {
                        navigation.navigate('Rooms');
                      } else if (item.label === 'Dispositivi') {
                        navigation.navigate('Home');
                      } else if (item.label === 'Modifica Credenziali') {
                        setCredentialsModal(true);
                      } else if (item.label === 'Elimina account') {
                        setDeleteAccountModal(true);
                      } else if (item.label === 'Crea nuova casa') {
                        setCreateHouseModal(true);
                      } else if (item.label === 'Inviti ricevuti') {
                        handleOpenInvites();
                      } else if (item.label === 'Inviti inviati') {
                        handleOpenSentInvites();
                      } else if (item.label === 'PIN sblocco serrature') {
                        setPinModal(true);
                      } else if (item.label === 'Abbandona casa') {
                        handleAbandonHouse();
                      } else {
                        Alert.alert('Info', `${item.label} sarà disponibile a breve.`);
                      }
                    }}
                  >
                    <View style={styles.settingLeft}>
                      <View style={styles.settingIconWrap}>
                        <Text style={styles.settingIcon}>{item.icon}</Text>
                      </View>
                      <Text style={styles.settingLabel}>{item.label}</Text>
                    </View>
                    <View style={styles.settingRight}>
                      {item.badge && (
                        <View style={styles.badge}>
                          <Text style={styles.badgeText}>{item.badge}</Text>
                        </View>
                      )}
                      {item.value && !item.badge && (
                        <Text style={styles.settingValue}>{item.value}</Text>
                      )}
                      {item.type === 'toggle' ? (
                        <SmartToggle value={toggles[item.key]} onValueChange={() => setToggle(item.key)} />
                      ) : (
                        <Text style={styles.chevron}>›</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                  {index < section.items.length - 1 && <View style={styles.rowDivider} />}
                </View>
              ))}
            </View>
          </View>
        ))}

        {/* ── Logout ── */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={() => navigation.replace('Login')}
        >
          <Text style={styles.logoutText}>🚪 Esci dall'account</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ── Invite Modal ── */}
      <Modal
        transparent
        visible={inviteModal}
        animationType="slide"
        onRequestClose={() => setInviteModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalDismissArea} />
          </TouchableWithoutFeedback>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Invita un membro</Text>
            <Text style={styles.modalSub}>
              Inserisci l'email della persona da aggiungere al gruppo familiare.
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder="email@esempio.com"
              placeholderTextColor={Colors.textMuted}
              value={inviteEmail}
              onChangeText={setInviteEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoFocus
            />
            <Text style={styles.rolePickerLabel}>Ruolo</Text>
            <View style={styles.rolePicker}>
              {['Membro', 'Ospite'].map(r => (
                <TouchableOpacity key={r} style={styles.rolePickerBtn}>
                  <Text style={[styles.rolePickerText, { color: ROLE_COLORS[r] }]}>{r}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setInviteModal(false)}>
                <Text style={styles.modalCancelText}>Annulla</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirmBtn} onPress={sendInvite}>
                <Text style={styles.modalConfirmText}>Invia invito</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Credentials Modal ── */}
      <Modal transparent visible={credentialsModal} animationType="slide" onRequestClose={() => setCredentialsModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}><View style={styles.modalDismissArea} /></TouchableWithoutFeedback>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Modifica Credenziali</Text>
            <Text style={styles.modalSub}>Lascia vuoto il campo che non desideri modificare.</Text>
            
            <TextInput
              style={styles.modalInput}
              placeholder="Nuova Email"
              placeholderTextColor={Colors.textMuted}
              value={newEmail}
              onChangeText={setNewEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Nuova Password"
              placeholderTextColor={Colors.textMuted}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              autoCapitalize="none"
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Password attuale (richiesta)"
              placeholderTextColor={Colors.textMuted}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry
              autoCapitalize="none"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setCredentialsModal(false)}>
                <Text style={styles.modalCancelText}>Annulla</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirmBtn} onPress={handleUpdateCredentials}>
                <Text style={styles.modalConfirmText}>Salva</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Delete Account Modal ── */}
      <Modal transparent visible={deleteAccountModal} animationType="slide" onRequestClose={() => setDeleteAccountModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}><View style={styles.modalDismissArea} /></TouchableWithoutFeedback>
          <View style={styles.modalCard}>
            <Text style={[styles.modalTitle, { color: Colors.danger }]}>Elimina Account</Text>
            <Text style={[styles.modalSub, { color: Colors.danger }]}>ATTENZIONE: Questa azione è permanente e rimuoverà tutti i tuoi dati.</Text>
            
            <TextInput
              style={styles.modalInput}
              placeholder="Inserisci la password per confermare"
              placeholderTextColor={Colors.textMuted}
              value={deletePassword}
              onChangeText={setDeletePassword}
              secureTextEntry
              autoCapitalize="none"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setDeleteAccountModal(false)}>
                <Text style={styles.modalCancelText}>Annulla</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalConfirmBtn, { backgroundColor: Colors.danger }]} onPress={handleDeleteAccount}>
                <Text style={[styles.modalConfirmText, { color: '#ffffff' }]}>Elimina definitivamente</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Create House Modal ── */}
      <Modal transparent visible={createHouseModal} animationType="slide" onRequestClose={() => setCreateHouseModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}><View style={styles.modalDismissArea} /></TouchableWithoutFeedback>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Crea nuova casa</Text>
            <Text style={styles.modalSub}>Inserisci il nome della nuova abitazione/gruppo.</Text>
            
            <TextInput
              style={styles.modalInput}
              placeholder="Nome casa (es. Casa in montagna)"
              placeholderTextColor={Colors.textMuted}
              value={newHouseName}
              onChangeText={setNewHouseName}
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setCreateHouseModal(false)}>
                <Text style={styles.modalCancelText}>Annulla</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirmBtn} onPress={handleCreateHouse}>
                <Text style={styles.modalConfirmText}>Crea</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Inviti Ricevuti Modal ── */}
      <Modal transparent visible={invitesModal} animationType="slide" onRequestClose={() => setInvitesModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}><View style={styles.modalDismissArea} /></TouchableWithoutFeedback>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Inviti Ricevuti</Text>
            <ScrollView style={{ maxHeight: 200, marginBottom: Spacing.md }}>
              {pendingInvites.map(invite => (
                <View key={invite.id_invito} style={inviteStyles.inviteRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={inviteStyles.inviteText}>Gruppo: <Text style={{fontWeight:'700'}}>{invite.nome_abitazione || invite.nome_gruppo}</Text></Text>
                    <Text style={inviteStyles.inviteSub}>Invitato da: {invite.nome_mittente || invite.email_mittente}</Text>
                  </View>
                  <View style={inviteStyles.btnRow}>
                    <TouchableOpacity style={inviteStyles.acceptBtn} onPress={() => handleRespondInvite(invite.id_invito, true)}>
                      <Text style={inviteStyles.acceptBtnText}>Accetta</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={inviteStyles.rejectBtn} onPress={() => handleRespondInvite(invite.id_invito, false)}>
                      <Text style={inviteStyles.rejectBtnText}>Rifiuta</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
              {pendingInvites.length === 0 && (
                <Text style={{ ...Typography.caption, paddingVertical: Spacing.md, textAlign: 'center' }}>Nessun invito pendente trovato</Text>
              )}
            </ScrollView>
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalCancelBtn, { flex: 1 }]} onPress={() => setInvitesModal(false)}>
                <Text style={styles.modalCancelText}>Chiudi</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Inviti Inviati Modal ── */}
      <Modal transparent visible={sentInvitesModal} animationType="slide" onRequestClose={() => setSentInvitesModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}><View style={styles.modalDismissArea} /></TouchableWithoutFeedback>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Inviti Inviati</Text>
            <ScrollView style={{ maxHeight: 200, marginBottom: Spacing.md }}>
              {sentInvites.map(invite => {
                let statusColor = Colors.textMuted;
                if (invite.stato_invito === 'accettato') statusColor = Colors.success;
                else if (invite.stato_invito === 'rifiutato') statusColor = Colors.danger;
                else if (invite.stato_invito === 'in_attesa') statusColor = Colors.warning;

                return (
                  <View key={invite.id_invito} style={inviteStyles.inviteRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={inviteStyles.inviteText}>Invitato: <Text style={{fontWeight:'700'}}>{invite.identificativo_invitato}</Text></Text>
                      <Text style={inviteStyles.inviteSub}>
                        Inviato il: {new Date(invite.created_at).toLocaleDateString()}
                      </Text>
                    </View>
                    <View style={{ alignSelf: 'center', paddingHorizontal: Spacing.sm }}>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: statusColor, textTransform: 'capitalize' }}>
                        {invite.stato_invito.replace('_', ' ')}
                      </Text>
                    </View>
                  </View>
                );
              })}
              {sentInvites.length === 0 && (
                <Text style={{ ...Typography.caption, paddingVertical: Spacing.md, textAlign: 'center' }}>Nessun invito inviato trovato</Text>
              )}
            </ScrollView>
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalCancelBtn, { flex: 1 }]} onPress={() => setSentInvitesModal(false)}>
                <Text style={styles.modalCancelText}>Chiudi</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── PIN Sblocco Modal ── */}
      <Modal transparent visible={pinModal} animationType="slide" onRequestClose={() => { setPinModal(false); setNewPin(''); setConfirmPin(''); }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}><View style={styles.modalDismissArea} /></TouchableWithoutFeedback>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>PIN Sblocco Serrature</Text>
            <Text style={styles.modalSub}>Imposta un codice PIN da 4 a 6 cifre numeriche per sbloccare le serrature.</Text>
            
            <TextInput
              style={styles.modalInput}
              placeholder="Nuovo PIN (4-6 cifre)"
              placeholderTextColor={Colors.textMuted}
              value={newPin}
              onChangeText={setNewPin}
              keyboardType="numeric"
              secureTextEntry
              maxLength={6}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Conferma PIN (4-6 cifre)"
              placeholderTextColor={Colors.textMuted}
              value={confirmPin}
              onChangeText={setConfirmPin}
              keyboardType="numeric"
              secureTextEntry
              maxLength={6}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => { setPinModal(false); setNewPin(''); setConfirmPin(''); }}>
                <Text style={styles.modalCancelText}>Annulla</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirmBtn} onPress={handleUpdatePin}>
                <Text style={styles.modalConfirmText}>Salva PIN</Text>
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
  scroll: { padding: Spacing.lg, paddingBottom: Spacing.xxl },

  /* Profile Card */
  profileCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.md,
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.md, ...Shadow.card,
  },
  avatarCircle: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: Colors.accentSoft, borderWidth: 2, borderColor: Colors.accent,
    justifyContent: 'center', alignItems: 'center', ...Shadow.accent, position: 'relative',
  },
  avatarInitials: { fontSize: 20, fontWeight: '800', color: Colors.accent },
  onlineDot: {
    position: 'absolute', bottom: 2, right: 2,
    width: 13, height: 13, borderRadius: 7,
    backgroundColor: Colors.success, borderWidth: 2, borderColor: Colors.surface,
  },
  profileInfo: { flex: 1 },
  profileName: { ...Typography.heading3 },
  profileEmail: { ...Typography.caption, marginTop: 2 },
  proBadge: {
    backgroundColor: Colors.warning + '20', borderRadius: Radius.full,
    paddingVertical: 2, paddingHorizontal: 8, marginTop: 4, alignSelf: 'flex-start',
    borderWidth: 1, borderColor: Colors.warning + '50',
  },
  proBadgeText: { fontSize: 10, fontWeight: '700', color: Colors.warning },
  editBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.card, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  editBtnText: { fontSize: 16 },

  /* Stats */
  statsRow: { flexDirection: 'row', gap: Spacing.xs, marginBottom: Spacing.lg },
  statCard: {
    flex: 1, backgroundColor: Colors.card, borderRadius: Radius.md,
    paddingVertical: Spacing.sm, alignItems: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  statIcon: { fontSize: 16, marginBottom: 2 },
  statValue: { fontSize: 18, fontWeight: '800', color: Colors.accent },
  statLabel: { fontSize: 9, fontWeight: '600', color: Colors.textMuted, marginTop: 2, letterSpacing: 0.3 },

  /* Section */
  section: { marginBottom: Spacing.lg },
  sectionHeaderRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm,
  },
  sectionTitle: { ...Typography.label, paddingLeft: 2 },
  inviteBtn: {
    backgroundColor: Colors.accentSoft, borderRadius: Radius.full,
    paddingVertical: 5, paddingHorizontal: 12,
    borderWidth: 1, borderColor: Colors.accent,
  },
  inviteBtnText: { fontSize: 12, fontWeight: '700', color: Colors.accent },

  /* Legend */
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: Spacing.sm },
  legendDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.success },
  legendDotOff: { backgroundColor: Colors.textMuted },
  legendText: { ...Typography.caption },

  /* Pending invite */
  pendingInviteCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.md,
    borderWidth: 1.5, borderColor: Colors.borderLight, borderStyle: 'dashed',
  },
  pendingIcon: { fontSize: 22 },
  pendingLabel: { ...Typography.bodyBold, fontSize: 14 },
  pendingSub: { ...Typography.caption, marginTop: 2 },
  pendingBtn: {
    backgroundColor: Colors.accentSoft, borderRadius: Radius.full,
    paddingVertical: 6, paddingHorizontal: 14, borderWidth: 1, borderColor: Colors.accent,
  },
  pendingBtnText: { fontSize: 12, fontWeight: '700', color: Colors.accent },

  /* Settings */
  sectionCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border, overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 14, paddingHorizontal: Spacing.md,
  },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  settingIconWrap: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: Colors.card, justifyContent: 'center', alignItems: 'center',
  },
  settingIcon: { fontSize: 16 },
  settingLabel: { ...Typography.bodyBold },
  settingRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  settingValue: { ...Typography.caption, color: Colors.textMuted },
  chevron: { fontSize: 20, color: Colors.textMuted, fontWeight: '300' },
  badge: {
    backgroundColor: Colors.warning + '20', borderRadius: Radius.full,
    paddingVertical: 2, paddingHorizontal: 8, borderWidth: 1, borderColor: Colors.warning + '50',
  },
  badgeText: { fontSize: 10, fontWeight: '700', color: Colors.warning },
  rowDivider: { height: 1, backgroundColor: Colors.border, marginLeft: Spacing.md + 32 + Spacing.sm },

  /* Logout */
  logoutBtn: {
    backgroundColor: Colors.card, borderRadius: Radius.lg, paddingVertical: Spacing.md,
    alignItems: 'center', borderWidth: 1, borderColor: Colors.danger + '40', marginTop: Spacing.sm,
  },
  logoutText: { fontSize: 15, fontWeight: '600', color: Colors.danger },

  /* Invite Modal */
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' },
  modalDismissArea: { flex: 1, width: '100%' },
  modalCard: {
    backgroundColor: Colors.surface, borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl,
    padding: Spacing.xl, borderWidth: 1, borderColor: Colors.border,
  },
  modalTitle: { ...Typography.heading2, marginBottom: 6 },
  modalSub: { ...Typography.body, color: Colors.textMuted, marginBottom: Spacing.lg },
  modalInput: {
    backgroundColor: Colors.card, borderRadius: Radius.md,
    paddingVertical: 14, paddingHorizontal: Spacing.md,
    color: Colors.textPrimary, fontSize: 15,
    borderWidth: 1, borderColor: Colors.accent, marginBottom: Spacing.md,
  },
  rolePickerLabel: { ...Typography.label, marginBottom: Spacing.xs },
  rolePicker: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
  rolePickerBtn: {
    backgroundColor: Colors.card, borderRadius: Radius.full,
    paddingVertical: 8, paddingHorizontal: 18, borderWidth: 1, borderColor: Colors.borderLight,
  },
  rolePickerText: { fontSize: 13, fontWeight: '700' },
  modalActions: { flexDirection: 'row', gap: Spacing.sm },
  modalCancelBtn: {
    flex: 1, paddingVertical: 14, alignItems: 'center',
    borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.borderLight,
  },
  modalCancelText: { fontSize: 15, fontWeight: '600', color: Colors.textSecondary },
  modalConfirmBtn: {
    flex: 2, paddingVertical: 14, alignItems: 'center',
    borderRadius: Radius.full, backgroundColor: Colors.accent, ...Shadow.accent,
  },
  modalConfirmText: { fontSize: 15, fontWeight: '700', color: Colors.background },
});

const inviteStyles = StyleSheet.create({
  inviteRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border,
    gap: Spacing.sm,
  },
  inviteText: { ...Typography.body, fontSize: 13, color: Colors.textPrimary },
  inviteSub: { ...Typography.caption, fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  btnRow: { flexDirection: 'row', gap: Spacing.xs },
  acceptBtn: {
    backgroundColor: Colors.success + '20', borderWidth: 1, borderColor: Colors.success,
    borderRadius: Radius.sm, paddingVertical: 4, paddingHorizontal: 10,
  },
  acceptBtnText: { fontSize: 11, fontWeight: '700', color: Colors.success },
  rejectBtn: {
    backgroundColor: Colors.danger + '20', borderWidth: 1, borderColor: Colors.danger,
    borderRadius: Radius.sm, paddingVertical: 4, paddingHorizontal: 10,
  },
  rejectBtnText: { fontSize: 11, fontWeight: '700', color: Colors.danger },
});
