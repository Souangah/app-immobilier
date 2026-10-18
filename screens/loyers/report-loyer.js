import React, { useContext, useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  Modal,
  TextInput,
  Pressable,
  Alert,
  Platform
} from "react-native";
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { GlobalContext } from "../../config/globaluser";

const BLEU = '#275edd';
const API = "https://sidneyespace.net/paiement/report-loyer.php";

export default function ReportLoyer({ navigation }) {

  const { user } = useContext(GlobalContext);

  const [loyers, setLoyers] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('attente');

  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [motif, setMotif] = useState("");
  const [dateReport, setDateReport] = useState(new Date(Date.now() + 15 * 24 * 3600000));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [sending, setSending] = useState(false);

  const fetchData = async () => {
    try {
      const res = await fetch(`${API}?matricule=${user?.matricule}`);
      const text = await res.text();
      if (text.trim().startsWith('<')) throw new Error("HTML reçu");
      const json = JSON.parse(text);
      if (json.success) {
        setLoyers(json.loyers || []);
        setReports(json.reports || []);
      }
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, []);
  const onRefresh = useCallback(() => { setRefreshing(true); fetchData(); }, []);

  const isAlreadyReported = (numero) =>
    reports.some(r => String(r.loyer) === String(numero) && r.etat_report === 'En attente');

  const openModal = (loyer) => {
    setSelected(loyer);
    setMotif("");
    setDateReport(new Date(Date.now() + 15 * 24 * 3600000));
    setShowModal(true);
  };

  const sendReport = async () => {
    if (motif.trim().length < 10) return Alert.alert("Erreur", "Motif minimum 10 caractères");
    setSending(true);
    try {
      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matricule: user?.matricule,
          loyer: selected.numero,
          motif_report: motif,
          date_report: dateReport.toISOString().split('T')[0]
        })
      });
      const text = await res.text();
      const json = JSON.parse(text);
      if (json.success) {
        Alert.alert("Succès", "Demande envoyée, état : En attente");
        setShowModal(false);
        fetchData();
      } else Alert.alert("Erreur", json.message);
    } catch (e) {
      Alert.alert("Erreur", e.message);
    } finally {
      setSending(false);
    }
  };

  const loyersEnAttente = loyers.filter(l => {
    const e = (l.etat || '').toLowerCase();
    return e.includes('retard') || e.includes('partiel') || e.includes('attente');
  });

  const loyersReportes = loyers.filter(l =>
    (l.etat || '').toLowerCase() === 'reporter' || (l.etat || '').toLowerCase() === 'reporté'
  );

  const reportsAttente = reports.filter(r => r.etat_report === 'En attente');
  const reportsValides = reports.filter(r => ['Reporter', 'Reporté', 'Approuvé'].includes(r.etat_report));

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={BLEU} />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Reports loyer</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'attente' && styles.tabActive]}
          onPress={() => setActiveTab('attente')}
        >
          <Text style={[styles.tabText, activeTab === 'attente' && styles.tabTextActive]}>
            En attente ({reportsAttente.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'reporte' && styles.tabActive]}
          onPress={() => setActiveTab('reporte')}
        >
          <Text style={[styles.tabText, activeTab === 'reporte' && styles.tabTextActive]}>
            Reportés ({loyersReportes.length + reportsValides.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 14, paddingBottom: 110 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[BLEU]} />}
      >
        {activeTab === 'attente'? (
          loyersEnAttente.length === 0? (
            <View style={styles.empty}>
              <Ionicons name="checkmark-circle" size={50} color="#22C55E" />
              <Text style={styles.emptyText}>Aucun loyer à reporter</Text>
            </View>
          ) : (
            loyersEnAttente.map((l, i) => {
              const reported = isAlreadyReported(l.numero);
              return (
                <View key={i} style={styles.card}>
                  <View style={styles.cardHead}>
                    <View>
                      <Text style={styles.mois}>{l.mois} {l.annee}</Text>
                      <Text style={styles.echeance}>Échéance: {l.date_echeance}</Text>
                    </View>
                    <Text style={[
                      styles.etat,
                      {
                        backgroundColor: l.etat.toLowerCase().includes('retard')? '#FEF2F2' : '#F1F5F9',
                        color: l.etat.toLowerCase().includes('retard')? '#EF4444' : '#64748B'
                      }
                    ]}>
                      {l.etat}
                    </Text>
                  </View>
                  <View style={styles.row}>
                    <Text style={styles.label}>Numéro</Text>
                    <Text style={styles.val}>{l.numero}</Text>
                  </View>
                  <View style={styles.row}>
                    <Text style={styles.label}>Montant</Text>
                    <Text style={styles.val}>{parseInt(l.montant || 0).toLocaleString()} FCFA</Text>
                  </View>
                  <View style={styles.row}>
                    <Text style={styles.label}>Reste</Text>
                    <Text style={[styles.val, { color: '#EF4444' }]}>{parseInt(l.reste || 0).toLocaleString()} FCFA</Text>
                  </View>
                  {reported? (
                    <View style={styles.badgeAttente}>
                      <Ionicons name="time-outline" size={14} color="#D97706" />
                      <Text style={styles.badgeText}>Demande en attente</Text>
                    </View>
                  ) : (
                    <TouchableOpacity style={styles.btn} onPress={() => openModal(l)}>
                      <Ionicons name="calendar-outline" size={16} color="white" />
                      <Text style={styles.btnText}>Reporter</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })
          )
        ) : (
          loyersReportes.length === 0 && reportsValides.length === 0? (
            <View style={styles.empty}>
              <Ionicons name="calendar-outline" size={50} color="#94A3B8" />
              <Text style={styles.emptyText}>Aucun loyer reporté</Text>
            </View>
          ) : (
            <>
              {loyersReportes.map((l, i) => (
                <View key={'lr-' + i} style={[styles.card, { borderColor: '#BFDBFE' }]}>
                  <View style={styles.cardHead}>
                    <View>
                      <Text style={styles.mois}>{l.mois} {l.annee}</Text>
                      <Text style={styles.echeance}>Échéance: {l.date_echeance} • Reporté</Text>
                    </View>
                    <Text style={[styles.etat, { backgroundColor: '#DBEAFE', color: BLEU }]}>Reporter</Text>
                  </View>
                  <View style={styles.row}>
                    <Text style={styles.label}>Numéro</Text>
                    <Text style={styles.val}>{l.numero}</Text>
                  </View>
                  <View style={styles.row}>
                    <Text style={styles.label}>Reste</Text>
                    <Text style={styles.val}>{parseInt(l.reste || 0).toLocaleString()} FCFA</Text>
                  </View>
                  <View style={styles.badgeSuccess}>
                    <Ionicons name="checkmark-circle" size={14} color={BLEU} />
                    <Text style={styles.badgeSuccessText}>Loyer reporté</Text>
                  </View>
                </View>
              ))}
              {reports.filter(r => ['Reporter', 'Reporté', 'Approuvé'].includes(r.etat_report)).map((r, i) => (
                <View key={'r-' + i} style={styles.card}>
                  <View style={styles.cardHead}>
                    <View>
                      <Text style={styles.mois}>Demande {r.report_id}</Text>
                      <Text style={styles.echeance}>Date report: {r.date_report}</Text>
                    </View>
                    <Text style={[styles.etat, { backgroundColor: '#DCFCE7', color: '#16A34A' }]}>{r.etat_report}</Text>
                  </View>
                  <View style={styles.row}>
                    <Text style={styles.label}>Loyer</Text>
                    <Text style={styles.val}>{r.loyer}</Text>
                  </View>
                  <Text style={styles.motifLabel}>Motif: {r.motif_report}</Text>
                </View>
              ))}
            </>
          )
        )}
      </ScrollView>

      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <View style={styles.overlay}>
          <Pressable style={styles.backdrop} onPress={() => setShowModal(false)} />
          <View style={styles.modal}>
            <View style={styles.handle} />
            <Text style={styles.modalTitle}>Motif du report</Text>
            <Text style={styles.modalSub}>{selected?.mois} {selected?.annee} • {selected?.numero}</Text>

            <Text style={styles.inputLabel}>Date de report souhaitée</Text>
            <TouchableOpacity style={styles.dateInput} onPress={() => setShowDatePicker(true)}>
              <Ionicons name="calendar" size={18} color={BLEU} />
              <Text style={styles.dateText}>{dateReport.toLocaleDateString('fr-FR')}</Text>
              <Ionicons name="chevron-down" size={16} color="#94A3B8" />
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={dateReport}
                mode="date"
                minimumDate={new Date()}
                display={Platform.OS === 'ios'? 'spinner' : 'default'}
                onChange={(e, d) => {
                  setShowDatePicker(Platform.OS === 'ios');
                  if (d) setDateReport(d);
                }}
              />
            )}

            <Text style={styles.inputLabel}>Motif (obligatoire)</Text>
            <TextInput
              value={motif}
              onChangeText={setMotif}
              multiline
              placeholder="Ex: Difficultés passagères..."
              placeholderTextColor="#94A3B8"
              style={styles.textarea}
            />

            <TouchableOpacity style={[styles.btnValider, sending && { opacity: 0.6 }]} onPress={sendReport} disabled={sending}>
              {sending? <ActivityIndicator color="white" /> : (
                <>
                  <Ionicons name="send" size={16} color="white" />
                  <Text style={styles.btnValiderText}>Envoyer la demande</Text>
                </>
              )}
            </TouchableOpacity>

            <Text style={styles.info}>État par défaut : En attente</Text>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingText: {
    marginTop: 10,
    color: '#64748B',
    fontWeight: '600',
  },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingTop: 50,
    paddingBottom: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
  },

  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },

  topTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },

  tabs: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 6,
    margin: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    gap: 6,
  },

  tab: {
    flex: 1,
    height: 38,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },

  tabActive: {
    backgroundColor: BLEU,
  },

  tabText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },

  tabTextActive: {
    color: 'white',
  },

  empty: {
    alignItems: 'center',
    marginTop: 60,
    gap: 10,
  },

  emptyText: {
    color: '#64748B',
    fontWeight: '600',
  },

  card: {
    backgroundColor: 'white',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 10,
  },

  cardHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },

  mois: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },

  echeance: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },

  etat: {
    fontSize: 9,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    overflow: 'hidden',
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },

  label: {
    fontSize: 11,
    color: '#94A3B8',
  },

  val: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F172A',
  },

  motifLabel: {
    fontSize: 11,
    color: '#334155',
    marginTop: 8,
  },

  badgeAttente: {
    flexDirection: 'row',
    gap: 6,
    backgroundColor: '#FFFBEB',
    padding: 8,
    borderRadius: 8,
    marginTop: 10,
    alignItems: 'center',
  },

  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#92400E',
  },

  badgeSuccess: {
    flexDirection: 'row',
    gap: 6,
    backgroundColor: '#EFF6FF',
    padding: 8,
    borderRadius: 8,
    marginTop: 10,
    alignItems: 'center',
  },

  badgeSuccessText: {
    fontSize: 10,
    fontWeight: '700',
    color: BLEU,
  },

  btn: {
    backgroundColor: BLEU,
    height: 38,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
  },

  btnText: {
    color: 'white',
    fontWeight: '800',
    fontSize: 11,
  },

  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },

  backdrop: {
   ...StyleSheet.absoluteFillObject,
  },

  modal: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    paddingBottom: 30,
  },

  handle: {
    width: 36,
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 14,
  },

  modalTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },

  modalSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
  },

  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
    marginTop: 14,
    marginBottom: 6,
  },

  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },

  dateText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },

  textarea: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    minHeight: 90,
    textAlignVertical: 'top',
    fontSize: 13,
    color: '#0F172A',
  },

  btnValider: {
    backgroundColor: BLEU,
    height: 46,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
  },

  btnValiderText: {
    color: 'white',
    fontWeight: '800',
    fontSize: 12,
  },

  info: {
    fontSize: 10,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 10,
  },

});