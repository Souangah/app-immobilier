import React, { useContext, useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
  Linking,
  Modal,
  TextInput,
  Pressable,
  Alert
} from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { GlobalContext } from "../../config/globaluser";
import { useNotifications } from "../../service/notifications";

const BLEU = '#275edd';
const fcfa = (n) => {
  const num = parseFloat(n) || 0;
  return num.toLocaleString('fr-FR');
};
const getIdLoyer = (l) => {
  if (!l) return null;
  return l.numero || l.id_loyer || l.loyer_numero || l.numero_loyer || l.id || null;
};

export default function Accueil({ navigation }) {
  const { user } = useContext(GlobalContext);
  const [data, setData] = useState(null);
  const [loyerActuel, setLoyerActuel] = useState(null);
  const [bien, setBien] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [solde, setSolde] = useState(0);
  const [showPayModal, setShowPayModal] = useState(false);
  const [montant, setMontant] = useState("");
  const [paying, setPaying] = useState(false);

  useNotifications();

  // API 1: LOCAL + MANDAT DU LOCATAIRE CONNECTÉ
  const fetchBien = async () => {
    try {
      const res = await fetch(`https://sidneyespace.net/paiement/info-bien.php?matricule=${user?.matricule}`);
      const json = await res.json();
      if (json.success) {
        setBien(json.bien);
      } else {
        console.log("Bien non trouvé:", json.message);
      }
    } catch (e) {
      console.log("Erreur bien:", e);
    }
  };

  // API 2: LOYERS
  const fetchData = async () => {
    try {
      const res = await fetch(`https://sidneyespace.net/paiement/info-loyer.php?matricule=${user?.matricule || ''}`);
      const json = await res.json();
      if (json.success) {
        const loyersNorm = (json.loyers || []).map(l => ({...l, numero: getIdLoyer(l), reste: l.reste?? l.montant_du?? l.montant?? 0, montant: l.montant?? 0 }));
        setData({...json, loyers: loyersNorm });
        const enRetard = loyersNorm.filter(l => (l.loyer_etat || '').toLowerCase().includes('retard')).sort((a, b) => new Date(a.date_echeance) - new Date(b.date_echeance));
        const partiel = loyersNorm.filter(l => (l.loyer_etat || '').toLowerCase().includes('partiel'));
        const enAttente = loyersNorm.filter(l => (l.loyer_etat || '').toLowerCase().includes('attente'));
        let actuel = null;
        if (enRetard.length > 0) actuel = enRetard[0];
        else if (partiel.length > 0) actuel = partiel[0];
        else if (enAttente.length > 0) actuel = enAttente[0];
        else actuel = json.loyer_actuel || loyersNorm[0] || null;
        if (actuel) actuel.numero = getIdLoyer(actuel);
        setLoyerActuel(actuel);
        if (json.solde!== undefined) setSolde(parseFloat(json.solde));
      }
    } catch (e) {} finally { setLoading(false); setRefreshing(false); }
  };

  const fetchSolde = async () => {
    try {
      const res = await fetch(`https://sidneyespace.net/paiement/get-solde.php?matricule=${user?.matricule}`);
      const json = await res.json();
      if (json.success && json.solde!== undefined) setSolde(parseFloat(json.solde));
    } catch (e) {}
  };

  useEffect(() => { fetchBien(); fetchData(); fetchSolde(); }, []);
  const onRefresh = useCallback(() => { setRefreshing(true); fetchBien(); fetchData(); fetchSolde(); }, []);

  const handlePayer = () => {
    if (!loyerActuel) return;
    setMontant((loyerActuel.reste || loyerActuel.montant || 0).toString());
    setShowPayModal(true);
  };

  const handleValiderPaiement = async () => {
    const montantClean = montant.replace(/\D/g, "");
    if (!montantClean || parseInt(montantClean) < 5) return Alert.alert("Erreur", "Montant minimum 5 FCFA");
    if (parseFloat(montantClean) > solde) return Alert.alert("Solde insuffisant", `Solde: ${fcfa(solde)} FCFA`);
    setPaying(true);
    try {
      const res = await fetch(`https://sidneyespace.net/paiement/paiement.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matricule: user?.matricule, id_loyer: getIdLoyer(loyerActuel), montant: montantClean })
      });
      const json = await res.json();
      if (json.success) {
        Alert.alert("Succès", `Paiement ${fcfa(montantClean)} FCFA effectué.`);
        setShowPayModal(false); fetchData(); fetchSolde();
      } else Alert.alert("Erreur", json.message);
    } catch (e) { Alert.alert("Erreur", e.message); } finally { setPaying(false); }
  };

  if (loading) return <View style={styles.loading}><ActivityIndicator size="large" color={BLEU} /></View>;

  const prochainMontant = loyerActuel?.reste || loyerActuel?.montant || 0;
  const echeance = loyerActuel?.date_echeance? new Date(loyerActuel.date_echeance).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '05 Oct. 2026';
  const periode = loyerActuel? `${loyerActuel.mois || 'Octobre'} ${loyerActuel.annee || '2026'}` : 'Octobre 2026';

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[BLEU]} />}>

        <View style={styles.twoCardsRow}>
          <LinearGradient colors={['#3B73F0', '#1F4FD8']} style={styles.soldeCard}>
            <View style={styles.rowCenter}><View style={styles.walletIcon}><Ionicons name="wallet" size={16} color={BLEU} /></View><Text style={styles.soldeLabel}>Mon solde</Text></View>
            <View style={[styles.rowCenter, { marginTop: 14 }]}><Text style={styles.soldeAmount}>{fcfa(solde)} <Text style={styles.soldeCurrency}>FCFA</Text></Text><View style={styles.aPayerBadge}><Text style={styles.aPayerText}>{loyerActuel?.loyer_etat || 'À payer'}</Text></View></View>
            <Text style={styles.soldeSub}>Loyer {periode}</Text>
            <TouchableOpacity style={styles.rechargeBtn} onPress={() => navigation.navigate('Recharge')}><View style={styles.plusIcon}><Ionicons name="add" size={14} color="white" /></View><Text style={styles.rechargeText}>Recharger mon compte</Text></TouchableOpacity>
          </LinearGradient>

          <View style={styles.loyerCard}>
            <View style={styles.rowCenter}><MaterialCommunityIcons name="calendar-plus" size={24} color={BLEU} /><Text style={styles.loyerLabel}>Prochain loyer</Text></View>
            <View style={styles.periodeBadge}><Ionicons name="time-outline" size={12} color={BLEU} /><Text style={styles.periodeText}>{periode}</Text></View>
            <Text style={styles.loyerAmount}>{fcfa(prochainMontant)} <Text style={styles.loyerCurrency}>FCFA</Text></Text>
            <Text style={styles.loyerEcheance}>Échéance : {echeance}</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
              <TouchableOpacity style={styles.voirLoyerBtnSmall} onPress={() => navigation.navigate('Loyers')}><Text style={styles.voirLoyerText}>Détails</Text></TouchableOpacity>
              <TouchableOpacity style={styles.payerBtn} onPress={handlePayer}><Ionicons name="card" size={14} color="white" /><Text style={styles.payerText}>Payer</Text></TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Actions rapides</Text><TouchableOpacity style={styles.rowCenter}><Text style={styles.toutVoir}>Tout voir </Text><Ionicons name="chevron-forward" size={14} color={BLEU} /></TouchableOpacity></View>
          <View style={styles.quickRow}>
            <TouchableOpacity style={styles.quickCard} onPress={() => Linking.openURL('https://groupesidney.com/immobilier/accueil')}><View style={[styles.quickIcon, { backgroundColor: '#E6F0FF' }]}><Ionicons name="search" size={22} color={BLEU} /></View><Text style={styles.quickLabel}>Rechercher{'\n'}un bien</Text></TouchableOpacity>
            <TouchableOpacity style={styles.quickCard} onPress={() => navigation.navigate('Reclamation')}><View style={[styles.quickIcon, { backgroundColor: '#FFEDD5' }]}><Ionicons name="build" size={22} color="#F97316" /></View><Text style={styles.quickLabel}>Nouvelle{'\n'}réclamation</Text></TouchableOpacity>
            <TouchableOpacity style={styles.quickCard} onPress={() => navigation.navigate('Documents')}><View style={[styles.quickIcon, { backgroundColor: '#DCFCE7' }]}><Ionicons name="document-text" size={22} color="#16A34A" /></View><Text style={styles.quickLabel}>Mes documents</Text></TouchableOpacity>
            <TouchableOpacity style={styles.quickCard} onPress={handlePayer}><View style={[styles.quickIcon, { backgroundColor: '#F3E8FF' }]}><Ionicons name="card" size={22} color="#9333EA" /></View><Text style={styles.quickLabel}>Effectuer un{'\n'}paiement</Text></TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity activeOpacity={0.9} style={styles.actuCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="megaphone" size={34} color={BLEU} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.actuTitle}>Actualités</Text>
              <Text style={styles.actuSub}>Nouveau service disponible</Text>
              <Text style={styles.actuDesc}>Consultez les informations sur la gestion de votre résidence.</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={BLEU} />
          </View>
        </TouchableOpacity>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mes informations</Text>
          <View style={styles.infoRow}>
            <View style={styles.infoCard}><View style={[styles.infoIcon, { backgroundColor: '#DCFCE7' }]}><Ionicons name="home" size={19} color="#16A34A" /></View><Text style={styles.infoLabel}>Mon logement</Text><Text style={styles.infoValue}>{bien?.intitule_local?.split(' ').pop() || 'A12'}</Text></View>
            <View style={styles.infoCard}><View style={[styles.infoIcon, { backgroundColor: '#DBEAFE' }]}><Ionicons name="wallet" size={19} color={BLEU} /></View><Text style={styles.infoLabel}>Mon solde</Text><Text style={styles.infoValue}>{fcfa(solde)} FCFA</Text></View>
            <View style={styles.infoCard}><View style={[styles.infoIcon, { backgroundColor: '#EDE9FE' }]}><Ionicons name="document-text" size={19} color="#7C3AED" /></View><Text style={styles.infoLabel}>Mes documents</Text><Text style={styles.infoValue}>12 fichiers</Text></View>
            <View style={styles.infoCard}><View style={[styles.infoIcon, { backgroundColor: '#FEE2E2' }]}><Ionicons name="alert-circle" size={19} color="#EF4444" /></View><Text style={styles.infoLabel}>Mes réclamations</Text><Text style={[styles.infoValue, { color: '#EF4444' }]}>2 en cours</Text></View>
          </View>
        </View>

        <View style={styles.banner}>
          <Image source={{ uri: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=300' }} style={styles.bannerImg} />
          <View style={{ flex: 1, paddingHorizontal: 14 }}>
            <Text style={styles.bannerTitle}>Votre confort, notre priorité</Text>
            <Text style={styles.bannerSub}>Groupe Sidney, plus proche de vous au quotidien.</Text>
          </View>
        </View>
      </ScrollView>

      <Modal visible={showPayModal} transparent animationType="slide" onRequestClose={() => setShowPayModal(false)}>
        <View style={styles.modalOverlay}><Pressable style={styles.backdrop} onPress={() => setShowPayModal(false)} />
          <View style={styles.modalContent}>
            <View style={styles.handle} />
            <View style={styles.modalHeader}><Text style={styles.modalTitle}>Payer loyer {periode}</Text><TouchableOpacity onPress={() => setShowPayModal(false)} style={styles.closeBtn}><Ionicons name="close" size={18} color="#64748B" /></TouchableOpacity></View>
            {loyerActuel && (<><View style={styles.modalInfo}><Text style={styles.modalMois}>{bien?.intitule_local} - {periode}</Text><Text style={styles.modalReste}>Reste: {fcfa(loyerActuel.reste || 0)} FCFA</Text><Text style={styles.modalSolde}>Solde: {fcfa(solde)} FCFA</Text></View><Text style={styles.labelInput}>Montant à payer</Text><View style={styles.inputBox}><TextInput value={montant} onChangeText={setMontant} keyboardType="numeric" style={styles.input} placeholder="Ex: 50000" /><Text style={styles.devise}>FCFA</Text></View><TouchableOpacity style={[styles.btnValider, paying && { opacity: 0.6 }]} onPress={handleValiderPaiement} disabled={paying}>{paying? <ActivityIndicator color="white" /> : <Text style={styles.btnValiderText}>Valider le paiement</Text>}</TouchableOpacity></>)}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F8FC' },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F6F8FC' },
  rowCenter: { flexDirection: 'row', alignItems: 'center' },
  twoCardsRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginTop: 10 },
  soldeCard: { flex: 1, borderRadius: 16, padding: 12, elevation: 4 },
  walletIcon: { width: 26, height: 26, borderRadius: 8, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  soldeLabel: { color: 'white', fontSize: 12.5, fontWeight: '600' },
  soldeAmount: { color: 'white', fontSize: 18, fontWeight: '900' },
  soldeCurrency: { fontSize: 10.5, fontWeight: '800' },
  aPayerBadge: { backgroundColor: '#FFD7D7', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 8, marginLeft: 5 },
  aPayerText: { fontSize: 9, fontWeight: '700', color: '#E11D48' },
  soldeSub: { color: 'rgba(255,255,255,0.92)', fontSize: 11.5, marginTop: 6 },
  rechargeBtn: { backgroundColor: 'white', borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 10, height: 38 },
  plusIcon: { width: 18, height: 18, borderRadius: 9, backgroundColor: BLEU, justifyContent: 'center', alignItems: 'center' },
  rechargeText: { color: BLEU, fontSize: 10.5, fontWeight: '700' },
  loyerCard: { flex: 1, backgroundColor: 'white', borderRadius: 16, padding: 12, elevation: 3 },
  loyerLabel: { color: '#1E293B', fontSize: 12.5, fontWeight: '600', marginLeft: 6 },
  periodeBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#EFF6FF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start', marginTop: 8 },
  periodeText: { fontSize: 10, fontWeight: '700', color: BLEU },
  loyerAmount: { fontSize: 19, fontWeight: '900', color: '#0F172A', marginTop: 10 },
  loyerCurrency: { fontSize: 11, fontWeight: '800' },
  loyerEcheance: { fontSize: 11.5, color: '#334155', marginTop: 6 },
  voirLoyerBtnSmall: { flex: 1, backgroundColor: '#EAF1FF', borderRadius: 10, justifyContent: 'center', alignItems: 'center', height: 36 },
  payerBtn: { flex: 1.2, backgroundColor: BLEU, borderRadius: 10, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 4, height: 36 },
  payerText: { color: 'white', fontSize: 11, fontWeight: '800' },
  voirLoyerText: { color: BLEU, fontSize: 11, fontWeight: '700' },
  section: { paddingHorizontal: 16, marginTop: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: '#0F172A' },
  toutVoir: { fontSize: 12.5, color: BLEU, fontWeight: '600' },
  quickRow: { flexDirection: 'row', gap: 8 },
  quickCard: { flex: 1, backgroundColor: 'white', borderRadius: 14, paddingVertical: 10, paddingHorizontal: 4, alignItems: 'center', elevation: 2 },
  quickIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: 7 },
  quickLabel: { fontSize: 10, fontWeight: '600', color: '#0F172A', textAlign: 'center', lineHeight: 13 },
  actuCard: { backgroundColor: '#E8F0FF', marginHorizontal: 16, marginTop: 16, borderRadius: 14, padding: 12 },
  actuTitle: { fontSize: 14, fontWeight: '800', color: '#0F172A' },
  actuSub: { fontSize: 12.5, fontWeight: '600', color: '#1E293B', marginTop: 2 },
  actuDesc: { fontSize: 10.5, color: '#64748B', marginTop: 3, lineHeight: 15 },
  infoRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  infoCard: { flex: 1, backgroundColor: 'white', borderRadius: 14, paddingVertical: 9, paddingHorizontal: 4, alignItems: 'center', elevation: 2 },
  infoIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  infoLabel: { fontSize: 9, color: '#334155', fontWeight: '500', textAlign: 'center' },
  infoValue: { fontSize: 10.5, fontWeight: '600', color: '#0F172A', marginTop: 4, textAlign: 'center' },
  banner: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginTop: 16, marginBottom: 12, backgroundColor: '#E6F2FF', borderRadius: 16, overflow: 'hidden', height: 78 },
  bannerImg: { width: 92, height: '100%' },
  bannerTitle: { fontSize: 12.5, fontWeight: '800', color: '#0F172A' },
  bannerSub: { fontSize: 10.5, color: BLEU, marginTop: 3, lineHeight: 15 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  backdrop: {...StyleSheet.absoluteFillObject },
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 30 },
  handle: { width: 40, height: 4, backgroundColor: '#E2E8F0', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
  modalInfo: { backgroundColor: '#F8FAFC', borderRadius: 12, padding: 12, marginTop: 14 },
  modalMois: { fontSize: 13, fontWeight: '800', color: '#0F172A' },
  modalReste: { fontSize: 12, color: '#EF4444', fontWeight: '700', marginTop: 4 },
  modalSolde: { fontSize: 12, color: '#22C55E', fontWeight: '700', marginTop: 2 },
  labelInput: { fontSize: 12, fontWeight: '700', color: '#334155', marginTop: 16, marginBottom: 6 },
  inputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 14, height: 54 },
  input: { flex: 1, fontSize: 20, fontWeight: '900', color: '#0F172A' },
  devise: { fontSize: 12, fontWeight: '800', color: '#94A3B8' },
  btnValider: { backgroundColor: BLEU, height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 18 },
  btnValiderText: { color: 'white', fontWeight: '800', fontSize: 14 }
});