import React, { useContext, useEffect, useState, useCallback } from "react";
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  ActivityIndicator, RefreshControl, StatusBar, Modal, 
  TextInput, Pressable, Alert, Linking 
} from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { GlobalContext } from "../config/globaluser";
import { useNotifications } from "../service/notifications";

const BLEU = '#275edd';

const getIdLoyer = (l) => {
  if (!l) return null;
  return l.numero || l.id_loyer || l.loyer_numero || l.numero_loyer || l.id || l.numero_loyer_id || null;
}

export default function Accueil({ navigation }) {

  const { user } = useContext(GlobalContext);
  const [data, setData] = useState(null);
  const [loyerActuel, setLoyerActuel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [solde, setSolde] = useState(0);
  const [showPayModal, setShowPayModal] = useState(false);
  const [montant, setMontant] = useState("");
  const [paying, setPaying] = useState(false);

  useNotifications();

  // ------------------ FETCH ------------------

  const fetchData = async () => {
    try {
      const matricule = user?.matricule || '';
      const reponse = await fetch(`https://sidneyespace.net/paiement/info-loyer.php?matricule=${matricule}`);
      const json = await reponse.json();

      if (json.success) {
        const loyersNorm = (json.loyers || []).map(l => ({
          ...l,
          numero: getIdLoyer(l),
          reste: l.reste ?? l.montant_du ?? 0,
          montant: l.montant ?? 0
        }));

        if (json.loyer_actuel) {
          json.loyer_actuel.numero = getIdLoyer(json.loyer_actuel);
        }

        setData({ ...json, loyers: loyersNorm });

        const enRetard  = loyersNorm.filter(l => (l.loyer_etat||'').toLowerCase().includes('retard')).sort((a,b) => new Date(a.date_echeance) - new Date(b.date_echeance));
        const partiel   = loyersNorm.filter(l => (l.loyer_etat||'').toLowerCase().includes('partiel')).sort((a,b) => new Date(a.date_echeance) - new Date(b.date_echeance));
        const enAttente = loyersNorm.filter(l => (l.loyer_etat||'').toLowerCase().includes('attente')).sort((a,b) => new Date(a.date_echeance) - new Date(b.date_echeance));

        let actuel = null;
        if (enRetard.length > 0) actuel = enRetard[0];
        else if (partiel.length > 0) actuel = partiel[0];
        else if (enAttente.length > 0) {
          const moisActuel   = new Date().getMonth() + 1;
          const anneeActuelle = new Date().getFullYear();
          actuel = enAttente.find(l => parseInt(l.code_mois) === moisActuel && parseInt(l.annee) === anneeActuelle) || enAttente[0];
        } else {
          actuel = json.loyer_actuel || loyersNorm[0];
        }

        if (actuel) actuel.numero = getIdLoyer(actuel);
        setLoyerActuel(actuel);

        if (json.solde !== undefined) setSolde(parseFloat(json.solde));
      }
    } catch (e) {
      console.log('Erreur accueil:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchSolde = async () => {
    try {
      const res = await fetch(`https://sidneyespace.net/paiement/get-solde.php?matricule=${user?.matricule}`);
      const json = await res.json();
      if (json.success) setSolde(parseFloat(json.solde));
    } catch(e) {}
  };

  useEffect(() => {
    fetchData();
    fetchSolde();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
    fetchSolde();
  }, []);

  // ------------------ HELPERS ------------------

  const getEtatStyle = (etat) => {
    const e = (etat || '').toLowerCase();
    if (e.includes('payer') || e.includes('payé') || e.includes('paye')) return { bg: '#22C55E', icon: 'checkmark-circle', label: 'Payé' };
    if (e.includes('retard'))  return { bg: '#EF4444', icon: 'alert-circle', label: 'En retard' };
    if (e.includes('partiel')) return { bg: '#F59E0B', icon: 'pie-chart', label: 'Partiel' };
    return { bg: '#94A3B8', icon: 'time-outline', label: 'En attente' };
  };

  const handlePayer = () => {
    if (!loyerActuel) return;
    const reste = parseInt(loyerActuel.reste || loyerActuel.montant) || 0;
    setMontant(reste.toString());
    setShowPayModal(true);
  };

  const handleValiderPaiement = async () => {
    const montantClean = montant.replace(/\D/g,"");
    if (!montantClean || parseInt(montantClean) < 5) {
      Alert.alert("Erreur","Montant minimum 5 FCFA");
      return;
    }
    if (parseFloat(montantClean) > solde) {
      Alert.alert("Solde insuffisant", `Votre solde est de ${solde.toLocaleString()} FCFA.`, [
        { text:"Recharger", onPress:()=> { setShowPayModal(false); navigation.navigate('Recharge'); }},
        { text:"OK", style:"cancel" }
      ]);
      return;
    }

    setPaying(true);
    try {
      const res = await fetch(`https://sidneyespace.net/paiement/paiement.php`,{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          matricule: user?.matricule,
          id_loyer: getIdLoyer(loyerActuel),
          montant: montantClean
        })
      });
      const json = await res.json();
      if (json.success) {
        Alert.alert("Succès", `Paiement de ${parseInt(montantClean).toLocaleString()} FCFA effectué.\nNouveau solde: ${parseFloat(json.nouveau_solde).toLocaleString()} FCFA`);
        setShowPayModal(false);
        setMontant("");
        fetchData();
        fetchSolde();
      } else {
        Alert.alert("Erreur", json.message || "Paiement échoué");
      }
    } catch(e) {
      Alert.alert("Erreur", e.message);
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={BLEU} />
        <Text style={styles.loadingText}>Chargement de votre logement...</Text>
      </View>
    );
  }

  const bien = data?.bien_actuel;
  const etatActuel = getEtatStyle(loyerActuel?.loyer_etat);

  // ------------------ RENDER ------------------

  return (
    <View style={styles.container}>

      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 110 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[BLEU]} />}
      >

        {/* ACCES RAPIDE */}
        <View style={styles.quickAccessContainer}>
          <Text style={styles.quickTitle}>Accès rapide</Text>
          <View style={styles.quickRowTop}>

            <TouchableOpacity style={styles.quickItem} onPress={()=>navigation.navigate('Recharge')}>
              <View style={[styles.quickIcon, {backgroundColor:'#EFF6FF'}]}>
                <Ionicons name="wallet" size={18} color={BLEU} />
              </View>
              <Text style={styles.quickLabel}>Recharger</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickItem} onPress={() => Linking.openURL('https://groupesidney.com/immobilier/accueil')}>
              <View style={[styles.quickIcon, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="search" size={18} color="#D97706" />
              </View>
              <Text style={styles.quickLabel}>Rechercher{"\n"}un bien</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickItem} onPress={()=>navigation.navigate('Depart')}>
              <View style={[styles.quickIcon, {backgroundColor:'#FEE2E2'}]}>
                <Ionicons name="exit-outline" size={18} color="#EF4444" />
              </View>
              <Text style={styles.quickLabel}>Signaler{"\n"}un départ</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickItem} onPress={()=>navigation.navigate('Reclamation')}>
              <View style={[styles.quickIcon, {backgroundColor:'#DCFCE7'}]}>
                <Ionicons name="chatbubble-ellipses" size={18} color="#16A34A" />
              </View>
              <Text style={styles.quickLabel}>Réclamation</Text>
            </TouchableOpacity>

          </View>
        </View>

        {/* CARTE LOYER */}
        <View style={[styles.mainCard, { backgroundColor: loyerActuel ? (etatActuel.bg === '#22C55E' ? BLEU : etatActuel.bg) : BLEU }]}>

          <View style={styles.mainCardTop}>
            <View style={{flex:1}}>
              <Text style={styles.mainLabel}>
                {etatActuel.label === 'En retard' ? 'Loyer en retard - Prioritaire' : 
                 etatActuel.label === 'Partiel' ? 'Paiement partiel' : 'Loyer en cours'}
              </Text>
              <Text style={styles.mainAmount}>
                {loyerActuel?.montant? `${parseInt(loyerActuel.montant).toLocaleString('fr-FR')}` : '0'} 
                <Text style={styles.currency}> FCFA</Text>
              </Text>

              <View style={{gap: 5, marginTop: 6}}>
                <View style={styles.statusBadge}>
                  <Ionicons name={etatActuel.icon} size={11} color="white" />
                  <Text style={styles.statusText}>{loyerActuel?.mois} {loyerActuel?.annee} • {etatActuel.label}</Text>
                </View>
                <View style={[styles.statusBadge, {backgroundColor: 'rgba(0,0,0,0.15)'}]}>
                  <Ionicons name="calendar-outline" size={11} color="white" />
                  <Text style={styles.statusText}>Échéance: {loyerActuel?.date_echeance || '-'}</Text>
                </View>
              </View>
            </View>

            <View style={styles.mainIcon}>
              <Ionicons name={etatActuel.icon} size={20} color="white" />
            </View>
          </View>

          {(loyerActuel?.reste || 0) > 0 && (
            <View style={styles.alertBox}>
              <Ionicons name="warning" size={13} color="#D97706" />
              <Text style={styles.alertText}>Reste à payer: {parseInt(loyerActuel?.reste || 0).toLocaleString()} FCFA</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.payBtn, etatActuel.label === 'Payé' && { opacity: 0.6 }]}
            onPress={handlePayer}
            disabled={etatActuel.label === 'Payé'}
          >
            <Text style={styles.payBtnText}>
              {etatActuel.label === 'Payé'? 'Loyer soldé ✓' : etatActuel.label === 'Partiel'? 'Compléter le paiement' : etatActuel.label === 'En retard'? 'Régulariser maintenant' : 'Payer mon loyer'}
            </Text>
            <Ionicons name={etatActuel.label === 'Payé'? "checkmark" : "wallet"} size={15} color={etatActuel.label === 'Payé'? '#22C55E' : BLEU} />
          </TouchableOpacity>

        </View>

        {/* MON BIEN */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mon logement</Text>
          <View style={styles.infoCard}>

            <View style={styles.infoRow}>
              <View style={[styles.infoIcon, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="business" size={15} color={BLEU} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.infoLabel}>Intitulé du local</Text>
                <Text style={styles.infoValue}>{bien?.intitule_local || 'Non défini'}</Text>
              </View>
            </View>

            <View style={styles.separator} />

            <View style={styles.infoRow}>
              <View style={[styles.infoIcon, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="location" size={15} color="#D97706" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.infoLabel}>Adresse du mandat</Text>
                <Text style={styles.infoValue}>{bien?.adresse_complete || 'Adresse non disponible'}</Text>
                <Text style={styles.infoSub}>{bien?.quartier} • {bien?.ville} • {bien?.mandat_intitule}</Text>
              </View>
            </View>

          </View>
        </View>

      </ScrollView>

      {/* MODAL PAIEMENT */}
      <Modal visible={showPayModal} transparent animationType="slide" onRequestClose={()=>setShowPayModal(false)}>
        <View style={styles.modalOverlay}>
          <Pressable style={styles.backdrop} onPress={()=>setShowPayModal(false)} />
          <View style={styles.modalContent}>

            <View style={styles.handle} />

            <View style={{flexDirection:'row', justifyContent:'space-between', alignItems:'center'}}>
              <Text style={styles.modalTitle}>Payer loyer</Text>
              <TouchableOpacity onPress={()=>setShowPayModal(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            {loyerActuel && (
              <>
                <View style={styles.modalInfo}>
                  <Text style={styles.modalMois}>{loyerActuel.mois} {loyerActuel.annee} - {loyerActuel.local_intitule}</Text>
                  <Text style={styles.modalReste}>Reste à payer: {parseInt(loyerActuel.reste||0).toLocaleString()} FCFA</Text>
                  <Text style={styles.modalSolde}>Solde disponible: {solde.toLocaleString()} FCFA</Text>
                </View>

                <Text style={styles.labelInput}>Montant à payer (FCFA)</Text>

                <View style={styles.inputBox}>
                  <TextInput value={montant} onChangeText={setMontant} keyboardType="numeric" style={styles.input} placeholder="Ex: 50000" placeholderTextColor="#94A3B8" />
                  <Text style={styles.devise}>FCFA</Text>
                </View>

                <View style={styles.quickRow}>
                  {["5000","10000","20000", (loyerActuel.reste||"").toString()].filter(Boolean).map(q=>(
                    <TouchableOpacity key={q} style={[styles.quickBtn, montant===q && {backgroundColor:BLEU}]} onPress={()=>setMontant(q)}>
                      <Text style={[styles.quickText, montant===q && {color:'white'}]}>{q===(loyerActuel.reste||"").toString()? "Total" : q}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity style={[styles.btnValider, paying && {opacity:0.6}]} onPress={handleValiderPaiement} disabled={paying}>
                  {paying? <ActivityIndicator color="white" /> : (
                    <>
                      <Ionicons name="checkmark-circle" size={18} color="white" />
                      <Text style={styles.btnValiderText}>Valider le paiement</Text>
                    </>
                  )}
                </TouchableOpacity>

                {parseFloat(montant.replace(/\D/g,"")) > solde && (
                  <View style={styles.alertSolde}>
                    <Ionicons name="warning" size={14} color="#DC2626" />
                    <Text style={styles.alertText2}>Solde insuffisant, rechargez votre compte</Text>
                  </View>
                )}
              </>
            )}

          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({

  // GLOBAL
  container: { 
    flex: 1, 
    backgroundColor: '#F8FAFC' 
  },
  loading: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#F8FAFC' 
  },
  loadingText: { 
    marginTop: 12, 
    color: '#64748B', 
    fontWeight: '600' 
  },

  // QUICK ACCESS
  quickAccessContainer:{ 
    backgroundColor:'white', 
    margin:14, 
    marginBottom:0, 
    borderRadius:14, 
    padding:12, 
    borderWidth:1, 
    borderColor:'#F1F5F9' 
  },
  quickTitle:{ 
    fontSize:11, 
    fontWeight:'800', 
    color:'#0F172A', 
    marginBottom:10 
  },
  quickRowTop:{ 
    flexDirection:'row', 
    justifyContent:'space-between', 
    alignItems:'flex-start' 
  },
  quickItem:{ 
    alignItems:'center', 
    width:'23%' 
  },
  quickIcon:{ 
    width:42, 
    height:42, 
    borderRadius:12, 
    justifyContent:'center', 
    alignItems:'center', 
    marginBottom:6 
  },
  quickLabel:{ 
    fontSize:9, 
    fontWeight:'700', 
    color:'#334155', 
    textAlign:'center', 
    lineHeight:11 
  },

  // MAIN CARD
  mainCard: { 
    margin: 14, 
    borderRadius: 18, 
    padding: 14, 
    elevation: 6 
  },
  mainCardTop: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start' 
  },
  mainLabel: { 
    color: 'rgba(255,255,255,0.8)', 
    fontSize: 10, 
    fontWeight: '600' 
  },
  mainAmount: { 
    color: 'white', 
    fontSize: 22, 
    fontWeight: '900', 
    marginTop: 4 
  },
  currency: { 
    fontSize: 12, 
    fontWeight: '600', 
    opacity: 0.8 
  },
  statusBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'rgba(255,255,255,0.22)', 
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: 20, 
    gap: 5, 
    alignSelf: 'flex-start' 
  },
  statusText: { 
    color: 'white', 
    fontSize: 10, 
    fontWeight: '800' 
  },
  mainIcon: { 
    width: 38, 
    height: 38, 
    borderRadius: 10, 
    backgroundColor: 'rgba(255,255,255,0.2)', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  alertBox: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 5, 
    backgroundColor: 'white', 
    padding: 8, 
    borderRadius: 10, 
    marginTop: 10 
  },
  alertText: { 
    color: '#92400E', 
    fontSize: 10, 
    fontWeight: '700', 
    flex: 1 
  },
  payBtn: { 
    backgroundColor: 'white', 
    height: 40, 
    borderRadius: 10, 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center', 
    gap: 6, 
    marginTop: 12 
  },
  payBtnText: { 
    color: BLEU, 
    fontWeight: '800', 
    fontSize: 12 
  },

  // BIEN
  section: { 
    paddingHorizontal: 14, 
    marginTop: 12 
  },
  sectionTitle: { 
    fontSize: 12, 
    fontWeight: '800', 
    color: '#0F172A' 
  },
  infoCard: { 
    backgroundColor: 'white', 
    borderRadius: 14, 
    padding: 12, 
    borderWidth: 1, 
    borderColor: '#F1F5F9', 
    marginTop:8 
  },
  infoRow: { 
    flexDirection: 'row', 
    alignItems: 'flex-start', 
    gap: 10 
  },
  infoIcon: { 
    width: 30, 
    height: 30, 
    borderRadius: 8, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginTop: 1 
  },
  infoLabel: { 
    fontSize: 9, 
    color: '#94A3B8', 
    fontWeight: '700', 
    textTransform: 'uppercase' 
  },
  infoValue: { 
    fontSize: 12, 
    color: '#0F172A', 
    fontWeight: '700', 
    marginTop: 2, 
    lineHeight: 16 
  },
  infoSub: { 
    fontSize: 10, 
    color: '#64748B', 
    marginTop: 3 
  },
  separator: { 
    height: 1, 
    backgroundColor: '#F1F5F9', 
    marginVertical: 10 
  },

  // MODAL
  modalOverlay:{
    flex:1, 
    justifyContent:'flex-end', 
    backgroundColor:'rgba(0,0,0,0.4)'
  },
  backdrop:{
    ...StyleSheet.absoluteFillObject
  },
  modalContent:{
    backgroundColor:'white', 
    borderTopLeftRadius:24, 
    borderTopRightRadius:24, 
    padding:20, 
    paddingBottom:30
  },
  handle:{
    width:40, 
    height:4, 
    backgroundColor:'#E2E8F0', 
    borderRadius:2, 
    alignSelf:'center', 
    marginBottom:16
  },
  modalTitle:{
    fontSize:16, 
    fontWeight:'800', 
    color:'#0F172A'
  },
  closeBtn:{
    width:32, 
    height:32, 
    borderRadius:16, 
    backgroundColor:'#F1F5F9', 
    justifyContent:'center', 
    alignItems:'center'
  },
  modalInfo:{
    backgroundColor:'#F8FAFC', 
    borderRadius:12, 
    padding:12, 
    marginTop:14
  },
  modalMois:{
    fontSize:13, 
    fontWeight:'800', 
    color:'#0F172A'
  },
  modalReste:{
    fontSize:12, 
    color:'#EF4444', 
    fontWeight:'700', 
    marginTop:4
  },
  modalSolde:{
    fontSize:12, 
    color:'#22C55E', 
    fontWeight:'700', 
    marginTop:2
  },
  labelInput:{
    fontSize:12, 
    fontWeight:'700', 
    color:'#334155', 
    marginTop:16, 
    marginBottom:6
  },
  inputBox:{
    flexDirection:'row', 
    alignItems:'center', 
    backgroundColor:'#F8FAFC', 
    borderRadius:12, 
    borderWidth:1, 
    borderColor:'#E2E8F0', 
    paddingHorizontal:14, 
    height:54
  },
  input:{
    flex:1, 
    fontSize:20, 
    fontWeight:'900', 
    color:'#0F172A'
  },
  devise:{
    fontSize:12, 
    fontWeight:'800', 
    color:'#94A3B8'
  },
  quickRow:{
    flexDirection:'row', 
    gap:8, 
    marginTop:12
  },
  quickBtn:{
    backgroundColor:'#F1F5F9', 
    paddingHorizontal:12, 
    paddingVertical:6, 
    borderRadius:8
  },
  quickText:{
    fontSize:12, 
    fontWeight:'700', 
    color:'#334155'
  },
  btnValider:{
    backgroundColor:BLEU, 
    height:50, 
    borderRadius:12, 
    flexDirection:'row', 
    justifyContent:'center', 
    alignItems:'center', 
    gap:8, 
    marginTop:18
  },
  btnValiderText:{
    color:'white', 
    fontWeight:'800', 
    fontSize:14
  },
  alertSolde:{
    flexDirection:'row', 
    gap:6, 
    backgroundColor:'#FEF2F2', 
    padding:10, 
    borderRadius:10, 
    marginTop:12, 
    alignItems:'center'
  },
  alertText2:{
    fontSize:11, 
    color:'#DC2626', 
    fontWeight:'600'
  }

});